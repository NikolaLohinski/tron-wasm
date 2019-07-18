import {Player, Turn, MOVE, PLAYER_TYPE} from '@/common/types';

export default function NewPlayer(type: PLAYER_TYPE): Promise<Player> {
    return new Promise((resolve) => {
        switch (type) {
            case PLAYER_TYPE.TS:
                    resolve(new TsPlayer());
                    break;
            default:
                throw TypeError(`unknown player of type "${type}"`);
        }
    });
}

class TsPlayer implements Player {
    public act(turn: Turn): void {
        turn.decide(MOVE.FORWARD);
        return;
    }
}
