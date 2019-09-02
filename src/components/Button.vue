<template>
    <div class="button" @click="() => $emit('click')">
        <slot></slot>
    </div>
</template>
<script lang="ts">
    import {Component, Vue} from 'vue-property-decorator';

    @Component
    export default class Button extends Vue {}
</script>
<style lang="scss" scoped>
    $button-bg-color: #3f4548;
    $button-border-color: lighten($button-bg-color,10%);
    $button-bg-hover-color: darken($button-bg-color,5%);
    $button-bg-shadow-active-color: darken($button-bg-color,10%);
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
    }
</style>
