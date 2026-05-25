const AchievementsPage = {
    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="content"><div class="loading"><div class="spinner"></div></div></div>`, '成就');
        try {
            const [list, level, upcoming] = await Promise.all([
                ApiService.get('/jianshen/achievement/list/get'),
                ApiService.get('/jianshen/achievement/level/get'),
                ApiService.get('/jianshen/achievement/upcoming/get')
            ]);
            this.renderContent(list.data, level.data, upcoming.data);
        } catch (e) {
            console.error(e);
        }
    },

    renderContent(list, level, upcoming) {
        const unlockedCount = (list || []).filter(a => a.unlocked).length;
        const wall = (list || []).map(a => `
            <div class="achievement ${a.unlocked ? 'unlocked' : 'locked'}" title="${a.name} - ${a.description}">
                <div class="icon">${a.icon || '🏅'}</div>
                <div class="name">${a.name}</div>
            </div>
        `).join('');
        const upcomingHtml = (upcoming || []).map(u => `
            <div class="upcoming-item">
                <div class="icon">${u.achievement.icon || '🏅'}</div>
                <div class="info">
                    <div class="name">${u.achievement.name}</div>
                    <div class="progress-text">${u.progress}/${u.target} · ${u.percent}%</div>
                    <div class="progress-bar"><div class="fill" style="width:${u.percent}%"></div></div>
                </div>
            </div>
        `).join('') || '<div class="empty"><div class="icon">🎉</div>暂无即将解锁的成就</div>';
        const nextLevelExp = level ? level.next_level_exp : 100;
        const progressPct = level ? level.progress : 0;
        AppLayout.render(`
            <div class="content">
                <div class="card" style="background: linear-gradient(135deg, #4361ee, #805ad5); color: white;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <div style="font-size:48px;">🏆</div>
                        <div style="flex:1;">
                            <div style="font-size:13px; opacity:0.85;">当前等级</div>
                            <div style="font-size:28px; font-weight:700; line-height:1.2;">Lv.${level ? level.level : 1}</div>
                            <div style="font-size:12px; opacity:0.85; margin-top:4px;">经验 ${level ? level.exp : 0} / ${nextLevelExp}</div>
                        </div>
                    </div>
                    <div class="progress-bar" style="background:rgba(255,255,255,0.2); margin-top:12px;">
                        <div class="fill" style="width:${progressPct}%; background:white;"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>🏅 成就墙 (${unlockedCount}/${list ? list.length : 0})</h2>
                    </div>
                    <div class="achievement-wall">${wall}</div>
                </div>

                <div class="card">
                    <div class="card-header"><h2>⏳ 即将解锁</h2></div>
                    ${upcomingHtml}
                </div>
            </div>
        `, '成就');
    }
};
