import {Position, Turn, UUID} from '@/common/types';
import {MOVE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

export interface IA {
    act(turn: Turn): void;
}

export interface Player {
    boot(correlationID: UUID): Promise<void>;

    isIdle(): boolean;

    requestAction(
        corr: UUID, position: Position, grid: Grid, act: (id: UUID, content: { move: MOVE, depth: number }) => void,
    ): void;

    destroy(): void;
}
