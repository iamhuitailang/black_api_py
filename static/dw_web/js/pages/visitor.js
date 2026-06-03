const VisitorPage = {
    template: `
    <div>
        <div class="section-header">
            <span class="section-title">👥 游客管理</span>
        </div>

        <div v-if="loading" class="loading-page">👥</div>
        <div v-else>
            <div class="dashboard-stats">
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">👥</div>
                    <div class="dashboard-stat-value">{{ stats.todayVisitors || 0 }}</div>
                    <div class="dashboard-stat-label">今日游客</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">🪙</div>
                    <div class="dashboard-stat-value">{{ formatNumber(stats.todayIncome || 0) }}</div>
                    <div class="dashboard-stat-label">今日收入</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">📊</div>
                    <div class="dashboard-stat-value">{{ stats.totalVisitors || 0 }}</div>
                    <div class="dashboard-stat-label">累计游客</div>
                </div>
                <div class="dashboard-stat">
                    <div class="dashboard-stat-icon">💰</div>
                    <div class="dashboard-stat-value">{{ formatNumber(stats.totalIncome || 0) }}</div>
                    <div class="dashboard-stat-label">累计收入</div>
                </div>
            </div>

            <div class="visitor-chart">
                <div class="card-title" style="margin-bottom: 12px;">📈 近7日游客趋势</div>
                <div class="chart-bar">
                    <div v-for="(day, idx) in chartData" :key="idx" class="chart-col">
                        <div class="chart-value">{{ day.count }}</div>
                        <div class="chart-fill" :style="{ height: day.height + 'px' }"></div>
                        <div class="chart-label">{{ day.label }}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-header">
                    <span class="card-title">⭐ 满意度分析</span>
                </div>
                <div class="card-body" style="text-align: center;">
                    <div class="satisfaction-ring" :style="satisfactionStyle">
                        {{ satisfaction.percent || 0 }}%
                    </div>
                    <div style="margin-top: 12px; text-align: left;">
                        <div v-for="(item, idx) in satisfaction.breakdown" :key="idx" style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                            <span style="width: 24px; text-align: center;">{{ item.icon }}</span>
                            <span style="flex: 1; font-size: 13px;">{{ item.name }}</span>
                            <div style="flex: 2;">
                                <div class="progress-bar"><div class="progress-fill" :class="item.cls" :style="{ width: item.value + '%' }"></div></div>
                            </div>
                            <span style="width: 40px; text-align: right; font-size: 13px;">{{ item.value }}%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 12px;">
                <div class="card-header">
                    <span class="card-title">🎫 门票设置</span>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label">门票价格</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="number" class="form-control" v-model.number="ticketPrice" min="1" max="100" style="flex: 1;">
                            <button class="btn btn-primary btn-sm" @click="updateTicketPrice">确认</button>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                            💡 价格越高收入越多，但游客可能减少
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const loading = ref(true);
        const stats = reactive({ todayVisitors: 0, todayIncome: 0, totalVisitors: 0, totalIncome: 0 });
        const chartData = ref([]);
        const ticketPrice = ref(10);
        const satisfaction = reactive({
            percent: 0,
            breakdown: []
        });

        const satisfactionStyle = computed(() => {
            const p = satisfaction.percent || 0;
            let color = '#ef4444';
            if (p >= 80) color = '#22c55e';
            else if (p >= 50) color = '#f59e0b';
            return {
                background: `conic-gradient(${color} ${p * 3.6}deg, #e5e7eb ${p * 3.6}deg)`,
                color: color
            };
        });

        function formatNumber(n) { return DwUtils.formatNumber(n); }

        async function loadData() {
            loading.value = true;
            try {
                const [statsRes, satRes] = await Promise.all([
                    DwApi.visitor.getStats(),
                    DwApi.visitor.getSatisfaction()
                ]);
                if (statsRes.code === 0 && statsRes.data) {
                    stats.todayVisitors = statsRes.data.todayVisitors || 0;
                    stats.todayIncome = statsRes.data.todayIncome || 0;
                    stats.totalVisitors = statsRes.data.totalVisitors || 0;
                    stats.totalIncome = statsRes.data.totalIncome || 0;
                    ticketPrice.value = statsRes.data.ticketPrice || 10;
                    const daily = statsRes.data.daily || [];
                    const maxCount = Math.max(...daily.map(d => d.count || 0), 1);
                    chartData.value = daily.map(d => ({
                        count: d.count || 0,
                        height: Math.max(4, ((d.count || 0) / maxCount) * 100),
                        label: d.label || ''
                    }));
                    if (chartData.value.length === 0) {
                        const days = ['一', '二', '三', '四', '五', '六', '日'];
                        chartData.value = days.map(d => ({ count: 0, height: 4, label: d }));
                    }
                }
                if (satRes.code === 0 && satRes.data) {
                    satisfaction.percent = satRes.data.percent || 0;
                    satisfaction.breakdown = satRes.data.breakdown || [
                        { icon: '🦁', name: '动物多样', value: 80, cls: 'health' },
                        { icon: '🏡', name: '栖息环境', value: 70, cls: 'hunger' },
                        { icon: '🧹', name: '清洁卫生', value: 60, cls: 'happiness' },
                        { icon: '🎭', name: '娱乐设施', value: 50, cls: 'clean' }
                    ];
                }
            } catch (e) {
                DwUtils.showToast('加载失败', 'error');
            } finally {
                loading.value = false;
            }
        }

        async function updateTicketPrice() {
            try {
                const zooRes = await DwApi.zoo.update({ ticket_price: ticketPrice.value });
                if (zooRes.code === 0) {
                    DwUtils.showToast(`门票已设为 ${ticketPrice.value} 🪙`, 'success');
                } else {
                    DwUtils.showToast(zooRes.msg || '设置失败', 'error');
                }
            } catch (e) {
                DwUtils.showToast('设置失败', 'error');
            }
        }

        onMounted(() => { loadData(); });

        return { loading, stats, chartData, ticketPrice, satisfaction, satisfactionStyle, formatNumber, updateTicketPrice };
    }
};
