window.ProfilePage = {
    template: `
        <div>
            <nav class="navbar">
            <router-link to="/home" class="navbar-brand">🔫 CS Game</router-link>
            <div class="navbar-nav">
                <router-link to="/home" class="nav-link">首页</router-link>
                <router-link to="/leaderboard" class="nav-link">排行榜</router-link>
                <router-link to="/achievements" class="nav-link">成就</router-link>
                <div class="dropdown">
                    <div class="user-avatar" @click="showDropdown = !showDropdown">
                        {{ user.nickname ? user.nickname[0].toUpperCase() : 'U' }}
                    </div>
                    <div v-if="showDropdown" class="dropdown-menu">
                        <router-link to="/profile" @click="showDropdown = false">个人中心</router-link>
                        <a v-if="user.role === 'admin'" @click="goAdmin">管理后台</a>
                        <a @click="handleLogout">退出登录</a>
                    </div>
                </div>
            </div>
        </nav>

            <div class="container">
                <h1 class="page-title">个人中心</h1>
                
                <div class="grid grid-3" style="margin-bottom: 30px;">
                    <div class="stat-card">
                        <h3>总击杀</h3>
                        <div class="value">{{ stats.total_kills || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>总场次</h3>
                        <div class="value">{{ stats.total_games || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>胜率</h3>
                        <div class="value">{{ stats.win_rate ? stats.win_rate.toFixed(1) : 0 }}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>K/D</h3>
                        <div class="value">{{ stats.kd_ratio ? stats.kd_ratio.toFixed(2) : 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>爆头数</h3>
                        <div class="value">{{ stats.total_headshots || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>胜利场次</h3>
                        <div class="value">{{ stats.total_wins || 0 }}</div>
                    </div>
                </div>

                <div class="grid grid-2">
                    <div class="card">
                        <h3 style="margin-bottom: 20px;">个人信息</h3>
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" v-model="editForm.username" disabled>
                        </div>
                        <div class="form-group">
                            <label>昵称</label>
                            <input type="text" v-model="editForm.nickname">
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" v-model="editForm.email">
                        </div>
                        <button class="btn btn-primary" @click="updateProfile">保存修改</button>
                    </div>

                    <div class="card">
                        <h3 style="margin-bottom: 20px;">修改密码</h3>
                        <div class="form-group">
                            <label>原密码</label>
                            <input type="password" v-model="passwordForm.old_password">
                        </div>
                        <div class="form-group">
                            <label>新密码</label>
                            <input type="password" v-model="passwordForm.new_password">
                        </div>
                        <div class="form-group">
                            <label>确认新密码</label>
                            <input type="password" v-model="confirmPassword">
                        </div>
                        <button class="btn btn-primary" @click="changePassword">修改密码</button>
                    </div>
                </div>

                <div class="card" style="margin-top: 30px;">
                    <h3 style="margin-bottom: 20px;">最近战绩</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>击杀</th>
                                <th>死亡</th>
                                <th>助攻</th>
                                <th>伤害</th>
                                <th>结果</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in records" :key="record.id">
                                <td>{{ formatDate(record.created_at) }}</td>
                                <td>{{ record.kills }}</td>
                                <td>{{ record.deaths }}</td>
                                <td>{{ record.assists }}</td>
                                <td>{{ record.damage_dealt }}</td>
                                <td>
                                    <span class="badge" :class="record.is_win ? 'badge-success' : 'badge-danger'">
                                        {{ record.is_win ? '胜利' : '失败' }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="records.length === 0">
                                <td colspan="6" style="text-align: center; color: #64748b;">暂无记录</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">
            {{ toast.message }}
        </div>
    `,
    setup() {
        const router = useRouter();
        const user = ref(Storage.getUser() || {});
        const showDropdown = ref(false);
        const stats = ref({});
        const records = ref([]);
        const editForm = reactive({
            username: '',
            nickname: '',
            email: ''
        });
        const passwordForm = reactive({
            old_password: '',
            new_password: ''
        });
        const confirmPassword = ref('');

        const toast = reactive({
            show: false,
            message: '',
            type: 'success'
        });

        const showToast = (message, type = 'success') => {
            toast.message = message;
            toast.type = type;
            toast.show = true;
            setTimeout(() => {
                toast.show = false;
            }, 3000);
        };

        const formatDate = (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleString();
        };

        const loadStats = async () => {
            const res = await API.game.getUserStats(user.value.id);
            if (res.code === 200) {
                stats.value = res.data || {};
            }
        };

        const loadRecords = async () => {
            const res = await API.game.getUserRecords(user.value.id, 0, 10);
            if (res.code === 200) {
                records.value = res.data || [];
            }
        };

        const loadUserInfo = async () => {
            const res = await API.user.getInfo(user.value.id);
            if (res.code === 200 && res.data) {
                editForm.username = res.data.username;
                editForm.nickname = res.data.nickname;
                editForm.email = res.data.email;
            }
        };

        const updateProfile = async () => {
            const res = await API.user.update(user.value.id, {
                nickname: editForm.nickname,
                email: editForm.email
            });
            if (res.code === 200) {
                showToast('修改成功');
                user.value.nickname = editForm.nickname;
                Storage.setUser(user.value);
            } else {
                showToast(res.message, 'error');
            }
        };

        const changePassword = async () => {
            if (!passwordForm.old_password || !passwordForm.new_password) {
                showToast('请填写完整信息', 'error');
                return;
            }
            if (passwordForm.new_password !== confirmPassword.value) {
                showToast('两次密码不一致', 'error');
                return;
            }

            const res = await API.user.changePassword(user.value.id, passwordForm);
            if (res.code === 200) {
                showToast('密码修改成功');
                passwordForm.old_password = '';
                passwordForm.new_password = '';
                confirmPassword.value = '';
            } else {
                showToast(res.message, 'error');
            }
        };

        const goAdmin = () => {
            router.push('/admin');
        };

        const handleLogout = () => {
            Storage.removeToken();
            Storage.removeUser();
            router.push('/login');
        };

        onMounted(() => {
            loadUserInfo();
            loadStats();
            loadRecords();
        });

        return {
            user, showDropdown, stats, records, editForm, passwordForm, confirmPassword, toast,
            formatDate, updateProfile, changePassword, goAdmin, handleLogout
        };
    }
};
