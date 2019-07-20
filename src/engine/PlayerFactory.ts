import {DecideFunc, Grid, MOVE, Player, PLAYER_TYPE, Position, Turn} from '@/common/types';

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

const DEFAULT_TS_PLAYER_DEPTH = 5;

class TsPlayer implements Player {
    private readonly depth: number;
    private action?: Action;
    private grid?: Grid;
    private decide?: DecideFunc;

    constructor(depth?: number) {
        this.depth = depth ? depth : DEFAULT_TS_PLAYER_DEPTH;
    }

    public act(turn: Turn): void {
        this.action = undefined;
        this.decide = turn.decide;
        this.grid = turn.grid;

        let children: Action[] = this.explore(1, turn.position, undefined);

        for (let d = 0; d < this.depth; d++) {
            const newChildren = [];
            for (const child of children) {
                newChildren.push(...this.explore(child.score, child.target, child.origin));
            }
            children = newChildren;
        }

        return;
    }

    private isInvalid(position: Position): boolean {
        if (this.grid) {
            return (
                this.grid.filled.hasOwnProperty(`${position.x}-${position.y}`)
                || position.x >= this.grid.sizeX
                || position.x < 0
                || position.y >= this.grid.sizeY
                || position.y < 0
            );
        }
        return false;
    }

    private consumeAction(action: Action): void {
        if (this.decide) {
            if (!this.action) {
                this.action = action;
                this.decide(action.move);
            }
            if (action.score > this.action.score) {
                this.decide(action.origin);
                this.action = action;
            }
        }
    }

    private explore(score: number, position: Position, origin?: MOVE): Action[] {
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

        if (!this.isInvalid(forward.target)) {
            this.consumeAction(forward);
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

        if (!this.isInvalid(larboard.target)) {
            this.consumeAction(forward);
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
        if (!this.isInvalid(starboard.target)) {
            this.consumeAction(forward);
            actions.push(starboard);
        }

        return actions;
    }
}
