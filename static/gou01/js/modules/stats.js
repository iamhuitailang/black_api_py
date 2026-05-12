const Stats = {
    init() {
    },

    render() {
        const checkins = Storage.loadCheckins();
        
        if (checkins.length === 0) {
            return `
                <div class="bone-card">
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <p>还没有数据，快去遛狗打卡吧！</p>
                    </div>
                </div>
            `;
        }

        const stats = this.calculateStats(checkins);
        const weeklyData = this.getWeeklyData(checkins);

        return `
            <div class="grid-3">
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.totalDays}</div>
                    <div class="stats-label">📅 打卡天数</div>
                </div>
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.totalMinutes}</div>
                    <div class="stats-label">⏱️ 总时长(分钟)</div>
                </div>
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.totalCheckins}</div>
                    <div class="stats-label">✅ 打卡次数</div>
                </div>
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.maxStreak}</div>
                    <div class="stats-label">🔥 最长连续</div>
                </div>
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.avgDuration}</div>
                    <div class="stats-label">📈 平均时长</div>
                </div>
                <div class="bone-card stats-card">
                    <div class="stats-value">${stats.poopNormalRate}%</div>
                    <div class="stats-label">💩 正常排便率</div>
                </div>
            </div>

            <div class="bone-card">
                <h3 style="margin-bottom: 20px;">📊 近7天遛狗时长</h3>
                <div class="chart-container">
                    <div class="chart-bar">
                        ${weeklyData.map(d => `
                            <div class="chart-bar-item" style="height: ${d.height}%">
                                <span class="chart-bar-value">${d.value > 0 ? d.value : ''}</span>
                                <span class="chart-bar-label">${d.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">🌤️ 天气分布</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    ${Object.entries(stats.weatherDist).map(([key, value]) => {
                        const weather = Checkin.weathers.find(w => w.id === key);
                        const percent = Math.round((value / stats.totalCheckins) * 100);
                        return `
                            <div style="flex: 1; min-width: 100px; text-align: center;">
                                <div style="font-size: 2rem;">${weather ? weather.icon : '❓'}</div>
                                <div style="font-size: 1.2rem; font-weight: bold;">${percent}%</div>
                                <div style="color: var(--text-light); font-size: 0.9rem;">${weather ? weather.label : key}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">📍 路线分布</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    ${Object.entries(stats.routeDist).map(([key, value]) => {
                        const route = Checkin.routes.find(r => r.id === key);
                        const percent = Math.round((value / stats.totalCheckins) * 100);
                        return `
                            <div style="flex: 1; min-width: 100px; text-align: center;">
                                <div style="font-size: 2rem;">${route ? route.icon : '📍'}</div>
                                <div style="font-size: 1.2rem; font-weight: bold;">${percent}%</div>
                                <div style="color: var(--text-light); font-size: 0.9rem;">${route ? route.label : key}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="bone-card">
                <h3 style="margin-bottom: 15px;">💡 健康建议</h3>
                ${this.getHealthAdvice(stats)}
            </div>
        `;
    },

    calculateStats(checkins) {
        const totalCheckins = checkins.length;
        const totalMinutes = checkins.reduce((sum, c) => sum + c.duration, 0);
        const avgDuration = Math.round(totalMinutes / totalCheckins);

        const uniqueDays = new Set(checkins.map(c => {
            const date = new Date(c.timestamp);
            return date.toDateString();
        }));
        const totalDays = uniqueDays.size;

        const maxStreak = this.calculateMaxStreak(checkins);

        const normalPoops = checkins.filter(c => c.poop === 'normal').length;
        const poopNormalRate = totalCheckins > 0 ? Math.round((normalPoops / totalCheckins) * 100) : 0;

        const weatherDist = {};
        checkins.forEach(c => {
            weatherDist[c.weather] = (weatherDist[c.weather] || 0) + 1;
        });

        const routeDist = {};
        checkins.forEach(c => {
            routeDist[c.route] = (routeDist[c.route] || 0) + 1;
        });

        return {
            totalCheckins,
            totalMinutes,
            avgDuration,
            totalDays,
            maxStreak,
            poopNormalRate,
            weatherDist,
            routeDist
        };
    },

    calculateMaxStreak(checkins) {
        const uniqueDays = [...new Set(checkins.map(c => {
            const date = new Date(c.timestamp);
            return date.toDateString();
        }))].map(d => new Date(d)).sort((a, b) => a - b);

        if (uniqueDays.length === 0) return 0;

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < uniqueDays.length; i++) {
            const diffDays = (uniqueDays[i] - uniqueDays[i - 1]) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    },

    getWeeklyData(checkins) {
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const result = [];
        let maxValue = 0;

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayCheckins = checkins.filter(c => c.timestamp.startsWith(dateStr));
            const totalDuration = dayCheckins.reduce((sum, c) => sum + c.duration, 0);
            result.push({
                label: days[date.getDay()],
                value: totalDuration
            });
            maxValue = Math.max(maxValue, totalDuration);
        }

        return result.map(r => ({
            ...r,
            height: maxValue > 0 ? (r.value / maxValue) * 100 : 0
        }));
    },

    getHealthAdvice(stats) {
        const advice = [];

        if (stats.avgDuration < 20) {
            advice.push('⚠️ 每次遛狗时间偏短，建议增加到20-30分钟，让狗狗充分运动');
        } else {
            advice.push('✅ 遛狗时长合适，继续保持！');
        }

        if (stats.maxStreak < 3) {
            advice.push('💪 尝试保持连续每天遛狗，有助于培养规律习惯');
        } else {
            advice.push(`🔥 太棒了！最长连续打卡 ${stats.maxStreak} 天！`);
        }

        if (stats.poopNormalRate < 80) {
            advice.push('💩 正常排便率偏低，注意观察狗狗饮食和健康状况');
        } else {
            advice.push('💩 排便状况良好，狗狗很健康！');
        }

        if (stats.totalDays >= 7 && stats.maxStreak >= 5) {
            advice.push('🏆 你已经养成了很好的遛狗习惯，继续加油！');
        }

        return advice.map(a => `<p style="margin-bottom: 10px;">${a}</p>`).join('');
    }
};