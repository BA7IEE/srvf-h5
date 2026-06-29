import { createRouter, createWebHistory } from 'vue-router';

import ApplyPage from '@/pages/ApplyPage.vue';
import ConfirmPage from '@/pages/ConfirmPage.vue';
import HomePage from '@/pages/HomePage.vue';
import IdCardPage from '@/pages/IdCardPage.vue';
import ProgressPage from '@/pages/ProgressPage.vue';
import ResultPage from '@/pages/ResultPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/recruit/apply', name: 'apply', component: ApplyPage },
    { path: '/recruit/id-card', name: 'id-card', component: IdCardPage },
    { path: '/recruit/confirm', name: 'confirm', component: ConfirmPage },
    { path: '/recruit/progress', name: 'progress', component: ProgressPage },
    { path: '/recruit/result', name: 'result', component: ResultPage },
  ],
});

export default router;
