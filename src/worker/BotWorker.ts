import {IWorkerContext, MESSAGE_TYPE, WErrorMessage, WEvent, WMessage, WResultMessage} from '@/worker/types';
import {Player, MOVE, Turn} from '@/common/types';

import NewPlayer from '@/engine/PlayerFactory';

export default class BotWorker {

    private ctx: IWorkerContext;
    private player?: Player;

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

    private handleWMessage(message: WMessage): Promise<WErrorMessage | WResultMessage | null> {
        return new Promise((resolve) => {
            switch (message.type) {
                case MESSAGE_TYPE.BOOT:
                    // tslint:disable-next-line
                    console.log(`[WORKER: ${message.workerID}]: boot order received`, message);
                    NewPlayer(message.playerType).then((player: Player) => {
                        this.player = player;
                        resolve({
                            workerID: message.workerID,
                            correlationID: message.correlationID,
                            origin: MESSAGE_TYPE.BOOT,
                            type: MESSAGE_TYPE.RESULT,
                        });
                    });
                    break;
                case MESSAGE_TYPE.REQUEST:
                    // tslint:disable-next-line
                    console.log(`[WORKER: ${message.workerID}]: request received`, message);
                    if (!this.player) {
                        throw Error('worker is not booted, can not process request message');
                    }
                    const self = this;
                    const turn: Turn = {
                        position: message.content.position,
                        grid: message.content.grid,
                        decide(move: MOVE) {
                            const result: WResultMessage = {
                                workerID: message.workerID,
                                correlationID: message.correlationID,
                                origin: MESSAGE_TYPE.REQUEST,
                                type: MESSAGE_TYPE.RESULT,
                                content: move,
                            };
                            self.ctx.postMessage(result);
                        },
                    };
                    this.player.act(turn);
                    resolve(null);
                    break;
                default:
                    throw Error(`unknown message of type '${message.type}'`);
            }
        });
    }
}
