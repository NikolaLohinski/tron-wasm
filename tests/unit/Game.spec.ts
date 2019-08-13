import {anything, FlushPromises} from './utils';

import {Player} from '@/common/interfaces';
import {GAME_STATUS, PLAYER_TYPE} from '@/common/constants';
import {ActFunc} from '@/common/types';

import Grid from '@/engine/Grid';
import Game from '@/engine/Game';

describe('Game', () => {
    const gridSizeX = 15;
    const gridSizeY = 15;
    const timeout = 100;

    let firstPlayer: jest.Mocked<Player>;
    let secondPlayer: jest.Mocked<Player>;

    let game: Game;

    beforeEach(() => {
        firstPlayer = {
            id: 'b4bab070-e6fb-4be5-ad79-be6c13dae260',
            type: PLAYER_TYPE.TS,
            parameters: {
                first: 'parameter',
            },
            boot: jest.fn(),
            isIdle: jest.fn(),
            requestAction: jest.fn(),
            destroy: jest.fn(),
        };
        secondPlayer = {
            id: '4debbb4d-8179-4040-a46e-9336fefbd38f',
            type: PLAYER_TYPE.TS,
            parameters: {
                second: 'parameter',
            },
            boot: jest.fn(),
            isIdle: jest.fn(),
            requestAction: jest.fn(),
            destroy: jest.fn(),
        };

        game = new Game(gridSizeX, gridSizeY, timeout, [firstPlayer, secondPlayer]);
    });

    describe('constructor', () => {
        test('default', () => {
            expect(game).toBeDefined();
            expect(game.turnTimeoutMs).toEqual(timeout);
            expect(game.grid).toBeDefined();
            expect(game.grid.sizeX).toEqual(gridSizeX);
            expect(game.grid.sizeY).toEqual(gridSizeY);
            expect(game.grid.isEmpty()).toBeTruthy();
        });
    });

    describe('isDead', () => {
        test('default', () => {
            const dead = game.isDead(firstPlayer.id);

            expect(dead).toBeFalsy();
        });

        test('when looking for a player that does not exist', () => {
            expect(() => game.isDead('whatever')).toThrowError();
        });
    });

    describe('getPosition', () => {
        test('default', () => {
            const position = game.getPosition(firstPlayer.id);

            expect(position).toEqual({ x: -1, y: -1 });
        });

        test('when looking for a player that does not exist', () => {
            expect(() => game.getPosition('whatever')).toThrowError();
        });
    });

    describe('getPerformance', () => {
        test('default', () => {
            const performance = game.getPerformance(firstPlayer.id);

            expect(performance).toEqual({ depth: 0, duration: 0 });
        });

        test('when looking for a player that does not exist', () => {
            expect(() => game.getPerformance('whatever')).toThrowError();
        });
    });

    describe('reset', () => {
        test('default', () => {
            const status = game.reset();

            expect(status).toEqual(GAME_STATUS.CLEAR);
            expect(game.grid.isEmpty()).toBeTruthy();

            for (const player of [firstPlayer, secondPlayer]) {
                expect(player.destroy).toHaveBeenCalledTimes(1);
                expect(game.isDead(player.id)).toBeFalsy();
                expect(game.getPosition(player.id)).toEqual({ x: -1, y: -1 });
                expect(game.getPerformance(player.id)).toEqual({ depth: 0, duration: 0 });
            }
        });
    });

    describe('start', () => {
        test('default', async () => {
            firstPlayer.boot.mockImplementationOnce(() => Promise.resolve());
            secondPlayer.boot.mockImplementationOnce(() => Promise.resolve());

            const state = await game.start();
            await FlushPromises();

            expect(state).toEqual(GAME_STATUS.RUNNING);
            expect(game.grid.isEmpty()).toBeFalsy();
            const positions: { [p: string]: boolean } = {};
            for (const player of [firstPlayer, secondPlayer]) {
                expect(player.boot).toHaveBeenCalledTimes(1);
                expect(player.boot).toHaveBeenCalledWith(expect.any(String));

                const position = game.getPosition(player.id);
                const key = `${position.x}${position.y}`;
                expect(positions[key]).toBeUndefined();
                positions[key] = true;

                expect(position).toEqual(expect.objectContaining({
                    x: expect.any(Number),
                    y: expect.any(Number),
                }));
            }
        });

        test('when a player fails to boot', () => {
            firstPlayer.boot.mockImplementationOnce(() => Promise.resolve());
            secondPlayer.boot.mockImplementationOnce(() => Promise.reject());

            return expect(game.start()).rejects.toEqual(expect.any(Error));
        });

        test('when the game has already been started', async () => {
            firstPlayer.boot.mockImplementationOnce(() => Promise.resolve());
            secondPlayer.boot.mockImplementationOnce(() => Promise.resolve());

            await game.start();
            await FlushPromises();

            return expect(game.start()).rejects.toEqual(expect.any(Error));
        });
    });
    describe('tick', () => {
        let firstPlayerAct: ActFunc;
        let secondPlayerAct: ActFunc;

        beforeEach(async () => {
            firstPlayer.boot.mockImplementation(() => Promise.resolve());
            secondPlayer.boot.mockImplementation(() => Promise.resolve());

            await game.start();
            await FlushPromises();

            firstPlayer.requestAction.mockImplementationOnce((_, __, ___, act) => {
                firstPlayerAct = act;
            });
            secondPlayer.requestAction.mockImplementationOnce((_, __, ___, act) => {
                secondPlayerAct = act;
            });
        });

        test('default', async () => {
            firstPlayer.isIdle.mockImplementationOnce(() => true);
            secondPlayer.isIdle.mockImplementationOnce(() => true);

            const state = await game.tick();

            expect(state).toEqual(GAME_STATUS.RUNNING);
            expect(firstPlayer.requestAction).toHaveBeenCalledTimes(1);
            expect(secondPlayer.requestAction).toHaveBeenCalledTimes(1);
            expect(firstPlayer.requestAction)
              .toHaveBeenCalledWith(expect.any(String), anything, expect.any(Grid), anything);
            expect(secondPlayer.requestAction)
              .toHaveBeenCalledWith(expect.any(String), anything, expect.any(Grid), anything);
            expect(firstPlayer.isIdle).toHaveBeenCalledTimes(1);
            expect(secondPlayer.isIdle).toHaveBeenCalledTimes(1);
        });

        test('when a player is not idle at the end of turn', async () => {
            firstPlayer.boot.mockClear();
            secondPlayer.boot.mockClear();

            firstPlayer.isIdle.mockImplementationOnce(() => true);
            firstPlayer.boot.mockImplementationOnce(() => Promise.resolve());
            secondPlayer.isIdle.mockImplementationOnce(() => false);

            await game.tick();

            expect(firstPlayer.boot).toHaveBeenCalledTimes(0);
            expect(secondPlayer.boot).toHaveBeenCalledTimes(1);
            expect(secondPlayer.boot).toHaveBeenCalledWith(expect.any(String));
        });
    });
});
