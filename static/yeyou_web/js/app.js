const allPages = [
    LoginPage,
    RegisterPage,
    HomePage,
    ExplorePage,
    ActivityDetailPage,
    CreatePage,
    ProfilePage,
    MyActivitiesPage,
    PostDetailPage,
    CreatePostPage
];

const pageMap = {};

allPages.forEach(page => {
    pageMap[page.name] = page;
});

const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('login', (args) => this.renderPage('login', args));
        Router.register('register', (args) => this.renderPage('register', args));
        Router.register('home', (args) => this.renderPage('home', args));
        Router.register('explore', (args) => this.renderPage('explore', args));
        Router.register('activity-detail', (args) => this.renderPage('activity-detail', args));
        Router.register('create', (args) => this.renderPage('create', args));
        Router.register('profile', (args) => this.renderPage('profile', args));
        Router.register('my-activities', (args) => this.renderPage('my-activities', args));
        Router.register('post-detail', (args) => this.renderPage('post-detail', args));
        Router.register('create-post', (args) => this.renderPage('create-post', args));
    },

    renderPage(pageName, args) {
        const page = pageMap[pageName];
        if (!page) {
            Router.navigate('home');
            return;
        }

        const app = document.getElementById('app');
        app.innerHTML = page.template;

        const params = Router.getParams();
        if (page.init) {
            page.init(params, args);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
