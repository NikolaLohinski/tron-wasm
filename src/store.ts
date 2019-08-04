import Vue from 'vue';
import Vuex from 'vuex';
import Game from '@/engine/Game';
import {
  Color,
  GameMetadata,
  PlayerMetadata,
  PlayerPerformance,
  Position,
  Simulation,
  UUID,
} from '@/common/types';
import {randomColor, randomName} from '@/common/functions';
import {GAME_STATUS, PLAYER_TYPE} from '@/common/constants';

Vue.use(Vuex);

interface StateOfMutation {
  gameMetadata: GameMetadata;
  simulation: Simulation;
  game: Game;
  status: GAME_STATUS;
  ids: UUID[];
  metadata: { [id: string]: PlayerMetadata };
  performances: { [id: string]: { depth: number, duration: number } };
  positions: { [id: string]: Position };
}

interface Getters {
  paused: boolean;
  autoRestartMs: number;
  game: Game;
  gameMetadata: GameMetadata;
  status: GAME_STATUS;
  ids: UUID[];
  metadata: { [id: string]: PlayerMetadata };
  performances: { [id: string]: PlayerPerformance };
  positions: { [id: string]: Position };
}

interface StateOfAction {
  getters: Getters;
  dispatch(action: string, payload?: any): Promise<void>;
  commit(mutation: string, payload?: any): void;
}

export default new Vuex.Store({
  state: {
    gameMetadata: {
      gridX: 10,
      gridY: 15,
      turnTimeoutMs: 100,
      playersConstructors: [
        {type: PLAYER_TYPE.TS, depth: 5},
        {type: PLAYER_TYPE.TS, depth: 8},
        {type: PLAYER_TYPE.RUST},
      ],
    },
    simulation: {
      autoRestartMs: 1000,
      paused: false,
    },
    game: undefined as any,
    status: undefined as any,
    ids: [],
    metadata: {},
    performances: {},
    positions: {},
  } as StateOfMutation,
  getters: {
    paused(state: StateOfMutation): boolean {
      return state.simulation.paused;
    },
    autoRestartMs(state: StateOfMutation): number {
      return state.simulation.autoRestartMs;
    },
    game(state: StateOfMutation): Game {
      return state.game;
    },
    gameMetadata(state: StateOfMutation): GameMetadata {
      return state.gameMetadata;
    },
    status(state: StateOfMutation): GAME_STATUS {
      return state.status;
    },
    ids(state: StateOfMutation): UUID[] {
      return state.ids;
    },
    metadata(state: StateOfMutation): { [id: string]: PlayerMetadata } {
      return state.metadata;
    },
    performances(state: StateOfMutation): { [id: string]: PlayerPerformance } {
      return state.performances;
    },
    positions(state: StateOfMutation): { [id: string]: Position } {
      return state.positions;
    },
  },
  mutations: {
    gameMetadata(state: StateOfMutation, metadata: GameMetadata): void {
      state.gameMetadata = metadata;
    },
    game(state: StateOfMutation, game: Game): void {
      state.game = game;
    },
    status(state: StateOfMutation, status: GAME_STATUS): void {
      state.status = status;
    },
    ids(state: StateOfMutation, ids: string[]): void {
      state.ids = ids;
      state.metadata = ids.reduce((allMetadata: { [id: string]: PlayerMetadata }, id: UUID, index: number) => {
        let color: Color;
        let name: string;
        do {
          color = randomColor();
          name = randomName();
        } while (Object.values(allMetadata).some((p): boolean => {
          return p.name === name || p.color === color;
        }));
        return {
          ...allMetadata,
          [id]: {
            id,
            color,
            name,
            alive: true,
            depth: state.gameMetadata.playersConstructors[index].depth,
            type: state.gameMetadata.playersConstructors[index].type,
          },
        };
      }, {});
    },
    position(state: StateOfMutation, {id, position}: { id: UUID, position: Position }): void {
      Vue.set(state.positions, id, position);
    },
    performance(state: StateOfMutation, {id, performance}: { id: UUID, performance: PlayerPerformance }): void {
      Vue.set(state.performances, id, performance);
    },
    kill(state: StateOfMutation, id: UUID): void {
      const metadata = state.metadata[id];
      metadata.alive = false;
      Vue.set(state.metadata, id, metadata);
    },
    reviveAll(state: StateOfMutation): void {
      Object.entries(state.metadata).forEach(([userID, metadata]: [UUID, PlayerMetadata]) => {
        metadata.alive = true;
        Vue.set(state.metadata, userID, metadata);
      });
    },
    paused(state: StateOfMutation, pause: boolean): void {
      Vue.set(state.simulation, 'paused', pause);
    },
  },
  actions: {
    pause(state: StateOfAction, pause: boolean): Promise<void> {
      return new Promise((resolve) => {
        const run = !pause && state.getters.paused;
        state.commit('paused', pause);
        if (run) {
          state.dispatch('run').then(resolve);
        } else {
          resolve();
        }
      });
    },
    run(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        if (state.getters.paused) {
          return resolve();
        } else {
          let handler: (state: any, run: () => Promise<void>) => Promise<void>;
          switch (state.getters.status) {
            case GAME_STATUS.CLEAR:
              handler = handleClearStatus;
              break;
            case GAME_STATUS.FINISHED:
              handler = handleFinishedStatus;
              break;
            case GAME_STATUS.RUNNING:
              handler = handleRunningStatus;
              break;
            default:
              throw Error(`unknown game status ${state.getters.status}`);
          }
          return handler(state, () => state.dispatch('run')).then(resolve);
        }
      });
    },
    start(state: StateOfAction, newGame?: boolean): Promise<void> {
      return new Promise((resolve) => {
        state.dispatch('pause', true).then(() => {
          const metadata = state.getters.gameMetadata;
          setTimeout(() => {
            if (newGame) {
              const g = new Game(metadata.gridX, metadata.gridY, metadata.turnTimeoutMs, metadata.playersConstructors);
              state.commit('game', g);
              state.commit('status', Game.INIT_GAME_STATUS);
              state.commit('ids', g.getPlayersIDs());
            } else {
              state.commit('reviveAll');
              state.commit('status', state.getters.game.reset());
            }
            if (state.getters.autoRestartMs < 0) {
              state.dispatch('run').then(resolve);
            } else {
              state.dispatch('pause', false).then(() => {
                state.dispatch('run').then(resolve);
              });
            }
          }, metadata.turnTimeoutMs);
        });
      });
    },
  },
});

function handleClearStatus(state: StateOfAction, run: () => Promise<void>): Promise<void> {
  return state.getters.game.start()
    .then((status: GAME_STATUS | Error) => {
      state.commit('status', status);
      return run();
    });
}

function handleFinishedStatus(state: StateOfAction, run: () => Promise<void>): Promise<void> {
  return new Promise((resolve) => {
    state.commit('status', GAME_STATUS.FINISHED);
    state.commit('paused', true);
    if (state.getters.autoRestartMs < 0) {
      return resolve();
    }
    setTimeout(() => {
      const resetStatus = state.getters.game.reset();
      state.commit('status', resetStatus);

      state.commit('reviveAll');
      state.commit('paused', false);

      run().then(resolve);
    }, state.getters.autoRestartMs);
  });
}

function handleRunningStatus(state: StateOfAction, run: () => Promise<void>): Promise<void> {
  return state.getters.game.tick()
    .then((status: GAME_STATUS | Error) => {
      state.commit('status', status);

      state.getters.ids.forEach((userID: UUID) => {
        if (state.getters.game.isDead(userID) && state.getters.metadata[userID].alive) {
          state.commit('kill', userID);
        }

        state.commit('performance', {
          id: userID,
          performance: state.getters.game.getPerformance(userID),
        });

        const userPosition = state.getters.game.getPosition(userID);
        state.commit('position', {id: userID, position: userPosition});
      });
      return run();
    });
}
