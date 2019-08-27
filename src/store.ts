import Vue from 'vue';
import Vuex from 'vuex';
import {
  Color, Performance,
  Position,
  Protagonist,
  Simulation,
  UUID,
} from '@/common/types';
import {ACTION, GAME_STATE, GAME_STATUS, PLAYER_TYPE} from '@/common/constants';
import Game from '@/engine/Game';
import {generateUUID, randomColor, randomName} from '@/common/functions';
import Bot from '@/engine/Bot';

Vue.use(Vuex);

interface StateOfMutation {
  simulation: Simulation;
  game: {
    instance: Game,
    status: GAME_STATUS,
  };
  protagonists: { [id: string]: Protagonist };
}

interface Getters {
  paused: boolean;
  ticking: boolean;
  finished: boolean;
  simulation: Simulation;
  game: Game;
  status: GAME_STATUS;
  protagonists: { [id: string]: Protagonist };
}

interface StateOfAction {
  getters: Getters;
  dispatch(action: string, payload?: any): Promise<void>;
  commit(mutation: string, payload?: any): void;
}

export default new Vuex.Store({
  state: {
    protagonists: {},
    game: {
      status: Game.INIT_GAME_STATUS,
      instance: undefined as any,
    },
    simulation: {
      state: 'RUNNING',
      turnTimeout: 100,
      participants: [
        [PLAYER_TYPE.TS, { depth: 5 }],
        [PLAYER_TYPE.TS, { depth: 8 }],
        [PLAYER_TYPE.RUST, { depth: 5 }],
      ],
      grid: {
        sizeX: 15,
        sizeY: 15,
      },
    },
  } as StateOfMutation,
  getters: {
    paused(state: StateOfMutation): boolean {
      return state.simulation.state === GAME_STATE.PAUSED;
    },
    ticking(state: StateOfMutation): boolean {
      return state.simulation.state === GAME_STATE.TICKING;
    },
    finished(state: StateOfMutation): boolean {
      return state.game.status === GAME_STATUS.FINISHED;
    },
    simulation(state: StateOfMutation): Simulation {
      return state.simulation;
    },
    game(state: StateOfMutation): Game {
      return state.game.instance;
    },
    status(state: StateOfMutation): GAME_STATUS {
      return state.game.status;
    },
    protagonists(state: StateOfMutation): { [id: string]: Protagonist } {
      return state.protagonists;
    },
  },
  mutations: {
    protagonists(state: StateOfMutation, protagonists: { [id: string]: Protagonist }): void {
      Vue.set(state, 'protagonists', protagonists);
    },
    state(state: StateOfMutation, simulationState: GAME_STATE): void {
      Vue.set(state.simulation, 'state', simulationState);
    },
    game(state: StateOfMutation, game: Game): void {
      state.game.instance = game;
      state.game.status = Game.INIT_GAME_STATUS;
    },
    status(state: StateOfMutation, status: GAME_STATUS): void {
      state.game.status = status;
    },
    position(state: StateOfMutation, {id, position}: { id: UUID, position: Position }): void {
      const protagonist = state.protagonists[id];
      protagonist.position = position;
      Vue.set(state.protagonists, id, protagonist);
    },
    performance(state: StateOfMutation, {id, performance}: { id: UUID, performance: Performance }): void {
      const protagonist = state.protagonists[id];
      protagonist.performance = performance;
      Vue.set(state.protagonists, id, protagonist);
    },
    kill(state: StateOfMutation, id: UUID): void {
      const protagonist = state.protagonists[id];
      protagonist.alive = false;
      Vue.set(state.protagonists, id, protagonist);
    },
    reviveAll(state: StateOfMutation): void {
      Object.entries(state.protagonists).forEach(([id, protagonist]: [UUID, Protagonist]) => {
        protagonist.alive = true;
        Vue.set(state.protagonists, id, protagonist);
      });
    },
  },
  actions: {
    generate(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        const simulation = state.getters.simulation;

        const protagonists: { [id: string]: Protagonist } = {};
        for (const constructor of simulation.participants) {
          const bot = new Bot(generateUUID(), constructor[0], constructor[1]);
          const id = bot.id;
          const type = bot.type;
          let color: Color;
          let name: string;
          const position: Position = {
            x: -1,
            y: -1,
          };
          do {
            name = randomName();
            color = randomColor();
          } while (Object.values(protagonists).some((p: any): boolean => {
            return p.name === name || p.color === color;
          }));
          protagonists[bot.id] = {
            name,
            id,
            color,
            type,
            position,
            alive: true,
            player: bot,
            performance: {
              depth: 0,
              duration: 0,
            },
          };
        }
        state.commit('protagonists', protagonists);

        const players = Object.values(protagonists).map((p) => p.player);
        const g = new Game(
          simulation.grid.sizeX,
          simulation.grid.sizeY,
          simulation.turnTimeout,
          players,
        );
        state.commit('game', g);

        resolve();
      });
    },
    do(state: StateOfAction, action: ACTION): Promise<void> {
      return new Promise((resolve) => {
        switch (action) {
          case ACTION.PAUSE:
            state.commit('state', GAME_STATE.PAUSED);
            resolve();
            break;
          case ACTION.RUN:
            const run = state.getters.paused || state.getters.ticking;
            state.commit('state', GAME_STATE.RUNNING);
            if (run) {
              state.dispatch('run').then(resolve);
            }
            break;
          case ACTION.TICK:
            if (!state.getters.paused) {
              throw Error('game can not be ticked if it is already running');
            }
            state.commit('state', GAME_STATE.TICKING);
            state.dispatch('run').then(() => {
              state.commit('state', GAME_STATE.PAUSED);
              resolve();
            });
            break;
          default:
            throw Error(`unknown action "${action}"`);
        }
      });
    },
    start(state: StateOfAction, newGame?: boolean): Promise<void> {
      return new Promise((resolve) => {
        state.dispatch('do', ACTION.PAUSE).then(() => {
          const simulation = state.getters.simulation;
          setTimeout(() => {
            state.commit('reviveAll');
            if (newGame) {
              state.dispatch('generate').then(() => {
                state.dispatch('do', ACTION.RUN).then(() => {
                  state.dispatch('run').then(resolve);
                });
              });
            } else {
              state.commit('status', state.getters.game.reset());
              state.dispatch('do', ACTION.RUN).then(() => {
                state.dispatch('run').then(resolve);
              });
            }
          }, simulation.turnTimeout);
        });
      });
    },
    run(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        if (state.getters.paused && !state.getters.ticking) {
          resolve();
          return;
        } else {
          switch (state.getters.status) {
            case GAME_STATUS.CLEAR:
              state.dispatch('clear').then(resolve);
              return;
            case GAME_STATUS.FINISHED:
              state.dispatch('finish').then(resolve);
              return;
            case GAME_STATUS.RUNNING:
              state.dispatch('continue').then(resolve);
              return;
            default:
              throw Error(`unknown game status ${state.getters.status}`);
          }
        }
      });
    },
    clear(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        state.getters.game.start().then((status: GAME_STATUS | Error) => {
            state.commit('status', status);
            state.dispatch('run').then(resolve);
          });
      });
    },
    finish(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        state.commit('status', GAME_STATUS.FINISHED);
        state.commit('state', 'PAUSE');

        setTimeout(() => {
          const resetStatus = state.getters.game.reset();
          state.commit('status', resetStatus);

          state.commit('reviveAll');
          state.commit('state', 'RUNNING');

          state.dispatch('run').then(resolve);
        }, 1000);
      });
    },
    continue(state: StateOfAction): Promise<void> {
      return new Promise((resolve) => {
        state.getters.game.tick().then((status: GAME_STATUS | Error) => {
            state.commit('status', status);
            Object.entries(state.getters.protagonists).forEach(([id, p]: [UUID, Protagonist]) => {
              if (state.getters.game.isDead(id) && state.getters.protagonists[id].alive) {
                state.commit('kill', id);
              }
              const userPosition = state.getters.game.getPosition(id);
              state.commit('position', {id, position: userPosition});
              const userPerformance = state.getters.game.getPerformance(id);
              state.commit('performance', {id, performance: userPerformance});
            });
            if (state.getters.ticking) {
              resolve();
            } else {
              state.dispatch('run').then(resolve);
            }
          });
      });
    },
  },
});
