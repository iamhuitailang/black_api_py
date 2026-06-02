const ProfilePage = {
    template: `
        <div class="profile-container">
            <div class="page-header">
                <h1 class="page-title">个人中心</h1>
                <p class="page-subtitle">管理你的账号和设置</p>
            </div>
            
            <div class="profile-header">
                <div class="profile-avatar">
                    {{ (user?.nickname || user?.username || 'U').charAt(0).toUpperCase() }}
                </div>
                <div class="profile-info">
                    <div class="profile-nickname">{{ user?.nickname || user?.username }}</div>
                    <div class="profile-username">@{{ user?.username }}</div>
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">Lv.{{ user?.level || 1 }}</div>
                            <div class="profile-stat-label">等级</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ (user?.coins || 0).toLocaleString() }}</div>
                            <div class="profile-stat-label">金币</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">{{ totalGames || 0 }}</div>
                            <div class="profile-stat-label">游戏场次</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-sections">
                <div class="profile-section">
                    <h3 class="profile-section-title">经验进度</h3>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px;">
                            <span>当前等级: Lv.{{ user?.level || 1 }}</span>
                            <span>下一等级: Lv.{{ (user?.level || 1) + 1 }}</span>
                        </div>
                        <div class="exp-bar">
                            <div class="exp-fill" :style="{ width: expProgress + '%' }"></div>
                        </div>
                        <div class="exp-text">
                            <span>{{ user?.exp || 0 }} EXP</span>
                            <span>{{ expForNextLevel }} EXP</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h3 class="profile-section-title">编辑资料</h3>
                    <div v-if="profileMsg" :style="{ padding: '12px', background: profileMsgType === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', border: '1px solid ' + (profileMsgType === 'success' ? 'var(--neon-green)' : '#ff3366'), borderRadius: '8px', color: profileMsgType === 'success' ? 'var(--neon-green)' : '#ff3366', marginBottom: '15px' }">
                        {{ profileMsg }}
                    </div>
                    <form @submit.prevent="updateProfile">
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                v-model="editForm.nickname" 
                                placeholder="请输入昵称"
                            />
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="saving">
                            <span v-if="saving">保存中...</span>
                            <span v-else>保存修改</span>
                        </button>
                    </form>
                </div>
                
                <div class="profile-section">
                    <h3 class="profile-section-title">修改密码</h3>
                    <div v-if="passwordMsg" :style="{ padding: '12px', background: passwordMsgType === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', border: '1px solid ' + (passwordMsgType === 'success' ? 'var(--neon-green)' : '#ff3366'), borderRadius: '8px', color: passwordMsgType === 'success' ? 'var(--neon-green)' : '#ff3366', marginBottom: '15px' }">
                        {{ passwordMsg }}
                    </div>
                    <form @submit.prevent="changePassword">
                        <div class="form-group">
                            <label class="form-label">当前密码</label>
                            <input 
                                type="password" 
                                class="form-input" 
                                v-model="passwordForm.oldPassword" 
                                placeholder="请输入当前密码"
                            />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">新密码</label>
                                <input 
                                    type="password" 
                                    class="form-input" 
                                    v-model="passwordForm.newPassword" 
                                    placeholder="请输入新密码(至少6位)"
                                />
                            </div>
                            <div class="form-group">
                                <label class="form-label">确认新密码</label>
                                <input 
                                    type="password" 
                                    class="form-input" 
                                    v-model="passwordForm.confirmPassword" 
                                    placeholder="请再次输入新密码"
                                />
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" :disabled="changingPassword">
                            <span v-if="changingPassword">修改中...</span>
                            <span v-else>修改密码</span>
                        </button>
                    </form>
                </div>
                
                <div class="profile-section">
                    <h3 class="profile-section-title">游戏统计</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-card-value">{{ totalGames || 0 }}</div>
                            <div class="stat-card-label">总场次</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-value">{{ totalScore?.toLocaleString() || 0 }}</div>
                            <div class="stat-card-label">总得分</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-value">{{ maxCombo || 0 }}</div>
                            <div class="stat-card-label">最大连击</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    props: {
        user: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ['navigate', 'logout', 'login'],
    setup(props, { emit }) {
        const { ref, reactive, computed, onMounted, watch } = Vue;
        
        const editForm = reactive({
            nickname: props.user?.nickname || ''
        });
        
        const passwordForm = reactive({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        
        const saving = ref(false);
        const changingPassword = ref(false);
        const profileMsg = ref('');
        const profileMsgType = ref('success');
        const passwordMsg = ref('');
        const passwordMsgType = ref('success');
        
        const totalGames = ref(0);
        const totalScore = ref(0);
        const maxCombo = ref(0);
        
        watch(() => props.user, (newUser) => {
            if (newUser) {
                editForm.nickname = newUser.nickname || '';
            }
        }, { immediate: true });
        
        const expProgress = computed(() => {
            const currentExp = props.user?.exp || 0;
            const level = props.user?.level || 1;
            const expForCurrentLevel = level * 1000;
            const expForNext = (level + 1) * 1000;
            const progressInLevel = currentExp - expForCurrentLevel;
            const expNeeded = expForNext - expForCurrentLevel;
            return Math.min(100, Math.max(0, (progressInLevel / expNeeded) * 100));
        });
        
        const expForNextLevel = computed(() => {
            const level = props.user?.level || 1;
            return (level + 1) * 1000;
        });
        
        const updateProfile = async () => {
            if (!editForm.nickname.trim()) {
                profileMsg.value = '昵称不能为空';
                profileMsgType.value = 'error';
                return;
            }
            
            saving.value = true;
            profileMsg.value = '';
            try {
                const result = await AuthService.updateProfile({
                    nickname: editForm.nickname.trim()
                });
                
                if (result && result.code === 0) {
                    profileMsg.value = '资料更新成功';
                    profileMsgType.value = 'success';
                    if (result.data) {
                        emit('login', result.data);
                    }
                } else {
                    profileMsg.value = result?.msg || '更新失败';
                    profileMsgType.value = 'error';
                }
            } catch (e) {
                profileMsg.value = '网络错误，请稍后重试';
                profileMsgType.value = 'error';
            } finally {
                saving.value = false;
            }
        };
        
        const changePassword = async () => {
            passwordMsg.value = '';
            
            if (!passwordForm.oldPassword.trim()) {
                passwordMsg.value = '请输入当前密码';
                passwordMsgType.value = 'error';
                return;
            }
            if (!passwordForm.newPassword.trim()) {
                passwordMsg.value = '请输入新密码';
                passwordMsgType.value = 'error';
                return;
            }
            if (passwordForm.newPassword.length < 6) {
                passwordMsg.value = '密码长度不能少于6位';
                passwordMsgType.value = 'error';
                return;
            }
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                passwordMsg.value = '两次输入的新密码不一致';
                passwordMsgType.value = 'error';
                return;
            }
            
            changingPassword.value = true;
            try {
                const result = await AuthService.changePassword(
                    passwordForm.oldPassword,
                    passwordForm.newPassword
                );
                
                if (result && result.code === 0) {
                    passwordMsg.value = '密码修改成功，请重新登录';
                    passwordMsgType.value = 'success';
                    passwordForm.oldPassword = '';
                    passwordForm.newPassword = '';
                    passwordForm.confirmPassword = '';
                    setTimeout(() => {
                        emit('logout');
                    }, 2000);
                } else {
                    passwordMsg.value = result?.msg || '修改密码失败';
                    passwordMsgType.value = 'error';
                }
            } catch (e) {
                passwordMsg.value = '网络错误，请稍后重试';
                passwordMsgType.value = 'error';
            } finally {
                changingPassword.value = false;
            }
        };
        
        const loadStats = async () => {
            try {
                const result = await ApiService.get('/jinwutuan/stats/user/get');
                if (result && result.code === 0 && result.data) {
                    totalGames.value = result.data.total_games || 0;
                    totalScore.value = result.data.total_score || 0;
                    maxCombo.value = result.data.max_combo || 0;
                }
            } catch (e) {
                console.error('Load stats error:', e);
            }
        };
        
        onMounted(() => {
            loadStats();
        });
        
        return {
            editForm,
            passwordForm,
            saving,
            changingPassword,
            profileMsg,
            profileMsgType,
            passwordMsg,
            passwordMsgType,
            totalGames,
            totalScore,
            maxCombo,
            expProgress,
            expForNextLevel,
            updateProfile,
            changePassword
        };
    }
};
