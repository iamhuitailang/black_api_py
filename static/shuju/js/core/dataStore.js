const DataStore = {
    currentSource: 'default',
    listeners: [],
    cachedData: null,

    defaultData: {
        kpi: [
            {
                id: 'kpi_1',
                title: '总销售额',
                value: 1289500,
                change: 12.5,
                changeType: 'positive',
                icon: '💰',
                trend: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 68000, 75000, 82000, 78000, 85000]
            },
            {
                id: 'kpi_2',
                title: '活跃用户',
                value: 85620,
                change: 8.3,
                changeType: 'positive',
                icon: '👥',
                trend: [32000, 35000, 38000, 42000, 45000, 48000, 52000, 58000, 65000, 72000, 78000, 85620]
            },
            {
                id: 'kpi_3',
                title: '转化率',
                value: 4.8,
                unit: '%',
                change: -2.1,
                changeType: 'negative',
                icon: '📈',
                trend: [5.2, 5.8, 6.1, 5.5, 5.2, 4.8, 4.5, 4.3, 4.6, 4.9, 5.1, 4.8]
            },
            {
                id: 'kpi_4',
                title: '订单量',
                value: 15680,
                change: 15.2,
                changeType: 'positive',
                icon: '📦',
                trend: [8200, 8800, 9200, 8500, 9800, 10200, 11500, 12800, 13200, 14100, 14800, 15680]
            }
        ],
        lineChart: {
            title: '销售趋势',
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            datasets: [
                {
                    label: '销售额',
                    data: [45000, 52000, 48000, 61000, 55000, 67000, 72000, 68000, 75000, 82000, 78000, 85000],
                    color: '#00f5ff'
                },
                {
                    label: '订单数',
                    data: [35000, 42000, 38000, 51000, 45000, 57000, 62000, 58000, 65000, 72000, 68000, 75000],
                    color: '#8b5cf6'
                }
            ]
        },
        barChart: {
            title: '渠道对比',
            labels: ['官网', 'App', '小程序', '第三方', '线下', '其他'],
            datasets: [
                {
                    label: '销售额',
                    data: [320000, 450000, 280000, 150000, 85000, 4500],
                    colors: ['#00f5ff', '#8b5cf6', '#f472b6', '#10b981', '#f59e0b', '#ef4444']
                }
            ]
        },
        pieChart: {
            title: '分类占比',
            data: [
                { label: '电子产品', value: 35, color: '#00f5ff' },
                { label: '服装配饰', value: 25, color: '#8b5cf6' },
                { label: '家居用品', value: 18, color: '#f472b6' },
                { label: '食品饮料', value: 12, color: '#10b981' },
                { label: '其他', value: 10, color: '#f59e0b' }
            ]
        },
        areaChart: {
            title: '用户增长趋势',
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
            datasets: [
                {
                    label: '新用户',
                    data: [5000, 8000, 12000, 15000, 18000, 22000, 28000, 32000],
                    color: '#00f5ff'
                },
                {
                    label: '活跃用户',
                    data: [35000, 38000, 42000, 48000, 55000, 62000, 70000, 85620],
                    color: '#8b5cf6'
                }
            ]
        },
        funnelChart: {
            title: '转化漏斗',
            stages: [
                { name: '访问量', value: 100000, rate: 100 },
                { name: '浏览量', value: 85000, rate: 85 },
                { name: '加购', value: 45000, rate: 52.9 },
                { name: '下单', value: 25000, rate: 55.6 },
                { name: '支付', value: 18000, rate: 72 },
                { name: '完成', value: 15680, rate: 87.1 }
            ]
        }
    },

    salesData: {
        kpi: [
            {
                id: 'kpi_1',
                title: '月销售额',
                value: 985200,
                change: 18.7,
                changeType: 'positive',
                icon: '💰',
                trend: [65000, 72000, 68000, 75000, 82000, 78000, 85000, 92000, 88000, 95000, 102000, 985200]
            },
            {
                id: 'kpi_2',
                title: '客单价',
                value: 385,
                change: -3.2,
                changeType: 'negative',
                icon: '💎',
                trend: [420, 415, 410, 405, 400, 395, 398, 392, 388, 390, 387, 385]
            },
            {
                id: 'kpi_3',
                title: '复购率',
                value: 28.5,
                unit: '%',
                change: 5.8,
                changeType: 'positive',
                icon: '🔄',
                trend: [18, 19.5, 21, 22.5, 23.8, 24.5, 25.2, 26, 26.8, 27.5, 28.2, 28.5]
            },
            {
                id: 'kpi_4',
                title: '退货率',
                value: 3.2,
                unit: '%',
                change: -15.8,
                changeType: 'positive',
                icon: '📉',
                trend: [5.2, 4.8, 4.5, 4.2, 4.0, 3.8, 3.6, 3.5, 3.4, 3.3, 3.25, 3.2]
            }
        ],
        lineChart: {
            title: '销售趋势',
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            datasets: [
                {
                    label: '线上销售',
                    data: [52000, 58000, 62000, 68000, 72000, 78000, 82000, 88000, 92000, 98000, 105000, 112000],
                    color: '#00f5ff'
                },
                {
                    label: '线下销售',
                    data: [45000, 48000, 52000, 55000, 58000, 62000, 65000, 68000, 72000, 75000, 78000, 82000],
                    color: '#8b5cf6'
                },
                {
                    label: '促销销售',
                    data: [12000, 15000, 18000, 22000, 28000, 35000, 42000, 48000, 52000, 58000, 62000, 68000],
                    color: '#f472b6'
                }
            ]
        },
        barChart: {
            title: '产品类别对比',
            labels: ['手机', '电脑', '配件', '家电', '智能穿戴', '家居'],
            datasets: [
                {
                    label: '销售额',
                    data: [520000, 380000, 120000, 85000, 65000, 35000],
                    colors: ['#00f5ff', '#8b5cf6', '#f472b6', '#10b981', '#f59e0b', '#ef4444']
                }
            ]
        },
        pieChart: {
            title: '销售渠道占比',
            data: [
                { label: '天猫', value: 38, color: '#00f5ff' },
                { label: '京东', value: 25, color: '#8b5cf6' },
                { label: '拼多多', value: 15, color: '#f472b6' },
                { label: '抖音', value: 12, color: '#10b981' },
                { label: '其他', value: 10, color: '#f59e0b' }
            ]
        },
        areaChart: {
            title: '销售趋势对比',
            labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            datasets: [
                {
                    label: '本周',
                    data: [15000, 18000, 22000, 20000, 25000, 42000, 38000],
                    color: '#00f5ff'
                },
                {
                    label: '上周',
                    data: [12000, 15000, 18000, 16000, 20000, 35000, 32000],
                    color: '#8b5cf6'
                }
            ]
        },
        funnelChart: {
            title: '销售转化漏斗',
            stages: [
                { name: '商品曝光', value: 500000, rate: 100 },
                { name: '点击进入', value: 150000, rate: 30 },
                { name: '商品详情', value: 80000, rate: 53.3 },
                { name: '加入购物车', value: 40000, rate: 50 },
                { name: '提交订单', value: 18000, rate: 45 },
                { name: '支付成功', value: 15680, rate: 87.1 }
            ]
        }
    },

    userData: {
        kpi: [
            {
                id: 'kpi_1',
                title: '注册用户',
                value: 258620,
                change: 22.3,
                changeType: 'positive',
                icon: '👥',
                trend: [120000, 135000, 148000, 162000, 175000, 188000, 202000, 215000, 228000, 238000, 248000, 258620]
            },
            {
                id: 'kpi_2',
                title: '日活用户',
                value: 45280,
                change: 12.8,
                changeType: 'positive',
                icon: '☀️',
                trend: [28000, 30000, 32000, 34000, 35000, 36000, 37500, 39000, 40500, 42000, 43800, 45280]
            },
            {
                id: 'kpi_3',
                title: '平均使用时长',
                value: 28,
                unit: '分钟',
                change: 8.5,
                changeType: 'positive',
                icon: '⏱️',
                trend: [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 27.5, 28]
            },
            {
                id: 'kpi_4',
                title: '用户流失率',
                value: 5.8,
                unit: '%',
                change: -8.2,
                changeType: 'positive',
                icon: '🚪',
                trend: [8.5, 8.2, 7.8, 7.5, 7.2, 7.0, 6.8, 6.5, 6.3, 6.1, 5.9, 5.8]
            }
        ],
        lineChart: {
            title: '用户增长趋势',
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
            datasets: [
                {
                    label: '新增用户',
                    data: [8000, 12000, 15000, 18000, 22000, 25000, 28000, 32000, 35000, 38000, 42000, 45000],
                    color: '#00f5ff'
                },
                {
                    label: '流失用户',
                    data: [3000, 3500, 3800, 4000, 4200, 4300, 4500, 4600, 4700, 4800, 4850, 4900],
                    color: '#ef4444'
                }
            ]
        },
        barChart: {
            title: '用户渠道分布',
            labels: ['自然流量', '广告投放', '社交分享', '推荐奖励', '线下活动', '其他'],
            datasets: [
                {
                    label: '用户数',
                    data: [85000, 62000, 48000, 35000, 22000, 6620],
                    colors: ['#00f5ff', '#8b5cf6', '#f472b6', '#10b981', '#f59e0b', '#ef4444']
                }
            ]
        },
        pieChart: {
            title: '用户活跃度分布',
            data: [
                { label: '高频活跃', value: 35, color: '#00f5ff' },
                { label: '中频活跃', value: 28, color: '#8b5cf6' },
                { label: '低频活跃', value: 20, color: '#f472b6' },
                { label: '休眠用户', value: 17, color: '#f59e0b' }
            ]
        },
        areaChart: {
            title: '用户活跃度趋势',
            labels: ['0-6', '6-12', '12-18', '18-24'],
            datasets: [
                {
                    label: '工作日',
                    data: [5000, 15000, 35000, 28000],
                    color: '#00f5ff'
                },
                {
                    label: '周末',
                    data: [8000, 22000, 45000, 38000],
                    color: '#8b5cf6'
                }
            ]
        },
        funnelChart: {
            title: '用户转化漏斗',
            stages: [
                { name: '访问', value: 100000, rate: 100 },
                { name: '注册', value: 25000, rate: 25 },
                { name: '完善资料', value: 18000, rate: 72 },
                { name: '首次操作', value: 12000, rate: 66.7 },
                { name: '连续活跃', value: 8000, rate: 66.7 },
                { name: '付费转化', value: 2500, rate: 31.25 }
            ]
        }
    },

    init() {
        this.currentSource = Storage.get('dataSource', 'default');
        this.cachedData = this.getData();
        return this;
    },

    getData() {
        switch (this.currentSource) {
            case 'sales':
                return this.salesData;
            case 'user':
                return this.userData;
            case 'default':
            default:
                return this.defaultData;
        }
    },

    setSource(source) {
        this.currentSource = source;
        Storage.set('dataSource', source);
        this.cachedData = this.getData();
        this.notifyListeners();
    },

    getCurrentSource() {
        return this.currentSource;
    },

    getKPI() {
        return this.cachedData?.kpi || [];
    },

    getLineChartData() {
        return this.cachedData?.lineChart || null;
    },

    getBarChartData() {
        return this.cachedData?.barChart || null;
    },

    getPieChartData() {
        return this.cachedData?.pieChart || null;
    },

    getAreaChartData() {
        return this.cachedData?.areaChart || null;
    },

    getFunnelChartData() {
        return this.cachedData?.funnelChart || null;
    },

    getDrillData(chartType, dataIndex) {
        const drillData = {
            lineChart: this.generateLineChartDrillData,
            barChart: this.generateBarChartDrillData,
            pieChart: this.generatePieChartDrillData,
            areaChart: this.generateAreaChartDrillData,
            funnelChart: this.generateFunnelChartDrillData
        };

        const generator = drillData[chartType];
        if (generator) {
            return generator.call(this, dataIndex);
        }
        return null;
    },

    generateLineChartDrillData(dataIndex) {
        const data = this.getLineChartData();
        if (!data) return null;

        const label = data.labels[dataIndex] || '未知';
        const details = data.datasets.map(ds => ({
            dataset: ds.label,
            value: ds.data[dataIndex] || 0,
            color: ds.color
        }));

        return {
            title: `${label} 销售详情`,
            summary: [
                { label: '总销售额', value: DateUtils.formatCurrency(Helpers.sum(details.map(d => d.value))) },
                { label: '最高', value: DateUtils.formatCurrency(Helpers.max(details.map(d => d.value))) },
                { label: '最低', value: DateUtils.formatCurrency(Helpers.min(details.map(d => d.value))) }
            ],
            tableData: {
                headers: ['数据系列', '数值', '占比'],
                rows: details.map(d => [
                    d.dataset,
                    DateUtils.formatCurrency(d.value),
                    DateUtils.formatPercent(d.value / Helpers.sum(details.map(x => x.value)))
                ])
            }
        };
    },

    generateBarChartDrillData(dataIndex) {
        const data = this.getBarChartData();
        if (!data) return null;

        const label = data.labels[dataIndex] || '未知';
        const dataset = data.datasets[0];
        const value = dataset.data[dataIndex] || 0;

        const subCategories = [
            { name: 'A类产品', value: Math.round(value * 0.4) },
            { name: 'B类产品', value: Math.round(value * 0.3) },
            { name: 'C类产品', value: Math.round(value * 0.2) },
            { name: '其他', value: Math.round(value * 0.1) }
        ];

        return {
            title: `${label} 渠道详情`,
            summary: [
                { label: '总销售额', value: DateUtils.formatCurrency(value) },
                { label: '细分分类', value: subCategories.length + '个' }
            ],
            tableData: {
                headers: ['细分分类', '销售额', '占比'],
                rows: subCategories.map(sc => [
                    sc.name,
                    DateUtils.formatCurrency(sc.value),
                    DateUtils.formatPercent(sc.value / value)
                ])
            }
        };
    },

    generatePieChartDrillData(dataIndex) {
        const data = this.getPieChartData();
        if (!data) return null;

        const item = data.data[dataIndex];
        if (!item) return null;

        const total = Helpers.sum(data.data.map(d => d.value));
        const value = item.value;
        const actualValue = Math.round(total * (value / 100));

        const details = [
            { name: '线上商城', value: Math.round(actualValue * 0.45), percent: 45 },
            { name: '第三方平台', value: Math.round(actualValue * 0.3), percent: 30 },
            { name: '线下门店', value: Math.round(actualValue * 0.25), percent: 25 }
        ];

        return {
            title: `${item.label} 分类详情`,
            summary: [
                { label: '分类占比', value: value + '%' },
                { label: '预估金额', value: DateUtils.formatCurrency(actualValue * 10000) }
            ],
            tableData: {
                headers: ['销售渠道', '销售额', '占比'],
                rows: details.map(d => [
                    d.name,
                    DateUtils.formatCurrency(d.value * 10000),
                    d.percent + '%'
                ])
            }
        };
    },

    generateAreaChartDrillData(dataIndex) {
        const data = this.getAreaChartData();
        if (!data) return null;

        const label = data.labels[dataIndex] || '未知';
        const details = data.datasets.map(ds => ({
            dataset: ds.label,
            value: ds.data[dataIndex] || 0,
            color: ds.color
        }));

        return {
            title: `${label} 用户详情`,
            summary: [
                { label: '总用户', value: DateUtils.formatNumber(Helpers.sum(details.map(d => d.value))) },
                { label: '新用户', value: DateUtils.formatNumber(details[0]?.value || 0) }
            ],
            tableData: {
                headers: ['用户类型', '人数', '占比'],
                rows: details.map(d => [
                    d.dataset,
                    DateUtils.formatNumber(d.value),
                    DateUtils.formatPercent(d.value / Helpers.sum(details.map(x => x.value)))
                ])
            }
        };
    },

    generateFunnelChartDrillData(dataIndex) {
        const data = this.getFunnelChartData();
        if (!data) return null;

        const stage = data.stages[dataIndex];
        if (!stage) return null;

        const prevStage = dataIndex > 0 ? data.stages[dataIndex - 1] : null;
        const conversionRate = prevStage ? (stage.value / prevStage.value) : 1;

        const details = [
            { name: '网页端', value: Math.round(stage.value * 0.35) },
            { name: '移动端', value: Math.round(stage.value * 0.45) },
            { name: 'App端', value: Math.round(stage.value * 0.2) }
        ];

        return {
            title: `${stage.name} 阶段详情`,
            summary: [
                { label: '阶段人数', value: DateUtils.formatNumber(stage.value) },
                { label: '阶段转化率', value: DateUtils.formatPercent(conversionRate) }
            ],
            tableData: {
                headers: ['设备端', '人数', '占比'],
                rows: details.map(d => [
                    d.name,
                    DateUtils.formatNumber(d.value),
                    DateUtils.formatPercent(d.value / stage.value)
                ])
            }
        };
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    },

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.cachedData));
    }
};

window.DataStore = DataStore;
