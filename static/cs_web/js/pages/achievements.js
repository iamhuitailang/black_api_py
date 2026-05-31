window.AchievementsPage = {
    template: `
        <div>
            <nav class="navbar">
            <router-link to="/home" class="navbar-brand">🔫 CS Game</router-link>
            <div class="navbar-nav">
                <router-link to="/home" class="nav-link">首页</router-link>
                <router-link to="/leaderboard" class="nav-link">排行榜</router-link>
                <router-link to="/achievements" class="nav-link active">成就</router-link>
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
                <h1 class="page-title">🏅 成就系统</h1>
                
                <div style="margin-bottom: 20px;">
                    <span class="badge badge-success">已解锁: {{ unlockedCount }} / {{ achievements.length }}</span>
                </div>

                <div class="grid grid-4">
                    <div v-for="achievement in achievements" :key="achievement.id" 
                         class="achievement-card" :class="achievement.unlocked ? 'unlocked' : 'locked'">
                        <div class="achievement-icon">
                            {{ achievement.unlocked ? '🏆' : '🔒' }}
                        </div>
                        <h4>{{ achievement.name }}</h4>
                        <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">
                            {{ achievement.description }}
                        </p>
                        <div v-if="achievement.unlocked" style="margin-top: 15px; font-size: 12px; color: #fbbf24;">
                            解锁于 {{ formatDate(achievement.unlocked_at) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const user = ref(Storage.getUser() || {});
        const showDropdown = ref(false);
        const achievements = ref([]);

        const unlockedCount = computed(() => {
            return achievements.value.filter(a => a.unlocked).length;
        });

        const formatDate = (date) => {
            if (!date) return '-';
            return new Date(date).toLocaleDateString();
        };

        const loadAchievements = async () => {
            const res = await API.achievement.getUserAchievements(user.value.id);
            if (res.code === 200) {
                achievements.value = res.data || [];
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
            loadAchievements();
        });

        return {
            user, showDropdown, achievements, unlockedCount,
            formatDate, goAdmin, handleLogout
        };
    }
};
