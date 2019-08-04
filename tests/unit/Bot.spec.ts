import * as TypeMoq from 'typemoq';

import {Position, UUID} from '@/common/types';
import {PLAYER_TYPE, MOVE} from '@/common/constants';

import {Grid} from '@/engine/Grid';

import {
    MESSAGE_TYPE,
    NATIVE_WORKER_MESSAGE_TYPE,
    WBootMessage,
    WEvent,
    WRequestMessage,
    WResultMessage,
    WIdleMessage,
    WErrorMessage, IWorker,
} from '@/workers/bot/types';

import Bot from '@/engine/Bot';

describe('Bot', () => {
    const MockWorker: TypeMoq.IMock<IWorker> = TypeMoq.Mock.ofType<IWorker>();
    const botID: UUID = '9951ec73-3a46-4ad1-86ed-5c2cd0788112';
    const playerType = PLAYER_TYPE.TS;

    let bot: Bot;

    beforeEach(() => {
        MockWorker.reset();
        // @ts-ignore
        global.Worker = class { constructor() { return MockWorker.object; }};
    });

    describe('constructor', () => {
        test('should initialize the underlying web worker', () => {
            // tslint:disable-next-line
            return expect(new Bot(botID, playerType)['worker']).toBeDefined();
        });
    });

    describe('boot', () => {
        const correlationID: UUID = 'd64385ef-17ed-4891-bb67-9273816be97f';

        beforeEach(() => {
            MockWorker.reset();

            bot = new Bot(botID, playerType);
        });

        test('should eventually reboot worker, setup message handlers and send the a boot result', (done) => {
            // First promise, on top of pile so it should be handled first
            // This promise will never end since it resolves when worker responds
            bot.boot(correlationID).then();

            // Then we verify assertions
            setTimeout(() => {
                MockWorker.verify((m) => m.terminate(), TypeMoq.Times.once());

                MockWorker.verify((m) => {
                    return m.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.MESSAGE, TypeMoq.It.isAny());
                }, TypeMoq.Times.once());
                MockWorker.verify((m) => {
                    return m.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.ERROR, TypeMoq.It.isAny());
                }, TypeMoq.Times.once());
                MockWorker.verify((m) => m.postMessage(TypeMoq.It.isAny()), TypeMoq.Times.once());

                done();
            }, 20);
        });
    });

    describe('isIdle', () => {
        beforeEach(() => {
            bot = new Bot(botID, playerType);
        });

        test('should not be idle if not booted', () => {
            expect(bot.isIdle()).toBeFalsy();
        });

        test('should be idle if it was booted and received an idle with origin boot', () => {
            // tslint:disable-next-line
            bot['bootResolver'] = () => { return; };
            const returnedBootResponse: WIdleMessage = {
                correlationID: expect.anything(),
                workerID: expect.anything(),
                type: MESSAGE_TYPE.IDLE,
                origin: MESSAGE_TYPE.BOOT,
            };
            // tslint:disable-next-line
            bot['handleWEvent']({ data: returnedBootResponse } as WEvent);

            expect(bot.isIdle()).toBeTruthy();
        });

        test('should be idle if it was booted and received an idle with origin request', () => {
            // tslint:disable-next-line
            bot['bootResolver'] = () => { return; };
            const returnedBootResponse: WIdleMessage = {
                correlationID: expect.anything(),
                workerID: expect.anything(),
                type: MESSAGE_TYPE.IDLE,
                origin: MESSAGE_TYPE.REQUEST,
            };
            // tslint:disable-next-line
            bot['handleWEvent']({ data: returnedBootResponse } as WEvent);

            expect(bot.isIdle()).toBeTruthy();
        });
    });

    describe('requestAction', () => {
        const correlationID: UUID = 'd64385ef-17ed-4891-bb67-9273816be97f';

        beforeEach(() => {
            MockWorker.reset();

            bot = new Bot(botID, playerType);

            const returnedWMessage: WIdleMessage = {
                workerID: expect.anything(),
                correlationID,
                type: MESSAGE_TYPE.IDLE,
                origin: MESSAGE_TYPE.BOOT,
            };
            // tslint:disable-next-line
            bot['bootResolver'] = () => { return; };
            // tslint:disable-next-line
            bot['handleWEvent']({ data: returnedWMessage } as WEvent);
        });

        test('should send request message with relevant data', () => {
            const position: Position = 'this is a position' as any;
            const grid: Grid = 'this is a grid' as any;
            const actFunction: (id: UUID, content: {move: MOVE, depth: number}) => void = 'act function' as any;

            const mockWorker = { postMessage: jest.fn() } as any;

            // tslint:disable-next-line
            bot['worker'] = mockWorker;

            const expectedRequest: WRequestMessage = {
                workerID: expect.anything(),
                correlationID,
                type: MESSAGE_TYPE.REQUEST,
                position,
                grid,
                userID: botID,
            };

            bot.requestAction(correlationID, position, grid, actFunction);

            expect(mockWorker.postMessage).toHaveBeenCalledTimes(1);
            expect(mockWorker.postMessage).toHaveBeenCalledWith(expectedRequest);
        });
    });

    describe('destroy', () => {
       test('should terminate worker and stop being idle', () => {
           bot = new Bot(botID, playerType);

           bot.destroy();

           expect(bot.isIdle()).toBeFalsy();
           MockWorker.verify((m) => m.terminate(), TypeMoq.Times.once());
       });
    });

    describe('[PRIVATE] handleWEvent', () => {
        let bootResolved: boolean;
        beforeEach(() => {
            MockWorker.reset();

            bot = new Bot(botID, playerType);

            bootResolved = false;
            // tslint:disable-next-line
            bot['bootResolver'] = () => {
                bootResolved = true;
            };
        });

        test('should resolve boot on boot result message', () => {
            const returnedWMessage: WIdleMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.IDLE,
                origin: MESSAGE_TYPE.BOOT,
            };

            // tslint:disable-next-line
            bot['handleWEvent']({ data: returnedWMessage } as WEvent);

            expect(bootResolved).toEqual(true);
        });

        test('should act on result message', () => {
            const correlationID = 'd64385ef-17ed-4891-bb67-9273816be97f';
            const returnedWMessage: WResultMessage = {
                workerID: expect.anything(),
                correlationID,
                type: MESSAGE_TYPE.RESULT,
                content: {
                    depth: 42,
                    move: MOVE.STARBOARD,
                },
                origin: MESSAGE_TYPE.REQUEST,
            };

            const mockActFunction = jest.fn();
            // tslint:disable-next-line
            bot['actFunction'] = mockActFunction;

            // tslint:disable-next-line
            bot['handleWEvent']({ data: returnedWMessage} as WEvent);

            // tslint:disable-next-line
            expect(mockActFunction).toHaveBeenCalledTimes(1);
            expect(mockActFunction).toHaveBeenCalledWith(correlationID, { move: MOVE.STARBOARD, depth: 42 });
        });

        test('should throw an error on error from worker', () => {
            const returnedWMessage: WErrorMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.ERROR,
                error: 'error sent from worker',
            };

            // tslint:disable-next-line
            expect(() => bot['handleWEvent']({ data: returnedWMessage} as WEvent)).toThrowError();
        });

        test('should throw an error if trying to handle event without booting', () => {
            // tslint:disable-next-line
            bot['bootResolver'] = undefined;

            const returnedWMessage: WBootMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.BOOT,
                playerType: PLAYER_TYPE.TS,
            };
            // tslint:disable-next-line
            expect(() =>  bot['handleWEvent']({ data: returnedWMessage } as WEvent)).toThrow(Error);
        });

        test('should throw an error on unhandled message type', () => {
            const returnedWMessage: WBootMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.BOOT,
                playerType: PLAYER_TYPE.TS,
            };
            // tslint:disable-next-line
            expect(() =>  bot['handleWEvent']({ data: returnedWMessage } as WEvent)).toThrow(TypeError);
        });
    });

    describe('[PRIVATE] handleFatalWError', () => {
        beforeEach(() => {
            MockWorker.reset();

            bot = new Bot(botID, playerType);
        });

        test('should terminate worker and throw an error', () => {
            const errorFromWorker = Error('fatal error sent from worker');
            const expectedError = Error('fatal worker error');
            try {
                // tslint:disable-next-line
                bot['handleFatalWError']((errorFromWorker as any) as WEvent);
            } catch (e) {
                expect(e).toEqual(expectedError);
            }
            MockWorker.verify((m) => m.terminate(), TypeMoq.Times.once());
        });
    });
});
