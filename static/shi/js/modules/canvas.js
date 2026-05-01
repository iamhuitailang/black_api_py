const CanvasRenderer = (function() {
    'use strict';

    const COLORS = {
        inkBlack: '#1a1a1a',
        cinnabarRed: '#B22222',
        gold: '#D4AF37',
        ricePaper: '#F5F1E6',
        ricePaperDark: '#E8E0D0',
        lightGray: '#666666'
    };

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;

    let canvas = null;
    let ctx = null;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }

    function drawRicePaperBackground() {
        ctx.fillStyle = COLORS.ricePaper;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.save();
        ctx.globalAlpha = 0.03;
        
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            const radius = Math.random() * 2 + 0.5;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#000000' : '#8B4513';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.1;
        
        const gradient1 = ctx.createRadialGradient(
            CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.8, 0,
            CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.8, 200
        );
        gradient1.addColorStop(0, COLORS.gold);
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        const gradient2 = ctx.createRadialGradient(
            CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.2, 0,
            CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.2, 150
        );
        gradient2.addColorStop(0, COLORS.cinnabarRed);
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.restore();
    }

    function drawInkBorder() {
        const padding = 40;
        
        ctx.save();
        ctx.strokeStyle = COLORS.inkBlack;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        
        ctx.strokeRect(padding - 8, padding - 8, CANVAS_WIDTH - 2 * (padding - 8), CANVAS_HEIGHT - 2 * (padding - 8));
        
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 3;
        ctx.strokeRect(padding, padding, CANVAS_WIDTH - 2 * padding, CANVAS_HEIGHT - 2 * padding);
        
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = COLORS.inkBlack;
        
        for (let i = 0; i < 20; i++) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch(side) {
                case 0:
                    x = Math.random() * CANVAS_WIDTH;
                    y = padding + Math.random() * 20;
                    break;
                case 1:
                    x = Math.random() * CANVAS_WIDTH;
                    y = CANVAS_HEIGHT - padding - Math.random() * 20;
                    break;
                case 2:
                    x = padding + Math.random() * 20;
                    y = Math.random() * CANVAS_HEIGHT;
                    break;
                case 3:
                    x = CANVAS_WIDTH - padding - Math.random() * 20;
                    y = Math.random() * CANVAS_HEIGHT;
                    break;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 15 + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    function drawTitle() {
        ctx.save();
        ctx.font = 'bold 36px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
        ctx.fillStyle = COLORS.inkBlack;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText('藏头诗', CANVAS_WIDTH / 2, 80);
        
        ctx.strokeStyle = COLORS.inkBlack;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 - 80, 105);
        ctx.lineTo(CANVAS_WIDTH / 2 + 80, 105);
        ctx.stroke();
        
        ctx.restore();
    }

    function drawPoemText(poem) {
        if (!poem.success) return;

        const lines = poem.lines;
        const hideWords = poem.hideWords;
        const startY = 180;
        const lineHeight = 70;
        const centerX = CANVAS_WIDTH / 2;

        ctx.save();
        ctx.font = '32px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        lines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            
            const charSpacing = 20;
            const totalWidth = line.length * charSpacing;
            const startX = centerX - totalWidth / 2 + charSpacing / 2;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const x = startX + i * charSpacing;
                
                if (i === 0) {
                    ctx.fillStyle = COLORS.cinnabarRed;
                    ctx.font = 'bold 36px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
                } else {
                    ctx.fillStyle = COLORS.inkBlack;
                    ctx.font = '32px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
                }
                
                ctx.fillText(char, x, y);
            }
        });

        ctx.restore();
    }

    function drawPoemInfo(poem) {
        if (!poem.success) return;

        ctx.save();
        ctx.font = '18px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
        ctx.fillStyle = COLORS.lightGray;
        ctx.textAlign = 'center';
        
        const infoText = `关键词：${poem.keywords} | ${poem.formName} | ${poem.styleName}`;
        ctx.fillText(infoText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
        
        ctx.restore();
    }

    function drawSeal() {
        const sealX = CANVAS_WIDTH - 100;
        const sealY = CANVAS_HEIGHT - 120;
        const sealSize = 60;

        ctx.save();
        
        ctx.strokeStyle = COLORS.cinnabarRed;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(sealX, sealY, sealSize, sealSize);
        
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = COLORS.cinnabarRed;
        ctx.fillRect(sealX + 3, sealY + 3, sealSize - 6, sealSize - 6);
        
        ctx.globalAlpha = 0.6;
        ctx.font = 'bold 20px "STKaiti", "KaiTi", "KaiTi_GB2312", serif';
        ctx.fillStyle = COLORS.cinnabarRed;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('诗', sealX + sealSize / 2, sealY + sealSize / 2);
        
        ctx.restore();
    }

    function drawPlumBlossom() {
        ctx.save();
        ctx.globalAlpha = 0.3;
        
        const positions = [
            { x: 60, y: 120 },
            { x: CANVAS_WIDTH - 80, y: 150 },
            { x: 80, y: CANVAS_HEIGHT - 150 }
        ];

        positions.forEach(pos => {
            ctx.fillStyle = COLORS.cinnabarRed;
            
            const petalCount = 5;
            const petalRadius = 8;
            
            for (let i = 0; i < petalCount; i++) {
                const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
                const petalX = pos.x + Math.cos(angle) * petalRadius;
                const petalY = pos.y + Math.sin(angle) * petalRadius;
                
                ctx.beginPath();
                ctx.arc(petalX, petalY, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = COLORS.gold;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    function drawMountainSilhouette() {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = COLORS.inkBlack;
        
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        
        for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
            const y = CANVAS_HEIGHT - 80 - Math.sin(x * 0.01) * 30 - Math.sin(x * 0.02) * 20;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function drawCrane() {
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        const craneX = CANVAS_WIDTH - 150;
        const craneY = 130;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = COLORS.inkBlack;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.ellipse(craneX, craneY, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(craneX - 20, craneY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = COLORS.cinnabarRed;
        ctx.beginPath();
        ctx.moveTo(craneX - 28, craneY - 5);
        ctx.lineTo(craneX - 35, craneY - 3);
        ctx.lineTo(craneX - 28, craneY - 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = COLORS.inkBlack;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(craneX - 5, craneY - 5);
        ctx.lineTo(craneX + 25, craneY - 20);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(craneX + 5, craneY);
        ctx.lineTo(craneX + 30, craneY + 10);
        ctx.stroke();
        
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(craneX + 15, craneY + 5);
        ctx.lineTo(craneX + 35, craneY + 15);
        ctx.lineTo(craneX + 38, craneY + 12);
        ctx.stroke();
        
        ctx.restore();
    }

    function render(poem) {
        if (!canvas || !ctx) {
            console.error('Canvas未初始化');
            return null;
        }

        drawRicePaperBackground();
        drawMountainSilhouette();
        drawInkBorder();
        drawTitle();
        drawPoemText(poem);
        drawPoemInfo(poem);
        drawPlumBlossom();
        drawCrane();
        drawSeal();

        return canvas.toDataURL('image/png');
    }

    function downloadImage(filename = '藏头诗.png') {
        if (!canvas) return false;

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    }

    function getDataURL() {
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
    }

    return {
        init,
        render,
        downloadImage,
        getDataURL,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
    };
})();
