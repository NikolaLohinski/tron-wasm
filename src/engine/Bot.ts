import BotWorker from 'worker-loader!@/worker/glue.worker';
import {IWorker, MESSAGE_TYPE, WBootMessage, WEvent, WMessage, NATIVE_WORKER_MESSAGE_TYPE} from '@/worker/types';
import {UUID} from '@/common/types';

export const BOOT_TIMEOUT_MS = 1000;

export interface IBot {
    boot(correlationID: UUID): Promise<void>;
    handleWEvent(event: WEvent): void;
}

export default class Bot implements IBot {
    private worker: IWorker;

    private bootResolver?: () => void;
    private readonly id: UUID;
    private bootTimeout: number;

    constructor(id: UUID) {
        this.id = id;
        this.worker = new (BotWorker as any)();
        this.bootTimeout = -1;
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

            const bootMessage: WBootMessage = {
                workerID: this.id,
                correlationID,
                type: MESSAGE_TYPE.BOOT,
            };

            this.worker.postMessage(bootMessage);

            this.bootTimeout = setTimeout(() => {
                throw Error(`boot timeout after ${BOOT_TIMEOUT_MS} ms`);
            }, BOOT_TIMEOUT_MS);
        });
    }

    public handleWEvent(event: WEvent): void {
        const message: WMessage = event.data;

        if (!this.bootResolver) {
            throw Error('can not handle events on not booted worker');
        }

        switch (message.type) {
            case MESSAGE_TYPE.RESULT:
                if (message.origin === MESSAGE_TYPE.BOOT) {
                    // tslint:disable-next-line
                    console.log('[MAIN]: boot result received', message);
                    (this.bootResolver as () => void)();
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

    public handleFatalWError(event: WEvent): void {
        // tslint:disable-next-line
        console.error('[MAIN]: fatal worker error', event);
        this.worker.terminate();
        throw Error('fatal worker error');
    }
}
