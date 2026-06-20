const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            if (AuthService.isLoggedIn()) {
                Router.navigate('dashboard');
            } else {
                LoginPage.render();
            }
        });

        Router.register('dashboard', () => {
            if (!AuthService.requireAuth()) return;
            DashboardPage.render();
        });

        Router.register('demand', () => {
            if (!AuthService.requireAuth()) return;
            DemandPage.render();
        });

        Router.register('match', () => {
            if (!AuthService.requireAuth()) return;
            MatchPage.render();
        });

        Router.register('calendar', () => {
            if (!AuthService.requireAuth()) return;
            CalendarPage.render();
        });

        Router.register('profile', () => {
            if (!AuthService.requireAuth()) return;
            ProfilePage.render();
        });

        Router.register('404', () => {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="auth-container">
                    <div class="card" style="max-width: 460px; padding: 40px; text-align: center;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🔍</div>
                        <h2 style="color: var(--text-primary); margin-bottom: 8px;">页面不存在</h2>
                        <p style="color: var(--text-secondary); margin-bottom: 24px;">您访问的页面不存在</p>
                        <button class="btn btn-primary" onclick="Router.navigate('dashboard')">返回首页</button>
                    </div>
                </div>
            `;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
