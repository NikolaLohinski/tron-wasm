import {MOVE} from '@/common/constants';

declare var BOT_CPP_IMPORT_PATH: string;

import {BaseAI} from '@/common/interfaces';
import {RegisterMoveFunc, Turn} from '@/common/types';

const DEFAULT_CPP_PLAYER_DEPTH = 2;

export class CppWrapper extends BaseAI {

  private static FORWARD = 1;
  private static STARBOARD = 2;
  private static LARBOARD = 3;

  private maxDepth?: number;
  private run?: () => void;
  private examine?: () => number;

  public init(register: RegisterMoveFunc, params: any): Promise<void> {
    return new Promise((resolve) => {
      this.register = register;
      this.maxDepth = params.depth ? params.depth : DEFAULT_CPP_PLAYER_DEPTH;
      require(BOT_CPP_IMPORT_PATH)().then((module: any) => {
        this.run = module._run;
        this.examine = module._examine;
        resolve();
      });
    });
  }

  public play(turn: Turn): Promise<void> {
    return new Promise((resolve) => {
      // tslint:disable-next-line
      console.log(this.run ? this.run() : Error('run function not defined'));
      if (!this.examine) {
        throw Error('examine function not defined');
      }
      const moveCode = this.examine();
      let move;
      switch (moveCode) {
        case CppWrapper.STARBOARD:
          move = MOVE.STARBOARD;
          break;
        case CppWrapper.LARBOARD:
          move = MOVE.LARBOARD;
          break;
        default:
          move = MOVE.FORWARD;
      }
      this.register(turn.correlationID, move, 1);
      resolve();
    });
  }
}
