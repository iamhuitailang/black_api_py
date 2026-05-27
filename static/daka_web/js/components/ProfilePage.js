(function() {
const { ref, onMounted } = Vue;

const ProfilePage = {
    template: `
        <div class="profile-page">
            <div class="profile-header">
                <div class="profile-avatar">{{ userInfo?.nickname?.charAt(0) || '👤' }}</div>
                <div class="profile-info">
                    <div class="profile-name">{{ userInfo?.nickname || '用户' }}</div>
                    <div class="profile-phone">{{ userInfo?.phone || '' }}</div>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ userInfo?.total_days || 0 }}</div>
                            <div class="profile-stat-label">总打卡</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ userInfo?.current_streak || 0 }}</div>
                            <div class="profile-stat-label">连续天数</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ userInfo?.points || 0 }}</div>
                            <div class="profile-stat-label">积分</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="menu-list">
                <div class="menu-item" @click="showEditProfile = true">
                    <span class="menu-icon">✏️</span>
                    <span class="menu-text">编辑资料</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item" @click="showChangePassword = true">
                    <span class="menu-icon">🔑</span>
                    <span class="menu-text">修改密码</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item" @click="goToReminders">
                    <span class="menu-icon">⏰</span>
                    <span class="menu-text">提醒设置</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item" @click="shareApp">
                    <span class="menu-icon">📤</span>
                    <span class="menu-text">分享给朋友</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item" @click="showAbout = true">
                    <span class="menu-icon">ℹ️</span>
                    <span class="menu-text">关于</span>
                    <span class="menu-arrow">›</span>
                </div>
                <div class="menu-item" style="color: #F44336;" @click="handleLogout">
                    <span class="menu-icon">🚪</span>
                    <span class="menu-text">退出登录</span>
                    <span class="menu-arrow">›</span>
                </div>
            </div>

            <div v-if="showEditProfile" class="modal-overlay" @click.self="showEditProfile = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">编辑资料</div>
                        <button class="modal-close" @click="showEditProfile = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input v-model="editForm.nickname" type="text" class="form-input" placeholder="请输入昵称" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline btn-block" @click="showEditProfile = false">取消</button>
                        <button class="btn btn-primary btn-block" @click="saveProfile" :disabled="saving">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showChangePassword" class="modal-overlay" @click.self="showChangePassword = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">修改密码</div>
                        <button class="modal-close" @click="showChangePassword = false">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">原密码</label>
                            <input v-model="passwordForm.old_password" type="password" class="form-input" placeholder="请输入原密码" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input v-model="passwordForm.new_password" type="password" class="form-input" placeholder="请输入新密码（至少6位）" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline btn-block" @click="showChangePassword = false">取消</button>
                        <button class="btn btn-primary btn-block" @click="savePassword" :disabled="saving">
                            {{ saving ? '保存中...' : '保存' }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="showAbout" class="modal-overlay" @click.self="showAbout = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">关于每日打卡</div>
                        <button class="modal-close" @click="showAbout = false">×</button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🌱</div>
                        <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">每日打卡</div>
                        <div style="font-size: 14px; color: #666; margin-bottom: 20px;">版本 1.0.0</div>
                        <div style="font-size: 13px; color: #999; line-height: 1.8;">
                            自律养成好习惯<br/>
                            每天进步一点点<br/>
                            遇见更好的自己
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: ['user-info'],
    emits: ['logout', 'user-updated'],
    setup(props, { emit }) {
        const { useRouter } = VueRouter;
        const router = useRouter();

        const showEditProfile = ref(false);
        const showChangePassword = ref(false);
        const showAbout = ref(false);
        const saving = ref(false);
        
        const editForm = ref({
            nickname: props.userInfo?.nickname || ''
        });
        
        const passwordForm = ref({
            old_password: '',
            new_password: ''
        });

        const saveProfile = async () => {
            if (!editForm.value.nickname) {
                Toast.error('昵称不能为空');
                return;
            }

            saving.value = true;
            try {
                const result = await Api.user.updateProfile({ nickname: editForm.value.nickname });
                if (result.code === 0) {
                    Storage.setUser(result.data);
                    emit('user-updated');
                    Toast.success('保存成功');
                    showEditProfile.value = false;
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('保存失败，请稍后重试');
            } finally {
                saving.value = false;
            }
        };

        const savePassword = async () => {
            if (!passwordForm.value.old_password) {
                Toast.error('请输入原密码');
                return;
            }
            if (!passwordForm.value.new_password || passwordForm.value.new_password.length < 6) {
                Toast.error('新密码长度至少6位');
                return;
            }

            saving.value = true;
            try {
                const result = await Api.user.changePassword(
                    passwordForm.value.old_password,
                    passwordForm.value.new_password
                );
                if (result.code === 0) {
                    Toast.success('修改成功，请重新登录');
                    showChangePassword.value = false;
                    setTimeout(() => {
                        emit('logout');
                    }, 1000);
                } else {
                    Toast.error(result.msg);
                }
            } catch (e) {
                Toast.error('保存失败，请稍后重试');
            } finally {
                saving.value = false;
            }
        };

        const goToReminders = () => {
            Toast.warning('提醒功能开发中...');
        };

        const shareApp = () => {
            if (navigator.share) {
                navigator.share({
                    title: '每日打卡',
                    text: '我在用每日打卡APP养成好习惯，快来一起吧！',
                    url: window.location.href
                }).catch(() => {});
            } else {
                Toast.success('分享链接已复制');
            }
        };

        const handleLogout = () => {
            if (confirm('确定要退出登录吗？')) {
                Storage.clear();
                emit('logout');
            }
        };

        onMounted(() => {
            if (props.userInfo) {
                editForm.value.nickname = props.userInfo.nickname || '';
            }
        });

        return {
            showEditProfile,
            showChangePassword,
            showAbout,
            saving,
            editForm,
            passwordForm,
            saveProfile,
            savePassword,
            goToReminders,
            shareApp,
            handleLogout
        };
    }
};

window.ProfilePage = ProfilePage;
})();
