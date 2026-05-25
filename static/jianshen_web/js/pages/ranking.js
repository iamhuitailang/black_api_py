const RankingPage = {
    state: { type: 'total' },

    async render() {
        if (!AuthService.requireAuth()) return;
        AppLayout.render(`<div class="content"><div class="loading"><div class="spinner"></div></div></div>`, '排行榜');
        await this.load();
    },

    async load() {
        try {
            const [list, my] = await Promise.all([
                ApiService.get('/jianshen/ranking/list/get', { rank_type: this.state.type, limit: 50 }),
                ApiService.get('/jianshen/ranking/my/get', { rank_type: this.state.type })
            ]);
            this.renderContent(list.data, my.data);
        } catch (e) {
            console.error(e);
        }
    },

    renderContent(listData, myData) {
        const s = this.state;
        const tabs = [
            { key: 'total', label: '总天数榜', icon: '🔥' },
            { key: 'consecutive', label: '连续榜', icon: '⚡' },
            { key: 'level', label: '等级榜', icon: '⭐' }
        ];
        const items = (listData.items || []).map((u, i) => {
            const initial = (u.nickname || u.username || 'U').charAt(0).toUpperCase();
            const topClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
            const isMe = myData && myData.user && myData.user.id === u.id;
            return `
                <div class="item ${topClass} ${isMe ? 'me' : ''}">
                    <div class="rank-num">${u.rank}</div>
                    <div class="avatar">${initial}</div>
                    <div class="info">
                        <div class="name">${u.nickname || u.username}</div>
                        <div class="sub">Lv.${u.level} · 连续${u.consecutive_days}天</div>
                    </div>
                    <div class="value">${u.value}</div>
                </div>
            `;
        }).join('');
        const myRankHtml = myData ? `
            <div class="item me" style="margin-bottom: 12px;">
                <div class="rank-num">${myData.rank}</div>
                <div class="avatar">${(myData.user.nickname || myData.user.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="info">
                    <div class="name">${myData.user.nickname || myData.user.username} (我)</div>
                    <div class="sub">Lv.${myData.user.level}</div>
                </div>
                <div class="value">${myData.value}</div>
            </div>
        ` : '';
        AppLayout.render(`
            <div class="content">
                <div class="rank-tabs">
                    ${tabs.map(t => `<div class="rank-tab ${s.type === t.key ? 'active' : ''}" onclick="RankingPage.setType('${t.key}')">${t.icon} ${t.label}</div>`).join('')}
                </div>
                ${myRankHtml}
                <div class="rank-list">${items || '<div class="empty"><div class="icon">🏆</div>暂无数据</div>'}</div>
            </div>
        `, '排行榜');
    },

    setType(t) { this.state.type = t; this.load(); }
};
