import {
    IWorkerContext,
    MESSAGE_TYPE,
    WErrorMessage,
    WEvent,
    WMessage,
    WResultMessage,
    WIdleMessage,
} from '@/worker/types';
import {RegisterMoveFunc, Turn, UUID} from '@/common/types';

import NewPlayer from '@/engine/PlayerFactory';
import {AI} from '@/common/interfaces';
import {MOVE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

export default class BotWorker {

    private ctx: IWorkerContext;
    private player?: AI;

    constructor(ctx: IWorkerContext) {
        this.ctx = ctx;
    }

    public handleWEvent(event: WEvent) {
        // tslint:disable-next-line
        const message: WMessage = event.data;

        this.handleWMessage(message)
            .then((response) => {
                if (response) {
                    this.ctx.postMessage(response);
                }
            })
            .catch((e) => {
                // tslint:disable-next-line
                console.error(`[WORKER: ${message.workerID}]: error`, e);
                const err: WErrorMessage = {
                    workerID: message.workerID,
                    correlationID: message.correlationID,
                    type: MESSAGE_TYPE.ERROR,
                    error: e.toString(),
                };
                this.ctx.postMessage(err);
        });
    }

    private handleWMessage(message: WMessage): Promise<WErrorMessage | WResultMessage | WIdleMessage | null> {
        return new Promise((resolve) => {
            switch (message.type) {
                case MESSAGE_TYPE.BOOT:
                    // tslint:disable-next-line
                    // console.log(`[WORKER: ${message.workerID}]: boot order received`, message);
                    const register: RegisterMoveFunc = (correlationID, direction, depth) => {
                        const result: WResultMessage = {
                            type: MESSAGE_TYPE.RESULT,
                            workerID: message.workerID,
                            correlationID,
                            origin: MESSAGE_TYPE.REQUEST,
                            content: {
                                depth,
                                move: direction,
                            },
                        };
                        this.ctx.postMessage(result);
                    };
                    NewPlayer(message.playerType, register.bind(this), message.depth)
                        .then((player: AI) => {
                            this.player = player;
                            resolve({
                                workerID: message.workerID,
                                correlationID: message.correlationID,
                                origin: MESSAGE_TYPE.BOOT,
                                type: MESSAGE_TYPE.IDLE,
                            });
                        });
                    break;
                case MESSAGE_TYPE.REQUEST:
                    // tslint:disable-next-line
                    // console.log(`[WORKER: ${message.workerID}]: request received`, message.content.position);
                    if (!this.player) {
                        throw Error('worker is not booted, can not process request message');
                    }
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
