const Game = (() => {
    let player;
    let enemies = [];
    let traps = [];
    let fallingTraps = [];
    let items = [];
    let skillEffects = [];
    
    let elevator;
    let gameTime;
    let isRunning = false;
    let isPaused = false;
    let lastTime = 0;
    let enemiesKilled = 0;
    
    let trapSpawnTimer = 0;
    let enemySpawnTimer = 0;
    let itemSpawnTimer = 0;
    
    let elevatorShake = 0;
    
    const init = () => {
        elevator = {
            x: Constants.ELEVATOR.X,
            y: Constants.ELEVATOR.Y,
            width: Constants.ELEVATOR.WIDTH,
            height: Constants.ELEVATOR.HEIGHT,
            currentFloor: Constants.ELEVATOR.MIN_FLOOR,
            targetFloor: Constants.ELEVATOR.TARGET_FLOOR,
            speed: Constants.ELEVATOR.SPEED
        };
    };
    
    const startNewGame = (characterType) => {
        resetGame();
        player = Character.createPlayer(
            characterType,
            elevator.x + elevator.width / 2 - 20,
            elevator.y + elevator.height / 2
        );
        gameTime = Constants.GAME_DURATION;
        isRunning = true;
        isPaused = false;
        saveGame();
    };
    
    const resetGame = () => {
        enemies = [];
        traps = [];
        fallingTraps = [];
        items = [];
        skillEffects = [];
        enemiesKilled = 0;
        trapSpawnTimer = 0;
        enemySpawnTimer = 0;
        itemSpawnTimer = 0;
        elevatorShake = 0;
        
        elevator.currentFloor = Constants.ELEVATOR.MIN_FLOOR;
    };
    
    const loadSavedGame = () => {
        const savedState = Storage.load();
        if (!savedState) return false;
        
        try {
            player = Character.createPlayer(
                savedState.player.type,
                savedState.player.x,
                savedState.player.y
            );
            player.restoreState(savedState.player);
            
            elevator = savedState.elevator;
            gameTime = savedState.gameTime;
            enemiesKilled = savedState.enemiesKilled || 0;
            
            enemies = savedState.enemies.map(e => {
                const enemy = Enemy.createEnemy(e.x, e.y);
                enemy.restoreState(e);
                return enemy;
            });
            
            traps = savedState.traps.map(t => {
                const trap = Trap.createTrap(t.type, t.x, t.y, t.width, t.height);
                trap.restoreState(t);
                return trap;
            });
            
            items = savedState.items.map(i => {
                const item = Item.createItem(i.type, i.x, i.y);
                item.restoreState(i);
                return item;
            });
            
            isRunning = true;
            isPaused = false;
            return true;
        } catch (e) {
            console.error('加载游戏失败:', e);
            return false;
        }
    };
    
    const saveGame = () => {
        if (!player) return;
        
        const state = {
            player: player.getState(),
            elevator: elevator,
            gameTime: gameTime,
            enemiesKilled: enemiesKilled,
            enemies: enemies.map(e => e.getState()),
            traps: traps.map(t => t.getState()),
            items: items.map(i => i.getState())
        };
        
        Storage.save(state);
    };
    
    const update = (deltaTime) => {
        if (!isRunning || isPaused) return;
        
        gameTime -= deltaTime / 1000;
        
        elevator.currentFloor += elevator.speed * deltaTime / 1000;
        
        player.update(deltaTime, elevator);
        
        handlePlayerAttack();
        handlePlayerSkill();
        
        updateEnemies(deltaTime);
        updateTraps(deltaTime);
        updateFallingTraps(deltaTime);
        updateItems(deltaTime);
        updateSkillEffects(deltaTime);
        
        spawnEntities(deltaTime);
        checkGameEnd();
        
        resolvePlayerEnemyCollision();
        
        if (elevatorShake > 0) {
            elevatorShake -= deltaTime * 0.01;
        }
        
        Input.update();
        
        if (gameTime % 2 < deltaTime / 1000) {
            saveGame();
        }
    };
    
    const resolvePlayerEnemyCollision = () => {
        enemies.forEach(enemy => {
            const dx = (player.x + player.width / 2) - (enemy.x + enemy.width / 2);
            const dy = (player.y + player.height / 2) - (enemy.y + enemy.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (player.width + enemy.width) / 2;
            
            if (distance < minDistance && distance > 0) {
                const overlap = minDistance - distance;
                const ratio = overlap / distance / 2;
                player.x += dx * ratio;
                player.y += dy * ratio;
                enemy.x -= dx * ratio;
                enemy.y -= dy * ratio;
            }
        });
    };
    
    const handlePlayerAttack = () => {
        if (Input.isKeyJustPressed('Space')) {
            const attack = player.normalAttack();
            if (attack) {
                enemies.forEach(enemy => {
                    const dx = enemy.x + enemy.width / 2 - attack.x;
                    const dy = enemy.y + enemy.height / 2 - attack.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < attack.radius) {
                        const dead = enemy.takeDamage(attack.damage);
                        if (dead) {
                            enemiesKilled++;
                            player.skillEnergy = Math.min(100, player.skillEnergy + 15);
                        }
                    }
                });
                
                enemies = enemies.filter(e => e.health > 0);
            }
        }
    };
    
    const handlePlayerSkill = () => {
        if (Input.isKeyJustPressed('KeyQ') || Input.isKeyJustPressed('KeyE')) {
            const skill = player.useSkill();
            if (skill) {
                skillEffects.push({
                    ...skill,
                    timer: 500
                });
                
                enemies.forEach(enemy => {
                    const dx = enemy.x + enemy.width / 2 - (player.x + player.width / 2);
                    const dy = enemy.y + enemy.height / 2 - (player.y + player.height / 2);
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < skill.radius) {
                        if (skill.type === 'knockback') {
                            enemy.applyKnockback(50, dx, dy);
                        }
                    }
                });
            }
        }
    };
    
    const updateEnemies = (deltaTime) => {
        enemies.forEach(enemy => {
            enemy.update(deltaTime, player, elevator, enemies);
        });
    };
    
    const updateTraps = (deltaTime) => {
        traps.forEach(trap => {
            trap.update(deltaTime);
            
            if (trap.checkCollision(player)) {
                if (trap.damagePerSecond) {
                    player.takeDamage(trap.damage * deltaTime / 1000);
                } else {
                    player.takeDamage(trap.damage);
                }
                elevatorShake = 5;
            }
        });
        
        traps = traps.filter(t => t.active);
    };
    
    const updateFallingTraps = (deltaTime) => {
        fallingTraps.forEach(ft => {
            ft.trap.y += ft.fallSpeed;
            ft.trap.update(deltaTime);
            
            if (ft.trap.checkCollision(player)) {
                player.takeDamage(ft.trap.damage);
                elevatorShake = 10;
                ft.trap.active = false;
            }
            
            if (ft.trap.y > ft.targetY) {
                ft.trap.active = false;
            }
        });
        
        fallingTraps = fallingTraps.filter(ft => ft.trap.active);
    };
    
    const updateItems = (deltaTime) => {
        items.forEach(item => {
            item.update(deltaTime);
            
            if (item.checkCollision(player)) {
                const collected = item.collect();
                if (collected.type === 'health') {
                    player.heal(collected.value);
                } else if (collected.type === 'energy') {
                    player.skillEnergy = Math.min(100, player.skillEnergy + collected.value);
                }
            }
        });
        
        items = items.filter(i => !i.collected);
    };
    
    const updateSkillEffects = (deltaTime) => {
        skillEffects.forEach(effect => {
            effect.timer -= deltaTime;
        });
        skillEffects = skillEffects.filter(e => e.timer > 0);
    };
    
    const spawnEntities = (deltaTime) => {
        trapSpawnTimer += deltaTime;
        if (trapSpawnTimer > 3000 && traps.length + fallingTraps.length < 5) {
            trapSpawnTimer = 0;
            const trapData = Trap.generateRandomTrap(elevator);
            if (trapData.falling) {
                fallingTraps.push(trapData);
            } else {
                traps.push(trapData.trap);
            }
        }
        
        enemySpawnTimer += deltaTime;
        if (enemySpawnTimer > 5000 && enemies.length < 4) {
            enemySpawnTimer = 0;
            const x = elevator.x + 50 + Math.random() * (elevator.width - 120);
            const y = elevator.y + 150 + Math.random() * (elevator.height - 250);
            enemies.push(Enemy.createEnemy(x, y));
        }
        
        itemSpawnTimer += deltaTime;
        if (itemSpawnTimer > 8000 && items.length < 3) {
            itemSpawnTimer = 0;
            items.push(Item.generateRandomItem(elevator));
        }
    };
    
    const checkGameEnd = () => {
        if (player.health <= 0) {
            endGame(false);
        } else if (elevator.currentFloor >= elevator.targetFloor) {
            endGame(true);
        } else if (gameTime <= 0) {
            endGame(false);
        }
    };
    
    const endGame = (won) => {
        isRunning = false;
        Storage.clear();
        
        UI.showGameOver(won, {
            survivalTime: Math.floor(Constants.GAME_DURATION - gameTime),
            floor: Math.floor(elevator.currentFloor),
            enemiesKilled: enemiesKilled
        });
    };
    
    const render = () => {
        Renderer.clear();
        Renderer.drawBackground(elevator.currentFloor);
        Renderer.drawElevator(elevator, elevatorShake);
        
        traps.forEach(trap => Renderer.drawTrap(trap));
        fallingTraps.forEach(ft => Renderer.drawTrap(ft.trap));
        items.forEach(item => Renderer.drawItem(item));
        enemies.forEach(enemy => Renderer.drawEnemy(enemy));
        skillEffects.forEach(effect => Renderer.drawSkillEffect(effect));
        if (player) Renderer.drawPlayer(player);
    };
    
    const pause = () => {
        if (isRunning && !isPaused) {
            isPaused = true;
            UI.showPauseMenu();
            saveGame();
        }
    };
    
    const resume = () => {
        if (isRunning && isPaused) {
            isPaused = false;
            UI.hidePauseMenu();
        }
    };
    
    const togglePause = () => {
        if (isPaused) {
            resume();
        } else {
            pause();
        }
    };
    
    const gameLoop = (timestamp) => {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update(deltaTime);
        render();
        
        if (player) {
            UI.updateHealth(player.health, player.maxHealth);
            UI.updateSkill(player.skillEnergy, 100);
        }
        UI.updateTimer(Math.max(0, gameTime));
        UI.updateFloor(elevator.currentFloor);
    };
    
    const getPlayer = () => player;
    const getElevator = () => elevator;
    const getGameTime = () => gameTime;
    const getIsRunning = () => isRunning;
    const getIsPaused = () => isPaused;
    
    return {
        init,
        startNewGame,
        loadSavedGame,
        saveGame,
        pause,
        resume,
        togglePause,
        gameLoop,
        getPlayer,
        getElevator,
        getGameTime,
        getIsRunning,
        getIsPaused
    };
})();