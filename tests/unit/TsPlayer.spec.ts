import * as TypeMoq from 'typemoq';

import {DecideFunc, Turn} from '@/common/types';

import NewPlayer from '@/engine/PlayerFactory';
import {IA} from '@/common/interfaces';
import {PLAYER_TYPE, MOVE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

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
            return NewPlayer(PLAYER_TYPE.TS).then((tsPlayer: IA) => {
                const turn: Turn = {
                    userID: 'test',
                    position: {
                        x: 1,
                        y: 1,
                        prev: {
                            x: 0,
                            y: 1,
                        },
                        targets: {
                            [MOVE.FORWARD]: {
                                x: 2,
                                y: 1,
                            },
                            [MOVE.LARBOARD]: {
                                x: 1,
                                y: 0,
                            },
                            [MOVE.STARBOARD]: {
                                x: 1,
                                y: 2,
                            },
                        },
                    },
                    grid: new Grid(15, 15),
                    decide: decideMock.object,
                };
                tsPlayer.act(turn);
                decideMock.verify(
                    (m) => m(TypeMoq.It.isAny(), TypeMoq.It.isAny()),
                    TypeMoq.Times.atLeastOnce(),
                );
            });
        });
    });
});
