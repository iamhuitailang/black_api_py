const BarChart = {
    canvas: null,
    ctx: null,
    tooltip: null,
    chartData: null,
    hoveredBar: null,
    lastRenderData: null,

    init() {
        this.canvas = document.getElementById('barChart');
        this.tooltip = document.getElementById('barChartTooltip');
        
        if (!this.canvas) return this;

        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        this.render();

        DataStore.subscribe(() => this.render());
        ThemeManager.subscribe(() => this.render());
        ChartEngine.register('barChart', this);

        return this;
    },

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    },

    render() {
        const data = DataStore.getBarChartData();
        if (!data || !this.canvas) return;

        this.chartData = data;
        this.lastRenderData = Helpers.deepClone(data);

        const { width, height } = ChartEngine.getCanvasSize(this.canvas);
        this.ctx = ChartEngine.setupCanvas(this.canvas, width, height);

        const padding = { top: 30, right: 30, bottom: 50, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const result = ChartEngine.drawBarChart(this.ctx, {
            x: padding.left,
            y: padding.top,
            width: chartWidth,
            height: chartHeight,
            datasets: data.datasets,
            labels: data.labels
        });

        this.lastResult = result;
    },

    handleMouseMove(e) {
        if (!this.lastResult || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width) / ChartEngine.devicePixelRatio;
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height) / ChartEngine.devicePixelRatio;

        const nearestBar = ChartEngine.findNearestBar(this.lastResult.bars, mouseX, mouseY);
        
        if (nearestBar) {
            this.hoveredBar = nearestBar;
            this.showTooltip(e, nearestBar);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.hoveredBar = null;
            this.hideTooltip();
            this.canvas.style.cursor = 'default';
        }
    },

    handleMouseLeave() {
        this.hoveredBar = null;
        this.hideTooltip();
        this.canvas.style.cursor = 'default';
    },

    handleClick(e) {
        if (this.hoveredBar) {
            DrillService.show('barChart', this.hoveredBar.index);
        }
    },

    showTooltip(e, bar) {
        if (!this.tooltip) return;

        const html = `
            <div class="tooltip-title">${bar.label}</div>
            <div class="tooltip-value" style="color: ${bar.color}">
                销售额: ${DateUtils.formatCurrency(bar.value)}
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

        const dataset = data.datasets[0];
        const headers = ['分类', '销售额'];
        const rows = data.labels.map((label, i) => [
            label,
            dataset.data[i] || 0
        ]);

        return { headers, rows, title: data.title };
    }
};

window.BarChart = BarChart;
