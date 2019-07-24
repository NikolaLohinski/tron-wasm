import Bot from '@/engine/Bot';
import {generateUUID} from '@/common/functions';
import {MoveTarget, PlayerConstructor, PlayerPerformance, Position, UUID} from '@/common/types';
import {Player} from '@/common/interfaces';
import {GAME_STATUS, MOVE, PLAYER_TYPE} from '@/common/constants';
import {Grid} from '@/engine/Grid';

const DEFAULT_PLAYERS_CONSTRUCTORS: PlayerConstructor[] = new Array(2).fill({
    type: PLAYER_TYPE.TS,
    depth: 5,
});
const DEFAULT_TURN_TIMEOUT_MS = 100;

interface Protagonist {
    player: Player;
    position: Position;
    move: MOVE;
    depth: number;
    duration: number;
    dead: boolean;
    type: PLAYER_TYPE;
}

export default class Game {
    public static INIT_GAME_STATUS = GAME_STATUS.CLEAR;
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

    private readonly protagonists: { [id: string]: Protagonist };
    private readonly turnTimeoutMs: number;
    private readonly nbPlayers: number;
    private readonly grid: Grid;
    private referenceTime: number;
    private state: GAME_STATUS;

    private currentCorrelationID: UUID = '';

    constructor(sizeX: number, sizeY: number, turnTimeoutMs?: number, playersConstructors?: PlayerConstructor[]) {
        this.state = Game.INIT_GAME_STATUS;
        this.grid = new Grid(sizeX, sizeY);
        this.turnTimeoutMs = turnTimeoutMs ? turnTimeoutMs : DEFAULT_TURN_TIMEOUT_MS;
        this.nbPlayers = playersConstructors ? playersConstructors.length : DEFAULT_PLAYERS_CONSTRUCTORS.length;
        this.protagonists = {};
        this.referenceTime = 0;
        for (const constructor of playersConstructors || DEFAULT_PLAYERS_CONSTRUCTORS) {
            const id = generateUUID();
            this.protagonists[id] = {
                type: constructor.type,
                player: new Bot(id, constructor.type, constructor.depth),
                position: { x: -1, y: -1 },
                move: MOVE.FORWARD,
                depth: 0,
                duration: 0,
                dead: false,
            };
        }
    }

    public getPlayersIDs(): UUID[] {
        return Object.keys(this.protagonists);
    }

    public isDead(playerID: UUID): boolean {
        const protagonist = this.protagonists[playerID];
        if (!protagonist) {
            throw Error(`unknown player with ID: "${playerID}"`);
        }
        return protagonist.dead;
    }

    public getPosition(playerID: UUID): Position {
        const protagonist = this.protagonists[playerID];
        if (!protagonist) {
            throw Error(`unknown player with ID: "${playerID}"`);
        }
        return protagonist.position;
    }

    public getPerformance(playerID: UUID): PlayerPerformance {
        const protagonist = this.protagonists[playerID];
        if (!protagonist) {
            throw Error(`unknown player with ID: "${playerID}"`);
        }
        return {
            depth: protagonist.depth,
            duration: protagonist.duration,
        };
    }

    public reset(): GAME_STATUS {
        Object.entries(this.protagonists).forEach(([userID, p]) => {
            p.player.destroy();
            this.protagonists[userID].position = { x: -1, y: -1 };
            this.protagonists[userID].move = MOVE.FORWARD;
            this.protagonists[userID].duration = 0;
            this.protagonists[userID].dead = false;
        });
        this.grid.reset();
        this.currentCorrelationID = '';
        this.state = GAME_STATUS.CLEAR;

        return this.state;
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

            this.generateRandomStartPositions();

            const playersBoots = Object.values(this.protagonists).map((protagonist) => {
                return protagonist.player.boot(correlationID);
            });

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
            this.referenceTime = new Date().getTime();

            Object.entries(this.protagonists).filter(([, p]: [UUID, Protagonist]) => {
                return !p.dead;
            }).forEach(([id, protagonist]: [UUID, Protagonist]) => {
                const userID = id;

                protagonist.move = MOVE.FORWARD;
                protagonist.depth = 0;
                protagonist.duration = 0;

                const position = protagonist.position;

                protagonist.player.requestAction(
                    correlationID,
                    position,
                    this.grid,
                    (corr: UUID, content: {move: MOVE, depth: number}) => {
                        if (corr === correlationID) {
                            protagonist.move = content.move;
                            protagonist.depth = content.depth;
                            protagonist.duration = new Date().getTime() - this.referenceTime;
                        } else {
                            // tslint:disable-next-line
                            console.error(`received correlation ID (${corr}) differs from current one (${correlationID})`);
                        }
                    },
                );
            });
            setTimeout(() => {
                const endTurnCorrelationID = generateUUID();
                this.currentCorrelationID = endTurnCorrelationID;

                this.resolveTurn();

                if (this.state !== GAME_STATUS.RUNNING) {
                    Object.values(this.protagonists).forEach((p) => p.player.destroy());
                    resolve(this.state);
                } else {
                    const idlePromises = Object.values(this.protagonists).map((p: Protagonist) => {
                        if (p.player.isIdle()) {
                             return new Promise((r) => r());
                        }
                        return p.player.boot(endTurnCorrelationID);
                    });
                    Promise.all(idlePromises).then(() => resolve(this.state));
                }
            }, this.turnTimeoutMs);
        });
    }

    private generateRandomStartPositions(): void {
        Object.keys(this.protagonists).forEach((userID) => {
            let x: number;
            let y: number;
            do {
                x = 1 + Math.floor(Math.random() * (this.grid.sizeX - 2));
                y = 1 + Math.floor(Math.random() * (this.grid.sizeY - 2));
            } while (!!this.grid.getCell({ x, y }));

            const possiblePreviousPositions: Position[] = [
                { x: x - 1, y },
                { x: x + 1, y },
                { x , y: y - 1 },
                { x , y: y + 1 },
            ];
            const position = {
                x,
                y,
                prev: possiblePreviousPositions[Math.floor(possiblePreviousPositions.length * Math.random())],
            };
            this.protagonists[userID].position = position;
            this.grid.setCell(userID, position);
        });
    }

    private resolveTurn() {
        this.resolvePlayersPositions();
        this.resolveDeadPlayers();
        if (this.nbPlayers - Object.values(this.protagonists).filter((p) => p.dead).length < 2) {
            this.state = GAME_STATUS.FINISHED;
        } else {
            this.state = GAME_STATUS.RUNNING;
        }
    }

    private resolvePlayersPositions(): void {
        Object.entries(this.protagonists)
            .filter(([, p]: [UUID, Protagonist]) => !p.dead)
            .forEach(([userID, p]: [UUID, Protagonist]) => {
            const position = p.position;

            if (position.prev) {
                delete(position.prev.prev);
            }

            const newPosition = Game.positionMoveTargets(position)[p.move];

            newPosition.prev = position;
            newPosition.targets = Game.positionMoveTargets(newPosition);

            p.position = newPosition;

            this.grid.setCell(userID, newPosition);
        });
        return;
    }

    private resolveDeadPlayers(): void {
        Object.entries(this.protagonists).forEach(([id, p]: [UUID, Protagonist]) => {
            if (p.position.x < 0
                || p.position.x >= this.grid.sizeX
                || p.position.y < 0
                || p.position.y >= this.grid.sizeY
            ) {
                p.dead = true;
                return;
            }
            const conflictIDs = this.getConflictIds(p.position);
            if (conflictIDs.length === 0) {
                return;
            }
            if (conflictIDs.length > 1 || conflictIDs[0] !== id) {
                p.dead = true;
                return;
            }
        });
        return;
    }

    private getConflictIds(position: Position): UUID[] {
        if (!this.grid.getCell(position)) {
            return [];
        }
        return this.grid.getCell(position).map((cell) => cell.userID);
    }
}
