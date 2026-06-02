const TimelinePage = {
    caseId: null,
    events: [],

    async render() {
        const app = document.getElementById('app');
        const params = Router.getParams();
        this.caseId = params.case_id;

        if (!this.caseId) {
            Router.navigate('home');
            return;
        }

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <div class="header-back" onclick="Router.back()">←</div>
                    <h1 class="header-title">时间线</h1>
                </header>

                <div class="timeline-container" id="timelineContent">
                    <div class="empty-state">
                        <div class="empty-state-icon">⏱️</div>
                        <div class="empty-state-title">加载时间线中<span class="loading-dots"></span></div>
                    </div>
                </div>
            </div>
        `;

        await this.loadTimeline();
    },

    async loadTimeline() {
        try {
            const result = await PoanApi.getTimeline(this.caseId);
            if (result.code === 0) {
                this.events = result.data || [];
                this.renderTimeline();
            } else {
                Toast.error(result.msg || '加载失败');
            }
        } catch (error) {
            console.error('加载时间线失败:', error);
            document.getElementById('timelineContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-title">加载失败</div>
                    <div class="empty-state-text">点击重试</div>
                </div>
            `;
            document.getElementById('timelineContent').querySelector('.empty-state').onclick = () => this.loadTimeline();
        }
    },

    renderTimeline() {
        const container = document.getElementById('timelineContent');

        if (this.events.length === 0) {
            container.innerHTML = `
                <h2 class="timeline-title">案件时间线</h2>
                <p class="timeline-subtitle">还原案件发生的时间脉络</p>
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">暂无时间线信息</div>
                    <div class="empty-state-text">继续调查以解锁时间线事件</div>
                    <button class="btn btn-primary mt-2" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                        返回调查
                    </button>
                </div>
            `;
            return;
        }

        const sortedEvents = [...this.events].sort((a, b) => {
            const timeA = a.time || a.timestamp || 0;
            const timeB = b.time || b.timestamp || 0;
            return timeA - timeB;
        });

        container.innerHTML = `
            <h2 class="timeline-title">案件时间线</h2>
            <p class="timeline-subtitle">共 ${sortedEvents.length} 个关键事件</p>

            <div class="timeline">
                ${sortedEvents.map((event, index) => this.renderTimelineItem(event, index, sortedEvents.length)).join('')}
            </div>

            <div style="padding: 20px 16px;">
                <button class="btn btn-outline btn-block" onclick="Router.navigate('game', { case_id: '${this.caseId}' })">
                    返回调查
                </button>
            </div>
        `;
    },

    renderTimelineItem(event, index, total) {
        const isUnlocked = event.unlocked !== false;
        const isCurrent = index === total - 1 && isUnlocked;
        const statusClass = isCurrent ? 'current' : (isUnlocked ? 'unlocked' : 'locked');

        const time = event.time_display || event.time_label || Utils.formatDateTime(event.time);
        const title = event.title || event.name || '未知事件';
        const description = event.description || event.detail || '';

        return `
            <div class="timeline-item ${statusClass}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    ${isUnlocked ? `
                        <div class="timeline-time">
                            <span>🕐</span>
                            ${time}
                        </div>
                        <div class="timeline-title-item">${title}</div>
                        <div class="timeline-desc">${description}</div>
                    ` : `
                        <div class="timeline-locked-text">
                            <span>🔒</span>
                            <span>继续调查以解锁此事件</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
};

window.TimelinePage = TimelinePage;
