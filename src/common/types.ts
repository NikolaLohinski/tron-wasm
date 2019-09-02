import {GAME_STATE, MOVE, PLAYER_TYPE} from '@/common/constants';
import {Player} from '@/common/interfaces';

import Grid from '@/engine/Grid';

export type UUID = string;
export type RegisterMoveFunc = (correlationID: UUID, direction: MOVE, depth: number) => void;
export type ActFunc = (id: UUID, move: MOVE, depth: number) => void;

export interface Color {
    name: string;
    code: string;
}

export interface Protagonist {
    player: Player;
    name: string;
    id: UUID;
    color: Color;
    alive: boolean;
    type: PLAYER_TYPE;
    position: Position;
    performance: Performance;
}

export interface Performance {
    depth: number;
    durations: number[];
}

export interface Simulation {
    state: GAME_STATE;
    grid: {
        sizeX: number,
        sizeY: number,
    };
    participants: Array<[PLAYER_TYPE, any]>;
    turnTimeout: number;
}

export interface Position {
    x: number;
    y: number;
    prev?: Position;
}

export interface MoveTarget {
    [MOVE.FORWARD]: Position;
    [MOVE.STARBOARD]: Position;
    [MOVE.LARBOARD]: Position;
}

export interface Turn {
    correlationID: UUID;
    userID: UUID;
    position: Position;
    grid: Grid;
}

