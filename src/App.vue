<template>
  <section id="app">
  </section>
</template>

<script lang="ts">
import Bot from '@/engine/Bot';
import { Component, Vue } from 'vue-property-decorator';
import { generateUUID } from '@/common/utils';

@Component
export default class App extends Vue {
  private mounted() {
    const bot: Bot = new Bot(generateUUID());
    bot.boot(generateUUID());
  }
}
</script>

<style lang="scss"></style>
