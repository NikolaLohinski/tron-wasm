import * as TypeMoq from 'typemoq';

import { MockBotWorker } from '../mocks/glue.worker';
import { UUID } from '@/common/types';
import { WBootMessage, MESSAGE_TYPE, WResultMessage, WEvent } from '@/worker/types';

import Bot from '@/engine/Bot';

describe('Bot', () => {
    const workerID: UUID = '9951ec73-3a46-4ad1-86ed-5c2cd0788112';
    let bot: Bot;


    describe('constructor', () => {
        test('should initialize the underlying web worker', () => {
            return expect(new Bot(workerID).worker).toBeDefined();
        });
    });

    describe('boot', () => {
        const correlationID: UUID = 'd64385ef-17ed-4891-bb67-9273816be97f';

        beforeEach(() => {
            bot = new Bot(workerID);
        });

        test('should reboot worker, setup message handler and send the correct boot message', () => {

            const expectedBootMessage: WBootMessage = {
                correlationID,
                workerID,
                type: MESSAGE_TYPE.BOOT,
            };

            // First promise, on top of pile so it should be handled first
            // This promise will never end since it resolves when worker responds
            bot.boot(correlationID).then();

            // Then we verify assertions
            return new Promise((resolve) => {
                MockBotWorker.verify((m) => m.terminate(), TypeMoq.Times.once());
                MockBotWorker.verify((m) => m.postMessage(expectedBootMessage), TypeMoq.Times.once());
                expect(bot.worker.onmessage).toBeDefined();
                resolve();
            });
        });
    });

    describe('handleWEvent', () => {
        let bootResolved: boolean;
        beforeEach(() => {
            bot = new Bot(workerID);

            bootResolved = false;
            // tslint:disable-next-line
            bot['bootResolver'] = () => {
                bootResolved = true;
            };
        });
        test('should resolve boot on boot result message', () => {
            const returnedWMessage: WResultMessage = {
                workerID,
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
                workerID,
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.BOOT,
            };

            expect(() => bot.handleWEvent({ data: returnedWMessage } as WEvent)).toThrow(Error);
        });

        test('should throw an error on unhandled message type', () => {
            const returnedWMessage: WBootMessage = {
                workerID,
                correlationID: 'd64385ef-17ed-4891-bb67-9273816be97f',
                type: MESSAGE_TYPE.BOOT,
            };

            expect(() => bot.handleWEvent({ data: returnedWMessage } as WEvent)).toThrow(TypeError);
        });
    });
});
