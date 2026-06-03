const SettingsPage = {
    data() {
        return {
            user: null,
            gameState: null,
            nickname: '',
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
            musicVolume: 0.7,
            sfxVolume: 0.5,
            difficulty: 2,
            showPasswordModal: false
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">⚙️ 设置</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <div class="user-avatar">{{ user ? user.nickname.charAt(0).toUpperCase() : 'U' }}</div>
                </div>
            </header>

            <div class="content">
                <h1 class="page-title">设置</h1>

                <div class="card" style="margin-bottom: 16px;">
                    <h3 class="section-title" style="margin-top: 0;">个人信息</h3>
                    <div class="form-group">
                        <label>用户名</label>
                        <input :value="user ? user.username : ''" disabled />
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input :value="user ? user.email : ''" disabled />
                    </div>
                    <div class="form-group">
                        <label>昵称</label>
                        <input v-model="nickname" type="text" placeholder="请输入昵称" />
                    </div>
                    <button class="btn btn-primary" @click="updateProfile">
                        保存修改
                    </button>
                </div>

                <div class="card" style="margin-bottom: 16px;">
                    <h3 class="section-title" style="margin-top: 0;">游戏设置</h3>
                    <div class="form-group">
                        <label>音乐音量: {{ Math.round(musicVolume * 100) }}%</label>
                        <input 
                            type="range" 
                            v-model="musicVolume" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            style="width: 100%; height: 8px; cursor: pointer;"
                        />
                    </div>
                    <div class="form-group">
                        <label>音效音量: {{ Math.round(sfxVolume * 100) }}%</label>
                        <input 
                            type="range" 
                            v-model="sfxVolume" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            style="width: 100%; height: 8px; cursor: pointer;"
                        />
                    </div>
                    <div class="form-group">
                        <label>默认难度</label>
                        <div style="display: flex; gap: 8px;">
                            <button 
                                v-for="d in [1,2,3,4]" 
                                :key="d"
                                class="btn"
                                :class="difficulty === d ? 'btn-primary' : 'btn-secondary'"
                                style="flex: 1; padding: 10px;"
                                @click="difficulty = d"
                            >
                                {{ Utils.getDifficultyText(d) }}
                            </button>
                        </div>
                    </div>
                    <button class="btn btn-primary" @click="saveSettings">
                        保存设置
                    </button>
                </div>

                <div class="card" style="margin-bottom: 16px;">
                    <h3 class="section-title" style="margin-top: 0;">账号安全</h3>
                    <button class="btn btn-secondary btn-block" @click="showPasswordModal = true">
                        修改密码
                    </button>
                </div>

                <button class="btn btn-secondary btn-block" style="color: var(--danger);" @click="logout">
                    退出登录
                </button>
            </div>

            <div v-if="showPasswordModal" class="modal" @click.self="showPasswordModal = false">
                <div class="modal-content">
                    <h2 class="modal-title">修改密码</h2>
                    <div class="form-group">
                        <label>原密码</label>
                        <input v-model="oldPassword" type="password" placeholder="请输入原密码" />
                    </div>
                    <div class="form-group">
                        <label>新密码</label>
                        <input v-model="newPassword" type="password" placeholder="请输入新密码" />
                    </div>
                    <div class="form-group">
                        <label>确认新密码</label>
                        <input v-model="confirmPassword" type="password" placeholder="请再次输入新密码" />
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-secondary" @click="showPasswordModal = false">
                            取消
                        </button>
                        <button class="btn btn-primary" @click="updatePassword">
                            确认修改
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
                <div class="nav-item active" @click="goToSettings">
                    <div class="nav-icon">⚙️</div>
                    <div class="nav-label">设置</div>
                </div>
            </nav>
        </div>
    `,
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            if (this.user) {
                this.nickname = this.user.nickname;
            }

            const res = await YpAPI.game.state();
            if (res.code === 0 && res.data) {
                this.gameState = res.data;
                if (res.data.settings) {
                    this.musicVolume = res.data.settings.music_volume ?? 0.7;
                    this.sfxVolume = res.data.settings.sfx_volume ?? 0.5;
                    this.difficulty = res.data.settings.difficulty ?? 2;
                }
            }
        },
        async updateProfile() {
            if (!this.nickname) {
                Utils.showToast('昵称不能为空', 'error');
                return;
            }

            const response = await YpAPI.user.updateProfile({ nickname: this.nickname });
            if (response.code === 0) {
                this.user.nickname = this.nickname;
                Auth.setUser(this.user);
                Utils.showToast('修改成功', 'success');
            } else {
                Utils.showToast(response.msg || '修改失败', 'error');
            }
        },
        async saveSettings() {
            const response = await YpAPI.game.updateSettings({
                music_volume: this.musicVolume,
                sfx_volume: this.sfxVolume,
                difficulty: this.difficulty
            });

            if (response.code === 0) {
                Utils.showToast('设置已保存', 'success');
                if (this.gameState) {
                    this.gameState.settings = {
                        music_volume: this.musicVolume,
                        sfx_volume: this.sfxVolume,
                        difficulty: this.difficulty
                    };
                    Auth.setGameState(this.gameState);
                }
            } else {
                Utils.showToast(response.msg || '保存失败', 'error');
            }
        },
        async updatePassword() {
            if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
                Utils.showToast('请填写完整信息', 'error');
                return;
            }

            if (this.newPassword !== this.confirmPassword) {
                Utils.showToast('两次输入的密码不一致', 'error');
                return;
            }

            if (this.newPassword.length < 6) {
                Utils.showToast('密码至少需要6位', 'error');
                return;
            }

            const response = await YpAPI.user.updatePassword({
                old_password: this.oldPassword,
                new_password: this.newPassword
            });

            if (response.code === 0) {
                this.showPasswordModal = false;
                this.oldPassword = '';
                this.newPassword = '';
                this.confirmPassword = '';
                Utils.showToast('密码修改成功', 'success');
            } else {
                Utils.showToast(response.msg || '修改失败', 'error');
            }
        },
        async logout() {
            await Auth.logout();
            Utils.showToast('已退出登录', 'success');
            Router.navigate('login');
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
        goToSettings() {}
    },
    mounted() {
        this.loadData();
    }
};
