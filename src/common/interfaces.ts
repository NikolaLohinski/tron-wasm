import {ActFunc, Position, RegisterMoveFunc, Turn, UUID} from '@/common/types';

import Grid from '@/engine/Grid';
import {PLAYER_TYPE} from '@/common/constants';

export interface AI {
    play(turn: Turn): void;
    init(register: RegisterMoveFunc, params: any): Promise<void>;
}

export interface Player {
    readonly id: UUID;
    readonly type: PLAYER_TYPE;
    readonly parameters?: any;
    boot(correlationID: UUID): Promise<void>;
    isIdle(): boolean;
    requestAction(corr: UUID, position: Position, grid: Grid, act: ActFunc): void;
    destroy(): void;
}

export class BaseAI implements AI {

    public init(register: RegisterMoveFunc, params: any): Promise<void> {
        return new Promise((resolve) => {
            this.register = register;
            resolve();
        });
    }

    public play(turn: Turn): void {
        throw Error('not implemented');
    }
    protected register: RegisterMoveFunc = () => {
        throw Error('AI has not been initialized');
    }
}
