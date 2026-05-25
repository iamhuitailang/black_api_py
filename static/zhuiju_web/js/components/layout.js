const AppHeader = {
    render() {
        const current = Router.getCurrentRoute() || 'home';
        return `
            <div class="app-header">
                <div class="header-inner">
                    <div class="logo" data-route="home" style="cursor:pointer">
                        <span class="logo-emoji">📺</span>
                        <span>追剧清单</span>
                    </div>
                    <div class="header-right">
                        <div class="search-box">
                            <input type="text" id="global-search" placeholder="搜索剧集...">
                        </div>
                        <button class="icon-btn" id="btn-add" title="添加剧集">➕</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const logo = document.querySelector('.logo[data-route]');
        if (logo) {
            logo.addEventListener('click', () => Router.navigate('home'));
        }
        const addBtn = document.getElementById('btn-add');
        if (addBtn) {
            addBtn.addEventListener('click', () => Router.navigate('add'));
        }
        const search = document.getElementById('global-search');
        if (search) {
            search.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const kw = e.target.value.trim();
                    if (kw) {
                        Router.navigate('home', { search: kw });
                    } else {
                        Router.navigate('home');
                    }
                }
            });
            search.addEventListener('blur', (e) => {
                const kw = e.target.value.trim();
                if (kw) {
                    Router.navigate('home', { search: kw });
                }
            });
        }
    }
};

const BottomNav = {
    items: [
        { route: 'home', icon: '🏠', label: '首页' },
        { route: 'want', icon: '📋', label: '想看' },
        { route: 'watching', icon: '🔥', label: '正在追' },
        { route: 'finished', icon: '⭐', label: '已看完' },
        { route: 'stats', icon: '📊', label: '统计' },
        { route: 'settings', icon: '⚙️', label: '设置' }
    ],

    render(active) {
        return `
            <nav class="bottom-nav">
                ${this.items.map(it => `
                    <div class="nav-item ${it.route === active ? 'active' : ''}" data-route="${it.route}">
                        <span class="nav-icon">${it.icon}</span>
                        <span>${it.label}</span>
                    </div>
                `).join('')}
            </nav>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(el => {
            el.addEventListener('click', () => {
                const route = el.dataset.route;
                Router.navigate(route);
            });
        });
    }
};

window.AppHeader = AppHeader;
window.BottomNav = BottomNav;
