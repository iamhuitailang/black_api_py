class OrderAdminApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
    }

    async checkAuth() {
        const token = localStorage.getItem('order_admin_token');
        if (token) {
            try {
                const result = await OrderAdminAPI.auth.currentUser();
                if (result.code === 0) {
                    this.currentUser = result.data;
                    this.showMainPage();
                    return;
                }
            } catch (e) {
                console.error('Auth check failed:', e);
            }
        }
        this.showLoginPage();
    }

    showLoginPage() {
        const loginPage = document.getElementById('login-page');
        const mainPage = document.getElementById('main-page');
        console.log('Showing login page');
        
        if (loginPage) {
            loginPage.classList.add('active');
            console.log('Login page classes:', loginPage.className);
        }
        if (mainPage) {
            mainPage.classList.remove('active');
            console.log('Main page classes:', mainPage.className);
        }
        
        setTimeout(() => {
            console.log('After timeout - login has active:', loginPage?.classList.contains('active'));
            console.log('After timeout - main has active:', mainPage?.classList.contains('active'));
        }, 200);
    }

    showMainPage() {
        const loginPage = document.getElementById('login-page');
        const mainPage = document.getElementById('main-page');
        console.log('Showing main page, elements exist:', !!loginPage, !!mainPage);
        
        if (loginPage) loginPage.classList.remove('active');
        if (mainPage) mainPage.classList.add('active');
        this.navigateTo('dashboard');
        
        setTimeout(() => {
            const event = new CustomEvent('pageChanged', { detail: 'dashboard' });
            document.dispatchEvent(event);
        }, 100);
    }

    navigateTo(pageName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === pageName) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`page-${pageName}`).classList.add('active');

        const event = new CustomEvent('pageChanged', { detail: pageName });
        document.dispatchEvent(event);
    }

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                console.log('Attempting login with:', username);

                try {
                    const result = await OrderAdminAPI.auth.login(username, password);
                    console.log('Login result:', result);

                    if (result.code === 0) {
                        localStorage.setItem('order_admin_token', result.data.token);
                        this.currentUser = result.data.user;
                        console.log('User set:', this.currentUser);
                        showToast('登录成功');
                        this.showMainPage();
                    } else {
                        showToast(result.msg || '登录失败', 'error');
                    }
                } catch (e) {
                    console.error('Login error:', e);
                    showToast('登录失败，请检查网络', 'error');
                }
            });
        }

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await OrderAdminAPI.auth.logout();
            localStorage.removeItem('order_admin_token');
            this.currentUser = null;
            
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            
            showToast('已退出登录');
            
            setTimeout(() => {
                this.showLoginPage();
            }, 50);
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = item.dataset.page;
                this.navigateTo(pageName);
            });
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('modal-overlay').classList.remove('active');
            });
        });

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('modal-overlay').classList.remove('active');
            }
        });
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new OrderAdminApp();
});