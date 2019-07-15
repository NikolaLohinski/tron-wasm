import Bot from '@/engine/Bot';
import { generateUUID } from '@/common/utils';
import { UUID } from '@/common/types';

export const GAME_NUMBER_PLAYERS = 2;

export default class Game {
    private players: { [id: string]: Bot };
    private grid: { sizeX: number, sizeY: number };
    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number) {
        this.grid = {
            sizeX,
            sizeY,
        };
        this.players = {};
        for (let i = 0; i < GAME_NUMBER_PLAYERS; i++) {
            const id = generateUUID();
            this.players[id] = new Bot(id);
        }
    }

    public start(): Promise<void> {
        if (this.currentCorrelationID !== '') {
            throw Error('can not start a game that has already started');
        }
        return new Promise((resolve) => {
            this.currentCorrelationID = generateUUID();
            Promise.all(Object.values(this.players).map((player: Bot) => player.boot(this.currentCorrelationID)))
                .then(() => resolve());
        });
    }
}
