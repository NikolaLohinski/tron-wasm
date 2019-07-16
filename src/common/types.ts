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

export type DecideFunc = (direction: MOVE) => void;

export interface Turn {
    position: Position;
    decide: DecideFunc;
}

export interface Player {
    play(turn: Turn): void;
}
