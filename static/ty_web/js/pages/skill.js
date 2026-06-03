const SkillPage = {
    name: 'SkillPage',
    template: `
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">✨ 技能系统</h1>
                <button class="btn btn-secondary" @click="goBack">返回</button>
            </div>

            <div class="card mb-4">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold">已装备技能 ({{ equippedSkills.length }}/4)</h3>
                    <div class="flex gap-3">
                        <span class="stat-item gold">💰 {{ userResources.gold || 0 }}</span>
                        <span class="stat-item">⭐ {{ userResources.exp || 0 }}</span>
                    </div>
                </div>
                <div class="grid grid-4">
                    <div 
                        v-for="n in 4" 
                        :key="n" 
                        class="item-card bg-white"
                        :class="{ equipped: equippedSkills[n-1] }"
                        style="text-align: center; min-height: 100px;"
                    >
                        <div v-if="equippedSkills[n-1]" @click="showUnequipConfirm(equippedSkills[n-1])">
                            <div style="font-size: 32px; margin-bottom: 8px;">{{ getCategoryIcon(equippedSkills[n-1].category) }}</div>
                            <div class="font-bold">{{ equippedSkills[n-1].name }}</div>
                            <div class="text-sm text-gray-500">Lv.{{ equippedSkills[n-1].level }}</div>
                            <button class="btn btn-secondary mt-2" style="padding: 4px 12px; font-size: 12px;" @click.stop="unequipSkill(equippedSkills[n-1].id || equippedSkills[n-1].skill_id)">卸下</button>
                        </div>
                        <div v-else style="padding: 20px 0; color: #9ca3af;">
                            <div style="font-size: 32px;">➕</div>
                            <div class="text-sm">空槽位</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="nav-tabs mb-4">
                <div 
                    v-for="cat in categories" 
                    :key="cat.code"
                    class="nav-tab"
                    :class="{ active: currentCategory === cat.code }"
                    @click="switchCategory(cat.code)"
                >
                    {{ cat.icon }} {{ cat.name }}
                </div>
            </div>

            <div v-if="!loading" class="grid grid-2 grid-3">
                <div 
                    v-for="skill in filteredSkills" 
                    :key="skill.id"
                    class="skill-card"
                    :class="[skill.category, { equipped: isEquipped(skill.id) }]"
                >
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                            <div class="skill-icon">{{ getCategoryIcon(skill.category) }}</div>
                            <div>
                                <div class="font-bold">{{ skill.name }}</div>
                                <span class="rarity-badge" :class="skill.category === 'attack' ? 'rare' : skill.category === 'defense' ? 'common' : skill.category === 'support' ? 'epic' : 'legendary'" style="font-size: 10px; padding: 2px 8px;">
                                    {{ getCategoryName(skill.category) }}
                                </span>
                            </div>
                        </div>
                        <div v-if="skill.unlocked" class="text-sm font-bold" style="color: var(--primary-color);">
                            Lv.{{ skill.level }}/{{ skill.max_level }}
                        </div>
                    </div>

                    <p class="text-sm text-gray-500 mb-3">{{ skill.description }}</p>

                    <div class="text-sm mb-3" style="background: #f9fafb; padding: 8px 12px; border-radius: 8px;">
                        <span class="font-bold">效果:</span>
                        <span style="color: var(--primary-color);">{{ formatEffect(skill.base_effect, skill.unlocked ? (skill.level || 1) : 1, skill.effect_per_level) }}</span>
                    </div>

                    <div v-if="skill.unlocked && skill.level < skill.max_level" class="text-sm mb-3" style="background: #f0fdf4; padding: 8px 12px; border-radius: 8px;">
                        <span class="font-bold">下一级:</span>
                        <span style="color: var(--success-color);">{{ formatEffect(skill.base_effect, (skill.level || 1) + 1, skill.effect_per_level) }}</span>
                    </div>

                    <div class="flex gap-2">
                        <template v-if="!skill.unlocked">
                            <div class="text-sm text-gray-500 flex-1">
                                解锁: 💰{{ skill.unlock_cost_gold }} ⭐{{ skill.unlock_cost_exp }}
                            </div>
                            <button 
                                class="btn btn-primary"
                                style="padding: 6px 16px; font-size: 14px;"
                                :disabled="!canUnlock(skill)"
                                @click="unlockSkill(skill.id)"
                            >
                                解锁
                            </button>
                        </template>

                        <template v-else>
                            <button 
                                v-if="!isEquipped(skill.id)"
                                class="btn btn-success"
                                style="padding: 6px 16px; font-size: 14px;"
                                :disabled="equippedSkills.length >= 4"
                                @click="equipSkill(skill.id)"
                            >
                                装备
                            </button>
                            <button 
                                v-if="skill.level < skill.max_level"
                                class="btn btn-warning"
                                style="padding: 6px 16px; font-size: 14px;"
                                :disabled="!canUpgrade(skill)"
                                @click="upgradeSkill(skill.id)"
                            >
                                升级 (💰{{ skill.upgrade_cost_gold }} ⭐{{ skill.upgrade_cost_exp }})
                            </button>
                        </template>
                    </div>
                </div>
            </div>

            <div v-if="filteredSkills.length === 0 && !loading" class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">暂无该分类的技能</div>
            </div>

            <div v-if="loading" class="loading">
                <div class="loading-spinner"></div>
            </div>

            <div v-if="showConfirm" class="modal-overlay" @click.self="closeConfirm">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="modal-title">确认卸下技能</h3>
                        <button class="modal-close" @click="closeConfirm">×</button>
                    </div>
                    <p class="mb-4">确定要卸下 <strong>{{ confirmSkill?.name }}</strong> 吗？</p>
                    <div class="flex gap-3">
                        <button class="btn btn-secondary flex-1" @click="closeConfirm">取消</button>
                        <button class="btn btn-danger flex-1" @click="confirmUnequip">确认卸下</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            categories: [
                { code: 'all', name: '全部', icon: '📚' },
                { code: 'attack', name: '攻击', icon: '⚔️' },
                { code: 'defense', name: '防御', icon: '🛡️' },
                { code: 'support', name: '辅助', icon: '💚' },
                { code: 'passive', name: '被动', icon: '✨' }
            ],
            currentCategory: 'all',
            allSkills: [],
            mySkills: [],
            equippedSkills: [],
            userResources: {
                gold: 0,
                exp: 0
            },
            loading: false,
            showConfirm: false,
            confirmSkill: null
        };
    },
    computed: {
        filteredSkills() {
            if (this.currentCategory === 'all') {
                return this.allSkills;
            }
            return this.allSkills.filter(skill => skill.category === this.currentCategory);
        }
    },
    mounted() {
        this.loadData();
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                await Promise.all([
                    this.loadSkills(),
                    this.loadMySkills(),
                    this.loadEquippedSkills(),
                    this.loadUserResources()
                ]);
            } catch (error) {
                console.error('加载技能数据失败:', error);
            } finally {
                this.loading = false;
            }
        },

        async loadSkills() {
            try {
                const result = await API.skill.getList({ category: this.currentCategory });
                if (result.code === 0) {
                    this.allSkills = result.data.items || [];
                }
            } catch (error) {
                console.error('加载技能列表失败:', error);
            }
        },

        async loadMySkills() {
            try {
                const result = await API.skill.getMySkills();
                if (result.code === 0) {
                    this.mySkills = result.data.items || [];
                    this.mergeSkillData();
                }
            } catch (error) {
                console.error('加载我的技能失败:', error);
            }
        },

        async loadEquippedSkills() {
            try {
                const result = await API.skill.getEquipped();
                if (result.code === 0) {
                    this.equippedSkills = result.data.items || [];
                    this.mergeSkillData();
                }
            } catch (error) {
                console.error('加载已装备技能失败:', error);
            }
        },

        async loadUserResources() {
            try {
                const result = await API.resource.getMyResources({ page_size: 100 });
                if (result.code === 0 && result.data) {
                    const items = result.data.items || [];
                    const resMap = {};
                    items.forEach(item => {
                        resMap[item.resource_type] = (resMap[item.resource_type] || 0) + (item.quantity || 0);
                    });
                    const user = AuthService.getUser();
                    this.userResources = {
                        gold: user?.gold || 0,
                        exp: user?.exp || 0,
                        ...resMap
                    };
                }
            } catch (error) {
                console.error('加载用户资源失败:', error);
                const user = AuthService.getUser();
                this.userResources = { gold: user?.gold || 0, exp: user?.exp || 0 };
            }
        },

        mergeSkillData() {
            const mySkillMap = {};
            this.mySkills.forEach(ms => {
                mySkillMap[ms.skill_id] = ms;
            });

            const equippedIds = new Set(this.equippedSkills.map(es => es.skill_id || es.id));

            this.allSkills = this.allSkills.map(skill => {
                const mySkill = mySkillMap[skill.id];
                return {
                    ...skill,
                    unlocked: !!mySkill,
                    level: mySkill?.level || 0,
                    equipped: equippedIds.has(skill.id),
                    unlock_cost_gold: skill.gold_cost || 0,
                    unlock_cost_exp: skill.exp_cost || 0,
                    upgrade_cost_gold: mySkill ? Math.floor((skill.gold_cost || 100) * (mySkill.level || 1) * 1.5) : (skill.gold_cost || 0),
                    upgrade_cost_exp: mySkill ? Math.floor((skill.exp_cost || 50) * (mySkill.level || 1) * 1.5) : (skill.exp_cost || 0)
                };
            });
        },

        switchCategory(category) {
            this.currentCategory = category;
            this.loadSkills();
        },

        getCategoryName(code) {
            const cat = this.categories.find(c => c.code === code);
            return cat ? cat.name : code;
        },

        getCategoryIcon(code) {
            const icons = {
                attack: '⚔️', defense: '🛡️', support: '💚', special: '🌟'
            };
            return icons[code] || '📋';
        },

        formatEffect(baseEffectStr, level = 1, effectPerLevelStr = null) {
            const nameMap = {
                attack: '攻击', defense: '防御', speed: '速度',
                damage: '伤害', burn: '灼烧', damage_reduction: '减伤',
                freeze_chance: '冰冻率', paralyze_chance: '麻痹率',
                lifesteal: '吸血', crit_chance: '暴击率', crit_damage: '暴击伤害',
                heal: '治疗', true_damage: '真实伤害'
            };

            let base = {};
            try {
                base = typeof baseEffectStr === 'string' ? JSON.parse(baseEffectStr) : (baseEffectStr || {});
            } catch (e) {
                return String(baseEffectStr || '');
            }

            let perLevel = {};
            if (effectPerLevelStr) {
                try {
                    perLevel = typeof effectPerLevelStr === 'string' ? JSON.parse(effectPerLevelStr) : (effectPerLevelStr || {});
                } catch (e) {
                    perLevel = {};
                }
            }

            const parts = [];
            for (const key in base) {
                const name = nameMap[key] || key;
                const val = base[key] + (perLevel[key] || 0) * (level - 1);
                if (key.includes('chance')) {
                    parts.push(`${name}+${val}%`);
                } else {
                    parts.push(`${name}+${val}`);
                }
            }
            return parts.length > 0 ? parts.join(', ') : '-';
        },

        isEquipped(skillId) {
            return this.equippedSkills.some(s => (s.skill_id || s.id) === skillId);
        },

        canUnlock(skill) {
            return this.userResources.gold >= skill.unlock_cost_gold &&
                   this.userResources.exp >= skill.unlock_cost_exp;
        },

        canUpgrade(skill) {
            return this.userResources.gold >= skill.upgrade_cost_gold &&
                   this.userResources.exp >= skill.upgrade_cost_exp;
        },

        async unlockSkill(skillId) {
            try {
                const result = await API.skill.unlock(skillId);
                if (result.code === 0) {
                    Toast.success('技能解锁成功！');
                    this.loadData();
                }
            } catch (error) {
                Toast.error('解锁失败: ' + (error.message || '未知错误'));
            }
        },

        async upgradeSkill(skillId) {
            try {
                const result = await API.skill.upgrade(skillId);
                if (result.code === 0) {
                    Toast.success('技能升级成功！');
                    this.loadData();
                }
            } catch (error) {
                Toast.error('升级失败: ' + (error.message || '未知错误'));
            }
        },

        async equipSkill(skillId) {
            if (this.equippedSkills.length >= 4) {
                Toast.warning('最多只能装备4个技能');
                return;
            }
            try {
                const result = await API.skill.equip(skillId);
                if (result.code === 0) {
                    Toast.success('技能装备成功！');
                    this.loadData();
                }
            } catch (error) {
                Toast.error('装备失败: ' + (error.message || '未知错误'));
            }
        },

        showUnequipConfirm(skill) {
            this.confirmSkill = skill;
            this.showConfirm = true;
        },

        closeConfirm() {
            this.showConfirm = false;
            this.confirmSkill = null;
        },

        async confirmUnequip() {
            if (this.confirmSkill) {
                await this.unequipSkill(this.confirmSkill.id || this.confirmSkill.skill_id);
            }
            this.closeConfirm();
        },

        async unequipSkill(skillId) {
            try {
                const result = await API.skill.unequip(skillId);
                if (result.code === 0) {
                    Toast.success('技能已卸下');
                    this.loadData();
                }
            } catch (error) {
                Toast.error('卸下失败: ' + (error.message || '未知错误'));
            }
        },

        goBack() {
            Router.back();
        }
    }
};
