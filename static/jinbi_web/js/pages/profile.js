const ProfilePage = {
    template: `
        <div class="profile-page">
            <nav class="game-nav">
                <div class="nav-left">
                    <span class="user-avatar">{{ gameState.user?.avatar || '😊' }}</span>
                    <span class="user-name">{{ gameState.user?.nickname || '玩家' }}</span>
                </div>
                <div class="nav-center">
                    <div class="level-info">
                        <span class="level-badge">Lv.{{ gameState.level }}</span>
                    </div>
                </div>
                <div class="nav-right">
                    <span class="coin-display">💰 {{ gameState.coins }}</span>
                </div>
            </nav>

            <div class="profile-content">
                <div class="profile-header">
                    <div class="avatar-section">
                        <div class="avatar-large">{{ gameState.user?.avatar || '😊' }}</div>
                        <h2 class="user-nickname">{{ gameState.user?.nickname || '玩家' }}</h2>
                        <p class="user-phone">{{ gameState.user?.phone || '' }}</p>
                    </div>
                </div>

                <div class="stats-card">
                    <h3 class="card-title">📊 游戏统计</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🎯</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ gameState.statistics?.totalPushes || 0 }}</div>
                                <div class="stat-label">总推送次数</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ gameState.totalCoins || 0 }}</div>
                                <div class="stat-label">累计获得金币</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🎁</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ gameState.statistics?.totalRewards || 0 }}</div>
                                <div class="stat-label">收集奖励</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-info">
                                <div class="stat-number">{{ gameState.statistics?.maxCombo || 0 }}</div>
                                <div class="stat-label">最高连击</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="menu-card">
                    <div class="menu-item" @click="showPasswordModal = true">
                        <span class="menu-icon">🔐</span>
                        <span class="menu-text">修改密码</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" @click="showNicknameModal = true">
                        <span class="menu-icon">✏️</span>
                        <span class="menu-text">修改昵称</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item" @click="showAvatarModal = true">
                        <span class="menu-icon">😊</span>
                        <span class="menu-text">更换头像</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item danger" @click="handleReset">
                        <span class="menu-icon">🔄</span>
                        <span class="menu-text">重置游戏数据</span>
                        <span class="menu-arrow">›</span>
                    </div>
                    <div class="menu-item danger" @click="handleLogout">
                        <span class="menu-icon">🚪</span>
                        <span class="menu-text">退出登录</span>
                        <span class="menu-arrow">›</span>
                    </div>
                </div>
            </div>

            <div class="bottom-nav">
                <div class="nav-item" :class="{ active: currentRoute === 'game' }" @click="navigateTo('game')">
                    <span class="nav-icon">🎮</span>
                    <span class="nav-text">游戏</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'leaderboard' }" @click="navigateTo('leaderboard')">
                    <span class="nav-icon">🏆</span>
                    <span class="nav-text">排行</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'achievements' }" @click="navigateTo('achievements')">
                    <span class="nav-icon">🎖️</span>
                    <span class="nav-text">成就</span>
                </div>
                <div class="nav-item" :class="{ active: currentRoute === 'profile' }" @click="navigateTo('profile')">
                    <span class="nav-icon">👤</span>
                    <span class="nav-text">我的</span>
                </div>
            </div>

            <div class="modal" v-if="showPasswordModal" @click.self="showPasswordModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>修改密码</h3>
                        <span class="modal-close" @click="showPasswordModal = false">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input type="password" class="form-control" v-model="oldPassword" placeholder="请输入原密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" class="form-control" v-model="newPassword" placeholder="请输入新密码（至少6位）">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input type="password" class="form-control" v-model="confirmPassword" placeholder="请再次输入新密码">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showPasswordModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleChangePassword" :disabled="passwordLoading">
                            <span v-if="passwordLoading" class="loading"></span>
                            {{ passwordLoading ? '修改中...' : '确认修改' }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="modal" v-if="showNicknameModal" @click.self="showNicknameModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>修改昵称</h3>
                        <span class="modal-close" @click="showNicknameModal = false">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">新昵称</label>
                            <input type="text" class="form-control" v-model="newNickname" placeholder="请输入新昵称" maxlength="12">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showNicknameModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleUpdateNickname" :disabled="nicknameLoading">
                            <span v-if="nicknameLoading" class="loading"></span>
                            {{ nicknameLoading ? '修改中...' : '确认修改' }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="modal" v-if="showAvatarModal" @click.self="showAvatarModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>选择头像</h3>
                        <span class="modal-close" @click="showAvatarModal = false">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="avatar-grid">
                            <div 
                                v-for="avatar in avatars" 
                                :key="avatar"
                                class="avatar-option"
                                :class="{ selected: selectedAvatar === avatar }"
                                @click="selectedAvatar = avatar"
                            >
                                {{ avatar }}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" @click="showAvatarModal = false">取消</button>
                        <button class="btn btn-primary" @click="handleUpdateAvatar" :disabled="avatarLoading">
                            <span v-if="avatarLoading" class="loading"></span>
                            {{ avatarLoading ? '修改中...' : '确认选择' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            currentRoute: 'profile',
            showPasswordModal: false,
            showNicknameModal: false,
            showAvatarModal: false,
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            newNickname: '',
            selectedAvatar: '😊',
            passwordLoading: false,
            nicknameLoading: false,
            avatarLoading: false,
            avatars: ['😊', '😎', '🤩', '🤑', '😇', '🥳', '😋', '🤗', '😎', '🦊', '🐱', '🐶', '🐼', '🦁', '🐯', '🐨']
        };
    },
    computed: {
        gameState() {
            if (!GameStore.state) {
                GameStore.ensureState();
            }
            return GameStore.state || {};
        }
    },
    mounted() {
        this.currentRoute = Router.getCurrentRoute();
        if (this.gameState.user?.avatar) {
            this.selectedAvatar = this.gameState.user.avatar;
        }
    },
    methods: {
        async handleChangePassword() {
            if (!this.oldPassword) {
                Toast.error('请输入原密码');
                return;
            }
            if (!this.newPassword || this.newPassword.length < 6) {
                Toast.error('新密码至少6位');
                return;
            }
            if (this.oldPassword === this.newPassword) {
                Toast.error('新密码不能与原密码相同');
                return;
            }
            if (this.newPassword !== this.confirmPassword) {
                Toast.error('两次密码输入不一致');
                return;
            }

            this.passwordLoading = true;
            try {
                const result = await AuthService.changePassword(this.oldPassword, this.newPassword);
                if (result.code === 0) {
                    Toast.success('密码修改成功');
                    this.showPasswordModal = false;
                    this.oldPassword = '';
                    this.newPassword = '';
                    this.confirmPassword = '';
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请稍后重试');
            } finally {
                this.passwordLoading = false;
            }
        },

        async handleUpdateNickname() {
            if (!this.newNickname.trim()) {
                Toast.error('请输入昵称');
                return;
            }

            this.nicknameLoading = true;
            try {
                const result = await AuthService.updateProfile({ nickname: this.newNickname.trim() });
                if (result.code === 0) {
                    Toast.success('昵称修改成功');
                    GameStore.state.user = result.data;
                    this.showNicknameModal = false;
                    this.newNickname = '';
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请稍后重试');
            } finally {
                this.nicknameLoading = false;
            }
        },

        async handleUpdateAvatar() {
            this.avatarLoading = true;
            try {
                const result = await AuthService.updateProfile({ avatar: this.selectedAvatar });
                if (result.code === 0) {
                    Toast.success('头像修改成功');
                    GameStore.state.user = result.data;
                    this.showAvatarModal = false;
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请稍后重试');
            } finally {
                this.avatarLoading = false;
            }
        },

        handleReset() {
            if (confirm('确定要重置游戏数据吗？所有进度将丢失！')) {
                GameStore.clearGameState();
                Toast.success('游戏数据已重置');
            }
        },

        async handleLogout() {
            if (confirm('确定要退出登录吗？')) {
                await AuthService.logout();
                GameStore.state = null;
                Router.navigate('login');
            }
        },

        navigateTo(route) {
            Router.navigate(route);
        }
    }
};

window.ProfilePage = ProfilePage;
