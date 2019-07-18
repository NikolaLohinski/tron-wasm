import * as TypeMoq from 'typemoq';

import {DecideFunc, Player, PLAYER_TYPE, Turn} from '@/common/types';

import NewPlayer from '@/engine/PlayerFactory';

describe('TsPlayer', () => {
    describe('Factory', () => {
        test('should return a player', () => {
            expect.assertions(1);
            return expect(NewPlayer(PLAYER_TYPE.TS)).resolves.toBeDefined();
        });
    });

    describe('play', () => {
        const decideMock: TypeMoq.IMock<DecideFunc> = TypeMoq.Mock.ofType<DecideFunc>();

        beforeEach(() => {
            decideMock.reset();
        });

        test('should call decide function', () => {
            return NewPlayer(PLAYER_TYPE.TS).then((tsPlayer: Player) => {
                const turn: Turn = {
                    position: {
                        x: 1,
                        y: 1,
                        prev: {
                            x: 0,
                            y: 1,
                        },
                    },
                    decide: decideMock.object,
                };
                tsPlayer.play(turn);
                decideMock.verify((m) => m(TypeMoq.It.isAny()), TypeMoq.Times.once());
            });
        });
    });
});
