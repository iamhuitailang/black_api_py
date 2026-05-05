const RecordPage = {
    currentMode: 'quick',
    timerState: {
        running: false,
        paused: false,
        startTime: 0,
        pausedTime: 0,
        totalPausedTime: 0,
        intervalId: null
    },
    countState: {
        count: 0
    },

    async render() {
        const params = Router.getParams();
        this.currentMode = params?.mode || 'quick';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">记录跳绳</div>
                </div>

                <div class="record-tabs">
                    <div class="record-tab ${this.currentMode === 'quick' ? 'active' : ''}" data-mode="quick">快速记录</div>
                    <div class="record-tab ${this.currentMode === 'timer' ? 'active' : ''}" data-mode="timer">计时模式</div>
                    <div class="record-tab ${this.currentMode === 'count' ? 'active' : ''}" data-mode="count">计数模式</div>
                </div>

                <div id="record-content">
                    ${this.renderContent()}
                </div>

                <div class="tabbar">
                    <div class="tabbar-item" data-tab="home">
                        <div class="tabbar-icon">🏠</div>
                        <div class="tabbar-text">首页</div>
                    </div>
                    <div class="tabbar-item active" data-tab="record">
                        <div class="tabbar-icon">➕</div>
                        <div class="tabbar-text">记录</div>
                    </div>
                    <div class="tabbar-item" data-tab="stats">
                        <div class="tabbar-icon">📊</div>
                        <div class="tabbar-text">统计</div>
                    </div>
                    <div class="tabbar-item" data-tab="social">
                        <div class="tabbar-icon">👥</div>
                        <div class="tabbar-text">社交</div>
                    </div>
                    <div class="tabbar-item" data-tab="profile">
                        <div class="tabbar-icon">👤</div>
                        <div class="tabbar-text">我的</div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderContent() {
        if (this.currentMode === 'quick') {
            return this.renderQuickMode();
        } else if (this.currentMode === 'timer') {
            return this.renderTimerMode();
        } else {
            return this.renderCountMode();
        }
    },

    renderQuickMode() {
        return `
            <div class="quick-record-form">
                <div class="quick-record-inputs">
                    <div class="quick-record-input-group">
                        <label>跳绳数量</label>
                        <input type="number" id="quick-count" value="0" min="0">
                    </div>
                    <div class="quick-record-input-group">
                        <label>跳绳时长（秒）</label>
                        <input type="number" id="quick-duration" value="0" min="0">
                    </div>
                </div>

                <div class="calories-preview">
                    <div class="calories-preview-label">预计消耗卡路里</div>
                    <div class="calories-preview-value" id="quick-calories">0.00</div>
                    <div class="calories-preview-unit">kcal</div>
                </div>

                <div class="note-input">
                    <textarea id="quick-note" placeholder="添加备注，如：间歇跳、分组训练..."></textarea>
                </div>

                <button class="btn btn-primary btn-block btn-lg mt-2" id="quick-submit">保存记录</button>
            </div>
        `;
    },

    renderTimerMode() {
        const { running, paused } = this.timerState;
        const displayTime = this.getTimerDisplay();

        return `
            <div class="timer-mode">
                <div class="timer-display" id="timer-display">${displayTime}</div>

                <div class="timer-stats">
                    <div class="timer-stat">
                        <div class="timer-stat-value" id="timer-count">${this.countState.count}</div>
                        <div class="timer-stat-label">跳绳数量</div>
                    </div>
                    <div class="timer-stat">
                        <div class="timer-stat-value" id="timer-calories">0.00</div>
                        <div class="timer-stat-label">消耗卡路里</div>
                    </div>
                </div>

                <div class="timer-controls">
                    ${!running && !paused ? `
                        <button class="timer-btn start" id="timer-start">
                            <div class="icon">▶</div>
                            <div>开始</div>
                        </button>
                    ` : ''}

                    ${running && !paused ? `
                        <button class="timer-btn pause" id="timer-pause">
                            <div class="icon">⏸</div>
                            <div>暂停</div>
                        </button>
                        <button class="timer-btn stop" id="timer-stop">
                            <div class="icon">⏹</div>
                            <div>结束</div>
                        </button>
                    ` : ''}

                    ${paused ? `
                        <button class="timer-btn start" id="timer-resume">
                            <div class="icon">▶</div>
                            <div>继续</div>
                        </button>
                        <button class="timer-btn stop" id="timer-stop">
                            <div class="icon">⏹</div>
                            <div>结束</div>
                        </button>
                    ` : ''}
                </div>

                ${(running || paused) ? `
                    <div class="note-input" style="margin-top: 30px;">
                        <textarea id="timer-note" placeholder="添加备注..."></textarea>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderCountMode() {
        return `
            <div class="count-mode">
                <div class="count-display" id="count-display">${this.countState.count}</div>
                <div class="count-label">跳绳数量</div>

                <button class="count-btn" id="count-btn">+1</button>

                <div class="count-controls">
                    <button class="count-control-btn" id="count-reset">重置</button>
                    <button class="count-control-btn" id="count-submit">保存</button>
                </div>

                <div class="note-input" style="margin-top: 30px;">
                    <textarea id="count-note" placeholder="添加备注..."></textarea>
                </div>

                <div class="calories-preview" style="margin-top: 20px;">
                    <div class="calories-preview-label">预计消耗卡路里</div>
                    <div class="calories-preview-value" id="count-calories">0.00</div>
                    <div class="calories-preview-unit">kcal</div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('.record-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.dataset.tab;
                Router.navigate(tab);
            });
        });

        if (this.currentMode === 'quick') {
            this.bindQuickEvents();
        } else if (this.currentMode === 'timer') {
            this.bindTimerEvents();
        } else {
            this.bindCountEvents();
        }
    },

    bindQuickEvents() {
        const countInput = document.getElementById('quick-count');
        const durationInput = document.getElementById('quick-duration');
        const submitBtn = document.getElementById('quick-submit');

        const updateCalories = () => {
            const count = parseInt(countInput.value) || 0;
            const user = AuthService.getCurrentUser() || {};
            const weight = user.weight || 60;
            const calories = Utils.calculateCalories(count, weight);
            document.getElementById('quick-calories').textContent = calories.toFixed(2);
        };

        countInput.addEventListener('input', updateCalories);
        durationInput.addEventListener('input', updateCalories);

        submitBtn.addEventListener('click', async () => {
            const count = parseInt(countInput.value) || 0;
            const duration = parseInt(durationInput.value) || 0;
            const note = document.getElementById('quick-note').value.trim();

            if (count <= 0 && duration <= 0) {
                Utils.showToast('请输入跳绳数量或时长');
                return;
            }

            await this.saveRecord(count, duration, note);
        });

        updateCalories();
    },

    bindTimerEvents() {
        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');
        const resumeBtn = document.getElementById('timer-resume');
        const stopBtn = document.getElementById('timer-stop');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTimer());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseTimer());
        }

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeTimer());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTimer());
        }

        if (this.timerState.running) {
            document.addEventListener('keydown', this.handleTimerKeydown);
        }
    },

    bindCountEvents() {
        const countBtn = document.getElementById('count-btn');
        const resetBtn = document.getElementById('count-reset');
        const submitBtn = document.getElementById('count-submit');

        countBtn.addEventListener('click', () => this.incrementCount());

        resetBtn.addEventListener('click', () => {
            this.countState.count = 0;
            document.getElementById('count-display').textContent = '0';
            document.getElementById('count-calories').textContent = '0.00';
        });

        submitBtn.addEventListener('click', async () => {
            if (this.countState.count <= 0) {
                Utils.showToast('请先记录跳绳数量');
                return;
            }
            const note = document.getElementById('count-note').value.trim();
            await this.saveRecord(this.countState.count, 0, note);
            this.countState.count = 0;
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.incrementCount();
            }
        });
    },

    switchMode(mode) {
        this.currentMode = mode;
        const content = document.getElementById('record-content');
        if (content) {
            content.innerHTML = this.renderContent();
            if (mode === 'quick') {
                this.bindQuickEvents();
            } else if (mode === 'timer') {
                this.bindTimerEvents();
            } else {
                this.bindCountEvents();
            }
        }

        document.querySelectorAll('.record-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
    },

    startTimer() {
        this.timerState.running = true;
        this.timerState.paused = false;
        this.timerState.startTime = Date.now();
        this.timerState.totalPausedTime = 0;

        this.timerState.intervalId = setInterval(() => {
            this.updateTimerDisplay();
        }, 10);

        document.addEventListener('keydown', this.handleTimerKeydown);
        this.switchMode('timer');
    },

    pauseTimer() {
        this.timerState.paused = true;
        this.timerState.pausedTime = Date.now();

        if (this.timerState.intervalId) {
            clearInterval(this.timerState.intervalId);
            this.timerState.intervalId = null;
        }

        this.switchMode('timer');
    },

    resumeTimer() {
        if (this.timerState.pausedTime > 0) {
            this.timerState.totalPausedTime += Date.now() - this.timerState.pausedTime;
        }

        this.timerState.paused = false;
        this.timerState.intervalId = setInterval(() => {
            this.updateTimerDisplay();
        }, 10);

        this.switchMode('timer');
    },

    async stopTimer() {
        if (this.timerState.intervalId) {
            clearInterval(this.timerState.intervalId);
            this.timerState.intervalId = null;
        }

        document.removeEventListener('keydown', this.handleTimerKeydown);

        const count = this.countState.count;
        const duration = this.getTimerDuration();
        const note = document.getElementById('timer-note')?.value.trim() || '';

        this.timerState = {
            running: false,
            paused: false,
            startTime: 0,
            pausedTime: 0,
            totalPausedTime: 0,
            intervalId: null
        };

        if (count > 0 || duration > 0) {
            await this.saveRecord(count, duration, note);
        }

        this.countState.count = 0;
        this.switchMode('timer');
    },

    handleTimerKeydown(e) {
        if (e.code === 'Space' || e.code === 'Enter') {
            e.preventDefault();
            if (Router.getCurrentRoute() === 'record' && this.currentMode === 'timer') {
                this.incrementCount();
            }
        }
    },

    getTimerDuration() {
        if (!this.timerState.running) return 0;

        let endTime;
        if (this.timerState.paused) {
            endTime = this.timerState.pausedTime;
        } else {
            endTime = Date.now();
        }

        const elapsed = endTime - this.timerState.startTime - this.timerState.totalPausedTime;
        return Math.floor(elapsed / 1000);
    },

    getTimerDisplay() {
        if (!this.timerState.running) {
            return '00:00.00';
        }

        let endTime;
        if (this.timerState.paused) {
            endTime = this.timerState.pausedTime;
        } else {
            endTime = Date.now();
        }

        const elapsed = endTime - this.timerState.startTime - this.timerState.totalPausedTime;
        return Utils.formatTimerMs(elapsed);
    },

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (display) {
            display.textContent = this.getTimerDisplay();
        }

        const caloriesEl = document.getElementById('timer-calories');
        if (caloriesEl) {
            const user = AuthService.getCurrentUser() || {};
            const weight = user.weight || 60;
            const calories = Utils.calculateCalories(this.countState.count, weight);
            caloriesEl.textContent = calories.toFixed(2);
        }
    },

    incrementCount() {
        this.countState.count++;

        if (this.currentMode === 'timer') {
            const countEl = document.getElementById('timer-count');
            if (countEl) countEl.textContent = this.countState.count;
        } else if (this.currentMode === 'count') {
            const countEl = document.getElementById('count-display');
            if (countEl) countEl.textContent = this.countState.count;

            const user = AuthService.getCurrentUser() || {};
            const weight = user.weight || 60;
            const calories = Utils.calculateCalories(this.countState.count, weight);
            document.getElementById('count-calories').textContent = calories.toFixed(2);
        }
    },

    async saveRecord(count, duration, note) {
        Utils.showLoading();
        try {
            const result = await ApiService.post('/ts/record/create', {
                count,
                duration,
                note
            });

            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('记录保存成功');

                const record = result.data?.record;
                const newAchievements = result.data?.new_achievements || [];

                if (newAchievements.length > 0) {
                    this.showAchievementUnlock(newAchievements);
                }

                this.showRecordComplete(record, newAchievements);
            } else {
                Utils.showToast(result.msg || '保存失败');
            }
        } catch (e) {
            Utils.hideLoading();
            Utils.showToast('保存失败，请稍后重试');
        }
    },

    showAchievementUnlock(achievements) {
        const achievement = achievements[0];
        const modal = document.createElement('div');
        modal.className = 'achievement-unlock-modal';
        modal.innerHTML = `
            <div class="achievement-unlock-content">
                <div class="achievement-unlock-icon">${achievement.badge_icon || '�'}</div>
                <div class="achievement-unlock-title">�🎉 成就解锁！</div>
                <div class="achievement-unlock-name">${achievement.name}</div>
                <div class="achievement-unlock-desc">${achievement.description}</div>
                <button class="achievement-unlock-btn" data-action="close">太棒了！</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (action === 'close' || e.target === modal) {
                modal.remove();
            }
        });
    },

    showRecordComplete(record, achievements) {
        const user = AuthService.getCurrentUser() || {};
        const modal = document.createElement('div');
        modal.className = 'share-modal-overlay';
        modal.innerHTML = `
            <div class="share-modal" style="border-radius: var(--radius-xl); max-width: 360px; animation: bounceIn 0.5s ease;">
                <div style="padding: 24px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                    <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 20px;">
                        完成训练！
                    </div>

                    <div style="display: flex; justify-content: center; gap: 32px; margin-bottom: 24px;">
                        <div style="text-align: center;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--primary-color);">
                                ${Utils.formatNumber(record?.count || 0)}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                跳绳次数
                            </div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 28px; font-weight: 700; color: var(--success-color);">
                                ${(record?.calories || 0).toFixed(0)}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                消耗 kcal
                            </div>
                        </div>
                    </div>

                    ${achievements.length > 0 ? `
                        <div style="background: linear-gradient(135deg, #fbbf24, #f59e0b); padding: 10px 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
                            <div style="font-size: 13px; color: white; font-weight: 500;">
                                🎉 解锁成就: ${achievements[0].name}
                            </div>
                        </div>
                    ` : ''}

                    <div class="share-modal-actions" style="padding: 0; gap: 10px; border: none;">
                        <button class="share-action-btn" data-action="share" style="flex: 2;">
                            <div class="share-action-icon">📤</div>
                            <div class="share-action-text">分享战绩</div>
                        </button>
                        <button class="share-action-btn" data-action="home" style="flex: 1;">
                            <div class="share-action-icon">🏠</div>
                            <div class="share-action-text">返回首页</div>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            if (action === 'home' || e.target === modal) {
                modal.remove();
                Router.navigate('home');
                return;
            }

            if (action === 'share') {
                modal.remove();
                ShareService.showShareModal({
                    user: user,
                    record: record,
                    type: 'record'
                });
            }
        });
    }
};
