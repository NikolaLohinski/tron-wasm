import * as TypeMoq from 'typemoq';

import {RegisterMoveFunc, Turn, UUID} from '@/common/types';

import NewPlayer from '@/engine/PlayerFactory';
import {AI} from '@/common/interfaces';
import {PLAYER_TYPE, MOVE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

describe('TsPlayer', () => {
    const correlationID: UUID = 'dc1fd0bc-0aa0-4dad-8160-12a673f39528';
    const registerMock: TypeMoq.IMock<RegisterMoveFunc> = TypeMoq.Mock.ofType<RegisterMoveFunc>();

    beforeEach(() => {
        registerMock.reset();
    });

    describe('Factory', () => {
        test('should return a player', () => {
            expect.assertions(1);
            return expect(NewPlayer(PLAYER_TYPE.TS, registerMock.object)).resolves.toBeDefined();
        });
    });

    describe('play', () => {
        test('should call decide function', () => {
            return NewPlayer(PLAYER_TYPE.TS, registerMock.object).then((tsPlayer: AI) => {
                const turn: Turn = {
                    userID: 'test',
                    correlationID,
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
                };
                tsPlayer.play(turn);
                registerMock.verify((m) => {
                    return m(correlationID, TypeMoq.It.isAny(), TypeMoq.It.isAny());
                }, TypeMoq.Times.atLeastOnce());
            });
        });
    });
});
