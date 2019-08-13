import {
    IWorkerContext,
    MESSAGE_TYPE,
    WErrorMessage,
    WEvent,
    WMessage,
    WResultMessage,
    WIdleMessage,
} from '@/workers/types';
import {RegisterMoveFunc} from '@/common/types';

import {AI} from '@/common/interfaces';
import Grid from '@/engine/Grid';

export default class Wrapper {

    private readonly ctx: IWorkerContext;
    private readonly player: AI;

    constructor(ctx: IWorkerContext, player: AI) {
        this.ctx = ctx;
        this.player = player;
    }

    public handleWEvent(event: WEvent) {
        const message: WMessage = event.data;

        this.handleWMessage(message)
            .then((response) => {
                if (response) {
                    this.ctx.postMessage(response);
                }
            })
            .catch((e) => {
                const err: WErrorMessage = {
                    workerID: message.workerID,
                    correlationID: message.correlationID,
                    type: MESSAGE_TYPE.ERROR,
                    error: e.toString(),
                };
                // tslint:disable-next-line
                console.error(e);
                this.ctx.postMessage(err);
        });
    }

    private handleWMessage(message: WMessage): Promise<WErrorMessage | WResultMessage | WIdleMessage | null> {
        return new Promise((resolve) => {
            switch (message.type) {
                case MESSAGE_TYPE.BOOT:
                    const register: RegisterMoveFunc = (correlationID, move, depth) => {
                        const result: WResultMessage = {
                            correlationID,
                            type: MESSAGE_TYPE.RESULT,
                            workerID: message.workerID,
                            origin: MESSAGE_TYPE.REQUEST,
                            depth,
                            move,
                        };
                        this.ctx.postMessage(result);
                    };
                    this.player.init(register, message.parameters).then(() => {
                        resolve({
                            workerID: message.workerID,
                            correlationID: message.correlationID,
                            origin: MESSAGE_TYPE.BOOT,
                            type: MESSAGE_TYPE.IDLE,
                        });
                    });
                    break;
                case MESSAGE_TYPE.REQUEST:
                    this.player.play({
                        correlationID: message.correlationID,
                        userID: message.userID,
                        position: message.position,
                        grid: Grid.parse(message.grid),
                    });

                    const idleMessage: WIdleMessage = {
                        workerID: message.workerID,
                        correlationID: message.correlationID,
                        origin: MESSAGE_TYPE.REQUEST,
                        type: MESSAGE_TYPE.IDLE,
                    };
                    resolve(idleMessage);
                    break;
                default:
                    throw Error(`unknown message of type '${message.type}'`);
            }
        });
    }
}
