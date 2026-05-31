const AdminApp = {
    init() {
        this.registerRoutes()
        AdminRouter.init()
    },

    registerRoutes() {
        AdminRouter.register('login', () => {
            AdminLoginPage.render()
        })

        AdminRouter.register('dashboard', () => {
            AdminDashboardPage.render()
        })

        AdminRouter.register('users', () => {
            AdminUsersPage.render()
        })

        AdminRouter.register('themes', () => {
            AdminThemesPage.render()
        })

        AdminRouter.register('props', () => {
            AdminPropsPage.render()
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init()
})
