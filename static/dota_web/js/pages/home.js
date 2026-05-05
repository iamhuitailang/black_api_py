const Tabbar = {
    render(active) {
        const items = [
            { route: 'home', icon: '🏠', name: '主页' },
            { route: 'hero', icon: '🗡️', name: '英雄' },
            { route: 'battle', icon: '⚔️', name: '战斗' },
            { route: 'shop', icon: '🛒', name: '商店' },
            { route: 'profile', icon: '👤', name: '我的' }
        ];

        return `
            <div class="tabbar">
                ${items.map(item => `
                    <div class="tabbar-item ${active === item.route ? 'active' : ''}" onclick="Router.navigate('${item.route}')">
                        <div class="tabbar-icon">${item.icon}</div>
                        <div class="tabbar-text">${item.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
};

const HomePage = {
    user: null,
    currentStage: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">遗迹守卫</h1>
                </header>

                <div id="userBar" class="user-bar">
                    <div class="user-info">
                        <div class="user-avatar">⚔️</div>
                        <div>
                            <div class="user-name" id="userName">加载中...</div>
                            <div class="user-level" id="userLevel">等级 1</div>
                        </div>
                    </div>
                    <div class="resource-bar">
                        <div class="resource-item">
                            <span class="resource-icon">💰</span>
                            <span class="resource-value gold" id="userGold">0</span>
                        </div>
                    </div>
                </div>

                <div class="section-title">当前进度</div>

                <div class="card" id="currentStageCard">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                <div class="section-title">快速入口</div>

                <div class="list">
                    <div class="list-item" onclick="Router.navigate('hero')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">🗡️</div>
                        <div class="list-item-content">
                            <div class="list-item-title">英雄选择</div>
                            <div class="list-item-desc">选择或购买新英雄</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('battle')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">⚔️</div>
                        <div class="list-item-content">
                            <div class="list-item-title">开始战斗</div>
                            <div class="list-item-desc">挑战关卡获得奖励</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('shop')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">🛒</div>
                        <div class="list-item-content">
                            <div class="list-item-title">商店</div>
                            <div class="list-item-desc">购买装备提升能力</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                    <div class="list-item" onclick="Router.navigate('inventory')">
                        <div class="list-item-icon" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;">📦</div>
                        <div class="list-item-content">
                            <div class="list-item-title">背包</div>
                            <div class="list-item-desc">查看和装备物品</div>
                        </div>
                        <div class="list-item-arrow">›</div>
                    </div>
                </div>

                <div class="section-title">游戏说明</div>

                <div class="card">
                    <div class="card-body">
                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 500; margin-bottom: 4px;">🎮 游戏流程</div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                选择英雄 → 进入关卡战斗 → 击败敌人获得金币和经验 → 升级技能和购买装备 → 挑战更高关卡和BOSS
                            </div>
                        </div>
                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: 500; margin-bottom: 4px;">🗡️ 英雄类型</div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                <span class="badge badge-agility">敏捷</span> 高攻速 ·
                                <span class="badge badge-strength">力量</span> 高生命 ·
                                <span class="badge badge-intelligence">智力</span> 高技能伤害
                            </div>
                        </div>
                        <div>
                            <div style="font-weight: 500; margin-bottom: 4px;">💎 初始英雄</div>
                            <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                注册账号即送 <span class="badge badge-agility">🗡️ 敌法师</span> 和
                                <span class="badge badge-strength">🛡️ 斧王</span>！
                            </div>
                        </div>
                    </div>
                </div>

                ${Tabbar.render('home')}
            </div>
        `;

        await this.loadData();
    },

    async loadData() {
        try {
            const userInfo = await DotaApi.getUserInfo();
            if (userInfo.code === 0) {
                this.user = userInfo.data.user;
                this.currentStage = userInfo.data;
                this.updateUI();
            }
        } catch (e) {
            console.error('Load data error:', e);
        }
    },

    updateUI() {
        if (!this.user) return;

        const userNameEl = document.getElementById('userName');
        const userLevelEl = document.getElementById('userLevel');
        const userGoldEl = document.getElementById('userGold');

        if (userNameEl) userNameEl.textContent = this.user.nickname || this.user.username;
        if (userLevelEl) userLevelEl.textContent = `等级 ${this.user.level}`;
        if (userGoldEl) userGoldEl.textContent = Utils.formatNumber(this.user.gold);

        const stageCard = document.getElementById('currentStageCard');
        if (stageCard && this.currentStage) {
            const currentStageId = this.currentStage.current_stage;

            stageCard.innerHTML = `
                <div class="card-body" style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 12px;">👾</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
                        当前关卡: ${this.currentStage.current_stage || '1-1'}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
                        最高通关: ${this.currentStage.max_stage || '1-1'}
                    </div>
                    <button class="btn btn-primary" onclick="Router.navigate('battle')">
                        ⚔️ 开始战斗
                    </button>
                </div>
            `;
        }
    }
};
