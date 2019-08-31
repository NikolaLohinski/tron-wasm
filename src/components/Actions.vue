<template>
    <nav id="actions">
        <div class="button" @click="play" v-if="paused" :disabled="finished || ticking">
            <font-awesome-icon icon="play" />
        </div>
        <div class="button" @click="pause" v-else :disabled="finished || ticking ">
            <font-awesome-icon icon="pause" />
        </div>
        <div class="button" @click="tick" :disabled="!paused || ticking">
            <i id="vertical-bar">|</i><font-awesome-icon icon="play" />
        </div>
    </nav>
</template>
<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import {ACTION} from '@/common/constants';

    @Component
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
    }
</script>
<style lang="scss" scoped>
    $button-bg-color: #3f4548;
    $button-border-color: lighten($button-bg-color,10%);
    $button-bg-hover-color: darken($button-bg-color,5%);
    $button-bg-shadow-active-color: darken($button-bg-color,10%);
    nav#actions {
        user-select: none;
        .button{
            display: inline-block;
            padding: 20px 0 15px 0;
            margin-right: 15px;
            background: $button-bg-color;
            min-width: 60px;
            outline: none;
            color: #ddd;
            font-size: 20px;
            border-radius: 4px;
            box-shadow: 0 4px 0 $button-bg-color;
            border-bottom: 1px solid $button-border-color;
            transition: all .1s ease-in;
            &:hover{
                background: $button-bg-hover-color;
                color: #aaa;
            }
            &:active{
                transform:translateY(4px);
                box-shadow: none;
            }
            &[disabled] {
                pointer-events: none;
                opacity: 0.2;
            }
            i#vertical-bar {
                margin: 0 2px 0 0;
                vertical-align: top;
                line-height: 19px;
                font-weight: bold;
                pointer-events: none;
            }
        }
    }
</style>
