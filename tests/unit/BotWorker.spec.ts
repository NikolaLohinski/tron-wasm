import {
    IWorkerContext,
    MESSAGE_TYPE,
    WBootMessage,
    WEvent,
    WResultMessage,
    WRequestMessage,
    WErrorMessage,
} from '@/worker/types';
import {UUID, PLAYER_TYPE, Player, Turn, MOVE} from '@/common/types';

// Mock Bot module import
import NewTsPlayer from '@/engine/TsPlayerFactory';
jest.mock('@/engine/TsPlayerFactory', () => jest.fn());
const mockNewTsPlayer = (NewTsPlayer as any) as jest.Mock<Promise<Player>>;

import BotWorker from '@/worker/BotWorker';

describe('Bot Worker', () => {
    const mockWorkerContext = {
        postMessage: jest.fn(),
        onmessage: jest.fn(),
    };
    const mockPlayer = {
        play: jest.fn(),
    };

    let botWorker: BotWorker;

    const workerID: UUID = '10ed4545-9b6c-482e-b173-68e356dab286';
    const correlationID: UUID = '7440d203-6dd4-4cbf-b480-62a409edd36d';

    beforeEach(() => {

        mockNewTsPlayer.mockClear();
        mockNewTsPlayer.mockImplementationOnce(() => new Promise((rs) => rs(mockPlayer as Player)));

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
                const expectedBootResult: WResultMessage = {
                    type: MESSAGE_TYPE.RESULT,
                    workerID,
                    correlationID,
                    origin: MESSAGE_TYPE.BOOT,
                };
                expect(mockNewTsPlayer).toHaveBeenCalledTimes(1);

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
            const requestContent: any = {};
            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                workerID,
                correlationID,
                content: requestContent,
            };
            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                const expectedPlayArgs: Turn = {
                    position: requestContent,
                    decide: expect.any(Function),
                };
                expect(mockPlayer.play).toHaveBeenCalledTimes(1);
                expect(mockPlayer.play).toHaveBeenCalledWith(expectedPlayArgs);

                done();
            }, 20);
        });

        test('eventually responds with error on non booted worker', (done) => {
            mockWorkerContext.postMessage.mockClear();
            mockPlayer.play.mockClear();

            botWorker = new BotWorker(mockWorkerContext as IWorkerContext);

            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                workerID,
                correlationID,
                content: {},
            };
            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                expect(mockPlayer.play).toHaveBeenCalledTimes(0);

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

        test('eventually posts response on players\' decisions', (done) => {
            Object.values(mockWorkerContext).forEach((method) => method.mockClear());

            mockPlayer.play.mockImplementationOnce((turn: Turn) => {
                turn.decide(MOVE.FORWARD);
                turn.decide(MOVE.LARBOARD);
            });

            const requestMessage: WRequestMessage = {
                type: MESSAGE_TYPE.REQUEST,
                workerID,
                correlationID,
                content: {},
            };
            botWorker.handleWEvent({ data: requestMessage } as WEvent);

            setTimeout(() => {
                const expectedFirstMessage: WResultMessage = {
                    type: MESSAGE_TYPE.RESULT,
                    origin: MESSAGE_TYPE.REQUEST,
                    workerID,
                    correlationID,
                    content: MOVE.FORWARD,
                };

                const expectedSecondMessage: WResultMessage = {
                    type: MESSAGE_TYPE.RESULT,
                    origin: MESSAGE_TYPE.REQUEST,
                    workerID,
                    correlationID,
                    content: MOVE.LARBOARD,
                };

                expect(mockPlayer.play).toHaveBeenCalledTimes(1);

                expect(mockWorkerContext.postMessage).toHaveBeenCalledTimes(2);
                expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(1, expectedFirstMessage);
                expect(mockWorkerContext.postMessage).toHaveBeenNthCalledWith(2, expectedSecondMessage);

                done();
            }, 20);
        });
    });
});
