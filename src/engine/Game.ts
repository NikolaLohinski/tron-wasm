import Bot from '@/engine/Bot';
import { generateUUID } from '@/common/utils';
import { UUID, PLAYER_TYPE } from '@/common/types';

const DEFAULT_NUMBER_PLAYERS = 2;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export default class Game {
    private readonly players: { [id: string]: Bot };
    private grid: { sizeX: number, sizeY: number };
    private turnTimeoutMs: number;
    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number, turnTimeoutMs?: number, nbPlayers?: number) {
        this.grid = {
            sizeX,
            sizeY,
        };
        this.turnTimeoutMs = turnTimeoutMs ? turnTimeoutMs : DEFAULT_TURN_TIMEOUT_MS;
        this.players = {};
        for (let i = 0; i < (nbPlayers || DEFAULT_NUMBER_PLAYERS); i++) {
            const id = generateUUID();
            this.players[id] = new Bot(id, PLAYER_TYPE.TS);
        }
    }

    public start(): Promise<void> {
        if (this.currentCorrelationID !== '') {
            throw Error('can not start a game that has already started');
        }
        return new Promise((resolve) => {
            const correlationID = generateUUID();

            const playersBoots = Object.values(this.players).map((player: Bot) => player.boot(correlationID));

            Promise.all(playersBoots).then(() => resolve());

            this.currentCorrelationID = correlationID;
        });
    }

    public tick(): Promise<void> {
        return new Promise((resolve) => {
           resolve();
        });
    }
}
