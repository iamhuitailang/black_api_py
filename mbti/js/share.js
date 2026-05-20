const MBTIShare = (function() {
    function generateShareCard(result) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 900;

        canvas.width = width;
        canvas.height = height;

        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height)
        );
        gradient.addColorStop(0, '#1a1535');
        gradient.addColorStop(0.5, '#0f0a25');
        gradient.addColorStop(1, '#050515');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        drawDecorativeElements(ctx, width, height);

        if (result.typeInfo) {
            ctx.save();
            ctx.shadowBlur = 40;
            ctx.shadowColor = 'rgba(180, 140, 255, 0.6)';
            ctx.font = 'bold 96px serif';
            const textGradient = ctx.createLinearGradient(100, 120, width - 100, 120);
            textGradient.addColorStop(0, '#c0a0ff');
            textGradient.addColorStop(0.5, '#a080e0');
            textGradient.addColorStop(1, '#e0c0ff');
            ctx.fillStyle = textGradient;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(result.typeCode, width / 2, 140);
            ctx.restore();

            ctx.font = 'bold 32px sans-serif';
            ctx.fillStyle = '#e0d0ff';
            ctx.textAlign = 'center';
            ctx.fillText(result.typeInfo.name, width / 2, 200);

            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#a090c0';
            ctx.fillText(result.typeInfo.nickname, width / 2, 235);

            ctx.fillStyle = 'rgba(40, 35, 80, 0.6)';
            ctx.strokeStyle = 'rgba(150, 130, 220, 0.3)';
            ctx.lineWidth = 1;
            roundRect(ctx, 50, 270, width - 100, 180, 16);
            ctx.fill();
            ctx.stroke();

            drawShareDimensionBars(ctx, width, 305, result.dimensions);

            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#d0c0f0';
            ctx.textAlign = 'left';
            ctx.fillText('性格特征', 70, 490);

            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#b0a0d0';
            result.typeInfo.traits.slice(0, 4).forEach((trait, i) => {
                ctx.fillText(`✦ ${trait}`, 90, 525 + i * 28);
            });

            ctx.font = 'bold 18px sans-serif';
            ctx.fillStyle = '#d0c0f0';
            ctx.fillText('人格描述', 70, 660);

            ctx.font = '13px sans-serif';
            ctx.fillStyle = '#a090c0';
            const descLines = wrapText(ctx, result.typeInfo.description, width - 160);
            descLines.slice(0, 3).forEach((line, i) => {
                ctx.fillText(line, 90, 690 + i * 24);
            });

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#605080';
            ctx.textAlign = 'center';
            ctx.fillText('MBTI 人格测试 · 发现真实的自己', width / 2, height - 50);

            drawQRCode(ctx, width - 100, height - 90, 60);
        }

        showShareModal(canvas);
    }

    function drawDecorativeElements(ctx, width, height) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        const symbols = ['✦', '✧', '⬡', '◇', '✷', '❋'];
        for (let i = 0; i < 12; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 15 + Math.random() * 20;
            ctx.font = `${size}px serif`;
            ctx.fillStyle = '#a080e0';
            ctx.textAlign = 'center';
            ctx.fillText(symbols[i % symbols.length], x, y);
        }
        ctx.restore();

        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 160, 255, ${Math.random() * 0.5 + 0.2})`;
            ctx.fill();
        }
    }

    function drawShareDimensionBars(ctx, width, startY, dimensions) {
        const barWidth = 380;
        const barHeight = 10;
        const gap = 32;
        const centerX = width / 2;

        Object.entries(dimensions).forEach(([key, dim], i) => {
            const y = startY + i * gap;

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#8070a0';
            ctx.textAlign = 'right';
            ctx.fillText(dim.leftName, centerX - barWidth / 2 - 10, y + 8);
            ctx.textAlign = 'left';
            ctx.fillText(dim.rightName, centerX + barWidth / 2 + 10, y + 8);

            ctx.fillStyle = 'rgba(60, 50, 100, 0.5)';
            ctx.fillRect(centerX - barWidth / 2, y, barWidth, barHeight);

            if (dim.score !== 0) {
                const percentage = dim.percentage / 100;
                let fillWidth = (barWidth / 2) * percentage;
                let fillX;

                if (dim.score > 0) {
                    fillX = centerX - fillWidth;
                    const gradient = ctx.createLinearGradient(fillX, y, centerX, y);
                    gradient.addColorStop(0, '#a080e0');
                    gradient.addColorStop(1, '#6040a0');
                    ctx.fillStyle = gradient;
                } else {
                    fillX = centerX;
                    const gradient = ctx.createLinearGradient(centerX, y, centerX + fillWidth, y);
                    gradient.addColorStop(0, '#a080e0');
                    gradient.addColorStop(1, '#e0a0ff');
                    ctx.fillStyle = gradient;
                }

                ctx.fillRect(fillX, y, fillWidth, barHeight);
            }

            ctx.fillStyle = 'rgba(150, 130, 200, 0.5)';
            ctx.fillRect(centerX - 1, y - 2, 2, barHeight + 4);

            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#c0a0ff';
            ctx.textAlign = 'center';
            ctx.fillText(`${dim.score > 0 ? dim.left : dim.score < 0 ? dim.right : '-'} ${dim.percentage}%`, centerX, y - 4);
        });
    }

    function drawQRCode(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x - size / 2, y - size / 2, size, size);

        ctx.fillStyle = '#1a1535';
        const cellSize = size / 7;
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (Math.random() > 0.5 || i === 0 || i === 6 || j === 0 || j === 6) {
                    ctx.fillRect(
                        x - size / 2 + i * cellSize,
                        y - size / 2 + j * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }

        ctx.fillStyle = '#1a1535';
        ctx.fillRect(x - size / 2 + cellSize, y - size / 2 + cellSize, cellSize * 5, cellSize * 5);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x - size / 2 + cellSize * 2, y - size / 2 + cellSize * 2, cellSize * 3, cellSize * 3);
        ctx.fillStyle = '#1a1535';
        ctx.fillRect(x - size / 2 + cellSize * 2.5, y - size / 2 + cellSize * 2.5, cellSize * 2, cellSize * 2);

        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#8070a0';
        ctx.textAlign = 'center';
        ctx.fillText('扫码测试', x, y + size / 2 + 15);
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function wrapText(ctx, text, maxWidth) {
        const chars = text.split('');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < chars.length; i++) {
            const testLine = currentLine + chars[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = chars[i];
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    }

    function showShareModal(canvas) {
        const existingModal = document.querySelector('.share-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal share-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 640px;">
                <h3 style="text-align: center; margin-bottom: 20px; color: #e0d0ff;">分享你的人格类型</h3>
                <div class="share-canvas-container"></div>
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button class="mbti-button" id="downloadBtn">保存图片</button>
                    <button class="mbti-button primary" id="copyLinkBtn">复制链接</button>
                    <button class="mbti-button" id="closeShareBtn">关闭</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const container = modal.querySelector('.share-canvas-container');
        container.appendChild(canvas);

        modal.querySelector('#closeShareBtn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#downloadBtn').addEventListener('click', () => {
            downloadCanvasAsImage(canvas);
        });

        modal.querySelector('#copyLinkBtn').addEventListener('click', () => {
            copyShareLink();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    function downloadCanvasAsImage(canvas) {
        const link = document.createElement('a');
        link.download = `MBTI_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function copyShareLink() {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('链接已复制到剪贴板！');
        }).catch(() => {
            alert('复制失败，请手动复制链接');
        });
    }

    return {
        generateShareCard
    };
})();
