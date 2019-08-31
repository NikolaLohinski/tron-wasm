import {BaseAI} from '@/common/interfaces';
import {Position, RegisterMoveFunc, Turn} from '@/common/types';
import {MOVE} from '@/common/constants';

interface Node {
  depth: number;
  move: MOVE;
  origin?: MOVE;
  position: Position;
}

interface Context {
  turn: Turn;
  map: { [position: string]: Node };
  scores: {
    [MOVE.FORWARD]: number,
    [MOVE.STARBOARD]: number,
    [MOVE.LARBOARD]: number,
  };
}

const DEFAULT_TS_PLAYER_DEPTH = 5;

export class TypescriptAI extends BaseAI {

  private depth?: number;
  private log: boolean = false;

  public init(register: RegisterMoveFunc, params: any): Promise<void> {
    return new Promise((resolve) => {
      this.register = register;
      this.depth = params.depth ? params.depth : DEFAULT_TS_PLAYER_DEPTH;
      this.log = !!params.log;
      resolve();
    });
  }

  public play(turn: Turn): Promise<void> {
    return new Promise((resolve) => {
      const ctx: Context = {
        turn,
        map: {},
        scores: {
          [MOVE.FORWARD]: 0,
          [MOVE.STARBOARD]: 0,
          [MOVE.LARBOARD]: 0,
        },
      };
      let nodes: Node[] = [{ depth: 0, position: turn.position } as Node];
      for (let depth = 0; depth <= (this.depth || DEFAULT_TS_PLAYER_DEPTH); depth++) {
        nodes = this.mergeChildren(ctx, ...nodes);
        for (const node of nodes) {
          this.evaluateNode(ctx, node);
        }
        this.evaluateContext(ctx, depth);
      }

      resolve();
    });
  }

  // Returns [FORWARD, STARBOARD, LARBOARD]
  private positionMoveTargets(position: Position): [Position, Position, Position] {
    if (!position.prev) {
      throw Error('no previous position');
    }
    const [abscissa, ordinate, direct]: [string, string, number] = (
      position.x - position.prev.x !== 0
    ) ? ['x', 'y', 1] : ['y', 'x', -1];

    // @ts-ignore
    const delta = position[abscissa] - position.prev[abscissa];
    const positions = [
      // FORWARD
      // @ts-ignore
      { [abscissa]: position[abscissa] + delta, [ordinate]: position[ordinate] },
      // STARBOARD
      // @ts-ignore
      { [abscissa]: position[abscissa], [ordinate]: position[ordinate] + delta * direct },
      // LARBOARD
      // @ts-ignore
      { [abscissa]: position[abscissa], [ordinate]: position[ordinate] - delta * direct },
    ] as [Position, Position, Position];

    positions.forEach((p: Position) => p.prev = { x: position.x, y: position.y });

    return positions;
  }

  private isInvalid(ctx: Context, position: Position): boolean {
    return (
      position.x >= ctx.turn.grid.sizeX
      || position.x < 0
      || position.y >= ctx.turn.grid.sizeY
      || position.y < 0
      || !!ctx.turn.grid.getCell(position)
    );
  }

  private getChildrenNodes(ctx: Context, node: Node): Node[] {
    const [forward, starboard, larboard] = this.positionMoveTargets(node.position);
    const children = [
      {
        depth: node.depth + 1,
        move: MOVE.FORWARD,
        origin: node.origin || MOVE.FORWARD,
        position: forward,
      },
      {
        depth: node.depth + 1,
        move: MOVE.STARBOARD,
        origin: node.origin || MOVE.STARBOARD,
        position: starboard,
      },
      {
        depth: node.depth + 1,
        move: MOVE.LARBOARD,
        origin: node.origin || MOVE.LARBOARD,
        position: larboard,
      },
    ];
    return children.filter((n: Node) => !this.isInvalid(ctx, n.position));
  }

  private mergeChildren(ctx: Context, ...nodes: Node[]): Node[] {
    return nodes
      .reduce((children: Node[], node) => {
        return children.concat(this.getChildrenNodes(ctx, node));
      }, [])
      .map((a) => ({ index: Math.random(), child: a }))
      .sort((a, b) => a.index - b.index)
      .map((a) => a.child);
  }

  private evaluateNode(ctx: Context, node: Node): void {
    const hash = `${node.position.x}-${node.position.y}`;
    const hashed = ctx.map[hash];
    if (!hashed) {
      ctx.map[hash] = node;
      ctx.scores[node.origin as MOVE] += node.depth;
    } else if (hashed.depth < node.depth) {
      ctx.scores[node.origin as MOVE] += node.depth;
      ctx.scores[hashed.origin as MOVE] -= hashed.depth;
      ctx.map[hash] = node;
    }
  }

  private evaluateContext(ctx: Context, depth: number): void {
    const action: MOVE = Object
      .entries(ctx.scores)
      .reduce((currentAction: MOVE, [move, score]: [string, number]): MOVE => {
        return (ctx.scores[currentAction] < score) ? move as MOVE : currentAction;
      }, MOVE.FORWARD);
    this.register(ctx.turn.correlationID, action, depth);
  }

  private info(...args: any[]): void {
    if (this.log) {
      // tslint:disable-next-line
      console.log(...args);
    }
  }

  private error(...args: any[]): void {
    if (this.log) {
      // tslint:disable-next-line
      console.error(...args);
    }
  }
}
