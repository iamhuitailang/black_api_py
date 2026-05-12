class OrderWebApp {
    constructor() {
        this.currentUser = null;
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
    }

    checkAuth() {
        const userStr = localStorage.getItem('order_user');
        if (userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                this.showMainPage();
                return;
            } catch (e) {
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
        if (loginPage) loginPage.classList.remove('active');
        if (mainPage) mainPage.classList.add('active');
        this.navigateTo('menu');
        this.updateProfile();
        
        setTimeout(() => {
            const event = new CustomEvent('pageChanged', { detail: 'menu' });
            document.dispatchEvent(event);
        }, 100);
    }

    navigateTo(pageName) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === pageName) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.content-page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(`page-${pageName}`).classList.add('active');

        const event = new CustomEvent('pageChanged', { detail: pageName });
        document.dispatchEvent(event);
    }

    updateProfile() {
        if (this.currentUser) {
            document.getElementById('profile-name').textContent = this.currentUser.real_name || this.currentUser.username;
            document.getElementById('profile-username').textContent = `@${this.currentUser.username}`;
        }
    }

    bindEvents() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const tabForm = document.getElementById(`${btn.dataset.tab}-form`);
                if (tabForm) tabForm.classList.add('active');
            });
        });

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value;
                const password = document.getElementById('login-password').value;

                console.log('Attempting web login with:', username);

                try {
                    const result = await OrderWebAPI.auth.login(username, password);
                    console.log('Login result:', result);

                    if (result.code === 0) {
                        this.currentUser = result.data.user;
                        localStorage.setItem('order_user', JSON.stringify(this.currentUser));
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

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                username: document.getElementById('reg-username').value,
                password: document.getElementById('reg-password').value,
                real_name: document.getElementById('reg-realname').value,
                phone: document.getElementById('reg-phone').value
            };

            const result = await OrderWebAPI.auth.register(data);
            if (result.code === 0) {
                showToast('注册成功，请登录');
                document.querySelector('[data-tab="login"]').click();
                document.getElementById('login-username').value = data.username;
            } else {
                showToast(result.msg || '注册失败', 'error');
            }
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigateTo(btn.dataset.page);
            });
        });

        document.getElementById('user-btn').addEventListener('click', () => {
            this.navigateTo('profile');
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    overlay.classList.remove('active');
                }
            });
        });
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new OrderWebApp();
});