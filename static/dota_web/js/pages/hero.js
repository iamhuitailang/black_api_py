const HeroPage = {
    heroes: [],
    ownedHeroes: [],
    selectedHeroId: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="page has-header">
                <header class="header">
                    <h1 class="header-title">英雄选择</h1>
                </header>

                <div class="hero-grid" id="heroGrid">
                    <div class="empty-state" style="grid-column: span 2; width: 100%;">
                        <div class="empty-state-icon">🗡️</div>
                        <div class="empty-state-text">加载中...</div>
                    </div>
                </div>

                ${Tabbar.render('hero')}
            </div>
        `;

        await this.loadHeroes();
    },

    async loadHeroes() {
        try {
            const result = await DotaApi.getHeroesForUser();
            if (result.code === 0) {
                this.heroes = result.data || [];
                this.ownedHeroes = this.heroes.filter(h => h.is_owned);
                this.renderHeroGrid();
            }
        } catch (e) {
            console.error('Load heroes error:', e);
            Toast.error('加载英雄列表失败');
        }
    },

    renderHeroGrid() {
        const grid = document.getElementById('heroGrid');
        if (!grid) return;

        if (this.heroes.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: span 2; width: 100%;">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-text">暂无英雄数据</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.heroes.map(hero => {
            const typeBadgeClass = {
                'agility': 'badge-agility',
                'strength': 'badge-strength',
                'intelligence': 'badge-intelligence'
            }[hero.hero_type] || 'badge-secondary';

            const isLocked = !hero.is_owned;
            const canBuy = hero.can_buy;

            return `
                <div class="hero-grid-item ${isLocked ? 'locked' : ''}" data-id="${hero.id}">
                    ${isLocked ? '<div class="hero-grid-lock">🔒</div>' : ''}
                    <div class="hero-grid-icon">${hero.icon}</div>
                    <div class="hero-grid-name">${hero.name}</div>
                    <div style="margin-top: 4px;">
                        <span class="badge ${typeBadgeClass}">${hero.hero_type_name}</span>
                    </div>
                    ${hero.user_hero ? `
                        <div style="margin-top: 4px; font-size: 11px; color: var(--text-secondary);">
                            Lv.${hero.user_hero.level}
                        </div>
                    ` : ''}
                    ${isLocked ? `
                        <div class="hero-grid-price" style="margin-top: 4px;">
                            💰 ${hero.price}
                        </div>
                        <button class="btn btn-sm ${canBuy ? 'btn-primary' : 'btn-outline disabled'}" 
                            style="margin-top: 8px; width: 100%; font-size: 11px; padding: 6px 4px;"
                            ${!canBuy ? 'disabled' : ''}
                            onclick="event.stopPropagation(); HeroPage.handleBuyHero(${hero.id})">
                            ${canBuy ? '购买' : '金币不足'}
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-primary" 
                            style="margin-top: 8px; width: 100%; font-size: 11px; padding: 6px 4px;"
                            onclick="event.stopPropagation(); HeroPage.handleSelectHero(${hero.id})">
                            选择战斗
                        </button>
                    `}
                </div>
            `;
        }).join('');

        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.hero-grid-item').forEach(item => {
            item.addEventListener('click', () => {
                const heroId = parseInt(item.dataset.id);
                const hero = this.heroes.find(h => h.id === heroId);
                if (hero && hero.is_owned) {
                    Router.navigate('hero', { hero_id: heroId, action: 'detail' });
                }
            });
        });
    },

    async handleBuyHero(heroId) {
        Utils.showLoading();

        try {
            const result = await DotaApi.buyHero(heroId);
            if (result.code === 0) {
                Toast.success('购买成功！');
                await this.loadHeroes();
            } else {
                Toast.error(result.msg || '购买失败');
            }
        } catch (e) {
            Toast.error('购买失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    },

    async handleSelectHero(heroId) {
        Utils.showLoading();

        try {
            const result = await DotaApi.selectHero(heroId);
            if (result.code === 0) {
                const user = AuthService.getUser();
                if (user) {
                    user.current_hero_id = heroId;
                    AuthService.updateUser(user);
                }
                Toast.success('已选择该英雄！');
                Router.navigate('battle');
            } else {
                Toast.error(result.msg || '选择失败');
            }
        } catch (e) {
            Toast.error('选择失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    },

    async renderDetail() {
        const params = Router.getParams();
        const heroId = params.hero_id;

        if (!heroId) {
            Router.navigate('hero');
            return;
        }

        let heroDetail = null;

        Utils.showLoading();
        try {
            const result = await DotaApi.getHeroDetail(heroId);
            if (result.code === 0) {
                heroDetail = result.data;
            }
        } catch (e) {
            console.error('Load hero detail error:', e);
        } finally {
            Utils.hideLoading();
        }

        if (!heroDetail) {
            Toast.error('加载英雄详情失败');
            Router.navigate('hero');
            return;
        }

        const app = document.getElementById('app');
        const userHero = heroDetail.user_hero;

        const typeBadgeClass = {
            'agility': 'badge-agility',
            'strength': 'badge-strength',
            'intelligence': 'badge-intelligence'
        }[heroDetail.hero_type] || 'badge-secondary';

        app.innerHTML = `
            <div class="page has-header no-tabbar">
                <header class="header">
                    <button class="header-back" onclick="Router.navigate('hero')">‹</button>
                    <h1 class="header-title">英雄详情</h1>
                </header>

                <div class="hero-detail-header">
                    <div class="hero-detail-icon">${heroDetail.icon}</div>
                    <div class="hero-detail-name">${heroDetail.name}</div>
                    <div class="hero-detail-level">
                        <span class="badge ${typeBadgeClass}">${heroDetail.hero_type_name}</span>
                        ${userHero ? `
                            <span style="margin-left: 8px; font-weight: 500;">Lv.${userHero.level}</span>
                        ` : ''}
                    </div>
                    ${userHero ? `
                        <div class="skill-points">
                            剩余技能点: <span class="skill-points-value">${userHero.skill_points}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="hero-detail-stats">
                    <div class="hero-detail-stat">
                        <div class="hero-detail-stat-value">${userHero ? userHero.level : 1}</div>
                        <div class="hero-detail-stat-label">等级</div>
                    </div>
                    <div class="hero-detail-stat">
                        <div class="hero-detail-stat-value atk">${heroDetail.base_attack}</div>
                        <div class="hero-detail-stat-label atk">攻击力</div>
                    </div>
                    <div class="hero-detail-stat">
                        <div class="hero-detail-stat-value hp">${heroDetail.base_hp}</div>
                        <div class="hero-detail-stat-label hp">生命值</div>
                    </div>
                    <div class="hero-detail-stat">
                        <div class="hero-detail-stat-value def">${heroDetail.base_defense}</div>
                        <div class="hero-detail-stat-label def">防御力</div>
                    </div>
                </div>

                <div class="section-title">技能列表</div>

                <div class="skill-list" id="skillList">
                    ${heroDetail.skills.map((skill, index) => {
                        const skillLevel = userHero && userHero.skills ? 
                            (userHero.skills.find(s => s.skill_id === skill.id)?.level || 0) : 0;
                        const canUpgrade = userHero && userHero.skill_points > 0 && skillLevel < skill.max_level;
                        const isMaxLevel = skillLevel >= skill.max_level;

                        return `
                            <div class="skill-item">
                                <div class="skill-icon">${skill.icon}</div>
                                <div class="skill-info">
                                    <div class="skill-name">
                                        ${skill.name}
                                        <span class="skill-level">${skillLevel > 0 ? `Lv.${skillLevel}` : '未学习'}</span>
                                    </div>
                                    <div class="skill-desc">${skill.description}</div>
                                    <div class="skill-detail">
                                        ${skill.damage > 0 ? `伤害: ${skill.damage} | ` : ''}
                                        冷却: ${skill.cooldown}秒
                                        ${skill.max_level ? ` | 最高 ${skill.max_level} 级` : ''}
                                    </div>
                                </div>
                                ${userHero ? `
                                    <button class="skill-upgrade-btn ${canUpgrade ? 'btn-primary' : (isMaxLevel ? 'btn-outline disabled' : 'btn-outline')}"
                                        ${!canUpgrade ? 'disabled' : ''}
                                        onclick="HeroPage.handleUpgradeSkill(${heroDetail.id}, ${skill.id})">
                                        ${isMaxLevel ? '已满级' : (skillLevel > 0 ? '升级' : '学习')}
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                ${userHero ? `
                    <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; padding-bottom: calc(12px + var(--safe-area-bottom)); background-color: var(--card-bg); border-top: 1px solid var(--border-color);">
                        <div style="display: flex; gap: 12px;">
                            ${userHero.current_hp < userHero.level * 50 + heroDetail.base_hp ? `
                                <button class="btn btn-warning" style="flex: 1;" onclick="HeroPage.handleHealHero(${heroDetail.id})">
                                    ❤️ 恢复生命
                                </button>
                            ` : ''}
                            <button class="btn btn-primary" style="flex: 1;" onclick="HeroPage.handleSelectHero(${heroDetail.id})">
                                ⚔️ 选择战斗
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async handleUpgradeSkill(heroId, skillId) {
        Utils.showLoading();

        try {
            const result = await DotaApi.upgradeSkill(heroId, skillId);
            if (result.code === 0) {
                Toast.success('技能升级成功！');
                await this.renderDetail();
            } else {
                Toast.error(result.msg || '升级失败');
            }
        } catch (e) {
            Toast.error('升级失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    },

    async handleHealHero(heroId) {
        Utils.showLoading();

        try {
            const result = await DotaApi.healHero(heroId);
            if (result.code === 0) {
                Toast.success('恢复成功！');
                await this.renderDetail();
            } else {
                Toast.error(result.msg || '恢复失败');
            }
        } catch (e) {
            Toast.error('恢复失败：' + e.message);
        } finally {
            Utils.hideLoading();
        }
    }
};
