
const ProfileView = Vue.defineComponent({
    name: 'ProfileView',
    setup() {
        const router = window.ChouchouRouter;
        
        const userStats = Vue.ref(null);
        const highScores = Vue.ref([]);
        const loading = Vue.ref(false);
        const showEditModal = Vue.ref(false);
        const showPasswordModal = Vue.ref(false);

        const editForm = Vue.reactive({
            nickname: '',
            phone: ''
        });

        const passwordForm = Vue.reactive({
            old_password: '',
            new_password: '',
            confirm_password: ''
        });

        const loadProfile = async () => {
            loading.value = true;
            try {
                const [profile, stats, scores] = await Promise.all([
                    API.user.getProfile(),
                    API.highScore.personal(),
                    API.highScore.list('single_game', 1, 10)
                ]);
                
                if (profile) {
                    Store.setUser(profile);
                    editForm.nickname = profile.nickname || '';
                    editForm.phone = profile.phone || '';
                }
                if (stats) {
                    userStats.value = stats;
                }
                if (scores) {
                    highScores.value = Array.isArray(scores) ? scores : (scores.items || []);
                }
            } finally {
                loading.value = false;
            }
        };

        const handleUpdateProfile = async () => {
            loading.value = true;
            try {
                const result = await API.user.updateProfile(editForm);
                if (result) {
                    Utils.success('个人信息更新成功');
                    Store.setUser(result);
                    showEditModal.value = false;
                    loadProfile();
                }
            } finally {
                loading.value = false;
            }
        };

        const handleChangePassword = async () => {
            if (!passwordForm.old_password) {
                Utils.warning('请输入原密码');
                return;
            }
            if (!Utils.isValidPassword(passwordForm.new_password)) {
                Utils.warning('新密码长度需要6-20位');
                return;
            }
            if (passwordForm.new_password === passwordForm.old_password) {
                Utils.warning('新密码不能与原密码相同');
                return;
            }
            if (passwordForm.new_password !== passwordForm.confirm_password) {
                Utils.warning('两次输入的新密码不一致');
                return;
            }

            loading.value = true;
            try {
                const result = await API.user.changePassword(
                    passwordForm.old_password,
                    passwordForm.new_password
                );
                if (result) {
                    Utils.success('密码修改成功，请重新登录');
                    showPasswordModal.value = false;
                    Store.logout();
                }
            } finally {
                loading.value = false;
            }
        };

        Vue.onMounted(() => {
            loadProfile();
        });

        return {
            Store,
            Utils,
            userStats,
            highScores,
            loading,
            showEditModal,
            showPasswordModal,
            editForm,
            passwordForm,
            loadProfile,
            handleUpdateProfile,
            handleChangePassword
        };
    },
    template: `
        <div>
            <header class="header">
                <h1>🎪 国王游戏 - 个人中心</h1>
                <nav>
                    <router-link to="/lobby">游戏大厅</router-link>
                    <router-link to="/leaderboard">排行榜</router-link>
                    <router-link to="/profile">个人中心</router-link>
                    <router-link to="/settings">设置</router-link>
                    <button @click="Store.logout()">退出</button>
                    <ThemeSwitcher />
                </nav>
            </header>

            <div class="container">
                <div v-if="loading" class="loading">
                    <div class="spinner"></div>
                </div>

                <template v-else>
                    <div class="profile-header">
                        <div class="profile-avatar">
                            {{ Store.user ? Utils.getInitials(Store.user.nickname || Store.user.username) : '?' }}
                        </div>
                        <div class="profile-name">
                            {{ Store.user?.nickname || Store.user?.username }}
                        </div>
                        <div class="profile-username">
                            @{{ Store.user?.username }}
                        </div>
                        <div style="margin-top: 16px;">
                            <button class="btn btn-secondary btn-sm" style="margin-right: 8px;" @click="showEditModal = true">
                                ✏️ 编辑资料
                            </button>
                            <button class="btn btn-outline btn-sm" @click="showPasswordModal = true">
                                🔒 修改密码
                            </button>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.total_games || 0 }}</div>
                            <div class="stat-label">总游戏次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.wins || 0 }}</div>
                            <div class="stat-label">胜利次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.highest_score || 0 }}</div>
                            <div class="stat-label">最高得分</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.total_score || 0 }}</div>
                            <div class="stat-label">累计积分</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.king_count || 0 }}</div>
                            <div class="stat-label">国王次数</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{{ userStats?.clown_count || 0 }}</div>
                            <div class="stat-label">小丑次数</div>
                        </div>
                    </div>

                    <div class="card">
                        <h2 style="color: var(--primary-color); margin-bottom: 20px;">🏆 我的战绩</h2>
                        
                        <div v-if="highScores.length === 0" class="empty-state" style="padding: 40px;">
                            <div class="empty-state-icon">🎮</div>
                            <div class="empty-state-text">还没有游戏记录</div>
                            <router-link to="/lobby" class="btn btn-primary">
                                去玩游戏
                            </router-link>
                        </div>

                        <div v-else class="leaderboard">
                            <div class="leaderboard-header">
                                历史最高记录
                            </div>
                            <div 
                                v-for="(score, index) in highScores" 
                                :key="score.id"
                                class="leaderboard-row"
                            >
                                <div :class="['rank', index < 3 ? 'rank-' + (index + 1) : 'rank-other']">
                                    {{ index + 1 }}
                                </div>
                                <div>
                                    <div style="font-weight: bold;">{{ score.game_name }}</div>
                                    <div style="font-size: 12px; color: var(--text-light);">
                                        {{ score.created_at }}
                                    </div>
                                </div>
                                <div>
                                    <span :class="['badge', 'badge-' + score.role]">
                                        {{ Utils.getRoleName(score.role) }}
                                    </span>
                                </div>
                                <div style="font-weight: bold; font-size: 18px; color: var(--primary-color);">
                                    {{ score.score }} 分
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </div>

            <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>✏️ 编辑资料</h3>
                        <button class="close-btn" @click="showEditModal = false">&times;</button>
                    </div>
                    
                    <div class="form-group">
                        <label>昵称</label>
                        <input type="text" v-model="editForm.nickname" placeholder="输入昵称" />
                    </div>
                    
                    <div class="form-group">
                        <label>手机号</label>
                        <input type="tel" v-model="editForm.phone" placeholder="输入手机号" />
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-outline" style="flex: 1;" @click="showEditModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" :disabled="loading" @click="handleUpdateProfile">
                            {{ loading ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔒 修改密码</h3>
                        <button class="close-btn" @click="showPasswordModal = false">&times;</button>
                    </div>
                    
                    <div class="form-group">
                        <label>原密码</label>
                        <input type="password" v-model="passwordForm.old_password" placeholder="请输入原密码" />
                    </div>
                    
                    <div class="form-group">
                        <label>新密码</label>
                        <input type="password" v-model="passwordForm.new_password" placeholder="6-20位新密码" />
                    </div>
                    
                    <div class="form-group">
                        <label>确认新密码</label>
                        <input type="password" v-model="passwordForm.confirm_password" placeholder="再次输入新密码" />
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-outline" style="flex: 1;" @click="showPasswordModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" style="flex: 1;" :disabled="loading" @click="handleChangePassword">
                            {{ loading ? '修改中...' : '确认修改' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
});

window.ProfileView = ProfileView;
