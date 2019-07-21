import {UUID, PLAYER_TYPE, Grid, Position, MOVE} from '@/common/types';

export const enum NATIVE_WORKER_MESSAGE_TYPE {
    MESSAGE = 'message',
    ERROR = 'error',
}

export const enum MESSAGE_TYPE {
    BOOT = 'BOOT',
    REQUEST = 'REQUEST',
    RESULT = 'RESULT',
    IDLE = 'IDLE',
    ERROR = 'ERROR',
}

interface WBaseMessage {
    workerID: UUID;
    correlationID: UUID;
    type: MESSAGE_TYPE;
}

export interface WBootMessage extends WBaseMessage {
    type: MESSAGE_TYPE.BOOT;
    playerType: PLAYER_TYPE;
    depth?: number;
}

export interface WErrorMessage extends WBaseMessage {
    type: MESSAGE_TYPE.ERROR;
    error: string;
}

export interface WRequestMessage extends WBaseMessage {
    type: MESSAGE_TYPE.REQUEST;
    content: {
        position: Position,
        grid: Grid,
    };
}

export interface WResultMessage extends WBaseMessage {
    type: MESSAGE_TYPE.RESULT;
    origin: MESSAGE_TYPE.REQUEST;
    content?: MOVE;
}

export interface WIdleMessage extends WBaseMessage {
    type: MESSAGE_TYPE.IDLE;
    origin: MESSAGE_TYPE.BOOT | MESSAGE_TYPE.REQUEST;
}

export type WMessage = WBootMessage | WErrorMessage | WRequestMessage | WResultMessage | WIdleMessage;

export interface WEvent extends MessageEvent {
    data: WMessage;
}

export interface IWorker {
    postMessage(message: WBootMessage | WRequestMessage): void;
    addEventListener(type: NATIVE_WORKER_MESSAGE_TYPE, callback: (event: WEvent) => void): void;
    terminate(): void;
}

export interface IWorkerContext {
    onmessage: (event: WEvent) => void;
    postMessage(message: WErrorMessage | WResultMessage | WIdleMessage): void;
}
