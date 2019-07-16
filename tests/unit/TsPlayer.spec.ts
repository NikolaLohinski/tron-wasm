import * as TypeMoq from 'typemoq';

import NewTsPlayer from '@/engine/TsPlayerFactory';
import {Player, MOVE, Turn, DecideFunc} from '@/common/types';

describe('TsPlayer', () => {
    describe('Factory', () => {
        test('should return a player', () => {
            expect.assertions(1);
            return expect(NewTsPlayer()).resolves.toBeDefined();
        });
    });

    describe('play', () => {
        const decideMock: TypeMoq.IMock<DecideFunc> = TypeMoq.Mock.ofType<DecideFunc>();

        beforeEach(() => {
            decideMock.reset();
        });

        test('should go forward', () => {
            return NewTsPlayer().then((tsPlayer: Player) => {
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
                decideMock.verify((m) => m(MOVE.FORWARD), TypeMoq.Times.once());
            });
        });
    });
});
