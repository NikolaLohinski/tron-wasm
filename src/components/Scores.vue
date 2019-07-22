<template>
    <transition-group id="scores" name="flip-list" tag="table">
        <tr class="score" v-for="player in metadata" :key="player.id" :dead="!player.alive">
            <td class="name">{{ player.name }}</td>
            <td class="color"><div class="thumbnail" :style="{background: player.color.code}"></div></td>
        </tr>
    </transition-group>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import {PlayerMetadata} from '@/common/types';

@Component
export default class Scores extends Vue {

    get gameMetadata(): {[id: string]: PlayerMetadata} {
        return this.$store.getters.metadata;
    }

    get metadata(): PlayerMetadata[] {
        const metadata: PlayerMetadata[] = Object.values(this.gameMetadata);
        metadata.sort((a, b) => a.alive ? (b.alive) ? 0 : -1 : 1);
        return metadata;
    }

}
</script>

<style lang="scss" scoped>
    table#scores {
        tr.score {
            td {
                padding: 5px;
                &.name {
                    text-align: left;
                    white-space: nowrap;
                }
                &.color {
                    div.thumbnail {
                        width: 10px;
                        height: 10px;
                    }
                }
            }
            &[dead] {
                opacity: 0.3;
                position: relative;
            }
        }
    }
    .flip-list-move {
        transition: transform .5s;
    }
</style>
