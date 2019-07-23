import Vue from 'vue';
import Vuex from 'vuex';
import Game from '@/engine/Game';
import {Color, GAME_STATUS, PlayerMetadata, Position, UUID} from '@/common/types';
import {randomColor} from '@/common/utils';

Vue.use(Vuex);

const grid = {
  sizeX: 20,
  sizeY: 20,
};

export default new Vuex.Store({
  state: {
    grid,
    game: new Game(grid.sizeX, grid.sizeY, 100, 4) as Game,
    status: GAME_STATUS.CLEAR as GAME_STATUS,
    ids: [] as UUID[],
    metadata: {} as { [id: string]: PlayerMetadata },
    positions: {} as { [id: string]: Position},
  },
  getters: {
    game(state): Game {
      return state.game;
    },
    grid(state): { sizeX: number, sizeY: number } {
      return state.grid;
    },
    status(state): GAME_STATUS {
      return state.status;
    },
    ids(state): string[] {
      return state.ids;
    },
    metadata(state): { [id: string]: PlayerMetadata } {
      return state.metadata;
    },
    positions(state): { [id: string]: Position } {
      return state.positions;
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
        let color: Color;
        do {
          color = randomColor();
        } while (Object.values(allMetadata).some((c) => c.name === color.name ));
        return {
          ...allMetadata,
          [id]: {
            id,
            color,
            name: `Player ${color.name}`,
            alive: true,
          },
        };
      }, {});
    },
    position(state, { id, position }: { id: UUID, position: Position }): void {
      Vue.set(state.positions, id, position);
    },
    kill(state, id: UUID): void {
      const metadata = state.metadata[id];
      metadata.alive = false;
      Vue.set(state.metadata, id, metadata);
    },
  },
  actions: {
    run(state): Promise<void> {
      return new Promise((resolve) => {
        switch (state.getters.status) {
          case GAME_STATUS.CLEAR:
            state.getters.game.start().then((status: GAME_STATUS) => {
              state.commit('status', status);
              state.commit('ids', state.getters.game.getPlayersIDs());
              state.dispatch('run').then(resolve);
            });
            break;
          case GAME_STATUS.FINISHED:
            resolve();
            break;
          case GAME_STATUS.RUNNING:
            state.getters.game.tick().then((status: GAME_STATUS) => {
              state.commit('status', status);
              state.getters.ids.forEach((id: UUID) => {
                const position = state.getters.game.getPosition(id);
                if (state.getters.game.isDead(id)) {
                  state.commit('kill', id);
                }
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
