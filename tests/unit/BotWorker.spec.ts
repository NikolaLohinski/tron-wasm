import {
    IWorkerContext,
    MESSAGE_TYPE,
    WBootMessage,
    WEvent,
    WResultMessage,
    WRequestMessage,
    WErrorMessage,
    WIdleMessage,
} from '@/worker/types';
import {UUID, Turn} from '@/common/types';

// Mock Bot module import
import NewPlayer from '@/engine/PlayerFactory';
jest.mock('@/engine/PlayerFactory', () => jest.fn());
const mockNewPlayer = (NewPlayer as any) as jest.Mock<Promise<IA>>;

import BotWorker from '@/worker/BotWorker';
import {IA} from '@/common/interfaces';
import {PLAYER_TYPE, MOVE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

describe('Bot Worker', () => {
    const mockWorkerContext = {
        postMessage: jest.fn(),
        onmessage: jest.fn(),
    };
    const mockPlayer = {
        act: jest.fn(),
    };

    let botWorker: BotWorker;

    const workerID: UUID = '10ed4545-9b6c-482e-b173-68e356dab286';
    const correlationID: UUID = '7440d203-6dd4-4cbf-b480-62a409edd36d';

    beforeEach(() => {

        mockNewPlayer.mockClear();
        mockNewPlayer.mockImplementationOnce(() => new Promise((rs) => rs(mockPlayer as IA)));

        botWorker = new BotWorker(mockWorkerContext as IWorkerContext);
    });

    describe('handle boot message', () => {
        test('eventually creates player and respond with a success boot result', (done) => {
            Object.values(mockWorkerContext).forEach((method) => method.mockClear());

            const bootMessage: WBootMessage = {
                type: MESSAGE_TYPE.BOOT,
                workerID,
                correlationID,
                playerType: PLAYER_TYPE.TS,
            };
            botWorker.handleWEvent({ data: bootMessage } as WEvent);


            setTimeout(() => {
                const expectedBootResult: WIdleMessage = {
                    type: MESSAGE_TYPE.IDLE,
                    workerID,
                    correlationID,
                    origin: MESSAGE_TYPE.BOOT,
                };
                expect(mockNewPlayer).toHaveBeenCalledTimes(1);

                expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(1);
                expect(mockWorkerContext.postMessage).toHaveBeenCalledWith(expectedBootResult);

                done();
            }, 20);
        });
    });

    describe('handle request message', () => {
        beforeEach(() => {
            const bootMessage: WBootMessage = {
                type: MESSAGE_TYPE.BOOT,
                workerID,
                correlationID,
                playerType: PLAYER_TYPE.TS,
            };

            botWorker.handleWEvent({ data: bootMessage } as WEvent);
        });

        test('eventually triggers player\'s play', (done) => {
            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                workerID,
                correlationID,
                position: {
                    x: 0,
                    y: 0,
                },
                grid: new Grid(15, 15),
                userID: 'test',
            };
            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                const expectedPlayArgs: Turn = {
                    userID: 'test',
                    position: {
                        x: 0,
                        y: 0,
                    },
                    grid: new Grid(15, 15),
                    decide: expect.any(Function),
                };
                expect(mockPlayer.act).toHaveBeenCalledTimes(1);
                expect(mockPlayer.act).toHaveBeenCalledWith(expectedPlayArgs);

                done();
            }, 20);
        });

        test('eventually responds with error on non booted worker', (done) => {
            mockWorkerContext.postMessage.mockClear();
            mockPlayer.act.mockClear();

            botWorker = new BotWorker(mockWorkerContext as IWorkerContext);

            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                workerID,
                correlationID,
            } as WRequestMessage;
            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                expect(mockPlayer.act).toHaveBeenCalledTimes(0);

                const expectedErrorMessage: WErrorMessage = {
                    type: MESSAGE_TYPE.ERROR,
                    workerID,
                    correlationID,
                    error: 'Error: worker is not booted, can not process request message',
                };

                expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(1);
                expect(mockWorkerContext.postMessage).toHaveBeenCalledWith(expectedErrorMessage);

                done();
            }, 20);
        });

        test('eventually posts response on players\' decisions and idle message when done', (done) => {
            Object.values(mockWorkerContext).forEach((method) => method.mockClear());

            mockPlayer.act.mockImplementationOnce((turn: Turn) => {
                turn.decide(MOVE.FORWARD, 1);
                turn.decide(MOVE.LARBOARD, 2);
            });

            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                correlationID,
                workerID,
                userID: 'test',
                position: {
                    x: 0,
                    y: 0,
                },
                grid: new Grid(15, 15),
            };

            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                const expectedFirstMessage: WResultMessage = {
                    type: MESSAGE_TYPE.RESULT,
                    origin: MESSAGE_TYPE.REQUEST,
                    workerID,
                    correlationID,
                    content: {
                        depth: 1,
                        move: MOVE.FORWARD,
                    },
                };

                const expectedSecondMessage: WResultMessage = {
                    type: MESSAGE_TYPE.RESULT,
                    origin: MESSAGE_TYPE.REQUEST,
                    workerID,
                    correlationID,
                    content: {
                        depth: 2,
                        move: MOVE.LARBOARD,
                    },
                };

                const expectedIdleMessage: WIdleMessage = {
                    type: MESSAGE_TYPE.IDLE,
                    origin: MESSAGE_TYPE.REQUEST,
                    workerID,
                    correlationID,
                };

                expect(mockPlayer.act).toHaveBeenCalledTimes(1);

                expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(3);
                expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(1, expectedFirstMessage);
                expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(2, expectedSecondMessage);
                expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(3, expectedIdleMessage);

                done();
            }, 20);
        });
    });
});
