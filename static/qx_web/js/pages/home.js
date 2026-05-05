const HomePage = {
    render: async function() {
        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = App.renderLoading();

        pageContent.innerHTML = `
            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon green">🚴</div>
                    <div class="stat-value" id="stat-activities">--</div>
                    <div class="stat-label">进行中活动</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon blue">👥</div>
                    <div class="stat-value" id="stat-users">--</div>
                    <div class="stat-label">活跃用户</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon orange">🗺️</div>
                    <div class="stat-value" id="stat-rides">--</div>
                    <div class="stat-label">骑行记录</div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon purple">📝</div>
                    <div class="stat-value" id="stat-posts">--</div>
                    <div class="stat-label">动态分享</div>
                </div>
            </div>

            <div class="grid grid-2 gap-4">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🔥 热门活动</h3>
                        <button class="btn btn-sm btn-green" data-route="activities">查看全部</button>
                    </div>
                    <div class="card-body" id="hot-activities">
                        ${App.renderLoading()}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📝 最新动态</h3>
                        <button class="btn btn-sm btn-green" data-route="posts">查看全部</button>
                    </div>
                    <div class="card-body" id="latest-posts">
                        ${App.renderLoading()}
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header">
                    <h3 class="card-title">🏆 本周排行榜</h3>
                    <button class="btn btn-sm btn-green" data-route="ranking">查看完整榜单</button>
                </div>
                <div class="card-body" id="ranking-preview">
                    ${App.renderLoading()}
                </div>
            </div>
        `;

        this.loadData();
    },
    loadData: async function() {
        try {
            const activitiesResult = await API.get('/activity/list/get', { status: '招募中', page: 1, page_size: 5 });
            if (activitiesResult.code === 0 && activitiesResult.data && activitiesResult.data.list) {
                this.renderActivities(activitiesResult.data.list);
                document.getElementById('stat-activities').textContent = activitiesResult.data.total || 0;
            }

            const postsResult = await API.get('/post/feed/get', { page: 1, page_size: 5 });
            if (postsResult.code === 0 && postsResult.data && postsResult.data.list) {
                this.renderPosts(postsResult.data.list);
                document.getElementById('stat-posts').textContent = postsResult.data.total || 0;
            }

            const rankingResult = await API.get('/user/ranking/get', { type: 'weekly_distance', page: 1, page_size: 5 });
            if (rankingResult.code === 0 && rankingResult.data && rankingResult.data.list) {
                this.renderRanking(rankingResult.data.list);
            }
        } catch (error) {
            console.error('Load home data error:', error);
        }
    },
    renderActivities: function(activities) {
        const container = document.getElementById('hot-activities');
        if (!activities || activities.length === 0) {
            container.innerHTML = App.renderEmpty('🚴', '暂无活动', '快来发布第一个活动吧');
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="list-item" style="cursor: pointer;" data-route="activity-detail" data-id="${activity.id}">
                <div class="list-item-info">
                    <div class="list-item-title">${activity.title}</div>
                    <div class="list-item-subtitle">${activity.route || '未指定路线'} · ${activity.distance}km</div>
                </div>
                <span class="activity-status status-${this.getStatusClass(activity.status)}">${activity.status}</span>
            </div>
        `).join('');
    },
    renderPosts: function(posts) {
        const container = document.getElementById('latest-posts');
        if (!posts || posts.length === 0) {
            container.innerHTML = App.renderEmpty('📝', '暂无动态', '快来分享你的骑行故事吧');
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="list-item" style="cursor: pointer;">
                <div class="list-item-info">
                    <div class="list-item-title">${post.user_nickname || '用户'}</div>
                    <div class="list-item-subtitle">${post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content) : '分享了骑行记录'}</div>
                </div>
                <div class="text-muted text-right">
                    <div>❤️ ${post.like_count || 0}</div>
                    <div style="font-size: 12px;">${post.created_at || ''}</div>
                </div>
            </div>
        `).join('');
    },
    renderRanking: function(ranking) {
        const container = document.getElementById('ranking-preview');
        if (!ranking || ranking.length === 0) {
            container.innerHTML = App.renderEmpty('🏆', '暂无排行', '快来参与骑行吧');
            return;
        }

        container.innerHTML = ranking.map((user, index) => {
            const rankClass = index === 0 ? 'gold' : (index === 1 ? 'silver' : (index === 2 ? 'bronze' : 'normal'));
            return `
                <div class="list-item">
                    <div class="ranking-number ${rankClass}">${index + 1}</div>
                    <div class="ranking-avatar">${user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}</div>
                    <div class="list-item-info">
                        <div class="list-item-title">${user.nickname || '用户'}</div>
                        <div class="list-item-subtitle">等级: ${user.level || '萌新'}</div>
                    </div>
                    <div>
                        <div class="ranking-value">${user.total_distance || 0}<span class="ranking-unit">km</span></div>
                    </div>
                </div>
            `;
        }).join('');
    },
    getStatusClass: function(status) {
        const map = {
            '招募中': 'recruiting',
            '已满': 'full',
            '进行中': 'ongoing',
            '已结束': 'ended'
        };
        return map[status] || 'recruiting';
    }
};

Router.register('home', function(params) {
    HomePage.render();
});
