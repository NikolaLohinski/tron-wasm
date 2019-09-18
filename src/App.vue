<template>
    <section id="app">
        <transition name="fade">
            <Loader v-if="loading"/>
            <article class="body" v-else>
                <div class="playground">
                    <Grid class="grid"/>
                    <Scores class="scores"/>
                </div>
                <Actions class="actions" @charts="insights = true"/>
            </article>
        </transition>
        <Insights :opened="insights" @close="insights = false"/>
    </section>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';

import Grid from '@/components/Grid.vue';
import Scores from '@/components/Scores.vue';
import Actions from '@/components/Actions.vue';
import Insights from '@/components/Insights.vue';

import {GAME_STATUS} from '@/common/constants';
import Loader from '@/components/Loader.vue';

@Component({
    components: {
        Grid,
        Scores,
        Actions,
        Insights,
        Loader,
    },
})
export default class App extends Vue {
    private loading: boolean = true;
    private insights: boolean = false;

    get status(): GAME_STATUS {
        return this.$store.getters.status;
    }

    @Watch('status', {immediate: true})
    private onNewStatus(newStatus: GAME_STATUS) {
        if (newStatus !== GAME_STATUS.CLEAR) {
            this.loading = false;
        }
    }

    private mounted() {
        this.$store.dispatch('start', true);
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
        background-color: #0d0d0d;
        color: #ddd;
        font-family: Verdana, Arial, sans-serif;
        article.body {
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            transform: translateY(-50%);
            text-align: center;
            .actions {
                margin: 45px auto;
            }
            .playground {
                margin: 15px auto;
                white-space: nowrap;
                text-align: center;
                .grid, .scores {
                    margin: 15px auto;
                    @media screen and (min-width: 750px) {
                        display: inline-block;
                        margin: 0 10px;
                    }
                    vertical-align: middle;
                }
            }
        }
    }

    .fade-enter, .fade-leave-to {
        opacity: 0;
    }
</style>
