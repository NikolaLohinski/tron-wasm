import Bot, { IBot } from '@/engine/Bot';
import { generateUUID } from '@/common/utils';
import {UUID, PLAYER_TYPE, Position, Grid, MOVE, GAME_STATE} from '@/common/types';

const DEFAULT_NUMBER_PLAYERS = 2;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export default class Game {
    private readonly players: { [id: string]: IBot };
    private readonly turnTimeoutMs: number;
    private readonly nbPlayers: number;
    private readonly grid: Grid;
    private readonly positions: { [id: string]: Position };
    private readonly movesBuffer: {[id: string]: MOVE };
    private deadPlayers: UUID[];
    private state: GAME_STATE;

    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number, turnTimeoutMs?: number, nbPlayers?: number) {
        this.state = GAME_STATE.STOPPED;
        this.grid = {
            sizeX,
            sizeY,
            filled: {},
        };
        this.turnTimeoutMs = turnTimeoutMs ? turnTimeoutMs : DEFAULT_TURN_TIMEOUT_MS;
        this.nbPlayers = nbPlayers ? nbPlayers : DEFAULT_NUMBER_PLAYERS;
        this.players = {};
        this.positions = {};
        this.movesBuffer = {};
        this.deadPlayers = [];
        for (let i = 0; i < this.nbPlayers; i++) {
            const id = generateUUID();
            this.players[id] = new Bot(id, PLAYER_TYPE.TS);
            this.movesBuffer[id] = MOVE.FORWARD;
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

    public start(): Promise<GAME_STATE | Error> {
        return new Promise((resolve, reject) => {
            if (this.currentCorrelationID !== '') {
                return reject(Error('can not start a game that has already started'));
            }

            if (![GAME_STATE.STOPPED, GAME_STATE.FINISHED].includes(this.state)) {
                return reject(Error('can not start a game that is not stopped or finished'));
            }

            const correlationID = generateUUID();

            this.deadPlayers = [];
            this.generateRandomStartPositions();

            const playersBoots = Object.values(this.players).map((player: IBot) => player.boot(correlationID));

            Promise.all(playersBoots).then(() => {
                const state = GAME_STATE.RUNNING;
                this.state = state;
                resolve(state);
            });

            this.currentCorrelationID = correlationID;
        });
    }

    public tick(): Promise<GAME_STATE | Error> {
        return new Promise((resolve) => {
            if (this.currentCorrelationID === '') {
                throw Error('can not tick a game that has not been started');
            }
            if (this.state !== GAME_STATE.RUNNING) {
                throw Error('can not tick a game that is not running');
            }
            const correlationID = generateUUID();
            this.currentCorrelationID = correlationID;
            Object.entries(this.players).forEach(([id, player]) => {
                const userID = id;

                this.movesBuffer[userID] = MOVE.FORWARD;
                const position = this.positions[userID];

                player.requestAction(correlationID, position, this.grid, (corr: UUID, move: MOVE) => {
                    if (corr === correlationID) {
                        this.movesBuffer[userID] = move;
                    } else {
                        // tslint:disable-next-line
                        console.error(`received correlation ID (${corr}) differs from current one (${correlationID})`);
                        throw Error('correlation ID out of sync');
                    }
                });
            });
            setTimeout(() => {
                const endTurnCorrelationID = generateUUID();
                this.currentCorrelationID = endTurnCorrelationID;

                this.resolveTurn();

                if (this.state !== GAME_STATE.RUNNING) {
                    Object.values(this.players).forEach((player) => player.destroy());
                    resolve(this.state);
                } else {
                    const idlePromises: Array<Promise<void>> = Object.values(this.players).map((player: IBot) => {
                        if (player.isIdle()) {
                             return new Promise((r) => r());
                        }
                        return player.boot(endTurnCorrelationID);
                    });
                    Promise.all(idlePromises).then(() => resolve(this.state));
                }
            }, this.turnTimeoutMs);
        });
    }

    private generateRandomStartPositions(): void {
        Object.keys(this.players).forEach((id) => {
            let x: number;
            let y: number;
            do {
                x = Math.floor(Math.random() * this.grid.sizeX);
                y = Math.floor(Math.random() * this.grid.sizeY);
            } while (this.isGridFilled({ x, y }));

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
            this.fillGrid(id, this.positions[id]);
        });
    }

    private resolveTurn() {
        this.resolvePlayersMoves();
        this.resolveInvalidPositions();
        this.state = (this.deadPlayers.length > this.nbPlayers - 2) ? GAME_STATE.FINISHED : GAME_STATE.RUNNING;
    }

    private resolvePlayersMoves(): void {
        Object.entries(this.movesBuffer).forEach(([userID, move]: [UUID, MOVE]) => {
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
            this.fillGrid(userID, newPosition);
        });
        return;
    }

    private resolveInvalidPositions(): void {
        Object.entries(this.positions).forEach(([userID, position]: [UUID, Position]) => {
            if (position.x < 0 || position.x >= this.grid.sizeX || position.y < 0 || position.y >= this.grid.sizeY) {
                this.deadPlayers.push(userID);
                return;
            }
            if (this.isGridInConflict(position)) {
                this.deadPlayers.push(userID);
                return;
            }
        });
        return;
    }

    private isGridInConflict(position: Position): boolean {
        if (!this.isGridFilled(position)) {
            return false;
        }
        const key = `${position.x}-${position.y}`;
        return this.grid.filled[key].length > 1;
    }

    private isGridFilled(position: Position): boolean {
        return this.grid.filled.hasOwnProperty(`${position.x}-${position.y}`);
    }

    private fillGrid(userID: UUID, position: Position): void {
        const key = `${position.x}-${position.y}`;
        if (!this.grid.filled.hasOwnProperty(key)) {
            this.grid.filled[key] = [];
        }
        this.grid.filled[key].push(userID);
    }
}
