import * as TypeMoq from 'typemoq';

import {MockBotWorker} from '../mocks/glue.worker';
import {UUID, PLAYER_TYPE} from '@/common/types';
import {WBootMessage, MESSAGE_TYPE, WResultMessage, WEvent, NATIVE_WORKER_MESSAGE_TYPE} from '@/worker/types';

import Bot from '@/engine/Bot';

describe('Bot', () => {
    const botID: UUID = '9951ec73-3a46-4ad1-86ed-5c2cd0788112';
    const workerID: UUID = 'b6ce5701-e1c5-4d55-a9e7-a30ffe633781';

    const playerType = PLAYER_TYPE.TS;
    let bot: Bot;

    beforeEach(() => {
        MockBotWorker.reset();
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
            MockBotWorker.reset();

            bot = new Bot(botID, playerType);
        });

        test('should eventually reboot worker, setup message handlers and send the a boot result', (done) => {
            // First promise, on top of pile so it should be handled first
            // This promise will never end since it resolves when worker responds
            bot.boot(correlationID).then();

            // Then we verify assertions
            setTimeout(() => {
                MockBotWorker.verify((m) => m.terminate(), TypeMoq.Times.once());

                MockBotWorker.verify((m) => {
                    return m.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.MESSAGE, TypeMoq.It.isAny());
                }, TypeMoq.Times.once());
                MockBotWorker.verify((m) => {
                    return m.addEventListener(NATIVE_WORKER_MESSAGE_TYPE.ERROR, TypeMoq.It.isAny());
                }, TypeMoq.Times.once());
                MockBotWorker.verify((m) => m.postMessage(TypeMoq.It.isAny()), TypeMoq.Times.once());

                done();
            }, 20);
        });
    });

    describe('handleWEvent', () => {
        let bootResolved: boolean;
        beforeEach(() => {
            MockBotWorker.reset();

            bot = new Bot(botID, playerType);

            bootResolved = false;
            // tslint:disable-next-line
            bot['bootResolver'] = () => {
                bootResolved = true;
            };
        });
        test('should resolve boot on boot result message', () => {
            const returnedWMessage: WResultMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.RESULT,
                origin: MESSAGE_TYPE.BOOT,
                content: undefined,
            };

            bot.handleWEvent({ data: returnedWMessage } as WEvent);

            expect(bootResolved).toEqual(true);
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

            expect(() => bot.handleWEvent({ data: returnedWMessage } as WEvent)).toThrow(Error);
        });

        test('should throw an error on unhandled message type', () => {
            const returnedWMessage: WBootMessage = {
                workerID: expect.anything(),
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.BOOT,
                playerType: PLAYER_TYPE.TS,
            };

            expect(() => bot.handleWEvent({ data: returnedWMessage } as WEvent)).toThrow(TypeError);
        });
    });

    describe('handleFatalWError', () => {
        beforeEach(() => {
            MockBotWorker.reset();

            bot = new Bot(botID, playerType);
        });

        test('should terminate worker and throw an error', () => {
            const errorFromWorker = Error('fatal error sent from worker');
            const expectedError = Error('fatal worker error');
            try {
                bot.handleFatalWError((errorFromWorker as any) as WEvent);
            } catch (e) {
                expect(e).toEqual(expectedError);
            }
            MockBotWorker.verify((m) => m.terminate(), TypeMoq.Times.once());
        });
    });
});
