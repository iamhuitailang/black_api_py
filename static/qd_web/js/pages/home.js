const HomePage = {
    signStatus: null,
    signConfig: null,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarData: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = this.getTemplate();
        this.bindEvents();
        await this.loadData();
    },

    getTemplate() {
        const user = AuthService.getUser();
        return `
            <div class="page has-header">
                <div class="header">
                    <div class="header-title">每日签到</div>
                </div>

                <div class="sign-banner">
                    <div class="sign-user-info">
                        <div class="sign-avatar">${user?.nickname?.[0] || '用'}</div>
                        <div class="sign-user-detail">
                            <div class="sign-username">${user?.nickname || '用户'}</div>
                            <div class="sign-points">积分: <span id="userPoints">${user?.points || 0}</span></div>
                        </div>
                    </div>
                </div>

                <div class="sign-stats">
                    <div class="sign-stat-item">
                        <div class="sign-stat-value" id="currentContinuous">0</div>
                        <div class="sign-stat-label">当前连续</div>
                    </div>
                    <div class="sign-stat-item">
                        <div class="sign-stat-value" id="maxContinuous">0</div>
                        <div class="sign-stat-label">最高连续</div>
                    </div>
                    <div class="sign-stat-item">
                        <div class="sign-stat-value" id="totalDays">0</div>
                        <div class="sign-stat-label">累计签到</div>
                    </div>
                    <div class="sign-stat-item">
                        <div class="sign-stat-value" id="todayCount">0</div>
                        <div class="sign-stat-label">今日已签</div>
                    </div>
                </div>

                <div class="sign-action">
                    <button class="sign-btn" id="signBtn">
                        <span class="sign-btn-text">立即签到</span>
                        <span class="sign-btn-reward" id="signReward">+10积分</span>
                    </button>
                </div>

                <div class="sign-next-award" id="nextAwardSection" style="display: none;">
                    <div class="next-award-icon">🎁</div>
                    <div class="next-award-text">
                        再签 <span class="next-award-days" id="daysToNextAward">0</span> 天可获得额外奖励
                    </div>
                </div>

                <div class="sign-consecutive-rewards" id="consecutiveRewards">
                    <div class="section-title">连续签到奖励</div>
                    <div class="reward-list" id="rewardList"></div>
                </div>

                <div class="sign-calendar">
                    <div class="section-title">
                        <div class="calendar-nav">
                            <button class="calendar-nav-btn" id="prevMonth">◀</button>
                            <span class="calendar-title" id="calendarTitle">2024年1月</span>
                            <button class="calendar-nav-btn" id="nextMonth">▶</button>
                        </div>
                    </div>
                    <div class="calendar-weekdays">
                        <div class="weekday">日</div>
                        <div class="weekday">一</div>
                        <div class="weekday">二</div>
                        <div class="weekday">三</div>
                        <div class="weekday">四</div>
                        <div class="weekday">五</div>
                        <div class="weekday">六</div>
                    </div>
                    <div class="calendar-days" id="calendarDays"></div>
                </div>

                <div class="sign-modal" id="signModal">
                    <div class="sign-modal-content">
                        <div class="sign-modal-close" id="closeModal">×</div>
                        <div class="sign-modal-icon">🎉</div>
                        <div class="sign-modal-title" id="modalTitle">签到成功</div>
                        <div class="sign-modal-desc" id="modalDesc">恭喜获得奖励</div>
                        <div class="sign-modal-rewards" id="modalRewards"></div>
                        <div class="sign-modal-continuous" id="modalContinuous">
                            连续签到 <span id="modalContinuousDays">0</span> 天
                        </div>
                        <button class="sign-modal-btn" id="modalBtn">太棒了</button>
                    </div>
                </div>

                <div class="tabbar">
                    <div class="tabbar-item active" data-route="home">
                        <div class="tabbar-icon">📅</div>
                        <div class="tabbar-text">签到</div>
                    </div>
                    <div class="tabbar-item" data-route="history">
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
        document.getElementById('signBtn').addEventListener('click', () => this.handleSign());
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('modalBtn').addEventListener('click', () => this.closeModal());

        document.querySelectorAll('.tabbar-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                if (route !== Router.getCurrentRoute()) {
                    Router.navigate(route);
                }
            });
        });
    },

    async loadData() {
        Utils.showLoading();
        try {
            const [statusResult, configResult] = await Promise.all([
                SignApi.getStatus(),
                SignApi.getConfig()
            ]);
            Utils.hideLoading();

            if (statusResult.code === 0) {
                this.signStatus = statusResult.data;
                this.updateSignStatus();
            }

            if (configResult.code === 0) {
                this.signConfig = configResult.data;
                this.renderConsecutiveRewards();
            }

            await this.loadCalendar();
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '加载失败');
        }
    },

    updateSignStatus() {
        const status = this.signStatus;
        if (!status) return;

        document.getElementById('currentContinuous').textContent = status.current_continuous;
        document.getElementById('maxContinuous').textContent = status.max_continuous;
        document.getElementById('totalDays').textContent = status.total_days;
        document.getElementById('todayCount').textContent = status.today_sign_count;

        const signBtn = document.getElementById('signBtn');
        const signBtnText = signBtn.querySelector('.sign-btn-text');
        const signBtnReward = signBtn.querySelector('.sign-btn-reward');

        if (status.is_signed_today) {
            signBtn.classList.add('signed');
            signBtnText.textContent = '今日已签到';
            signBtn.style.pointerEvents = 'none';
        } else {
            signBtnText.textContent = '立即签到';
            signBtnReward.textContent = `+${status.daily_points}积分`;
        }

        const nextAwardSection = document.getElementById('nextAwardSection');
        if (status.next_award && status.next_award.days_to_award > 0) {
            nextAwardSection.style.display = 'flex';
            document.getElementById('daysToNextAward').textContent = status.next_award.days_to_award;
        } else {
            nextAwardSection.style.display = 'none';
        }
    },

    renderConsecutiveRewards() {
        const rewards = this.signConfig?.consecutive_rewards || {};
        const rewardList = document.getElementById('rewardList');
        const currentContinuous = this.signStatus?.current_continuous || 0;

        const days = Object.keys(rewards).map(Number).sort((a, b) => a - b);

        rewardList.innerHTML = days.map(day => {
            const isAchieved = currentContinuous >= day;
            const isToday = currentContinuous === day;
            return `
                <div class="reward-item ${isAchieved ? 'achieved' : ''} ${isToday ? 'today' : ''}">
                    <div class="reward-day">${day}天</div>
                    <div class="reward-value">+${rewards[day]}积分</div>
                </div>
            `;
        }).join('');
    },

    async loadCalendar() {
        try {
            const result = await SignApi.getCalendar(this.currentYear, this.currentMonth);
            if (result.code === 0) {
                this.calendarData = result.data;
                this.renderCalendar();
            }
        } catch (error) {
            console.error('Load calendar error:', error);
        }
    },

    renderCalendar() {
        const data = this.calendarData;
        if (!data) return;

        document.getElementById('calendarTitle').textContent = `${data.year}年${data.month}月`;

        const calendarDays = document.getElementById('calendarDays');
        const firstDay = new Date(data.year, data.month - 1, 1).getDay();
        const daysInMonth = new Date(data.year, data.month, 0).getDate();

        let html = '';

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        const calendarMap = {};
        data.calendar.forEach(day => {
            calendarMap[day.day] = day;
        });

        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = calendarMap[day];
            const isToday = dayData?.is_today;
            const isSigned = dayData?.is_signed;
            const isSupplement = dayData?.is_supplement;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (isSigned) classes += isSupplement ? ' signed supplement' : ' signed';

            let content = day;
            if (isSigned) {
                content = isSupplement ? '补' : '✓';
            }

            html += `<div class="${classes}" data-date="${dayData?.date}" data-day="${day}">${content}</div>`;
        }

        calendarDays.innerHTML = html;

        calendarDays.querySelectorAll('.calendar-day[data-date]').forEach(dayEl => {
            dayEl.addEventListener('click', () => this.handleDayClick(dayEl));
        });
    },

    handleDayClick(dayEl) {
        const date = dayEl.dataset.date;
        const isSigned = dayEl.classList.contains('signed');
        const isToday = dayEl.classList.contains('today');
        const isSupplement = dayEl.classList.contains('supplement');

        if (isToday && isSigned) {
            Utils.showToast('今日已签到');
            return;
        }

        if (isToday && !isSigned) {
            this.handleSign();
            return;
        }

        if (!isSigned && !isToday) {
            if (this.signConfig?.enable_supplement) {
                this.showSupplementConfirm(date);
            } else {
                Utils.showToast('补签功能未开启');
            }
        }
    },

    showSupplementConfirm(date) {
        const cost = this.signConfig?.supplement_cost || 50;
        const user = AuthService.getUser();
        const userPoints = user?.points || 0;

        if (userPoints < cost) {
            Utils.showToast(`积分不足，需要${cost}积分`);
            return;
        }

        if (confirm(`确认补签 ${date}？\n将消耗 ${cost} 积分`)) {
            this.handleSupplementSign(date);
        }
    },

    async handleSupplementSign(date) {
        Utils.showLoading();
        try {
            const result = await SignApi.supplementSign(date);
            Utils.hideLoading();

            if (result.code === 0) {
                Utils.showToast('补签成功');
                await this.loadData();
            } else {
                Utils.showToast(result.msg || '补签失败');
            }
        } catch (error) {
            Utils.hideLoading();
            Utils.showToast(error.message || '补签失败');
        }
    },

    async handleSign() {
        const signBtn = document.getElementById('signBtn');
        if (signBtn.classList.contains('signed')) {
            Utils.showToast('今日已签到');
            return;
        }

        signBtn.classList.add('signing');
        Utils.showLoading();

        try {
            const result = await SignApi.sign();
            Utils.hideLoading();
            signBtn.classList.remove('signing');

            if (result.code === 0) {
                Utils.playFireworks();
                this.showSignModal(result.data);
                await this.loadData();

                const user = AuthService.getUser();
                if (user) {
                    user.points = result.data.total_points;
                    Storage.setUser(user);
                    document.getElementById('userPoints').textContent = user.points;
                }
            } else {
                Utils.showToast(result.msg || '签到失败');
            }
        } catch (error) {
            Utils.hideLoading();
            signBtn.classList.remove('signing');
            Utils.showToast(error.message || '签到失败');
        }
    },

    showSignModal(data) {
        const modal = document.getElementById('signModal');
        const rewardsHtml = `
            <div class="modal-reward-item">
                <span class="reward-label">基础奖励</span>
                <span class="reward-value">+${data.daily_points}积分</span>
            </div>
            ${data.consecutive_bonus > 0 ? `
                <div class="modal-reward-item bonus">
                    <span class="reward-label">连续奖励</span>
                    <span class="reward-value">+${data.consecutive_bonus}积分</span>
                </div>
            ` : ''}
        `;

        document.getElementById('modalRewards').innerHTML = rewardsHtml;
        document.getElementById('modalContinuousDays').textContent = data.continuous_days;

        if (data.is_award_day) {
            document.getElementById('modalTitle').textContent = '🎉 恭喜获得连续奖励';
            document.getElementById('modalDesc').textContent = `连续签到${data.continuous_days}天，额外奖励已发放`;
        } else {
            document.getElementById('modalTitle').textContent = '签到成功';
            document.getElementById('modalDesc').textContent = '继续坚持，更多奖励等着你';
        }

        modal.classList.add('show');
    },

    closeModal() {
        document.getElementById('signModal').classList.remove('show');
    },

    changeMonth(delta) {
        this.currentMonth += delta;

        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }

        this.loadCalendar();
    }
};
