import {createApp} from 'vue'
import App from './App.vue'
import {createPinia} from "pinia";
import {AppService} from "@/services/app-service.ts";
import './assets/css/main.css';

const app = createApp(App);
app.config.globalProperties.$appService = new AppService();
app.use(createPinia());
app.mount('#app');
