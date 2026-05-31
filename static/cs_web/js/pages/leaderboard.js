window.LeaderboardPage = {
    template: `
        <div>
            <nav class="navbar">
            <router-link to="/home" class="navbar-brand">🔫 CS Game</router-link>
            <div class="navbar-nav">
                <router-link to="/home" class="nav-link">首页</router-link>
                <router-link to="/leaderboard" class="nav-link active">排行榜</router-link>
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
                <h1 class="page-title">🏆 排行榜</h1>
                
                <div class="card">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>玩家</th>
                                <th>总击杀</th>
                                <th>总死亡</th>
                                <th>K/D</th>
                                <th>场次</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(player, index) in leaderboard" :key="player.id" :class="{ 'my-rank': player.id === user.id }">
                                <td>
                                    <span v-if="index === 0" style="color: #fbbf24; font-size: 24px;">🥇</span>
                                    <span v-else-if="index === 1" style="color: #9ca3af; font-size: 24px;">🥈</span>
                                    <span v-else-if="index === 2" style="color: #cd7f32; font-size: 24px;">🥉</span>
                                    <span v-else style="font-size: 18px;">#{{ player.rank }}</span>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">
                                            {{ player.nickname ? player.nickname[0].toUpperCase() : player.username[0].toUpperCase() }}
                                        </div>
                                        <span>{{ player.nickname || player.username }}</span>
                                    </div>
                                </td>
                                <td><strong>{{ player.total_kills }}</strong></td>
                                <td>{{ player.total_deaths }}</td>
                                <td>{{ player.kd_ratio ? player.kd_ratio.toFixed(2) : 0 }}</td>
                                <td>{{ player.total_games || 0 }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const user = ref(Storage.getUser() || {});
        const showDropdown = ref(false);
        const leaderboard = ref([]);

        const loadLeaderboard = async () => {
            const res = await API.user.getLeaderboard(50);
            if (res.code === 200) {
                leaderboard.value = res.data || [];
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
            loadLeaderboard();
        });

        return {
            user, showDropdown, leaderboard, goAdmin, handleLogout
        };
    }
};
