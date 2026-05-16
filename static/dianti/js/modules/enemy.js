const Enemy = (() => {
    class Enemy {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = 50;
            this.height = 85;
            this.maxHealth = Constants.ENEMY.maxHealth;
            this.health = Constants.ENEMY.maxHealth;
            this.attack = Constants.ENEMY.attack;
            this.speed = Constants.ENEMY.speed;
            this.color = Constants.ENEMY.color;
            this.state = Constants.ENEMY_STATES.IDLE;
            this.attackCooldown = 0;
            this.decisionTimer = 0;
            this.patrolTarget = null;
            this.patrolTimer = 0;
            this.velocityX = 0;
            this.velocityY = 0;
            this.isHit = false;
            this.hitTimer = 0;
        }
        
        update(deltaTime, player, elevator, enemies) {
            const dx = player.x + player.width / 2 - (this.x + this.width / 2);
            const dy = player.y + player.height / 2 - (this.y + this.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.decisionTimer += deltaTime;
            if (this.decisionTimer > 500) {
                this.decisionTimer = 0;
                this.makeDecision(distance, dx, dy);
            }
            
            this.executeState(deltaTime, player, elevator, dx, dy, distance);
            
            if (this.attackCooldown > 0) {
                this.attackCooldown -= deltaTime;
            }
            
            if (this.isHit) {
                this.hitTimer -= deltaTime;
                if (this.hitTimer <= 0) {
                    this.isHit = false;
                }
            }
            
            const newX = this.x + this.velocityX;
            const newY = this.y + this.velocityY;
            
            const minX = elevator.x + 30;
            const maxX = elevator.x + elevator.width - this.width - 30;
            const minY = elevator.y + 90;
            const maxY = elevator.y + elevator.height - this.height - 30;
            
            this.x = Math.max(minX, Math.min(maxX, newX));
            this.y = Math.max(minY, Math.min(maxY, newY));
            
            enemies.forEach(other => {
                if (other !== this) {
                    this.resolveCollision(other);
                }
            });
        }
        
        resolveCollision(other) {
            const dx = (this.x + this.width / 2) - (other.x + other.width / 2);
            const dy = (this.y + this.height / 2) - (other.y + other.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.width + other.width) / 2;
            
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const ratio = overlap / distance / 2;
                this.x += dx * ratio;
                this.y += dy * ratio;
            }
        }
        
        makeDecision(distance) {
            let distanceCategory;
            if (distance > Constants.DISTANCE_THRESHOLDS.far) {
                distanceCategory = 'far';
            } else if (distance > Constants.DISTANCE_THRESHOLDS.medium) {
                distanceCategory = 'medium';
            } else {
                distanceCategory = 'near';
            }
            
            const weights = Constants.DECISION_WEIGHTS[distanceCategory];
            const random = Math.random();
            let cumulative = 0;
            
            const states = [
                Constants.ENEMY_STATES.APPROACH,
                Constants.ENEMY_STATES.ATTACK,
                Constants.ENEMY_STATES.PATROL,
                Constants.ENEMY_STATES.RETREAT
            ];
            
            for (let i = 0; i < weights.length; i++) {
                cumulative += weights[i];
                if (random < cumulative) {
                    if (states[i] === Constants.ENEMY_STATES.PATROL) {
                        this.setPatrolTarget();
                    }
                    this.state = states[i];
                    break;
                }
            }
        }
        
        setPatrolTarget() {
            const elevator = Constants.ELEVATOR;
            this.patrolTarget = {
                x: elevator.X + 50 + Math.random() * (elevator.WIDTH - 100),
                y: elevator.Y + 100 + Math.random() * (elevator.HEIGHT - 150)
            };
        }
        
        executeState(deltaTime, player, elevator, dx, dy, distance) {
            const normalizedDx = distance > 0 ? dx / distance : 0;
            const normalizedDy = distance > 0 ? dy / distance : 0;
            
            switch (this.state) {
                case Constants.ENEMY_STATES.IDLE:
                    this.velocityX = 0;
                    this.velocityY = 0;
                    break;
                    
                case Constants.ENEMY_STATES.APPROACH:
                    this.velocityX = normalizedDx * this.speed;
                    this.velocityY = normalizedDy * this.speed;
                    break;
                    
                case Constants.ENEMY_STATES.ATTACK:
                    if (distance < Constants.ENEMY.attackRange && this.attackCooldown <= 0) {
                        this.performAttack(player);
                    } else {
                        this.velocityX = normalizedDx * this.speed;
                        this.velocityY = normalizedDy * this.speed;
                    }
                    break;
                    
                case Constants.ENEMY_STATES.RETREAT:
                    this.velocityX = -normalizedDx * this.speed * 1.5;
                    this.velocityY = -normalizedDy * this.speed * 1.5;
                    break;
                    
                case Constants.ENEMY_STATES.PATROL:
                    if (!this.patrolTarget) {
                        this.setPatrolTarget();
                    }
                    
                    const pdx = this.patrolTarget.x - this.x;
                    const pdy = this.patrolTarget.y - this.y;
                    const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                    
                    if (pdist < 20) {
                        this.patrolTimer += deltaTime;
                        this.velocityX = 0;
                        this.velocityY = 0;
                        if (this.patrolTimer > 1000) {
                            this.setPatrolTarget();
                            this.patrolTimer = 0;
                        }
                    } else {
                        this.velocityX = (pdx / pdist) * this.speed * 0.8;
                        this.velocityY = (pdy / pdist) * this.speed * 0.8;
                    }
                    break;
            }
        }
        
        performAttack(player) {
            this.attackCooldown = Constants.ENEMY.attackCooldown;
            player.takeDamage(this.attack);
        }
        
        takeDamage(damage) {
            this.health -= damage;
            this.isHit = true;
            this.hitTimer = 200;
            return this.health <= 0;
        }
        
        applyKnockback(force, directionX, directionY) {
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
            if (magnitude > 0) {
                this.x += (directionX / magnitude) * force;
                this.y += (directionY / magnitude) * force;
            }
        }
        
        getState() {
            return {
                x: this.x,
                y: this.y,
                health: this.health,
                state: this.state,
                patrolTarget: this.patrolTarget
            };
        }
        
        restoreState(state) {
            this.x = state.x;
            this.y = state.y;
            this.health = state.health;
            this.state = state.state;
            this.patrolTarget = state.patrolTarget;
        }
    }
    
    const createEnemy = (x, y) => {
        return new Enemy(x, y);
    };
    
    return {
        Enemy,
        createEnemy
    };
})();