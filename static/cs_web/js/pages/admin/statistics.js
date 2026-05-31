window.AdminStatistics = {
    template: `
        <div>
            <div class="admin-sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h2 style="color: #e94560;">🔫 管理后台</h2>
                </div>
                <router-link to="/admin" class="nav-link">📊 数据概览</router-link>
                <router-link to="/admin/users" class="nav-link">👥 用户管理</router-link>
                <router-link to="/admin/weapons" class="nav-link">🔫 武器管理</router-link>
                <router-link to="/admin/maps" class="nav-link">🗺️ 地图管理</router-link>
                <router-link to="/admin/statistics" class="nav-link active">📈 数据统计</router-link>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <a class="nav-link" @click="backToHome" style="cursor: pointer;">← 返回首页</a>
                </div>
            </div>

            <div class="admin-content">
                <h1 class="page-title">数据统计</h1>

                <div class="grid grid-4" style="margin-bottom: 30px;">
                    <div class="stat-card">
                        <h3>总用户数</h3>
                        <div class="value">{{ stats.total_users || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>总场次</h3>
                        <div class="value">{{ stats.total_games || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>总击杀</h3>
                        <div class="value">{{ stats.total_kills || 0 }}</div>
                    </div>
                    <div class="stat-card">
                        <h3>总死亡</h3>
                        <div class="value">{{ stats.total_deaths || 0 }}</div>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 30px;">
                    <h3 style="margin-bottom: 20px;">最近游戏记录</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>用户ID</th>
                                <th>击杀</th>
                                <th>死亡</th>
                                <th>伤害</th>
                                <th>结果</th>
                                <th>时长</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="record in records" :key="record.id">
                                <td>{{ record.id }}</td>
                                <td>{{ record.user_id }}</td>
                                <td>{{ record.kills }}</td>
                                <td>{{ record.deaths }}</td>
                                <td>{{ record.damage_dealt || 0 }}</td>
                                <td>
                                    <span class="badge" :class="record.is_win ? 'badge-success' : 'badge-danger'">
                                        {{ record.is_win ? '胜利' : '失败' }}
                                    </span>
                                </td>
                                <td>{{ formatDuration(record.game_duration) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="card">
                    <h3 style="margin-bottom: 20px;">用户排行榜 (Top 10)</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>用户</th>
                                <th>总击杀</th>
                                <th>总死亡</th>
                                <th>K/D</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(player, index) in leaderboard" :key="player.id">
                                <td>#{{ index + 1 }}</td>
                                <td>{{ player.nickname || player.username }}</td>
                                <td>{{ player.total_kills }}</td>
                                <td>{{ player.total_deaths }}</td>
                                <td>{{ player.kd_ratio ? player.kd_ratio.toFixed(2) : 0 }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const stats = ref({});
        const records = ref([]);
        const leaderboard = ref([]);

        const formatDuration = (seconds) => {
            if (!seconds) return '-';
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m}分${s}秒`;
        };

        const loadStats = async () => {
            const res = await API.admin.getStats();
            if (res.code === 200) {
                stats.value = res.data || {};
            }
        };

        const loadRecords = async () => {
            const res = await API.game.getAllRecords(0, 20);
            if (res.code === 200) {
                records.value = res.data || [];
            }
        };

        const loadLeaderboard = async () => {
            const res = await API.user.getLeaderboard(10);
            if (res.code === 200) {
                leaderboard.value = res.data || [];
            }
        };

        const backToHome = () => {
            router.push('/home');
        };

        onMounted(() => {
            loadStats();
            loadRecords();
            loadLeaderboard();
        });

        return { stats, records, leaderboard, formatDuration, backToHome };
    }
};
