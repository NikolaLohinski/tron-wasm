<template>
  <div class="loader">
    <img :src="require('@/assets/tron.png')" class="logo"/>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator';

  @Component
  export default class Loader extends Vue {}
</script>

<style lang="scss" scoped>
  div.loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: opacity .2s;
    img.logo {
      position: absolute;
      width: 50px;
      opacity: 0.8;
      user-select: none;
      @keyframes rotate360 {
        0% {
          transform: translate(-50%, -50%) rotate(0) scale(1)
        }
        50% {
          transform: translate(-50%, -50%) rotate(360deg) scale(0.9)
        }
        100% {
          transform: translate(-50%, -50%) rotate(720deg) scale(1)
        }
      }
      animation: infinite 3s rotate360 linear;
    }
  }
</style>
