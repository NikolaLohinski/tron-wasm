<template>
    <table id="scores">
        <thead>
        <tr class="score">
            <td class="name"></td>
            <td class="color"></td>
            <td class="depth">Depth</td>
            <td class="duration">Duration</td>
            <td class="victories">Score</td>
        </tr>
        </thead>
        <transition-group name="flip-list" tag="tbody" mode="out-in">
            <tr class="score" v-for="player in metadata" :key="player.id" :dead="!player.alive">
                <td class="name">{{ player.name }}</td>
                <td class="color">
                    <div class="thumbnail" :style="{background: player.color.code}"></div>
                </td>
                <template v-if="performances[player.id]">
                    <td class="depth">{{ player.alive ? performances[player.id].depth : 0 }}/{{ player.depth }}</td>
                    <td class="duration">{{ player.alive ? performances[player.id].duration : 0 }} ms</td>
                </template>
                <td class="victories">{{ victories[player.id] || 0 }}</td>
            </tr>
        </transition-group>
    </table>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import {PlayerMetadata, PlayerPerformance, UUID} from '@/common/types';
import {GAME_STATUS} from '@/common/constants';

@Component
export default class Scores extends Vue {
    private readonly victories: { [id: string]: number } = {};

    get playersMetadata(): { [userID: string]: PlayerMetadata } {
        return this.$store.getters.metadata;
    }

    get performances(): { [userID: string]: PlayerPerformance } {
        return this.$store.getters.performances;
    }

    get metadata(): PlayerMetadata[] {
        const metadata: PlayerMetadata[] = Object.values(this.playersMetadata);
        metadata.sort(this.playerMetadataSorter.bind(this));
        return metadata;
    }

    private playerMetadataSorter(p1: PlayerMetadata, p2: PlayerMetadata): number {
        if (p1.alive && p2.alive) {
            const victoriesP1 = this.victories[p1.id] ? this.victories[p1.id] : 0;
            const victoriesP2 = this.victories[p2.id] ? this.victories[p2.id] : 0;
            return victoriesP2 - victoriesP1;
        }
        return p1.alive ? (p2.alive) ? 0 : -1 : 1;
    }

    get status(): GAME_STATUS {
        return this.$store.getters.status;
    }

    @Watch('status', {immediate: true})
    private updateVictories(status: GAME_STATUS): void {
        if (status === GAME_STATUS.FINISHED) {
            Object.entries(this.playersMetadata).forEach(([userID, player]: [UUID, PlayerMetadata]) => {
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
            td, th {
                padding: 5px;
                &.name {
                    text-align: left;
                    white-space: nowrap;
                    min-width: 200px;
                }

                &.color {
                    div.thumbnail {
                        width: 10px;
                        height: 10px;
                    }
                    min-width: 20px;
                }
                &.depth {
                    width: 60px;
                }
                &.duration {
                    width: 60px;
                    white-space: pre-wrap;
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
