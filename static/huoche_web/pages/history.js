const HistoryPage = {
    props: ['user'],
    setup(props) {
        const history = ref([]);
        const loading = ref(true);

        const loadHistory = async () => {
            loading.value = true;
            const result = await API.huoche.getGameHistory(50);
            if (result.code === 0) {
                history.value = result.data || [];
            }
            loading.value = false;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            return date.toLocaleDateString('zh-CN');
        };

        const getGradeColor = (grade) => {
            const colors = {
                'S': '#fbbf24',
                'A': '#22c55e',
                'B': '#3b82f6',
                'C': '#6b7280',
                'D': '#f97316',
                'F': '#ef4444'
            };
            return colors[grade] || '#6b7280';
        };

        onMounted(() => {
            loadHistory();
        });

        return {
            history,
            loading,
            formatDate,
            getGradeColor
        };
    },
    template: `
        <div class="page">
            <navbar-component 
                :user="user" 
                :userGame="null"
                currentPage="history"
                @logout="$emit('logout')"
            />
            
            <div class="page-container" style="margin-top: 30px;">
                <div class="shop-header">
                    <h1>📊 历史记录</h1>
                    <p>查看你的驾驶记录和成绩</p>
                </div>

                <div v-if="loading" style="text-align: center; padding: 60px; color: white;">
                    加载中...
                </div>

                <div v-else-if="history.length === 0" style="text-align: center; padding: 60px; color: white;">
                    <p>暂无游戏记录</p>
                    <p style="margin-top: 20px; opacity: 0.8;">快去开始你的第一次驾驶吧！</p>
                </div>

                <div v-else class="history-list">
                    <div 
                        v-for="record in history" 
                        :key="record.id" 
                        class="history-item"
                    >
                        <div class="history-grade" :style="{ color: getGradeColor(record.grade) }">
                            {{ record.grade }}
                        </div>
                        <div class="history-info">
                            <h4>{{ record.train_name }} - {{ record.route_name }}</h4>
                            <p>{{ formatDate(record.created_at) }}</p>
                        </div>
                        <div class="history-stats">
                            <div class="history-stat">
                                <div class="history-stat-label">距离</div>
                                <div class="history-stat-value">{{ record.distance?.toFixed(1) || 0 }} km</div>
                            </div>
                            <div class="history-stat">
                                <div class="history-stat-label">用时</div>
                                <div class="history-stat-value">{{ record.actual_duration || 0 }}s</div>
                            </div>
                            <div class="history-stat">
                                <div class="history-stat-label">乘客</div>
                                <div class="history-stat-value">{{ record.passengers_transported || 0 }}</div>
                            </div>
                        </div>
                        <div class="history-score">{{ record.score || 0 }}</div>
                        <div class="history-date">
                            💰 {{ record.coins_earned || 0 }}<br/>
                            ✨ {{ record.exp_earned || 0 }} EXP
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
