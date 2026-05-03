const PieChart = {
    canvas: null,
    ctx: null,
    tooltip: null,
    legendContainer: null,
    chartData: null,
    hoveredIndex: -1,
    lastRenderData: null,
    hiddenSlices: [],

    init() {
        this.canvas = document.getElementById('pieChart');
        this.tooltip = document.getElementById('pieChartTooltip');
        this.legendContainer = document.getElementById('pieChartLegend');
        
        if (!this.canvas) return this;

        this.ctx = this.canvas.getContext('2d');
        this.hiddenSlices = StateManager.get('pieChartHiddenSlices') || [];
        this.bindEvents();
        this.render();

        DataStore.subscribe(() => this.render());
        ThemeManager.subscribe(() => this.render());
        ChartEngine.register('pieChart', this);

        return this;
    },

    bindEvents() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    },

    render() {
        const data = DataStore.getPieChartData();
        if (!data || !this.canvas) return;

        this.chartData = data;
        this.lastRenderData = Helpers.deepClone(data);
        this.hiddenSlices = StateManager.get('pieChartHiddenSlices') || [];

        const { width, height } = ChartEngine.getCanvasSize(this.canvas);
        const chartHeight = Math.min(height, 220);
        this.ctx = ChartEngine.setupCanvas(this.canvas, width, chartHeight);

        const centerX = width / 2;
        const centerY = chartHeight / 2;
        const radius = Math.min(centerX, centerY) - 20;

        const result = ChartEngine.drawPieChart(this.ctx, {
            x: centerX,
            y: centerY,
            radius,
            data: data.data,
            hiddenSlices: this.hiddenSlices,
            hoveredIndex: this.hoveredIndex
        });

        this.lastResult = result;
        this.renderLegend();
    },

    renderLegend() {
        if (!this.legendContainer || !this.chartData) return;

        this.legendContainer.innerHTML = this.chartData.data.map((item, index) => {
            const isHidden = this.hiddenSlices.includes(index);
            return `
                <div class="chart-legend-item ${isHidden ? 'hidden' : ''}" data-index="${index}">
                    <span class="legend-color" style="background: ${item.color}"></span>
                    <span>${item.label} (${item.value}%)</span>
                </div>
            `;
        }).join('');

        this.legendContainer.querySelectorAll('.chart-legend-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                StateManager.togglePieSlice(index);
                this.hiddenSlices = StateManager.get('pieChartHiddenSlices') || [];
                this.render();
            });
        });
    },

    handleMouseMove(e) {
        if (!this.lastResult || !this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width) / ChartEngine.devicePixelRatio;
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height) / ChartEngine.devicePixelRatio;

        const nearestSlice = ChartEngine.findNearestSlice(
            this.lastResult.slices,
            this.lastResult.centerX,
            this.lastResult.centerY,
            this.lastResult.radius,
            mouseX,
            mouseY
        );
        
        if (nearestSlice) {
            this.hoveredIndex = nearestSlice.index;
            this.showTooltip(e, nearestSlice);
            this.canvas.style.cursor = 'pointer';
        } else {
            this.hoveredIndex = -1;
            this.hideTooltip();
            this.canvas.style.cursor = 'default';
        }
    },

    handleMouseLeave() {
        this.hoveredIndex = -1;
        this.hideTooltip();
        this.canvas.style.cursor = 'default';
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width) / ChartEngine.devicePixelRatio;
        const mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height) / ChartEngine.devicePixelRatio;

        const nearestSlice = ChartEngine.findNearestSlice(
            this.lastResult.slices,
            this.lastResult.centerX,
            this.lastResult.centerY,
            this.lastResult.radius,
            mouseX,
            mouseY
        );

        if (nearestSlice) {
            DrillService.show('pieChart', nearestSlice.index);
        }
    },

    showTooltip(e, slice) {
        if (!this.tooltip) return;

        const html = `
            <div class="tooltip-title">${slice.label}</div>
            <div class="tooltip-value" style="color: ${slice.color}">
                占比: ${slice.value}%
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

        const headers = ['分类', '占比(%)'];
        const rows = data.data.map(item => [
            item.label,
            item.value
        ]);

        return { headers, rows, title: '分类占比' };
    }
};

window.PieChart = PieChart;
