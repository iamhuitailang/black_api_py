const ActivityDetailPage = {
    activityId: null,
    activity: null,
    render: async function(params) {
        this.activityId = params.id;
        if (!this.activityId) {
            Router.go('activities');
            return;
        }

        const pageContent = document.getElementById('page-content');
        pageContent.innerHTML = App.renderLoading();

        await this.loadActivity();
    },
    loadActivity: async function() {
        try {
            const result = await API.get('/activity/detail/get', { activity_id: this.activityId });
            
            if (result.code === 0 && result.data) {
                this.activity = result.data;
                this.renderDetail();
            } else {
                App.showToast(result.msg || '加载失败', 'error');
                Router.go('activities');
            }
        } catch (error) {
            console.error('Load activity error:', error);
            App.showToast('加载失败，请稍后重试', 'error');
            Router.go('activities');
        }
    },
    renderDetail: function() {
        const activity = this.activity;
        const pageContent = document.getElementById('page-content');
        
        const statusClass = this.getStatusClass(activity.status);
        const difficultyClass = this.getDifficultyClass(activity.difficulty);
        const progress = activity.max_people ? (activity.current_people / activity.max_people) * 100 : 0;
        const isLeader = this.isLeader();
        const canJoin = this.canJoin();

        pageContent.innerHTML = `
            <div class="page-header">
                <button class="btn btn-outline" data-route="activities">← 返回列表</button>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="flex items-center justify-between mb-4">
                        <h1 class="page-title" style="margin: 0;">${activity.title}</h1>
                        <div class="flex items-center gap-2">
                            <span class="activity-status status-${statusClass}">${activity.status}</span>
                            <span class="activity-difficulty difficulty-${difficultyClass}">${activity.difficulty || '初级'}</span>
                        </div>
                    </div>

                    <div class="activity-info">
                        <div class="activity-info-item">
                            <span>🗺️</span>
                            <span>路线：${activity.route || '未指定'}</span>
                        </div>
                        <div class="activity-info-item">
                            <span>📏</span>
                            <span>距离：${activity.distance || 0} km</span>
                        </div>
                        <div class="activity-info-item">
                            <span>⛰️</span>
                            <span>爬升：${activity.elevation || 0} m</span>
                        </div>
                        <div class="activity-info-item">
                            <span>⏰</span>
                            <span>均速：${activity.pace || '待定'}</span>
                        </div>
                        <div class="activity-info-item">
                            <span>📍</span>
                            <span>集合地点：${activity.meeting_point || '待定'}</span>
                        </div>
                        <div class="activity-info-item">
                            <span>📅</span>
                            <span>集合时间：${activity.meeting_time || '待定'}</span>
                        </div>
                        <div class="activity-info-item">
                            <span>💰</span>
                            <span>费用：${activity.cost > 0 ? activity.cost + ' 元' : '免费'}</span>
                        </div>
                    </div>

                    <div class="activity-progress mt-4">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>已报名 ${activity.current_people || 0} 人</span>
                            <span>上限 ${activity.max_people || 0} 人</span>
                        </div>
                    </div>

                    ${activity.description ? `
                        <div class="divider"></div>
                        <div>
                            <h4 class="form-label">活动描述</h4>
                            <p style="white-space: pre-wrap; line-height: 1.8; color: var(--text-primary);">${activity.description}</p>
                        </div>
                    ` : ''}

                    <div class="divider"></div>

                    <div class="flex justify-end gap-3">
                        ${isLeader ? `
                            <button class="btn btn-blue" id="btn-manage">管理活动</button>
                        ` : ''}
                        ${canJoin ? `
                            <button class="btn btn-green btn-lg" id="btn-join">立即报名</button>
                        ` : activity.status === '招募中' ? `
                            <button class="btn btn-danger" id="btn-cancel">取消报名</button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="card mt-4">
                <div class="card-header">
                    <h3 class="card-title">👥 报名成员 (${activity.current_people || 0}/${activity.max_people || 0})</h3>
                </div>
                <div class="card-body" id="members-list">
                    ${App.renderLoading()}
                </div>
            </div>
        `;

        this.loadMembers();
        this.setupEventListeners();
    },
    loadMembers: async function() {
        try {
            const result = await API.get('/registration/members/get', { activity_id: this.activityId });
            const container = document.getElementById('members-list');

            if (result.code === 0 && result.data && result.data.length > 0) {
                container.innerHTML = result.data.map(member => `
                    <div class="list-item">
                        <div class="flex items-center gap-3">
                            <div class="ranking-avatar">${member.user_nickname ? member.user_nickname.charAt(0).toUpperCase() : 'U'}</div>
                            <div>
                                <div class="list-item-title">${member.user_nickname || '用户'}</div>
                                <div class="list-item-subtitle">${member.user_level || '萌新'}</div>
                            </div>
                        </div>
                        <span class="badge ${member.status === '已签到' ? 'badge-success' : 'badge-info'}">${member.status}</span>
                    </div>
                `).join('');
            } else {
                container.innerHTML = App.renderEmpty('👥', '暂无报名成员', '快来报名吧');
            }
        } catch (error) {
            console.error('Load members error:', error);
            const container = document.getElementById('members-list');
            container.innerHTML = App.renderEmpty('❌', '加载失败', '请稍后重试');
        }
    },
    setupEventListeners: function() {
        const joinBtn = document.getElementById('btn-join');
        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                if (!Auth.isLoggedIn()) {
                    Router.go('login');
                    return;
                }

                joinBtn.disabled = true;
                joinBtn.textContent = '报名中...';

                try {
                    const result = await API.post('/registration/join', { activity_id: this.activityId });
                    
                    if (result.code === 0) {
                        App.showToast('报名成功', 'success');
                        setTimeout(() => {
                            this.render({ id: this.activityId });
                        }, 500);
                    } else {
                        App.showToast(result.msg || '报名失败', 'error');
                    }
                } catch (error) {
                    App.showToast('报名失败，请稍后重试', 'error');
                } finally {
                    joinBtn.disabled = false;
                    joinBtn.textContent = '立即报名';
                }
            });
        }

        const cancelBtn = document.getElementById('btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if (!Auth.isLoggedIn()) {
                    Router.go('login');
                    return;
                }

                if (!confirm('确定要取消报名吗？')) {
                    return;
                }

                cancelBtn.disabled = true;
                cancelBtn.textContent = '取消中...';

                try {
                    const result = await API.post('/registration/cancel', { activity_id: this.activityId });
                    
                    if (result.code === 0) {
                        App.showToast('已取消报名', 'success');
                        setTimeout(() => {
                            this.render({ id: this.activityId });
                        }, 500);
                    } else {
                        App.showToast(result.msg || '操作失败', 'error');
                    }
                } catch (error) {
                    App.showToast('操作失败，请稍后重试', 'error');
                } finally {
                    cancelBtn.disabled = false;
                    cancelBtn.textContent = '取消报名';
                }
            });
        }
    },
    isLeader: function() {
        if (!Auth.isLoggedIn() || !this.activity) {
            return false;
        }
        const user = Storage.getUser();
        return user && user.id === this.activity.leader_id;
    },
    canJoin: function() {
        if (!Auth.isLoggedIn() || !this.activity) {
            return false;
        }
        if (this.activity.status !== '招募中') {
            return false;
        }
        if (this.isLeader()) {
            return false;
        }
        if (this.activity.current_people >= this.activity.max_people) {
            return false;
        }
        return true;
    },
    getStatusClass: function(status) {
        const map = {
            '招募中': 'recruiting',
            '已满': 'full',
            '进行中': 'ongoing',
            '已结束': 'ended'
        };
        return map[status] || 'recruiting';
    },
    getDifficultyClass: function(difficulty) {
        const map = {
            '初级': 'easy',
            '中级': 'medium',
            '高级': 'hard',
            '挑战': 'challenge'
        };
        return map[difficulty] || 'easy';
    }
};

Router.register('activity-detail', function(params) {
    ActivityDetailPage.render(params);
});
