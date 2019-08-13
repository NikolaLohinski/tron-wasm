import {generateUUID} from '@/common/functions';
import {MoveTarget, Performance, Position, UUID} from '@/common/types';
import {Player} from '@/common/interfaces';
import {GAME_STATUS, MOVE, PLAYER_TYPE} from '@/common/constants';

import Grid from '@/engine/Grid';

interface Protagonist {
  player: Player;
  position: Position;
  move: MOVE;
  depth: number;
  duration: number;
  dead: boolean;
}

export default class Game {
  public static INIT_GAME_STATUS = GAME_STATUS.CLEAR;

  private static positionMoveTargets(position: Position): MoveTarget {
    if (!position.prev) {
      throw Error('no previous position');
    }
    const target: MoveTarget = {} as any;
    if (position.x - position.prev.x !== 0) {
      // case of move on x abscissa
      const delta = position.x - position.prev.x;
      target[MOVE.FORWARD] = { x: position.x + delta, y: position.y };
      target[MOVE.STARBOARD] = { x: position.x, y: position.y + delta };
      target[MOVE.LARBOARD] = { x: position.x, y: position.y - delta };
    } else {
      // case of move on y abscissa
      const delta = position.y - position.prev.y;
      target[MOVE.FORWARD] = { x: position.x, y: position.y + delta };
      target[MOVE.STARBOARD] = { x: position.x - delta, y: position.y };
      target[MOVE.LARBOARD] = { x: position.x + delta, y: position.y };
    }
    return target;
  }

  public readonly turnTimeoutMs: number;
  public readonly grid: Grid;

  private readonly protagonists: { [id: string]: Protagonist };
  private readonly nbPlayers: number;
  private referenceTime: number = 0;
  private state: GAME_STATUS = Game.INIT_GAME_STATUS;

  private currentCorrelationID: UUID = '';

  constructor(sizeX: number, sizeY: number, turnTimeoutMs: number, players: Player[]) {
    this.grid = new Grid(sizeX, sizeY);

    this.turnTimeoutMs = turnTimeoutMs;
    this.nbPlayers = players.length;

    this.protagonists = {};
    for (const player of players) {
      this.protagonists[player.id] = {
        player,
        position: { x: -1, y: -1 },
        move: MOVE.FORWARD,
        depth: 0,
        duration: 0,
        dead: false,
      };
    }
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

  public getPerformance(playerID: UUID): Performance {
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

      Promise.all(playersBoots)
        .then(() => {
          const state = GAME_STATUS.RUNNING;
          this.state = state;
          resolve(state);
        }, () => {
          reject(Error('failed to boot some players'));
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
      }).forEach(([, protagonist]: [UUID, Protagonist]) => {
        protagonist.move = MOVE.FORWARD;
        protagonist.depth = 0;
        protagonist.duration = 0;

        const position = protagonist.position;
        const self = this;
        function act(corr: UUID, move: MOVE, depth: number) {
          if (corr === correlationID) {
            protagonist.move = move;
            protagonist.depth = depth;
            protagonist.duration = new Date().getTime() - self.referenceTime;
          } else {
            // tslint:disable-next-line
            console.error(`received correlation ID (${corr}) differs from current one (${correlationID})`);
          }
        }

        protagonist.player.requestAction(correlationID, position, this.grid, act);
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
            if (p.player.isIdle() || p.dead) {
              return Promise.resolve();
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
    return this.grid.getCell(position);
  }
}
