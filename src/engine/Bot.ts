import BotWorker from 'worker-loader!@/worker/glue.worker';
import {
    IWorker,
    MESSAGE_TYPE,
    NATIVE_WORKER_MESSAGE_TYPE,
    WBootMessage,
    WEvent,
    WMessage,
    WRequestMessage,
    WResultMessage,
} from '@/worker/types';
import {Grid, MOVE, PLAYER_TYPE, Position, UUID} from '@/common/types';
import {generateUUID} from '@/common/utils';

export const BOOT_TIMEOUT_MS = 1000;

export interface IBot {
    boot(correlationID: UUID): Promise<void>;
    isIdle(): boolean;
    requestAction(corr: UUID, position: Position, grid: Grid, act: (id: UUID, move: MOVE) => void): void;
    destroy(): void;
}

export default class Bot implements IBot {
    private worker: IWorker;

    private bootResolver?: () => void;
    private actFunction?: (correlationID: UUID, move: MOVE) => void;
    private readonly id: UUID;
    private workerID: UUID = '';
    private readonly playerType: PLAYER_TYPE;
    private readonly depth?: number;
    private bootTimeout: number;
    private idle: boolean;

    constructor(id: UUID, playerType: PLAYER_TYPE, depth?: number) {
        this.id = id;
        this.worker = new (BotWorker as any)();
        this.bootTimeout = -1;
        this.playerType = playerType;
        this.depth = depth;
        this.idle = false;
    }

    public boot(correlationID: UUID): Promise<void> {
        this.worker.terminate();
        return new Promise((resolveBoot) => {
            this.worker = new (BotWorker as any)();

            this.worker.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.MESSAGE, this.handleWEvent.bind(this));
            this.worker.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.ERROR, this.handleFatalWError.bind(this));

            this.bootResolver = () => {
                clearTimeout(this.bootTimeout);
                resolveBoot();
                this.bootResolver = undefined;
            };

            this.workerID = generateUUID();

            const bootMessage: WBootMessage = {
                workerID: this.workerID,
                correlationID,
                type: MESSAGE_TYPE.BOOT,
                playerType: this.playerType,
                depth: this.depth,
            };

            this.worker.postMessage(bootMessage);

            this.bootTimeout = setTimeout(() => {
                throw Error(`boot timeout after ${BOOT_TIMEOUT_MS} ms`);
            }, BOOT_TIMEOUT_MS);
        });
    }

    public isIdle(): boolean {
        return this.idle;
    }

    public requestAction(corr: UUID, position: Position, grid: Grid, act: (id: UUID, move: MOVE) => void): void {
        if (!this.idle) {
            throw Error('can not request action of bot that is not idle');
        }

        this.actFunction = act;

        const requestMessage: WRequestMessage = {
            correlationID: corr,
            workerID: this.workerID,
            type: MESSAGE_TYPE.REQUEST,
            content: {
                position,
                grid,
            },
        };

        this.worker.postMessage(requestMessage);
        this.idle = false;
    }

    public destroy(): void {
        this.worker.terminate();
        this.idle = false;
    }

    private handleWEvent(event: WEvent): void {
        const message: WMessage = event.data;

        switch (message.type) {
            case MESSAGE_TYPE.IDLE:
                // tslint:disable-next-line
                // console.log(`[BOT]: worker ${this.workerID} is idle`);
                if (message.origin === MESSAGE_TYPE.BOOT) {
                    if (!this.bootResolver) {
                        throw Error('can not handle events on not booted worker');
                    }
                    (this.bootResolver as any)();
                }
                this.idle = true;
                break;
            case MESSAGE_TYPE.RESULT:
                const resultMessage = message as WResultMessage;
                // tslint:disable-next-line
                // console.log(`[BOT]: worker ${this.workerID} moved`, message.content);
                (this.actFunction as any)(message.correlationID, resultMessage.content);
                break;
            case MESSAGE_TYPE.ERROR:
                // tslint:disable-next-line
                console.error(`[BOT]: worker ${this.workerID} responded with an error`, message.error);
                throw Error(`worker "${message.workerID}" error`);
            default:
                // tslint:disable-next-line
                console.error(`[BOT]: worker ${this.workerID} can not handled message of type`, message.type);
                throw TypeError(`unhandled message type "${message.type}"`);
        }
    }

    private handleFatalWError(event: WEvent): void {
        // tslint:disable-next-line
        console.error('[MAIN]: fatal worker error', event);
        this.destroy();
        throw Error('fatal worker error');
    }
}
