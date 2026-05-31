window.HomePage = {
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
                <div class="home-hero">
                    <h1>欢迎回来，{{ user.nickname || user.username }}！</h1>
                    <p>准备好开始一场激烈的战斗了吗？</p>
                    <div class="home-actions">
                        <button class="btn btn-primary" @click="showMapSelect = true">
                            🎮 开始游戏
                        </button>
                        <router-link to="/profile" class="btn btn-secondary">
                            📊 查看战绩
                        </router-link>
                    </div>
                </div>

                <h2 class="section-title">选择地图</h2>
                <div class="grid grid-3">
                    <div v-for="map in maps" :key="map.id" class="map-card" @click="selectMap(map)">
                        <div class="thumbnail">🗺️</div>
                        <div class="info">
                            <h3>{{ map.name }}</h3>
                            <p>{{ map.description }}</p>
                            <p style="margin-top: 10px; color: #e94560;">最多 {{ map.max_players }} 人</p>
                        </div>
                    </div>
                </div>

                <h2 class="section-title" style="margin-top: 50px;">武器库</h2>
                <div class="grid grid-4">
                    <div v-for="weapon in weapons" :key="weapon.id" class="weapon-card">
                        <div class="icon">🔫</div>
                        <h4>{{ weapon.name }}</h4>
                        <div class="stats">
                            <span>伤害: {{ weapon.damage }}</span>
                            <span>弹夹: {{ weapon.magazine_size }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="showMapSelect" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>选择地图开始游戏</h3>
                        <button class="close" @click="showMapSelect = false">&times;</button>
                    </div>
                    <div class="grid grid-2">
                        <div v-for="map in maps" :key="map.id" class="map-card" @click="startGame(map)">
                            <div class="thumbnail">🗺️</div>
                            <div class="info">
                                <h3>{{ map.name }}</h3>
                                <p>{{ map.description }}</p>
                            </div>
                        </div>
                    </div>
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
        const maps = ref([]);
        const weapons = ref([]);
        const showDropdown = ref(false);
        const showMapSelect = ref(false);
        const selectedMap = ref(null);
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

        const loadMaps = async () => {
            const res = await API.map.getList(0, 10);
            if (res.code === 200) {
                maps.value = res.data || [];
            }
        };

        const loadWeapons = async () => {
            const res = await API.weapon.getList(0, 10);
            if (res.code === 200) {
                weapons.value = res.data || [];
            }
        };

        const selectMap = (map) => {
            selectedMap.value = map;
            showMapSelect.value = true;
        };

        const startGame = (map) => {
            Storage.set('selected_map', map);
            router.push('/game');
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
            loadMaps();
            loadWeapons();
        });

        return {
            user, maps, weapons, showDropdown, showMapSelect, selectedMap,
            toast,
            selectMap, startGame, goAdmin, handleLogout
        };
    }
};
