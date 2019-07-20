import Vue from 'vue';
import Vuex from 'vuex';
import Game from '@/engine/Game';
import {GAME_STATUS, PlayerMetadata, Position, UUID} from '@/common/types';
import {randomColor} from '@/common/utils';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    game: new Game(15, 15, 50, 2) as Game,
    status: GAME_STATUS.STOPPED as GAME_STATUS,
    ids: [] as UUID[],
    metadata: {} as { [id: string]: PlayerMetadata },
    positions: {} as { [id: string]: Position},
  },
  getters: {
    game(state): Game {
      return state.game;
    },
    status(state): GAME_STATUS {
      return state.status;
    },
    ids(state): string[] {
      return state.ids;
    },
    metadata(state): PlayerMetadata[] {
      return Object.values(state.metadata);
    },
  },
  mutations: {
    game(state, game: Game): void {
      state.game = game;
    },
    status(state, status: GAME_STATUS): void {
      state.status = status;
    },
    ids(state, ids: string[]): void {
      state.ids = ids;
      state.metadata = ids.reduce((allMetadata: { [id: string]: PlayerMetadata }, id: UUID) => {
        const color = randomColor();
        return {
          ...allMetadata,
          [id]: {
            id,
            name: `Player ${color.name}`,
            color : color.code,
          },
        };
      }, {});
    },
    position(state, { id, position }: { id: UUID, position: Position }): void {
      Vue.set(state.positions, id, position);
    },
  },
  actions: {
    run(state): Promise<void> {
      return new Promise((resolve) => {
        switch (state.getters.status) {
          case GAME_STATUS.STOPPED:
            state.getters.game.start().then((status: GAME_STATUS) => {
              state.commit('status', status);
              // tslint:disable-next-line
              console.log('[STORE]: game started');
              state.commit('ids', state.getters.game.getPlayersIDs());
              state.dispatch('run').then(resolve);
            });
            break;
          case GAME_STATUS.FINISHED:
            // tslint:disable-next-line
            console.log('[STORE]: game finished');
            resolve();
            break;
          case GAME_STATUS.RUNNING:
            // tslint:disable-next-line
            console.log('[STORE]: game running');
            state.getters.game.tick().then((status: GAME_STATUS) => {
              state.commit('status', status);
              state.getters.ids.forEach((id: UUID) => {
                const position = state.getters.game.getPosition(id);
                state.commit('position', { id, position });
              });
              state.dispatch('run').then(resolve);
            });
            break;
          default:
            throw Error(`unknown game status ${state.getters.status}`);
        }
      });
    },
  },
});
