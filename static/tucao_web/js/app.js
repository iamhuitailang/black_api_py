const App = {
    newPostTip: null,
    lastCheckTime: Date.now(),

    init() {
        this.registerRoutes();
        Router.init();
        this.newPostTip = document.getElementById('newPostTip');
        this.startNewPostCheck();
    },

    registerRoutes() {
        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('login', () => {
            LoginPage.render();
        });

        Router.register('register', () => {
            RegisterPage.render();
        });

        Router.register('post', () => {
            PostPage.render();
        });

        Router.register('detail', (params) => {
            DetailPage.render(params[0]);
        });

        Router.register('myPosts', () => {
            MyPostsPage.render();
        });

        Router.register('settings', () => {
            SettingsPage.render();
        });

        Router.register('share', (params) => {
            SharePage.render(params[0]);
        });
    },

    startNewPostCheck() {
        setInterval(async () => {
            try {
                const result = await ApiService.get('/tucao/post/list/get', {
                    page: 1,
                    page_size: 1
                });

                if (result.code === 0 && result.data.items.length > 0) {
                    const latestPost = result.data.items[0];
                    const postTime = new Date(latestPost.created_at).getTime();
                    
                    if (postTime > this.lastCheckTime && this.newPostTip) {
                        this.newPostTip.classList.remove('hidden');
                        setTimeout(() => {
                            if (this.newPostTip) {
                                this.newPostTip.classList.add('hidden');
                            }
                        }, 3000);
                    }
                }
                this.lastCheckTime = Date.now();
            } catch (e) {
                console.error('Check new posts error:', e);
            }
        }, 30000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
