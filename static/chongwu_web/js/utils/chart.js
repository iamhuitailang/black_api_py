const ChartUtil = {
    drawLineChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 45 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#B8A898';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }

        const weights = data.map(d => d.weight);
        const dates = data.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const minWeight = Math.min(...weights) * 0.95;
        const maxWeight = Math.max(...weights) * 1.05;
        const weightRange = maxWeight - minWeight || 1;

        ctx.strokeStyle = '#F0E6E0';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            const value = maxWeight - (weightRange / 4) * i;
            ctx.fillStyle = '#8B7355';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
        }

        const lineColor = options.lineColor || '#FF8FA3';
        const fillColor = options.fillColor || 'rgba(255, 143, 163, 0.1)';
        const pointColor = options.pointColor || '#FF8FA3';

        const points = data.map((d, i) => {
            const x = padding.left + (chartWidth / (data.length - 1 || 1)) * i;
            const y = padding.top + chartHeight - ((d.weight - minWeight) / weightRange) * chartHeight;
            return { x, y };
        });

        ctx.beginPath();
        ctx.moveTo(points[0].x, padding.top + chartHeight);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.fillStyle = '#8B7355';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        const labelStep = Math.max(1, Math.ceil(data.length / 6));
        dates.forEach((date, i) => {
            if (i % labelStep === 0 || i === data.length - 1) {
                ctx.fillText(date, points[i].x, height - padding.bottom + 15);
            }
        });

        if (options.unit) {
            ctx.fillStyle = '#8B7355';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('单位: ' + options.unit, padding.left, 14);
        }
    },

    drawBarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const padding = { top: 20, right: 20, bottom: 40, left: 45 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#B8A898';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', width / 2, height / 2);
            return;
        }

        const values = data.map(d => d.value);
        const labels = data.map(d => d.label);
        const maxValue = Math.max(...values) * 1.1 || 1;

        ctx.strokeStyle = '#F0E6E0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        const barWidth = (chartWidth / data.length) * 0.6;
        const barGap = (chartWidth / data.length) * 0.4;

        const barColor = options.barColor || '#A8D8EA';

        data.forEach((d, i) => {
            const barHeight = (d.value / maxValue) * chartHeight;
            const x = padding.left + (chartWidth / data.length) * i + barGap / 2;
            const y = padding.top + chartHeight - barHeight;

            const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, barColor);
            gradient.addColorStop(1, barColor + '88');
            ctx.fillStyle = gradient;

            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();

            ctx.fillStyle = '#8B7355';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.value.toString(), x + barWidth / 2, y - 5);

            ctx.fillText(labels[i], x + barWidth / 2, height - padding.bottom + 15);
        });
    }
};