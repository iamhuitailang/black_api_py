const KPICard = {
    container: null,

    init() {
        this.container = document.getElementById('kpiGrid');
        this.render();
        DataStore.subscribe(() => this.render());
        return this;
    },

    render() {
        if (!this.container) return;

        const kpiData = DataStore.getKPI();
        
        this.container.innerHTML = kpiData.map(item => this.createCardHTML(item)).join('');
        
        this.container.querySelectorAll('.kpi-card').forEach((card, index) => {
            this.renderTrendCanvas(card, kpiData[index]?.trend || []);
        });
    },

    createCardHTML(item) {
        const changeClass = item.changeType === 'positive' ? 'positive' : 'negative';
        const changeIcon = item.changeType === 'positive' ? '↑' : '↓';
        const changeLabel = item.change > 0 ? '环比增长' : '环比下降';
        const valueDisplay = item.unit 
            ? `${item.value}${item.unit}` 
            : DateUtils.formatNumber(item.value);

        return `
            <div class="kpi-card" data-kpi-id="${item.id}">
                <div class="kpi-header">
                    <span class="kpi-title">${item.title}</span>
                    <span class="kpi-icon">${item.icon}</span>
                </div>
                <div class="kpi-value">${valueDisplay}</div>
                <div class="kpi-change ${changeClass}">
                    <span>${changeIcon} ${Math.abs(item.change)}%</span>
                    <span class="kpi-change-label">${changeLabel}</span>
                </div>
                <canvas class="kpi-trend" id="kpiTrend_${item.id}"></canvas>
            </div>
        `;
    },

    renderTrendCanvas(card, trendData) {
        const canvas = card.querySelector('.kpi-trend');
        if (!canvas || !trendData || trendData.length < 2) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = 60;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);

        const themeColors = ThemeManager.getChartColors();
        const min = Helpers.min(trendData);
        const max = Helpers.max(trendData);
        const range = max - min || 1;
        const padding = 8;

        const isUpward = trendData[trendData.length - 1] >= trendData[0];
        const lineColor = isUpward ? themeColors.success : themeColors.error;

        const points = trendData.map((value, i) => ({
            x: padding + (i / (trendData.length - 1)) * (width - padding * 2),
            y: height - padding - ((value - min) / range) * (height - padding * 2)
        }));

        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, Helpers.hexToRgba(lineColor, 0.3));
        gradient.addColorStop(1, Helpers.hexToRgba(lineColor, 0.05));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height - padding);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        const lastPoint = points[points.length - 1];
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
};

window.KPICard = KPICard;
