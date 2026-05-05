const AchievementsPage = {
    achievements: null,
    userAchievements: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <button class="header-back" id="achievements-back">←</button>
                    <div class="header-title">成就徽章</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <div class="card-title">成就进度</div>
                    </div>
                    <div class="card-body" id="achievement-summary">
                        <div class="empty-state" style="padding: 20px;">
                            <div class="empty-state-text">加载中...</div>
                        </div>
                    </div>
                </div>

                <div class="section-title">已解锁</div>
                <div class="achievements-grid" id="unlocked-achievements">
                    <div class="empty-state" style="grid-column: span 3;">
                        <div class="empty-state-icon">🏅</div>
                        <div class="empty-state-text">暂无已解锁成就</div>
                    </div>
                </div>

                <div class="section-title">进行中</div>
                <div class="achievements-grid" id="locked-achievements">
                    <div class="empty-state" style="grid-column: span 3;">
                        <div class="empty-state-icon">🔒</div>
                        <div class="empty-state-text">暂无进行中成就</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        const backBtn = document.getElementById('achievements-back');
        backBtn.addEventListener('click', () => {
            Router.navigate('profile');
        });
    },

    async loadData() {
        try {
            const result = await ApiService.get('/ts/achievement/progress/get');
            if (result.code === 0) {
                this.achievements = result.data;
                this.renderAchievements();
            }
        } catch (e) {
            console.error('Load achievements error:', e);
        }
    },

    renderAchievements() {
        if (!this.achievements || this.achievements.length === 0) return;

        const unlocked = this.achievements.filter(a => a.is_unlocked);
        const locked = this.achievements.filter(a => !a.is_unlocked);
        const total = this.achievements.length;
        const progress = total > 0 ? (unlocked.length / total) * 100 : 0;

        const summaryEl = document.getElementById('achievement-summary');
        summaryEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 32px; font-weight: 700; color: var(--primary-color);">${unlocked.length}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">已解锁</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 32px; font-weight: 700; color: var(--text-secondary);">${total}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">总数</div>
                </div>
            </div>
            <div class="today-progress-bar" style="height: 10px;">
                <div class="today-progress-fill" style="width: ${progress}%; height: 100%;"></div>
            </div>
            <div style="text-align: center; margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                完成进度: ${progress.toFixed(1)}%
            </div>
        `;

        const unlockedContainer = document.getElementById('unlocked-achievements');
        if (unlocked.length > 0) {
            unlockedContainer.innerHTML = unlocked.map(item => `
                <div class="achievement-item" data-id="${item.achievement_id}">
                    <div class="achievement-icon">${item.badge_icon || '🏆'}</div>
                    <div class="achievement-name">${item.name}</div>
                    <div class="achievement-progress">已解锁</div>
                </div>
            `).join('');
        }

        const lockedContainer = document.getElementById('locked-achievements');
        if (locked.length > 0) {
            lockedContainer.innerHTML = locked.map(item => `
                <div class="achievement-item locked" data-id="${item.achievement_id}">
                    <div class="achievement-icon locked">🔒</div>
                    <div class="achievement-name">${item.name}</div>
                    <div class="achievement-progress">${item.current_value}/${item.condition_value}</div>
                </div>
            `).join('');
        }

        this.bindAchievementEvents();
    },

    bindAchievementEvents() {
        document.querySelectorAll('.achievement-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const achievement = this.achievements.find(a => a.achievement_id === id);
                if (achievement) {
                    this.showAchievementDetail(achievement);
                }
            });
        });
    },

    showAchievementDetail(achievement) {
        const isLocked = !achievement.is_unlocked;
        const modal = document.createElement('div');
        modal.className = 'achievement-detail-modal';
        modal.innerHTML = `
            <div class="achievement-detail-content">
                <div class="achievement-detail-icon ${isLocked ? 'locked' : ''}">${isLocked ? '🔒' : (achievement.badge_icon || '🏆')}</div>
                <div class="achievement-detail-name">${achievement.name}</div>
                <div class="achievement-detail-desc">${achievement.description}</div>
                ${isLocked ? `
                    <div class="achievement-detail-progress">
                        进度: ${achievement.current_value} / ${achievement.condition_value}
                        <div style="margin-top: 8px; height: 8px; background-color: var(--bg-color); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; background: linear-gradient(90deg, var(--primary-color), #a855f7); width: ${(achievement.current_value / achievement.condition_value) * 100}%;"></div>
                        </div>
                    </div>
                ` : `
                    <div class="achievement-detail-progress">
                        <div style="color: var(--success-color); font-weight: 600;">🎉 已解锁</div>
                    </div>
                `}
                <button class="btn btn-primary btn-block mt-2" data-action="close">关闭</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close' || e.target === modal) {
                modal.remove();
            }
        });
    }
};
