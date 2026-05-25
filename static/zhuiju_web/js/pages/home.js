const HomePage = {
    async render() {
        const searchKw = Router.queryParams.search || '';
        const app = document.getElementById('app');

        if (searchKw) {
            await this._renderSearch(searchKw);
            return;
        }

        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">👋 我的剧库</h1>
                <p class="page-subtitle">加载中...</p>
            </div>
        `;

        const [statsRes, wantRes, watchingRes, finishedRes] = await Promise.all([
            ApiService.statistics(),
            ApiService.listDramas({ status: 'want', sort_by: 'updated_at', order: 'desc' }),
            ApiService.listDramas({ status: 'watching', sort_by: 'updated_at', order: 'desc' }),
            ApiService.listDramas({ status: 'finished', sort_by: 'updated_at', order: 'desc' })
        ]);

        const s = (statsRes.data || {});
        const wantList = wantRes.data?.items || [];
        const watchingList = watchingRes.data?.items || [];
        const finishedList = finishedRes.data?.items || [];

        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">👋 我的剧库</h1>
                <p class="page-subtitle">记录每一集看过的故事</p>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">全部剧集</div>
                        <div class="stat-value">${s.total_dramas || 0}</div>
                    </div>
                    <div class="stat-card accent">
                        <div class="stat-label">已看完</div>
                        <div class="stat-value">${s.finished_count || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">总观看集数</div>
                        <div class="stat-value">${s.total_watched_episodes || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">总观看时长</div>
                        <div class="stat-value">${s.total_watch_hours || 0}<span style="font-size:14px;font-weight:500">h</span></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">平均评分</div>
                        <div class="stat-value">${s.avg_rating ? s.avg_rating.toFixed(1) : '-'}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">本月完成</div>
                        <div class="stat-value">${s.finished_this_month || 0}</div>
                    </div>
                </div>

                ${this._renderSection('🔥 正在追', watchingList, 'watching')}
                ${this._renderSection('📋 想看清单', wantList.slice(0, 6), 'want')}
                ${this._renderSection('⭐ 最近看完', finishedList.slice(0, 6), 'finished')}
            </div>
            ${BottomNav.render('home')}
        `;

        AppHeader.bindEvents();
        BottomNav.bindEvents();
        this._bindCards();
    },

    async _renderSearch(keyword) {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">🔍 搜索结果</h1>
                <p class="page-subtitle">搜索中...</p>
            </div>
            ${BottomNav.render('home')}
        `;

        const res = await ApiService.listDramas({ keyword });
        const items = res.data?.items || [];

        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <div style="margin-bottom:16px">
                    <button class="btn btn-ghost" onclick="Router.navigate('home')" style="flex:none;padding:6px 12px">← 返回首页</button>
                </div>
                <h1 class="page-title">🔍 搜索: ${Utils.escapeHtml(keyword)}</h1>
                <p class="page-subtitle">找到 ${items.length} 部剧集</p>
                ${items.length
                    ? `<div class="drama-grid" id="search-results">${items.map(d => DramaCard.render(d)).join('')}</div>`
                    : `<div class="empty-state"><div class="emoji">🔍</div><div class="title">未找到「${Utils.escapeHtml(keyword)}」</div><div class="desc">换个关键词试试吧</div></div>`
                }
            </div>
            ${BottomNav.render('home')}
        `;

        AppHeader.bindEvents();
        BottomNav.bindEvents();

        const searchInput = document.getElementById('global-search');
        if (searchInput) searchInput.value = keyword;

        const grid = document.getElementById('search-results');
        if (grid) {
            DramaCard.bindEvents(grid, {
                onEpisodePlus: async (id) => {
                    const r = await ApiService.episodePlus(id);
                    if (r.code === 0) {
                        Utils.toast('已更新一集 🎬', 'success');
                        this._renderSearch(keyword);
                    } else {
                        Utils.toast(r.message, 'error');
                    }
                },
                onStatusChange: async (id, status) => {
                    const r = await ApiService.changeStatus(id, status);
                    if (r.code === 0) {
                        Utils.toast('状态已更新', 'success');
                        this._renderSearch(keyword);
                    } else {
                        Utils.toast(r.message, 'error');
                    }
                }
            });
        }
    },

    _renderSection(title, items, status) {
        if (!items.length) {
            return `
                <div style="margin-bottom:32px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                        <h2 style="font-size:18px;font-weight:600">${title}</h2>
                        <button class="btn btn-ghost" data-view-all="${status}" style="flex:none;padding:6px 12px">查看全部 →</button>
                    </div>
                    <div class="empty-state" style="padding:30px">
                        <div class="emoji">📭</div>
                        <div class="title">暂无剧集</div>
                    </div>
                </div>
            `;
        }
        return `
            <div style="margin-bottom:32px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                    <h2 style="font-size:18px;font-weight:600">${title} <span style="color:var(--text-muted);font-size:13px;font-weight:400">(${items.length})</span></h2>
                    <button class="btn btn-ghost" data-view-all="${status}" style="flex:none;padding:6px 12px">查看全部 →</button>
                </div>
                <div class="drama-grid" data-section="${status}">
                    ${items.map(d => DramaCard.render(d)).join('')}
                </div>
            </div>
        `;
    },

    _bindCards() {
        document.querySelectorAll('[data-view-all]').forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.viewAll;
                Router.navigate(status);
            });
        });
        document.querySelectorAll('.drama-grid').forEach(grid => {
            DramaCard.bindEvents(grid, {
                onEpisodePlus: async (id) => {
                    const r = await ApiService.episodePlus(id);
                    if (r.code === 0) {
                        Utils.toast('已更新一集 🎬', 'success');
                        this.render();
                    } else {
                        Utils.toast(r.message, 'error');
                    }
                },
                onStatusChange: async (id, status) => {
                    const r = await ApiService.changeStatus(id, status);
                    if (r.code === 0) {
                        Utils.toast('已开始追 🚀', 'success');
                        this.render();
                    } else {
                        Utils.toast(r.message, 'error');
                    }
                }
            });
        });
    }
};

window.HomePage = HomePage;
