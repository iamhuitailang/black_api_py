const SkillPage = {
    data() {
        return {
            user: null,
            skills: [],
            mySkills: {},
            loading: false,
            showUpgradeModal: false,
            selectedSkill: null
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">⚡ 技能树</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">技能树</h1>

                <div v-if="loading" class="empty-state">
                    <div class="empty-icon">⏳</div>
                    <div class="empty-text">加载中...</div>
                </div>
                <div v-else class="skill-tree">
                    <div class="skill-row">
                        <div 
                            v-for="skill in activeSkills" 
                            :key="skill.id"
                            class="skill-node"
                            :class="{ 
                                unlocked: getSkillLevel(skill.id) > 0,
                                'max-level': getSkillLevel(skill.id) >= skill.max_level
                            }"
                            @click="onSkillClick(skill)"
                        >
                            <div class="skill-icon">{{ skill.icon || '⚡' }}</div>
                            <div class="skill-name">{{ skill.name }}</div>
                            <div class="skill-level">
                                Lv.{{ getSkillLevel(skill.id) }} / {{ skill.max_level }}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                                {{ skill.skill_type === 1 ? '主动' : '被动' }}
                            </div>
                        </div>
                    </div>
                    <div class="skill-row">
                        <div 
                            v-for="skill in passiveSkills" 
                            :key="skill.id"
                            class="skill-node"
                            :class="{ 
                                unlocked: getSkillLevel(skill.id) > 0,
                                'max-level': getSkillLevel(skill.id) >= skill.max_level
                            }"
                            @click="onSkillClick(skill)"
                        >
                            <div class="skill-icon">{{ skill.icon || '⚡' }}</div>
                            <div class="skill-name">{{ skill.name }}</div>
                            <div class="skill-level">
                                Lv.{{ getSkillLevel(skill.id) }} / {{ skill.max_level }}
                            </div>
                            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                                {{ skill.skill_type === 1 ? '主动' : '被动' }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <h3 class="section-title" style="margin-top: 0;">当前效果</h3>
                    <div class="grid grid-3">
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.score_bonus || 0 }}%
                            </div>
                            <div class="stats-label">得分加成</div>
                        </div>
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.speed_bonus || 0 }}%
                            </div>
                            <div class="stats-label">速度加成</div>
                        </div>
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.jump_bonus || 0 }}%
                            </div>
                            <div class="stats-label">跳跃加成</div>
                        </div>
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.magnet_range || 0 }}
                            </div>
                            <div class="stats-label">磁铁范围</div>
                        </div>
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.shield_count || 0 }}
                            </div>
                            <div class="stats-label">护盾次数</div>
                        </div>
                        <div class="card stats-card" style="padding: 16px;">
                            <div class="stats-value" style="font-size: 24px;">
                                {{ currentEffects.revive_count || 0 }}
                            </div>
                            <div class="stats-label">复活次数</div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showUpgradeModal && selectedSkill" class="modal" @click.self="showUpgradeModal = false">
                <div class="modal-content">
                    <h2 class="modal-title">{{ selectedSkill.name }}</h2>
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div 
                            class="skill-icon"
                            style="width: 80px; height: 80px; font-size: 36px; margin: 0 auto 16px;"
                        >
                            {{ selectedSkill.icon || '⚡' }}
                        </div>
                        <p style="color: var(--text-secondary); margin-bottom: 16px;">
                            {{ selectedSkill.description }}
                        </p>
                        <div style="margin-bottom: 16px;">
                            <span style="font-size: 18px; font-weight: 600;">
                                Lv.{{ getSkillLevel(selectedSkill.id) }} / {{ selectedSkill.max_level }}
                            </span>
                        </div>
                        <div v-if="getSkillLevel(selectedSkill.id) < selectedSkill.max_level">
                            <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">
                                下一级效果: {{ selectedSkill.effect_value * (getSkillLevel(selectedSkill.id) + 1) }}{{ selectedSkill.effect_unit }}
                            </div>
                            <div style="font-size: 20px; font-weight: 700; color: var(--warning);">
                                💰 {{ getUpgradePrice() }} 金币
                            </div>
                            <div style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                                当前金币: {{ user ? user.coins : 0 }}
                            </div>
                        </div>
                        <div v-else style="color: var(--success); font-weight: 600; font-size: 18px;">
                            ✅ 已满级
                        </div>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" @click="showUpgradeModal = false">
                            关闭
                        </button>
                        <button 
                            v-if="getSkillLevel(selectedSkill.id) < selectedSkill.max_level"
                            class="btn btn-primary" 
                            @click="upgradeSkill"
                            :disabled="user && user.coins < getUpgradePrice()"
                        >
                            升级
                        </button>
                    </div>
                </div>
            </div>

            <nav class="nav-bar">
                <div class="nav-item" @click="goToHome">
                    <div class="nav-icon">🏠</div>
                    <div class="nav-label">首页</div>
                </div>
                <div class="nav-item" @click="goToMusic">
                    <div class="nav-icon">🎵</div>
                    <div class="nav-label">音乐</div>
                </div>
                <div class="nav-item" @click="goToGame">
                    <div class="nav-icon">🎮</div>
                    <div class="nav-label">游戏</div>
                </div>
                <div class="nav-item" @click="goToLeaderboard">
                    <div class="nav-icon">🏆</div>
                    <div class="nav-label">排行</div>
                </div>
                <div class="nav-item" @click="goToSettings">
                    <div class="nav-icon">⚙️</div>
                    <div class="nav-label">设置</div>
                </div>
            </nav>
        </div>
    `,
    computed: {
        activeSkills() {
            return this.skills.filter(s => s.skill_type === 1);
        },
        passiveSkills() {
            return this.skills.filter(s => s.skill_type === 2);
        },
        currentEffects() {
            const effects = {
                score_bonus: 0,
                speed_bonus: 0,
                jump_bonus: 0,
                magnet_range: 0,
                shield_count: 0,
                revive_count: 0
            };

            Object.keys(this.mySkills).forEach(skillId => {
                const level = this.mySkills[skillId];
                const skill = this.skills.find(s => s.id == skillId);
                if (skill && level > 0) {
                    const value = skill.effect_value * level;
                    switch (skill.effect_type) {
                        case 'score': effects.score_bonus += value; break;
                        case 'speed': effects.speed_bonus += value; break;
                        case 'jump': effects.jump_bonus += value; break;
                        case 'magnet': effects.magnet_range += value; break;
                        case 'shield': effects.shield_count += value; break;
                        case 'revive': effects.revive_count += value; break;
                    }
                }
            });

            return effects;
        }
    },
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            this.loading = true;

            const [treeRes, myRes, effectsRes] = await Promise.all([
                YpAPI.skill.tree(),
                YpAPI.skill.my(),
                YpAPI.skill.effects()
            ]);

            this.loading = false;

            if (treeRes.code === 0 && treeRes.data) {
                this.skills = treeRes.data.items || treeRes.data || [];
            }

            if (myRes.code === 0 && myRes.data) {
                const skills = myRes.data.skills || myRes.data || [];
                this.mySkills = {};
                skills.forEach(s => {
                    this.mySkills[s.skill_id] = s.level;
                });
            }
        },
        getSkillLevel(skillId) {
            return this.mySkills[skillId] || 0;
        },
        getUpgradePrice() {
            if (!this.selectedSkill) return 0;
            const level = this.getSkillLevel(this.selectedSkill.id);
            return this.selectedSkill.base_price * Math.pow(2, level);
        },
        onSkillClick(skill) {
            this.selectedSkill = skill;
            this.showUpgradeModal = true;
        },
        async upgradeSkill() {
            if (!this.selectedSkill) return;

            const response = await YpAPI.skill.upgrade({ skill_id: this.selectedSkill.id });
            if (response.code === 0) {
                this.user = response.data.user;
                Auth.setUser(this.user);
                this.mySkills[this.selectedSkill.id] = (this.mySkills[this.selectedSkill.id] || 0) + 1;
                Utils.showToast(`升级成功！`, 'success');
                this.loadData();
            } else {
                Utils.showToast(response.msg || '升级失败', 'error');
            }
        },
        goToHome() {
            Router.navigate('home');
        },
        goToMusic() {
            Router.navigate('music');
        },
        goToGame() {
            Router.navigate('game');
        },
        goToLeaderboard() {
            Router.navigate('leaderboard');
        },
        goToSettings() {
            Router.navigate('settings');
        }
    },
    mounted() {
        this.loadData();
    }
};
