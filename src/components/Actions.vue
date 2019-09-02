<template>
    <nav id="Actions">
        <Button @click="play" v-if="paused" :disabled="finished || ticking">
            <font-awesome-icon icon="play" />
        </Button>
        <Button @click="pause" v-else :disabled="finished || ticking">
            <font-awesome-icon icon="pause" />
        </Button>
        <Button @click="tick" :disabled="!paused || ticking">
            <i class="vertical-bar">|</i><font-awesome-icon icon="play" />
        </Button>
        <Button @click="charts" :disabled="!paused">
            <font-awesome-icon icon="chart-line" />
        </Button>
    </nav>
</template>
<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import {ACTION} from '@/common/constants';
    import Button from "@/components/Button.vue";

    @Component({
      components: {
        Button,
      }
    })
    export default class Actions extends Vue {
        get paused(): boolean {
            return this.$store.getters.paused;
        }

        get ticking(): boolean {
            return this.$store.getters.ticking;
        }

        get finished(): boolean {
            return this.$store.getters.finished;
        }

        private pause(): Promise<void> {
            return this.$store.dispatch('do', ACTION.PAUSE);
        }

        private play(): Promise<void> {
          return this.$store.dispatch('do', ACTION.RUN);
        }

        private tick(): Promise<void> {
            return this.$store.dispatch('do', ACTION.TICK);
        }

        private charts(): void {
            this.$emit('charts');
        }
    }
</script>
<style lang="scss" scoped>
    nav#Actions {
        user-select: none;
        i.vertical-bar {
            margin: 0 2px 0 0;
            vertical-align: top;
            line-height: 19px;
            font-weight: bold;
            pointer-events: none;
        }
    }
</style>
