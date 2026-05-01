/**
 * 幸运777老虎机游戏 - 渲染模块
 * 负责使用Canvas绘制转盘、图案和视觉效果
 */

const Renderer = (function() {
    'use strict';

    const { SYMBOLS } = GameConfig;

    let canvasElements = [];
    let contexts = [];
    let canvasWidth = 180;
    let canvasHeight = 180;

    /**
     * 初始化渲染器
     * @param {Array} canvasIds - Canvas元素的ID数组
     */
    function init(canvasIds) {
        canvasElements = canvasIds.map(id => document.getElementById(id));
        contexts = canvasElements.map(canvas => canvas.getContext('2d'));

        canvasWidth = canvasElements[0]?.width || 180;
        canvasHeight = canvasElements[0]?.height || 180;

        console.log('渲染器初始化完成');
    }

    /**
     * 清空指定转盘的画布
     * @param {number} reelIndex - 转盘索引（0-2）
     */
    function clearReel(reelIndex) {
        const ctx = contexts[reelIndex];
        if (!ctx) return;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    /**
     * 清空所有转盘的画布
     */
    function clearAllReels() {
        contexts.forEach((_, index) => clearReel(index));
    }

    /**
     * 绘制转盘背景
     * @param {number} reelIndex - 转盘索引
     * @param {Object} options - 绘制选项
     */
    function drawReelBackground(reelIndex, options = {}) {
        const ctx = contexts[reelIndex];
        if (!ctx) return;

        const { isWinning = false } = options;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f1a');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (isWinning) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4);
            ctx.shadowBlur = 0;
        }

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight / 3);
        ctx.lineTo(canvasWidth, canvasHeight / 3);
        ctx.moveTo(0, canvasHeight * 2 / 3);
        ctx.lineTo(canvasWidth, canvasHeight * 2 / 3);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * 绘制单个图案
     * @param {number} reelIndex - 转盘索引
     * @param {Object} symbol - 图案对象
     * @param {number} y - Y坐标位置
     * @param {Object} options - 绘制选项
     */
    function drawSymbol(reelIndex, symbol, y, options = {}) {
        const ctx = contexts[reelIndex];
        if (!ctx || !symbol) return;

        const { scale = 1, alpha = 1, isHighlight = false } = options;
        const centerX = canvasWidth / 2;
        const fontSize = 60 * scale;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (isHighlight) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;

            const glowGradient = ctx.createRadialGradient(
                centerX, y, 0,
                centerX, y, fontSize
            );
            glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(centerX, y, fontSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol.emoji, centerX, y);

        ctx.restore();
    }

    /**
     * 绘制转盘的三个图案（上、中、下）
     * @param {number} reelIndex - 转盘索引
     * @param {Array} symbolIndices - 三个图案的索引数组 [上, 中, 下]
     * @param {number} offsetY - Y轴偏移量（用于滚动动画）
     * @param {Object} options - 绘制选项
     */
    function drawReelSymbols(reelIndex, symbolIndices, offsetY = 0, options = {}) {
        const ctx = contexts[reelIndex];
        if (!ctx) return;

        const { isWinning = false, highlightIndex = 1 } = options;
        const slotHeight = canvasHeight / 3;

        drawReelBackground(reelIndex, { isWinning });

        const positions = [
            slotHeight / 2,
            slotHeight * 3 / 2,
            slotHeight * 5 / 2
        ];

        symbolIndices.forEach((symbolIdx, i) => {
            const symbol = SYMBOLS[symbolIdx] || SYMBOLS[0];
            const y = positions[i] + offsetY;

            const isInBounds = y > -slotHeight && y < canvasHeight + slotHeight;
            if (!isInBounds) return;

            const alpha = y < 0 || y > canvasHeight
                ? 1 - Math.abs(y - canvasHeight / 2) / (canvasHeight / 2)
                : 1;

            const isHighlight = i === highlightIndex && isWinning;
            drawSymbol(reelIndex, symbol, y, { alpha, isHighlight });
        });
    }

    /**
     * 绘制所有转盘
     * @param {Array} reelData - 转盘数据数组，每个元素是 [上, 中, 下] 图案索引
     * @param {Array} offsets - 每个转盘的Y轴偏移量
     * @param {Object} options - 绘制选项
     */
    function drawAllReels(reelData, offsets, options = {}) {
        const { winningReels = [] } = options;

        reelData.forEach((symbols, index) => {
            const isWinning = winningReels.includes(index);
            drawReelSymbols(index, symbols, offsets[index] || 0, {
                isWinning,
                highlightIndex: 1
            });
        });
    }

    /**
     * 绘制中奖闪烁效果
     * @param {number} reelIndex - 转盘索引
     * @param {number} intensity - 闪烁强度（0-1）
     */
    function drawWinFlash(reelIndex, intensity) {
        const ctx = contexts[reelIndex];
        if (!ctx) return;

        ctx.save();
        ctx.globalAlpha = intensity * 0.5;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }

    /**
     * 获取画布尺寸
     * @returns {Object} { width, height }
     */
    function getCanvasSize() {
        return {
            width: canvasWidth,
            height: canvasHeight
        };
    }

    /**
     * 调整画布尺寸
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     */
    function resizeCanvas(width, height) {
        canvasWidth = width;
        canvasHeight = height;

        canvasElements.forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
    }

    return {
        init,
        clearReel,
        clearAllReels,
        drawReelBackground,
        drawSymbol,
        drawReelSymbols,
        drawAllReels,
        drawWinFlash,
        getCanvasSize,
        resizeCanvas
    };
})();

window.Renderer = Renderer;
