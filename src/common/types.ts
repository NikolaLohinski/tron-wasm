export type UUID = string;

export const enum MOVE {
    FORWARD = 'FORWARD',
    LARBOARD = 'LARBOARD',
    STARBOARD = 'STARBOARD',
}

export const enum PLAYER_TYPE {
    TS = 'TS',
}

export interface Position {
    x: number;
    y: number;
    prev?: Position;
}

export interface Grid {
    sizeX: number;
    sizeY: number;
    filled: {[xy: string]: boolean};
}

export type DecideFunc = (direction: MOVE) => void;

export interface Turn {
    position: Position;
    grid: Grid;
    decide: DecideFunc;
}

export interface Player {
    act(turn: Turn): void;
}
