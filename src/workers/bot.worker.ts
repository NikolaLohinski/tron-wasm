import { IBotWorker, WEvent, WMessage, MESSAGE_TYPE, WErrorMessage, WResultMessage } from '@/workers/types';

const ctx: IBotWorker = self as any;

ctx.onmessage = (event: WEvent) => {
    // tslint:disable-next-line
    const message: WMessage = event.data;
    switch (message.type) {
        case MESSAGE_TYPE.BOOT:
            // tslint:disable-next-line
            console.log(`[WORKER: ${message.workerID}]: boot order received`, message);
            const res: WResultMessage = {
                workerID: message.workerID,
                correlationID: message.correlationID,
                origin: message.type,
                type: MESSAGE_TYPE.RESULT,
            };
            ctx.postMessage(res);
            break;
        default:
            const err: WErrorMessage = {
                workerID: message.workerID,
                correlationID: message.correlationID,
                type: MESSAGE_TYPE.ERROR,
                error: 'unknown message type',
            };
            ctx.postMessage(err);
    }
};
