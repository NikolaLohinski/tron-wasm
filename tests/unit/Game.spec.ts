import * as TypeMoq from 'typemoq';

// Mock Bot module import
import Bot from '@/engine/Bot';
jest.mock('@/engine/Bot', () => jest.fn());
const mockBot = (Bot as any) as jest.Mock<typeof Bot>;

import {IBot} from '@/engine/Bot';
import Game, {GAME_NUMBER_PLAYERS} from '@/engine/Game';

describe('Game', () => {
    const gridSize: number = 15;

    beforeEach(() => {
        mockBot.mockClear();
    });

    describe('constructor', () => {
        test('should initialize and create a defined number of players', () => {
            const game = new Game(gridSize, gridSize);
            expect(game).toBeDefined();
            expect(mockBot).toHaveBeenCalledTimes(GAME_NUMBER_PLAYERS);
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

            game = new Game(gridSize, gridSize);
        });


        test('should boot all bots', () => {
            mockBot1.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));
            mockBot2.setup((m) => m.boot(TypeMoq.It.isAny())).returns(() => new Promise((r) => r()));

            return game.start().then(() => {
                mockBot1.verify((m) => m.boot(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
                mockBot2.verify((m) => m.boot(TypeMoq.It.isAny()), TypeMoq.Times.atLeastOnce());
            });
        });
    });
});
