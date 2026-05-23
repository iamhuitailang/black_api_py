const ExplorationUI = {
    buttons: [],
    areaButtons: [],
    stageButtons: [],
    explorationResult: null,

    init() {
        this.buttons = [];
        this.areaButtons = [];
        this.stageButtons = [];
        this.explorationResult = null;
    },

    render() {
        CanvasUtils.clear();
        this.drawBackground();

        const areas = ExplorationSystem.getAvailableAreas();
        this.drawAreaList(areas);

        if (ExplorationSystem.explorationData && ExplorationSystem.explorationData.isExploring) {
            this.drawExplorationStatus();
        }

        this.drawBackButton();
    },

    renderStages() {
        CanvasUtils.clear();
        this.drawBackground();

        const currentArea = GameState.state.progress.currentArea;
        const area = LevelData.getAreaById(currentArea);
        const stages = ExplorationSystem.getAreaStages(currentArea);

        this.drawAreaInfo(area);
        this.drawStageList(stages, area);

        this.drawBackButton('exploration');
    },

    drawBackground() {
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        CanvasUtils.drawGradientRect(0, 0, width, height, '#c8e6ff', '#e8f5e9');

        CanvasUtils.drawRect(0, height - 180, width, 180, '#a5d6a7');

        CanvasUtils.drawCircle(100, height - 150, 45, '#81c784');
        CanvasUtils.drawCircle(250, height - 160, 35, '#a5d6a7');
        CanvasUtils.drawCircle(400, height - 145, 50, '#81c784');
        CanvasUtils.drawCircle(600, height - 155, 40, '#a5d6a7');
        CanvasUtils.drawCircle(800, height - 148, 45, '#81c784');
        CanvasUtils.drawCircle(1000, height - 158, 38, '#a5d6a7');
        CanvasUtils.drawCircle(1150, height - 150, 42, '#81c784');

        CanvasUtils.drawCircle(150, 100, 45, 'rgba(255, 255, 255, 0.85)');
        CanvasUtils.drawCircle(200, 90, 40, 'rgba(255, 255, 255, 0.85)');
        CanvasUtils.drawCircle(950, 110, 50, 'rgba(255, 255, 255, 0.85)');
        CanvasUtils.drawCircle(1000, 100, 35, 'rgba(255, 255, 255, 0.85)');

        CanvasUtils.drawText('\u{1F332}', 50, 220, { fontSize: 55 });
        CanvasUtils.drawText('\u{1F333}', 1100, 200, { fontSize: 65 });
        CanvasUtils.drawText('\u{1F338}', 300, 630, { fontSize: 35 });
        CanvasUtils.drawText('\u{1F33B}', 900, 640, { fontSize: 32 });
        CanvasUtils.drawText('\u{1F344}', 500, 635, { fontSize: 28 });
        CanvasUtils.drawText('\u{1F98B}', 700, 250, { fontSize: 25 });
    },

    drawAreaList(areas) {
        CanvasUtils.drawText('🗺️ 选择探索区域', CanvasUtils.width / 2, 50, {
            fontSize: 28,
            color: '#fff',
            align: 'center',
            bold: true
        });

        this.areaButtons = [];
        const cardWidth = 350;
        const cardHeight = 150;
        const startX = (CanvasUtils.width - cardWidth) / 2;
        const startY = 100;
        const gap = 20;

        areas.forEach((area, index) => {
            const x = startX;
            const y = startY + index * (cardHeight + gap);

            CanvasUtils.drawRect(x, y, cardWidth, cardHeight, area.unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(150, 150, 150, 0.7)', 10);

            if (area.completed) {
                CanvasUtils.drawRect(x, y, cardWidth, 8, '#4CAF50', [10, 10, 0, 0]);
            } else if (!area.unlocked) {
                CanvasUtils.drawRect(x, y, cardWidth, 8, '#999', [10, 10, 0, 0]);
            } else {
                CanvasUtils.drawRect(x, y, cardWidth, 8, area.background, [10, 10, 0, 0]);
            }

            CanvasUtils.drawText(area.name, x + 15, y + 25, {
                fontSize: 20,
                bold: true
            });

            CanvasUtils.drawText(`Lv.${area.level}`, x + 15, y + 55, {
                fontSize: 14,
                color: '#666'
            });

            CanvasUtils.drawText(area.description, x + 15, y + 80, {
                fontSize: 12,
                color: '#888',
                maxWidth: cardWidth - 30
            });

            if (area.unlocked) {
                const progressText = `进度: ${area.currentStage}/${area.stages}`;
                CanvasUtils.drawText(progressText, x + 15, y + 110, {
                    fontSize: 12,
                    color: '#4CAF50'
                });

                this.areaButtons.push({
                    x, y, width: cardWidth, height: cardHeight,
                    areaId: area.id,
                    contains: (px, py) => px >= x && px <= x + cardWidth && py >= y && py <= y + cardHeight
                });
            } else {
                CanvasUtils.drawText('🔒 未解锁', x + 15, y + 110, {
                    fontSize: 14,
                    color: '#999'
                });
            }
        });
    },

    drawAreaInfo(area) {
        CanvasUtils.drawText(area.name, CanvasUtils.width / 2, 50, {
            fontSize: 32,
            color: '#fff',
            align: 'center',
            bold: true
        });

        CanvasUtils.drawText(`Lv.${area.level}`, CanvasUtils.width / 2, 90, {
            fontSize: 18,
            color: '#fff',
            align: 'center'
        });

        CanvasUtils.drawText(area.description, CanvasUtils.width / 2, 120, {
            fontSize: 14,
            color: '#fff',
            align: 'center'
        });
    },

    drawStageList(stages, area) {
        this.stageButtons = [];
        const buttonWidth = 200;
        const buttonHeight = 60;
        const startX = 100;
        const startY = 200;
        const gap = 20;
        const columns = 5;

        stages.forEach((stage, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (buttonWidth + gap);
            const y = startY + row * (buttonHeight + gap);

            let bgColor = '#999';
            let text = `${stage.isBoss ? '👑 ' : ''}第 ${index + 1} 关`;

            if (stage.completed) {
                bgColor = '#4CAF50';
                text += ' ✓';
            } else if (stage.unlocked) {
                bgColor = stage.isBoss ? '#F44336' : '#2196F3';
            }

            CanvasUtils.drawRect(x, y, buttonWidth, buttonHeight, bgColor, 10);
            CanvasUtils.drawText(text, x + buttonWidth / 2, y + buttonHeight / 2, {
                fontSize: 16,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });

            if (stage.unlocked) {
                this.stageButtons.push({
                    x, y, width: buttonWidth, height: buttonHeight,
                    stageIndex: index,
                    contains: (px, py) => px >= x && px <= x + buttonWidth && py >= y && py <= y + buttonHeight
                });
            }
        });
    },

    drawExplorationStatus() {
        const data = ExplorationSystem.explorationData;
        const x = 50;
        const y = CanvasUtils.height - 180;
        const width = 400;
        const height = 150;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(0, 0, 0, 0.7)', 10);

        CanvasUtils.drawText('探索状态', x + 15, y + 15, {
            fontSize: 16,
            color: '#fff',
            bold: true
        });

        CanvasUtils.drawText(`步数: ${data.steps}`, x + 15, y + 45, {
            fontSize: 14,
            color: '#fff'
        });

        CanvasUtils.drawText(`遭遇次数: ${data.encounters}`, x + 15, y + 70, {
            fontSize: 14,
            color: '#fff'
        });

        CanvasUtils.drawText(`发现物品: ${data.itemsFound}`, x + 15, y + 95, {
            fontSize: 14,
            color: '#fff'
        });

        CanvasUtils.drawButton(x + 200, y + 50, 180, 40, '🚶 继续探索', {
            bgColor: '#4CAF50'
        });

        this.exploreButton = {
            x: x + 200, y: y + 50, width: 180, height: 40,
            contains: (px, py) => px >= x + 200 && px <= x + 380 && py >= y + 50 && py <= y + 90
        };
    },

    drawBackButton(targetScreen = 'menu') {
        this.backButton = CanvasUtils.drawButton(50, 50, 100, 40, '← 返回', {
            bgColor: '#607D8B'
        });
    },

    handleClick(x, y) {
        const currentScreen = GameState.state.ui.currentScreen;

        if (this.backButton && this.backButton.contains(x, y)) {
            if (currentScreen === 'stages') {
                GameState.setCurrentScreen('exploration');
            } else {
                GameState.setCurrentScreen('menu');
            }
            return true;
        }

        if (currentScreen === 'exploration') {
            for (const button of this.areaButtons) {
                if (button.contains(x, y)) {
                    ExplorationSystem.selectArea(button.areaId);
                    GameState.setCurrentScreen('stages');
                    return true;
                }
            }

            if (this.exploreButton && this.exploreButton.contains(x, y)) {
                const result = ExplorationSystem.takeStep();
                if (result && result.type === 'encounter' && result.monster) {
                    BattleSystem.initWildBattle(result.monster);
                    GameState.setCurrentScreen('battle');
                } else if (result) {
                    GameState.showNotification(result.message);
                }
                return true;
            }
        } else if (currentScreen === 'stages') {
            for (const button of this.stageButtons) {
                if (button.contains(x, y)) {
                    const areaId = GameState.state.progress.currentArea;
                    ExplorationSystem.startStageBattle(areaId, button.stageIndex);
                    return true;
                }
            }
        }

        return false;
    },

    handleMouseMove(x, y) {
        const allButtons = [...this.areaButtons, ...this.stageButtons];
        if (this.backButton) allButtons.push(this.backButton);
        if (this.exploreButton) allButtons.push(this.exploreButton);

        for (const button of allButtons) {
            if (button && button.contains(x, y)) {
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
