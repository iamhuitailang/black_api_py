const App = {
    init() {
        this.checkAuth();
        this.bindEvents();
    },

    checkAuth() {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('login.html');
        const token = Storage.getToken();

        if (!token && !isLoginPage) {
            window.location.href = 'login.html';
        }

        if (token && isLoginPage) {
            window.location.href = 'index.html';
        }
    },

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        this.setActiveNav();
        this.setUserName();
    },

    setActiveNav() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (currentPath.includes(href)) {
                item.classList.add('active');
            }
        });
    },

    setUserName() {
        const user = Storage.getUser();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && user) {
            userNameEl.textContent = user.username || user.nickname || '管理员';
        }
    },

    async handleLogout() {
        await API.auth.logout();
        Storage.clear();
        Toast.success('退出成功');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
