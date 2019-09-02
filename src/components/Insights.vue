<template>
  <sweet-modal id="Insights" modal-theme="dark" overlay-theme="dark" ref="modal" @close="() => $emit('close')">
    <transition name="fade" mode="out-in">
    <div v-if="paused && !ticking">
      <line-chart :data="chartData" xtitle="Depth" ytitle="Duration (ms)" class="chart"/>
      <Button @click="tick" :disabled="!paused || ticking" style="padding: 20px 5px 15px 5px;">
        <i class="vertical-bar">|</i><font-awesome-icon icon="play" />
      </Button>
    </div>
    <Loader v-else />
    </transition>
  </sweet-modal>
</template>
<script lang="ts">
  import {Component, Vue, Watch} from 'vue-property-decorator';
  import {Protagonist, Simulation} from "@/common/types";
  import Loader from "@/components/Loader.vue";
  import {ACTION} from "@/common/constants";
  import Button from "@/components/Button.vue";

  @Component({
    props: {
      opened: Boolean
    },
    components: {
      Loader,
      Button,
    }
  })
  export default class Insights extends Vue {

    get paused(): boolean {
      return this.$store.getters.paused;
    }
    get ticking(): boolean {
      return this.$store.getters.ticking;
    }

    get protagonists(): Protagonist[] {
      return Object.values(this.$store.getters.protagonists);
    }

    get simulation(): Simulation {
      return this.$store.getters.simulation;
    }

    get chartData(): object[] {
      const data = this.protagonists
        .filter((p: Protagonist) => p.alive)
        .map((p: Protagonist) => {
        return {
          name: `${p.name} (${p.type})`,
          color: p.color.code,
          data: { ...p.performance.durations },
          points: true,
        };
      });
      const size = Math.max(...this.protagonists.map((x) => x.performance.durations.length || 0));
      if (size < 1) {
        return data;
      }
      data.push({
        name: 'TIMEOUT',
        color: 'red',
        data: { ...new Array(size).fill(this.simulation.turnTimeout) },
        points: false,
      });
      return data;
    }

    private tick(): Promise<void> {
      return this.$store.dispatch('do', ACTION.TICK);
    }

    @Watch('opened', {immediate: true})
    private toggle(opened: boolean): void {
      if (opened) {
        // @ts-ignore
        this.$refs.modal.open();
      }
    }
  }
</script>
<style lang="scss">
  #Insights {
    user-select: none;
    background: rgba(0, 0, 0, 0.8);
    i.vertical-bar {
      margin: 0 2px 0 0;
      vertical-align: top;
      line-height: 25px;
      font-weight: bold;
      pointer-events: none;
    }
    .chart {
      margin-bottom: 15px;
    }
    .sweet-modal {
      background: #0d0d0d;
      border: 1px solid #3f4548;
      .sweet-action-close:hover {
        background: #3f4548;
      }
    }
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity .2s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
</style>
