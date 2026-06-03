(function() {
const { ref, reactive, computed, onMounted } = Vue;

const ProfilePage = {
    name: 'ProfilePage',
    setup() {
        const loading = ref(true);
        const activeTab = ref('info');
        const isEditing = ref(false);
        const showPasswordForm = ref(false);

        const profileForm = reactive({
            nickname: '',
            avatar: ''
        });

        const passwordForm = reactive({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });

        const user = computed(() => GameStore.state.user);
        const level = computed(() => GameStore.getters.level.value);
        const exp = computed(() => GameStore.getters.exp.value);
        const expToNextLevel = computed(() => GameStore.getters.expToNextLevel.value);
        const expProgress = computed(() => GameStore.getters.expProgress.value);
        const coins = computed(() => GameStore.getters.coins.value);
        const chakra = computed(() => GameStore.getters.chakra.value);
        const attack = computed(() => GameStore.getters.attack.value);
        const defense = computed(() => GameStore.getters.defense.value);
        const hp = computed(() => GameStore.getters.maxHp.value);
        const learnedSkillCount = computed(() => GameStore.getters.learnedSkillCount.value);
        const totalSkillCount = computed(() => GameStore.getters.totalSkillCount.value);
        const completedLevels = computed(() => GameStore.getters.completedLevels.value);
        const totalLevels = computed(() => GameStore.getters.totalLevels.value);
        const recentBattles = computed(() => GameStore.getters.recentBattles.value);

        const equipment = computed(() => GameStore.state.equipment || []);
        const battleCount = computed(() => recentBattles.value.length);

        const attributes = computed(() => {
            let baseAttack = attack.value;
            let baseDefense = defense.value;
            let baseHp = hp.value;
            let baseChakra = chakra.value;

            if (equipment.value) {
                equipment.value.forEach(eq => {
                    baseAttack += eq.attack || 0;
                    baseDefense += eq.defense || 0;
                    baseHp += eq.hp || 0;
                    baseChakra += eq.chakra || 0;
                });
            }

            const levelBonus = level.value * 2;
            baseAttack += levelBonus;
            baseDefense += levelBonus;
            baseHp += level.value * 10;
            baseChakra += level.value * 5;

            return {
                attack: baseAttack,
                defense: baseDefense,
                hp: baseHp,
                chakra: baseChakra
            };
        });

        const stats = computed(() => {
            return {
                levelsCompleted: completedLevels.value,
                skillsCount: learnedSkillCount.value,
                equipmentCount: equipment.value.length,
                battleCount: battleCount.value
            };
        });

        const currentUser = computed(() => {
            return user.value || { nickname: '忍者', username: 'ninja', avatar: '' };
        });

        const startEdit = () => {
            profileForm.nickname = currentUser.value.nickname || '';
            profileForm.avatar = currentUser.value.avatar || '';
            isEditing.value = true;
        };

        const cancelEdit = () => {
            isEditing.value = false;
            profileForm.nickname = '';
            profileForm.avatar = '';
        };

        const saveProfile = async () => {
            if (!profileForm.nickname.trim()) {
                Toast.error('昵称不能为空！');
                return;
            }

            try {
                const result = await AuthService.updateProfile({
                    nickname: profileForm.nickname.trim(),
                    avatar: profileForm.avatar
                });

                if (result.code === 0) {
                    Toast.success('资料修改成功！');
                    isEditing.value = false;
                    await GameStore.loadAllData();
                } else {
                    Toast.error(result.message || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请重试');
            }
        };

        const savePassword = async () => {
            if (!passwordForm.oldPassword) {
                Toast.error('请输入旧密码！');
                return;
            }
            if (!passwordForm.newPassword) {
                Toast.error('请输入新密码！');
                return;
            }
            if (passwordForm.newPassword.length < 6) {
                Toast.error('新密码长度不能少于6位！');
                return;
            }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                Toast.error('两次输入的密码不一致！');
                return;
            }
            if (passwordForm.oldPassword === passwordForm.newPassword) {
                Toast.error('新密码不能与旧密码相同！');
                return;
            }

            try {
                const result = await AuthService.changePassword(
                    passwordForm.oldPassword,
                    passwordForm.newPassword
                );

                if (result.code === 0) {
                    Toast.success('密码修改成功！');
                    showPasswordForm.value = false;
                    passwordForm.oldPassword = '';
                    passwordForm.newPassword = '';
                    passwordForm.confirmPassword = '';
                } else {
                    Toast.error(result.message || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请重试');
            }
        };

        const handleLogout = async () => {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                GameStore.reset();
                Router.navigate('login');
            }
        };

        const getAvatarText = () => {
            if (currentUser.value.avatar) {
                return currentUser.value.avatar;
            }
            return (currentUser.value.nickname || currentUser.value.username || '忍').charAt(0);
        };

        const formatBattleTime = (time) => {
            if (!time) return '未知';
            const date = new Date(time);
            return date.toLocaleDateString('zh-CN');
        };

        const getBattleResultClass = (result) => {
            return result === 'win' ? 'result-win' : 'result-lose';
        };

        const getBattleResultText = (result) => {
            return result === 'win' ? '胜利' : '失败';
        };

        onMounted(async () => {
            try {
                await GameStore.loadAllData();
            } catch (error) {
                console.error('加载个人中心数据失败:', error);
            } finally {
                loading.value = false;
            }
        });

        return {
            loading,
            activeTab,
            isEditing,
            showPasswordForm,
            profileForm,
            passwordForm,
            user,
            level,
            exp,
            expToNextLevel,
            expProgress,
            coins,
            chakra,
            attack,
            defense,
            hp,
            learnedSkillCount,
            totalSkillCount,
            completedLevels,
            totalLevels,
            recentBattles,
            equipment,
            battleCount,
            attributes,
            stats,
            currentUser,
            startEdit,
            cancelEdit,
            saveProfile,
            savePassword,
            handleLogout,
            getAvatarText,
            formatBattleTime,
            getBattleResultClass,
            getBattleResultText
        };
    },
    template: `
        <div class="profile-page">
            <div class="profile-header" v-if="user">
                <div class="profile-avatar-large">
                    {{ getAvatarText() }}
                </div>
                <div class="profile-info">
                    <div class="profile-name">
                        {{ currentUser.nickname || currentUser.username }}
                        <span class="profile-level">Lv.{{ level }}</span>
                    </div>
                    <div class="profile-username">@{{ currentUser.username }}</div>
                </div>
                <button class="btn btn-primary btn-sm" @click="startEdit" v-if="!isEditing">
                    编辑资料
                </button>
            </div>

            <div class="exp-card">
                <div class="exp-header">
                    <span class="exp-label">经验值</span>
                    <span class="exp-value">{{ exp }} / {{ expToNextLevel }}</span>
                </div>
                <div class="exp-bar">
                    <div class="exp-fill" :style="{ width: expProgress + '%' }"></div>
                </div>
                <div class="exp-text">
                    距离 Lv.{{ level + 1 }} 还需 {{ expToNextLevel - exp }} 经验
                </div>
            </div>

            <div class="profile-tabs">
                <div 
                    class="tab-item"
                    :class="{ active: activeTab === 'info' }"
                    @click="activeTab = 'info'"
                >
                    基本信息
                </div>
                <div 
                    class="tab-item"
                    :class="{ active: activeTab === 'attributes' }"
                    @click="activeTab = 'attributes'"
                >
                    属性面板
                </div>
                <div 
                    class="tab-item"
                    :class="{ active: activeTab === 'stats' }"
                    @click="activeTab = 'stats'"
                >
                    统计数据
                </div>
                <div 
                    class="tab-item"
                    :class="{ active: activeTab === 'security' }"
                    @click="activeTab = 'security'"
                >
                    账号安全
                </div>
            </div>

            <div v-if="activeTab === 'info'" class="tab-content">
                <div v-if="!isEditing" class="info-section">
                    <div class="info-item">
                        <span class="info-label">昵称</span>
                        <span class="info-value">{{ currentUser.nickname || '-' }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">用户名</span>
                        <span class="info-value">{{ currentUser.username }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">等级</span>
                        <span class="info-value">Lv.{{ level }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">金币</span>
                        <span class="info-value">💰 {{ coins }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">查克拉</span>
                        <span class="info-value">💫 {{ chakra }}</span>
                    </div>
                </div>

                <div v-if="isEditing" class="edit-form">
                    <div class="form-group">
                        <label class="form-label">昵称 <span class="required">*</span></label>
                        <input 
                            type="text" 
                            class="form-control"
                            v-model="profileForm.nickname"
                            placeholder="请输入昵称"
                            maxlength="20"
                        >
                    </div>
                    <div class="form-group">
                        <label class="form-label">头像文字</label>
                        <input 
                            type="text" 
                            class="form-control"
                            v-model="profileForm.avatar"
                            placeholder="留空使用昵称首字"
                            maxlength="2"
                        >
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" @click="cancelEdit">取消</button>
                        <button class="btn btn-primary" @click="saveProfile">保存</button>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'attributes'" class="tab-content">
                <div class="attributes-grid">
                    <div class="attribute-card">
                        <div class="attr-icon" style="background-color: rgba(255, 107, 53, 0.1);">⚔️</div>
                        <div class="attr-info">
                            <div class="attr-name">攻击力</div>
                            <div class="attr-value">{{ attributes.attack }}</div>
                        </div>
                    </div>
                    <div class="attribute-card">
                        <div class="attr-icon" style="background-color: rgba(78, 205, 196, 0.1);">🛡️</div>
                        <div class="attr-info">
                            <div class="attr-name">防御力</div>
                            <div class="attr-value">{{ attributes.defense }}</div>
                        </div>
                    </div>
                    <div class="attribute-card">
                        <div class="attr-icon" style="background-color: rgba(40, 167, 69, 0.1);">❤️</div>
                        <div class="attr-info">
                            <div class="attr-name">生命值</div>
                            <div class="attr-value">{{ attributes.hp }}</div>
                        </div>
                    </div>
                    <div class="attribute-card">
                        <div class="attr-icon" style="background-color: rgba(102, 126, 234, 0.1);">💫</div>
                        <div class="attr-info">
                            <div class="attr-name">查克拉</div>
                            <div class="attr-value">{{ attributes.chakra }}</div>
                        </div>
                    </div>
                </div>

                <div class="currency-section">
                    <div class="currency-card">
                        <span class="currency-icon">💰</span>
                        <div class="currency-info">
                            <div class="currency-name">金币</div>
                            <div class="currency-value">{{ coins }}</div>
                        </div>
                    </div>
                    <div class="currency-card">
                        <span class="currency-icon">⭐</span>
                        <div class="currency-info">
                            <div class="currency-name">经验</div>
                            <div class="currency-value">{{ exp }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'stats'" class="tab-content">
                <div class="stats-grid">
                    <div class="stat-card-large">
                        <div class="stat-icon-large">🎮</div>
                        <div class="stat-number">{{ stats.levelsCompleted }}</div>
                        <div class="stat-label">关卡完成</div>
                    </div>
                    <div class="stat-card-large">
                        <div class="stat-icon-large">🔥</div>
                        <div class="stat-number">{{ stats.skillsCount }}</div>
                        <div class="stat-label">已学技能</div>
                    </div>
                    <div class="stat-card-large">
                        <div class="stat-icon-large">⚔️</div>
                        <div class="stat-number">{{ stats.equipmentCount }}</div>
                        <div class="stat-label">装备数量</div>
                    </div>
                    <div class="stat-card-large">
                        <div class="stat-icon-large">🏆</div>
                        <div class="stat-number">{{ stats.battleCount }}</div>
                        <div class="stat-label">对战场次</div>
                    </div>
                </div>

                <div class="achievement-section">
                    <div class="section-title">成就进度</div>
                    <div class="achievement-list">
                        <div class="achievement-item">
                            <div class="achievement-icon">🎯</div>
                            <div class="achievement-info">
                                <div class="achievement-name">初出茅庐</div>
                                <div class="achievement-desc">完成第一个关卡</div>
                                <div class="achievement-progress-bar">
                                    <div 
                                        class="achievement-progress-fill" 
                                        :style="{ width: Math.min(100, stats.levelsCompleted * 100) + '%' }"
                                    ></div>
                                </div>
                            </div>
                            <div class="achievement-status" :class="{ done: stats.levelsCompleted >= 1 }">
                                {{ stats.levelsCompleted >= 1 ? '✓' : stats.levelsCompleted + '/1' }}
                            </div>
                        </div>
                        <div class="achievement-item">
                            <div class="achievement-icon">📚</div>
                            <div class="achievement-info">
                                <div class="achievement-name">博学多才</div>
                                <div class="achievement-desc">学习5个技能</div>
                                <div class="achievement-progress-bar">
                                    <div 
                                        class="achievement-progress-fill" 
                                        :style="{ width: Math.min(100, stats.skillsCount * 20) + '%' }"
                                    ></div>
                                </div>
                            </div>
                            <div class="achievement-status" :class="{ done: stats.skillsCount >= 5 }">
                                {{ stats.skillsCount >= 5 ? '✓' : stats.skillsCount + '/5' }}
                            </div>
                        </div>
                        <div class="achievement-item">
                            <div class="achievement-icon">⚔️</div>
                            <div class="achievement-info">
                                <div class="achievement-name">装备收藏家</div>
                                <div class="achievement-desc">拥有5件装备</div>
                                <div class="achievement-progress-bar">
                                    <div 
                                        class="achievement-progress-fill" 
                                        :style="{ width: Math.min(100, stats.equipmentCount * 20) + '%' }"
                                    ></div>
                                </div>
                            </div>
                            <div class="achievement-status" :class="{ done: stats.equipmentCount >= 5 }">
                                {{ stats.equipmentCount >= 5 ? '✓' : stats.equipmentCount + '/5' }}
                            </div>
                        </div>
                        <div class="achievement-item">
                            <div class="achievement-icon">🏆</div>
                            <div class="achievement-info">
                                <div class="achievement-name">百战百胜</div>
                                <div class="achievement-desc">参加100场对战</div>
                                <div class="achievement-progress-bar">
                                    <div 
                                        class="achievement-progress-fill" 
                                        :style="{ width: Math.min(100, stats.battleCount) + '%' }"
                                    ></div>
                                </div>
                            </div>
                            <div class="achievement-status" :class="{ done: stats.battleCount >= 100 }">
                                {{ stats.battleCount >= 100 ? '✓' : stats.battleCount + '/100' }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="recent-battles-section" v-if="recentBattles.length > 0">
                    <div class="section-title">最近对战</div>
                    <div class="battle-list">
                        <div 
                            v-for="battle in recentBattles" 
                            :key="battle.id"
                            class="battle-item"
                        >
                            <div class="battle-opponent">
                                <div class="opponent-avatar">{{ battle.opponent_name?.charAt(0) || '?' }}</div>
                                <div class="opponent-info">
                                    <div class="opponent-name">{{ battle.opponent_name || '神秘忍者' }}</div>
                                    <div class="battle-time">{{ formatBattleTime(battle.created_at) }}</div>
                                </div>
                            </div>
                            <div class="battle-result" :class="getBattleResultClass(battle.result)">
                                {{ getBattleResultText(battle.result) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="activeTab === 'security'" class="tab-content">
                <div class="security-section">
                    <div class="security-item" @click="showPasswordForm = !showPasswordForm">
                        <div class="security-info">
                            <div class="security-icon">🔐</div>
                            <div class="security-text">
                                <div class="security-name">修改密码</div>
                                <div class="security-desc">定期修改密码保护账号安全</div>
                            </div>
                        </div>
                        <div class="security-arrow">{{ showPasswordForm ? '▲' : '▼' }}</div>
                    </div>

                    <div v-if="showPasswordForm" class="password-form">
                        <div class="form-group">
                            <label class="form-label">旧密码 <span class="required">*</span></label>
                            <input 
                                type="password" 
                                class="form-control"
                                v-model="passwordForm.oldPassword"
                                placeholder="请输入旧密码"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码 <span class="required">*</span></label>
                            <input 
                                type="password" 
                                class="form-control"
                                v-model="passwordForm.newPassword"
                                placeholder="请输入新密码（至少6位）"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码 <span class="required">*</span></label>
                            <input 
                                type="password" 
                                class="form-control"
                                v-model="passwordForm.confirmPassword"
                                placeholder="请再次输入新密码"
                            >
                        </div>
                        <button class="btn btn-primary btn-block" @click="savePassword">确认修改</button>
                    </div>
                </div>
            </div>

            <div class="logout-section">
                <button class="btn btn-danger btn-block btn-lg" @click="handleLogout">
                    🚪 退出登录
                </button>
            </div>

            <div class="loading-state" v-if="loading">
                <div class="loading-spinner"></div>
                <p>加载中...</p>
            </div>
        </div>
    `
};

const ProfilePageWrapper = {
    render() {
        return Vue.h(MainLayout, { 
            currentPage: 'profile',
            onNavigate: (pageId) => {
                Router.navigate(pageId);
            }
        }, {
            default: () => Vue.h(ProfilePage)
        });
    }
};

window.ProfilePage = ProfilePage;
window.ProfilePageWrapper = ProfilePageWrapper;
})();
