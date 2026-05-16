const Game = (function() {
    let gameState = {
        player: null,
        enemy: null,
        playerCharacter: 'spicy',
        enemyCharacter: 'clear',
        round: 1,
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        winner: null,
        lastTime: 0,
        deltaTime: 0,
        saveInterval: null,
        hits: []
    };

    let animationId = null;

    function init() {
        setupCharacterSelect();
        setupButtons();
        checkSavedGame();
    }

    function setupCharacterSelect() {
        const cards = document.querySelectorAll('.character-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                gameState.playerCharacter = card.dataset.character;
                GameStorage.saveSettings({
                    selectedCharacter: gameState.playerCharacter
                });
            });
        });

        const settings = GameStorage.loadSettings();
        if (settings && settings.selectedCharacter) {
            cards.forEach(card => {
                card.classList.remove('selected');
                if (card.dataset.character === settings.selectedCharacter) {
                    card.classList.add('selected');
                    gameState.playerCharacter = settings.selectedCharacter;
                }
            });
        }
    }

    function setupButtons() {
        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('resume-btn').addEventListener('click', resumeGame);
        document.getElementById('restart-btn').addEventListener('click', restartGame);
        document.getElementById('quit-btn').addEventListener('click', quitToMenu);
        document.getElementById('play-again-btn').addEventListener('click', restartGame);
        document.getElementById('back-to-menu-btn').addEventListener('click', quitToMenu);
    }

    function checkSavedGame() {
        const saved = GameStorage.loadGameState();
        if (saved) {
            const continueBtn = document.getElementById('continue-game-btn');
            if (continueBtn) {
                continueBtn.style.display = 'inline-block';
                continueBtn.addEventListener('click', () => {
                    loadSavedGame(saved);
                });
            }
        }
    }

    function loadSavedGame(saved) {
        const canvas = document.getElementById('game-canvas');
        Renderer.init(canvas);

        gameState.player = Characters.createCharacter(saved.playerCharacter, true);
        gameState.enemy = Characters.createCharacter(saved.enemyCharacter, false);

        gameState.player.health = saved.playerHealth;
        gameState.player.energy = saved.playerEnergy;
        gameState.player.x = saved.playerX;
        gameState.player.y = saved.playerY;
        gameState.player.velocityX = saved.playerVelocityX;
        gameState.player.velocityY = saved.playerVelocityY;
        gameState.player.facing = saved.playerFacing;
        gameState.player.crouching = saved.playerCrouching;

        gameState.enemy.health = saved.enemyHealth;
        gameState.enemy.energy = saved.enemyEnergy;
        gameState.enemy.x = saved.enemyX;
        gameState.enemy.y = saved.enemyY;
        gameState.enemy.velocityX = saved.enemyVelocityX;
        gameState.enemy.velocityY = saved.enemyVelocityY;
        gameState.enemy.facing = saved.enemyFacing;

        gameState.round = saved.round || 1;
        gameState.isPaused = false;
        gameState.isGameOver = false;

        Input.init(gameState.player, gameState.enemy);
        AI.reset();
        Combat.clearAll();

        showScreen('game-screen');

        gameState.isRunning = true;
        gameState.lastTime = performance.now();
        
        gameState.saveInterval = setInterval(() => {
            if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
                GameStorage.saveGameState(gameState);
            }
        }, 5000);

        gameLoop();
    }

    function startGame() {
        GameStorage.clearGameState();
        
        gameState.round = 1;
        gameState.isGameOver = false;
        gameState.winner = null;
        gameState.isPaused = false;
        gameState.hits = [];

        const enemyTypes = ['spicy', 'clear', 'tomato'].filter(t => t !== gameState.playerCharacter);
        gameState.enemyCharacter = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        const canvas = document.getElementById('game-canvas');
        Renderer.init(canvas);

        gameState.player = Characters.createCharacter(gameState.playerCharacter, true);
        gameState.enemy = Characters.createCharacter(gameState.enemyCharacter, false);

        const groundY = Renderer.getGroundY();
        gameState.player.x = 200;
        gameState.player.y = groundY;
        gameState.enemy.x = canvas.width - 280;
        gameState.enemy.y = groundY;

        Input.init(gameState.player, gameState.enemy);
        AI.reset();
        Combat.clearAll();
        Renderer.clear();

        showScreen('game-screen');

        gameState.isRunning = true;
        gameState.lastTime = performance.now();
        
        gameState.saveInterval = setInterval(() => {
            if (gameState.isRunning && !gameState.isPaused && !gameState.isGameOver) {
                GameStorage.saveGameState(gameState);
            }
        }, 5000);

        gameLoop();
    }

    function gameLoop(currentTime) {
        if (!gameState.isRunning) return;

        gameState.deltaTime = (currentTime - gameState.lastTime) / 16.67;
        gameState.lastTime = currentTime;

        if (!gameState.isPaused && !gameState.isGameOver) {
            update();
            render();
        }

        animationId = requestAnimationFrame(gameLoop);
    }

    function update() {
        const groundY = Renderer.getGroundY();

        Input.update();
        AI.update(gameState.enemy, gameState.player);

        Characters.updateCharacter(gameState.player, gameState.deltaTime, groundY);
        Characters.updateCharacter(gameState.enemy, gameState.deltaTime, groundY);

        Physics.keepInBounds(gameState.player, window.innerWidth, groundY);
        Physics.keepInBounds(gameState.enemy, window.innerWidth, groundY);

        Combat.updateProjectiles(window.innerWidth, groundY);
        Combat.updateAttacks();

        const projectileHits = Combat.checkProjectileHits(gameState.player, gameState.enemy);
        const attackHits = Combat.checkAttackHits(gameState.player, gameState.enemy);

        gameState.hits = [...projectileHits, ...attackHits];

        Renderer.update(gameState.player, gameState.enemy);

        updateHUD();

        checkGameOver();
    }

    function render() {
        Renderer.render(gameState.player, gameState.enemy, gameState.hits);
        
        gameState.hits.forEach(hit => {
            Renderer.createParticles(hit.x, hit.y, '#ff6600', 15);
            Renderer.createDamageNumber(hit.x, hit.y, hit.damage);
        });
        
        gameState.hits = [];
    }

    function updateHUD() {
        const playerHealthBar = document.getElementById('player-health');
        const playerHealthText = document.getElementById('player-health-text');
        const enemyHealthBar = document.getElementById('enemy-health');
        const enemyHealthText = document.getElementById('enemy-health-text');

        const playerHealthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
        const enemyHealthPercent = (gameState.enemy.health / gameState.enemy.maxHealth) * 100;

        playerHealthBar.style.width = `${Math.max(0, playerHealthPercent)}%`;
        playerHealthText.textContent = Math.ceil(Math.max(0, gameState.player.health));
        enemyHealthBar.style.width = `${Math.max(0, enemyHealthPercent)}%`;
        enemyHealthText.textContent = Math.ceil(Math.max(0, gameState.enemy.health));

        const playerEnergyBar = document.getElementById('player-energy-bar');
        const enemyEnergyBar = document.getElementById('enemy-energy-bar');

        if (playerEnergyBar) {
            playerEnergyBar.style.width = `${gameState.player.energy}%`;
        }
        if (enemyEnergyBar) {
            enemyEnergyBar.style.width = `${gameState.enemy.energy}%`;
        }
    }

    function checkGameOver() {
        if (gameState.player.health <= 0) {
            gameState.isGameOver = true;
            gameState.winner = 'enemy';
            GameStorage.clearGameState();
            setTimeout(() => showResult(false), 500);
        } else if (gameState.enemy.health <= 0) {
            gameState.isGameOver = true;
            gameState.winner = 'player';
            GameStorage.clearGameState();
            setTimeout(() => showResult(true), 500);
        }
    }

    function showResult(playerWon) {
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');

        if (playerWon) {
            resultTitle.textContent = '🏆 胜利! 🏆';
            resultTitle.style.color = '#ffcc00';
            resultMessage.textContent = '你成为了火锅之王!';
        } else {
            resultTitle.textContent = '💪 失败... 💪';
            resultTitle.style.color = '#ff6666';
            resultMessage.textContent = '再接再厉!';
        }

        showScreen('result-screen');
    }

    function pauseGame() {
        gameState.isPaused = true;
        showScreen('pause-screen');
    }

    function resumeGame() {
        gameState.isPaused = false;
        hideOverlay();
    }

    function restartGame() {
        stopGame();
        startGame();
    }

    function quitToMenu() {
        stopGame();
        GameStorage.clearGameState();
        showScreen('start-screen');
    }

    function stopGame() {
        gameState.isRunning = false;
        gameState.isPaused = false;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (gameState.saveInterval) {
            clearInterval(gameState.saveInterval);
            gameState.saveInterval = null;
        }

        Input.destroy();
        hideOverlay();
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    function hideOverlay() {
        document.querySelectorAll('.screen.overlay').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('game-screen').classList.add('active');
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && gameState.isRunning && !gameState.isGameOver) {
            if (gameState.isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    });

    return {
        init,
        startGame,
        pauseGame,
        resumeGame,
        restartGame,
        quitToMenu
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
