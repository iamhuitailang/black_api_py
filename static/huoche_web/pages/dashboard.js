const DashboardPage = {
    props: ['user', 'userGame'],
    emits: ['refresh'],
    setup(props, { emit }) {
        const trains = ref([]);
        const loading = ref(true);
        const selectedTrain = ref(null);

        const loadData = async () => {
            loading.value = true;
            const result = await API.huoche.getUserInfo();
            if (result.code === 0) {
                trains.value = result.data.trains || [];
                if (trains.value.length > 0) {
                    selectedTrain.value = trains.value[0];
                }
            }
            loading.value = false;
        };

        const selectTrain = (train) => {
            selectedTrain.value = train;
        };

        const goToRouteSelect = () => {
            if (selectedTrain.value) {
                Router.navigate('route_select', { trainId: selectedTrain.value.id });
            } else {
                alert('请先选择一辆火车');
            }
        };

        const goToTrainShop = () => {
            Router.navigate('train_shop');
        };

        const goToHistory = () => {
            Router.navigate('history');
        };

        onMounted(() => {
            loadData();
        });

        return {
            trains,
            loading,
            selectedTrain,
            selectTrain,
            goToRouteSelect,
            goToTrainShop,
            goToHistory
        };
    },
    template: `
        <div class="page">
            <navbar-component 
                :user="user" 
                :userGame="userGame" 
                currentPage="dashboard"
                @logout="$emit('logout')"
            />
            
            <div class="page-container" style="margin-top: 30px;">
                <div class="dashboard-header">
                    <h1>🚂 火车司机</h1>
                    <p>欢迎回来，{{ user?.username }}！准备好开始今天的驾驶任务了吗？</p>
                </div>

                <div class="dashboard-grid">
                    <div class="action-card" @click="goToRouteSelect">
                        <div class="icon">🚀</div>
                        <h3>开始驾驶</h3>
                        <p>选择线路，开始你的火车驾驶之旅</p>
                    </div>
                    <div class="action-card" @click="goToTrainShop">
                        <div class="icon">🛒</div>
                        <h3>火车商店</h3>
                        <p>购买新火车或升级现有火车</p>
                    </div>
                    <div class="action-card" @click="goToHistory">
                        <div class="icon">📊</div>
                        <h3>历史记录</h3>
                        <p>查看你的驾驶记录和成绩</p>
                    </div>
                </div>

                <div class="my-trains-section">
                    <h2 class="section-title">
                        <span>🚆</span> 我的火车
                    </h2>
                    
                    <div v-if="loading" style="text-align: center; padding: 40px;">
                        加载中...
                    </div>
                    
                    <div v-else-if="trains.length === 0" style="text-align: center; padding: 40px;">
                        <p>你还没有火车，快去火车商店购买吧！</p>
                        <button class="btn btn-primary" style="width: auto; margin-top: 20px;" @click="goToTrainShop">
                            去商店
                        </button>
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
                                <div class="stat-item">
                                    <span class="stat-label">速度等级</span>
                                    <span class="stat-value">Lv.{{ train.speed_level }}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">容量等级</span>
                                    <span class="stat-value">Lv.{{ train.capacity_level }}</span>
                                </div>
                            </div>
                            <div class="train-level">
                                <span class="level-text">等级 Lv.{{ train.level }}</span>
                                <span>经验: {{ train.experience }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedTrain" style="margin-top: 30px; text-align: center;">
                        <button class="btn btn-success" style="width: auto; padding: 15px 50px; font-size: 18px;" @click="goToRouteSelect">
                            🚀 开始驾驶
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
};
