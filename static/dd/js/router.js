const Router = {
    currentPage: 'tasks',
    previousPage: null,
    pageStack: [],
    listeners: [],

    pages: {
        login: {
            id: 'page-login',
            title: '登录',
            requireAuth: false
        },
        register: {
            id: 'page-register',
            title: '注册',
            requireAuth: false
        },
        tasks: {
            id: 'page-tasks',
            title: '任务广场',
            requireAuth: true
        },
        myTasks: {
            id: 'page-my-tasks',
            title: '我的任务',
            requireAuth: true
        },
        taskDetail: {
            id: 'page-task-detail',
            title: '任务详情',
            requireAuth: true
        },
        publishTask: {
            id: 'page-publish-task',
            title: '发布任务',
            requireAuth: true
        },
        profile: {
            id: 'page-profile',
            title: '个人中心',
            requireAuth: true
        },
        editProfile: {
            id: 'page-edit-profile',
            title: '编辑资料',
            requireAuth: true
        },
        contactSettings: {
            id: 'page-contact-settings',
            title: '联系方式',
            requireAuth: true
        },
        changePassword: {
            id: 'page-change-password',
            title: '修改密码',
            requireAuth: true
        },
        myReports: {
            id: 'page-my-reports',
            title: '我的举报',
            requireAuth: true
        }
    },

    init() {
        this.bindEvents();
        this.handleInitialRoute();
    },

    bindEvents() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page, { replace: true, triggerEvent: false });
            }
        });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-route]');
            if (link) {
                e.preventDefault();
                const page = link.dataset.route;
                const params = link.dataset.params ? JSON.parse(link.dataset.params) : {};
                this.navigate(page, { params });
            }
        });
    },

    handleInitialRoute() {
        const params = Utils.getQueryParams();
        const page = params.page || 'tasks';
        
        if (Auth.isLoggedIn()) {
            this.navigate(page, { replace: true });
        } else {
            this.navigate('login', { replace: true });
        }
    },

    navigate(pageName, options = {}) {
        const { params = {}, replace = false, triggerEvent = true } = options;
        const page = this.pages[pageName];

        if (!page) {
            console.error(`Page not found: ${pageName}`);
            return;
        }

        if (page.requireAuth && !Auth.isLoggedIn()) {
            this.navigate('login', { replace: true });
            return;
        }

        this.previousPage = this.currentPage;
        this.currentPage = pageName;

        if (!replace && this.previousPage) {
            this.pageStack.push(this.previousPage);
        }

        this.hideAllPages();
        this.showPage(pageName, params);
        this.updateHeader(pageName);
        this.updateTabBar(pageName);

        if (triggerEvent) {
            this.trigger('navigate', { page: pageName, params });
        }

        const url = new URL(window.location.href);
        url.searchParams.set('page', pageName);
        
        if (replace) {
            window.history.replaceState({ page: pageName }, '', url.toString());
        } else {
            window.history.pushState({ page: pageName }, '', url.toString());
        }
    },

    back() {
        if (this.pageStack.length > 0) {
            const previousPage = this.pageStack.pop();
            this.navigate(previousPage, { replace: true });
        } else {
            this.navigate('tasks', { replace: true });
        }
    },

    hideAllPages() {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
    },

    showPage(pageName, params = {}) {
        const page = this.pages[pageName];
        const pageElement = document.getElementById(page.id);
        
        if (pageElement) {
            pageElement.classList.add('active');
            pageElement.dataset.params = JSON.stringify(params);
            
            const event = new CustomEvent('page-show', {
                detail: { page: pageName, params }
            });
            pageElement.dispatchEvent(event);
        }
    },

    updateHeader(pageName) {
        const page = this.pages[pageName];
        const headerTitle = document.querySelector('.header-title');
        
        if (headerTitle) {
            headerTitle.textContent = page ? page.title : '';
        }

        const headerBack = document.querySelector('.header-btn-back');
        if (headerBack) {
            if (this.pageStack.length > 0 || 
                pageName === 'taskDetail' || 
                pageName === 'editProfile' ||
                pageName === 'contactSettings' ||
                pageName === 'changePassword' ||
                pageName === 'myReports') {
                headerBack.style.display = 'flex';
            } else {
                headerBack.style.display = 'none';
            }
        }
    },

    updateTabBar(pageName) {
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.page === pageName) {
                tab.classList.add('active');
            }
        });

        const tabBar = document.querySelector('.tab-bar');
        const header = document.querySelector('.header');
        
        if (pageName === 'login' || pageName === 'register') {
            if (tabBar) tabBar.style.display = 'none';
            if (header) header.style.display = 'none';
        } else {
            if (tabBar) tabBar.style.display = 'flex';
            if (header) header.style.display = 'flex';
        }
    },

    on(event, callback) {
        this.listeners.push({ event, callback });
    },

    off(event, callback) {
        this.listeners = this.listeners.filter(
            listener => listener.event !== event || listener.callback !== callback
        );
    },

    trigger(event, data) {
        this.listeners
            .filter(listener => listener.event === event)
            .forEach(listener => listener.callback(data));
    },

    getCurrentPage() {
        return this.currentPage;
    },

    getParams() {
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage.dataset.params) {
            try {
                return JSON.parse(activePage.dataset.params);
            } catch (e) {
                return {};
            }
        }
        return {};
    }
};

window.Router = Router;
