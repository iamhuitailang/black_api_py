var Game = (function() {
    'use strict';

    var gameState = null;
    var monsters = [];
    var bullets = [];
    var selectedTower = null;
    var gameLoop = null;
    var waveTimer = null;
    var spawnTimer = null;
    var autosaveTimer = null;
    var monstersToSpawn = 0;
    var spawnIndex = 0;
    var pausedMonstersToSpawn = 0;
    var pausedSpawnIndex = 0;
    var isWaitingNextWave = false;

    var elements = {};

    var CELL_SIZE = { width: 50, height: 50 };
    var GRID_OFFSET = { left: 0, top: 0 };

    function init() {
        cacheElements();
        bindEvents();
        loadOrCreateGame();
        calculateCellSize();
        renderGrid();
        
        if (monsters.length > 0) {
            monsters.forEach(function(monster) {
                renderMonster(monster);
            });
        }
        
        updateUI();
        updateButtonState();
        
        if (monsters.length > 0) {
            Utils.showToast('已恢复 ' + monsters.length + ' 只怪物的状态', 'info');
        }
    }

    function calculateCellSize() {
        var firstCell = elements.gameGrid.querySelector('.grid-cell');
        if (firstCell) {
            var rect = firstCell.getBoundingClientRect();
            CELL_SIZE = { width: rect.width, height: rect.height };
        }
        var gridRect = Utils.getElementPosition(elements.gameGrid);
        GRID_OFFSET = { left: gridRect.left, top: gridRect.top };
    }

    function cacheElements() {
        elements = {
            gameGrid: Utils.$('#game-grid'),
            gameContainer: Utils.$('#game-container'),
            startBtn: Utils.$('#start-btn'),
            restartBtn: Utils.$('#restart-btn'),
            retryBtn: Utils.$('#retry-btn'),
            goldDisplay: Utils.$('#gold-display'),
            hpDisplay: Utils.$('#hp-display'),
            waveDisplay: Utils.$('#wave-display'),
            monsterDisplay: Utils.$('#monster-display'),
            navGold: Utils.$('#nav-gold-value'),
            navHp: Utils.$('#nav-hp-value'),
            navWave: Utils.$('#nav-wave-value'),
            towerPanel: Utils.$('#tower-panel'),
            towerPanelClose: Utils.$('#tower-panel-close'),
            towerLevel: Utils.$('#tower-level'),
            towerDamage: Utils.$('#tower-damage'),
            towerRange: Utils.$('#tower-range'),
            towerSpeed: Utils.$('#tower-speed'),
            upgradeBtn: Utils.$('#upgrade-btn'),
            sellBtn: Utils.$('#sell-btn'),
            gameOverModal: Utils.$('#game-over-modal'),
            finalWaves: Utils.$('#final-waves'),
            finalGold: Utils.$('#final-gold'),
            finalKills: Utils.$('#final-kills')
        };
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', toggleGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.retryBtn.addEventListener('click', restartGame);
        elements.towerPanelClose.addEventListener('click', closeTowerPanel);
        elements.upgradeBtn.addEventListener('click', upgradeTower);
        elements.sellBtn.addEventListener('click', sellTower);
        
        elements.gameGrid.addEventListener('click', handleGridClick);
        
        document.addEventListener('click', function(e) {
            if (!elements.towerPanel.contains(e.target) && 
                !e.target.closest('.grid-cell.tower')) {
                closeTowerPanel();
            }
        });

        window.addEventListener('resize', Utils.debounce(function() {
            calculateCellSize();
            updateAllMonsterPositions();
            updateAllBulletPositions();
        }, 100));

        window.addEventListener('beforeunload', function(e) {
            if (gameState) {
                saveGameState();
            }
        });
    }

    function loadOrCreateGame() {
        var saved = Data.loadGame();
        if (saved) {
            gameState = saved;
            
            if (saved.monsters && saved.monsters.length > 0) {
                monsters = saved.monsters.map(function(savedMonster) {
                    var monsterConfig = Data.getMonsterConfig(savedMonster.type);
                    return {
                        id: savedMonster.id,
                        type: savedMonster.type,
                        hp: savedMonster.hp,
                        maxHp: savedMonster.maxHp,
                        speed: monsterConfig.speed,
                        icon: monsterConfig.icon,
                        goldReward: monsterConfig.goldReward,
                        pathIndex: savedMonster.pathIndex,
                        x: savedMonster.x,
                        y: savedMonster.y
                    };
                });
            }
            
            if (typeof saved.monstersToSpawn !== 'undefined') {
                monstersToSpawn = saved.monstersToSpawn;
            }
            if (typeof saved.spawnIndex !== 'undefined') {
                spawnIndex = saved.spawnIndex;
            }
            if (typeof saved.isWaitingNextWave !== 'undefined') {
                isWaitingNextWave = saved.isWaitingNextWave;
            }
        } else {
            gameState = Data.getDefaultSaveData();
            monsters = [];
            monstersToSpawn = 0;
            spawnIndex = 0;
            isWaitingNextWave = false;
        }
    }

    function renderGrid() {
        elements.gameGrid.innerHTML = '';
        calculateCellSize();
        
        for (var row = 0; row < Data.GAME_CONFIG.gridRows; row++) {
            for (var col = 0; col < Data.GAME_CONFIG.gridCols; col++) {
                var cell = Utils.createElement('div', 'grid-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                var cellType = Data.getCellType(row, col);
                Utils.addClass(cell, cellType);
                
                var icon = '';
                var existingTower = getTowerAt(row, col);
                
                if (existingTower) {
                    Utils.addClass(cell, 'tower');
                    var towerConfig = Data.getTowerConfig(existingTower.level);
                    icon = towerConfig.icon;
                    if (existingTower.level === 2) {
                        Utils.addClass(cell, 'level-2');
                    }
                } else if (cellType === 'start') {
                    icon = '🚪';
                } else if (cellType === 'end') {
                    icon = '🏠';
                }
                
                var iconEl = Utils.createElement('span', 'cell-icon', icon);
                cell.appendChild(iconEl);
                
                elements.gameGrid.appendChild(cell);
            }
        }
    }

    function getTowerAt(row, col) {
        return gameState.towers.find(function(tower) {
            return tower.row === row && tower.col === col;
        });
    }

    function handleGridClick(e) {
        var cell = e.target.closest('.grid-cell');
        if (!cell) return;
        
        var row = parseInt(cell.dataset.row);
        var col = parseInt(cell.dataset.col);
        
        var existingTower = getTowerAt(row, col);
        
        if (existingTower) {
            showTowerPanel(existingTower, row, col);
        } else if (canPlaceTower(row, col)) {
            placeTower(row, col);
        }
    }

    function canPlaceTower(row, col) {
        var cellType = Data.getCellType(row, col);
        
        if (cellType !== 'grass') {
            Utils.showToast('不能在路径、起点或终点放置塔！', 'warning');
            return false;
        }
        
        if (getTowerAt(row, col)) {
            Utils.showToast('这里已经有塔了！', 'warning');
            return false;
        }
        
        if (gameState.gold < Data.TOWER_CONFIG.basePrice) {
            Utils.showToast('金币不足！需要 ' + Data.TOWER_CONFIG.basePrice + ' 金币', 'error');
            return false;
        }
        
        return true;
    }

    function placeTower(row, col) {
        gameState.gold -= Data.TOWER_CONFIG.basePrice;
        
        var tower = {
            id: Utils.uuid(),
            row: row,
            col: col,
            level: 1,
            lastAttackTime: 0
        };
        
        gameState.towers.push(tower);
        
        saveGameState();
        renderGrid();
        updateUI();
        
        Utils.showToast('防御塔已放置！', 'success');
    }

    function showTowerPanel(tower, row, col) {
        selectedTower = tower;
        
        var towerConfig = Data.getTowerConfig(tower.level);
        
        elements.towerLevel.textContent = tower.level;
        elements.towerDamage.textContent = towerConfig.damage;
        elements.towerRange.textContent = towerConfig.range + '格';
        elements.towerSpeed.textContent = (towerConfig.attackSpeed / 1000) + '秒/次';
        
        if (tower.level === 2) {
            elements.upgradeBtn.disabled = true;
            elements.upgradeBtn.textContent = '已满级';
        } else {
            elements.upgradeBtn.disabled = gameState.gold < Data.TOWER_CONFIG.upgradePrice;
            elements.upgradeBtn.textContent = '⬆️ 升级 (' + Data.TOWER_CONFIG.upgradePrice + '💰)';
        }
        
        var sellPrice = Math.floor(Data.TOWER_CONFIG.basePrice * Data.TOWER_CONFIG.sellRatio);
        elements.sellBtn.textContent = '💰 出售 (' + sellPrice + '💰)';
        
        Utils.addClass(elements.towerPanel, 'show');
    }

    function closeTowerPanel() {
        Utils.removeClass(elements.towerPanel, 'show');
        selectedTower = null;
    }

    function upgradeTower() {
        if (!selectedTower) return;
        if (selectedTower.level >= 2) {
            Utils.showToast('塔已经是最高等级了！', 'warning');
            return;
        }
        
        if (gameState.gold < Data.TOWER_CONFIG.upgradePrice) {
            Utils.showToast('金币不足！需要 ' + Data.TOWER_CONFIG.upgradePrice + ' 金币', 'error');
            return;
        }
        
        gameState.gold -= Data.TOWER_CONFIG.upgradePrice;
        selectedTower.level = 2;
        
        saveGameState();
        renderGrid();
        updateUI();
        showTowerPanel(selectedTower, selectedTower.row, selectedTower.col);
        
        Utils.showToast('塔升级成功！攻击力40，攻速提升20%', 'success');
    }

    function sellTower() {
        if (!selectedTower) return;
        
        var sellPrice = Math.floor(Data.TOWER_CONFIG.basePrice * Data.TOWER_CONFIG.sellRatio);
        gameState.gold += sellPrice;
        
        gameState.towers = gameState.towers.filter(function(t) {
            return t.id !== selectedTower.id;
        });
        
        closeTowerPanel();
        saveGameState();
        renderGrid();
        updateUI();
        
        Utils.showToast('塔已出售，获得 ' + sellPrice + ' 金币', 'success');
    }

    function toggleGame() {
        if (!gameState.isStarted) {
            startGame();
        } else if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    function updateButtonState() {
        if (!gameState.isStarted) {
            elements.startBtn.textContent = '🎯 开始游戏';
        } else if (gameState.isPaused) {
            elements.startBtn.textContent = '▶️ 继续游戏';
        } else {
            elements.startBtn.textContent = '⏸️ 暂停游戏';
        }
    }

    function startGame() {
        gameState.isStarted = true;
        gameState.isPaused = false;
        isWaitingNextWave = false;
        
        updateButtonState();
        
        calculateCellSize();
        startGameLoop();
        startWave();
        
        Utils.showToast('游戏开始！第 ' + gameState.wave + ' 波来袭！', 'info');
    }

    function pauseGame() {
        gameState.isPaused = true;
        updateButtonState();
        
        pausedMonstersToSpawn = monstersToSpawn;
        pausedSpawnIndex = spawnIndex;
        
        stopGameLoop();
        stopWaveTimers();
        Utils.showToast('游戏已暂停', 'info');
    }

    function resumeGame() {
        gameState.isPaused = false;
        updateButtonState();
        
        calculateCellSize();
        startGameLoop();
        
        if (isWaitingNextWave) {
            Utils.showToast('等待下一波...', 'info');
        } else if (pausedSpawnIndex < pausedMonstersToSpawn) {
            monstersToSpawn = pausedMonstersToSpawn;
            spawnIndex = pausedSpawnIndex;
            spawnNextMonster();
            Utils.showToast('游戏继续，恢复怪物生成', 'info');
        } else if (monsters.length === 0 && monstersToSpawn === 0) {
            startWave();
            Utils.showToast('游戏继续，第 ' + gameState.wave + ' 波来袭！', 'info');
        } else {
            Utils.showToast('游戏继续', 'info');
        }
    }

    function startWave() {
        monstersToSpawn = Utils.random(Data.WAVE_CONFIG.minMonsters, Data.WAVE_CONFIG.maxMonsters);
        spawnIndex = 0;
        isWaitingNextWave = false;
        
        updateUI();
        
        spawnNextMonster();
    }

    function spawnNextMonster() {
        if (spawnIndex >= monstersToSpawn) {
            return;
        }
        
        if (gameState.isPaused) {
            return;
        }
        
        var types = ['normal', 'fast', 'tank'];
        var type = Utils.randomChoice(types);
        var monsterConfig = Data.getMonsterConfig(type);
        
        var startCell = Data.getPathCell(0);
        
        var monster = {
            id: Utils.uuid(),
            type: type,
            hp: monsterConfig.hp,
            maxHp: monsterConfig.maxHp,
            speed: monsterConfig.speed,
            icon: monsterConfig.icon,
            goldReward: monsterConfig.goldReward,
            pathIndex: 0,
            x: startCell.col * CELL_SIZE.width + CELL_SIZE.width / 2,
            y: startCell.row * CELL_SIZE.height + CELL_SIZE.height / 2
        };
        
        monsters.push(monster);
        renderMonster(monster);
        
        spawnIndex++;
        
        if (spawnIndex < monstersToSpawn) {
            spawnTimer = setTimeout(spawnNextMonster, Data.WAVE_CONFIG.spawnInterval);
        }
    }

    function renderMonster(monster) {
        calculateCellSize();
        
        var monsterEl = Utils.createElement('div', 'monster ' + monster.type);
        monsterEl.id = 'monster-' + monster.id;
        monsterEl.innerHTML = '<span class="hp-bar"><span class="hp-fill" style="width: 100%"></span></span>' + monster.icon;
        
        monsterEl.style.left = (monster.x - 16 + GRID_OFFSET.left) + 'px';
        monsterEl.style.top = (monster.y - 16 + GRID_OFFSET.top) + 'px';
        monsterEl.style.zIndex = '100';
        
        document.body.appendChild(monsterEl);
    }

    function updateMonsterPosition(monster) {
        var monsterEl = Utils.$('#monster-' + monster.id);
        if (!monsterEl) return;
        
        monsterEl.style.left = (monster.x - 16 + GRID_OFFSET.left) + 'px';
        monsterEl.style.top = (monster.y - 16 + GRID_OFFSET.top) + 'px';
        
        var hpPercent = Math.max(0, (monster.hp / monster.maxHp) * 100);
        var hpFill = monsterEl.querySelector('.hp-fill');
        if (hpFill) {
            hpFill.style.width = hpPercent + '%';
        }
    }

    function updateAllMonsterPositions() {
        calculateCellSize();
        monsters.forEach(function(monster) {
            updateMonsterPosition(monster);
        });
    }

    function updateAllBulletPositions() {
        calculateCellSize();
        bullets.forEach(function(bullet) {
            var bulletEl = Utils.$('#bullet-' + bullet.id);
            if (bulletEl) {
                bulletEl.style.left = (bullet.x - 5 + GRID_OFFSET.left) + 'px';
                bulletEl.style.top = (bullet.y - 5 + GRID_OFFSET.top) + 'px';
            }
        });
    }

    function removeMonsterElement(monster) {
        var monsterEl = Utils.$('#monster-' + monster.id);
        if (monsterEl) {
            Utils.removeElement(monsterEl);
        }
    }

    function startGameLoop() {
        if (gameLoop) return;
        
        var lastTime = Utils.now();
        
        if (!autosaveTimer) {
            autosaveTimer = setInterval(function() {
                if (gameState && gameState.isStarted && !gameState.isPaused) {
                    saveGameState();
                }
            }, 1000);
        }
        
        function loop() {
            if (gameState.isPaused) {
                gameLoop = requestAnimationFrame(loop);
                return;
            }
            
            var currentTime = Utils.now();
            var deltaTime = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;
            
            updateGame(deltaTime);
            
            gameLoop = requestAnimationFrame(loop);
        }
        
        gameLoop = requestAnimationFrame(loop);
    }

    function stopGameLoop() {
        if (gameLoop) {
            cancelAnimationFrame(gameLoop);
            gameLoop = null;
        }
        if (autosaveTimer) {
            clearInterval(autosaveTimer);
            autosaveTimer = null;
        }
    }

    function stopWaveTimers() {
        if (waveTimer) {
            clearTimeout(waveTimer);
            waveTimer = null;
        }
        if (spawnTimer) {
            clearTimeout(spawnTimer);
            spawnTimer = null;
        }
    }

    function updateGame(deltaTime) {
        updateMonsters(deltaTime);
        updateTowers(deltaTime);
        updateBullets(deltaTime);
        checkWaveComplete();
        checkGameOver();
        updateUI();
    }

    function updateMonsters(deltaTime) {
        var monstersToRemove = [];
        
        monsters.forEach(function(monster) {
            var currentPathCell = Data.getPathCell(monster.pathIndex);
            var nextPathCell = Data.getPathCell(monster.pathIndex + 1);
            
            if (!nextPathCell) {
                gameState.hp--;
                monstersToRemove.push(monster);
                Utils.showToast('一只怪物逃脱了！生命值 -1', 'error');
                return;
            }
            
            var targetX = nextPathCell.col * CELL_SIZE.width + CELL_SIZE.width / 2;
            var targetY = nextPathCell.row * CELL_SIZE.height + CELL_SIZE.height / 2;
            
            var dx = targetX - monster.x;
            var dy = targetY - monster.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            
            var maxMove = monster.speed * 3;
            
            if (dist < maxMove || dist < 3) {
                monster.pathIndex++;
                monster.x = targetX;
                monster.y = targetY;
            } else {
                var moveDistance = Math.min(monster.speed * (deltaTime / 16), maxMove);
                monster.x += (dx / dist) * moveDistance;
                monster.y += (dy / dist) * moveDistance;
            }
            
            updateMonsterPosition(monster);
        });
        
        monstersToRemove.forEach(function(monster) {
            removeMonsterElement(monster);
            monsters = monsters.filter(function(m) {
                return m.id !== monster.id;
            });
        });
        
        if (monstersToRemove.length > 0) {
            saveGameState();
        }
    }

    function updateTowers(deltaTime) {
        var currentTime = Utils.now();
        
        gameState.towers.forEach(function(tower) {
            var towerConfig = Data.getTowerConfig(tower.level);
            
            if (currentTime - tower.lastAttackTime < towerConfig.attackSpeed) {
                return;
            }
            
            var towerX = tower.col * CELL_SIZE.width + CELL_SIZE.width / 2;
            var towerY = tower.row * CELL_SIZE.height + CELL_SIZE.height / 2;
            
            var target = null;
            var maxPathIndex = -1;
            
            monsters.forEach(function(monster) {
                var dist = Utils.getDistance(towerX, towerY, monster.x, monster.y);
                var rangeInPixels = towerConfig.range * CELL_SIZE.width;
                
                if (dist <= rangeInPixels) {
                    if (monster.pathIndex > maxPathIndex) {
                        maxPathIndex = monster.pathIndex;
                        target = monster;
                    }
                }
            });
            
            if (target) {
                tower.lastAttackTime = currentTime;
                
                var cell = Utils.$('[data-row="' + tower.row + '"][data-col="' + tower.col + '"]');
                if (cell) {
                    Utils.addClass(cell, 'tower-attack');
                    setTimeout(function() {
                        Utils.removeClass(cell, 'tower-attack');
                    }, 200);
                }
                
                createBullet(tower, target, towerConfig);
            }
        });
    }

    function createBullet(tower, target, towerConfig) {
        var bullet = {
            id: Utils.uuid(),
            x: tower.col * CELL_SIZE.width + CELL_SIZE.width / 2,
            y: tower.row * CELL_SIZE.height + CELL_SIZE.height / 2,
            targetId: target.id,
            damage: towerConfig.damage,
            speed: 12,
            level: tower.level
        };
        
        bullets.push(bullet);
        
        var bulletEl = Utils.createElement('div', 'bullet level-' + tower.level);
        bulletEl.id = 'bullet-' + bullet.id;
        bulletEl.style.left = (bullet.x - 5 + GRID_OFFSET.left) + 'px';
        bulletEl.style.top = (bullet.y - 5 + GRID_OFFSET.top) + 'px';
        bulletEl.style.zIndex = '150';
        document.body.appendChild(bulletEl);
    }

    function updateBullets(deltaTime) {
        var bulletsToRemove = [];
        
        bullets.forEach(function(bullet) {
            var target = monsters.find(function(m) {
                return m.id === bullet.targetId;
            });
            
            if (!target) {
                bulletsToRemove.push(bullet);
                return;
            }
            
            var dx = target.x - bullet.x;
            var dy = target.y - bullet.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 15) {
                target.hp -= bullet.damage;
                
                var monsterEl = Utils.$('#monster-' + target.id);
                if (monsterEl) {
                    Utils.addClass(monsterEl, 'damage-flash');
                    setTimeout(function() {
                        Utils.removeClass(monsterEl, 'damage-flash');
                    }, 200);
                }
                
                if (target.hp <= 0) {
                    gameState.gold += target.goldReward;
                    gameState.totalKills++;
                    gameState.totalGoldEarned += target.goldReward;
                    
                    showCoinFloat(target.x + GRID_OFFSET.left, target.y + GRID_OFFSET.top);
                    
                    removeMonsterElement(target);
                    monsters = monsters.filter(function(m) {
                        return m.id !== target.id;
                    });
                    
                    Utils.showToast('击杀怪物！+10 金币', 'success');
                    saveGameState();
                }
                
                bulletsToRemove.push(bullet);
            } else {
                var moveDistance = bullet.speed;
                bullet.x += (dx / dist) * moveDistance;
                bullet.y += (dy / dist) * moveDistance;
                
                var bulletEl = Utils.$('#bullet-' + bullet.id);
                if (bulletEl) {
                    bulletEl.style.left = (bullet.x - 5 + GRID_OFFSET.left) + 'px';
                    bulletEl.style.top = (bullet.y - 5 + GRID_OFFSET.top) + 'px';
                }
            }
        });
        
        bulletsToRemove.forEach(function(bullet) {
            var bulletEl = Utils.$('#bullet-' + bullet.id);
            if (bulletEl) {
                Utils.removeElement(bulletEl);
            }
            bullets = bullets.filter(function(b) {
                return b.id !== bullet.id;
            });
        });
    }

    function showCoinFloat(x, y) {
        var coinEl = Utils.createElement('div', 'coin-float', '💰+10');
        coinEl.style.left = x + 'px';
        coinEl.style.top = y + 'px';
        coinEl.style.zIndex = '200';
        document.body.appendChild(coinEl);
        
        setTimeout(function() {
            Utils.removeElement(coinEl);
        }, 800);
    }

    function checkWaveComplete() {
        if (monsters.length === 0 && spawnIndex >= monstersToSpawn && gameState.isStarted && !gameState.isPaused) {
            if (!waveTimer && !isWaitingNextWave) {
                isWaitingNextWave = true;
                gameState.wave++;
                saveGameState();
                updateUI();
                
                Utils.showToast('波次 ' + (gameState.wave - 1) + ' 完成！10秒后下一波...', 'success');
                
                waveTimer = setTimeout(function() {
                    waveTimer = null;
                    startWave();
                    Utils.showToast('第 ' + gameState.wave + ' 波来袭！', 'info');
                }, Data.WAVE_CONFIG.interval);
            }
        }
    }

    function checkGameOver() {
        if (gameState.hp <= 0 && !Utils.hasClass(elements.gameOverModal, 'show')) {
            stopGameLoop();
            stopWaveTimers();
            
            elements.finalWaves.textContent = gameState.wave;
            elements.finalGold.textContent = gameState.totalGoldEarned;
            elements.finalKills.textContent = gameState.totalKills;
            
            Utils.addClass(elements.gameOverModal, 'show');
        }
    }

    function restartGame() {
        stopGameLoop();
        stopWaveTimers();
        
        monsters.forEach(function(monster) {
            removeMonsterElement(monster);
        });
        monsters = [];
        
        bullets.forEach(function(bullet) {
            var bulletEl = Utils.$('#bullet-' + bullet.id);
            if (bulletEl) {
                Utils.removeElement(bulletEl);
            }
        });
        bullets = [];
        
        monstersToSpawn = 0;
        spawnIndex = 0;
        pausedMonstersToSpawn = 0;
        pausedSpawnIndex = 0;
        isWaitingNextWave = false;
        
        Utils.removeClass(elements.gameOverModal, 'show');
        closeTowerPanel();
        
        gameState = Data.getDefaultSaveData();
        
        Data.clearSaveData();
        saveGameState();
        
        updateButtonState();
        
        renderGrid();
        updateUI();
        
        Utils.showToast('游戏已重置！', 'info');
    }

    function saveGameState() {
        var savedMonsters = monsters.map(function(monster) {
            return {
                id: monster.id,
                type: monster.type,
                hp: monster.hp,
                maxHp: monster.maxHp,
                pathIndex: monster.pathIndex,
                x: monster.x,
                y: monster.y
            };
        });
        
        Data.saveGame({
            level: gameState.level,
            gold: gameState.gold,
            hp: gameState.hp,
            wave: gameState.wave,
            totalKills: gameState.totalKills,
            totalGoldEarned: gameState.totalGoldEarned,
            towers: gameState.towers,
            monsters: savedMonsters,
            monstersToSpawn: monstersToSpawn,
            spawnIndex: spawnIndex,
            isWaitingNextWave: isWaitingNextWave,
            isStarted: gameState.isStarted,
            isPaused: gameState.isPaused
        });
    }

    function updateUI() {
        elements.goldDisplay.textContent = gameState.gold;
        elements.hpDisplay.textContent = gameState.hp;
        elements.waveDisplay.textContent = gameState.wave;
        
        var remaining = monsters.length + Math.max(0, monstersToSpawn - spawnIndex);
        elements.monsterDisplay.textContent = remaining;
        
        elements.navGold.textContent = gameState.gold;
        elements.navHp.textContent = gameState.hp;
        elements.navWave.textContent = gameState.wave;
    }

    return {
        init: init,
        getState: function() { return gameState; }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});
