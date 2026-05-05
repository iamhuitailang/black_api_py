const RankPage = {
    mockRanks: [
        { rank: 1, name: '无敌战神', level: 30, score: 9999, avatar: '👑' },
        { rank: 2, name: '暗影猎手', level: 28, score: 8888, avatar: '🥈' },
        { rank: 3, name: '光明骑士', level: 26, score: 7777, avatar: '🥉' },
        { rank: 4, name: '风暴使者', level: 24, score: 6666, avatar: '⚡' },
        { rank: 5, name: '冰霜女王', level: 22, score: 5555, avatar: '❄️' },
        { rank: 6, name: '烈焰战士', level: 20, score: 4444, avatar: '🔥' },
        { rank: 7, name: '暗夜刺客', level: 18, score: 3333, avatar: '🌙' },
        { rank: 8, name: '自然守护', level: 16, score: 2222, avatar: '🌿' },
        { rank: 9, name: '雷霆领主', level: 14, score: 1111, avatar: '⛈️' },
        { rank: 10, name: '星辰之子', level: 12, score: 1000, avatar: '⭐' },
    ],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <button class="header-back" onclick="Router.navigate('profile')">‹</button>
                    <h1 class="header-title">排行榜</h1>
                </header>

                <div class="card" style="margin: 12px;">
                    <div class="card-body" style="text-align: center;">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                            全服排名
                        </div>
                        <div style="display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-top: 16px;">
                            ${this.renderPodiumItem(2, this.mockRanks[1])}
                            ${this.renderPodiumItem(1, this.mockRanks[0], true)}
                            ${this.renderPodiumItem(3, this.mockRanks[2])}
                        </div>
                    </div>
                </div>

                <div class="section-title">全服排行</div>

                <div class="rank-list">
                    ${this.mockRanks.map((rank, index) => {
                        if (index < 3) return '';
                        return `
                            <div class="rank-item">
                                <div class="rank-number normal">${rank.rank}</div>
                                <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-right:12px;">${rank.avatar}</div>
                                <div class="rank-info">
                                    <div class="rank-name">${rank.name}</div>
                                    <div class="rank-detail">Lv.${rank.level}</div>
                                </div>
                                <div class="rank-score">${Utils.formatNumber(rank.score)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div style="height: 20px;"></div>
            </div>
        `;
    },

    renderPodiumItem(position, data, isTop = false) {
        const height = isTop ? '100px' : (position === 2 ? '80px' : '60px');
        const fontSize = isTop ? '48px' : '36px';
        const bgColor = isTop ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                        (position === 2 ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' :
                        'linear-gradient(135deg, #f97316 0%, #ea580c 100%)');

        return `
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="font-size: ${fontSize}; margin-bottom: 8px;">${data.avatar}</div>
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${data.name}</div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Lv.${data.level}</div>
                <div style="width: 80px; height: ${height}; background: ${bgColor}; border-radius: 8px 8px 0 0; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: white;">
                    ${position}
                </div>
            </div>
        `;
    }
};
