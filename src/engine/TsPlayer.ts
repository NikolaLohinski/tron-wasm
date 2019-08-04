import {BaseAI} from '@/common/interfaces';
import {Position, RegisterMoveFunc, Turn, UUID} from '@/common/types';
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
export class TsPlayer extends BaseAI {
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

    private static canFirstRingBeAConflict(ctx: Context, position: Position): boolean {
        const firstRing: Position[] = TsPlayer.getNearestNeighbors((position));
        for (const p of firstRing) {
            const cells = ctx.turn.grid.getCell(p);
            if (!cells) {
                continue;
            }
            const secondRing = TsPlayer.getNearestNeighbors(p).filter((n) => n !== p);
            const potentialConflict: boolean = cells.some((cell: { userID: UUID, prev: Position}) => {
                if (cell.userID === ctx.turn.userID) {
                    return false;
                }
                return secondRing.some((secondRingPosition) => {
                    return secondRingPosition.x === cell.prev.x && secondRingPosition.y === cell.prev.y;
                });
            });
            if (potentialConflict) {
                return true;
            }
        }
        return false;
    }

    private static getNearestNeighbors(position: Position): Position[] {
        return [
            { x: position.x - 1, y: position.y },
            { x: position.x + 1, y: position.y },
            { x: position.x, y: position.y - 1 },
            { x: position.x, y: position.y + 1 },
        ];
    }

    private readonly maxDepth: number;

    constructor(register: RegisterMoveFunc, maxDepth?: number) {
        super(register);
        this.maxDepth = maxDepth ? maxDepth : DEFAULT_TS_PLAYER_DEPTH;
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
        // @ts-ignore
        const abscissa = (action.target.x - action.target.prev.x !== 0) ? 'x' : 'y';
        const ordinate = (abscissa === 'x') ? 'y' : 'x';
        // @ts-ignore
        const delta = action.target[abscissa] - action.target.prev[abscissa];

        const actions = [];

        const forward: Action =  {
            origin: action.origin ? action.origin : MOVE.FORWARD,
            depth: action.depth + 1,
            score: action.score + 1,
            move: MOVE.FORWARD,
            // @ts-ignore
            target: {
                [abscissa]: action.target[abscissa] + delta,
                [ordinate]: action.target[ordinate],
                prev: action.target,
            },
        };

        if (!TsPlayer.isInvalid(ctx, forward.target)) {
            this.consumeAction(ctx, forward);
            actions.push(forward);
        }

        const larboard: Action =  {
            origin: action.origin ? action.origin : MOVE.LARBOARD,
            score: action.score + 1,
            depth: action.depth + 1,
            move: MOVE.LARBOARD,
            // @ts-ignore
            target: {
                [abscissa]: action.target[abscissa],
                [ordinate]: action.target[ordinate] + delta,
                prev: action.target,
            },
        };

        if (!TsPlayer.isInvalid(ctx, larboard.target)) {
            this.consumeAction(ctx, forward);
            actions.push(larboard);
        }
        const starboard: Action =  {
            origin: action.origin ? action.origin : MOVE.STARBOARD,
            score: action.score + 1,
            depth: action.depth + 1,
            move: MOVE.STARBOARD,
            // @ts-ignore
            target: {
                [abscissa]: action.target[abscissa],
                [ordinate]: action.target[ordinate] - delta,
                prev: action.target,
            },
        };
        if (!TsPlayer.isInvalid(ctx, starboard.target)) {
            this.consumeAction(ctx, forward);
            actions.push(starboard);
        }

        const potentialConflicts = actions.filter((a) => TsPlayer.canFirstRingBeAConflict(ctx, a.target));

        if (actions.length < 2 || potentialConflicts.length === actions.length) {
            return actions;
        }

        return actions.filter((a) => !potentialConflicts.includes(a));
    }

    private consumeAction(ctx: Context, action: Action): void {
        if (!ctx.action || action.score > ctx.action.score) {
            ctx.action = action;
            this.register(ctx.turn.correlationID, action.origin as MOVE, action.depth);
        }
    }
}
