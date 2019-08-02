import {ActFunc, Position, RegisterMoveFunc, Turn, UUID} from '@/common/types';
import {Grid} from '@/engine/Grid';

export interface AI {
    play(turn: Turn): void;
}

export interface Player {
    boot(correlationID: UUID): Promise<void>;
    isIdle(): boolean;
    requestAction(corr: UUID, position: Position, grid: Grid, act: ActFunc): void;
    destroy(): void;
}

export class BaseAI implements AI {
    protected register: RegisterMoveFunc;
    constructor(register: RegisterMoveFunc) {
        this.register = register;
    }

    public play(turn: Turn): void {
        throw Error('not implemented');
    }
}
