const RankingPage = {
    currentSort: 'coins',
    data: null,

    render() {
        if (!AuthService.requireAuth()) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page-container">
                <header class="page-header">
                    <button class="btn btn-outline btn-small" onclick="window.location.hash='#/home'">← 返回</button>
                    <h2>🏆 排行榜</h2>
                    <div></div>
                </header>

                <div class="tabs">
                    <div class="tab ${this.currentSort === 'coins' ? 'tab-active' : ''}" data-sort="coins">金币榜</div>
                    <div class="tab ${this.currentSort === 'wins' ? 'tab-active' : ''}" data-sort="wins">胜场榜</div>
                    <div class="tab ${this.currentSort === 'level' ? 'tab-active' : ''}" data-sort="level">等级榜</div>
                </div>

                <div class="ranking-list" id="rankingList">
                    <div class="loading">加载中...</div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.loadData();
    },

    bindEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentSort = tab.dataset.sort;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
                tab.classList.add('tab-active');
                this.loadData();
            });
        });
    },

    async loadData() {
        const result = await Api.get('/ranking/list/get', {
            sort_by: this.currentSort,
            page_size: 100
        });

        const list = document.getElementById('rankingList');

        if (result.code === 0 && result.data && result.data.items) {
            this.data = result.data;
            list.innerHTML = this.renderList(result.data.items);
        } else {
            list.innerHTML = '<div class="empty">暂无数据</div>';
        }
    },

    renderList(items) {
        if (!items || items.length === 0) {
            return '<div class="empty">暂无数据</div>';
        }

        const currentUser = AuthService.getUser();
        const sortField = this.currentSort;

        return items.map((item, index) => {
            const isCurrentUser = currentUser && currentUser.id === item.id;
            let rankDisplay = index + 1;
            let rankClass = '';

            if (index === 0) {
                rankDisplay = '🥇';
                rankClass = 'rank-gold';
            } else if (index === 1) {
                rankDisplay = '🥈';
                rankClass = 'rank-silver';
            } else if (index === 2) {
                rankDisplay = '🥉';
                rankClass = 'rank-bronze';
            }

            let sortValue = '';
            if (sortField === 'coins') {
                sortValue = `💰 ${item.coins || 0}`;
            } else if (sortField === 'wins') {
                sortValue = `🏅 ${item.wins || 0}胜`;
            } else if (sortField === 'level') {
                sortValue = `⭐ Lv.${item.level || 1}`;
            }

            return `
                <div class="ranking-item ${rankClass} ${isCurrentUser ? 'ranking-current' : ''}">
                    <div class="ranking-rank">${rankDisplay}</div>
                    <div class="ranking-avatar">
                        ${(item.nickname || item.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div class="ranking-info">
                        <div class="ranking-name">${item.nickname || item.username || '玩家'}</div>
                        <div class="ranking-sub">
                            <span>⭐ Lv.${item.level || 1}</span>
                            <span>🏅 ${item.wins || 0}胜</span>
                        </div>
                    </div>
                    <div class="ranking-value">${sortValue}</div>
                </div>
            `;
        }).join('');
    }
};
