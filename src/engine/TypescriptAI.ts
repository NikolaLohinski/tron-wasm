import {BaseAI} from '@/common/interfaces';
import {MoveTarget, Position, RegisterMoveFunc, Turn} from '@/common/types';
import {MOVE} from '@/common/constants';

interface Action {
    score: number;
    depth: number;
    move?: MOVE;
    target: Position;
    origin?: MOVE;
}

interface Context {
    turn: Turn;
    action?: Action;
}

const DEFAULT_TS_PLAYER_DEPTH = 5;
export class TypescriptAI extends BaseAI {

    private static positionMoveTargets(position: Position): MoveTarget {
        if (!position.prev) {
            throw Error('no previous position');
        }
        const target: MoveTarget = {} as any;
        if (position.x - position.prev.x !== 0) {
            // case of move on x abscissa
            const delta = position.x - position.prev.x;
            target[MOVE.FORWARD] = { x: position.x + delta, y: position.y, prev: position };
            target[MOVE.STARBOARD] = { x: position.x, y: position.y + delta, prev: position };
            target[MOVE.LARBOARD] = { x: position.x, y: position.y - delta, prev: position };
        } else {
            // case of move on y abscissa
            const delta = position.y - position.prev.y;
            target[MOVE.FORWARD] = { x: position.x, y: position.y + delta, prev: position };
            target[MOVE.STARBOARD] = { x: position.x - delta, y: position.y, prev: position };
            target[MOVE.LARBOARD] = { x: position.x + delta, y: position.y, prev: position };
        }
        return target;
    }

    private static isInvalid(ctx: Context, position: Position): boolean {
        if (ctx.turn.grid) {
            return (
                !!ctx.turn.grid.getCell(position)
                || position.x >= ctx.turn.grid.sizeX
                || position.x < 0
                || position.y >= ctx.turn.grid.sizeY
                || position.y < 0
            );
        }
        return false;
    }

    // @ts-ignore
    private maxDepth: number;

    public init(register: RegisterMoveFunc, params: any): Promise<void> {
        return new Promise((resolve) => {
            this.register = register;
            this.maxDepth = params.depth ? params.depth : DEFAULT_TS_PLAYER_DEPTH;
            resolve();
        });
    }

    public play(turn: Turn): void {
        const ctx: Context = { turn };

        const root: Action = {
            target: turn.position,
            depth: 0,
            score: 0,
        };
        let children: Action[] = [root];

        for (let d = 0; d < this.maxDepth; d++) {
            const newChildren = [];
            for (const child of children) {
                newChildren.push(...this.explore(ctx, child));
            }
            children = newChildren
                .map((a) => ({index: Math.random(), child: a}))
                .sort((a, b) => a.index - b.index)
                .map((a) => a.child);
        }

        return;
    }

    private explore(ctx: Context, action: Action): Action[] {
        const actions = [];
        const targets = TypescriptAI.positionMoveTargets(action.target);

        const forward: Action =  {
            origin: action.origin ? action.origin : MOVE.FORWARD,
            depth: action.depth + 1,
            score: action.score + 1,
            move: MOVE.FORWARD,
            target: targets[MOVE.FORWARD],
        };
        if (!TypescriptAI.isInvalid(ctx, forward.target)) {
            this.consumeAction(ctx, forward);
            actions.push(forward);
        }

        const larboard: Action =  {
            origin: action.origin ? action.origin : MOVE.LARBOARD,
            score: action.score + 1,
            depth: action.depth + 1,
            move: MOVE.LARBOARD,
            target: targets[MOVE.LARBOARD],
        };
        if (!TypescriptAI.isInvalid(ctx, larboard.target)) {
            this.consumeAction(ctx, forward);
            actions.push(larboard);
        }

        const starboard: Action =  {
            origin: action.origin ? action.origin : MOVE.STARBOARD,
            score: action.score + 1,
            depth: action.depth + 1,
            move: MOVE.STARBOARD,
            target: targets[MOVE.STARBOARD],
        };
        if (!TypescriptAI.isInvalid(ctx, starboard.target)) {
            this.consumeAction(ctx, forward);
            actions.push(starboard);
        }

        return actions;
    }

    private consumeAction(ctx: Context, action: Action): void {
        if (!ctx.action || action.score > ctx.action.score) {
            ctx.action = action;
            this.register(ctx.turn.correlationID, action.origin as MOVE, action.depth);
        }
    }
}
