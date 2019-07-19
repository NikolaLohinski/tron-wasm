import Bot from '@/engine/Bot';
import { generateUUID } from '@/common/utils';
import {UUID, PLAYER_TYPE, Position, Grid, MOVE} from '@/common/types';

const DEFAULT_NUMBER_PLAYERS = 2;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export default class Game {
    private readonly players: { [id: string]: Bot };
    private readonly turnTimeoutMs: number;
    private readonly grid: Grid;
    private readonly positions: { [id: string]: Position };

    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number, turnTimeoutMs?: number, nbPlayers?: number) {
        this.grid = {
            sizeX,
            sizeY,
            filled: {},
        };
        this.turnTimeoutMs = turnTimeoutMs ? turnTimeoutMs : DEFAULT_TURN_TIMEOUT_MS;
        this.players = {};
        this.positions = {};
        for (let i = 0; i < (nbPlayers || DEFAULT_NUMBER_PLAYERS); i++) {
            const id = generateUUID();
            this.players[id] = new Bot(id, PLAYER_TYPE.TS);
            this.positions[id] = {
                x: -1,
                y: -1,
            };
        }
    }

    public getPlayersIDs(): UUID[] {
        return Object.keys(this.players);
    }

    public getPosition(playerID: UUID): Position {
        const position = this.positions[playerID];
        if (!position) {
            throw Error(`unknown player with ID: "${playerID}"`);
        }
        return position;
    }

    public start(): Promise<void | Error> {
        return new Promise((resolve, reject) => {
            if (this.currentCorrelationID !== '') {
                return reject(Error('can not start a game that has already started'));
            }

            const correlationID = generateUUID();

            this.generateRandomStartPositions();

            const playersBoots = Object.values(this.players).map((player: Bot) => player.boot(correlationID));

            Promise.all(playersBoots).then(() => resolve());

            this.currentCorrelationID = correlationID;
        });
    }

    public tick(): Promise<void | Error> {
        return new Promise((resolve) => {
            if (this.currentCorrelationID === '') {
                throw Error('can not tick a game that has not been started');
            }
            const correlationID = generateUUID();
            this.currentCorrelationID = correlationID;
            Object.entries(this.players).forEach(([id, player]) => {
                const position = this.positions[id];
                player.requestAction(correlationID, position, this.grid, this.newDecideFunction(correlationID, id));
            });
            setTimeout(() => {
                resolve();
            }, this.turnTimeoutMs);
        });
    }

    private generateRandomStartPositions(): void {
        Object.keys(this.players).forEach((id) => {
            let conflict = false;
            let x: number;
            let y: number;
            do {
                x = Math.floor(Math.random() * this.grid.sizeX);
                y = Math.floor(Math.random() * this.grid.sizeY);

                conflict = Object.entries(this.positions).some(([otherId, position]) => {
                    if (otherId !== id) {
                        return position.x === x && position.y === y;
                    }
                    return false;
                });
            } while (conflict);

            const possiblePreviousPositions: Position[] = [
                { x: x - 1, y },
                { x: x + 1, y },
                { x , y: y - 1 },
                { x , y: y + 1 },
            ];
            const prev = possiblePreviousPositions[Math.floor(possiblePreviousPositions.length * Math.random())];

            this.positions[id] = {
                x,
                y,
                prev,
            };
        });
    }

    private newDecideFunction(correlationID: UUID, userID: UUID): (corr: UUID, move: MOVE) => void {
        return (corr: UUID, move: MOVE) => {
            if (corr === correlationID) {
                const position = this.positions[userID];
                // @ts-ignore
                const abscissa = (position.x - position.prev.x !== 0) ? 'x' : 'y';
                const ordinate = (abscissa === 'x') ? 'y' : 'x';
                // @ts-ignore
                const delta = position[abscissa] - position.prev[abscissa];

                const newPosition: Position = {
                    x: -1,
                    y: -1,
                    prev: position,
                };
                switch (move) {
                    case MOVE.FORWARD:
                        newPosition[abscissa] = position[abscissa] + delta;
                        newPosition[ordinate] = position[ordinate];
                        break;
                    case MOVE.STARBOARD:
                        newPosition[abscissa] = position[abscissa];
                        newPosition[ordinate] = position[ordinate] - delta;
                        break;
                    case MOVE.LARBOARD:
                        newPosition[abscissa] = position[abscissa];
                        newPosition[ordinate] = position[ordinate] + delta;
                        break;
                    default:
                        throw Error(`unknown move "${move}"`);
                }

                this.positions[userID] = newPosition;
            } else {
                throw Error('correlation ID out of sync');
            }
            return;
        };
    }
}
