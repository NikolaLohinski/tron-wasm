import {IWorker, WMessage, WEvent, IWorkerContext, NATIVE_WORKER_MESSAGE_TYPE} from '@/worker/types';
import * as TypeMoq from 'typemoq';

export const MockBotWorker: TypeMoq.IMock<IWorker> = TypeMoq.Mock.ofType<IWorker>();

export default class StubWorker implements IWorker {
    public addEventListener(message: NATIVE_WORKER_MESSAGE_TYPE, callback: (event: WEvent) => void): void {
      MockBotWorker.object.addEventListener(message, callback);
      return;
    }

    public postMessage(message: any): void {
      MockBotWorker.object.postMessage(message);
      return;
    }

    public terminate(): void {
      MockBotWorker.object.terminate();
      return;
    }
}
