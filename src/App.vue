<template>
    <section id="app">
        <transition name="fade">
            <div class="loader" v-if="loading">
                <img :src="require('@/assets/tron.png')" class="temporary-logo"/>
            </div>
            <article class="body" v-else>
                <Grid class="grid"/>
                <Scores class="scores"/>
            </article>
        </transition>
    </section>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';

    import Grid from '@/components/Grid.vue';
    import Scores from '@/components/Scores.vue';
    import {GAME_STATUS} from '@/common/constants';

    @Component({
        components: {
            Grid,
            Scores,
        },
    })
    export default class App extends Vue {
        private loading: boolean = true;

        get status(): GAME_STATUS {
            return this.$store.getters.status;
        }

        @Watch('status', {immediate: true})
        private onPersonChanged1(newStatus: GAME_STATUS) {
            if (newStatus !== GAME_STATUS.CLEAR) {
                this.loading = false;
            }
        }

        private mounted() {
            this.$store.dispatch('start');
        }
    }
</script>

<style lang="scss" scoped>
    section#app {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #000;
        color: #ddd;
        font-family: Verdana, Arial, sans-serif;

        div.loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity .2s;

            img.temporary-logodefault {
                position: absolute;
                width: 75px;
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

        article.body {
            position: absolute;
            top: 50%;
            left: 0;
            white-space: nowrap;
            transform: translateY(-50%);
            width: 100%;
            text-align: center;

            .grid, .scores {
                vertical-align: middle;
                display: inline-block;
                margin: 0 10px;
            }
        }
    }

    .fade-enter, .fade-leave-to {
        opacity: 0;
    }
</style>
