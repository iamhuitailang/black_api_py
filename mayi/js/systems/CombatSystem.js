const CombatSystem = {
    unitAttack(unit, enemy) {
        const dead = enemy.takeDamage(unit.attack);
        RenderSystem.addEffect('damage', enemy.x, enemy.y - 20, unit.attack, '#ffff00');
        
        if (dead) {
            this.onEnemyDeath(enemy);
        }
    },

    enemyAttack(enemy, unit) {
        const dead = unit.takeDamage(enemy.attack);
        RenderSystem.addEffect('damage', unit.x, unit.y - 20, enemy.attack);
        
        if (dead) {
            this.onUnitDeath(unit);
        }
    },

    onEnemyDeath(enemy) {
        const index = GameState.enemies.indexOf(enemy);
        if (index > -1) {
            GameState.enemies.splice(index, 1);
        }
        
        GameState.addStone(enemy.reward);
        RenderSystem.addEffect('stone', enemy.x, enemy.y, enemy.reward);
        
        if (GameState.enemies.length === 0 && GameState.enemySpawnQueue.length === 0) {
            WaveSystem.onWaveComplete();
        }
    },

    onUnitDeath(unit) {
        const index = GameState.units.indexOf(unit);
        if (index > -1) {
            GameState.units.splice(index, 1);
        }
    },

    update(deltaTime) {
        GameState.units = GameState.units.filter(unit => unit.hp > 0);
        GameState.enemies = GameState.enemies.filter(enemy => enemy.hp > 0);
    }
};
