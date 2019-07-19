import * as TypeMoq from 'typemoq';

// Mock Bot module import
import Bot from '@/engine/Bot';
jest.mock('@/engine/Bot', () => jest.fn());
const mockBot = (Bot as any) as jest.Mock<typeof Bot>;

import {IBot} from '@/engine/Bot';
import Game from '@/engine/Game';

describe('Game', () => {
    beforeEach(() => {
        mockBot.mockClear();
    });

    describe('constructor', () => {
        test('should initialize and create a defined number of players', () => {
            const game = new Game(15, 15, 100, 2);
            expect(game).toBeDefined();
            expect(mockBot).toHaveBeenCalledTimes(2);
        });
    });

    describe('getPlayersIDs', () => {
        test('should return a number of ids matching the number of players', () => {
            const game = new Game(15, 15, 100, 3);
            expect(game.getPlayersIDs()).toHaveLength(3);
        });
    });

    describe('getPosition', () => {
        test('should return uninitialized positions for all players', () => {
            const game = new Game(15, 15, 100, 3);
            const ids = game.getPlayersIDs();
            for (const id of ids) {
                expect(game.getPosition(id)).toEqual({ x: -1, y: -1 });
            }
        });

        test('should throw an error on unknown player id', () => {
            const game = new Game(15, 15, 100, 3);
            expect( () => game.getPosition('i do not exist')).toThrow('unknown player with ID: "i do not exist"');
        });
    });

    describe('start', () => {
        let game: Game;

        const mockBot1: TypeMoq.IMock<IBot> = TypeMoq.Mock.ofType<IBot>();
        const mockBot2: TypeMoq.IMock<IBot> = TypeMoq.Mock.ofType<IBot>();

        beforeEach(() => {
            mockBot1.reset();
            mockBot2.reset();

            // Mock new Bot instantiation
            mockBot.mockImplementationOnce(() => (mockBot1.object as any));
            mockBot.mockImplementationOnce(() => (mockBot2.object as any));

            game = new Game(15, 15);
        });


        test('should boot all bots', () => {
            mockBot1.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));
            mockBot2.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));

            return game.start().then(() => {
                mockBot1.verify((m) => m.boot(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
                mockBot2.verify((m) => m.boot(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
            });
        });

        test('should reject with an error if game has already been started', () => {

            mockBot1.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));
            mockBot2.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));

            return game.start().then(() => {
                return game.start().catch((e) => {
                   expect(e).toEqual(Error('can not start a game that has already started'));
                });
            });
        });
    });

    describe('tick', () => {
        let game: Game;

        const mockBot1: TypeMoq.IMock<IBot> = TypeMoq.Mock.ofType<IBot>();
        const mockBot2: TypeMoq.IMock<IBot> = TypeMoq.Mock.ofType<IBot>();

        beforeEach(() => {
            mockBot1.reset();
            mockBot2.reset();

            // Mock new Bot instantiation
            mockBot.mockImplementationOnce(() => (mockBot1.object as any));
            mockBot.mockImplementationOnce(() => (mockBot2.object as any));

            game = new Game(15, 15);
        });

        test('should reject with an error if game has not been started', () => {
            return game.tick().catch((e) => {
                expect(e).toEqual(Error('can not tick a game that has not been started'));
            });
        });
    });
});
