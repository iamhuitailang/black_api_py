const PosterRenderer = (function() {
    let canvas, ctx;
    let width, height;
    let bgImage = null;
    let loadedBgImages = {};
    let currentState = null;
    let isRendering = false;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
    }

    function fitText(text, maxWidth, maxFontSize) {
        let fontSize = maxFontSize;
        ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        while (ctx.measureText(text).width > maxWidth && fontSize > 12) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        }
        return fontSize;
    }

    function wrapText(text, maxWidth, maxFontSize, isBold = false) {
        const weight = isBold ? 'bold' : '';
        let fontSize = maxFontSize;
        ctx.font = `${weight} ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        
        while (ctx.measureText(text).width > maxWidth && fontSize > 12) {
            fontSize -= 2;
            ctx.font = `${weight} ${fontSize}px 'Segoe UI', Arial, sans-serif`;
        }
        
        return { fontSize, lines: [text] };
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    function render(state) {
        currentState = state;
        
        const style = PosterTemplates.getStyleById(state.styleId);
        const character = PosterTemplates.getCharacterById(state.characterId);
        const colors = state.customColors || style.colors;

        ctx.clearRect(0, 0, width, height);

        const bgReady = drawBackground(style, colors, state.backgroundImage);

        if (!bgReady) {
            return;
        }

        if (state.decorations.showLights) {
            drawSpotlights(colors);
        }

        if (style.background.type === 'stripes' && !state.backgroundImage) {
            drawStripes(style, colors);
        }

        if (style.background.type === 'paper' && !state.backgroundImage) {
            drawPaperTexture(style);
        }

        if (state.decorations.showStars) {
            drawStars(colors);
        }

        if (state.decorations.showFlags) {
            drawFlags(colors);
        }

        drawCircusTop(colors);

        drawTextContent(state, colors);

        drawCharacter(character, colors);

        if (state.decorations.showQR) {
            drawQRCode(state.qrLink, colors);
        }

        drawBorder(colors);
    }

    function drawBackground(style, colors, customBgImage) {
        if (customBgImage) {
            let img = loadedBgImages[customBgImage];
            if (!img) {
                img = new Image();
                img.src = customBgImage;
                loadedBgImages[customBgImage] = img;
            }
            
            if (img.complete && img.naturalWidth > 0) {
                const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
                const drawWidth = img.naturalWidth * scale;
                const drawHeight = img.naturalHeight * scale;
                const x = (width - drawWidth) / 2;
                const y = (height - drawHeight) / 2;
                ctx.drawImage(img, x, y, drawWidth, drawHeight);
                return true;
            } else {
                img.onload = function() {
                    if (currentState) {
                        render(currentState);
                    }
                };
                ctx.fillStyle = '#333';
                ctx.fillRect(0, 0, width, height);
                return false;
            }
        }

        if (style.background.type === 'gradient' || style.background.type === 'stripes') {
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            if (style.background.stops) {
                style.background.stops.forEach((color, index) => {
                    gradient.addColorStop(index / (style.background.stops.length - 1), color);
                });
            } else {
                gradient.addColorStop(0, colors.primary);
                gradient.addColorStop(1, colors.secondary);
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else if (style.background.type === 'paper') {
            ctx.fillStyle = style.background.baseColor;
            ctx.fillRect(0, 0, width, height);
        } else {
            ctx.fillStyle = colors.primary;
            ctx.fillRect(0, 0, width, height);
        }
        return true;
    }

    function drawStripes(style, colors) {
        const stripeWidth = 40;
        ctx.save();
        for (let x = 0; x < width + height; x += stripeWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x - height, height);
            ctx.lineTo(x - height + stripeWidth, height);
            ctx.lineTo(x + stripeWidth, 0);
            ctx.closePath();
            const stripeIndex = Math.floor(x / stripeWidth);
            ctx.fillStyle = stripeIndex % 2 === 0 ? style.background.colors[0] : style.background.colors[1];
            ctx.fill();
        }
        ctx.restore();
    }

    function drawPaperTexture(style) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 20;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);

        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawStars(colors) {
        const starCount = 25;
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * (height * 0.5);
            const size = Math.random() * 8 + 4;
            const opacity = Math.random() * 0.7 + 0.3;
            
            drawStar(x, y, 5, size, size / 2, colors, opacity);
        }
    }

    function drawStar(cx, cy, spikes, outerRadius, innerRadius, colors, opacity) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = colors.secondary;
        ctx.fill();
        ctx.restore();
    }

    function drawSpotlights(colors) {
        const rgb = hexToRgb(colors.secondary);
        
        const spotlights = [
            { x: width * 0.25, y: 0, radius: 200, angle: Math.PI / 6 },
            { x: width * 0.5, y: 0, radius: 250, angle: Math.PI / 5 },
            { x: width * 0.75, y: 0, radius: 200, angle: Math.PI / 6 }
        ];

        spotlights.forEach(light => {
            const gradient = ctx.createRadialGradient(
                light.x, light.y, 0,
                light.x, light.y, light.radius
            );
            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
            ctx.fillStyle = gradient;
            
            ctx.beginPath();
            ctx.moveTo(light.x, light.y);
            ctx.lineTo(
                light.x - Math.tan(light.angle) * light.radius,
                light.y + light.radius
            );
            ctx.lineTo(
                light.x + Math.tan(light.angle) * light.radius,
                light.y + light.radius
            );
            ctx.closePath();
            ctx.fill();
        });
    }

    function drawFlags(colors) {
        const flagColors = [colors.primary, colors.secondary, colors.text];
        const startY = 80;
        const flagWidth = 35;
        const flagHeight = 45;
        const spacing = flagWidth + 5;

        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-20, startY);
        ctx.lineTo(width + 20, startY + 10);
        ctx.stroke();

        let x = 20;
        let colorIndex = 0;
        while (x < width + flagWidth) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x + flagWidth, startY);
            ctx.lineTo(x + flagWidth / 2, startY + flagHeight);
            ctx.closePath();
            ctx.fillStyle = flagColors[colorIndex % flagColors.length];
            ctx.fill();

            x += spacing;
            colorIndex++;
        }
    }

    function drawCircusTop(colors) {
        const centerX = width / 2;
        const peakY = 60;
        const baseY = 150;
        const width_half = width / 2;

        ctx.beginPath();
        ctx.moveTo(centerX, peakY);
        ctx.lineTo(0, baseY);
        ctx.lineTo(width, baseY);
        ctx.closePath();
        ctx.fillStyle = colors.primary;
        ctx.fill();

        const stripeCount = 12;
        const stripeWidth = width / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(centerX, peakY);
                ctx.lineTo(i * stripeWidth, baseY);
                ctx.lineTo((i + 1) * stripeWidth, baseY);
                ctx.closePath();
                ctx.fillStyle = colors.secondary;
                ctx.fill();
            }
        }

        ctx.beginPath();
        ctx.moveTo(-20, baseY);
        ctx.lineTo(width + 20, baseY);
        ctx.lineTo(width + 20, baseY + 20);
        ctx.lineTo(-20, baseY + 20);
        ctx.closePath();
        ctx.fillStyle = colors.secondary;
        ctx.fill();

        ctx.fillStyle = colors.primary;
        for (let i = 0; i < 15; i++) {
            const circleX = (i / 14) * width;
            ctx.beginPath();
            ctx.arc(circleX, baseY + 10, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = colors.text;
        ctx.beginPath();
        ctx.arc(centerX, peakY - 15, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTextContent(state, colors) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxTextWidth = width - 100;

        if (state.title) {
            const fontSize = fitText(state.title, maxTextWidth, 50);
            ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.strokeStyle = colors.secondary;
            ctx.lineWidth = 4;
            ctx.strokeText(state.title, width / 2, 230);
            ctx.fillStyle = colors.text;
            ctx.fillText(state.title, width / 2, 230);
        }

        if (state.subtitle) {
            const subtitleText = state.subtitle;
            const subtitleSize = wrapText(subtitleText, maxTextWidth, 26);
            ctx.font = `${subtitleSize.fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = colors.text;
            ctx.fillText(subtitleText, width / 2, 280);
        }

        drawDecorativeLine(width / 2, 315, 300, colors);

        let yOffset = 355;
        const lineHeight = 35;
        const detailFontSize = 22;

        if (state.date) {
            const dateText = `📅 ${state.date}`;
            const dateSize = wrapText(dateText, maxTextWidth, detailFontSize);
            ctx.font = `${dateSize.fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = colors.text;
            ctx.fillText(dateText, width / 2, yOffset);
            yOffset += lineHeight;
        }

        if (state.location) {
            const locText = `📍 ${state.location}`;
            const locSize = wrapText(locText, maxTextWidth, detailFontSize);
            ctx.font = `${locSize.fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = colors.text;
            ctx.fillText(locText, width / 2, yOffset);
            yOffset += lineHeight;
        }

        if (state.price) {
            const priceText = `🎟️ ${state.price}`;
            const priceSize = wrapText(priceText, maxTextWidth, 28, true);
            ctx.font = `bold ${priceSize.fontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = colors.secondary;
            ctx.fillText(priceText, width / 2, yOffset);
        }
    }

    function drawDecorativeLine(x, y, length, colors) {
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - length / 2, y);
        ctx.lineTo(x + length / 2, y);
        ctx.stroke();

        ctx.fillStyle = colors.secondary;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        drawStar(x - length / 2 - 15, y, 5, 10, 5, colors, 1);
        drawStar(x + length / 2 + 15, y, 5, 10, 5, colors, 1);
    }

    function drawCharacter(character, colors) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 80px Arial';
        ctx.fillText(character.emoji, width / 2, 560);

        ctx.font = `bold 20px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = colors.secondary;
        ctx.fillText(character.name, width / 2, 610);
    }

    function drawQRCode(link, colors) {
        const qrSize = 80;
        const qrX = width - qrSize - 25;
        const qrY = height - qrSize - 40;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 3;
        ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        const qrCanvas = QRCodeGenerator.generateQRCode(link, qrSize);
        if (qrCanvas) {
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
        }

        ctx.font = `11px 'Segoe UI', Arial, sans-serif`;
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        ctx.fillText('扫码了解详情', qrX + qrSize / 2, qrY + qrSize + 15);
    }

    function drawBorder(colors) {
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, width, height);

        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        const cornerSize = 40;
        ctx.fillStyle = colors.secondary;
        drawCornerStar(25, 25, cornerSize, colors);
        drawCornerStar(width - 25, 25, cornerSize, colors);
        drawCornerStar(25, height - 25, cornerSize, colors);
        drawCornerStar(width - 25, height - 25, cornerSize, colors);
    }

    function drawCornerStar(cx, cy, size, colors) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = colors.secondary;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function downloadPoster(filename) {
        const link = document.createElement('a');
        link.download = filename || 'circus_poster.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function setBackgroundImage(imageData) {
        bgImage = imageData;
    }

    return {
        init,
        render,
        downloadPoster,
        setBackgroundImage
    };
})();
