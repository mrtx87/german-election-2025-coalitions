<template>
    <div style="display: flex; justify-content: center;">
        <app-content></app-content>
    </div>
</template>

<script>
import AppContent from "@/components/app-content.vue";

export default {
    name: 'App',
    components: {
        AppContent,
    }
}
</script>

<style>

#app {
    font-family: Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
}
</style>
