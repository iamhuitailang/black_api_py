const AISystem = {
    update(deltaTime) {
        this.updateUnits(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateResourcePoints(deltaTime);
    },

    updateUnits(deltaTime) {
        GameState.units.forEach(unit => {
            if (unit.canGather) {
                this.updateWorkerAI(unit, deltaTime);
            } else if (unit.canAttack) {
                this.updateSoldierAI(unit, deltaTime);
            }
        });
    },

    updateWorkerAI(unit, deltaTime) {
        const colony = GameState.colony;
        if (!colony) return;

        if (unit.state === 'idle' || unit.state === 'returning') {
            if (unit.carrying > 0) {
                unit.state = 'returning';
                const reached = unit.moveTo(colony.x, colony.y, deltaTime);
                if (reached) {
                    const gatherBonus = GameState.getGatherBonus();
                    GameState.addFood(unit.carrying + gatherBonus);
                    RenderSystem.addEffect('heal', colony.x, colony.y - 50, unit.carrying + gatherBonus);
                    unit.carrying = 0;
                    unit.state = 'idle';
                }
            } else {
                const target = this.findNearestResourcePoint(unit);
                if (target) {
                    unit.state = 'gathering';
                    unit.target = target;
                } else {
                    const randomX = colony.x + (Math.random() - 0.5) * 200;
                    const randomY = colony.y - 100 - Math.random() * 100;
                    unit.moveTo(randomX, randomY, deltaTime);
                }
            }
        } else if (unit.state === 'gathering') {
            if (!unit.target || unit.target.isEmpty) {
                unit.state = 'idle';
                unit.target = null;
                return;
            }

            const distance = unit.distanceTo(unit.target.x, unit.target.y);
            if (distance < 25) {
                const gathered = unit.target.gather(unit.gatherAmount);
                if (gathered > 0) {
                    unit.carrying = gathered;
                    unit.state = 'returning';
                    unit.target = null;
                }
            } else {
                unit.moveTo(unit.target.x, unit.target.y, deltaTime);
            }
        }
    },

    updateSoldierAI(unit, deltaTime) {
        const target = this.findNearestEnemy(unit);
        
        if (target) {
            const distance = unit.distanceTo(target.x, target.y);
            
            if (distance <= unit.attackRange) {
                unit.state = 'attacking';
                const now = Date.now();
                if (now - unit.lastAttackTime >= unit.attackCooldown) {
                    CombatSystem.unitAttack(unit, target);
                    unit.lastAttackTime = now;
                }
            } else {
                unit.state = 'moving';
                unit.moveTo(target.x, target.y, deltaTime);
            }
        } else {
            const colony = GameState.colony;
            if (colony) {
                const distanceToColony = unit.distanceTo(colony.x, colony.y);
                if (distanceToColony > 150) {
                    unit.state = 'moving';
                    unit.moveTo(colony.x, colony.y - 80, deltaTime);
                } else {
                    unit.state = 'idle';
                }
            }
        }
    },

    updateEnemies(deltaTime) {
        const colony = GameState.colony;
        if (!colony) return;

        GameState.enemies.forEach(enemy => {
            const target = this.findNearestUnit(enemy);
            const distanceToColony = enemy.distanceTo(colony.x, colony.y);

            if (target && target.distance < enemy.attackRange) {
                enemy.state = 'attacking';
                const now = Date.now();
                if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
                    CombatSystem.enemyAttack(enemy, target.unit);
                    enemy.lastAttackTime = now;
                }
            } else if (distanceToColony < enemy.attackRange) {
                enemy.state = 'attacking';
                const now = Date.now();
                if (now - enemy.lastAttackTime >= enemy.attackCooldown) {
                    const damage = colony.takeDamage(enemy.attack);
                    RenderSystem.addEffect('damage', colony.x, colony.y - 50, Math.ceil(damage));
                    enemy.lastAttackTime = now;
                }
            } else {
                enemy.state = 'moving';
                enemy.moveTo(colony.x, colony.y, deltaTime);
            }
        });
    },

    updateResourcePoints(deltaTime) {
        GameState.resourcePoints.forEach(point => {
            point.update(deltaTime);
        });
    },

    findNearestResourcePoint(unit) {
        let nearest = null;
        let minDistance = Infinity;

        GameState.resourcePoints.forEach(point => {
            if (point.isEmpty) return;
            const distance = unit.distanceTo(point.x, point.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = point;
            }
        });

        return nearest;
    },

    findNearestEnemy(unit) {
        let nearest = null;
        let minDistance = Infinity;

        GameState.enemies.forEach(enemy => {
            if (unit.isFlying || !enemy.isFlying) {
                const distance = unit.distanceTo(enemy.x, enemy.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = enemy;
                }
            }
        });

        return nearest;
    },

    findNearestUnit(enemy) {
        let nearest = null;
        let minDistance = Infinity;

        GameState.units.forEach(unit => {
            if (!enemy.isFlying || unit.isFlying) {
                const distance = enemy.distanceTo(unit.x, unit.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = { unit, distance };
                }
            }
        });

        return nearest;
    }
};
