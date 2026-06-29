import { createPinia } from 'pinia';
import Vant from 'vant';
import { createApp } from 'vue';

import App from './App.vue';
import router from './router';
import './styles/base.css';
import 'vant/lib/index.css';

createApp(App).use(createPinia()).use(router).use(Vant).mount('#app');
