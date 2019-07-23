import {MOVE, PLAYER_TYPE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

export type UUID = string;
export type DecideFunc = (direction: MOVE, depth: number) => void;

export interface Color {
    name: string;
    code: string;
}

export interface PlayerMetadata {
    name: string;
    id: UUID;
    color: Color;
    alive: boolean;
    type: PLAYER_TYPE;
    depth: number;
}

export interface PlayerPerformance {
    depth: number;
    duration: number;
}

export interface GameMetadata {
    gridX: number;
    gridY: number;
    autoRun: boolean;
    playersConstructors: PlayerConstructor[];
    turnTimeoutMs: number;
}

export interface PlayerConstructor {
    type: PLAYER_TYPE;
    depth?: number;
}

export interface Position {
    x: number;
    y: number;
    prev?: Position;
    targets?: MoveTarget;
}

export interface MoveTarget {
    [MOVE.FORWARD]: Position;
    [MOVE.STARBOARD]: Position;
    [MOVE.LARBOARD]: Position;
}

export interface Turn {
    userID: UUID;
    position: Position;
    grid: Grid;
    decide: DecideFunc;
}

