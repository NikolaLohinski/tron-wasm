declare var TYPESCRIPT_BOT_WORKER: string;
declare var RUST_BOT_WORKER: string;
declare var GO_BOT_WORKER: string;

import {
  IWorker,
  MESSAGE_TYPE,
  NATIVE_WORKER_TYPE,
  WBootMessage,
  WEvent,
  WMessage,
  WRequestMessage,
  WResultMessage,
} from '@/bots/types';
import {ActFunc, Position, UUID} from '@/common/types';
import {generateUUID} from '@/common/functions';
import {Player} from '@/common/interfaces';
import {PLAYER_TYPE} from '@/common/constants';
import Grid from '@/engine/Grid';

export default class Bot implements Player {
  public static BOOT_TIMEOUT_MS = 2000;

  public readonly id: UUID;
  public readonly type: PLAYER_TYPE;
  public readonly parameters?: any;

  private worker?: IWorker;
  private actFunction?: ActFunc;
  private workerID: UUID = '';
  private idle: boolean;

  private activeRequestResolver?: () => void;

  constructor(id: UUID, type: PLAYER_TYPE, parameters?: any) {
    this.id = id;
    this.type = type;
    this.parameters = parameters ? parameters : {};
    this.idle = false;
  }

  public boot(correlationID: UUID): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
    }
    return new Promise((onSuccess, onFailure) => {
      this.workerID = generateUUID();

      switch (this.type) {
        case PLAYER_TYPE.TS:
          this.worker = new Worker(TYPESCRIPT_BOT_WORKER);
          break;
        case PLAYER_TYPE.RUST:
          this.worker = new Worker(RUST_BOT_WORKER);
          break;
        case PLAYER_TYPE.GO:
          this.worker = new Worker(GO_BOT_WORKER);
          break;
        default:
          throw Error(`unknown player type "${this.type}"`);
      }

      this.configureWorker(onSuccess, onFailure);

      const bootMessage: WBootMessage = {
        workerID: this.workerID,
        correlationID,
        type: MESSAGE_TYPE.BOOT,
        parameters: this.parameters,
      };
      this.worker.postMessage(bootMessage);
    });
  }

  public isIdle(): boolean {
    return this.idle;
  }

  public requestAction(corr: UUID, position: Position, grid: Grid, act: ActFunc): Promise<void> {
    return new Promise((resolve) => {
      if (!this.idle) {
        throw Error('can not request action of a bot that is not idle');
      }
      if (!this.worker) {
        throw Error('src has not been booted');
      }

      this.actFunction = act;
      this.activeRequestResolver = resolve;

      const requestMessage: WRequestMessage = {
        type: MESSAGE_TYPE.REQUEST,
        workerID: this.workerID,
        correlationID: corr,
        userID: this.id,
        position,
        grid,
      };
      this.worker.postMessage(requestMessage);
      this.idle = false;
    });
  }

  public destroy(): void {
    if (!this.worker) {
      throw Error('src has not been booted');
    }
    this.activeRequestResolver = undefined;
    this.worker.terminate();
    this.idle = false;
  }

  private handleWEvent(event: WEvent): void {
    const message: WMessage = event.data;

    switch (message.type) {
      case MESSAGE_TYPE.IDLE:
        if (message.origin === MESSAGE_TYPE.BOOT) {
          throw Error('can not handle events on not booted worker');
        }
        if (this.activeRequestResolver) {
          this.activeRequestResolver();
          this.activeRequestResolver = undefined;
        }
        this.idle = true;
        break;
      case MESSAGE_TYPE.RESULT:
        const resultMessage = message as WResultMessage;
        (this.actFunction as any)(message.correlationID, resultMessage.move, resultMessage.depth);
        break;
      case MESSAGE_TYPE.ERROR:
        throw Error(`worker "${message.workerID}" error`);
      default:
        throw TypeError(`unhandled message type "${message.type}"`);
    }
  }

  private handleFatalWError(event: WEvent): void {
    // tslint:disable-next-line
    console.error('[MAIN]: fatal worker error', event);
    this.destroy();
    throw Error('fatal worker error');
  }

  private configureWorker(bootSuccess: () => void, bootFailure: (failure: any) => void): void {
    if (!this.worker) {
      throw Error('worker was not created');
    }

    const self = this;
    const bootTimeout = setTimeout(() => {
      bootFailure(`boot timeout after ${Bot.BOOT_TIMEOUT_MS} ms`);
    }, Bot.BOOT_TIMEOUT_MS);

    function resolveBoot(event: WEvent) {
      const message: WMessage = event.data;
      if ((message.type) !== MESSAGE_TYPE.IDLE) {
        throw Error('unexpected boot response');
      }

      clearTimeout(bootTimeout);

      self.idle = true;
      if (!self.worker) {
        throw Error('worker was destroyed during boot');
      }

      self.worker.addEventListener(NATIVE_WORKER_TYPE.MESSAGE, self.handleWEvent.bind(self));
      self.worker.removeEventListener(NATIVE_WORKER_TYPE.MESSAGE, resolveBoot);

      bootSuccess();
    }

    this.worker.addEventListener(NATIVE_WORKER_TYPE.ERROR, this.handleFatalWError.bind(this));
    this.worker.addEventListener(NATIVE_WORKER_TYPE.MESSAGE, resolveBoot);
  }
}
