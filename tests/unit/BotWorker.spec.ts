import {IWorkerContext, MESSAGE_TYPE, WBootMessage, WEvent, WResultMessage} from '@/worker/types';
import {UUID} from '@/common/types';

import BotWorker from '@/worker/BotWorker';
import * as TypeMoq from 'typemoq';

describe('Bot Worker', () => {
    const mockWorkerContext: TypeMoq.IMock<IWorkerContext> = TypeMoq.Mock.ofType<IWorkerContext>();

    let botWorker: BotWorker;

    const workerID: UUID = '10ed4545-9b6c-482e-b173-68e356dab286';
    const correlationID: UUID = '7440d203-6dd4-4cbf-b480-62a409edd36d';

    beforeEach(() => {
        mockWorkerContext.reset();
        botWorker = new BotWorker(mockWorkerContext.object);
    });

    test('boot request should respond with a success boot result', () => {
        const bootRequest: WBootMessage = {
            type: MESSAGE_TYPE.BOOT,
            workerID,
            correlationID,
        };
        botWorker.handleWEvent({ data: bootRequest } as WEvent);

        const expectedBootResult: WResultMessage = {
            type: MESSAGE_TYPE.RESULT,
            workerID,
            correlationID,
            origin: MESSAGE_TYPE.BOOT,
        };

        mockWorkerContext.verify((m) => m.postMessage(expectedBootResult), TypeMoq.Times.once());
    });
});
