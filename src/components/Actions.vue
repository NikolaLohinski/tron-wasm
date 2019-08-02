<template>
    <nav id="actions">
        <div class="button" @click="restart"  v-if="paused && finished">
            <font-awesome-icon icon="redo"/>
        </div>
        <div class="button" @click="() => pause(false)" v-if="paused && !finished">
            <font-awesome-icon icon="play" />
        </div>
        <div class="button" @click="() => pause(true)" v-if="!paused">
            <font-awesome-icon icon="pause" />
        </div>
        <div class="button" @click="reset">
            <font-awesome-icon icon="stop"/>
        </div>
    </nav>
</template>
<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';
    import {GAME_STATUS} from '@/common/constants';

    @Component
    export default class Actions extends Vue {
        get paused(): boolean {
            return this.$store.getters.paused;
        }

        get finished(): boolean {
            return this.$store.getters.status === GAME_STATUS.FINISHED;
        }

        private reset(): Promise<void> {
            return this.pause(true).then(() => this.$store.dispatch('start', true));
        }

        private restart(): Promise<void> {
            return this.$store.dispatch('start').then(() => this.pause(false));
        }

        private pause(value: boolean): Promise<void> {
            return this.$store.dispatch('pause', value);
        }
    }
</script>
<style lang="scss" scoped>
    $button-bg-color: #3f4548;
    $button-border-color: lighten($button-bg-color,10%);
    $button-bg-hover-color: darken($button-bg-color,5%);
    $button-bg-shadow-active-color: darken($button-bg-color,10%);
    nav#actions {
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
        }
    }
</style>
