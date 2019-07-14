import { IBotWorker, WMessage, WEvent } from '@/workers/types';
import * as TypeMoq from 'typemoq';

export const MockBotWorker: TypeMoq.IMock<IBotWorker> = TypeMoq.Mock.ofType<IBotWorker>();

export default class StubBotWorker implements IBotWorker {
    public onmessage: (event: WEvent) => void;

    constructor() {
      this.onmessage = (x: any): void => {
        MockBotWorker.object.onmessage(x);
        return;
      };
    }

    public postMessage(message: WMessage): void {
      MockBotWorker.object.postMessage(message);
      return;
    }

    public terminate(): void {
      MockBotWorker.object.terminate();
      return;
    }
  }
