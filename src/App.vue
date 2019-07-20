<template>
  <section id="app">
    <img :src="require('@/assets/tron.png')" class="temporary-logo"/>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  private mounted() {
    this.$store.dispatch('run').then();
  }
}
</script>

<style lang="scss">
  section#app {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #000;
    img.temporary-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%,-50%);
      width: 75px;
      opacity: 0.8;
      user-select: none;
      @keyframes rotate360 {
        0% { transform: translate(-50%,-50%) rotate(0) scale(1) }
        50% { transform: translate(-50%,-50%) rotate(360deg) scale(0.9) }
        100% { transform: translate(-50%,-50%) rotate(720deg) scale(1) }
      }
      animation: infinite 3s rotate360 linear;
    }
  }
</style>
