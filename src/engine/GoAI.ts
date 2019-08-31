declare var BOT_GO_IMPORT_PATH: string;

import {BaseAI} from '@/common/interfaces';
import {RegisterMoveFunc, Turn} from '@/common/types';

const DEFAULT_GO_PLAYER_DEPTH = 2;

export class GoAI extends BaseAI {
  private go: any;
  private maxDepth?: number;

  public init(register: RegisterMoveFunc, params: any): Promise<void> {
    return new Promise((resolve) => {
      import(BOT_GO_IMPORT_PATH).then(async ({ default: go }) => {
        this.register = register;
        this.go = go;
        this.maxDepth = params.depth ? params.depth : DEFAULT_GO_PLAYER_DEPTH;
        resolve();
      });
    });
  }

  public play(turn: Turn): Promise<void> {
    const position = JSON.stringify(turn.position);
    const grid = JSON.stringify(turn.grid);
    return this.go.play(this.register, turn.correlationID, position, grid, this.maxDepth);
  }
}
