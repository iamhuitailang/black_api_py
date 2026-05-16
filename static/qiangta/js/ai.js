const GameAI = {
    lastSpawnTime: 0,
    spawnInterval: 2000,

    update(gameState, deltaTime) {
        this.lastSpawnTime += deltaTime * 1000;
        
        if (this.lastSpawnTime >= this.spawnInterval) {
            this.decideSpawn(gameState);
            this.lastSpawnTime = 0;
            
            this.spawnInterval = 1500 + Math.random() * 2000;
        }
    },

    decideSpawn(gameState) {
        const gold = gameState.enemy.gold;
        const towerOwner = gameState.tower.owner;
        const playerHpPercent = gameState.player.baseHp / GameData.BASE.MAX_HP;
        
        const enemyCount = gameState.units.filter(u => u.team === 'enemy').length;
        const playerCount = gameState.units.filter(u => u.team === 'player').length;
        
        if (playerHpPercent < 0.3 && gold >= GameData.UNIT_TYPES.shield.cost * 2) {
            if (this.trySpawnUnit(gameState, 'shield')) {
                this.trySpawnUnit(gameState, 'shield');
                return;
            }
        }

        if (!towerOwner || towerOwner === 'player') {
            if (gold >= GameData.UNIT_TYPES.flying.cost && enemyCount < playerCount + 2) {
                if (this.trySpawnUnit(gameState, 'flying')) return;
            }
            if (gold >= GameData.UNIT_TYPES.soldier.cost * 3) {
                if (this.trySpawnUnit(gameState, 'soldier')) {
                    this.trySpawnUnit(gameState, 'soldier');
                    this.trySpawnUnit(gameState, 'soldier');
                    return;
                }
            }
        }

        if (gold >= GameData.UNIT_TYPES.mage.cost && Math.random() > 0.7) {
            if (this.trySpawnUnit(gameState, 'mage')) return;
        }

        if (gold >= GameData.UNIT_TYPES.archer.cost && Math.random() > 0.5) {
            if (this.trySpawnUnit(gameState, 'archer')) return;
        }

        if (gold >= GameData.UNIT_TYPES.shield.cost && Math.random() > 0.6) {
            if (this.trySpawnUnit(gameState, 'shield')) return;
        }

        this.trySpawnUnit(gameState, 'soldier');
    },

    trySpawnUnit(gameState, unitType) {
        const cost = GameData.UNIT_TYPES[unitType].cost;
        if (gameState.enemy.gold >= cost) {
            gameState.enemy.gold -= cost;
            
            const canvasWidth = gameState.canvas.width || 800;
            const canvasHeight = gameState.canvas.height || 600;
            const x = canvasWidth - GameData.BASE.WIDTH - 40;
            const y = canvasHeight / 2 + (Math.random() - 0.5) * 80;
            
            const unit = new Unit(unitType, 'enemy', x, y);
            gameState.units.push(unit);
            
            return true;
        }
        return false;
    },

    reset() {
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
    }
};