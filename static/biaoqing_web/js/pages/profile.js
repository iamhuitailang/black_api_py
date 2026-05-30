(function() {
    const { ref, reactive, computed, onMounted } = Vue;
    
    window.ProfilePage = {
        name: 'ProfilePage',
        template: `
            <div class="profile-container">
                <div class="profile-sidebar">
                    <div class="user-card">
                        <div class="user-avatar">{{ user.nickname?.charAt(0) || 'U' }}</div>
                        <div class="user-info">
                            <div class="user-name">{{ user.nickname || user.username }}</div>
                            <div class="user-email">{{ user.email }}</div>
                            <div class="user-points">
                                <span class="points-icon">⭐</span>
                                <span class="points-value">{{ user.points || 0 }} 积分</span>
                            </div>
                        </div>
                    </div>
    
                    <div class="sidebar-menu">
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'profile' }"
                            @click="activeTab = 'profile'">
                            <span class="menu-icon">👤</span>
                            <span class="menu-text">个人资料</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'security' }"
                            @click="activeTab = 'security'">
                            <span class="menu-icon">🔐</span>
                            <span class="menu-text">修改密码</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'favorites' }"
                            @click="goToFavorites">
                            <span class="menu-icon">❤️</span>
                            <span class="menu-text">我的收藏</span>
                            <span class="menu-badge">{{ stats.favorite_count || 0 }}</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'uploads' }"
                            @click="goToUploads">
                            <span class="menu-icon">📤</span>
                            <span class="menu-text">我的上传</span>
                            <span class="menu-badge">{{ stats.upload_count || 0 }}</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'downloads' }"
                            @click="goToDownloads">
                            <span class="menu-icon">📥</span>
                            <span class="menu-text">下载记录</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'messages' }"
                            @click="goToMessages">
                            <span class="menu-icon">💬</span>
                            <span class="menu-text">消息中心</span>
                            <span class="menu-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'activities' }"
                            @click="goToActivities">
                            <span class="menu-icon">🎉</span>
                            <span class="menu-text">活动中心</span>
                        </div>
                        <div 
                            class="menu-item" 
                            :class="{ active: activeTab === 'points' }"
                            @click="activeTab = 'points'">
                            <span class="menu-icon">⭐</span>
                            <span class="menu-text">积分记录</span>
                        </div>
                    </div>
                </div>
    
                <div class="profile-content">
                    <div v-if="activeTab === 'profile'" class="profile-form">
                        <h2>👤 个人资料</h2>
                        
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-input" :value="user.username" disabled>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="profileForm.nickname"
                                placeholder="请输入昵称"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="text" class="form-input" :value="user.email" disabled>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">手机号</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="profileForm.phone"
                                placeholder="请输入手机号"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">性别</label>
                            <select class="form-input" v-model="profileForm.gender">
                                <option value="0">保密</option>
                                <option value="1">男</option>
                                <option value="2">女</option>
                            </select>
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">个人简介</label>
                            <textarea 
                                class="form-textarea" 
                                v-model="profileForm.bio"
                                placeholder="介绍一下自己吧"
                                rows="4">
                            </textarea>
                        </div>
    
                        <div class="form-actions">
                            <button class="btn-submit" @click="updateProfile" :disabled="saving">
                                <span v-if="saving">
                                    <span class="loading-spinner"></span> 保存中...
                                </span>
                                <span v-else>保存修改</span>
                            </button>
                        </div>
                    </div>
    
                    <div v-if="activeTab === 'security'" class="profile-form">
                        <h2>🔐 修改密码</h2>
                        
                        <div class="form-group">
                            <label class="form-label">当前密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="passwordForm.oldPassword"
                                placeholder="请输入当前密码"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">新密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="passwordForm.newPassword"
                                placeholder="请输入新密码（6-20位）"
                            >
                        </div>
    
                        <div class="form-group">
                            <label class="form-label">确认新密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="passwordForm.confirmPassword"
                                placeholder="请再次输入新密码"
                            >
                        </div>
    
                        <div class="form-actions">
                            <button class="btn-submit" @click="updatePassword" :disabled="saving">
                                <span v-if="saving">
                                    <span class="loading-spinner"></span> 修改中...
                                </span>
                                <span v-else>修改密码</span>
                            </button>
                        </div>
                    </div>
    
                    <div v-if="activeTab === 'points'" class="points-history">
                        <h2>⭐ 积分记录</h2>
                        
                        <div class="points-summary">
                            <div class="summary-item">
                                <div class="summary-label">当前积分</div>
                                <div class="summary-value highlight">{{ user.points || 0 }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">累计获得</div>
                                <div class="summary-value success">{{ stats.total_points || 0 }}</div>
                            </div>
                            <div class="summary-item">
                                <div class="summary-label">累计消费</div>
                                <div class="summary-value danger">{{ stats.used_points || 0 }}</div>
                            </div>
                        </div>
    
                        <div class="points-list">
                            <div class="points-item" v-for="record in pointLogs" :key="record.id">
                                <div class="points-icon" :class="record.change > 0 ? 'plus' : 'minus'">
                                    {{ record.change > 0 ? '+' : '' }}{{ record.change }}
                                </div>
                                <div class="points-info">
                                    <div class="points-reason">{{ record.reason || '积分变动' }}</div>
                                    <div class="points-time">{{ Utils.formatTime(record.created_at) }}</div>
                                </div>
                                <div class="points-balance">余额：{{ record.balance }}</div>
                            </div>
                        </div>
    
                        <div class="load-more" v-if="loading">
                            <span class="loading-spinner"></span> 加载中...
                        </div>
    
                        <div class="empty-state" v-if="!loading && pointLogs.length === 0">
                            <div class="empty-icon">⭐</div>
                            <div class="empty-text">暂无积分记录</div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        setup() {
            const router = VueRouter.useRouter();
            const route = VueRouter.useRoute();
    
            const user = ref({});
            const stats = ref({});
            const activeTab = ref('profile');
            const saving = ref(false);
            const loading = ref(false);
            const unreadCount = ref(0);
            const pointLogs = ref([]);
    
            const profileForm = reactive({
                nickname: '',
                phone: '',
                gender: 0,
                bio: ''
            });
    
            const passwordForm = reactive({
                oldPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
    
            const isLoggedIn = computed(() => Auth.isLoggedIn());
    
            const loadUserInfo = async () => {
                try {
                    const result = await API.user.getCurrentUser();
                    if (result.code === 0 && result.data) {
                        user.value = result.data;
                        profileForm.nickname = result.data.nickname || '';
                        profileForm.phone = result.data.phone || '';
                        profileForm.gender = result.data.gender || 0;
                        profileForm.bio = result.data.bio || '';
                    }
                } catch (error) {
                    console.error('Load user info error:', error);
                }
            };
    
            const loadStats = async () => {
                try {
                    const result = await API.user.getUserStats();
                    if (result.code === 0 && result.data) {
                        stats.value = result.data;
                    }
                } catch (error) {
                    console.error('Load stats error:', error);
                }
            };
    
            const loadUnreadCount = async () => {
                try {
                    const result = await API.message.getUnreadCount();
                    if (result.code === 0 && result.data) {
                        unreadCount.value = result.data.count || 0;
                    }
                } catch (error) {
                    console.error('Load unread count error:', error);
                }
            };
    
            const loadPointLogs = async () => {
                loading.value = true;
                try {
                    const result = await API.user.getPointLogs(1, 20);
                    if (result.code === 0 && result.data) {
                        pointLogs.value = result.data.items || result.data || [];
                    }
                } catch (error) {
                    console.error('Load point logs error:', error);
                } finally {
                    loading.value = false;
                }
            };
    
            const updateProfile = async () => {
                saving.value = true;
                try {
                    const result = await API.user.updateProfile(profileForm);
                    if (result.code === 0) {
                        Utils.showToast('资料修改成功', 'success');
                        loadUserInfo();
                    } else {
                        Utils.showToast(result.msg || '修改失败', 'error');
                    }
                } catch (error) {
                    console.error('Update profile error:', error);
                    Utils.showToast('修改失败，请稍后重试', 'error');
                } finally {
                    saving.value = false;
                }
            };
    
            const validatePassword = () => {
                if (!passwordForm.oldPassword) {
                    Utils.showToast('请输入当前密码', 'warning');
                    return false;
                }
                if (!passwordForm.newPassword) {
                    Utils.showToast('请输入新密码', 'warning');
                    return false;
                }
                if (passwordForm.newPassword.length < 6 || passwordForm.newPassword.length > 20) {
                    Utils.showToast('新密码长度应为6-20位', 'warning');
                    return false;
                }
                if (!passwordForm.confirmPassword) {
                    Utils.showToast('请确认新密码', 'warning');
                    return false;
                }
                if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    Utils.showToast('两次输入的新密码不一致', 'warning');
                    return false;
                }
                if (passwordForm.oldPassword === passwordForm.newPassword) {
                    Utils.showToast('新密码不能与当前密码相同', 'warning');
                    return false;
                }
                return true;
            };
    
            const updatePassword = async () => {
                if (!validatePassword()) return;
    
                saving.value = true;
                try {
                    const result = await API.user.changePassword(
                        passwordForm.oldPassword,
                        passwordForm.newPassword
                    );
                    if (result.code === 0) {
                        Utils.showToast('密码修改成功，请重新登录', 'success');
                        Auth.logout();
                        router.push({ name: 'login' });
                    } else {
                        Utils.showToast(result.msg || '修改失败', 'error');
                    }
                } catch (error) {
                    console.error('Update password error:', error);
                    Utils.showToast('修改失败，请稍后重试', 'error');
                } finally {
                    saving.value = false;
                }
            };
    
            const goToFavorites = () => {
                router.push({ name: 'favorites' });
            };
    
            const goToUploads = () => {
                router.push({ name: 'my-uploads' });
            };
    
            const goToDownloads = () => {
                router.push({ name: 'downloads' });
            };
    
            const goToMessages = () => {
                router.push({ name: 'messages' });
            };
    
            const goToActivities = () => {
                router.push({ name: 'activities' });
            };
    
            onMounted(() => {
                if (!isLoggedIn.value) {
                    Utils.showToast('请先登录', 'warning');
                    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
                    return;
                }
                loadUserInfo();
                loadStats();
                loadUnreadCount();
                loadPointLogs();
            });
    
            return {
                user,
                stats,
                activeTab,
                saving,
                loading,
                unreadCount,
                pointLogs,
                profileForm,
                passwordForm,
                isLoggedIn,
                updateProfile,
                updatePassword,
                goToFavorites,
                goToUploads,
                goToDownloads,
                goToMessages,
                goToActivities,
                Utils
            };
        }
    };
})();
