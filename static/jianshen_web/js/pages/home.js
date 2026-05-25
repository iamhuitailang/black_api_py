const HomePage = {
    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="loading"><div class="spinner"></div></div>`, '首页');
        try {
            const [dashRes, recentRes] = await Promise.all([
                ApiService.get('/jianshen/dashboard/get'),
                ApiService.get('/jianshen/checkin/recent/get', { limit: 5 })
            ]);
            if (dashRes.code !== 0) throw new Error(dashRes.msg);
            const d = dashRes.data;
            const weekPct = d.weekly_progress.rate;
            const monthPct = d.monthly_progress.rate;
            const activities = (recentRes.data || []).map(a => {
                let projects = '';
                try { projects = JSON.parse(a.projects || '[]').join('、'); } catch (e) { projects = a.projects || ''; }
                const dt = a.checkin_date ? new Date(a.checkin_date) : new Date();
                return `
                    <div class="activity-item">
                        <div class="date">
                            <div class="day">${dt.getDate()}</div>
                            <div class="month">${dt.toLocaleString('zh-CN', { month: 'short' })}</div>
                        </div>
                        <div class="details">
                            <div class="title">${projects || '健身打卡'}</div>
                            <div class="meta">🔥 ${a.duration || 0}分钟 · ${a.calories || 0}kcal</div>
                        </div>
                    </div>
                `;
            }).join('');
            AppLayout.render(`
                <div class="content">
                    <div class="status-card ${d.today_status.has_checked_in ? 'checked' : ''}">
                        <div class="label">今日状态</div>
                        <div class="big-num">${d.today_status.has_checked_in ? '已打卡 ✓' : '待打卡'}</div>
                        <div class="sub">已连续 ${d.today_status.consecutive_days} 天 · 累计 ${d.today_status.total_days} 天</div>
                        <div class="status-badge">${d.today_status.has_checked_in ? '🔥 今日已完成' : '⏰ 快来打卡吧'}</div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h2>📊 本周进度</h2></div>
                        <div class="progress-row">
                            ${this.renderRing(weekPct, '周完成率')}
                            <div class="info">
                                <div class="value">${d.weekly_progress.completed} / ${d.weekly_progress.target}</div>
                                <div class="label">本周打卡天数</div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header"><h2>📅 本月进度</h2></div>
                        <div class="progress-row">
                            ${this.renderRing(monthPct, '月完成率', '#10b981')}
                            <div class="info">
                                <div class="value">${d.monthly_progress.completed} / ${d.monthly_progress.target}</div>
                                <div class="label">本月打卡天数</div>
                            </div>
                        </div>
                    </div>

                    ${d.daily_quote ? `
                    <div class="quote-card">
                        <div class="icon">💭</div>
                        <div class="text">"${d.daily_quote.content}"</div>
                        ${d.daily_quote.author ? `<div class="author">— ${d.daily_quote.author}</div>` : ''}
                    </div>` : ''}

                    <div class="quick-actions">
                        <button class="quick-btn" onclick="Router.navigate('checkin')">
                            <div class="icon">📝</div>
                            <div class="label">快速打卡</div>
                            <div class="desc">记录今天的训练</div>
                        </button>
                        <button class="quick-btn success" onclick="Router.navigate('plans')">
                            <div class="icon">🎯</div>
                            <div class="label">训练计划</div>
                            <div class="desc">查看今日任务</div>
                        </button>
                        <button class="quick-btn warning" onclick="Router.navigate('statistics')">
                            <div class="icon">📈</div>
                            <div class="label">数据统计</div>
                            <div class="desc">查看训练趋势</div>
                        </button>
                        <button class="quick-btn" onclick="Router.navigate('achievements')">
                            <div class="icon">🏆</div>
                            <div class="label">成就墙</div>
                            <div class="desc">解锁更多徽章</div>
                        </button>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h2>🕐 最近活动</h2>
                            <span class="more" onclick="Router.navigate('checkin')">全部 ›</span>
                        </div>
                        ${activities || '<div class="empty"><div class="icon">📭</div>暂无打卡记录</div>'}
                    </div>
                </div>
            `, '首页');
        } catch (e) {
            console.error(e);
            AppLayout.render(`
                <div class="content">
                    <div class="empty"><div class="icon">😅</div>加载失败，点击重试</div>
                    <button class="btn btn-primary btn-block" onclick="HomePage.render()">重试</button>
                </div>
            `, '首页');
        }
    },

    renderRing(percent, label, color) {
        const radius = 48;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        const strokeColor = color || 'var(--primary)';
        return `
            <div class="progress-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle class="bg" cx="60" cy="60" r="${radius}" stroke-width="10" fill="none"/>
                    <circle class="progress" cx="60" cy="60" r="${radius}" stroke-width="10" fill="none"
                        stroke="${strokeColor}" stroke-linecap="round"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                </svg>
                <div class="text">
                    <div class="value">${percent}%</div>
                    <div class="label">${label}</div>
                </div>
            </div>
        `;
    }
};
