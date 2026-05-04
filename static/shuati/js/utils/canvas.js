const CanvasUtils = {
    drawCalendarHeatmap(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            cellSize = 12,
            cellGap = 2,
            weeksToShow = 52,
            colors = ['#e5e7eb', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8']
        } = options;

        const today = new Date();
        const days = weeksToShow * 7;
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - days + 1);
        
        const firstDayOfWeek = firstDay.getDay();
        const totalWeeks = weeksToShow;
        
        canvas.width = totalWeeks * (cellSize + cellGap) - cellGap;
        canvas.height = 7 * (cellSize + cellGap) - cellGap;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(firstDay);
            currentDate.setDate(firstDay.getDate() + i);
            
            const dateStr = currentDate.toDateString();
            const dayOfWeek = currentDate.getDay();
            const weekNumber = Math.floor((i + firstDayOfWeek) / 7);
            
            const x = weekNumber * (cellSize + cellGap);
            const y = dayOfWeek * (cellSize + cellGap);
            
            const dayData = data[dateStr] || 0;
            let colorIndex = 0;
            
            if (dayData > 0) {
                if (dayData <= 5) colorIndex = 1;
                else if (dayData <= 15) colorIndex = 2;
                else if (dayData <= 30) colorIndex = 3;
                else colorIndex = 4;
            }
            
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    },

    drawMasteryProgress(canvas, percentage, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            size = 150,
            lineWidth = 10,
            bgColor = '#e5e7eb',
            fgColor = '#6366f1',
            textColor = '#6366f1',
            label = '掌握程度'
        } = options;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size - lineWidth) / 2;

        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, Math.PI * 1.5);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = bgColor;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (percentage > 0) {
            ctx.beginPath();
            const endAngle = -Math.PI / 2 + (percentage / 100) * Math.PI * 2;
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
            ctx.strokeStyle = fgColor;
            ctx.stroke();
        }

        ctx.font = `bold ${size * 0.22}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round(percentage)}%`, centerX, centerY - 10);

        ctx.font = `${size * 0.08}px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillStyle = '#64748b';
        ctx.fillText(label, centerX, centerY + 20);
    },

    drawForgettingCurve(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            width = 600,
            height = 300,
            padding = 40,
            lineColor = '#6366f1',
            pointColor = '#8b5cf6',
            bgColor = 'rgba(99, 102, 241, 0.1)'
        } = options;

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${100 - i * 25}%`, padding - 8, y + 4);
        }

        const labels = data.map(d => d.label);
        const points = data.map((d, i) => ({
            x: padding + (chartWidth / (data.length - 1)) * i,
            y: padding + chartHeight * (1 - d.value / 100)
        }));

        if (bgColor) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - padding);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, height - padding);
            ctx.closePath();
            ctx.fillStyle = bgColor;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const xc = (points[i].x + points[i - 1].x) / 2;
            const yc = (points[i].y + points[i - 1].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.quadraticCurveTo(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].x, points[points.length - 1].y);
        
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        points.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], p.x, height - 15);
            ctx.fillText(`${Math.round(data[i].value)}%`, p.x, p.y - 15);
        });
    },

    drawBarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const {
            width = 600,
            height = 300,
            padding = 40,
            barColor = '#6366f1',
            barWidth = 40,
            barGap = 20
        } = options;

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxValue = Math.max(...data.map(d => d.value));
        const totalBarsWidth = data.length * barWidth + (data.length - 1) * barGap;
        const startX = padding + (chartWidth - totalBarsWidth) / 2;

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const y = padding + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(maxValue - (maxValue / 4) * i), padding - 8, y + 4);
        }

        data.forEach((d, i) => {
            const x = startX + i * (barWidth + barGap);
            const barHeight = (d.value / maxValue) * chartHeight;
            const y = padding + chartHeight - barHeight;

            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, barColor);
            gradient.addColorStop(1, '#8b5cf6');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
            ctx.fill();

            ctx.fillStyle = '#64748b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, height - 15);
            ctx.fillStyle = '#1e293b';
            ctx.fillText(d.value, x + barWidth / 2, y - 8);
        });
    }
};

window.CanvasUtils = CanvasUtils;
