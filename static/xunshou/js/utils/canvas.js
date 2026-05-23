const CanvasUtils = {
    ctx: null,
    canvas: null,
    width: 1200,
    height: 750,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textRendering = 'geometricPrecision';
    },

    clear(color = null) {
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, this.width, this.height);
        } else {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    },

    drawRect(x, y, width, height, color, radius = 0) {
        this.ctx.beginPath();
        if (radius > 0) {
            this.ctx.roundRect(x, y, width, height, radius);
        } else {
            this.ctx.rect(x, y, width, height);
        }
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.closePath();
    },

    drawStrokeRect(x, y, width, height, color, lineWidth = 2, radius = 0) {
        this.ctx.beginPath();
        if (radius > 0) {
            this.ctx.roundRect(x, y, width, height, radius);
        } else {
            this.ctx.rect(x, y, width, height);
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
        this.ctx.closePath();
    },

    drawCircle(x, y, radius, color) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.closePath();
    },

    drawStrokeCircle(x, y, radius, color, lineWidth = 2) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.stroke();
        this.ctx.closePath();
    },

    drawText(text, x, y, options = {}) {
        const {
            fontSize = 16,
            color = '#000',
            fontFamily = 'Microsoft YaHei',
            align = 'left',
            baseline = 'top',
            bold = false,
            maxWidth = null
        } = options;

        this.ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        if (maxWidth) {
            this.ctx.fillText(text, x, y, maxWidth);
        } else {
            this.ctx.fillText(text, x, y);
        }
    },

    drawGradientRect(x, y, width, height, color1, color2, direction = 'vertical') {
        const gradient = this.ctx.createLinearGradient(
            x, y,
            direction === 'vertical' ? x : x + width,
            direction === 'vertical' ? y + height : y
        );
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    },

    drawHPBar(x, y, width, height, currentHp, maxHp, showText = true) {
        const ratio = Math.max(0, currentHp / maxHp);
        const barWidth = width * ratio;

        this.drawRect(x, y, width, height, '#333', 4);
        
        let barColor;
        if (ratio > 0.5) barColor = '#4CAF50';
        else if (ratio > 0.25) barColor = '#FF9800';
        else barColor = '#F44336';

        this.drawRect(x + 2, y + 2, barWidth - 4, height - 4, barColor, 3);

        if (showText) {
            this.drawText(`${currentHp}/${maxHp}`, x + width / 2, y + height / 2, {
                fontSize: 12,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });
        }
    },

    drawExpBar(x, y, width, height, currentExp, maxExp) {
        const ratio = maxExp > 0 ? currentExp / maxExp : 0;
        const barWidth = width * ratio;

        this.drawRect(x, y, width, height, '#333', 4);
        this.drawRect(x + 2, y + 2, barWidth - 4, height - 4, '#9C27B0', 3);
    },

    drawUltimateBar(x, y, width, height, charge, maxCharge) {
        const ratio = maxCharge > 0 ? charge / maxCharge : 0;
        const barWidth = width * ratio;

        this.drawRect(x, y, width, height, '#333', 4);
        this.drawRect(x + 2, y + 2, barWidth - 4, height - 4, '#FF9800', 3);
        
        if (ratio >= 1) {
            this.drawText('奥义就绪!', x + width / 2, y + height / 2, {
                fontSize: 12,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });
        }
    },

    drawButton(x, y, width, height, text, options = {}) {
        const {
            bgColor = '#4CAF50',
            textColor = '#fff',
            fontSize = 16,
            radius = 8,
            hover = false,
            disabled = false
        } = options;

        let actualBgColor = bgColor;
        if (disabled) {
            actualBgColor = '#999';
        } else if (hover) {
            actualBgColor = this.lightenColor(bgColor, 20);
        }

        this.drawRect(x, y, width, height, actualBgColor, radius);
        this.drawText(text, x + width / 2, y + height / 2, {
            fontSize,
            color: disabled ? '#ccc' : textColor,
            align: 'center',
            baseline: 'middle',
            bold: true
        });

        return {
            x, y, width, height,
            contains: (px, py) => px >= x && px <= x + width && py >= y && py <= y + height
        };
    },

    drawMonsterCard(x, y, width, height, monster, options = {}) {
        const {
            selected = false,
            isEnemy = false
        } = options;

        const typeColor = MonsterData.typeColors[monster.type];
        const rarityColor = MonsterData.rarities[monster.rarity.toUpperCase()].color;

        this.drawRect(x, y, width, height, '#fff', 10);
        
        this.drawRect(x, y, width, 8, rarityColor, [10, 10, 0, 0]);
        
        this.drawRect(x + 10, y + 15, width - 20, 60, '#f5f5f5', 5);
        
        this.drawText(monster.emoji, x + width / 2, y + 45, {
            fontSize: 40,
            align: 'center',
            baseline: 'middle'
        });

        this.drawText(monster.name, x + width / 2, y + 85, {
            fontSize: 14,
            align: 'center',
            bold: true
        });

        this.drawText(`Lv.${monster.level}`, x + width / 2, y + 105, {
            fontSize: 12,
            color: '#666',
            align: 'center'
        });

        this.drawRect(x + 10, y + 125, (width - 25) / 2, 20, typeColor, 4);
        this.drawText(MonsterData.typeNames[monster.type], x + 10 + (width - 25) / 4, y + 135, {
            fontSize: 11,
            color: '#fff',
            align: 'center',
            bold: true
        });

        const rarityName = MonsterData.rarities[monster.rarity.toUpperCase()].name;
        this.drawRect(x + 15 + (width - 25) / 2, y + 125, (width - 25) / 2, 20, rarityColor, 4);
        this.drawText(rarityName, x + 15 + (width - 25) / 2 + (width - 25) / 4, y + 135, {
            fontSize: 11,
            color: '#fff',
            align: 'center',
            bold: true
        });

        if (monster.currentHp !== undefined) {
            this.drawHPBar(x + 10, y + 150, width - 20, 15, monster.currentHp, monster.maxHp);
        }

        if (selected) {
            this.drawStrokeRect(x, y, width, height, '#FFD700', 3, 10);
        }

        return {
            x, y, width, height,
            contains: (px, py) => px >= x && px <= x + width && py >= y && py <= y + height
        };
    },

    drawStatusIcons(x, y, statusEffects, size = 20) {
        statusEffects.forEach((effect, index) => {
            const iconX = x + index * (size + 5);
            this.drawCircle(iconX, y, size / 2, effect.color);
            this.drawText(effect.name[0], iconX, y, {
                fontSize: 10,
                color: '#fff',
                align: 'center',
                baseline: 'middle'
            });
        });
    },

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    },

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    },

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.width / rect.width),
            y: (event.clientY - rect.top) * (this.height / rect.height)
        };
    }
};
