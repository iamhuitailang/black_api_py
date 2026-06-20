const App = {
    data() {
        return {
            currentPage: 'home',
            pageTitle: '首页',
            pageParams: {},
            initialized: false
        };
    },
    computed: {
        showLoginPage() {
            return this.currentPage === 'login';
        },
        pageConfig() {
            const titles = {
                'home': '首页',
                'submit': '在线投稿',
                'submissions': '我的投稿',
                'edit-submission': '编辑投稿',
                'manuscript-detail': '稿件详情',
                'review-tasks': '审稿任务',
                'editor-dashboard': '编辑工作台',
                'all-manuscripts': '全部稿件'
            };
            return {
                title: titles[this.currentPage] || '期刊审稿系统',
                component: this.getPageComponent()
            };
        }
    },
    methods: {
        navigateTo(page, params = {}) {
            const routeMap = {
                'home': () => this.redirectHomeByRole(),
                'submit': '#/submit',
                'submissions': '#/submissions',
                'edit-submission': (p) => `#/submission/edit/${p.id || ''}`,
                'manuscript-detail': (p) => `#/manuscript/${p.id}`,
                'review-tasks': '#/review-tasks',
                'editor-dashboard': '#/editor/dashboard',
                'all-manuscripts': (p) => p.status ? `#/editor/manuscripts?status=${p.status}` : '#/editor/manuscripts',
                'login': '#/login'
            };
            const route = routeMap[page];
            if (typeof route === 'function') {
                if (page === 'home') {
                    route();
                    return;
                }
                window.location.hash = route(params);
            } else if (route) {
                window.location.hash = route;
            }
        },
        redirectToLogin() {
            window.location.hash = '#/login';
        },
        redirectHomeByRole() {
            const role = Storage.getRoleInfo() || {};
            if (role.is_editor || role.is_admin) {
                window.location.hash = '#/editor/dashboard';
            } else if (role.is_reviewer) {
                window.location.hash = '#/review-tasks';
            } else {
                window.location.hash = '#/submissions';
            }
        },
        getPageComponent() {
            const map = {
                'login': 'login-page',
                'submit': 'submit-page',
                'submissions': 'submissions-page',
                'edit-submission': 'submit-page',
                'manuscript-detail': 'manuscript-detail-page',
                'review-tasks': 'review-tasks-page',
                'editor-dashboard': 'editor-dashboard-page',
                'all-manuscripts': 'all-manuscripts-page'
            };
            return map[this.currentPage] || '';
        },
        parseRoute() {
            const hash = window.location.hash || '#/';
            const clean = hash.replace(/^#\//, '');
            const [pathPart, queryPart] = clean.split('?');
            const parts = pathPart.split('/').filter(Boolean);
            const params = {};

            if (queryPart) {
                queryPart.split('&').forEach(q => {
                    const [k, v] = q.split('=');
                    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
                });
            }

            const token = Storage.getToken();
            const isLoginPage = parts[0] === 'login';

            if (!token && !isLoginPage) {
                window.location.hash = '#/login';
                return;
            }

            if (token && isLoginPage) {
                this.redirectHomeByRole();
                return;
            }

            if (!parts.length || parts.length === 0) {
                if (token) {
                    this.redirectHomeByRole();
                } else {
                    window.location.hash = '#/login';
                }
                return;
            }

            let page = '';
            const routeParams = { ...params };

            switch (parts[0]) {
                case 'login':
                    page = 'login';
                    break;
                case 'submit':
                    page = 'submit';
                    break;
                case 'submissions':
                    page = 'submissions';
                    break;
                case 'submission':
                    if (parts[1] === 'edit' && parts[2]) {
                        page = 'edit-submission';
                        routeParams.id = parseInt(parts[2]);
                    }
                    break;
                case 'manuscript':
                    if (parts[1]) {
                        page = 'manuscript-detail';
                        routeParams.id = parseInt(parts[1]);
                    }
                    break;
                case 'review-tasks':
                    page = 'review-tasks';
                    break;
                case 'editor':
                    if (parts[1] === 'dashboard') {
                        page = 'editor-dashboard';
                    } else if (parts[1] === 'manuscripts') {
                        page = 'all-manuscripts';
                    }
                    break;
                default:
                    this.redirectHomeByRole();
                    return;
            }

            this.pageParams = routeParams;
            this.currentPage = page;
        },
        async init() {
            const token = Storage.getToken();
            if (token) {
                try {
                    const roleRes = await JournalService.getRoleInfo();
                    if (roleRes.code === 0 && roleRes.data) {
                        Storage.setRoleInfo(roleRes.data);
                    } else if (roleRes.code === 401) {
                        Storage.clear();
                    }
                } catch (e) {
                    console.warn('Role info fetch failed', e);
                }
            }
            this.parseRoute();
            this.initialized = true;
        }
    },
    mounted() {
        this.parseRoute();
        this.init();
        window.addEventListener('hashchange', () => {
            this.parseRoute();
        });
    },
    template: `
        <div v-if="!showLoginPage">
            <main-layout :page-title="pageConfig.title" :current-page="currentPage">
                <component
                    :is="pageConfig.component"
                    :$route="{ params: pageParams }"
                    v-if="pageConfig.component"
                    :key="currentPage + '-' + (pageParams.id || pageParams.status || 'default')">
                </component>
            </main-layout>
        </div>
        <div v-else>
            <login-page v-if="initialized"></login-page>
        </div>
    `
};
