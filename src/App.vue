<template>
    <div class="app-wrapper">
    <app-content></app-content>
    <footer-vue></footer-vue>
  </div>
</template>

<script>
import AppContent from "@/components/app-content.vue";
import FooterVue from "@/components/footer.vue";


export default {
    name: 'App',
    components: {
        FooterVue,
        AppContent,
    },
    data: function () {
    },
    created() {
    },
    methods: {},
    computed: {}
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

.app-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}


</style>
