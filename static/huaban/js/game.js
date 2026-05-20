const Game = (function() {
    let canvas, ctx;
    let player;
    let player2;
    
    let gameMode = 'endless';
    let gameState = 'menu';
    let score = 0;
    let distance = 0;
    let cameraX = 0;
    let gameTime = 0;
    let timeLimit = 60;
    let timeRemaining = 60;
    let difficulty = 1;
    
    let lastTime = 0;
    let animationId = null;
    
    let visibleChunks = [];
    
    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        setupInputHandlers();
    }
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    function setupInputHandlers() {
        Input.init();
        
        Input.on('jump', () => {
            if (gameState === 'playing' && player) {
                Player.jump(player);
            }
        });
        
        Input.on('jumpRelease', () => {
            if (player) {
                player.jumpHoldTime = 0;
            }
        });
        
        Input.on('left', (pressed) => {
            if (player) {
                player.leftPressed = pressed;
            }
        });
        
        Input.on('right', (pressed) => {
            if (player) {
                player.rightPressed = pressed;
            }
        });
        
        Input.on('crouch', () => {
            if (player) {
                Player.crouch(player, true);
            }
        });
        
        Input.on('crouchRelease', () => {
            if (player) {
                Player.crouch(player, false);
            }
        });
        
        Input.on('trick1', () => {
            if (gameState === 'playing' && player) {
                Player.doTrick1(player);
            }
        });
        
        Input.on('trick2', () => {
            if (gameState === 'playing' && player) {
                Player.doTrick2(player);
            }
        });
        
        Input.on('grind', (pressed) => {
            if (player) {
                player.grindPressed = pressed;
            }
        });
        
        Input.on('pause', () => {
            if (gameState === 'playing') {
                pause();
            } else if (gameState === 'paused') {
                resume();
            }
        });
    }
    
    function startGame(mode) {
        gameMode = mode;
        gameState = 'playing';
        score = 0;
        distance = 0;
        cameraX = 0;
        gameTime = 0;
        difficulty = 1;
        timeRemaining = timeLimit;
        
        canvas.style.pointerEvents = 'auto';
        
        Tricks.init();
        
        const themeId = getThemeForMode(mode);
        Scenes.init(themeId, canvas.height);
        
        const groundY = Scenes.getGroundY();
        
        const characterId = Storage.getSelectedCharacter();
        player = Player.createPlayer(characterId, 100, groundY - 60);
        player.isGrounded = true;
        player.y = groundY - player.height;
        
        if (mode === 'versus') {
            player2 = Player.createPlayer('beginner', 100, groundY - 60);
            player2.isGrounded = true;
            player2.y = groundY - player2.height;
            player2.x = 50;
            player.x = 150;
        } else {
            player2 = null;
        }
        
        UI.showScreen('gameHUD');
        UI.updateScore(0);
        UI.updateHighScore(mode);
        UI.updateDistance(0);
        UI.updateBoost(0);
        UI.showTimer(mode === 'trick');
        UI.updateTimer(timeLimit);
        
        lastTime = performance.now();
        gameLoop(lastTime);
        
        saveGameState();
    }
    
    function getThemeForMode(mode) {
        const themes = ['city', 'park', 'desert', 'industrial', 'night'];
        
        if (mode === 'trick') {
            return 'park';
        } else if (mode === 'versus') {
            return 'city';
        } else {
            const level = Storage.get('currentLevel') || 1;
            return themes[Math.min(level - 1, themes.length - 1)];
        }
    }
    
    function pause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            cancelAnimationFrame(animationId);
            UI.showPauseMenu();
            saveGameState();
        }
    }
    
    function resume() {
        if (gameState === 'paused') {
            gameState = 'playing';
            UI.hidePauseMenu();
            lastTime = performance.now();
            gameLoop(lastTime);
        }
    }
    
    function restart() {
        UI.hideGameOver();
        UI.hidePauseMenu();
        Storage.clearGameState();
        startGame(gameMode);
    }
    
    function quit() {
        gameState = 'menu';
        cancelAnimationFrame(animationId);
        Storage.clearGameState();
        
        if (canvas) {
            canvas.style.pointerEvents = 'none';
        }
        
        UI.hideGameOver();
        UI.hidePauseMenu();
        UI.showScreen('mainMenu');
        UI.updateHighScore(gameMode);
    }
    
    function gameOver() {
        gameState = 'gameover';
        cancelAnimationFrame(animationId);
        
        const isNewRecord = Storage.setHighScore(gameMode, score);
        Storage.addDistance(Math.floor(distance));
        
        UI.showGameOver(score, Storage.getHighScore(gameMode), distance, isNewRecord);
        Storage.clearGameState();
    }
    
    function gameLoop(currentTime) {
        if (gameState !== 'playing') return;
        
        const deltaTime = Math.min(currentTime - lastTime, 50);
        lastTime = currentTime;
        gameTime += deltaTime;
        
        update(deltaTime);
        render();
        saveGameState();
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function update(deltaTime) {
        if (!player) return;
        
        if (gameMode === 'trick') {
            timeRemaining -= deltaTime / 1000;
            UI.updateTimer(timeRemaining);
            
            if (timeRemaining <= 0) {
                gameOver();
                return;
            }
        }
        
        difficulty = 1 + Math.floor(distance / 1000) * 0.1;
        
        Player.update(player, deltaTime, Input, Physics);
        
        if (player2 && gameMode === 'versus') {
            updateAI(player2, deltaTime);
            Player.update(player2, deltaTime, null, Physics);
        }
        
        Tricks.updateTricks(player, deltaTime);
        
        cameraX = player.x - canvas.width * 0.3;
        if (cameraX < 0) cameraX = 0;
        
        updateVisibleChunks();
        Scenes.updateVehicles(visibleChunks, deltaTime);
        
        checkCollisionsForPlayer(player);
        
        if (player2 && gameMode === 'versus') {
            checkCollisionsForPlayer(player2);
        }
        
        if (player.isGrounded && player.isJumping === false && player.airTime > 0) {
            handleLandingForPlayer(player);
        }
        
        if (player2 && gameMode === 'versus') {
            if (player2.isGrounded && player2.isJumping === false && player2.airTime > 0) {
                handleLandingForPlayer(player2);
            }
        }
        
        handleGrindForPlayer(player);
        
        if (player.boost >= player.maxBoost) {
            Player.activateBoost(player);
        }
        
        distance = Math.max(distance, player.x / 10);
        UI.updateDistance(distance);
        
        if (Collision.checkFallOffMap(player, Scenes.getGroundY(), 300)) {
            Player.hitObstacle(player);
            player.y = Scenes.getGroundY() - player.height;
            player.vy = 0;
            player.isGrounded = true;
            player.isJumping = false;
        }
        
        if (player2 && gameMode === 'versus') {
            if (Collision.checkFallOffMap(player2, Scenes.getGroundY(), 300)) {
                Player.hitObstacle(player2);
                player2.y = Scenes.getGroundY() - player2.height;
                player2.vy = 0;
                player2.isGrounded = true;
                player2.isJumping = false;
            }
        }
        
        Input.update();
    }
    
    function updateAI(aiPlayer, deltaTime) {
        aiPlayer.vx = aiPlayer.speed * 0.9;
        
        if (!aiPlayer.isGrounded && Math.random() < 0.02) {
            Player.doTrick1(aiPlayer);
        }
        
        if (aiPlayer.isGrounded && Math.random() < 0.01) {
            Player.jump(aiPlayer);
        }
        
        if (Math.random() < 0.01) {
            aiPlayer.leftPressed = !aiPlayer.leftPressed;
            aiPlayer.rightPressed = !aiPlayer.rightPressed;
        }
    }
    
    function updateVisibleChunks() {
        const chunkSize = Scenes.getChunkSize();
        const startChunk = Scenes.getChunkIndex(cameraX - chunkSize);
        const endChunk = Scenes.getChunkIndex(cameraX + canvas.width + chunkSize);
        
        visibleChunks = [];
        for (let i = startChunk; i <= endChunk; i++) {
            visibleChunks.push(Scenes.generateChunk(i));
        }
        
        Scenes.cleanupChunks(cameraX, canvas.width + chunkSize * 2);
    }
    
    function checkCollisionsForPlayer(currentPlayer) {
        const allObstacles = [];
        const allRails = [];
        const allRamps = [];
        const allCollectibles = [];
        const allBoostPads = [];
        const allVehicles = [];
        
        for (const chunk of visibleChunks) {
            allObstacles.push(...chunk.obstacles);
            allRails.push(...chunk.rails);
            allRamps.push(...chunk.ramps);
            allCollectibles.push(...chunk.collectibles);
            allBoostPads.push(...chunk.boostPads);
            allVehicles.push(...chunk.vehicles);
        }
        
        const obstacleHit = Collision.checkObstacleCollision(currentPlayer, allObstacles);
        if (obstacleHit.collided && currentPlayer.invulnerableTimer <= 0) {
            Player.hitObstacle(currentPlayer);
        }
        
        const vehicleHit = Collision.checkVehicleCollision(currentPlayer, allVehicles);
        if (vehicleHit.collided && currentPlayer.invulnerableTimer <= 0) {
            Player.hitObstacle(currentPlayer);
        }
        
        const collected = Collision.checkCollectibleCollision(currentPlayer, allCollectibles);
        for (const item of collected) {
            if (currentPlayer === player) {
                addScore(item.value);
                Player.addBoost(currentPlayer, 5);
                UI.updateBoost(currentPlayer.boost);
            }
        }
        
        const boostHit = Collision.checkBoostPadCollision(currentPlayer, allBoostPads);
        if (boostHit.collided) {
            Player.addBoost(currentPlayer, 30);
            if (currentPlayer === player) {
                UI.updateBoost(currentPlayer.boost);
            }
        }
        
        let onAnyRamp = false;
        for (const ramp of allRamps) {
            const rampHit = Physics.checkRampCollision(currentPlayer, ramp);
            if (rampHit.collided) {
                onAnyRamp = true;
                currentPlayer.onRamp = ramp;
                break;
            }
        }
        if (!onAnyRamp) {
            currentPlayer.onRamp = null;
        }
        
        let onAnyRail = false;
        if (!currentPlayer.isGrinding && !currentPlayer.isGrounded) {
            for (const rail of allRails) {
                const railHit = Physics.checkRailCollision(currentPlayer, rail);
                if (railHit.collided) {
                    currentPlayer.onPlatform = rail;
                    currentPlayer.y = rail.y - currentPlayer.height;
                    currentPlayer.vy = 0;
                    currentPlayer.isGrounded = true;
                    currentPlayer.isJumping = false;
                    onAnyRail = true;
                    break;
                }
            }
        }
        if (!onAnyRail && !currentPlayer.isGrinding) {
            currentPlayer.onPlatform = null;
        }
        
        if (!currentPlayer.onRamp && !currentPlayer.onPlatform && !currentPlayer.isGrinding) {
            Physics.checkGroundCollision(currentPlayer, Scenes.getGroundY());
        }
    }
    
    function handleGrindForPlayer(currentPlayer) {
        const allRails = [];
        for (const chunk of visibleChunks) {
            allRails.push(...chunk.rails);
        }
        
        const grindResult = Collision.checkRailGrind(currentPlayer, allRails, currentPlayer.grindPressed);
        
        if (grindResult.grinding) {
            if (grindResult.started) {
                Player.startGrind(currentPlayer, grindResult.rail);
            }
        } else if (grindResult.ended && currentPlayer.isGrinding) {
            const grindScore = Player.endGrind(currentPlayer);
            if (grindScore > 0 && currentPlayer === player) {
                addScore(grindScore);
                UI.showTrickPopup('磨板!', grindScore);
            }
        }
    }
    
    function handleLandingForPlayer(currentPlayer) {
        const landingQuality = Physics.calculateLandingScore(currentPlayer);
        landingQuality.scoreMultiplier *= currentPlayer.character.landingBonus;
        
        const result = Player.land(currentPlayer, landingQuality);
        
        if (result.success && result.score > 0 && currentPlayer === player) {
            addScore(result.score);
            
            if (result.tricks && result.tricks.length > 0) {
                const trickNames = result.tricks.map(t => t.name).join(' + ');
                const qualityText = landingQuality.quality === 'perfect' ? '完美!' : 
                                   landingQuality.quality === 'good' ? '不错!' : '';
                UI.showTrickPopup(trickNames, result.score, qualityText);
            }
            
            if (result.combo > 1) {
                UI.showCombo(result.combo);
            }
            
            Player.addBoost(currentPlayer, 10 * result.combo);
            UI.updateBoost(currentPlayer.boost);
        } else if (!result.success && currentPlayer === player) {
            UI.showTrickPopup('摔倒!', 0, '失败');
        }
        
        Physics.resetRotation(currentPlayer);
    }
    
    function addScore(points) {
        score += points;
        UI.updateScore(score);
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const theme = Scenes.getTheme();
        
        Scenes.drawBackground(ctx, cameraX, canvas.width, canvas.height);
        Scenes.drawBuildings(ctx, visibleChunks, cameraX, canvas.width);
        Scenes.drawGround(ctx, cameraX, canvas.width, canvas.height);
        Scenes.drawRamps(ctx, visibleChunks, cameraX, canvas.width);
        Scenes.drawRails(ctx, visibleChunks, cameraX, canvas.width);
        Scenes.drawObstacles(ctx, visibleChunks, cameraX, canvas.width);
        Scenes.drawBoostPads(ctx, visibleChunks, cameraX, canvas.width, gameTime);
        Scenes.drawCollectibles(ctx, visibleChunks, cameraX, canvas.width, gameTime);
        Scenes.drawVehicles(ctx, visibleChunks, cameraX, canvas.width);
        
        if (player) {
            Player.draw(ctx, player, cameraX);
        }
        
        if (player2 && gameMode === 'versus') {
            Player.draw(ctx, player2, cameraX);
        }
        
        if (theme.isNight) {
            drawNightOverlay();
        }
    }
    
    function drawNightOverlay() {
        const gradient = ctx.createRadialGradient(
            player ? player.x - cameraX + player.width / 2 : canvas.width / 2,
            player ? player.y + player.height / 2 : canvas.height / 2,
            50,
            player ? player.x - cameraX + player.width / 2 : canvas.width / 2,
            player ? player.y + player.height / 2 : canvas.height / 2,
            400
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 20, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function saveGameState() {
        if (gameState !== 'playing') return;
        
        const state = {
            gameMode,
            gameState,
            score,
            distance,
            cameraX,
            gameTime,
            timeRemaining,
            difficulty,
            player: {
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy,
                rotation: player.rotation,
                characterId: player.characterId,
                boost: player.boost,
                isGrounded: player.isGrounded,
                isJumping: player.isJumping
            }
        };
        
        Storage.saveGameState(state);
    }
    
    function resumeFromSave(savedState) {
        gameMode = savedState.gameMode || 'endless';
        score = savedState.score || 0;
        distance = savedState.distance || 0;
        cameraX = savedState.cameraX || 0;
        gameTime = savedState.gameTime || 0;
        timeRemaining = savedState.timeRemaining || timeLimit;
        difficulty = savedState.difficulty || 1;
        
        canvas.style.pointerEvents = 'auto';
        
        const themeId = getThemeForMode(gameMode);
        Scenes.init(themeId, canvas.height);
        
        const charId = savedState.player?.characterId || Storage.getSelectedCharacter();
        player = Player.createPlayer(charId, 100, Scenes.getGroundY() - 60);
        
        if (savedState.player) {
            player.x = savedState.player.x;
            player.y = savedState.player.y;
            player.vx = savedState.player.vx;
            player.vy = savedState.player.vy;
            player.rotation = savedState.player.rotation;
            player.boost = savedState.player.boost;
            player.isGrounded = savedState.player.isGrounded;
            player.isJumping = savedState.player.isJumping;
        }
        
        gameState = 'playing';
        UI.showScreen('gameHUD');
        UI.updateScore(score);
        UI.updateHighScore(gameMode);
        UI.updateDistance(distance);
        UI.updateBoost(player.boost);
        UI.showTimer(gameMode === 'trick');
        UI.updateTimer(timeRemaining);
        
        lastTime = performance.now();
        gameLoop(lastTime);
    }
    
    function getState() {
        return {
            gameMode,
            gameState,
            score,
            distance,
            player
        };
    }
    
    return {
        init,
        startGame,
        pause,
        resume,
        resumeFromSave,
        restart,
        quit,
        getState
    };
})();
