const TrainShopPage = {
    props: ['user', 'userGame'],
    emits: ['refresh'],
    setup(props, { emit }) {
        const trainTypes = ref([]);
        const loading = ref(true);
        const buying = ref(false);

        const loadTrainTypes = async () => {
            loading.value = true;
            const result = await API.huoche.getTrainTypes();
            if (result.code === 0) {
                trainTypes.value = result.data || [];
            }
            loading.value = false;
        };

        const buyTrain = async (trainType) => {
            if (trainType.unlock_level > (props.userGame?.level || 1)) {
                alert(`需要达到等级 ${trainType.unlock_level} 才能购买此火车`);
                return;
            }

            if (trainType.base_price > (props.userGame?.coins || 0)) {
                alert('金币不足');
                return;
            }

            const trainName = prompt('给你的新火车起个名字吧：', trainType.name);
            if (trainName === null) return;

            buying.value = true;
            const result = await API.huoche.buyTrain(trainType.id, trainName || trainType.name);
            buying.value = false;

            if (result.code === 0) {
                alert('购买成功！');
                emit('refresh');
            } else {
                alert(result.message || '购买失败');
            }
        };

        const isLocked = (trainType) => {
            return trainType.unlock_level > (props.userGame?.level || 1);
        };

        const getTrainIcon = (typeCode) => {
            switch (typeCode) {
                case 'steam': return '🚂';
                case 'electric': return '🚆';
                case 'highspeed': return '🚄';
                default: return '🚃';
            }
        };

        onMounted(() => {
            loadTrainTypes();
        });

        return {
            trainTypes,
            loading,
            buying,
            buyTrain,
            isLocked,
            getTrainIcon
        };
    },
    template: `
        <div class="page">
            <navbar-component 
                :user="user" 
                :userGame="userGame" 
                currentPage="train_shop"
                @logout="$emit('logout')"
            />
            
            <div class="page-container" style="margin-top: 30px;">
                <div class="shop-header">
                    <h1>🛒 火车商店</h1>
                    <p>选择适合你的火车，开始驾驶之旅！</p>
                </div>

                <div v-if="loading" style="text-align: center; padding: 60px; color: white;">
                    加载中...
                </div>

                <div v-else class="shop-grid">
                    <div v-for="trainType in trainTypes" :key="trainType.id" class="shop-item">
                        <div :class="['shop-item-image', trainType.type_code]">
                            {{ getTrainIcon(trainType.type_code) }}
                        </div>
                        <div class="shop-item-content">
                            <h3 class="shop-item-name">{{ trainType.name }}</h3>
                            <p class="shop-item-description">{{ trainType.description }}</p>
                            
                            <div class="shop-item-stats">
                                <div class="stat-item">
                                    <span class="stat-label">基础速度</span>
                                    <span class="stat-value">{{ trainType.base_speed }} km/h</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">最高速度</span>
                                    <span class="stat-value">{{ trainType.max_speed }} km/h</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">容量</span>
                                    <span class="stat-value">{{ trainType.capacity }} 人</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">可靠性</span>
                                    <span class="stat-value">{{ (trainType.reliability * 100).toFixed(0) }}%</span>
                                </div>
                            </div>

                            <div class="shop-item-footer">
                                <div>
                                    <div class="shop-item-price">
                                        💰 {{ trainType.base_price === 0 ? '免费' : trainType.base_price }}
                                    </div>
                                    <div :class="['shop-item-unlock', { locked: isLocked(trainType) }]">
                                        {{ isLocked(trainType) ? '🔒 需要等级 ' + trainType.unlock_level : '✅ 可购买' }}
                                    </div>
                                </div>
                                <button 
                                    class="btn btn-primary" 
                                    style="width: auto;"
                                    :disabled="isLocked(trainType) || buying"
                                    @click="buyTrain(trainType)"
                                >
                                    {{ buying ? '购买中...' : '购买' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
