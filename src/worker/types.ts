import { UUID } from '@/common/types';

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

export interface IBotWorker {
    postMessage: (message: WMessage) => void;
    onmessage: (event: WEvent) => void;
    onerror: (err: Error) => void;
    terminate: () => void;
}
