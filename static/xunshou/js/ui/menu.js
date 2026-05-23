const MenuUI = {
    buttons: [],
    hoveredButton: null,

    init() {
        this.buttons = [];
    },

    render() {
        const ctx = CanvasUtils.ctx;
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        CanvasUtils.clear();

        CanvasUtils.drawGradientRect(0, 0, width, height, '#b8e6ff', '#e8f5e9');

        this.drawClouds();
        this.drawDecorations();

        CanvasUtils.ctx.save();
        CanvasUtils.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        CanvasUtils.ctx.shadowBlur = 10;
        CanvasUtils.ctx.shadowOffsetY = 4;
        CanvasUtils.drawText('🐾 明星驯兽师 🐾', width / 2, 100, {
            fontSize: 48,
            color: '#fff',
            align: 'center',
            bold: true
        });
        CanvasUtils.ctx.restore();

        CanvasUtils.drawText('立志成为真正的驯兽师', width / 2, 160, {
            fontSize: 20,
            color: '#5d4037',
            align: 'center'
        });

        this.buttons = [];
        const buttonWidth = 220;
        const buttonHeight = 55;
        const buttonX = (width - buttonWidth) / 2;
        const startY = 250;
        const buttonGap = 18;

        this.buttons.push(
            CanvasUtils.drawButton(buttonX, startY, buttonWidth, buttonHeight, '🗺️ 探索冒险', {
                bgColor: '#66bb6a',
                radius: 25
            })
        );

        this.buttons.push(
            CanvasUtils.drawButton(buttonX, startY + buttonHeight + buttonGap, buttonWidth, buttonHeight, '⚔️ 关卡挑战', {
                bgColor: '#ef5350',
                radius: 25
            })
        );

        this.buttons.push(
            CanvasUtils.drawButton(buttonX, startY + (buttonHeight + buttonGap) * 2, buttonWidth, buttonHeight, '🐾 我的异兽', {
                bgColor: '#42a5f5',
                radius: 25
            })
        );

        this.buttons.push(
            CanvasUtils.drawButton(buttonX, startY + (buttonHeight + buttonGap) * 3, buttonWidth, buttonHeight, '📖 异兽图鉴', {
                bgColor: '#ab47bc',
                radius: 25
            })
        );

        this.buttons.push(
            CanvasUtils.drawButton(buttonX, startY + (buttonHeight + buttonGap) * 4, buttonWidth, buttonHeight, '🏪 道具商店', {
                bgColor: '#ffa726',
                radius: 25
            })
        );

        this.drawPlayerInfo();
    },

    drawClouds() {
        CanvasUtils.drawCircle(150, 80, 40, 'rgba(255, 255, 255, 0.9)');
        CanvasUtils.drawCircle(190, 75, 50, 'rgba(255, 255, 255, 0.9)');
        CanvasUtils.drawCircle(240, 80, 35, 'rgba(255, 255, 255, 0.9)');

        CanvasUtils.drawCircle(900, 100, 45, 'rgba(255, 255, 255, 0.85)');
        CanvasUtils.drawCircle(950, 95, 55, 'rgba(255, 255, 255, 0.85)');
        CanvasUtils.drawCircle(1000, 100, 40, 'rgba(255, 255, 255, 0.85)');
    },

    drawDecorations() {
        CanvasUtils.drawCircle(80, 720, 70, '#a5d6a7');
        CanvasUtils.drawCircle(280, 730, 55, '#81c784');
        CanvasUtils.drawCircle(500, 710, 65, '#a5d6a7');
        CanvasUtils.drawCircle(750, 725, 50, '#81c784');
        CanvasUtils.drawCircle(1000, 715, 70, '#a5d6a7');
        CanvasUtils.drawCircle(1150, 735, 55, '#81c784');

        CanvasUtils.drawText('\u{1F338}', 60, 680, { fontSize: 35 });
        CanvasUtils.drawText('\u{1F33C}', 380, 690, { fontSize: 30 });
        CanvasUtils.drawText('\u{1F33A}', 600, 670, { fontSize: 35 });
        CanvasUtils.drawText('\u{1F33B}', 900, 695, { fontSize: 30 });
        CanvasUtils.drawText('\u{1F340}', 1100, 680, { fontSize: 35 });
        CanvasUtils.drawText('\u{1F337}', 200, 695, { fontSize: 28 });
    },

    drawPlayerInfo() {
        const player = GameState.state.player;
        const width = CanvasUtils.width;

        CanvasUtils.drawRect(width - 290, 20, 270, 90, 'rgba(255, 255, 255, 0.95)', 15);
        CanvasUtils.drawStrokeRect(width - 290, 20, 270, 90, 'rgba(255, 183, 77, 0.5)', 2, 15);

        CanvasUtils.drawText(`👤 ${player.name}`, width - 280, 38, {
            fontSize: 16,
            bold: true
        });

        CanvasUtils.drawText(`Lv.${player.level}`, width - 280, 62, {
            fontSize: 14,
            color: '#666'
        });

        CanvasUtils.drawText(`💰 ${player.coins}`, width - 150, 62, {
            fontSize: 14,
            color: '#ff9800'
        });

        CanvasUtils.drawExpBar(width - 280, 82, 250, 16, player.exp, player.expToNext);
    },

    handleClick(x, y) {
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].contains(x, y)) {
                switch (i) {
                    case 0:
                        GameState.setCurrentScreen('exploration');
                        break;
                    case 1:
                        GameState.setCurrentScreen('stages');
                        break;
                    case 2:
                        GameState.setCurrentScreen('team');
                        break;
                    case 3:
                        GameState.setCurrentScreen('collection');
                        break;
                    case 4:
                        GameState.setCurrentScreen('shop');
                        break;
                }
                return true;
            }
        }
        return false;
    },

    handleMouseMove(x, y) {
        this.hoveredButton = null;
        for (let i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i].contains(x, y)) {
                this.hoveredButton = i;
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
