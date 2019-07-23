import {MOVE, Player, PLAYER_TYPE, Position, Turn} from '@/common/types';

export default function NewPlayer(type: PLAYER_TYPE, depth?: number): Promise<Player> {
    return new Promise((resolve) => {
        switch (type) {
            case PLAYER_TYPE.TS:
                    resolve(new TsPlayer(depth));
                    break;
            default:
                throw TypeError(`unknown player of type "${type}"`);
        }
    });
}

interface Action {
    score: number;
    move: MOVE;
    target: Position;
    origin: MOVE;
}

interface Context {
    turn: Turn;
    action?: Action;
}

const DEFAULT_TS_PLAYER_DEPTH = 5;

class TsPlayer implements Player {
    private static isInvalid(ctx: Context, position: Position): boolean {
        if (ctx.turn.grid) {
            return (
                ctx.turn.grid.filled.hasOwnProperty(`${position.x}-${position.y}`)
                || position.x >= ctx.turn.grid.sizeX
                || position.x < 0
                || position.y >= ctx.turn.grid.sizeY
                || position.y < 0
            );
        }
        return false;
    }

    private static consumeAction(ctx: Context, action: Action): void {
        if (ctx.turn.decide) {
            if (!ctx.action) {
                ctx.action = action;
                ctx.turn.decide(action.move);
            }
            if (action.score > ctx.action.score) {
                ctx.turn.decide(action.origin);
                ctx.action = action;
            }
        }
    }

    private static explore(ctx: Context, score: number, position: Position, origin?: MOVE): Action[] {
        // @ts-ignore
        const abscissa = (position.x - position.prev.x !== 0) ? 'x' : 'y';
        const ordinate = (abscissa === 'x') ? 'y' : 'x';
        // @ts-ignore
        const delta = position[abscissa] - position.prev[abscissa];

        const actions = [];

        const forward: Action =  {
            origin: origin ? origin : MOVE.FORWARD,
            score: score + 1,
            move: MOVE.FORWARD,
            // @ts-ignore
            target: {
                [abscissa]: position[abscissa] + delta,
                [ordinate]: position[ordinate],
                prev: position,
            },
        };

        if (!TsPlayer.isInvalid(ctx, forward.target)) {
            TsPlayer.consumeAction(ctx, forward);
            actions.push(forward);
        }

        const larboard: Action =  {
            origin: origin ? origin : MOVE.LARBOARD,
            score: score + 1,
            move: MOVE.LARBOARD,
            // @ts-ignore
            target: {
                [abscissa]: position[abscissa],
                [ordinate]: position[ordinate] + delta,
                prev: position,
            },
        };

        if (!TsPlayer.isInvalid(ctx, larboard.target)) {
            TsPlayer.consumeAction(ctx, forward);
            actions.push(larboard);
        }
        const starboard: Action =  {
            origin: origin ? origin : MOVE.STARBOARD,
            score: score + 1,
            move: MOVE.STARBOARD,
            // @ts-ignore
            target: {
                [abscissa]: position[abscissa],
                [ordinate]: position[ordinate] - delta,
                prev: position,
            },
        };
        if (!TsPlayer.isInvalid(ctx, starboard.target)) {
            TsPlayer.consumeAction(ctx, forward);
            actions.push(starboard);
        }

        return actions;
    }

    private readonly depth: number;

    constructor(depth?: number) {
        this.depth = depth ? depth : DEFAULT_TS_PLAYER_DEPTH;
    }

    public act(turn: Turn): void {
        const ctx: Context = { turn };

        let children: Action[] = TsPlayer.explore(ctx, 1, ctx.turn.position, undefined);

        for (let d = 0; d < this.depth; d++) {
            const newChildren = [];
            for (const child of children) {
                newChildren.push(...TsPlayer.explore(ctx, child.score, child.target, child.origin));
            }
            children = newChildren
                .map((a) => ({index: Math.random(), child: a}))
                .sort((a, b) => a.index - b.index)
                .map((a) => a.child);
        }

        return;
    }
}
