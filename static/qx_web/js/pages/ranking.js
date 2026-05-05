const RankingPage = {
    currentTab: 'weekly_distance',
    render: function(params) {
        const pageContent = document.getElementById('page-content');
        
        pageContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">🏆 排行榜</h1>
            </div>

            <div class="tabs">
                <div class="tab active" data-tab="weekly_distance">本周里程</div>
                <div class="tab" data-tab="monthly_distance">本月里程</div>
                <div class="tab" data-tab="total_distance">总里程</div>
                <div class="tab" data-tab="weekly_elevation">本周爬升</div>
            </div>

            <div id="ranking-list">
                ${App.renderLoading()}
            </div>
        `;

        this.setupEventListeners();
        this.loadRanking();
    },
    setupEventListeners: function() {
        const self = this;

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                const tabName = this.dataset.tab;
                self.currentTab = tabName;
                self.loadRanking();
            });
        });
    },
    loadRanking: async function() {
        const container = document.getElementById('ranking-list');
        container.innerHTML = App.renderLoading();

        try {
            const result = await API.get('/user/ranking/get', {
                type: this.currentTab,
                page: 1,
                page_size: 50
            });

            if (result.code === 0 && result.data && result.data.list) {
                this.renderRanking(result.data.list);
            } else {
                container.innerHTML = App.renderEmpty('🏆', '暂无排行数据', '快来参与骑行吧');
            }
        } catch (error) {
            console.error('Load ranking error:', error);
            container.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    renderRanking: function(ranking) {
        const container = document.getElementById('ranking-list');

        if (!ranking || ranking.length === 0) {
            container.innerHTML = App.renderEmpty('🏆', '暂无排行数据', '快来参与骑行吧');
            return;
        }

        container.innerHTML = `
            <div class="card">
                <div class="card-body" style="padding: 0;">
                    <ul class="ranking-list">
                        ${ranking.map((user, index) => {
                            const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : 'normal'));
                            const value = this.getRankingValue(user);
                            const unit = this.getRankingUnit();

                            return `
                                <li class="ranking-item">
                                    <div class="ranking-number ${rankClass}">${index + 1}</div>
                                    <div class="ranking-avatar">${user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}</div>
                                    <div class="ranking-info">
                                        <div class="ranking-name">${user.nickname || '用户'}</div>
                                        <div class="ranking-level">等级: ${user.level || '萌新'}</div>
                                    </div>
                                    <div class="text-right">
                                        <div class="ranking-value">${value}<span class="ranking-unit">${unit}</span></div>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
            </div>
        `;
    },
    getRankingValue: function(user) {
        switch (this.currentTab) {
            case 'weekly_distance':
            case 'monthly_distance':
            case 'total_distance':
                return (user.total_distance || 0).toFixed(1);
            case 'weekly_elevation':
                return user.total_elevation || 0;
            default:
                return (user.total_distance || 0).toFixed(1);
        }
    },
    getRankingUnit: function() {
        switch (this.currentTab) {
            case 'weekly_distance':
            case 'monthly_distance':
            case 'total_distance':
                return 'km';
            case 'weekly_elevation':
                return 'm';
            default:
                return 'km';
        }
    }
};

Router.register('ranking', function(params) {
    RankingPage.render(params);
});
