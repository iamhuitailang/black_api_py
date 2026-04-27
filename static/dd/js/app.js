const app = {
    currentCategory: '',
    currentKeyword: '',
    myTasksType: 'published',

    init() {
        TaskModule.init();
        ProfileModule.init();
        this.bindEvents();
        Router.init();
    },

    bindEvents() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        const tabItems = document.querySelectorAll('.tab-item');
        tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                const page = tab.dataset.page;
                if (page) {
                    Router.navigate(page, { replace: true });
                }
            });
        });

        const filterTabs = document.getElementById('task-filter-tabs');
        if (filterTabs) {
            filterTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.filter-tab');
                if (tab) {
                    const category = tab.dataset.category || '';
                    this.handleCategoryFilter(category, tab);
                }
            });
        }

        const myTasksFilterTabs = document.getElementById('my-tasks-filter-tabs');
        if (myTasksFilterTabs) {
            myTasksFilterTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.filter-tab');
                if (tab) {
                    const type = tab.dataset.type || 'published';
                    this.handleMyTasksTypeFilter(type, tab);
                }
            });
        }

        const searchInput = document.getElementById('task-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
    },

    async handleLogin() {
        const phone = document.getElementById('login-phone')?.value.trim();
        const password = document.getElementById('login-password')?.value;

        if (!phone) {
            Utils.showToast('请输入手机号', 'warning');
            return;
        }

        if (!Utils.isValidPhone(phone)) {
            Utils.showToast('请输入正确的手机号', 'warning');
            return;
        }

        if (!password) {
            Utils.showToast('请输入密码', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btn-login');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 登录中...';
        }

        try {
            await Auth.login(phone, password);
            Utils.showToast('登录成功', 'success');
            Router.navigate('tasks', { replace: true });
        } catch (error) {
            Utils.showToast(error.message || '登录失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    async handleRegister() {
        const phone = document.getElementById('register-phone')?.value.trim();
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;

        if (!phone) {
            Utils.showToast('请输入手机号', 'warning');
            return;
        }

        if (!Utils.isValidPhone(phone)) {
            Utils.showToast('请输入正确的手机号', 'warning');
            return;
        }

        if (!Utils.isValidPassword(password)) {
            Utils.showToast('密码至少6位', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showToast('两次密码不一致', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btn-register');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span> 注册中...';
        }

        try {
            await Auth.register(phone, password);
            Utils.showToast('注册成功', 'success');
            Router.navigate('tasks', { replace: true });
        } catch (error) {
            Utils.showToast(error.message || '注册失败', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    },

    handleCategoryFilter(category, tab) {
        const tabs = document.querySelectorAll('#task-filter-tabs .filter-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.currentCategory = category;
        TaskModule.loadTasks({
            category: this.currentCategory,
            keyword: this.currentKeyword,
            showSkeleton: false
        });
    },

    handleMyTasksTypeFilter(type, tab) {
        const tabs = document.querySelectorAll('#my-tasks-filter-tabs .filter-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.myTasksType = type;
        TaskModule.loadMyTasks(type, false);
    },

    handleSearch(keyword) {
        this.currentKeyword = keyword.trim();
        TaskModule.loadTasks({
            category: this.currentCategory,
            keyword: this.currentKeyword
        });
    },

    refreshCurrentPage() {
        const currentPage = Router.getCurrentPage();
        
        switch (currentPage) {
            case 'tasks':
                TaskModule.loadTasks({
                    category: this.currentCategory,
                    keyword: this.currentKeyword
                });
                break;
            case 'myTasks':
                TaskModule.loadMyTasks(this.myTasksType);
                break;
            case 'taskDetail':
                TaskModule.loadTaskDetail();
                break;
            case 'profile':
                ProfileModule.loadProfile();
                break;
            case 'myReports':
                ProfileModule.loadMyReports();
                break;
            default:
                break;
        }
    },

    handleModalClick(event, modalId) {
        if (event.target.classList.contains('modal-overlay')) {
            TaskModule.hideModal(modalId);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

window.app = app;
