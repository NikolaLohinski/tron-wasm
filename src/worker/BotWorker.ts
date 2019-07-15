import {IBotWorker, MESSAGE_TYPE, WErrorMessage, WEvent, WMessage} from '@/worker/types';

export default class BotWorker {
    private ctx: IBotWorker;
    constructor(ctx: IBotWorker) {
        this.ctx = ctx;
    }

    public handleWEvent(event: WEvent) {
        // tslint:disable-next-line
        const message: WMessage = event.data;
        try {
            const response = BotWorker.handleWMessage(message);
            if (response) {
                this.ctx.postMessage(response);
            }
        } catch (e) {
            // tslint:disable-next-line
            console.error(`[WORKER: ${message.workerID}]: error`, e);
            const err: WErrorMessage = {
                workerID: message.workerID,
                correlationID: message.correlationID,
                type: MESSAGE_TYPE.ERROR,
                error: e.toString(),
            };
            this.ctx.postMessage(err);
        }
    }

    private static handleWMessage(message: WMessage): WMessage | null {
        switch (message.type) {
            case MESSAGE_TYPE.BOOT:
                // tslint:disable-next-line
                console.log(`[WORKER: ${message.workerID}]: boot order received`, message);
                return {
                    workerID: message.workerID,
                    correlationID: message.correlationID,
                    origin: message.type,
                    type: MESSAGE_TYPE.RESULT,
                };
            case MESSAGE_TYPE.RESULT:
                // tslint:disable-next-line
                console.log(`[WORKER: ${message.workerID}]: request received`, message);
                break;
            default:
                throw Error(`unknown message of type '${message.type}'`);
        }
        return null;
    }
}
