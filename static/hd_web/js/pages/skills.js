(function() {
const { ref, computed, onMounted } = Vue;

const SkillsPage = {
    name: 'SkillsPage',
    setup() {
        const loading = ref(true);
        const activeTab = ref('fire');
        const selectedSkill = ref(null);

        const user = computed(() => GameStore.state.user);
        const exp = computed(() => GameStore.getters.exp.value);
        const allSkills = computed(() => GameStore.getAllSkills());
        const learnedSkills = computed(() => GameStore.state.skills);
        const activeSkills = computed(() => GameStore.state.activeSkills);
        const skillTypes = computed(() => GameStore.getSkillTypes());

        const skillsByType = computed(() => {
            const type = activeTab.value;
            return allSkills.value.filter(skill => skill.type === type);
        });

        const isSkillLearned = (skillId) => {
            return learnedSkills.value.some(s => s.id === skillId);
        };

        const getLearnedSkill = (skillId) => {
            return learnedSkills.value.find(s => s.id === skillId);
        };

        const isSkillActive = (skillId) => {
            return activeSkills.value.includes(skillId);
        };

        const getSkillUpgradeCost = (skill) => {
            const learned = getLearnedSkill(skill.id);
            if (!learned) return skill.expCost;
            return skill.expCost * (learned.level + 1);
        };

        const handleLearnSkill = (skillId) => {
            GameStore.learnSkill(skillId);
        };

        const handleUpgradeSkill = (skillId) => {
            GameStore.upgradeSkill(skillId);
        };

        const handleToggleActive = (skillId) => {
            GameStore.toggleSkillActive(skillId);
        };

        const showSkillDetail = (skill) => {
            selectedSkill.value = skill;
        };

        const closeSkillDetail = () => {
            selectedSkill.value = null;
        };

        const getTypeColor = (typeCode) => {
            const type = skillTypes.value.find(t => t.code === typeCode);
            return type ? type.color : '#666';
        };

        onMounted(async () => {
            try {
                await GameStore.loadUserSkills();
            } catch (error) {
                console.error('加载技能数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            activeTab,
            selectedSkill,
            user,
            exp,
            allSkills,
            learnedSkills,
            activeSkills,
            skillTypes,
            skillsByType,
            isSkillLearned,
            getLearnedSkill,
            isSkillActive,
            getSkillUpgradeCost,
            handleLearnSkill,
            handleUpgradeSkill,
            handleToggleActive,
            showSkillDetail,
            closeSkillDetail,
            getTypeColor
        };
    },
    template: `
        <div class="skills-page">
            <div class="page-header">
                <h2 class="page-title">⚡ 忍术训练</h2>
                <p class="page-subtitle">学习强大的忍术，提升你的战斗力</p>
            </div>

            <div class="stats-card">
                <div class="stat-item">
                    <span class="stat-icon">📈</span>
                    <div class="stat-info">
                        <div class="stat-label">经验值</div>
                        <div class="stat-value">{{ exp }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">⚡</span>
                    <div class="stat-info">
                        <div class="stat-label">已学习</div>
                        <div class="stat-value">{{ learnedSkills.length }}/{{ allSkills.length }}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🎯</span>
                    <div class="stat-info">
                        <div class="stat-label">已激活</div>
                        <div class="stat-value">{{ activeSkills.length }}/4</div>
                    </div>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🏆</span>
                    <div class="stat-info">
                        <div class="stat-label">忍术类型</div>
                        <div class="stat-value">{{ skillTypes.length }}</div>
                    </div>
                </div>
            </div>

            <div class="skill-types-tabs">
                <div
                    v-for="type in skillTypes"
                    :key="type.code"
                    class="tab-item"
                    :class="{ active: activeTab === type.code }"
                    @click="activeTab = type.code"
                >
                    <span class="tab-icon">{{ type.icon }}</span>
                    <span class="tab-name">{{ type.name }}</span>
                </div>
            </div>

            <div class="skills-grid" v-if="!loading">
                <div
                    v-for="skill in skillsByType"
                    :key="skill.id"
                    class="skill-card"
                    :class="{ learned: isSkillLearned(skill.id), active: isSkillActive(skill.id) }"
                    @click="showSkillDetail(skill)"
                >
                    <div class="skill-header">
                        <div class="skill-icon" :style="{ backgroundColor: getTypeColor(skill.type) }">
                            {{ skill.icon }}
                        </div>
                        <div class="skill-info">
                            <div class="skill-name">{{ skill.name }}</div>
                            <div class="skill-level" v-if="isSkillLearned(skill.id)">
                            Lv.{{ getLearnedSkill(skill.id).level }}/{{ skill.maxLevel }}
                            <span v-if="isSkillActive(skill.id)" class="active-badge">已激活</span>
                        </div>
                    </div>
                    <div class="skill-desc">{{ skill.description }}</div>
                    <div class="skill-stats">
                        <span class="stat">💥 伤害: {{ isSkillLearned(skill.id) ? getLearnedSkill(skill.id).damage : skill.damage }}</span>
                        <span class="stat">💫 查克拉: {{ skill.chakra }}</span>
                    </div>
                    <div class="skill-footer">
                        <span v-if="!isSkillLearned(skill.id)" class="cost">
                            📈 {{ skill.expCost }} 经验
                        </span>
                        <span v-else class="cost">
                            📈 {{ getSkillUpgradeCost(skill) }} 经验升级
                        </span>
                    </div>
                </div>
            </div>

            <div class="loading-state" v-else>
                <p>加载中...</p>
            </div>

            <div class="empty-state" v-if="!loading && skillsByType.length === 0">
                <p>该分类暂无忍术</p>
            </div>

            <div class="skill-detail-modal" v-if="selectedSkill" @click.self="closeSkillDetail">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="skill-icon-large" :style="{ backgroundColor: getTypeColor(selectedSkill.type) }">
                            {{ selectedSkill.icon }}
                        </div>
                        <h3 class="modal-title">{{ selectedSkill.name }}</h3>
                        <button class="close-btn" @click="closeSkillDetail">✕</button>
                    </div>

                    <div class="modal-body">
                        <p class="skill-description">{{ selectedSkill.description }}</p>

                        <div class="detail-stats">
                            <div class="detail-stat">
                                <span class="detail-label">等级</span>
                                <span class="detail-value">
                                    {{ isSkillLearned(selectedSkill.id) ? 'Lv.' + getLearnedSkill(selectedSkill.id).level : '未学习' }}/{{ selectedSkill.maxLevel }}
                                </span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">伤害</span>
                                <span class="detail-value">
                                    {{ isSkillLearned(selectedSkill.id) ? getLearnedSkill(selectedSkill.id).damage : selectedSkill.damage }}
                                </span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">查克拉消耗</span>
                                <span class="detail-value">{{ selectedSkill.chakra }}</span>
                            </div>
                            <div class="detail-stat">
                                <span class="detail-label">冷却时间</span>
                                <span class="detail-value">{{ selectedSkill.cooldown }} 回合</span>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button
                                v-if="!isSkillLearned(selectedSkill.id)"
                                class="btn btn-primary"
                                @click="handleLearnSkill(selectedSkill.id)"
                                :disabled="exp < selectedSkill.expCost"
                            >
                                学习 ({{ selectedSkill.expCost }} 经验)
                            </button>
                            <template v-else>
                                <button
                                    class="btn btn-success"
                                    @click="handleUpgradeSkill(selectedSkill.id)"
                                    :disabled="getLearnedSkill(selectedSkill.id).level >= selectedSkill.maxLevel || exp < getSkillUpgradeCost(selectedSkill)"
                                >
                                    升级 ({{ getSkillUpgradeCost(selectedSkill) }} 经验)
                                </button>
                                <button
                                    class="btn"
                                    :class="isSkillActive(selectedSkill.id) ? 'btn-danger' : 'btn-secondary'"
                                    @click="handleToggleActive(selectedSkill.id)"
                                >
                                    {{ isSkillActive(selectedSkill.id) ? '取消激活' : '激活技能' }}
                                </button>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};

const SkillsPageWrapper = {
    render() {
        return Vue.h(MainLayout, {
            currentPage: 'skills',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(SkillsPage)
        });
    }
};

window.SkillsPage = SkillsPage;
window.SkillsPageWrapper = SkillsPageWrapper;
})();
