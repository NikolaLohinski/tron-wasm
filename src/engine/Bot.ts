import BotWorker from 'worker-loader!@/worker/glue.worker';
import {
    IWorker,
    MESSAGE_TYPE,
    NATIVE_WORKER_MESSAGE_TYPE,
    WBootMessage,
    WEvent,
    WMessage,
    WRequestMessage,
} from '@/worker/types';
import {Grid, MOVE, PLAYER_TYPE, Position, UUID} from '@/common/types';
import {generateUUID} from '@/common/utils';

export const BOOT_TIMEOUT_MS = 1000;

export interface IBot {
    boot(correlationID: UUID): Promise<void>;
}

export default class Bot implements IBot {
    private worker: IWorker;

    private bootResolver?: () => void;
    private actFunction?: (correlationID: UUID, move: MOVE) => void;
    private readonly id: UUID;
    private workerID: UUID = '';
    private readonly playerType: PLAYER_TYPE;
    private bootTimeout: number;

    constructor(id: UUID, playerType: PLAYER_TYPE) {
        this.id = id;
        this.worker = new (BotWorker as any)();
        this.bootTimeout = -1;
        this.playerType = playerType;
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
            };

            this.worker.postMessage(bootMessage);

            this.bootTimeout = setTimeout(() => {
                throw Error(`boot timeout after ${BOOT_TIMEOUT_MS} ms`);
            }, BOOT_TIMEOUT_MS);
        });
    }

    public play(correlationID: UUID, position: Position, grid: Grid, decide: (id: UUID, move: MOVE) => void): void {
        this.actFunction = decide;

        const requestMessage: WRequestMessage = {
            correlationID,
            workerID: this.workerID,
            type: MESSAGE_TYPE.REQUEST,
            content: {
                position,
                grid,
            },
        };

        this.worker.postMessage(requestMessage);
    }

    private handleWEvent(event: WEvent): void {
        const message: WMessage = event.data;

        if (!this.bootResolver) {
            throw Error('can not handle events on not booted worker');
        }

        switch (message.type) {
            case MESSAGE_TYPE.RESULT:
                if (message.origin === MESSAGE_TYPE.BOOT) {
                    // tslint:disable-next-line
                    console.log('[MAIN]: boot result received', message);
                    (this.bootResolver as any)();
                }
                if (message.origin === MESSAGE_TYPE.REQUEST) {
                    // tslint:disable-next-line
                    console.log('[MAIN]: request result received', message);
                    (this.actFunction as any)(message.correlationID, message.content);
                }
                break;
            case MESSAGE_TYPE.ERROR:
                // tslint:disable-next-line
                console.error('[MAIN]: received error from worker', message);
                throw Error(`worker "${message.workerID}" error`);
            default:
                // tslint:disable-next-line
                console.error('[MAIN]: unhandled message type', message);
                throw TypeError(`unhandled message type "${message.type}"`);
        }
    }

    private handleFatalWError(event: WEvent): void {
        // tslint:disable-next-line
        console.error('[MAIN]: fatal worker error', event);
        this.worker.terminate();
        throw Error('fatal worker error');
    }
}
