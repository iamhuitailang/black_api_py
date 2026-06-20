const { createApp, reactive, ref, computed, onMounted, watch, onBeforeUnmount } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/tracks', name: 'tracks', component: TracksView },
    { path: '/race', name: 'race', component: RaceView },
    { path: '/race/:trackId', name: 'race-with-track', component: RaceView, props: true },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/history/:id', name: 'history-detail', component: HistoryView, props: true },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
  ],
});

const appState = reactive({
  playerName: localStorage.getItem('icesled_player') || '玩家',
});

const app = createApp({
  setup() {
    watch(() => appState.playerName, (v) => {
      localStorage.setItem('icesled_player', v);
    });
    return { appState };
  }
});

app.use(router);
app.mount('#app');
