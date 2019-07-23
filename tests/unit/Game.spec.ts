import * as TypeMoq from 'typemoq';
// Mock Bot module import
import Bot from '@/engine/Bot';
import Game from '@/engine/Game';
import {Player} from '@/common/interfaces';
import {GAME_STATUS, MOVE, PLAYER_TYPE} from '@/common/constants';

jest.mock('@/engine/Bot', () => jest.fn());
const mockBot = (Bot as any) as jest.Mock<typeof Bot>;

describe('Game', () => {
    beforeEach(() => {
        mockBot.mockClear();
    });

    describe('constructor', () => {
        test('should initialize and create a defined number of players', () => {
            const game = new Game(15, 15, 100, [
                { type: PLAYER_TYPE.TS, depth: 42 },
                { type: PLAYER_TYPE.TS, depth: 52 },
            ]);
            expect(game).toBeDefined();
            expect(mockBot).toHaveBeenCalledTimes(2);
        });
    });

    describe('getPlayersIDs', () => {
        test('should return a number of ids matching the number of players', () => {
            const game = new Game(15, 15, 100, [
                { type: PLAYER_TYPE.TS, depth: 1 },
                { type: PLAYER_TYPE.TS, depth: 2 },
                { type: PLAYER_TYPE.TS, depth: 3 },
            ]);
            expect(game.getPlayersIDs()).toHaveLength(3);
        });
    });

    describe('getPosition', () => {
        const game = new Game(15, 15, 100, [
            { type: PLAYER_TYPE.TS, depth: 1 },
            { type: PLAYER_TYPE.TS, depth: 2 },
            { type: PLAYER_TYPE.TS, depth: 3 },
        ]);

        test('should return uninitialized positions for all players', () => {
            const ids = game.getPlayersIDs();
            for (const id of ids) {
                expect(game.getPosition(id)).toEqual({ x: -1, y: -1 });
            }
        });

        test('should throw an error on unknown player id', () => {
            expect( () => game.getPosition('i do not exist')).toThrow('unknown player with ID: "i do not exist"');
        });
    });

    describe('start', () => {
        let game: Game;

        const mockBot1: TypeMoq.IMock<Player> = TypeMoq.Mock.ofType<Player>();
        const mockBot2: TypeMoq.IMock<Player> = TypeMoq.Mock.ofType<Player>();

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

        const mockBot1: TypeMoq.IMock<Player> = TypeMoq.Mock.ofType<Player>();
        const mockBot2: TypeMoq.IMock<Player> = TypeMoq.Mock.ofType<Player>();

        beforeEach(() => {
            // Mock new Bot instantiation
            mockBot.mockImplementationOnce(() => (mockBot1.object as any));
            mockBot.mockImplementationOnce(() => (mockBot2.object as any));

            game = new Game(15, 15, 200);
        });

        test('should request action from each player', async () => {

            await game.start();

            mockBot1.reset();
            mockBot1.setup((m) => m.isIdle()).returns(() => true);

            mockBot2.reset();
            mockBot2.setup((m) => m.isIdle()).returns(() => true);

            const state = await game.tick();

            mockBot1.verify((m) => m.requestAction(
                TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(),
            ), TypeMoq.Times.exactly(1));

            mockBot2.verify((m) => m.requestAction(
                TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny(),
            ), TypeMoq.Times.exactly(1));

            expect(state).toMatch(new RegExp(`${GAME_STATUS.RUNNING}|${GAME_STATUS.FINISHED}`));
        });

        test('should reboot non idle bots at the end of turn', async () => {
            await game.start();

            mockBot1.reset();
            mockBot1.setup((m) => m.isIdle()).returns(() => true);

            mockBot2.reset();
            mockBot2.setup((m) => m.isIdle()).returns(() => false);

            const state = await game.tick();

            mockBot1.verify((m) => m.boot(TypeMoq.It.isAnyString()), TypeMoq.Times.exactly(0));
            mockBot2.verify((m) => m.boot(TypeMoq.It.isAnyString()), TypeMoq.Times.exactly(1));

            expect(state).toMatch(new RegExp(`${GAME_STATUS.RUNNING}|${GAME_STATUS.FINISHED}`));
        });

        test('should not throw an error if a player is out of sync', async () => {
            await game.start();

            mockBot1.reset();
            mockBot1.setup((m) => m.isIdle()).returns(() => true);

            mockBot2.reset();
            mockBot2.setup((m) => m.isIdle()).returns(() => true);
            mockBot2.setup((m) => m.requestAction(
                TypeMoq.It.isAnyString(), TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny()),
            ).returns((corr, pos, grid, act) => {
                act('unknown correlation ID', MOVE.FORWARD);
            });

            const state = await game.tick();

            expect(state).toMatch(new RegExp(`${GAME_STATUS.RUNNING}|${GAME_STATUS.FINISHED}`));
        });

        test('should reject with an error if game has not been started', () => {
            return game.tick().catch((e) => {
                expect(e).toEqual(Error('can not tick a game that has not been started'));
            });
        });
    });
});
