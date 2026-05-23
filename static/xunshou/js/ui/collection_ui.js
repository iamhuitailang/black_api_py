const CollectionUI = {
    buttons: [],
    monsterButtons: [],
    filterButtons: [],
    selectedMonster: null,
    filter: 'all',
    scrollOffset: 0,

    init() {
        this.buttons = [];
        this.monsterButtons = [];
        this.filterButtons = [];
        this.selectedMonster = null;
        this.filter = 'all';
        this.scrollOffset = 0;
    },

    render() {
        CanvasUtils.clear();
        this.drawBackground();

        this.drawFilters();
        this.drawMonsterList();
        this.drawStats();

        if (this.selectedMonster) {
            this.drawMonsterDetail();
        }

        this.drawBackButton();
    },

    drawBackground() {
        const width = CanvasUtils.width;
        const height = CanvasUtils.height;

        CanvasUtils.drawGradientRect(0, 0, width, height, '#FFF3E0', '#FFE0B2');
    },

    drawFilters() {
        const filters = [
            { id: 'all', label: '全部', x: 100, y: 20 },
            { id: 'fire', label: '🔥 火系', x: 200, y: 20 },
            { id: 'water', label: '💧 水系', x: 300, y: 20 },
            { id: 'grass', label: '🌿 草系', x: 400, y: 20 },
            { id: 'thunder', label: '⚡ 雷系', x: 500, y: 20 }
        ];

        this.filterButtons = [];
        filters.forEach(filter => {
            const isActive = this.filter === filter.id;
            const color = isActive ? 
                (filter.id === 'all' ? '#2196F3' : MonsterData.typeColors[filter.id]) : 
                '#999';
            
            CanvasUtils.drawRect(filter.x, filter.y, 90, 30, color, 5);
            CanvasUtils.drawText(filter.label, filter.x + 45, filter.y + 15, {
                fontSize: 12,
                color: '#fff',
                align: 'center',
                baseline: 'middle',
                bold: true
            });

            this.filterButtons.push({
                ...filter,
                contains: (px, py) => px >= filter.x && px <= filter.x + 90 && py >= filter.y && py <= filter.y + 30
            });
        });
    },

    drawMonsterList() {
        CanvasUtils.drawText('📖 异兽图鉴', 100, 70, {
            fontSize: 24,
            bold: true
        });

        this.monsterButtons = [];
        const collection = GameState.state.player.collection;
        let filteredMonsters = MonsterData.monsters;

        if (this.filter !== 'all') {
            filteredMonsters = filteredMonsters.filter(m => m.type === this.filter);
        }

        const cardWidth = 100;
        const cardHeight = 130;
        const startX = 100;
        const startY = 100;
        const gap = 15;
        const columns = 7;

        filteredMonsters.forEach((monster, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = startX + col * (cardWidth + gap);
            const y = startY + row * (cardHeight + gap);

            const collected = collection.find(m => m.monsterId === monster.id);
            
            if (collected) {
                CanvasUtils.drawMonsterCard(x, y, cardWidth, cardHeight, collected, {
                    selected: this.selectedMonster && this.selectedMonster.monsterId === monster.id
                });
            } else {
                CanvasUtils.drawRect(x, y, cardWidth, cardHeight, 'rgba(200, 200, 200, 0.5)', 10);
                CanvasUtils.drawText('❓', x + cardWidth / 2, y + cardHeight / 2, {
                    fontSize: 40,
                    align: 'center',
                    baseline: 'middle',
                    color: '#999'
                });
                CanvasUtils.drawText('???', x + cardWidth / 2, y + cardHeight - 15, {
                    fontSize: 12,
                    align: 'center',
                    color: '#999'
                });
            }

            if (collected) {
                this.monsterButtons.push({
                    x, y, width: cardWidth, height: cardHeight,
                    monster: collected,
                    contains: (px, py) => px >= x && px <= x + cardWidth && py >= y && py <= y + cardHeight
                });
            }
        });
    },

    drawStats() {
        const stats = TeamSystem.getCollectionStats();
        const x = 900;
        const y = 100;

        CanvasUtils.drawRect(x, y, 250, 300, 'rgba(255, 255, 255, 0.9)', 10);

        CanvasUtils.drawText('📊 收集进度', x + 15, y + 15, {
            fontSize: 16,
            bold: true
        });

        CanvasUtils.drawText(`总收集: ${stats.collected}/${stats.total}`, x + 15, y + 50, {
            fontSize: 14
        });

        const progress = stats.total > 0 ? (stats.collected / stats.total * 100).toFixed(1) : 0;
        CanvasUtils.drawText(`完成度: ${progress}%`, x + 15, y + 75, {
            fontSize: 14,
            color: '#4CAF50'
        });

        CanvasUtils.drawText('按属性:', x + 15, y + 110, {
            fontSize: 14,
            bold: true
        });

        const typeStats = [
            { name: '🔥 火系', count: stats.byType.fire, color: MonsterData.typeColors.fire },
            { name: '💧 水系', count: stats.byType.water, color: MonsterData.typeColors.water },
            { name: '🌿 草系', count: stats.byType.grass, color: MonsterData.typeColors.grass },
            { name: '⚡ 雷系', count: stats.byType.thunder, color: MonsterData.typeColors.thunder }
        ];

        typeStats.forEach((stat, index) => {
            CanvasUtils.drawText(`${stat.name}: ${stat.count}`, x + 15, y + 140 + index * 25, {
                fontSize: 12
            });
        });

        CanvasUtils.drawText('按稀有度:', x + 130, y + 110, {
            fontSize: 14,
            bold: true
        });

        const rarityStats = [
            { name: '普通', count: stats.byRarity.common },
            { name: '稀有', count: stats.byRarity.rare },
            { name: '史诗', count: stats.byRarity.epic },
            { name: '传说', count: stats.byRarity.legendary }
        ];

        rarityStats.forEach((stat, index) => {
            CanvasUtils.drawText(`${stat.name}: ${stat.count}`, x + 130, y + 140 + index * 25, {
                fontSize: 12
            });
        });
    },

    drawMonsterDetail() {
        const monster = this.selectedMonster;
        const template = MonsterData.getMonsterById(monster.monsterId);
        const x = 800;
        const y = 420;
        const width = 350;
        const height = 300;

        CanvasUtils.drawRect(x, y, width, height, 'rgba(255, 255, 255, 0.95)', 10);

        const rarityColor = MonsterData.rarities[monster.rarity.toUpperCase()].color;
        CanvasUtils.drawRect(x, y, width, 8, rarityColor, [10, 10, 0, 0]);

        CanvasUtils.drawText(monster.emoji, x + 60, y + 60, {
            fontSize: 60,
            align: 'center'
        });

        CanvasUtils.drawText(monster.name, x + 130, y + 40, {
            fontSize: 20,
            bold: true
        });

        const typeColor = MonsterData.typeColors[monster.type];
        CanvasUtils.drawRect(x + 130, y + 70, 60, 20, typeColor, 4);
        CanvasUtils.drawText(MonsterData.typeNames[monster.type], x + 160, y + 80, {
            fontSize: 11,
            color: '#fff',
            align: 'center',
            baseline: 'middle',
            bold: true
        });

        const rarityName = MonsterData.rarities[monster.rarity.toUpperCase()].name;
        CanvasUtils.drawRect(x + 200, y + 70, 60, 20, rarityColor, 4);
        CanvasUtils.drawText(rarityName, x + 230, y + 80, {
            fontSize: 11,
            color: '#fff',
            align: 'center',
            baseline: 'middle',
            bold: true
        });

        CanvasUtils.drawText(template.description, x + 15, y + 110, {
            fontSize: 11,
            color: '#666',
            maxWidth: width - 30
        });

        CanvasUtils.drawText(`Lv.${monster.level}`, x + 15, y + 150, {
            fontSize: 14
        });

        const stats = [
            { label: '❤️', value: monster.maxHp },
            { label: '⚔️', value: monster.atk },
            { label: '🛡️', value: monster.def },
            { label: '⚡', value: monster.spd }
        ];

        stats.forEach((stat, index) => {
            CanvasUtils.drawText(`${stat.label}: ${stat.value}`, x + 15 + (index % 2) * 100, y + 175 + Math.floor(index / 2) * 25, {
                fontSize: 12
            });
        });

        if (template.evolution) {
            const evolutionTemplate = MonsterData.getMonsterById(template.evolution.to);
            if (evolutionTemplate) {
                CanvasUtils.drawText(`进化: ${evolutionTemplate.emoji} ${evolutionTemplate.name} (Lv.${template.evolution.level})`, x + 15, y + 220, {
                    fontSize: 11,
                    color: '#9C27B0'
                });
            }
        }

        const inTeam = GameState.state.player.team.includes(monster.instanceId);
        this.addToTeamButton = CanvasUtils.drawButton(x + 15, y + 250, 150, 35, inTeam ? '✓ 已在队伍' : '➕ 加入队伍', {
            bgColor: inTeam ? '#999' : '#4CAF50',
            disabled: inTeam,
            fontSize: 12
        });

        this.healButton = CanvasUtils.drawButton(x + 175, y + 250, 150, 35, '❤️ 治疗', {
            bgColor: '#2196F3',
            fontSize: 12
        });
    },

    drawBackButton() {
        this.backButton = CanvasUtils.drawButton(50, 50, 100, 40, '← 返回', {
            bgColor: '#607D8B'
        });
    },

    handleClick(x, y) {
        if (this.backButton && this.backButton.contains(x, y)) {
            GameState.setCurrentScreen('menu');
            return true;
        }

        for (const button of this.filterButtons) {
            if (button.contains(x, y)) {
                this.filter = button.id;
                this.selectedMonster = null;
                return true;
            }
        }

        for (const button of this.monsterButtons) {
            if (button.contains(x, y)) {
                this.selectedMonster = button.monster;
                return true;
            }
        }

        if (this.selectedMonster) {
            if (this.addToTeamButton && this.addToTeamButton.contains(x, y)) {
                if (TeamSystem.addToTeam(this.selectedMonster)) {
                    GameState.showNotification(`${this.selectedMonster.name} 已加入队伍!`);
                }
                return true;
            }

            if (this.healButton && this.healButton.contains(x, y)) {
                TrainingSystem.healMonster(this.selectedMonster);
                GameState.showNotification(`${this.selectedMonster.name} 已恢复!`);
                return true;
            }
        }

        return false;
    },

    handleMouseMove(x, y) {
        const allButtons = [...this.filterButtons, ...this.monsterButtons];
        if (this.backButton) allButtons.push(this.backButton);
        if (this.addToTeamButton) allButtons.push(this.addToTeamButton);
        if (this.healButton) allButtons.push(this.healButton);

        for (const button of allButtons) {
            if (button && button.contains && button.contains(x, y)) {
                CanvasUtils.canvas.style.cursor = 'pointer';
                return;
            }
        }
        CanvasUtils.canvas.style.cursor = 'default';
    }
};
