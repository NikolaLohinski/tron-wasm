export type UUID = string;

export interface Color {
    name: string;
    code: string;
}

export interface PlayerMetadata {
    name: string;
    id: UUID;
    color: string;
}

export const enum MOVE {
    FORWARD = 'FORWARD',
    LARBOARD = 'LARBOARD',
    STARBOARD = 'STARBOARD',
}

export const enum GAME_STATUS {
    STOPPED = 'STOPPED',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
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
    filled: {[xy: string]: UUID[]};
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
