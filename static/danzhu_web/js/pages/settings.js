const SettingsPage = {
    template: `
        <div class="settings-page">
            <div class="card" style="max-width: 500px; margin: 0 auto;">
                <div class="card-header">
                    <h2 class="card-title">⚙️ 账号设置</h2>
                </div>

                <form @submit.prevent="updateProfile">
                    <div class="form-group">
                        <label class="form-label">昵称</label>
                        <input type="text" class="form-input" v-model="profileForm.nickname"
                               placeholder="请输入昵称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">头像 (可选)</label>
                        <input type="text" class="form-input" v-model="profileForm.avatar"
                               placeholder="输入头像URL或表情">
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="profileLoading">
                        {{ profileLoading ? '保存中...' : '保存资料' }}
                    </button>
                </form>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 16px;">🔐 修改密码</h3>
                    <form @submit.prevent="changePassword">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input type="password" class="form-input" v-model="passwordForm.old_password"
                                   placeholder="请输入原密码" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input type="password" class="form-input" v-model="passwordForm.new_password"
                                   placeholder="请输入新密码（至少6位）" required>
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="passwordLoading">
                            {{ passwordLoading ? '修改中...' : '修改密码' }}
                        </button>
                    </form>
                </div>

                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 16px;">🚪 退出账号</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">
                        退出当前登录的账号
                    </p>
                    <button class="btn btn-danger" @click="logout">
                        退出登录
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            profileForm: {
                nickname: '',
                avatar: ''
            },
            passwordForm: {
                old_password: '',
                new_password: ''
            },
            profileLoading: false,
            passwordLoading: false,
            currentUser: null
        };
    },
    async mounted() {
        this.currentUser = Auth.getUser();
        if (!this.currentUser) {
            Router.navigate('/login');
            return;
        }
        this.profileForm.nickname = this.currentUser.nickname || '';
        this.profileForm.avatar = this.currentUser.avatar || '';
    },
    methods: {
        async updateProfile() {
            this.profileLoading = true;
            try {
                const result = await API.user.updateProfile({
                    nickname: this.profileForm.nickname,
                    avatar: this.profileForm.avatar
                });
                if (result.code === 0) {
                    Toast.success('资料更新成功');
                    Storage.setUser(result.data);
                    this.currentUser = result.data;
                    if (this.$root) {
                        this.$root.currentUser = result.data;
                    }
                } else {
                    Toast.error(result.msg || '更新失败');
                }
            } catch (e) {
                Toast.error('更新失败，请重试');
            } finally {
                this.profileLoading = false;
            }
        },
        async changePassword() {
            if (!this.passwordForm.old_password || !this.passwordForm.new_password) {
                Toast.warning('请填写完整信息');
                return;
            }
            if (this.passwordForm.new_password.length < 6) {
                Toast.warning('新密码长度至少6位');
                return;
            }

            this.passwordLoading = true;
            try {
                const result = await API.user.changePassword(this.passwordForm);
                if (result.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    await this.logout();
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败，请重试');
            } finally {
                this.passwordLoading = false;
            }
        },
        async logout() {
            await Auth.logout();
            if (this.$root) {
                this.$root.currentUser = null;
            }
            Router.navigate('/login');
        }
    }
};
