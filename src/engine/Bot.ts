import BotWorker from 'worker-loader!@/workers/bot.worker';
import { IBotWorker, MESSAGE_TYPE, WBootMessage, WEvent, WMessage } from '@/workers/types';
import { UUID } from '@/common/types';

export default class Bot {
    public worker: IBotWorker;

    private bootResolver?: () => void;
    private id: UUID;

    constructor(id: UUID) {
        this.id = id;
        this.worker = new (BotWorker as any)();
    }

    public boot(correlationID: UUID): Promise<void> {
        this.worker.terminate();
        this.worker = new (BotWorker as any)();
        return new Promise((resolveBoot) => {
            this.bootResolver = resolveBoot;
            this.worker.onmessage = this.handleWEvent.bind(this);

            const bootMessage: WBootMessage = {
                workerID: this.id,
                correlationID,
                type: MESSAGE_TYPE.BOOT,
            };

            this.worker.postMessage(bootMessage);
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
            default:
                // tslint:disable-next-line
                console.error('[MAIN]: unhandled message type', message);
                throw TypeError(`unhandled message type "${message.type}"`);
        }
    }
}
