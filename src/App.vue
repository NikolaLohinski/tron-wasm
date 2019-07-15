<template>
  <section id="app">
  </section>
</template>

<script lang="ts">
import Game from '@/engine/Game';
import { Component, Vue } from 'vue-property-decorator';
import { generateUUID } from '@/common/utils';

@Component
export default class App extends Vue {
  private mounted() {
    const game: Game = new Game(15, 15);
    game.start().then(() => {
      // tslint:disable-next-line
      console.log('[VUE]: game has started', game);
    });
  }
}
</script>

<style lang="scss"></style>
