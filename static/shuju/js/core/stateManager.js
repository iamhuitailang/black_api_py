const StateManager = {
    state: {
        dateRange: 'today',
        customStartDate: null,
        customEndDate: null,
        visibleCharts: {
            lineChart: true,
            barChart: true,
            pieChart: true,
            areaChart: true,
            funnelChart: true
        },
        chartConfig: {
            lineChart: { showGrid: true, showLegend: true },
            barChart: { showGrid: true, showLegend: true },
            pieChart: { showLegend: true, donut: false },
            areaChart: { showGrid: true, showLegend: true },
            funnelChart: { showLabels: true, showPercent: true }
        },
        pieChartHiddenSlices: []
    },

    listeners: [],

    init() {
        const savedState = Storage.get('appState');
        if (savedState) {
            this.state = Helpers.mergeObjects(this.state, savedState);
        }
        return this;
    },

    get(key) {
        if (key === undefined) {
            return Helpers.deepClone(this.state);
        }
        
        const keys = key.split('.');
        let value = this.state;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return Helpers.deepClone(value);
    },

    set(key, value) {
        const keys = key.split('.');
        
        if (keys.length === 1) {
            this.state[key] = Helpers.deepClone(value);
        } else {
            let current = this.state;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in current)) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = Helpers.deepClone(value);
        }

        this.persist();
        this.notifyListeners(key, value);
    },

    persist() {
        Storage.set('appState', this.state);
    },

    reset() {
        this.state = {
            dateRange: 'today',
            customStartDate: null,
            customEndDate: null,
            visibleCharts: {
                lineChart: true,
                barChart: true,
                pieChart: true,
                areaChart: true,
                funnelChart: true
            },
            chartConfig: {
                lineChart: { showGrid: true, showLegend: true },
                barChart: { showGrid: true, showLegend: true },
                pieChart: { showLegend: true, donut: false },
                areaChart: { showGrid: true, showLegend: true },
                funnelChart: { showLabels: true, showPercent: true }
            },
            pieChartHiddenSlices: []
        };
        this.persist();
        this.notifyListeners('reset', null);
    },

    getDateRangeValues() {
        if (this.state.dateRange === 'custom' && 
            this.state.customStartDate && 
            this.state.customEndDate) {
            return {
                start: new Date(this.state.customStartDate),
                end: new Date(this.state.customEndDate)
            };
        }
        return DateUtils.getDateRange(this.state.dateRange);
    },

    setCustomDateRange(startDate, endDate) {
        this.set('dateRange', 'custom');
        this.set('customStartDate', startDate);
        this.set('customEndDate', endDate);
    },

    toggleChartVisibility(chartId) {
        const current = this.get(`visibleCharts.${chartId}`);
        this.set(`visibleCharts.${chartId}`, !current);
    },

    isChartVisible(chartId) {
        return this.get(`visibleCharts.${chartId}`) !== false;
    },

    togglePieSlice(index) {
        const hiddenSlices = [...(this.state.pieChartHiddenSlices || [])];
        const idx = hiddenSlices.indexOf(index);
        if (idx > -1) {
            hiddenSlices.splice(idx, 1);
        } else {
            hiddenSlices.push(index);
        }
        this.set('pieChartHiddenSlices', hiddenSlices);
    },

    isPieSliceHidden(index) {
        return (this.state.pieChartHiddenSlices || []).includes(index);
    },

    subscribe(listener) {
        this.listeners.push(listener);
    },

    unsubscribe(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    },

    notifyListeners(key, value) {
        this.listeners.forEach(listener => listener(key, value));
    }
};

window.StateManager = StateManager;
