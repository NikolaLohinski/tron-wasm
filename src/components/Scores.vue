import {PLAYER_TYPE} from "../common/constants";
<template>
    <table id="scores">
        <thead>
        <tr class="score">
            <td class="color"></td>
            <td class="name"></td>
            <td class="type">Type</td>
            <td class="depth">Depth</td>
            <td class="duration">Duration</td>
            <td class="victories">Score</td>
        </tr>
        </thead>
        <transition-group name="flip-list" tag="tbody" mode="out-in">
            <tr class="score" v-for="player in metadata" :key="player.id" :dead="!player.alive">
                <td class="color">
                    <div class="thumbnail" :style="{background: player.color.code}"></div>
                </td>
                <td class="name">{{ player.name }}</td>
                <td class="type">
                    <img :src="require(`@/assets/${getIconName(player.type)}`)" :alt="`${player.type} icon`"/>
                </td>
                <td class="depth">{{ player.performance.depth }} / {{ maxDepths[player.id] || player.performance.depth }}</td>
                <td class="duration">{{ player.performance.durations[player.performance.durations.length - 1] }} ms</td>
                <td class="victories">{{ victories[player.id] || 0 }}</td>
            </tr>
        </transition-group>
    </table>
</template>
<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import {Protagonist, Performance, UUID} from '@/common/types';
import {GAME_STATUS, PLAYER_TYPE} from '@/common/constants';

@Component
export default class Scores extends Vue {
    private readonly victories: { [id: string]: number } = {};
    private readonly maxDepths: { [id: string]: number } = {};

    get protagonists(): { [userID: string]: Protagonist } {
        return this.$store.getters.protagonists;
    }

    get metadata(): Protagonist[] {
        const protagonists: Protagonist[] = Object.values(this.protagonists);
        protagonists.forEach((p: Protagonist) => {
          if (!this.maxDepths[p.id]) {
            this.maxDepths[p.id] = p.performance.depth;
          }
          this.maxDepths[p.id] = Math.max(p.performance.depth, this.maxDepths[p.id]);
        });
        protagonists.sort(this.playerMetadataSorter.bind(this));
        return protagonists;
    }

    get status(): GAME_STATUS {
        return this.$store.getters.status;
    }

    private getIconName(type: PLAYER_TYPE): string {
        switch (type) {
            case PLAYER_TYPE.TS:
                return 'typescript.ico';
            case PLAYER_TYPE.RUST:
                return 'rust-wasm.ico';
            case PLAYER_TYPE.GO:
                return 'go.ico';
            case PLAYER_TYPE.CPP:
                return 'cpp.ico';
            default:
                throw Error(`unknown player type "${type}"`);
        }
    }

    private playerMetadataSorter(p1: Protagonist, p2: Protagonist): number {
        if (p1.alive && p2.alive) {
            const victoriesP1 = this.victories[p1.id] ? this.victories[p1.id] : 0;
            const victoriesP2 = this.victories[p2.id] ? this.victories[p2.id] : 0;
            return victoriesP2 - victoriesP1;
        }
        return p1.alive ? (p2.alive) ? 0 : -1 : 1;
    }

    @Watch('status', {immediate: true})
    private updateVictories(status: GAME_STATUS): void {
        if (status === GAME_STATUS.FINISHED) {
            Object.entries(this.protagonists).forEach(([userID, player]: [UUID, Protagonist]) => {
                if (player.alive) {
                    if (!this.victories[userID]) {
                        this.victories[userID] = 0;
                    }
                    this.victories[userID] += 1;
                }
            });
        }
    }
}
</script>
<style lang="scss" scoped>
    table#scores {
        tr.score {
            transition: all .2s;
            user-select: none;
            td, th {
                padding: 5px;
                &.name {
                    text-align: left;
                    white-space: nowrap;
                    min-width: 150px;
                }
                &.color {
                    div.thumbnail {
                        width: 10px;
                        height: 10px;
                    }
                    min-width: 20px;
                }
                &.type img {
                    width: 20px;
                }
                &.depth {
                    min-width: 60px;
                }
                &.duration {
                    min-width: 60px;
                    white-space: pre-wrap;
                }
                @media screen and (max-width: 650px) {
                    font-size: 12px;
                    padding: 2px;
                    &.name {
                        min-width: 100px;
                    }
                    &.color {
                        div.thumbnail {
                            width: 8px;
                            height: 8px;
                        }
                        min-width: 10px;
                    }
                    &.type img {
                        width: 15px;
                    }
                    &.depth {
                        min-width: 40px;
                    }
                    &.duration {
                        min-width: 40px;
                    }
                }
            }

            &[dead] {
                opacity: 0.3;
                position: relative;
            }
        }
    }
    .flip-list-leave-to,
    .flip-list-enter{
        transform: translateX(100vw);
    }
    .flip-list-leave-active {
        position: absolute;
    }
</style>
