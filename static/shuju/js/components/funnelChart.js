const FunnelChart = {
    canvas: null,
    ctx: null,
    tooltip: null,
    chartData: null,
    hoveredStage: null,
    lastRenderData: null,

    init() {
        this.canvas = document.getElementById('funnelChart');
        this.tooltip = document.getElementById('funnelChartTooltip');
        
        if (!this.canvas) return this;

        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        this.render();

        DataStore.subscribe(() => this.render());
        ThemeManager.subscribe(() => this.render());
        ChartEngine.register('funnelChart', this);

        return this;
    },

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    },

    render() {
        const data = DataStore.getFunnelChartData();
        if (!data || !this.canvas) return;

        this.chartData = data;
        this.lastRenderData = Helpers.deepClone(data);

        const { width, height } = ChartEngine.getCanvasSize(this.canvas);
        this.ctx = ChartEngine.setupCanvas(this.canvas, width, height);

        const padding = { top: 20, right: 40, bottom: 20, left: 40 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const result = ChartEngine.drawFunnelChart(this.ctx, {
            x: padding.left,
            y: padding.top,
            width: chartWidth,
            height: chartHeight,
            stages: data.stages
        });

        this.lastResult = result;
    },

    handleMouseMove(e) {
        if (!this.lastResult || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width) / ChartEngine.devicePixelRatio;
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height) / ChartEngine.devicePixelRatio;

        const nearestStage = ChartEngine.findNearestStage(this.lastResult.stages, mouseX, mouseY);
        
        if (nearestStage) {
            this.hoveredStage = nearestStage;
            this.showTooltip(e, nearestStage);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.hoveredStage = null;
            this.hideTooltip();
            this.canvas.style.cursor = 'default';
        }
    },

    handleMouseLeave() {
        this.hoveredStage = null;
        this.hideTooltip();
        this.canvas.style.cursor = 'default';
    },

    handleClick(e) {
        if (this.hoveredStage) {
            DrillService.show('funnelChart', this.hoveredStage.index);
        }
    },

    showTooltip(e, stage) {
        if (!this.tooltip) return;

        const stageData = stage.stage;
        const conversionRate = stage.index > 0 
            ? ((stageData.value / this.chartData.stages[stage.index - 1].value) * 100).toFixed(1)
            : 100;

        const html = `
            <div class="tooltip-title">${stageData.name}</div>
            <div class="tooltip-value" style="color: ${stage.color}">
                数量: ${DateUtils.formatNumber(stageData.value)}
            </div>
            <div class="tooltip-value" style="color: ${stage.color}">
                转化率: ${conversionRate}%
            </div>
        `;

        this.tooltip.innerHTML = html;
        this.tooltip.classList.add('visible');

        const rect = this.canvas.getBoundingClientRect();
        
        let left = e.clientX - rect.left + 15;
        let top = e.clientY - rect.top - 10;

        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
    },

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.remove('visible');
        }
    },

    exportImage() {
        return this.canvas.toDataURL('image/png');
    },

    getCSVData() {
        const data = this.lastRenderData || this.chartData;
        if (!data) return null;

        const headers = ['阶段', '数量', '阶段转化率', '整体转化率'];
        const rows = data.stages.map((stage, i) => {
            const stageConversion = i > 0 
                ? ((stage.value / data.stages[i - 1].value) * 100).toFixed(1) + '%'
                : '100%';
            return [
                stage.name,
                stage.value,
                stageConversion,
                stage.rate + '%'
            ];
        });

        return { headers, rows, title: '转化漏斗' };
    }
};

window.FunnelChart = FunnelChart;
