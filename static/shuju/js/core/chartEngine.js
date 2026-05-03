const ChartEngine = {
    charts: {},
    devicePixelRatio: window.devicePixelRatio || 1,

    init() {
        this.devicePixelRatio = window.devicePixelRatio || 1;
        window.addEventListener('resize', Helpers.debounce(() => {
            this.resizeAll();
        }, 200));
        return this;
    },

    setupCanvas(canvas, width, height) {
        const ctx = canvas.getContext('2d');
        const dpr = this.devicePixelRatio;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        ctx.scale(dpr, dpr);
        return ctx;
    },

    getCanvasSize(canvas) {
        const container = canvas.parentElement;
        const width = container.clientWidth - 32;
        const height = container.clientHeight - 32;
        return { width: Math.max(200, width), height: Math.max(150, height) };
    },

    drawGrid(ctx, x, y, width, height, xCount, yCount) {
        const themeColors = ThemeManager.getChartColors();
        ctx.strokeStyle = themeColors.grid;
        ctx.lineWidth = 1;

        const cellWidth = width / xCount;
        const cellHeight = height / yCount;

        for (let i = 0; i <= xCount; i++) {
            const xPos = x + i * cellWidth;
            ctx.beginPath();
            ctx.moveTo(xPos, y);
            ctx.lineTo(xPos, y + height);
            ctx.stroke();
        }

        for (let i = 0; i <= yCount; i++) {
            const yPos = y + i * cellHeight;
            ctx.beginPath();
            ctx.moveTo(x, yPos);
            ctx.lineTo(x + width, yPos);
            ctx.stroke();
        }
    },

    drawAxes(ctx, x, y, width, height, minValue, maxValue, yLabels) {
        const themeColors = ThemeManager.getChartColors();
        
        ctx.strokeStyle = Helpers.hexToRgba(themeColors.text, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();

        ctx.fillStyle = Helpers.hexToRgba(themeColors.text, 0.6);
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';

        const yStep = height / (yLabels.length - 1);
        yLabels.forEach((label, i) => {
            const yPos = y + i * yStep;
            ctx.fillText(label, x - 8, yPos + 4);
        });
    },

    drawLineChart(ctx, config) {
        const { x, y, width, height, datasets, labels } = config;
        const themeColors = ThemeManager.getChartColors();
        
        let minValue = Infinity, maxValue = -Infinity;
        datasets.forEach(dataset => {
            dataset.data.forEach(value => {
                minValue = Math.min(minValue, value);
                maxValue = Math.max(maxValue, value);
            });
        });

        const padding = (maxValue - minValue) * 0.1 || 10;
        minValue -= padding;
        maxValue += padding;

        const values = this.generateYLabels(minValue, maxValue, 5);
        this.drawAxes(ctx, x, y, width, height, minValue, maxValue, values);
        this.drawGrid(ctx, x, y, width, height, labels.length - 1, values.length - 1);

        datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || Helpers.getColorByIndex(datasetIndex);
            const points = [];

            dataset.data.forEach((value, i) => {
                const xPos = x + (i / (dataset.data.length - 1)) * width;
                const yPos = y + height - ((value - minValue) / (maxValue - minValue)) * height;
                points.push({ x: xPos, y: yPos, value, index: i });
            });

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            points.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    this.drawCurve(ctx, points, i);
                }
            });
            ctx.stroke();

            ctx.fillStyle = color;
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = themeColors.background;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = color;
            });

            ctx.fillStyle = Helpers.hexToRgba(themeColors.text, 0.6);
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            labels.forEach((label, i) => {
                const xPos = x + (i / (labels.length - 1)) * width;
                ctx.fillText(label, xPos, y + height + 20);
            });
        });

        return { minValue, maxValue, points: this.getAllPoints(datasets, x, y, width, height, minValue, maxValue) };
    },

    drawAreaChart(ctx, config) {
        const { x, y, width, height, datasets, labels } = config;
        const themeColors = ThemeManager.getChartColors();
        
        let minValue = Infinity, maxValue = -Infinity;
        datasets.forEach(dataset => {
            dataset.data.forEach(value => {
                minValue = Math.min(minValue, value);
                maxValue = Math.max(maxValue, value);
            });
        });

        const padding = (maxValue - minValue) * 0.1 || 10;
        minValue -= padding;
        maxValue += padding;

        const values = this.generateYLabels(minValue, maxValue, 5);
        this.drawAxes(ctx, x, y, width, height, minValue, maxValue, values);
        this.drawGrid(ctx, x, y, width, height, labels.length - 1, values.length - 1);

        datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || Helpers.getColorByIndex(datasetIndex);
            const points = [];

            dataset.data.forEach((value, i) => {
                const xPos = x + (i / (dataset.data.length - 1)) * width;
                const yPos = y + height - ((value - minValue) / (maxValue - minValue)) * height;
                points.push({ x: xPos, y: yPos, value, index: i });
            });

            const gradient = ctx.createLinearGradient(0, y, 0, y + height);
            gradient.addColorStop(0, Helpers.hexToRgba(color, 0.4));
            gradient.addColorStop(1, Helpers.hexToRgba(color, 0.05));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(points[0].x, y + height);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.lineTo(points[points.length - 1].x, y + height);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            points.forEach((point, i) => {
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    this.drawCurve(ctx, points, i);
                }
            });
            ctx.stroke();

            ctx.fillStyle = color;
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = Helpers.hexToRgba(themeColors.text, 0.6);
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            labels.forEach((label, i) => {
                const xPos = x + (i / (labels.length - 1)) * width;
                ctx.fillText(label, xPos, y + height + 20);
            });
        });

        return { minValue, maxValue, points: this.getAllPoints(datasets, x, y, width, height, minValue, maxValue) };
    },

    drawBarChart(ctx, config) {
        const { x, y, width, height, datasets, labels } = config;
        const themeColors = ThemeManager.getChartColors();
        
        let minValue = Infinity, maxValue = -Infinity;
        datasets.forEach(dataset => {
            dataset.data.forEach(value => {
                minValue = Math.min(minValue, value);
                maxValue = Math.max(maxValue, value);
            });
        });

        const padding = (maxValue - minValue) * 0.1 || 10;
        minValue = Math.min(0, minValue);
        maxValue += padding;

        const values = this.generateYLabels(minValue, maxValue, 5);
        this.drawAxes(ctx, x, y, width, height, minValue, maxValue, values);
        this.drawGrid(ctx, x, y, width, height, labels.length, values.length - 1);

        const barGroupWidth = width / labels.length;
        const barGap = 10;
        const barWidth = (barGroupWidth - barGap * 2) / datasets.length;

        const allBars = [];

        datasets.forEach((dataset, datasetIndex) => {
            const colors = dataset.colors || [Helpers.getColorByIndex(datasetIndex)];

            dataset.data.forEach((value, i) => {
                const xPos = x + i * barGroupWidth + barGap + datasetIndex * barWidth;
                const barHeight = ((value - minValue) / (maxValue - minValue)) * height;
                const yPos = y + height - barHeight;
                const color = colors[i % colors.length];

                const gradient = ctx.createLinearGradient(xPos, yPos, xPos, yPos + barHeight);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, Helpers.hexToRgba(color, 0.6));

                ctx.fillStyle = gradient;
                Helpers.drawRoundedRect(ctx, xPos, yPos, barWidth - 2, barHeight, 4);
                ctx.fill();

                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = color;
                Helpers.drawRoundedRect(ctx, xPos, yPos, barWidth - 2, 3, 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                allBars.push({
                    x: xPos,
                    y: yPos,
                    width: barWidth - 2,
                    height: barHeight,
                    value,
                    index: i,
                    datasetIndex,
                    label: labels[i],
                    color
                });
            });
        });

        ctx.fillStyle = Helpers.hexToRgba(themeColors.text, 0.6);
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        labels.forEach((label, i) => {
            const xPos = x + i * barGroupWidth + barGroupWidth / 2;
            ctx.fillText(label, xPos, y + height + 20);
        });

        return { minValue, maxValue, bars: allBars };
    },

    drawPieChart(ctx, config) {
        const { x, y, radius, data, hiddenSlices = [] } = config;
        const themeColors = ThemeManager.getChartColors();
        
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let startAngle = -Math.PI / 2;

        const allSlices = [];

        data.forEach((item, index) => {
            const isHidden = hiddenSlices.includes(index);
            const sliceAngle = (item.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;
            const color = item.color || Helpers.getColorByIndex(index);

            if (!isHidden) {
                const midAngle = startAngle + sliceAngle / 2;
                const offset = index === (config.hoveredIndex || -1) ? 10 : 0;
                const offsetX = Math.cos(midAngle) * offset;
                const offsetY = Math.sin(midAngle) * offset;

                const gradient = ctx.createRadialGradient(
                    x + offsetX, y + offsetY, 0,
                    x + offsetX, y + offsetY, radius
                );
                gradient.addColorStop(0, Helpers.lightenColor(color, 20));
                gradient.addColorStop(1, color);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(x + offsetX, y + offsetY);
                ctx.arc(x + offsetX, y + offsetY, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = themeColors.background;
                ctx.lineWidth = 2;
                ctx.stroke();

                if (sliceAngle > 0.3) {
                    const labelRadius = radius * 0.65;
                    const labelX = x + Math.cos(midAngle) * labelRadius;
                    const labelY = y + Math.sin(midAngle) * labelRadius;

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 11px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${item.value}%`, labelX, labelY);
                }
            }

            allSlices.push({
                startAngle,
                endAngle,
                midAngle: startAngle + sliceAngle / 2,
                value: item.value,
                label: item.label,
                color,
                index,
                isHidden
            });

            startAngle = endAngle;
        });

        return { total, slices: allSlices, centerX: x, centerY: y, radius };
    },

    drawFunnelChart(ctx, config) {
        const { x, y, width, height, stages } = config;
        const themeColors = ThemeManager.getChartColors();
        
        const colors = ThemeManager.getGradientColors('barChart');
        const maxValue = stages[0].value;
        const stageHeight = height / stages.length;
        const padding = 20;

        const allStages = [];

        stages.forEach((stage, index) => {
            const yPos = y + index * stageHeight;
            const nextWidth = index < stages.length - 1 
                ? (stages[index + 1].value / maxValue) * (width - padding * 2)
                : (stage.value / maxValue) * (width - padding * 2);
            const currentWidth = (stage.value / maxValue) * (width - padding * 2);
            const startX = x + padding + (width - padding * 2 - currentWidth) / 2;
            const nextStartX = x + padding + (width - padding * 2 - nextWidth) / 2;

            const color = colors[index % colors.length];
            const gradient = ctx.createLinearGradient(startX, yPos, startX, yPos + stageHeight - 5);
            gradient.addColorStop(0, Helpers.lightenColor(color, 15));
            gradient.addColorStop(1, color);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(startX, yPos);
            ctx.lineTo(startX + currentWidth, yPos);

            if (index < stages.length - 1) {
                ctx.lineTo(nextStartX + nextWidth, yPos + stageHeight - 5);
                ctx.lineTo(nextStartX, yPos + stageHeight - 5);
            } else {
                ctx.lineTo(startX + currentWidth, yPos + stageHeight - 5);
                ctx.lineTo(startX, yPos + stageHeight - 5);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stage.name, x + width / 2, yPos + stageHeight / 2 - 8);

            ctx.font = '11px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(
                `${DateUtils.formatNumber(stage.value)} (${stage.rate}%)`,
                x + width / 2,
                yPos + stageHeight / 2 + 8
            );

            if (index > 0) {
                const prevStage = stages[index - 1];
                const conversionRate = (stage.value / prevStage.value * 100).toFixed(1);
                
                ctx.fillStyle = themeColors.primary;
                ctx.font = 'bold 10px monospace';
                ctx.fillText(`→ ${conversionRate}%`, x + width / 2, yPos - 5);
            }

            allStages.push({
                x: startX,
                y: yPos,
                width: currentWidth,
                height: stageHeight - 5,
                stage,
                index,
                color
            });
        });

        return { stages: allStages };
    },

    drawCurve(ctx, points, currentIndex) {
        if (currentIndex >= 1 && currentIndex < points.length) {
            const prev = points[currentIndex - 1];
            const curr = points[currentIndex];
            const next = points[currentIndex + 1] || curr;
            const prevPrev = points[currentIndex - 2] || prev;

            const xc1 = (prevPrev.x + prev.x) / 2;
            const yc1 = (prevPrev.y + prev.y) / 2;
            const xc2 = (prev.x + curr.x) / 2;
            const yc2 = (prev.y + curr.y) / 2;
            const xc3 = (curr.x + next.x) / 2;
            const yc3 = (curr.y + next.y) / 2;

            ctx.bezierCurveTo(xc1, yc1, xc2, yc2, curr.x, curr.y);
        }
    },

    generateYLabels(minValue, maxValue, count) {
        const labels = [];
        const range = maxValue - minValue;
        const step = range / (count - 1);
        
        for (let i = 0; i < count; i++) {
            let value = maxValue - i * step;
            if (Math.abs(value) >= 10000) {
                value = (value / 10000).toFixed(1) + '万';
            } else {
                value = Math.round(value).toLocaleString();
            }
            labels.push(value);
        }
        
        return labels;
    },

    getAllPoints(datasets, x, y, width, height, minValue, maxValue) {
        const allPoints = [];
        datasets.forEach((dataset, datasetIndex) => {
            const color = dataset.color || Helpers.getColorByIndex(datasetIndex);
            dataset.data.forEach((value, i) => {
                const xPos = x + (i / (dataset.data.length - 1)) * width;
                const yPos = y + height - ((value - minValue) / (maxValue - minValue)) * height;
                allPoints.push({
                    x: xPos,
                    y: yPos,
                    value,
                    index: i,
                    datasetIndex,
                    datasetLabel: dataset.label,
                    color
                });
            });
        });
        return allPoints;
    },

    findNearestPoint(points, mouseX, mouseY, threshold = 15) {
        let nearest = null;
        let minDist = Infinity;

        points.forEach(point => {
            const dist = Math.sqrt(
                Math.pow(mouseX - point.x, 2) + 
                Math.pow(mouseY - point.y, 2)
            );
            if (dist < threshold && dist < minDist) {
                minDist = dist;
                nearest = point;
            }
        });

        return nearest;
    },

    findNearestBar(bars, mouseX, mouseY) {
        return bars.find(bar => 
            mouseX >= bar.x && 
            mouseX <= bar.x + bar.width &&
            mouseY >= bar.y &&
            mouseY <= bar.y + bar.height
        );
    },

    findNearestSlice(slices, centerX, centerY, radius, mouseX, mouseY) {
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > radius) return null;

        let angle = Math.atan2(dy, dx);
        if (angle < -Math.PI / 2) angle += Math.PI * 2;

        return slices.find(slice => 
            !slice.isHidden &&
            angle >= slice.startAngle && 
            angle < slice.endAngle
        );
    },

    findNearestStage(stages, mouseX, mouseY) {
        return stages.find(stage =>
            mouseX >= stage.x &&
            mouseX <= stage.x + stage.width &&
            mouseY >= stage.y &&
            mouseY <= stage.y + stage.height
        );
    },

    resizeAll() {
        Object.keys(this.charts).forEach(chartId => {
            const chart = this.charts[chartId];
            if (chart && chart.render) {
                chart.render();
            }
        });
    },

    register(chartId, chart) {
        this.charts[chartId] = chart;
    },

    unregister(chartId) {
        delete this.charts[chartId];
    }
};

window.ChartEngine = ChartEngine;
