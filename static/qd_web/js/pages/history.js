const HistoryPage = {
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    historyList: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = this.getTemplate();
        this.bindEvents();
        this.currentPage = 1;
        this.historyList = [];
        await this.loadHistory();
    },

    getTemplate() {
        return `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">签到记录</div>
                </div>

                <div class="history-stats">
                    <div class="history-stat-item">
                        <div class="history-stat-icon">📅</div>
                        <div class="history-stat-info">
                            <div class="history-stat-value" id="statTotalDays">0</div>
                            <div class="history-stat-label">累计签到</div>
                        </div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-icon">🔥</div>
                        <div class="history-stat-info">
                            <div class="history-stat-value" id="statCurrentContinuous">0</div>
                            <div class="history-stat-label">当前连续</div>
                        </div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-icon">🏆</div>
                        <div class="history-stat-info">
                            <div class="history-stat-value" id="statMaxContinuous">0</div>
                            <div class="history-stat-label">最高连续</div>
                        </div>
                    </div>
                    <div class="history-stat-item">
                        <div class="history-stat-icon">💰</div>
                        <div class="history-stat-info">
                            <div class="history-stat-value" id="statTotalPoints">0</div>
                            <div class="history-stat-label">获得积分</div>
                        </div>
                    </div>
                </div>

                <div class="section-title">签到明细</div>
                <div class="history-list" id="historyList">
                    <div class="empty-state" id="emptyState">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">暂无签到记录</div>
                    </div>
                </div>

                <div class="load-more" id="loadMore" style="display: none;">
                    <span class="load-more-text">加载更多</span>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-route="home">
                        <div class="tabbar-icon">📅</div>
                        <div class="tabbar-text">签到</div>
                    </div>
                    <div class="tabbar-item active" data-route="history">
                        <div class="tabbar-icon">📋</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item" data-route="settings">
                        <div class="tabbar-icon">⚙️</div>
                        <div class="tabbar-text">设置</div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });

        document.getElementById('loadMore').addEventListener('click', () => {
            this.loadMore();
        });
    },

    async loadHistory() {
        Utils.showLoading();
        try {
            const [statusResult, historyResult] = await Promise.all([
                SignApi.getStatus(),
                SignApi.getHistory(this.currentPage, this.pageSize)
            ]);
            Utils.hideLoading();

            if (statusResult.code === 0) {
                this.updateStats(statusResult.data);
            }

            if (historyResult.code === 0) {
                this.renderHistoryList(historyResult.data);
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '加载失败');
        }
    },

    updateStats(status) {
        document.getElementById('statTotalDays').textContent = status.total_days;
        document.getElementById('statCurrentContinuous').textContent = status.current_continuous;
        document.getElementById('statMaxContinuous').textContent = status.max_continuous;
        document.getElementById('statTotalPoints').textContent = status.total_points;
    },

    renderHistoryList(data) {
        const items = data.items || [];
        const total = data.total || 0;

        this.historyList = this.currentPage === 1 ? items : [...this.historyList, ...items];
        this.hasMore = this.historyList.length < total;

        const historyListEl = document.getElementById('historyList');
        const emptyState = document.getElementById('emptyState');
        const loadMore = document.getElementById('loadMore');

        if (this.historyList.length === 0) {
            emptyState.style.display = 'block';
            loadMore.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';

        historyListEl.innerHTML = this.historyList.map((item, index) => `
            <div class="history-item">
                <div class="history-item-left">
                    <div class="history-date">${item.sign_date}</div>
                    <div class="history-meta">
                        ${item.sign_type === 1 ? '<span class="badge badge-warning">补签</span>' : '<span class="badge badge-success">正常签到</span>'}
                        <span class="history-continuous">连续 ${item.continuous_days} 天</span>
                    </div>
                </div>
                <div class="history-item-right">
                    <div class="history-points">+${item.reward_points}</div>
                    <div class="history-points-label">积分</div>
                </div>
            </div>
        `).join('');

        loadMore.style.display = this.hasMore ? 'flex' : 'none';
    },

    async loadMore() {
        if (!this.hasMore) return;
        
        this.currentPage++;
        await this.loadHistory();
    }
};
