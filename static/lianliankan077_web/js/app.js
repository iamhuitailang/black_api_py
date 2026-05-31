const App = {
    init() {
        this.registerRoutes()
        Router.init()
    },

    registerRoutes() {
        Router.register('login', () => {
            LoginPage.render()
        })

        Router.register('register', () => {
            RegisterPage.render()
        })

        Router.register('home', () => {
            HomePage.render()
        })

        Router.register('game', () => {
            GamePage.render()
        })

        Router.register('profile', () => {
            ProfilePage.render()
        })

        Router.register('changePassword', () => {
            ChangePasswordPage.render()
        })

        Router.register('leaderboard', () => {
            LeaderboardPage.render()
        })

        Router.register('shop', () => {
            ShopPage.render()
        })

        Router.register('myProps', () => {
            MyPropsPage.render()
        })

        Router.register('myRecords', () => {
            MyRecordsPage.render()
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    App.init()
})
