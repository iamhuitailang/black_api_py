window.AdminDashboard = {
    template: `
        <div>
            <div class="admin-sidebar">
                <div style="padding: 20px; text-align: center; border-bottom: 1px solid #1e293b;">
                    <h2 style="color: #e94560;">🔫 管理后台</h2>
                </div>
                <router-link to="/admin" class="nav-link active">📊 数据概览</router-link>
                <router-link to="/admin/users" class="nav-link">👥 用户管理</router-link>
                <router-link to="/admin/weapons" class="nav-link">🔫 武器管理</router-link>
                <router-link to="/admin/maps" class="nav-link">🗺️ 地图管理</router-link>
                <router-link to="/admin/statistics" class="nav-link">📈 数据统计</router-link>
                <div style="position: absolute; bottom: 20px; left: 20px; right: 20px;">
                    <a class="nav-link" @click="backToHome" style="cursor: pointer;">← 返回首页</a>
                </div>
            </div>

            <div class="admin-content">
                <h1 class="page-title">数据概览</h1>
                
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
                        <h3>活跃用户</h3>
                        <div class="value">{{ stats.active_users || 0 }}</div>
                    </div>
                </div>

                <div class="grid grid-2">
                    <div class="card">
                        <h3 style="margin-bottom: 20px;">快速操作</h3>
                        <div class="grid" style="gap: 15px;">
                            <router-link to="/admin/users" class="btn btn-secondary">用户管理</router-link>
                            <router-link to="/admin/weapons" class="btn btn-secondary">武器管理</router-link>
                            <router-link to="/admin/maps" class="btn btn-secondary">地图管理</router-link>
                            <router-link to="/admin/statistics" class="btn btn-secondary">查看统计</router-link>
                        </div>
                    </div>

                    <div class="card">
                        <h3 style="margin-bottom: 20px;">系统信息</h3>
                        <div style="color: #94a3b8; line-height: 2;">
                            <p>• 后端服务: FastAPI + SQLite</p>
                            <p>• 前端框架: Vue 3</p>
                            <p>• 平均击杀/场次: {{ stats.avg_kills_per_game ? stats.avg_kills_per_game.toFixed(2) : 0 }}</p>
                            <p>• 数据库: SQLite</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const stats = ref({});

        const loadStats = async () => {
            const res = await API.admin.getStats();
            if (res.code === 200) {
                stats.value = res.data || {};
            }
        };

        const backToHome = () => {
            router.push('/home');
        };

        onMounted(() => {
            loadStats();
        });

        return { stats, backToHome };
    }
};
