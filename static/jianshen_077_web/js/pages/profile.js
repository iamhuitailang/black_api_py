const ProfilePage = {
    template: `
        <div class="page has-header">
            <header class="header">
                <h1 class="header-title">个人中心</h1>
            </header>

            <div class="profile-header">
                <div class="profile-avatar">{{ (user.nickname || 'U').charAt(0) }}</div>
                <div class="profile-info">
                    <div class="profile-name">{{ user.nickname || user.username }}</div>
                    <div class="profile-role">{{ user.role_text }}</div>
                </div>
            </div>

            <div class="list">
                <div class="list-item" @click="$router.push('/my-courses')">
                    <span style="margin-right: 10px;">📋</span>
                    <div class="list-item-content">
                        <div class="list-item-title">我的课程</div>
                    </div>
                    <span class="list-item-arrow">›</span>
                </div>
                <div class="list-item" @click="$router.push('/checkin')">
                    <span style="margin-right: 10px;">✅</span>
                    <div class="list-item-content">
                        <div class="list-item-title">签到记录</div>
                    </div>
                    <span class="list-item-arrow">›</span>
                </div>
                <div class="list-item" @click="$router.push('/notifications')">
                    <span style="margin-right: 10px;">🔔</span>
                    <div class="list-item-content">
                        <div class="list-item-title">消息通知</div>
                        <div class="list-item-desc" v-if="unreadCount > 0" style="color: var(--danger-color);">{{ unreadCount }}条未读</div>
                    </div>
                    <span class="list-item-arrow">›</span>
                </div>
            </div>

            <div class="list" v-if="user.role === 1">
                <div class="list-item" @click="$router.push('/admin/courses')">
                    <span style="margin-right: 10px;">⚙️</span>
                    <div class="list-item-content">
                        <div class="list-item-title">管理后台</div>
                    </div>
                    <span class="list-item-arrow">›</span>
                </div>
            </div>

            <div class="list">
                <div class="list-item" @click="showChangePassword = true">
                    <span style="margin-right: 10px;">🔒</span>
                    <div class="list-item-content">
                        <div class="list-item-title">修改密码</div>
                    </div>
                    <span class="list-item-arrow">›</span>
                </div>
                <div class="list-item" @click="handleLogout">
                    <span style="margin-right: 10px;">🚪</span>
                    <div class="list-item-content">
                        <div class="list-item-title" style="color: var(--danger-color);">退出登录</div>
                    </div>
                </div>
            </div>

            <div class="tabbar">
                <router-link to="/courses" class="tabbar-item">
                    <span class="tabbar-icon">🏋️</span>
                    <span class="tabbar-text">课程</span>
                </router-link>
                <router-link to="/my-courses" class="tabbar-item">
                    <span class="tabbar-icon">📋</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
                <router-link to="/notifications" class="tabbar-item">
                    <span class="tabbar-icon">🔔</span>
                    <span class="tabbar-text">消息</span>
                </router-link>
                <router-link to="/profile" class="tabbar-item active">
                    <span class="tabbar-icon">👤</span>
                    <span class="tabbar-text">我的</span>
                </router-link>
            </div>

            <div class="modal-overlay" v-if="showChangePassword" @click.self="showChangePassword = false">
                <div class="modal">
                    <div class="modal-header">
                        <span class="modal-title">修改密码</span>
                        <span class="modal-close" @click="showChangePassword = false">✕</span>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input class="form-control" type="password" v-model="pwdForm.old_password">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input class="form-control" type="password" v-model="pwdForm.new_password">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input class="form-control" type="password" v-model="pwdForm.confirm_password">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" @click="showChangePassword = false">取消</button>
                        <button class="btn btn-primary" @click="handleChangePassword" :disabled="pwdLoading">
                            {{ pwdLoading ? '修改中...' : '确认修改' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: AuthService.getCurrentUser() || {},
            unreadCount: 0,
            showChangePassword: false,
            pwdLoading: false,
            pwdForm: {
                old_password: '',
                new_password: '',
                confirm_password: ''
            }
        };
    },
    methods: {
        async loadUnreadCount() {
            try {
                const result = await NotificationService.getUnreadCount();
                if (result.code === 0) {
                    this.unreadCount = result.data.count;
                }
            } catch (e) {}
        },
        async handleChangePassword() {
            if (!this.pwdForm.old_password) {
                Toast.warning('请输入原密码');
                return;
            }
            if (!this.pwdForm.new_password || this.pwdForm.new_password.length < 6) {
                Toast.warning('新密码至少6位');
                return;
            }
            if (this.pwdForm.new_password !== this.pwdForm.confirm_password) {
                Toast.warning('两次密码不一致');
                return;
            }

            this.pwdLoading = true;
            try {
                const result = await AuthService.changePassword(this.pwdForm.old_password, this.pwdForm.new_password);
                if (result.code === 0) {
                    Toast.success('密码修改成功，请重新登录');
                    this.showChangePassword = false;
                    await AuthService.logout();
                    this.$router.push('/login');
                } else {
                    Toast.error(result.msg || '修改失败');
                }
            } catch (e) {
                Toast.error('修改失败');
            } finally {
                this.pwdLoading = false;
            }
        },
        async handleLogout() {
            if (!confirm('确定退出登录？')) return;
            await AuthService.logout();
            this.$router.push('/login');
        }
    },
    mounted() {
        this.loadUnreadCount();
    }
};

window.ProfilePage = ProfilePage;
