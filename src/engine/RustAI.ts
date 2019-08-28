declare var BOT_RUST_IMPORT_PATH: string;

import {BaseAI} from '@/common/interfaces';
import {RegisterMoveFunc, Turn} from '@/common/types';
import {MOVE} from '@/common/constants';

const DEFAULT_RUST_PLAYER_DEPTH = 2;

let move: RegisterMoveFunc;

// Imported from RUST, this should be not used otherwise
export function act(correlationId: string, direction: MOVE, depth: number) {
  move(correlationId, direction, depth);
}

export class RustAI extends BaseAI {
  private module?: any;
  private maxDepth?: number;

  public init(register: RegisterMoveFunc, params: any): Promise<void> {
    return new Promise((resolve) => {
      move = register;
      this.maxDepth = params.depth ? params.depth : DEFAULT_RUST_PLAYER_DEPTH;
      import(BOT_RUST_IMPORT_PATH).then((module) => {
        this.module = module;
        resolve();
      });
    });
  }

  public play(turn: Turn): void {
    if (!turn.position.prev) {
      turn.position.prev = turn.position;
    }
    const position = this.module.Position.new(
      turn.position.x,
      turn.position.y,
      turn.position.prev.x,
      turn.position.prev.y,
    );
    const grid = this.module.Grid.new(
      turn.grid.sizeX,
      turn.grid.sizeY,
      turn.grid.toJson(),
    );

    this.module.play(turn.correlationID, position, grid, this.maxDepth);
  }
}
