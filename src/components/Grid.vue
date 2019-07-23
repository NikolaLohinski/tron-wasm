<template>
    <table id="grid">
        <tr v-for="y in (grid.sizeX + 2)" :key="`row_${y - 2}`" class="row">
            <td v-for="x in (grid.sizeY + 2)"
                :key="`col_${x - 2}`"
                :id="`cell_${x - 2}_${y - 2}`"
                :class="x === 1 || x === grid.sizeX + 2 || y === 1 || y === grid.sizeY + 2 ? 'wall' : 'cell'">
            </td>
        </tr>
    </table>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import {PlayerMetadata, Position, UUID} from '@/common/types';
    import {GAME_STATUS} from '@/common/constants';

    @Component
    export default class Grid extends Vue {

        get positions(): UUID[] {
            return this.$store.getters.positions;
        }

        get grid(): { sizeX: number, sizeY: number } {
            const metadata = this.$store.getters.gameMetadata;
            return {sizeX: metadata.gridX, sizeY: metadata.gridY};
        }

        get clear(): boolean {
            return this.$store.getters.status === GAME_STATUS.CLEAR;
        }

        private static getCell(position: Position): HTMLElement | null {
            return document.getElementById(`cell_${position.x}_${position.y}`);
        }

        private metadata(id: UUID): PlayerMetadata {
            return this.$store.getters.metadata[id];
        }

        @Watch('positions', {immediate: true, deep: true})
        private updateGrid(newPositions: { [id: string]: Position }): void {
            Object.entries(newPositions).forEach(([userID, position]: [UUID, Position]) => {
                const metadata = this.metadata(userID);
                const cell = Grid.getCell(position);
                if (cell) {
                    cell.style.background = metadata.color.code;
                    if (!metadata.alive) {
                        cell.classList.add('dead');
                    }
                }
            });
        }

        @Watch('clear', {immediate: true})
        private clearGrid(): void {
            for (let x = -1; x < this.grid.sizeX + 1; x++) {
                for (let y = -1; y < this.grid.sizeY + 1; y++) {
                    const cell = Grid.getCell({x, y});
                    if (cell) {
                        cell.style.background = '';
                        cell.classList.remove('dead');
                    }
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    table#grid {
        margin: 0 auto;
        border-collapse: collapse;

        td.cell {
            border: 1px solid #666;
            padding: 0;
            @media screen and (max-width: 650px) {
                width: 10px;
                height: 10px;
            }
            @media screen and (min-width: 650px) {
                width: 14px;
                height: 14px;
            }
            @media screen and (min-width: 1000px) {
                width: 18px;
                height: 18px;
            }
        }

        td.wall {
            background: #aaaaaa;
            height: 5px;
            width: 5px;
        }

        td.dead {
            @keyframes blink {
                from {
                    background: transparent
                }
                to {
                    background: #ff0000;
                }
            }
            animation: infinite .2s blink linear;
        }
    }
</style>
