(function() {
const { ref, onMounted } = Vue;

const StatisticsPage = {
    template: `
        <div class="statistics-page">
            <div v-if="loading" class="empty-state">
                <div class="empty-icon">⏳</div>
                <div class="empty-text">加载中...</div>
            </div>

            <template v-else>
                <div class="stats-card">
                    <div class="stats-card-header">
                        <span class="stats-card-icon">📊</span>
                        <span class="stats-card-title">总体概览</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-box-value">{{ statistics.total_checkins || 0 }}</div>
                            <div class="stat-box-label">总打卡次数</div>
                        </div>
                        <div class="stat-box orange">
                            <div class="stat-box-value">{{ statistics.completed_count || 0 }}</div>
                            <div class="stat-box-label">完成任务数</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-value">{{ statistics.completion_rate || 0 }}%</div>
                            <div class="stat-box-label">完成率</div>
                        </div>
                        <div class="stat-box orange">
                            <div class="stat-box-value">{{ statistics.active_days || 0 }}</div>
                            <div class="stat-box-label">活跃天数</div>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-header">
                        <span class="stats-card-icon">🔥</span>
                        <span class="stats-card-title">连续打卡</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-box-value">{{ statistics.current_streak || 0 }}</div>
                            <div class="stat-box-label">当前连续</div>
                        </div>
                        <div class="stat-box orange">
                            <div class="stat-box-value">{{ statistics.max_streak || 0 }}</div>
                            <div class="stat-box-label">最长连续</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-box-value">Lv.{{ statistics.level || 1 }}</div>
                            <div class="stat-box-label">当前等级</div>
                        </div>
                        <div class="stat-box orange">
                            <div class="stat-box-value">{{ statistics.points || 0 }}</div>
                            <div class="stat-box-label">累计积分</div>
                        </div>
                    </div>
                </div>

                <div class="stats-card">
                    <div class="stats-card-header">
                        <span class="stats-card-icon">💡</span>
                        <span class="stats-card-title">打卡小贴士</span>
                    </div>
                    <div style="padding: 16px; background: var(--pale-green); border-radius: var(--radius-md);">
                        <div v-for="(tip, index) in tips" :key="index" style="margin-bottom: 12px;">
                            <div style="font-weight: 500; color: var(--primary-green); margin-bottom: 4px;">
                                {{ tip.title }}
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary);">
                                {{ tip.content }}
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    `,
    setup() {
        const statistics = ref({});
        const loading = ref(true);
        
        const tips = [
            {
                title: '早起打卡',
                content: '早起是自律的第一步，建议在7点前完成打卡，开启充满活力的一天！'
            },
            {
                title: '喝水提醒',
                content: '每天喝8杯水（约2000ml），每隔2小时喝一杯，保持身体水分充足。'
            },
            {
                title: '运动健身',
                content: '每周至少运动3次，每次30分钟以上，有氧运动和力量训练结合效果更佳。'
            },
            {
                title: '冥想练习',
                content: '每天早上冥想10分钟，可以提高专注力，减轻压力，改善睡眠质量。'
            }
        ];

        const loadStatistics = async () => {
            loading.value = true;
            try {
                const result = await Api.record.getStatistics();
                if (result.code === 0) {
                    statistics.value = result.data;
                }
            } catch (e) {
                console.error(e);
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            loadStatistics();
        });

        return {
            statistics,
            loading,
            tips
        };
    }
};

window.StatisticsPage = StatisticsPage;
})();
