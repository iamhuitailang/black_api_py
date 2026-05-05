const GoalPage = {
    user: null,

    async render() {
        this.user = AuthService.getCurrentUser() || {};

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <div class="header">
                    <button class="header-back" id="goal-back">←</button>
                    <div class="header-title">目标设置</div>
                </div>

                <div class="streak-card">
                    <div class="streak-icon">🔥</div>
                    <div class="streak-value" id="streak-value">${this.user.streak_days || 0}</div>
                    <div class="streak-label">连续打卡天数</div>
                </div>

                <div class="streak-calendar">
                    <div class="streak-calendar-header">最近7天打卡</div>
                    <div class="streak-calendar-grid" id="streak-calendar">
                        ${this.renderCalendar()}
                    </div>
                </div>

                <div class="goal-setting">
                    <div class="goal-setting-header">
                        <div class="goal-setting-title">🎯 每日目标</div>
                    </div>
                    <div class="goal-input-group">
                        <input type="number" id="daily-goal-input" value="${this.user.daily_goal || Storage.getDailyGoal()}" min="100" step="100">
                        <span>个/天</span>
                    </div>
                    <button class="btn btn-primary btn-block mt-2" id="save-goal-btn">保存目标</button>
                </div>

                <div class="reminder-setting">
                    <div class="reminder-setting-header">
                        <div class="goal-setting-title">🔔 跳绳提醒</div>
                        <div class="reminder-toggle ${this.getReminderEnabled() ? 'active' : ''}" id="reminder-toggle"></div>
                    </div>
                    <div class="reminder-time-input ${this.getReminderEnabled() ? '' : 'hidden'}" id="reminder-time-section">
                        <label>提醒时间</label>
                        <input type="time" id="reminder-time-input" value="${this.getReminderTime()}">
                    </div>
                </div>

                <div class="section-title">目标建议</div>
                <div class="list">
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">🏃 入门目标</div>
                            <div class="list-item-desc">每天500个，适合初学者</div>
                        </div>
                        <button class="btn btn-sm btn-outline" data-goal="500">选择</button>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">💪 进阶目标</div>
                            <div class="list-item-desc">每天1000个，持续提升</div>
                        </div>
                        <button class="btn btn-sm btn-outline" data-goal="1000">选择</button>
                    </div>
                    <div class="list-item">
                        <div class="list-item-content">
                            <div class="list-item-title">🔥 挑战目标</div>
                            <div class="list-item-desc">每天2000个，挑战极限</div>
                        </div>
                        <button class="btn btn-sm btn-outline" data-goal="2000">选择</button>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderCalendar() {
        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push({
                date: date,
                dayName: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
                isToday: i === 0,
                isFuture: false
            });
        }

        return days.map(day => {
            const className = day.isFuture ? 'future' : (Math.random() > 0.5 ? 'checked' : 'unchecked');
            return `
                <div class="streak-calendar-day ${className}">
                    <div style="font-size: 10px; margin-bottom: 2px;">${day.dayName}</div>
                    <div style="font-weight: ${day.isToday ? '700' : '400'};">${day.date.getDate()}</div>
                </div>
            `;
        }).join('');
    },

    getReminderEnabled() {
        const setting = Storage.getReminderSetting();
        return setting.enabled;
    },

    getReminderTime() {
        const setting = Storage.getReminderSetting();
        return setting.time;
    },

    bindEvents() {
        const backBtn = document.getElementById('goal-back');
        const saveBtn = document.getElementById('save-goal-btn');
        const goalInput = document.getElementById('daily-goal-input');
        const reminderToggle = document.getElementById('reminder-toggle');
        const timeInput = document.getElementById('reminder-time-input');
        const timeSection = document.getElementById('reminder-time-section');

        backBtn.addEventListener('click', () => {
            Router.navigate('home');
        });

        saveBtn.addEventListener('click', async () => {
            const goal = parseInt(goalInput.value) || 1000;

            if (goal < 100) {
                Utils.showToast('每日目标至少100个');
                return;
            }

            Utils.showLoading();
            try {
                const result = await AuthService.updateDailyGoal(goal);
                Utils.hideLoading();

                if (result.code === 0) {
                    Utils.showToast('目标保存成功');
                } else {
                    Utils.showToast(result.msg || '保存失败');
                }
            } catch (e) {
                Utils.hideLoading();
                Utils.showToast('保存失败，请稍后重试');
            }
        });

        reminderToggle.addEventListener('click', () => {
            const isActive = reminderToggle.classList.contains('active');
            const newState = !isActive;

            reminderToggle.classList.toggle('active', newState);
            timeSection.classList.toggle('hidden', !newState);

            const setting = Storage.getReminderSetting();
            setting.enabled = newState;
            Storage.setReminderSetting(setting);

            if (newState) {
                Utils.showToast('提醒已开启');
            } else {
                Utils.showToast('提醒已关闭');
            }
        });

        timeInput.addEventListener('change', () => {
            const setting = Storage.getReminderSetting();
            setting.time = timeInput.value;
            Storage.setReminderSetting(setting);
            Utils.showToast('提醒时间已更新');
        });

        document.querySelectorAll('[data-goal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goal = parseInt(btn.dataset.goal);
                goalInput.value = goal;
            });
        });
    }
};
