import {
  IWorkerContext,
  MESSAGE_TYPE,
  WBootMessage,
  WEvent,
  WResultMessage,
  WRequestMessage,
  WErrorMessage,
  WIdleMessage,
} from '@/workers/types';
import {UUID, Turn, RegisterMoveFunc} from '@/common/types';

import Wrapper from '@/workers/Wrapper';
import {AI} from '@/common/interfaces';
import {MOVE} from '@/common/constants';
import Grid from '@/engine/Grid';
import {ClearMockMethods, FlushPromises} from './utils';

describe('Wrapper', () => {
  const mockWorkerContext = {
    postMessage: jest.fn(),
    onmessage: jest.fn(),
  };
  const mockPlayer = {
    register: jest.fn(),
    play: jest.fn(),
    init: jest.fn(),
  };

  let botWorker: Wrapper;

  const workerID: UUID = '10ed4545-9b6c-482e-b173-68e356dab286';
  const correlationID: UUID = '7440d203-6dd4-4cbf-b480-62a409edd36d';
  const userID: UUID = 'a76e0fd5-a9a0-4560-adad-8565a91b84ab';

  beforeEach(() => {
    ClearMockMethods(mockWorkerContext);
    ClearMockMethods(mockPlayer);

    botWorker = new Wrapper(mockWorkerContext as IWorkerContext, mockPlayer as AI);
  });

  describe('handleWEvent', () => {
    describe('boot', () => {
      let message: WBootMessage;

      beforeEach(() => {
        message = {
          type: MESSAGE_TYPE.BOOT,
          workerID,
          correlationID,
          parameters: {
            foo: 'bar',
          },
        };
        mockPlayer.init.mockImplementationOnce(() => Promise.resolve());
      });

      test('default', async () => {
        botWorker.handleWEvent({ data: message } as WEvent);

        await FlushPromises();

        expect(mockPlayer.init).toHaveBeenCalledTimes(1);
        expect(mockPlayer.init).toHaveBeenCalledWith(expect.anything(), message.parameters);

        const expectedBootResult: WIdleMessage = {
          type: MESSAGE_TYPE.IDLE,
          workerID,
          correlationID,
          origin: MESSAGE_TYPE.BOOT,
        };

        expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(1);
        expect(mockWorkerContext.postMessage).toHaveBeenCalledWith(expectedBootResult);
      });
    });
    describe('request', () => {
      let message: WRequestMessage;

      beforeEach(() => {
        message = {
          type: MESSAGE_TYPE.REQUEST,
          workerID,
          correlationID,
          userID,
          position: { x: 0, y: 0 },
          grid: new Grid(15, 15),
        };
      });

      test('default', async () => {
        botWorker.handleWEvent({ data: message } as WEvent);
        await FlushPromises();

        expect(mockPlayer.play).toHaveBeenCalledTimes(1);

        const expectedBootResult: WIdleMessage = {
          type: MESSAGE_TYPE.IDLE,
          workerID,
          correlationID,
          origin: MESSAGE_TYPE.REQUEST,
        };

        expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(1);
        expect(mockWorkerContext.postMessage).toHaveBeenCalledWith(expectedBootResult);
      });

      test('when player calls register function', async () => {
        let registerFunction: RegisterMoveFunc;
        mockPlayer.init.mockImplementationOnce((register: RegisterMoveFunc) => {
          registerFunction = register;
          return Promise.resolve();
        });
        mockPlayer.play.mockImplementationOnce(() => {
          registerFunction(correlationID, MOVE.FORWARD, 1);
          registerFunction(correlationID, MOVE.STARBOARD, 2);
        });

        botWorker.handleWEvent({
          data: {
            type: MESSAGE_TYPE.BOOT,
            workerID,
            correlationID,
            parameters: {
              foo: 'bar',
            },
          }} as WEvent);
        await FlushPromises();

        botWorker.handleWEvent({ data: message } as WEvent);
        await FlushPromises();

        expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(4);

        const expectedFirstMove: WResultMessage = {
          type: MESSAGE_TYPE.RESULT,
          workerID,
          correlationID,
          origin: MESSAGE_TYPE.REQUEST,
          depth: 1,
          move: MOVE.FORWARD,
        };
        expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(2, expectedFirstMove);

        const expectedSecondMove: WResultMessage = {
          type: MESSAGE_TYPE.RESULT,
          workerID,
          correlationID,
          origin: MESSAGE_TYPE.REQUEST,
          depth: 2,
          move: MOVE.STARBOARD,
        };
        expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(3, expectedSecondMove);

        const expectedIdleResult: WIdleMessage = {
          type: MESSAGE_TYPE.IDLE,
          workerID,
          correlationID,
          origin: MESSAGE_TYPE.REQUEST,
        };
        expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(4, expectedIdleResult);
      });
    });
  });
});
