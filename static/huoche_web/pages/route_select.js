const RouteSelectPage = {
    props: ['user', 'userGame'],
    setup(props) {
        const routes = ref([]);
        const trains = ref([]);
        const selectedRoute = ref(null);
        const selectedTrain = ref(null);
        const loading = ref(true);
        const starting = ref(false);

        const loadData = async () => {
            loading.value = true;
            
            const [routesResult, userInfoResult] = await Promise.all([
                API.huoche.getRoutes(),
                API.huoche.getUserInfo()
            ]);

            if (routesResult.code === 0) {
                routes.value = routesResult.data.routes || [];
            }
            
            if (userInfoResult.code === 0) {
                trains.value = userInfoResult.data.trains || [];
                if (trains.value.length > 0) {
                    selectedTrain.value = trains.value[0];
                }
            }
            
            loading.value = false;
        };

        const selectRoute = (route) => {
            if (isLocked(route)) return;
            selectedRoute.value = route;
        };

        const selectTrain = (train) => {
            selectedTrain.value = train;
        };

        const isLocked = (route) => {
            return route.unlock_level > (props.userGame?.level || 1);
        };

        const getRouteIcon = (code) => {
            switch (code) {
                case 'countryside': return '🌾';
                case 'mountain': return '⛰️';
                case 'coastal': return '🌊';
                case 'intercity': return '🏙️';
                case 'snow': return '❄️';
                default: return '🗺️';
            }
        };

        const getDifficultyStars = (difficulty) => {
            return '⭐'.repeat(difficulty);
        };

        const startGame = async () => {
            if (!selectedRoute.value) {
                alert('请选择一条线路');
                return;
            }
            if (!selectedTrain.value) {
                alert('请选择一辆火车');
                return;
            }

            starting.value = true;
            const result = await API.huoche.startGame(selectedTrain.value.id, selectedRoute.value.id);
            starting.value = false;

            if (result.code === 0) {
                Router.navigate('game', { 
                    gameData: result.data,
                    train: selectedTrain.value,
                    route: selectedRoute.value
                });
            } else {
                alert(result.message || '开始游戏失败');
            }
        };

        onMounted(() => {
            loadData();
        });

        return {
            routes,
            trains,
            selectedRoute,
            selectedTrain,
            loading,
            starting,
            selectRoute,
            selectTrain,
            isLocked,
            getRouteIcon,
            getDifficultyStars,
            startGame
        };
    },
    template: `
        <div class="page">
            <navbar-component 
                :user="user" 
                :userGame="userGame" 
                currentPage="route_select"
                @logout="$emit('logout')"
            />
            
            <div class="page-container" style="margin-top: 30px;">
                <div class="shop-header">
                    <h1>🗺️ 选择线路</h1>
                    <p>选择一条线路开始你的驾驶之旅！</p>
                </div>

                <div class="my-trains-section">
                    <h2 class="section-title">
                        <span>🚆</span> 选择火车
                    </h2>
                    
                    <div v-if="trains.length === 0" style="text-align: center; padding: 40px;">
                        <p>你还没有火车</p>
                    </div>
                    
                    <div v-else class="trains-grid">
                        <div 
                            v-for="train in trains" 
                            :key="train.id"
                            :class="['train-card', { selected: selectedTrain?.id === train.id }]"
                            @click="selectTrain(train)"
                        >
                            <div class="train-card-header">
                                <span class="train-icon">
                                    {{ train.type_code === 'steam' ? '🚂' : train.type_code === 'electric' ? '🚆' : '🚄' }}
                                </span>
                                <span :class="['train-badge', train.type_code]">
                                    {{ train.type_name }}
                                </span>
                            </div>
                            <div class="train-name">{{ train.name }}</div>
                            <div class="train-stats">
                                <div class="stat-item">
                                    <span class="stat-label">最高速度</span>
                                    <span class="stat-value">{{ train.max_speed }} km/h</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">容量</span>
                                    <span class="stat-value">{{ train.base_capacity }} 人</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 class="section-title" style="color: white; margin-top: 30px;">
                    <span>🛤️</span> 选择线路
                </h2>

                <div v-if="loading" style="text-align: center; padding: 60px; color: white;">
                    加载中...
                </div>

                <div v-else class="routes-grid">
                    <div 
                        v-for="route in routes" 
                        :key="route.id"
                        :class="['route-card', { locked: isLocked(route), selected: selectedRoute?.id === route.id }]"
                        @click="selectRoute(route)"
                    >
                        <div :class="['route-image', route.code]">
                            {{ getRouteIcon(route.code) }}
                            <div class="route-difficulty">
                                <span v-for="i in 5" :key="i" class="difficulty-star">
                                    {{ i <= route.difficulty ? '★' : '☆' }}
                                </span>
                            </div>
                        </div>
                        <div class="route-info">
                            <h3 class="route-name">
                                {{ route.name }}
                                <span v-if="isLocked(route)" style="color: #ef4444; font-size: 14px;">
                                    🔒 需要等级 {{ route.unlock_level }}
                                </span>
                            </h3>
                            <p class="route-description">{{ route.description }}</p>
                            
                            <div class="route-details">
                                <div class="route-detail-item">
                                    <div class="route-detail-label">距离</div>
                                    <div class="route-detail-value">{{ route.distance }} km</div>
                                </div>
                                <div class="route-detail-item">
                                    <div class="route-detail-label">预计时间</div>
                                    <div class="route-detail-value">{{ route.estimated_time }} 分钟</div>
                                </div>
                                <div class="route-detail-item">
                                    <div class="route-detail-label">风景</div>
                                    <div class="route-detail-value">{{ route.scenery_type }}</div>
                                </div>
                            </div>

                            <div class="route-reward">
                                <div class="reward-item coin">
                                    💰 {{ route.base_reward }}
                                </div>
                                <div class="reward-item exp">
                                    ✨ {{ route.base_exp }} EXP
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <button 
                        class="btn btn-success" 
                        style="width: auto; padding: 15px 60px; font-size: 20px;"
                        :disabled="!selectedRoute || !selectedTrain || starting"
                        @click="startGame"
                    >
                        {{ starting ? '准备中...' : '🚀 开始驾驶' }}
                    </button>
                </div>
            </div>
        </div>
    `
};
