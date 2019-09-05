import {anything, ClearMockMethods, FlushPromises} from './utils';

import {MESSAGE_TYPE, NATIVE_WORKER_TYPE, WEvent} from '@/bots/types';
import {Position, UUID} from '@/common/types';
import {MOVE, PLAYER_TYPE} from '@/common/constants';
import Grid from '@/engine/Grid';

import Bot from '@/engine/Bot';
describe('Bot', () => {

  type EventListener =  (event: WEvent) => void;

  const TYPESCRIPT_BOT_WORKER = 'TYPESCRIPT_BOT_WORKER';
  const RUST_BOT_WORKER = 'RUST_BOT_WORKER';

  const playerType = PLAYER_TYPE.TS;
  const userID: UUID = '9951ec73-3a46-4ad1-86ed-5c2cd0788112';
  const correlationID: UUID = 'd64385ef-17ed-4891-bb67-9273816be97f';

  const worker = {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    terminate: jest.fn(),
  };

  let bot: Bot;

  beforeEach(() => {
    ClearMockMethods(worker);
    Object.assign(global, {
      TYPESCRIPT_BOT_WORKER,
      RUST_BOT_WORKER,
      Worker: class { constructor() { return worker; }},
    });

    bot = new Bot(userID, playerType);
  });

  describe('boot', () => {
    test('default', async () => {
      bot.boot(correlationID).then();

      await FlushPromises();

      expect(worker.addEventListener).toHaveBeenCalledTimes(2);
      expect(worker.addEventListener).toHaveBeenNthCalledWith(1, NATIVE_WORKER_TYPE.ERROR, anything);
      expect(worker.addEventListener).toHaveBeenNthCalledWith(2, NATIVE_WORKER_TYPE.MESSAGE, anything);

      expect(worker.postMessage).toHaveBeenCalledTimes(1);
      expect(worker.postMessage).toHaveBeenNthCalledWith(1, expect.objectContaining({
        correlationID,
        workerID: expect.any(String),
        type: MESSAGE_TYPE.BOOT,
      }));
    });
  });

  describe('isIdle', () => {
    test('default', () => {
      expect(bot.isIdle()).toBeFalsy();
    });

    test('default', async () => {
      worker.addEventListener
          .mockImplementationOnce(() => undefined) // Set ERROR handler
          .mockImplementationOnce((_, listener: EventListener) => { // Set BOOT resolver
            listener({
              data: {
                correlationID: anything,
                workerID: anything,
                type: MESSAGE_TYPE.IDLE,
                origin: MESSAGE_TYPE.BOOT,
              },
            } as WEvent);
          });

      await bot.boot(correlationID);
      await FlushPromises();

      expect(bot.isIdle()).toBeTruthy();
    });
  });

  describe('requestAction', () => {
    let position: Position;
    let grid: Grid;

    let botReactToWorkerMessage: EventListener;
    const actFunction = jest.fn();

    beforeEach(async () => {
      worker.addEventListener
        .mockImplementationOnce(() => undefined) // Set ERROR handler
        .mockImplementationOnce((_, listener: EventListener) => { // Set BOOT resolver
          listener({
            data: {
              correlationID: anything,
              workerID: anything,
              type: MESSAGE_TYPE.IDLE,
              origin: MESSAGE_TYPE.BOOT,
            },
          } as WEvent);
        })
        .mockImplementationOnce((_, listener: EventListener) => { // Set MESSAGE handler
          botReactToWorkerMessage = listener;
        });

      await bot.boot(correlationID);
      await FlushPromises();

      worker.postMessage.mockClear();
      actFunction.mockClear();

      position = { x: 0, y: 0 };
      grid = new Grid(15, 15);
    });

    test('default', () => {
      bot.requestAction(correlationID, position, grid, actFunction);

      expect(bot.isIdle()).toBeFalsy();
      expect(worker.postMessage).toHaveBeenCalledTimes(1);
      expect(worker.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        correlationID,
        position,
        grid,
        userID,
        workerID: expect.any(String),
      }));
    });

    test('when worker responds with a result', () => {
      bot.requestAction(correlationID, position, grid, actFunction);
      botReactToWorkerMessage({
        data: {
          correlationID,
          type: MESSAGE_TYPE.RESULT,
          origin: MESSAGE_TYPE.REQUEST,
          depth: 2,
          move: MOVE.FORWARD,
        },
      } as WEvent);
      botReactToWorkerMessage({
        data: {
          correlationID,
          type: MESSAGE_TYPE.RESULT,
          origin: MESSAGE_TYPE.REQUEST,
          depth: 3,
          move: MOVE.STARBOARD,
        },
      } as WEvent);
      expect(bot.isIdle()).toBeFalsy();

      expect(actFunction).toHaveBeenCalledTimes(2);
      expect(actFunction).toHaveBeenCalledWith(correlationID, MOVE.FORWARD, 2);
      expect(actFunction).toHaveBeenCalledWith(correlationID, MOVE.STARBOARD, 3);
    });

    test('when worker has finish computing', () => {
      bot.requestAction(correlationID, position, grid, actFunction);
      botReactToWorkerMessage({
        data: {
          correlationID,
          type: MESSAGE_TYPE.IDLE,
          origin: MESSAGE_TYPE.REQUEST,
        },
      } as WEvent);
      expect(bot.isIdle()).toBeTruthy();
      expect(actFunction).toHaveBeenCalledTimes(0);
    });
  });
});
