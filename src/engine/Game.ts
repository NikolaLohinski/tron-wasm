import Bot, {IBot} from '@/engine/Bot';
import {generateUUID} from '@/common/utils';
import {GAME_STATUS, Grid, MOVE, MoveTarget, PLAYER_TYPE, Position, UUID} from '@/common/types';

const DEFAULT_NUMBER_PLAYERS = 2;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export default class Game {

    private static positionKey(position: Position): string {
        return `${position.x}-${position.y}`;
    }

    private static positionMoveTargets(position: Position): MoveTarget {
        // @ts-ignore
        const abscissa = (position.x - position.prev.x !== 0) ? 'x' : 'y';
        const ordinate = (abscissa === 'x') ? 'y' : 'x';
        // @ts-ignore
        const delta = position[abscissa] - position.prev[abscissa];

        return {
            // @ts-ignore
            [MOVE.FORWARD]: {
                [abscissa]: position[abscissa] + delta,
                [ordinate]: position[ordinate],
            },
            // @ts-ignore
            [MOVE.LARBOARD]: {
                [abscissa]: position[abscissa],
                [ordinate]: position[ordinate] + delta,
            },
            // @ts-ignore
            [MOVE.STARBOARD]: {
                [abscissa]: position[abscissa],
                [ordinate]: position[ordinate] - delta,
            },
        };
    }

    private readonly players: { [id: string]: IBot };
    private readonly turnTimeoutMs: number;
    private readonly nbPlayers: number;
    private readonly grid: Grid;
    private readonly positions: { [id: string]: Position };
    private readonly movesBuffer: {[id: string]: MOVE };
    private deadPlayers: UUID[];
    private state: GAME_STATUS;

    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number, turnTimeoutMs?: number, nbPlayers?: number) {
        this.state = GAME_STATUS.CLEAR;
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
            this.players[id] = new Bot(id, PLAYER_TYPE.TS, 8);
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

    public isDead(playerID: UUID): boolean {
        return this.deadPlayers.includes(playerID);
    }

    public getPosition(playerID: UUID): Position {
        const position = this.positions[playerID];
        if (!position) {
            throw Error(`unknown player with ID: "${playerID}"`);
        }
        return position;
    }

    public start(): Promise<GAME_STATUS | Error> {
        return new Promise((resolve, reject) => {
            if (this.currentCorrelationID !== '') {
                return reject(Error('can not start a game that has already started'));
            }

            if (![GAME_STATUS.CLEAR, GAME_STATUS.FINISHED].includes(this.state)) {
                return reject(Error('can not start a game that is not stopped or finished'));
            }

            const correlationID = generateUUID();

            this.deadPlayers = [];
            this.generateRandomStartPositions();

            const playersBoots = Object.values(this.players).map((player: IBot) => player.boot(correlationID));

            Promise.all(playersBoots).then(() => {
                const state = GAME_STATUS.RUNNING;
                this.state = state;
                resolve(state);
            });

            this.currentCorrelationID = correlationID;
        });
    }

    public tick(): Promise<GAME_STATUS | Error> {
        return new Promise((resolve) => {
            if (this.currentCorrelationID === '') {
                throw Error('can not tick a game that has not been started');
            }
            if (this.state !== GAME_STATUS.RUNNING) {
                throw Error('can not tick a game that is not running');
            }
            const correlationID = generateUUID();
            this.currentCorrelationID = correlationID;
            Object.entries(this.players).filter(([id, _]: [UUID, IBot]) => {
                return !this.deadPlayers.includes(id);
            }).forEach(([id, player]: [UUID, IBot]) => {
                const userID = id;

                this.movesBuffer[userID] = MOVE.FORWARD;
                const position = this.positions[userID];

                player.requestAction(correlationID, position, this.grid, (corr: UUID, move: MOVE) => {
                    if (corr === correlationID) {
                        this.movesBuffer[userID] = move;
                    } else {
                        // tslint:disable-next-line
                        console.error(`received correlation ID (${corr}) differs from current one (${correlationID})`);
                    }
                });
            });
            setTimeout(() => {
                const endTurnCorrelationID = generateUUID();
                this.currentCorrelationID = endTurnCorrelationID;

                this.resolveTurn();

                if (this.state !== GAME_STATUS.RUNNING) {
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
                x = 1 + Math.floor(Math.random() * (this.grid.sizeX - 2));
                y = 1 + Math.floor(Math.random() * (this.grid.sizeY - 2));
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
        this.resolvePlayersPositions();
        this.resolveDeadPlayers();
        this.state = (this.nbPlayers - this.deadPlayers.length < 2) ? GAME_STATUS.FINISHED : GAME_STATUS.RUNNING;
    }

    private resolvePlayersPositions(): void {
        Object.entries(this.movesBuffer).filter(([id]: [UUID, MOVE]) => {
            return !this.deadPlayers.includes(id);
        }).forEach(([userID, move]: [UUID, MOVE]) => {
            const position = this.positions[userID];

            if (position.prev) {
                delete(position.prev.prev);
            }
            const newPosition = Game.positionMoveTargets(position)[move];

            newPosition.prev = position;
            newPosition.targets = Game.positionMoveTargets(newPosition);

            this.positions[userID] = newPosition;

            this.fillGrid(userID, newPosition);
        });
        return;
    }

    private resolveDeadPlayers(): void {
        this.deadPlayers = Object.entries(this.positions).filter(([id, position]: [UUID, Position]) => {
            if (position.x < 0
                || position.x >= this.grid.sizeX
                || position.y < 0
                || position.y >= this.grid.sizeY
            ) {
                return true;
            }
            const conflictIDs = this.getConflictIds(position);
            if (conflictIDs.length === 0) {
                return false;
            }
            if (conflictIDs.length > 1 || conflictIDs[0] !== id) {
                return true;
            }
        }).map(([userID]: [UUID, Position]) => userID);
        return;
    }

    private getConflictIds(position: Position): UUID[] {
        if (!this.isGridFilled(position)) {
            return [];
        }
        return this.grid.filled[Game.positionKey(position)];
    }

    private isGridFilled(position: Position): boolean {
        return this.grid.filled.hasOwnProperty(Game.positionKey(position));
    }

    private fillGrid(userID: UUID, position: Position): void {
        const key = Game.positionKey(position);
        if (!this.grid.filled.hasOwnProperty(key)) {
            this.grid.filled[key] = [];
        }
        this.grid.filled[key].push(userID);
    }
}
