/**
 * Canvas渲染模块 - 负责条形图的绘制和动画展示
 * Canvas Renderer Module - Responsible for bar chart rendering and animation display
 */

const COLORS = {
    default: '#3b82f6',
    comparing: '#fbbf24',
    sorted: '#22c55e',
    pivot: '#ef4444',
    swapping: '#f97316',
    background: '#0d1235',
    grid: 'rgba(0, 212, 255, 0.05)',
    text: '#e2e8f0'
};

const GLOW_EFFECTS = {
    default: 'rgba(59, 130, 246, 0.3)',
    comparing: 'rgba(251, 191, 36, 0.5)',
    sorted: 'rgba(34, 197, 94, 0.5)',
    pivot: 'rgba(239, 68, 68, 0.5)',
    swapping: 'rgba(249, 115, 22, 0.5)'
};

export const RendererModule = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 400,
    padding: {
        top: 30,
        right: 20,
        bottom: 50,
        left: 20
    },
    barSpacing: 2,

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        this.clear();
    },

    clear() {
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.drawGrid();
    },

    drawGrid() {
        this.ctx.strokeStyle = COLORS.grid;
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        
        for (let y = this.padding.top; y <= this.height - this.padding.bottom; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding.left, y);
            this.ctx.lineTo(this.width - this.padding.right, y);
            this.ctx.stroke();
        }
    },

    calculateBarWidth(arrayLength) {
        const chartWidth = this.width - this.padding.left - this.padding.right;
        const totalSpacing = (arrayLength - 1) * this.barSpacing;
        const availableWidth = chartWidth - totalSpacing;
        return Math.max(2, Math.floor(availableWidth / arrayLength));
    },

    getBarColor(index, highlighting) {
        if (highlighting.swapping.includes(index)) {
            return 'swapping';
        }
        if (highlighting.pivot.includes(index)) {
            return 'pivot';
        }
        if (highlighting.comparing.includes(index)) {
            return 'comparing';
        }
        if (highlighting.sorted.includes(index)) {
            return 'sorted';
        }
        return 'default';
    },

    drawBar(x, y, width, height, colorType, value, showValue = true) {
        const color = COLORS[colorType];
        const glowColor = GLOW_EFFECTS[colorType];
        
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = colorType !== 'default' ? 15 : 5;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        const gradient = this.ctx.createLinearGradient(x, y + height, x, y);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.lightenColor(color, 30));
        
        this.ctx.fillStyle = gradient;
        
        const radius = Math.min(4, width / 2);
        this.roundRect(x, y, width, height, radius);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        this.ctx.strokeStyle = this.lightenColor(color, 50);
        this.ctx.lineWidth = 1;
        this.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, radius);
        this.ctx.stroke();
        
        if (showValue && width >= 15 && height >= 20) {
            this.ctx.fillStyle = COLORS.text;
            this.ctx.font = this.getValueFont(width);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            
            const textY = y - 5;
            if (textY > 10) {
                this.ctx.fillText(value.toString(), x + width / 2, textY);
            }
        }
    },

    getValueFont(barWidth) {
        if (barWidth >= 30) {
            return 'bold 11px "Courier New", monospace';
        }
        if (barWidth >= 20) {
            return 'bold 9px "Courier New", monospace';
        }
        return 'bold 8px "Courier New", monospace';
    },

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x, y + height);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    render(array, highlighting = {
        comparing: [],
        sorted: [],
        pivot: [],
        swapping: []
    }) {
        this.clear();
        
        if (!array || array.length === 0) {
            return;
        }
        
        const barWidth = this.calculateBarWidth(array.length);
        const chartWidth = this.width - this.padding.left - this.padding.right;
        const chartHeight = this.height - this.padding.top - this.padding.bottom;
        
        const totalSpacing = (array.length - 1) * this.barSpacing;
        const totalBarWidth = array.length * barWidth;
        const extraSpacing = chartWidth - totalBarWidth - totalSpacing;
        const startX = this.padding.left + extraSpacing / 2;
        
        const maxValue = Math.max(...array);
        const valueScale = chartHeight / maxValue;
        
        for (let i = 0; i < array.length; i++) {
            const value = array[i];
            const barHeight = Math.max(2, Math.round(value * valueScale));
            const x = startX + i * (barWidth + this.barSpacing);
            const y = this.height - this.padding.bottom - barHeight;
            
            const colorType = this.getBarColor(i, highlighting);
            const showValue = barWidth >= 15;
            
            this.drawBar(x, y, barWidth, barHeight, colorType, value, showValue);
        }
        
        this.drawAxis(chartHeight);
    },

    drawAxis(chartHeight) {
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding.left, this.height - this.padding.bottom);
        this.ctx.lineTo(this.width - this.padding.right, this.height - this.padding.bottom);
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        this.ctx.font = '10px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        
        const yAxisTop = this.padding.top;
        const yAxisBottom = this.height - this.padding.bottom;
        
        this.ctx.fillText('0', this.padding.left - 15, yAxisBottom);
        this.ctx.fillText('Max', this.padding.left - 25, yAxisTop);
    },

    createSnapshot() {
        return this.canvas.toDataURL('image/png');
    },

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    },

    showMessage(message, duration = 2000) {
        const overlay = document.getElementById('statusOverlay');
        const statusText = document.getElementById('statusText');
        
        if (overlay && statusText) {
            statusText.textContent = message;
            overlay.style.opacity = '1';
            
            if (duration > 0) {
                setTimeout(() => {
                    overlay.style.opacity = '0.8';
                }, duration);
            }
        }
    },

    updateStatus(status) {
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = status;
        }
    }
};

export default RendererModule;