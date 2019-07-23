import Vue from 'vue';
import Vuex from 'vuex';
import Game from '@/engine/Game';
import {
    Color,
    GameMetadata,
    PlayerConstructor,
    PlayerMetadata,
    PlayerPerformance,
    Position,
    UUID,
} from '@/common/types';
import {randomColor} from '@/common/functions';
import {GAME_STATUS, PLAYER_TYPE} from '@/common/constants';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        gameMetadata: {
            gridX: 20,
            gridY: 20,
            turnTimeoutMs: 50,
            autoRun: true,
            autoRunWaitMs: 1000,
            playersConstructors: [
                {type: PLAYER_TYPE.TS, depth: 3},
                {type: PLAYER_TYPE.TS, depth: 3},
                {type: PLAYER_TYPE.TS, depth: 8},
            ] as PlayerConstructor[],
        } as GameMetadata,
        game: {} as Game,
        status: GAME_STATUS.UNSET as GAME_STATUS,
        ids: [] as UUID[],
        metadata: {} as { [id: string]: PlayerMetadata },
        performances: {} as { [id: string]: { depth: number, duration: number } },
        positions: {} as { [id: string]: Position },
    },
    getters: {
        game(state): Game {
            return state.game;
        },
        gameMetadata(state): GameMetadata {
            return state.gameMetadata;
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
        performances(state): { [id: string]: PlayerPerformance } {
            return state.performances;
        },
        positions(state): { [id: string]: Position } {
            return state.positions;
        },
        autoRun(state): boolean {
            return state.gameMetadata.autoRun;
        },
    },
    mutations: {
        gameMetadata(state, metadata: GameMetadata): void {
            state.gameMetadata = metadata;
        },
        game(state, game: Game): void {
            state.game = game;
        },
        status(state, status: GAME_STATUS): void {
            state.status = status;
        },
        ids(state, ids: string[]): void {
            state.ids = ids;
            state.metadata = ids.reduce((allMetadata: { [id: string]: PlayerMetadata }, id: UUID, index: number) => {
                let color: Color;
                do {
                    color = randomColor();
                } while (Object.values(allMetadata).some((c) => c.name === color.name));
                return {
                    ...allMetadata,
                    [id]: {
                        id,
                        color,
                        name: `Player ${color.name}`,
                        alive: true,
                        depth: state.gameMetadata.playersConstructors[index].depth,
                        type: state.gameMetadata.playersConstructors[index].type,
                    },
                };
            }, {});
        },
        position(state, {id, position}: { id: UUID, position: Position }): void {
            Vue.set(state.positions, id, position);
        },
        performance(state, {id, performance}: { id: UUID, performance: PlayerPerformance }): void {
            Vue.set(state.performances, id, performance);
        },
        kill(state, id: UUID): void {
            const metadata = state.metadata[id];
            metadata.alive = false;
            Vue.set(state.metadata, id, metadata);
        },
        reviveAll(state): void {
            Object.entries(state.metadata).forEach(([userID, metadata]: [UUID, PlayerMetadata]) => {
              metadata.alive = true;
              Vue.set(state.metadata, userID, metadata);
            });
        },
    },
    actions: {
        run(state): Promise<void> {
            return new Promise((resolve) => {
                switch (state.getters.status) {
                    case GAME_STATUS.CLEAR:
                        state.getters.game.start().then((status: GAME_STATUS) => {
                            state.commit('status', status);
                            state.dispatch('run').then(resolve);
                        });
                        break;
                    case GAME_STATUS.FINISHED:
                        if (state.getters.autoRun) {
                            state.commit('status', GAME_STATUS.FINISHED);
                            setTimeout(() => {
                                state.commit('status', state.getters.game.reset());
                                state.commit('reviveAll');
                                state.dispatch('run').then(resolve);
                            }, state.getters.gameMetadata.autoRunWaitMs);
                        } else {
                            resolve();
                        }
                        break;
                    case GAME_STATUS.RUNNING:
                        state.getters.game.tick().then((status: GAME_STATUS) => {
                            state.commit('status', status);
                            state.getters.ids.forEach((userID: UUID) => {
                                const position = state.getters.game.getPosition(userID);
                                if (state.getters.game.isDead(userID) && state.getters.metadata[userID].alive) {
                                    state.commit('kill', userID);
                                }
                                state.commit('performance', {
                                    id: userID,
                                    performance: state.getters.game.getPerformance(userID),
                                });
                                state.commit('position', {id: userID, position});
                            });
                            state.dispatch('run').then(resolve);
                        });
                        break;
                    default:
                        throw Error(`unknown game status ${state.getters.status}`);
                }
            });
        },
      start(state): void {
        const metadata = state.getters.gameMetadata;
        const game = new Game(metadata.gridX, metadata.gridY, metadata.turnTimeoutMs, metadata.playersConstructors);
        state.commit('game', game);
        state.commit('ids', state.getters.game.getPlayersIDs());
        state.commit('status', GAME_STATUS.CLEAR);
        state.dispatch('run').then();
      },
    },
});
