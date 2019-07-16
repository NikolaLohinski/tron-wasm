import { UUID, PLAYER_TYPE } from '@/common/types';

export const enum NATIVE_WORKER_MESSAGE_TYPE {
    MESSAGE = 'message',
    ERROR = 'error',
}

export const enum MESSAGE_TYPE {
    BOOT = 'BOOT',
    REQUEST = 'REQUEST',
    RESULT = 'RESULT',
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
}

export interface WErrorMessage extends WBaseMessage {
    type: MESSAGE_TYPE.ERROR;
    error: string;
}

export interface WRequestMessage extends WBaseMessage {
    type: MESSAGE_TYPE.REQUEST;
    content: any;
}

export interface WResultMessage extends WBaseMessage {
    type: MESSAGE_TYPE.RESULT;
    origin: MESSAGE_TYPE.BOOT | MESSAGE_TYPE.REQUEST;
    content?: any;
}

export type WMessage = WBootMessage | WErrorMessage | WRequestMessage | WResultMessage;

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
    postMessage(message: WErrorMessage | WResultMessage): void;
}
