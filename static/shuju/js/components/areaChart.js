const AreaChart = {
    canvas: null,
    ctx: null,
    tooltip: null,
    chartData: null,
    hoveredPoint: null,
    lastRenderData: null,

    init() {
        this.canvas = document.getElementById('areaChart');
        this.tooltip = document.getElementById('areaChartTooltip');
        
        if (!this.canvas) return this;

        this.ctx = this.canvas.getContext('2d');
        this.bindEvents();
        this.render();

        DataStore.subscribe(() => this.render());
        ThemeManager.subscribe(() => this.render());
        ChartEngine.register('areaChart', this);

        return this;
    },

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    },

    render() {
        const data = DataStore.getAreaChartData();
        if (!data || !this.canvas) return;

        this.chartData = data;
        this.lastRenderData = Helpers.deepClone(data);

        const { width, height } = ChartEngine.getCanvasSize(this.canvas);
        this.ctx = ChartEngine.setupCanvas(this.canvas, width, height);

        const padding = { top: 30, right: 30, bottom: 50, left: 60 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const result = ChartEngine.drawAreaChart(this.ctx, {
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

        const nearestPoint = ChartEngine.findNearestPoint(this.lastResult.points, mouseX, mouseY);
        
        if (nearestPoint) {
            this.hoveredPoint = nearestPoint;
            this.showTooltip(e, nearestPoint);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.hoveredPoint = null;
            this.hideTooltip();
            this.canvas.style.cursor = 'default';
        }
    },

    handleMouseLeave() {
        this.hoveredPoint = null;
        this.hideTooltip();
        this.canvas.style.cursor = 'default';
    },

    handleClick(e) {
        if (this.hoveredPoint) {
            DrillService.show('areaChart', this.hoveredPoint.index);
        }
    },

    showTooltip(e, point) {
        if (!this.tooltip || !this.chartData) return;

        const data = this.chartData;
        const label = data.labels[point.index];
        const value = point.value;

        const pointsAtSameIndex = this.lastResult.points.filter(p => p.index === point.index);
        
        let html = `<div class="tooltip-title">${label}</div>`;
        pointsAtSameIndex.forEach(p => {
            html += `<div class="tooltip-value" style="color: ${p.color}">
                ${p.datasetLabel}: ${DateUtils.formatNumber(p.value)}
            </div>`;
        });

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

        const headers = ['日期', ...data.datasets.map(d => d.label)];
        const rows = data.labels.map((label, i) => [
            label,
            ...data.datasets.map(d => d.data[i] || 0)
        ]);

        return { headers, rows, title: data.title };
    }
};

window.AreaChart = AreaChart;
