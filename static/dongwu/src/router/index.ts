import { createRouter, createWebHistory } from 'vue-router';
import MainPark from '../pages/MainPark.vue';
import ClassRoom from '../pages/ClassRoom.vue';
import FeedingRoom from '../pages/FeedingRoom.vue';
import Shop from '../pages/Shop.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'park', component: MainPark },
    { path: '/class', name: 'class', component: ClassRoom },
    { path: '/feed', name: 'feed', component: FeedingRoom },
    { path: '/shop', name: 'shop', component: Shop },
  ],
});

export default router;
