const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('dashboard', () => {
            DashboardPage.render();
        });

        Router.register('task', () => {
            TaskPage.render();
        });

        Router.register('kanban', () => {
            KanbanPage.render();
        });

        Router.register('member', () => {
            MemberPage.render();
        });

        Router.register('statistics', () => {
            StatisticsPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
