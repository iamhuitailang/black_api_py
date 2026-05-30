
const App = {
    setup() {
        const router = window.ChouchouRouter;
        
        const isLoggedIn = Vue.computed(() => Store.isLoggedIn);
        const currentTheme = Vue.computed(() => Store.currentTheme);

        return {
            isLoggedIn,
            currentTheme
        };
    },
    template: `
        <router-view />
    `
};

const app = Vue.createApp(App);

app.component('ThemeSwitcher', ThemeSwitcher);
app.component('PlayerSeat', PlayerSeat);
app.component('CommandCard', CommandCard);
app.component('ActionButtons', ActionButtons);
app.component('GameStatus', GameStatus);

app.component('LoginView', LoginView);
app.component('RegisterView', RegisterView);
app.component('LobbyView', LobbyView);
app.component('GameView', GameView);
app.component('ProfileView', ProfileView);
app.component('SettingsView', SettingsView);
app.component('LeaderboardView', LeaderboardView);

app.use(window.ChouchouRouter);

app.mount('#app');

window.ChouchouApp = app;
