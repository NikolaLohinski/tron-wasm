<template>
    <table id="grid" :small="grid.sizeY <= 15 && grid.sizeX <= 15" :big="grid.sizeY >= 25 && grid.sizeX <= 25">
        <tr v-for="y in (grid.sizeY + 2)" :key="`row_${y - 2}`" class="row">
            <td v-for="x in (grid.sizeX + 2)"
                :key="`col_${x - 2}`"
                :id="`cell_${x - 2}_${y - 2}`"
                :class="x === 1 || x === grid.sizeX + 2 || y === 1 || y === grid.sizeY + 2 ? 'wall' : 'cell'">
            </td>
        </tr>
    </table>
</template>
<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import {Protagonist, Position, Color} from '@/common/types';
    import {GAME_STATUS} from '@/common/constants';

    @Component
    export default class Grid extends Vue {

        get protagonists(): { [id: string]: Protagonist } {
            return this.$store.getters.protagonists;
        }

        get filling(): Array<[Position, boolean, Color]> {
            return Object.values(this.protagonists).map((p: Protagonist) => {
              return [p.position, p.alive, p.color];
            });
        }

        get grid(): { sizeX: number, sizeY: number } {
            return this.$store.getters.simulation.grid;
        }

        get clear(): boolean {
            return this.$store.getters.status === GAME_STATUS.CLEAR;
        }

        private static getCell(position: Position): HTMLElement | null {
            return document.getElementById(`cell_${position.x}_${position.y}`);
        }

        @Watch('filling', {deep: true})
        private updateGrid(filling: Array<[Position, boolean, Color]>): void {
            filling.forEach((fill: [Position, boolean, Color]) => {
                const cell = Grid.getCell(fill[0]);
                if (cell && fill[0]) {
                    cell.style.background = fill[2].code;
                    if (!fill[1]) {
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
            width: 14px;
            height: 14px;
        }

        td.wall {
            background: #3f4548;
            height: 5px;
            width: 5px;
            &:first-child {
                border-left: 1px solid #666;
            }
            &:last-child {
                border-right: 1px solid #666;
            }
        }
        tr:first-child > td.wall {
                border-top: 1px solid #666;
        }
        tr:last-child > td.wall {
            border-bottom: 1px solid #666;
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
        &[small='true'] td.cell {
            @media screen and (min-width: 1000px) {
                width: 20px;
                height: 20px;
            }
        }
        &[big='true'] td.cell {
            @media screen and (max-width: 750px) {
                width: 12px;
                height: 12px;
            }
        }
    }
</style>
