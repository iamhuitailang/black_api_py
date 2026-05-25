const ListPage = {
    async renderForStatus(status, title, subtitle, emoji) {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${AppHeader.render()}
            <div class="page-section">
                <h1 class="page-title">${emoji} ${title}</h1>
                <p class="page-subtitle">${subtitle}</p>
                <div id="filter-bar"></div>
                <div id="drama-list"></div>
            </div>
            ${BottomNav.render(status)}
        `;

        AppHeader.bindEvents();
        BottomNav.bindEvents();

        const listEl = document.getElementById('drama-list');
        listEl.innerHTML = '<p style="color:var(--text-muted)">加载中...</p>';

        const filtersRes = await ApiService.filters();
        const filterData = filtersRes.data || { statuses: [], genres: [], years: [] };

        let state = {
            genre: null,
            year: null,
            sort_by: 'updated_at',
            order: 'desc',
            keyword: null
        };

        const renderFilterBar = () => {
            const genres = filterData.genres || [];
            const years = filterData.years || [];
            const html = `
                <div class="filter-bar">
                    <span class="chip ${state.genre === null ? 'active' : ''}" data-filter="genre" data-value="">全部类型</span>
                    ${genres.map(g => `<span class="chip ${state.genre === g ? 'active' : ''}" data-filter="genre" data-value="${Utils.escapeHtml(g)}">${Utils.escapeHtml(g)}</span>`).join('')}
                    <select class="select-control" data-filter="year">
                        <option value="">全部年份</option>
                        ${years.map(y => `<option value="${y}" ${state.year == y ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                    <select class="select-control" data-filter="sort_by">
                        <option value="updated_at" ${state.sort_by === 'updated_at' ? 'selected' : ''}>最近更新</option>
                        <option value="name" ${state.sort_by === 'name' ? 'selected' : ''}>剧名 A-Z</option>
                        <option value="rating" ${state.sort_by === 'rating' ? 'selected' : ''}>评分最高</option>
                        <option value="progress" ${state.sort_by === 'progress' ? 'selected' : ''}>进度最高</option>
                    </select>
                    <select class="select-control" data-filter="order">
                        <option value="desc" ${state.order === 'desc' ? 'selected' : ''}>降序</option>
                        <option value="asc" ${state.order === 'asc' ? 'selected' : ''}>升序</option>
                    </select>
                </div>
            `;
            document.getElementById('filter-bar').innerHTML = html;

            document.querySelectorAll('[data-filter="genre"]').forEach(el => {
                el.addEventListener('click', () => {
                    state.genre = el.dataset.value || null;
                    loadList();
                });
            });
            document.querySelectorAll('select[data-filter]').forEach(el => {
                el.addEventListener('change', () => {
                    state[el.dataset.filter] = el.value || null;
                    loadList();
                });
            });
        };

        const loadList = async () => {
            const params = { status, sort_by: state.sort_by, order: state.order };
            if (state.genre) params.genre = state.genre;
            if (state.year) params.year = state.year;
            if (state.keyword) params.keyword = state.keyword;
            const res = await ApiService.listDramas(params);
            const items = res.data?.items || [];
            if (!items.length) {
                listEl.innerHTML = `
                    <div class="empty-state">
                        <div class="emoji">📭</div>
                        <div class="title">这里还没有剧集</div>
                        <div class="desc">去添加你喜欢的剧吧</div>
                    </div>
                `;
            } else {
                listEl.innerHTML = `<div class="drama-grid">${items.map(d => DramaCard.render(d)).join('')}</div>`;
                DramaCard.bindEvents(listEl.querySelector('.drama-grid'), {
                    onEpisodePlus: async (id) => {
                        const r = await ApiService.episodePlus(id);
                        if (r.code === 0) {
                            Utils.toast('已更新一集 🎬', 'success');
                            loadList();
                        } else Utils.toast(r.message, 'error');
                    },
                    onStatusChange: async (id, newStatus) => {
                        const r = await ApiService.changeStatus(id, newStatus);
                        if (r.code === 0) {
                            Utils.toast('状态已更新', 'success');
                            loadList();
                        } else Utils.toast(r.message, 'error');
                    }
                });
            }
        };

        renderFilterBar();
        await loadList();
    }
};

const WantPage = {
    render() { return ListPage.renderForStatus('want', '想看清单', '剧荒时来这里翻翻灵感 ✨', '📋'); }
};
const WatchingPage = {
    render() { return ListPage.renderForStatus('watching', '正在追', '每一集都值得认真追 🔥', '🔥'); }
};
const FinishedPage = {
    render() { return ListPage.renderForStatus('finished', '已看完', '那些陪你度过夜晚的故事 ⭐', '⭐'); }
};
const DroppedPage = {
    render() { return ListPage.renderForStatus('dropped', '弃剧', '有些剧终究没走到最后 😢', '😢'); }
};

window.WantPage = WantPage;
window.WatchingPage = WatchingPage;
window.FinishedPage = FinishedPage;
window.DroppedPage = DroppedPage;
