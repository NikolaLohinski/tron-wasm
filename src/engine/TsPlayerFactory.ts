import { Player, Turn, MOVE } from '@/common/types';

export default function NewTsPlayer(): Promise<Player> {
    return new Promise((resolve) => {
        resolve(new TsPlayer());
    });
}

class TsPlayer implements Player {
    public play(turn: Turn): void {
        turn.decide(MOVE.FORWARD);
        return;
    }
}
