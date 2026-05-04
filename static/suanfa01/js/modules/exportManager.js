/**
 * 导出管理模块
 * 负责导出图片、保存/加载 JSON 文件等功能
 */

const ExportManager = {
    /**
     * 导出画布为 PNG 图片
     * @param {string} filename 文件名（可选）
     */
    exportAsPNG: function(filename) {
        // 创建临时画布，用于绘制完整内容
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // 获取所有节点和连线的边界
        const bounds = this.calculateContentBounds();
        
        if (!bounds) {
            this.showToast('画布为空，无法导出', 'error');
            return;
        }

        // 添加边距
        const padding = 50;
        const width = bounds.maxX - bounds.minX + padding * 2;
        const height = bounds.maxY - bounds.minY + padding * 2;

        // 设置临时画布大小
        const dpr = window.devicePixelRatio || 1;
        tempCanvas.width = width * dpr;
        tempCanvas.height = height * dpr;
        tempCanvas.style.width = width + 'px';
        tempCanvas.style.height = height + 'px';
        tempCtx.scale(dpr, dpr);

        // 绘制白色背景
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, width, height);

        // 应用偏移
        tempCtx.save();
        tempCtx.translate(padding - bounds.minX, padding - bounds.minY);

        // 绘制网格（可选，这里不绘制网格，保持图片干净）
        // this.drawGrid(tempCtx, width, height);

        // 绘制连线
        this.drawConnections(tempCtx);

        // 绘制节点
        this.drawNodes(tempCtx);

        tempCtx.restore();

        // 导出为图片
        try {
            const dataURL = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = filename || 'flowchart_' + Date.now() + '.png';
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast('导出成功！', 'success');
        } catch (error) {
            console.error('导出图片失败:', error);
            this.showToast('导出失败', 'error');
        }
    },

    /**
     * 计算内容边界
     */
    calculateContentBounds: function() {
        const nodes = NodeManager.getAllNodes();
        
        if (nodes.length === 0) {
            return null;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const node of nodes) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        }

        // 考虑连线标签
        const connections = ConnectionManager.getAllConnections();
        for (const conn of connections) {
            if (conn.label) {
                const labelPos = ConnectionManager.getLabelPosition(conn);
                if (labelPos) {
                    minX = Math.min(minX, labelPos.x - 100);
                    minY = Math.min(minY, labelPos.y - 30);
                    maxX = Math.max(maxX, labelPos.x + 100);
                    maxY = Math.max(maxY, labelPos.y + 30);
                }
            }
        }

        return { minX, minY, maxX, maxY };
    },

    /**
     * 绘制节点到临时画布
     */
    drawNodes: function(ctx) {
        const nodes = NodeManager.getAllNodes().sort((a, b) => a.zIndex - b.zIndex);

        for (const node of nodes) {
            this.drawNodeShape(ctx, node, false, false);
            this.drawNodeText(ctx, node);
        }
    },

    /**
     * 绘制节点形状
     */
    drawNodeShape: function(ctx, node, isSelected, isHovered) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;

        ctx.save();

        ctx.fillStyle = node.color;
        ctx.strokeStyle = isSelected ? '#3498db' : 'rgba(0,0,0,0.2)';
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();

        switch (node.type) {
            case 'ellipse':
                ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                break;

            case 'circle':
                const radius = Math.min(w, h) / 2;
                ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
                break;

            case 'diamond':
                ctx.moveTo(x + w / 2, y);
                ctx.lineTo(x + w, y + h / 2);
                ctx.lineTo(x + w / 2, y + h);
                ctx.lineTo(x, y + h / 2);
                ctx.closePath();
                break;

            case 'rounded-rect':
                const radiusRR = Math.min(15, w / 4, h / 4);
                ctx.moveTo(x + radiusRR, y);
                ctx.lineTo(x + w - radiusRR, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + radiusRR);
                ctx.lineTo(x + w, y + h - radiusRR);
                ctx.quadraticCurveTo(x + w, y + h, x + w - radiusRR, y + h);
                ctx.lineTo(x + radiusRR, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - radiusRR);
                ctx.lineTo(x, y + radiusRR);
                ctx.quadraticCurveTo(x, y, x + radiusRR, y);
                ctx.closePath();
                break;

            case 'document':
                const docFold = 15;
                ctx.moveTo(x, y);
                ctx.lineTo(x + w - docFold, y);
                ctx.lineTo(x + w, y + docFold);
                ctx.lineTo(x + w, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();
                break;

            case 'rectangle':
            default:
                ctx.rect(x, y, w, h);
                break;
        }

        ctx.fill();
        ctx.stroke();

        // 文档形的折叠角
        if (node.type === 'document') {
            const docFold = 15;
            ctx.beginPath();
            ctx.moveTo(x + w - docFold, y);
            ctx.lineTo(x + w - docFold, y + docFold);
            ctx.lineTo(x + w, y + docFold);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * 绘制节点文字
     */
    drawNodeText: function(ctx, node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;

        ctx.save();
        ctx.fillStyle = node.textColor;
        ctx.font = `${node.fontSize}px ${node.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = node.text.split('\n');
        const lineHeight = node.fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        let startY = y + h / 2 - totalHeight / 2 + lineHeight / 2;

        for (const line of lines) {
            let textToDraw = line;
            const maxWidth = w - 20;
            let textWidth = ctx.measureText(line).width;
            
            if (textWidth > maxWidth && line.length > 3) {
                const chars = line.split('');
                let currentText = '';
                for (const char of chars) {
                    const testText = currentText + char;
                    if (ctx.measureText(testText).width > maxWidth - 10) {
                        currentText += '...';
                        break;
                    }
                    currentText = testText;
                }
                textToDraw = currentText;
            }

            ctx.fillText(textToDraw, x + w / 2, startY);
            startY += lineHeight;
        }

        ctx.restore();
    },

    /**
     * 绘制连线到临时画布
     */
    drawConnections: function(ctx) {
        const connections = ConnectionManager.getAllConnections().sort((a, b) => a.zIndex - b.zIndex);

        for (const conn of connections) {
            this.drawConnectionLine(ctx, conn, false, false);
            this.drawConnectionLabel(ctx, conn);
        }
    },

    /**
     * 绘制连线路径
     */
    drawConnectionLine: function(ctx, conn, isSelected, isHovered) {
        const points = ConnectionManager.getConnectionPoints(conn);
        if (!points) return;

        ctx.save();

        ctx.strokeStyle = isSelected ? '#3498db' : conn.color;
        ctx.lineWidth = isSelected ? conn.width + 1 : conn.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.fillStyle = isSelected ? '#3498db' : conn.color;

        ctx.beginPath();

        switch (conn.lineStyle) {
            case 'curve': {
                const controlPoint1 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.33,
                    y: points.from.y
                };
                const controlPoint2 = {
                    x: points.from.x + (points.to.x - points.from.x) * 0.67,
                    y: points.to.y
                };

                ctx.moveTo(points.from.x, points.from.y);
                ctx.bezierCurveTo(
                    controlPoint1.x, controlPoint1.y,
                    controlPoint2.x, controlPoint2.y,
                    points.to.x, points.to.y
                );
                break;
            }

            case 'polyline': {
                const midX = (points.from.x + points.to.x) / 2;
                ctx.moveTo(points.from.x, points.from.y);
                ctx.lineTo(midX, points.from.y);
                ctx.lineTo(midX, points.to.y);
                ctx.lineTo(points.to.x, points.to.y);
                break;
            }

            case 'straight':
            default:
                ctx.moveTo(points.from.x, points.from.y);
                ctx.lineTo(points.to.x, points.to.y);
                break;
        }

        ctx.stroke();
        this.drawArrow(ctx, points.from, points.to, conn.lineStyle);

        ctx.restore();
    },

    /**
     * 绘制箭头
     */
    drawArrow: function(ctx, from, to, lineStyle) {
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;

        let angle;
        if (lineStyle === 'straight' || lineStyle === 'curve') {
            angle = Math.atan2(to.y - from.y, to.x - from.x);
        } else {
            angle = to.x > from.x ? 0 : Math.PI;
        }

        const point1 = {
            x: to.x - arrowLength * Math.cos(angle - arrowAngle),
            y: to.y - arrowLength * Math.sin(angle - arrowAngle)
        };
        const point2 = {
            x: to.x - arrowLength * Math.cos(angle + arrowAngle),
            y: to.y - arrowLength * Math.sin(angle + arrowAngle)
        };

        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        ctx.closePath();
        ctx.fill();
    },

    /**
     * 绘制连线标签
     */
    drawConnectionLabel: function(ctx, conn) {
        if (!conn.label) return;

        const labelPos = ConnectionManager.getLabelPosition(conn);
        if (!labelPos) return;

        const isSelected = conn.id === ConnectionManager.selectedConnectionId;

        ctx.save();

        ctx.font = `${conn.labelFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const textWidth = ctx.measureText(conn.label).width;
        const padding = 6;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = isSelected ? '#3498db' : '#ddd';
        ctx.lineWidth = 1;

        const bgX = labelPos.x - textWidth / 2 - padding;
        const bgY = labelPos.y - conn.labelFontSize / 2 - padding / 2;
        const bgW = textWidth + padding * 2;
        const bgH = conn.labelFontSize + padding;

        ctx.fillRect(bgX, bgY, bgW, bgH);
        ctx.strokeRect(bgX, bgY, bgW, bgH);

        ctx.fillStyle = conn.labelColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(conn.label, labelPos.x, labelPos.y);

        ctx.restore();
    },

    /**
     * 保存为 JSON 文件
     */
    saveAsJSON: function() {
        const data = CanvasManager.exportData();
        const jsonString = Storage.exportToJson(data);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'flowchart_' + Date.now() + '.json';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.showToast('保存成功！', 'success');
    },

    /**
     * 从文件加载 JSON
     */
    loadFromJSON: function(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (CanvasManager.importData(data)) {
                    this.showToast('加载成功！', 'success');
                } else {
                    this.showToast('加载失败：数据格式错误', 'error');
                }
            } catch (error) {
                console.error('解析 JSON 失败:', error);
                this.showToast('加载失败：无法解析文件', 'error');
            }
        };
        reader.onerror = () => {
            this.showToast('读取文件失败', 'error');
        };
        reader.readAsText(file);
    },

    /**
     * 显示提示信息
     */
    showToast: function(message, type = 'info') {
        // 移除现有的 toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        document.body.appendChild(toast);

        // 显示
        setTimeout(() => toast.classList.add('show'), 10);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// 暴露到全局
window.ExportManager = ExportManager;