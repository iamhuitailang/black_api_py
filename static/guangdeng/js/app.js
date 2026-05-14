document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    
    let animationId = null;
    
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const pauseMenu = document.getElementById('pause-menu');
    const gameOverScreen = document.getElementById('game-over-screen');
    const upgradeMenu = document.getElementById('upgrade-menu');
    
    const startBtn = document.getElementById('start-btn');
    const continueBtn = document.getElementById('continue-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const speedBtn = document.getElementById('speed-btn');
    const startWaveBtn = document.getElementById('start-wave-btn');
    
    const goldDisplay = document.getElementById('gold-display');
    const livesDisplay = document.getElementById('lives-display');
    const waveDisplay = document.getElementById('wave-display');
    const totalWavesDisplay = document.getElementById('total-waves');
    
    const towerBtns = document.querySelectorAll('.tower-btn');
    const heroBtns = document.querySelectorAll('.hero-btn');
    
    function resizeCanvas() {
        const rect = gameScreen.getBoundingClientRect();
        const topBarHeight = document.getElementById('top-bar').offsetHeight;
        const bottomBarHeight = document.getElementById('bottom-bar').offsetHeight;
        
        const width = rect.width;
        const height = rect.height - topBarHeight - bottomBarHeight;
        
        canvas.width = width;
        canvas.height = height;
        game.resize(width, height);
    }
    
    function startGameLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        game.lastTime = 0;
        
        function gameLoop(currentTime) {
            game.update(currentTime);
            game.render();
            updateUI();
            
            if (!game.gameOver && !game.victory) {
                animationId = requestAnimationFrame(gameLoop);
            }
        }
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function stopGameLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    if (storage.hasSaveData()) {
        continueBtn.style.display = 'block';
    }
    
    startBtn.addEventListener('click', () => {
        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        setTimeout(() => {
            resizeCanvas();
            game.startNewGame();
            startGameLoop();
        }, 50);
    });
    
    continueBtn.addEventListener('click', () => {
        const saveData = storage.loadGame();
        if (saveData) {
            startScreen.classList.remove('active');
            gameScreen.classList.add('active');
            setTimeout(() => {
                resizeCanvas();
                game.loadGame(saveData);
                startGameLoop();
            }, 50);
        }
    });
    
    pauseBtn.addEventListener('click', () => {
        game.togglePause();
        pauseMenu.classList.toggle('hidden', !game.isPaused);
    });
    
    speedBtn.addEventListener('click', () => {
        const speeds = [1, 2, 3];
        const currentIndex = speeds.indexOf(game.gameSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        game.setSpeed(nextSpeed);
        speedBtn.textContent = `⏩ ${nextSpeed}x`;
    });
    
    startWaveBtn.addEventListener('click', () => {
        game.startWave();
    });
    
    towerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const towerType = btn.dataset.tower;
            towerBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            game.selectTower(towerType);
            closeUpgradeMenu();
        });
    });
    
    heroBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            heroBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            game.useHeroSkill();
        });
    });
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        game.handleCanvasClick(x, y);
        updateUpgradeMenu();
    });
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        game.hoveredTower = game.getTowerAtPosition(x, y);
    });
    
    let currentUpgradeTower = null;
    
    function handleUpgradeClick() {
        if (currentUpgradeTower) {
            if (game.upgradeTower(currentUpgradeTower)) {
                updateUpgradeMenu();
            }
        }
    }
    
    document.getElementById('do-upgrade').addEventListener('click', handleUpgradeClick);
    
    function updateUpgradeMenu() {
        if (game.selectedTowerForUpgrade) {
            const tower = game.selectedTowerForUpgrade;
            currentUpgradeTower = tower;
            const config = tower.getStats();
            const towerType = CONFIG.TOWERS[tower.type];
            
            document.getElementById('upgrade-tower-name').textContent = 
                `${towerType.levels[tower.level].name} (Lv.${tower.level + 1})`;
            
            let statsHtml = '<div class="stat-row"><span>伤害:</span><span>' + 
                (config.damage ? `${config.damage.min}-${config.damage.max}` : 'N/A') + '</span></div>';
            statsHtml += '<div class="stat-row"><span>攻击范围:</span><span>' + (config.range || 'N/A') + '</span></div>';
            statsHtml += '<div class="stat-row"><span>击杀数:</span><span>' + tower.kills + '</span></div>';
            statsHtml += '<div class="stat-row"><span>总伤害:</span><span>' + Math.floor(tower.totalDamage) + '</span></div>';
            document.getElementById('tower-stats').innerHTML = statsHtml;
            
            const doUpgradeBtn = document.getElementById('do-upgrade');
            if (tower.canUpgrade()) {
                const nextConfig = towerType.levels[tower.level + 1];
                const canAfford = game.gold >= nextConfig.cost;
                doUpgradeBtn.style.display = 'flex';
                doUpgradeBtn.style.opacity = canAfford ? '1' : '0.5';
                doUpgradeBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
                doUpgradeBtn.innerHTML = `
                    <div class="upgrade-option-info">升级到 ${nextConfig.name}</div>
                    <div class="upgrade-option-cost">💰 ${nextConfig.cost}</div>
                `;
            } else {
                doUpgradeBtn.style.display = 'none';
            }
            
            upgradeMenu.classList.remove('hidden');
        } else {
            closeUpgradeMenu();
        }
    }
    
    function closeUpgradeMenu() {
        upgradeMenu.classList.add('hidden');
        game.selectedTowerForUpgrade = null;
    }
    
    document.getElementById('sell-tower-btn').addEventListener('click', () => {
        if (game.selectedTowerForUpgrade) {
            game.sellTower(game.selectedTowerForUpgrade);
            closeUpgradeMenu();
        }
    });
    
    document.getElementById('close-upgrade-menu').addEventListener('click', closeUpgradeMenu);
    
    document.getElementById('resume-btn').addEventListener('click', () => {
        game.togglePause();
        pauseMenu.classList.add('hidden');
        game.lastTime = 0;
    });
    
    document.getElementById('restart-btn').addEventListener('click', () => {
        pauseMenu.classList.add('hidden');
        towerBtns.forEach(btn => btn.classList.remove('selected'));
        game.startNewGame();
        startGameLoop();
    });
    
    document.getElementById('quit-btn').addEventListener('click', () => {
        storage.saveGame(game.getSaveData());
        stopGameLoop();
        pauseMenu.classList.add('hidden');
        gameScreen.classList.remove('active');
        startScreen.classList.add('active');
    });
    
    document.getElementById('retry-btn').addEventListener('click', () => {
        gameOverScreen.classList.add('hidden');
        towerBtns.forEach(btn => btn.classList.remove('selected'));
        game.startNewGame();
        startGameLoop();
    });
    
    document.getElementById('menu-btn').addEventListener('click', () => {
        storage.saveGame(game.getSaveData());
        stopGameLoop();
        gameOverScreen.classList.add('hidden');
        gameScreen.classList.remove('active');
        startScreen.classList.add('active');
    });
    
    function updateUI() {
        goldDisplay.textContent = game.gold;
        livesDisplay.textContent = game.lives;
        waveDisplay.textContent = game.currentWave + 1;
        totalWavesDisplay.textContent = game.totalWaves;
        
        towerBtns.forEach(btn => {
            const towerType = btn.dataset.tower;
            const cost = CONFIG.TOWERS[towerType].levels[0].cost;
            btn.style.opacity = game.gold >= cost ? '1' : '0.5';
        });
        
        if (game.waveInProgress) {
            startWaveBtn.textContent = `🌊 波次进行中... (${game.enemies.length}敌人)`;
            startWaveBtn.style.opacity = '0.7';
        } else if (game.currentWave >= game.totalWaves) {
            startWaveBtn.textContent = '🏆 胜利!';
        } else {
            startWaveBtn.textContent = `🌊 开始第 ${game.currentWave + 1} 波`;
            startWaveBtn.style.opacity = '1';
        }
        
        if (game.gameOver || game.victory) {
            document.getElementById('game-over-title').textContent = game.victory ? '🏆 胜利!' : '💀 游戏结束';
            document.getElementById('game-over-message').textContent = 
                game.victory 
                    ? `恭喜你成功守护了王国! 击杀敌人: ${game.enemiesKilled}` 
                    : `王国陷落了... 击杀敌人: ${game.enemiesKilled}`;
            gameOverScreen.classList.remove('hidden');
        }
    }
    
    window.addEventListener('resize', () => {
        if (gameScreen.classList.contains('active')) {
            resizeCanvas();
        }
    });
    
    window.addEventListener('beforeunload', () => {
        if (gameScreen.classList.contains('active')) {
            storage.saveGame(game.getSaveData());
        }
    });
});
