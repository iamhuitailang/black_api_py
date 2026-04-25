var Game = (function() {
    'use strict';

    var gameState = null;
    var canvas = null;
    var ctx = null;
    var elements = {};
    var gameLoop = null;
    var autosaveTimer = null;
    var lastTime = 0;
    var maxRally = 0;

    var mouseX = 0;
    var keys = { left: false, right: false };
    var isMouseDown = false;
    var mouseDownTime = 0;
    var isMouseControlling = false;
    var lastMouseMoveTime = 0;

    var court = Data.COURT_CONFIG;
    var rules = Data.GAME_RULES;
    var colors = Data.COLORS;

    function init() {
        cacheElements();
        setupCanvas();
        loadOrCreateGame();
        bindEvents();
        updateUI();
        updateButtonState();
        updateOpponentDisplay();
        render();

        if (Data.hasSaveData()) {
            elements.continueBtn.style.display = 'block';
        }

        Utils.showToast('迷你网球已加载！点击开始游戏', 'info');
    }

    function cacheElements() {
        elements = {
            canvas: Utils.$('#gameCanvas'),
            startScreen: Utils.$('#start-screen'),
            pauseOverlay: Utils.$('#pause-overlay'),
            gameOverModal: Utils.$('#game-over-modal'),
            
            startBtn: Utils.$('#start-btn'),
            pauseBtn: Utils.$('#pause-btn'),
            restartMainBtn: Utils.$('#restart-main-btn'),
            newGameBtn: Utils.$('#new-game-btn'),
            continueBtn: Utils.$('#continue-btn'),
            resumeBtn: Utils.$('#resume-btn'),
            restartBtn: Utils.$('#restart-btn'),
            playAgainBtn: Utils.$('#play-again-btn'),
            
            playerScore: Utils.$('#player-score'),
            opponentScore: Utils.$('#opponent-score'),
            playerGames: Utils.$('#player-games'),
            opponentGames: Utils.$('#opponent-games'),
            gameTime: Utils.$('#game-time'),
            navTime: Utils.$('#nav-time'),
            navRally: Utils.$('#nav-rally'),
            opponentName: Utils.$('#opponent-name'),
            opponentEmoji: Utils.$('#opponent-emoji'),
            opponentInfoName: Utils.$('#opponent-info-name'),
            
            chargeBarContainer: Utils.$('#charge-bar-container'),
            chargeBarFill: Utils.$('#charge-bar-fill'),
            
            gameOverIcon: Utils.$('#game-over-icon'),
            gameOverTitle: Utils.$('#game-over-title'),
            finalScore: Utils.$('#final-score'),
            finalTime: Utils.$('#final-time'),
            finalRally: Utils.$('#final-rally')
        };
    }

    function setupCanvas() {
        canvas = elements.canvas;
        ctx = canvas.getContext('2d');
        canvas.width = court.width;
        canvas.height = court.height;
    }

    function loadOrCreateGame() {
        var saved = Data.loadGame();
        if (saved) {
            gameState = saved;
            maxRally = saved.maxRally || 0;
        } else {
            createNewGame();
        }
    }

    function createNewGame() {
        gameState = Data.getDefaultSaveData();
        maxRally = 0;
        
        gameState.opponent.type = Data.getRandomOpponentType();
        var opponentConfig = Data.getOpponentConfig(gameState.opponent.type);
        gameState.opponent.speed = opponentConfig.speed;
        gameState.opponent.accuracy = opponentConfig.accuracy;
        gameState.opponent.reactionTime = opponentConfig.reactionTime;
        
        resetPositions();
    }

    function resetPositions() {
        gameState.player.x = court.width / 2;
        gameState.player.y = court.netY + 50;
        gameState.player.targetX = gameState.player.x;
        gameState.player.swingAnim = 0;
        gameState.player.isSwinging = false;
        
        gameState.opponent.x = court.width / 2;
        gameState.opponent.y = court.netY - 50;
        gameState.opponent.targetX = gameState.opponent.x;
        gameState.opponent.swingAnim = 0;
        gameState.opponent.isSwinging = false;
        
        gameState.ball.x = court.width / 2;
        gameState.ball.y = court.netY - 50;
        gameState.ball.vx = 0;
        gameState.ball.vy = 0;
        gameState.ball.isActive = false;
        gameState.ball.expression = 'normal';
        
        gameState.rallyCount = 0;
        gameState.lastHitBy = null;
        gameState.effects = { smashes: [], netWarnings: [], perfectHits: [] };
    }

    function bindEvents() {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        elements.startBtn.addEventListener('click', toggleGame);
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.restartMainBtn.addEventListener('click', restartGame);
        
        elements.newGameBtn.addEventListener('click', startNewGame);
        elements.continueBtn.addEventListener('click', continueGame);
        elements.resumeBtn.addEventListener('click', resumeGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.playAgainBtn.addEventListener('click', restartGame);
        
        window.addEventListener('resize', Utils.debounce(function() {
            render();
        }, 100));
        
        window.addEventListener('beforeunload', function(e) {
            if (gameState) {
                saveGameState();
            }
        });
    }

    function handleMouseMove(e) {
        var rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        
        if (gameState && gameState.isStarted && !gameState.isPaused) {
            isMouseControlling = true;
            lastMouseMoveTime = Utils.now();
            gameState.player.targetX = Utils.clamp(mouseX, court.leftBoundary, court.rightBoundary);
        }
    }

    function handleMouseDown(e) {
        if (e.button !== 0) return;
        isMouseDown = true;
        mouseDownTime = Utils.now();
        
        if (gameState && gameState.isStarted && !gameState.isPaused) {
            gameState.player.isCharging = true;
            gameState.player.chargeTime = 0;
            Utils.addClass(elements.chargeBarContainer, 'visible');
        }
    }

    function handleMouseUp(e) {
        if (e.button !== 0) return;
        if (!isMouseDown) return;
        
        isMouseDown = false;
        var chargeDuration = Utils.now() - mouseDownTime;
        
        if (gameState && gameState.isStarted && !gameState.isPaused) {
            gameState.player.isCharging = false;
            Utils.removeClass(elements.chargeBarContainer, 'visible');
            elements.chargeBarFill.style.width = '0%';
            
            if (gameState.ball.isActive) {
                tryHitBall(chargeDuration);
            } else {
                serveBall();
            }
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys.left = true;
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            keys.right = true;
        }
        if (e.key === ' ') {
            e.preventDefault();
            if (!isMouseDown) {
                handleMouseDown({ button: 0 });
            }
        }
        if (e.key === 'Escape') {
            if (gameState.isStarted && !gameState.isGameOver) {
                togglePause();
            }
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            keys.left = false;
        }
        if (e.key === 'ArrowRight' || e.key === 'd') {
            keys.right = false;
        }
        if (e.key === ' ') {
            handleMouseUp({ button: 0 });
        }
    }

    function serveBall() {
        if (gameState.currentServer === 'player') {
            gameState.ball.x = gameState.player.x;
            gameState.ball.y = gameState.player.y - 40;
            gameState.ball.vx = Utils.randomFloat(-1, 1);
            gameState.ball.vy = -rules.ballSpeed * 1.2;
            gameState.ball.isActive = true;
            gameState.ball.expression = 'normal';
            gameState.lastHitBy = 'player';
        } else {
            opponentServe();
        }
    }

    function opponentServe() {
        gameState.ball.x = gameState.opponent.x;
        gameState.ball.y = gameState.opponent.y + 40;
        gameState.ball.vx = Utils.randomFloat(-1, 1);
        gameState.ball.vy = rules.ballSpeed * 1.2;
        gameState.ball.isActive = true;
        gameState.ball.expression = 'normal';
        gameState.lastHitBy = 'opponent';
    }

    function tryHitBall(chargeDuration) {
        var player = gameState.player;
        var ball = gameState.ball;
        
        if (ball.vy < 0) return;
        
        var hitDistance = player.racketSize + ball.radius + 10;
        var actualDistance = Utils.getDistance(player.x, player.y, ball.x, ball.y);
        
        if (actualDistance > hitDistance + 30) {
            return;
        }
        
        var isSmash = chargeDuration >= player.maxChargeTime;
        var chargeLevel = Math.min(chargeDuration / player.maxChargeTime, 1);
        
        var dx = ball.x - player.x;
        var dy = ball.y - player.y;
        
        var isPerfectHit = Math.abs(actualDistance - hitDistance) < rules.perfectHitWindow;
        var isGoodHit = Math.abs(actualDistance - hitDistance) < rules.hitWindow;
        
        if (isGoodHit) {
            var baseSpeed = rules.ballSpeed;
            var speedMultiplier = 1;
            
            player.isSwinging = true;
            player.swingAnim = 1.0;
            
            if (isSmash) {
                speedMultiplier = rules.smashSpeedMultiplier;
                addSmashEffect(player.x, player.y - 30);
                Utils.showToast('⚡ 扣杀！', 'success', 1000);
            } else if (isPerfectHit) {
                speedMultiplier = rules.perfectHitSpeedMultiplier;
                addPerfectHitEffect(player.x, player.y - 30);
                Utils.showToast('✨ 完美击球！', 'success', 1000);
            }
            
            var targetY = -1;
            var angleFactor = dx / (player.racketSize + ball.radius);
            angleFactor = Utils.clamp(angleFactor, -0.8, 0.8);
            
            ball.vx = angleFactor * baseSpeed * speedMultiplier;
            ball.vy = targetY * baseSpeed * speedMultiplier * (1 + chargeLevel * 0.3);
            
            ball.vy = Math.min(ball.vy, -rules.ballSpeed);
            
            ball.expression = isSmash ? 'angry' : (isPerfectHit ? 'happy' : 'normal');
            gameState.lastHitBy = 'player';
            gameState.rallyCount++;
            maxRally = Math.max(maxRally, gameState.rallyCount);
            player.lastHitTime = Utils.now();
        } else if (actualDistance < hitDistance + 50) {
            ball.expression = 'sad';
        }
    }

    function opponentHitBall() {
        var opponent = gameState.opponent;
        var ball = gameState.ball;
        var opponentConfig = Data.getOpponentConfig(opponent.type);
        
        var hitDistance = opponent.racketSize + ball.radius + 10;
        var actualDistance = Utils.getDistance(opponent.x, opponent.y, ball.x, ball.y);
        
        if (actualDistance > hitDistance + 30) {
            return false;
        }
        
        var isGoodHit = Math.random() < opponentConfig.accuracy;
        
        if (isGoodHit) {
            var dx = ball.x - opponent.x;
            var angleFactor = dx / (opponent.racketSize + ball.radius);
            angleFactor = Utils.clamp(angleFactor + Utils.randomFloat(-0.3, 0.3), -0.7, 0.7);
            
            opponent.isSwinging = true;
            opponent.swingAnim = 1.0;
            
            ball.vx = angleFactor * rules.ballSpeed;
            ball.vy = rules.ballSpeed * (0.8 + Math.random() * 0.4);
            
            ball.expression = 'normal';
            gameState.lastHitBy = 'opponent';
            gameState.rallyCount++;
            maxRally = Math.max(maxRally, gameState.rallyCount);
            opponent.lastHitTime = Utils.now();
            
            return true;
        } else {
            ball.expression = 'happy';
            return false;
        }
    }

    function addSmashEffect(x, y) {
        gameState.effects.smashes.push({
            x: x,
            y: y,
            startTime: Utils.now(),
            duration: 500
        });
    }

    function addPerfectHitEffect(x, y) {
        gameState.effects.perfectHits.push({
            x: x,
            y: y,
            startTime: Utils.now(),
            duration: 400
        });
    }

    function addNetWarning() {
        gameState.effects.netWarnings.push({
            x: court.width / 2,
            y: court.netY,
            startTime: Utils.now(),
            duration: 1000
        });
        Utils.showToast('⚠️ 危险！擦网！', 'warning', 800);
    }

    function updateGame(deltaTime) {
        var now = Utils.now();
        
        if (isMouseControlling && (now - lastMouseMoveTime > 300)) {
            isMouseControlling = false;
        }
        
        if (!isMouseControlling) {
            var moveSpeed = 5;
            if (keys.left) {
                gameState.player.targetX -= moveSpeed;
            }
            if (keys.right) {
                gameState.player.targetX += moveSpeed;
            }
        }
        
        gameState.player.targetX = Utils.clamp(
            gameState.player.targetX, 
            court.leftBoundary + gameState.player.radius, 
            court.rightBoundary - gameState.player.radius
        );
        
        var currentX = gameState.player.x;
        var targetX = gameState.player.targetX;
        var diff = targetX - currentX;
        
        if (Math.abs(diff) > 0.5) {
            gameState.player.x += diff * 0.2;
        } else {
            gameState.player.x = targetX;
        }
        
        if (gameState.player.isCharging) {
            gameState.player.chargeTime += deltaTime;
            var chargePercent = Math.min(gameState.player.chargeTime / gameState.player.maxChargeTime * 100, 100);
            elements.chargeBarFill.style.width = chargePercent + '%';
        }
        
        if (gameState.player.isSwinging) {
            gameState.player.swingAnim -= deltaTime / 200;
            if (gameState.player.swingAnim <= 0) {
                gameState.player.swingAnim = 0;
                gameState.player.isSwinging = false;
            }
        }
        
        if (gameState.opponent.isSwinging) {
            gameState.opponent.swingAnim -= deltaTime / 200;
            if (gameState.opponent.swingAnim <= 0) {
                gameState.opponent.swingAnim = 0;
                gameState.opponent.isSwinging = false;
            }
        }
        
        updateOpponentAI(deltaTime);
        updateBall(deltaTime);
        updateEffects(deltaTime);
        
        var elapsed = gameState.elapsedTime + (now - gameState.startTime);
        elements.gameTime.textContent = Utils.formatTime(elapsed);
        elements.navTime.textContent = Utils.formatTime(elapsed);
        elements.navRally.textContent = gameState.rallyCount;
    }

    function updateOpponentAI(deltaTime) {
        var opponent = gameState.opponent;
        var ball = gameState.ball;
        var opponentConfig = Data.getOpponentConfig(opponent.type);
        
        if (ball.isActive && ball.vy < 0) {
            var predictedX = predictBallLanding();
            opponent.targetX = predictedX + Utils.randomFloat(-30, 30);
        } else {
            opponent.targetX = court.width / 2;
        }
        
        opponent.targetX = Utils.clamp(opponent.targetX, court.leftBoundary, court.rightBoundary);
        opponent.x = Utils.lerp(opponent.x, opponent.targetX, 0.08 * opponentConfig.speed);
        
        if (ball.isActive && ball.vy < 0) {
            var hitDistance = opponent.racketSize + ball.radius + 15;
            var actualDistance = Utils.getDistance(opponent.x, opponent.y, ball.x, ball.y);
            
            if (actualDistance < hitDistance) {
                opponentHitBall();
            }
        }
    }

    function predictBallLanding() {
        var ball = gameState.ball;
        var vx = ball.vx;
        var vy = ball.vy;
        var x = ball.x;
        var y = ball.y;
        
        while (vy < 0 && y > court.netY) {
            x += vx;
            y += vy;
            vy += rules.gravity;
        }
        
        return x;
    }

    function updateBall(deltaTime) {
        var ball = gameState.ball;
        if (!ball.isActive) return;
        
        ball.vy += rules.gravity;
        
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        if (ball.x - ball.radius < court.leftBoundary || ball.x + ball.radius > court.rightBoundary) {
            ball.vx *= -0.8;
            ball.x = Utils.clamp(ball.x, court.leftBoundary + ball.radius, court.rightBoundary - ball.radius);
        }
        
        if (ball.y <= court.netY + court.netHeight / 2 && 
            ball.y + ball.radius >= court.netY - court.netHeight / 2) {
            if (Math.abs(ball.y - court.netY) < ball.radius + court.netHeight / 2) {
                if (Utils.now() - ball.lastNetTouch > 200) {
                    ball.lastNetTouch = Utils.now();
                    ball.vy *= 0.6;
                    ball.vx *= 0.9;
                    addNetWarning();
                }
            }
        }
        
        checkBallOutOfBounds();
    }

    function checkBallOutOfBounds() {
        var ball = gameState.ball;
        
        if (ball.y > court.bottomBoundary + ball.radius) {
            if (gameState.lastHitBy === 'player') {
                scorePoint('opponent');
            } else {
                scorePoint('player');
            }
            return;
        }
        
        if (ball.y < court.topBoundary - ball.radius) {
            if (gameState.lastHitBy === 'opponent') {
                scorePoint('player');
            } else {
                scorePoint('opponent');
            }
            return;
        }
    }

    function scorePoint(scorer) {
        gameState.ball.isActive = false;
        gameState.rallyCount = 0;
        
        if (scorer === 'player') {
            gameState.playerScore++;
            Utils.showToast('🎾 得分！', 'success', 1500);
        } else {
            gameState.opponentScore++;
            Utils.showToast('😢 失分...', 'error', 1500);
        }
        
        checkGameWin();
        
        resetPositions();
        
        gameState.currentServer = gameState.currentServer === 'player' ? 'opponent' : 'player';
        
        updateUI();
    }

    function checkGameWin() {
        var playerWon = gameState.playerScore >= rules.pointsToWinGame;
        var opponentWon = gameState.opponentScore >= rules.pointsToWinGame;
        
        if (playerWon) {
            gameState.playerGames++;
            gameState.playerScore = 0;
            gameState.opponentScore = 0;
            checkSetWin();
        } else if (opponentWon) {
            gameState.opponentGames++;
            gameState.playerScore = 0;
            gameState.opponentScore = 0;
            checkSetWin();
        }
    }

    function checkSetWin() {
        var playerWonSet = gameState.playerGames >= rules.gamesToWinSet;
        var opponentWonSet = gameState.opponentGames >= rules.gamesToWinSet;
        
        if (playerWonSet || opponentWonSet) {
            endGame(playerWonSet ? 'player' : 'opponent');
        }
    }

    function endGame(winner) {
        gameState.isGameOver = true;
        gameState.isStarted = false;
        stopGameLoop();
        
        var currentTime = Utils.now();
        var totalTime = gameState.elapsedTime + (currentTime - gameState.startTime);
        
        elements.gameOverIcon.textContent = winner === 'player' ? '🏆' : '😢';
        elements.gameOverTitle.textContent = winner === 'player' ? '你赢了！' : '你输了...';
        elements.finalScore.textContent = gameState.playerGames + ' - ' + gameState.opponentGames;
        elements.finalTime.textContent = Utils.formatTime(totalTime);
        elements.finalRally.textContent = maxRally;
        
        Utils.addClass(elements.gameOverModal, 'show');
        
        Data.clearSaveData();
    }

    function updateEffects(deltaTime) {
        var currentTime = Utils.now();
        
        gameState.effects.smashes = gameState.effects.smashes.filter(function(effect) {
            return currentTime - effect.startTime < effect.duration;
        });
        
        gameState.effects.netWarnings = gameState.effects.netWarnings.filter(function(effect) {
            return currentTime - effect.startTime < effect.duration;
        });
        
        gameState.effects.perfectHits = gameState.effects.perfectHits.filter(function(effect) {
            return currentTime - effect.startTime < effect.duration;
        });
    }

    function render() {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawCourt();
        drawNet();
        drawEffects();
        
        if (gameState.ball.isActive) {
            drawBall();
        }
        
        drawPlayer();
        drawOpponent();
    }

    function drawCourt() {
        ctx.fillStyle = colors.court;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = colors.courtLight;
        ctx.fillRect(court.leftBoundary, court.topBoundary, 
                     court.rightBoundary - court.leftBoundary, 
                     court.netY - court.topBoundary);
        ctx.fillRect(court.leftBoundary, court.netY, 
                     court.rightBoundary - court.leftBoundary, 
                     court.bottomBoundary - court.netY);
        
        ctx.strokeStyle = colors.courtLine;
        ctx.lineWidth = 2;
        
        ctx.strokeRect(court.leftBoundary, court.topBoundary, 
                       court.rightBoundary - court.leftBoundary, 
                       court.bottomBoundary - court.topBoundary);
        
        ctx.beginPath();
        ctx.moveTo(court.width / 2, court.topBoundary);
        ctx.lineTo(court.width / 2, court.bottomBoundary);
        ctx.stroke();
        
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(court.leftBoundary + 40, court.topBoundary + 30,
                       (court.rightBoundary - court.leftBoundary) - 80,
                       (court.netY - court.topBoundary) - 60);
        ctx.strokeRect(court.leftBoundary + 40, court.netY + 30,
                       (court.rightBoundary - court.leftBoundary) - 80,
                       (court.bottomBoundary - court.netY) - 60);
        ctx.setLineDash([]);
    }

    function drawNet() {
        ctx.fillStyle = colors.netPost;
        ctx.fillRect(court.leftBoundary - 8, court.netY - 40, 6, 80);
        ctx.fillRect(court.rightBoundary + 2, court.netY - 40, 6, 80);
        
        ctx.strokeStyle = colors.net;
        ctx.lineWidth = court.netHeight;
        ctx.beginPath();
        ctx.moveTo(court.leftBoundary - 5, court.netY);
        ctx.lineTo(court.rightBoundary + 5, court.netY);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        for (var i = court.leftBoundary; i < court.rightBoundary; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, court.netY - 20);
            ctx.lineTo(i, court.netY + 20);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    function drawPlayer() {
        var player = gameState.player;
        var x = player.x;
        var y = player.y;
        var r = player.radius;
        var swingAnim = player.swingAnim;
        
        drawRoundShadow(x, y);
        
        var baseExtend = 60;
        var swingExtend = swingAnim * 50;
        var totalExtend = baseExtend + swingExtend;
        
        var armStartX = x;
        var armStartY = y - r * 0.5;
        var racketX = x;
        var racketY = y - r - totalExtend;
        
        var bodyGradient = ctx.createRadialGradient(
            x - r * 0.3, y - r * 0.3, 0,
            x, y, r
        );
        bodyGradient.addColorStop(0, '#FFE0B2');
        bodyGradient.addColorStop(0.6, '#FFCC80');
        bodyGradient.addColorStop(1, '#FFB74D');
        
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = '#F57C00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        drawPlayerEyes(x, y, 'player');
        drawPlayerMouth(x, y);
        
        ctx.strokeStyle = '#FFCC80';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(armStartX, armStartY);
        ctx.lineTo(racketX, racketY + 15);
        ctx.stroke();
        
        ctx.strokeStyle = '#F57C00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(armStartX, armStartY);
        ctx.lineTo(racketX, racketY + 15);
        ctx.stroke();
        
        var racketAngle = -swingAnim * 0.5;
        drawHugeRacket(racketX, racketY, racketAngle, player.racketSize, 'player');
    }

    function drawOpponent() {
        var opponent = gameState.opponent;
        var opponentConfig = Data.getOpponentConfig(opponent.type);
        var x = opponent.x;
        var y = opponent.y;
        var r = opponent.radius;
        var swingAnim = opponent.swingAnim;
        
        drawRoundShadow(x, y);
        
        var baseExtend = 60;
        var swingExtend = swingAnim * 50;
        var totalExtend = baseExtend + swingExtend;
        
        var armStartX = x;
        var armStartY = y + r * 0.5;
        var racketX = x;
        var racketY = y + r + totalExtend;
        
        var bodyGradient = ctx.createRadialGradient(
            x - r * 0.3, y + r * 0.3, 0,
            x, y, r
        );
        bodyGradient.addColorStop(0, '#BBDEFB');
        bodyGradient.addColorStop(0.6, '#90CAF9');
        bodyGradient.addColorStop(1, '#64B5F6');
        
        ctx.fillStyle = bodyGradient;
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(opponentConfig.emoji, x, y);
        
        ctx.strokeStyle = '#90CAF9';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(armStartX, armStartY);
        ctx.lineTo(racketX, racketY - 15);
        ctx.stroke();
        
        ctx.strokeStyle = '#1976D2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(armStartX, armStartY);
        ctx.lineTo(racketX, racketY - 15);
        ctx.stroke();
        
        var racketAngle = Math.PI + swingAnim * 0.5;
        drawHugeRacket(racketX, racketY, racketAngle, opponent.racketSize, 'opponent');
    }

    function drawRoundShadow(x, y) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 40, 32, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPlayerEyes(x, y, side) {
        var eyeOffset = 8;
        var eyeY = y - 3;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(x - eyeOffset, eyeY, 6, 0, Math.PI * 2);
        ctx.arc(x + eyeOffset, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - eyeOffset, eyeY, 3, 0, Math.PI * 2);
        ctx.arc(x + eyeOffset, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - eyeOffset - 1, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(x + eyeOffset - 1, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 138, 128, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x - 14, y + 3, 4, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 14, y + 3, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPlayerMouth(x, y) {
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y + 8, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }

    function drawHugeRacket(x, y, angle, size, side) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        var actualSize = size * 1.5;
        
        var frameGradient = ctx.createLinearGradient(-actualSize * 0.5, -actualSize * 0.7, actualSize * 0.5, actualSize * 0.7);
        frameGradient.addColorStop(0, '#B0BEC5');
        frameGradient.addColorStop(0.3, '#CFD8DC');
        frameGradient.addColorStop(0.7, '#90A4AE');
        frameGradient.addColorStop(1, '#607D8B');
        
        ctx.fillStyle = frameGradient;
        ctx.strokeStyle = '#455A64';
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        ctx.ellipse(0, -actualSize * 0.5, actualSize * 0.5, actualSize * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-actualSize * 0.2, -actualSize * 0.6, actualSize * 0.15, actualSize * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        
        for (var i = -actualSize * 0.4; i <= actualSize * 0.4; i += 6) {
            ctx.beginPath();
            ctx.moveTo(i, -actualSize * 0.6);
            ctx.lineTo(i, actualSize * 0.05);
            ctx.stroke();
        }
        for (var j = -actualSize * 0.6; j <= actualSize * 0.05; j += 6) {
            ctx.beginPath();
            ctx.moveTo(-actualSize * 0.4, j);
            ctx.lineTo(actualSize * 0.4, j);
            ctx.stroke();
        }
        
        var handleGradient = ctx.createLinearGradient(-6, actualSize * 0.05, 6, actualSize * 0.05);
        handleGradient.addColorStop(0, '#6D4C41');
        handleGradient.addColorStop(0.5, '#8D6E63');
        handleGradient.addColorStop(1, '#5D4037');
        
        ctx.fillStyle = handleGradient;
        ctx.beginPath();
        ctx.roundRect(-6, actualSize * 0.05, 12, actualSize * 0.5, 4);
        ctx.fill();
        
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-6, actualSize * 0.05, 12, actualSize * 0.5, 4);
        ctx.stroke();
        
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        for (var k = 0; k < 4; k++) {
            ctx.beginPath();
            ctx.moveTo(-5, actualSize * 0.12 + k * 0.1 * actualSize);
            ctx.lineTo(5, actualSize * 0.12 + k * 0.1 * actualSize);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    function drawBigRacket(x, y, angle, size, side) {
        drawHugeRacket(x, y, angle, size, side);
    }

    function drawBall() {
        var ball = gameState.ball;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(ball.x, court.bottomBoundary - 10, ball.radius * 0.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        var gradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
        );
        gradient.addColorStop(0, '#FFF9C4');
        gradient.addColorStop(0.5, colors.ball);
        gradient.addColorStop(1, colors.ballOutline);
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = colors.ballOutline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(ball.x - ball.radius * 0.8, ball.y - ball.radius * 0.3);
        ctx.quadraticCurveTo(ball.x, ball.y, ball.x + ball.radius * 0.8, ball.y - ball.radius * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ball.x - ball.radius * 0.8, ball.y + ball.radius * 0.3);
        ctx.quadraticCurveTo(ball.x, ball.y, ball.x + ball.radius * 0.8, ball.y + ball.radius * 0.3);
        ctx.stroke();
        ctx.setLineDash([]);
        
        drawBallExpression(ball.x, ball.y, ball.expression);
    }

    function drawBallExpression(x, y, expression) {
        ctx.fillStyle = '#333';
        
        if (expression === 'happy') {
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y + 2, 4, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        } else if (expression === 'angry') {
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y + 3);
            ctx.lineTo(x + 5, y + 3);
            ctx.stroke();
        } else if (expression === 'sad') {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 2, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x, y + 6, 4, 1.1 * Math.PI, 1.9 * Math.PI);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(x - 4, y - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 4, y - 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y + 1, 3, 0, Math.PI);
            ctx.stroke();
        }
    }

    function drawEffects() {
        var currentTime = Utils.now();
        
        gameState.effects.smashes.forEach(function(effect) {
            var progress = (currentTime - effect.startTime) / effect.duration;
            var alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            
            for (var i = 0; i < 5; i++) {
                var angle = (i / 5) * Math.PI * 2 + progress * 2;
                var length = 30 + progress * 50;
                var startX = effect.x + Math.cos(angle) * 10;
                var startY = effect.y + Math.sin(angle) * 10;
                var endX = effect.x + Math.cos(angle) * length;
                var endY = effect.y + Math.sin(angle) * length;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        gameState.effects.perfectHits.forEach(function(effect) {
            var progress = (currentTime - effect.startTime) / effect.duration;
            var alpha = 1 - progress;
            var scale = 1 + progress * 0.5;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold ' + (24 * scale) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✨', effect.x, effect.y - progress * 30);
            ctx.restore();
        });
        
        gameState.effects.netWarnings.forEach(function(effect) {
            var progress = (currentTime - effect.startTime) / effect.duration;
            var alpha = 1 - progress * 0.5;
            var pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FF5722';
            ctx.font = 'bold ' + (20 * pulse) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚠️ 危险！', effect.x, effect.y - 30);
            ctx.restore();
        });
    }

    function toggleGame() {
        if (!gameState.isStarted) {
            startGame();
        }
    }

    function togglePause() {
        if (!gameState.isStarted) return;
        
        if (gameState.isPaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }

    function startGame() {
        gameState.isStarted = true;
        gameState.isPaused = false;
        gameState.isGameOver = false;
        gameState.startTime = Utils.now();
        
        Utils.removeClass(elements.startScreen, 'hidden');
        elements.startScreen.classList.add('hidden');
        
        updateButtonState();
        startGameLoop();
        
        Utils.showToast('游戏开始！准备发球...', 'info');
    }

    function startNewGame() {
        createNewGame();
        gameState.isStarted = true;
        gameState.isPaused = false;
        gameState.isGameOver = false;
        gameState.startTime = Utils.now();
        maxRally = 0;
        
        Utils.addClass(elements.startScreen, 'hidden');
        Utils.removeClass(elements.gameOverModal, 'show');
        
        updateOpponentDisplay();
        updateUI();
        updateButtonState();
        startGameLoop();
        
        Utils.showToast('新游戏开始！准备发球...', 'info');
    }

    function continueGame() {
        if (gameState.isStarted) {
            gameState.startTime = Utils.now();
            Utils.addClass(elements.startScreen, 'hidden');
            
            if (gameState.isPaused) {
                gameState.isPaused = false;
                Utils.addClass(elements.pauseOverlay, 'hidden');
                updateButtonState();
                startGameLoop();
            } else {
                updateButtonState();
                startGameLoop();
            }
            
            Utils.showToast('游戏已恢复！', 'info');
        }
    }

    function pauseGame() {
        gameState.isPaused = true;
        gameState.elapsedTime += Utils.now() - gameState.startTime;
        
        stopGameLoop();
        Utils.removeClass(elements.pauseOverlay, 'hidden');
        updateButtonState();
        saveGameState();
        
        Utils.showToast('游戏已暂停', 'info');
    }

    function resumeGame() {
        gameState.isPaused = false;
        gameState.startTime = Utils.now();
        
        Utils.addClass(elements.pauseOverlay, 'hidden');
        startGameLoop();
        updateButtonState();
        
        Utils.showToast('游戏继续', 'info');
    }

    function restartGame() {
        stopGameLoop();
        
        maxRally = 0;
        createNewGame();
        
        Utils.addClass(elements.pauseOverlay, 'hidden');
        Utils.addClass(elements.gameOverModal, 'show');
        Utils.removeClass(elements.gameOverModal, 'show');
        Utils.removeClass(elements.startScreen, 'hidden');
        
        Data.clearSaveData();
        
        updateOpponentDisplay();
        updateUI();
        updateButtonState();
        render();
        
        if (Data.hasSaveData()) {
            elements.continueBtn.style.display = 'block';
        } else {
            elements.continueBtn.style.display = 'none';
        }
        
        Utils.showToast('游戏已重置！', 'info');
    }

    function updateButtonState() {
        if (!gameState.isStarted) {
            elements.startBtn.textContent = '▶️ 开始游戏';
            elements.startBtn.disabled = false;
            elements.pauseBtn.disabled = true;
        } else if (gameState.isPaused) {
            elements.startBtn.textContent = '▶️ 继续游戏';
            elements.startBtn.disabled = false;
            elements.pauseBtn.disabled = true;
        } else {
            elements.startBtn.textContent = '🎮 游戏中';
            elements.startBtn.disabled = true;
            elements.pauseBtn.disabled = false;
        }
    }

    function updateOpponentDisplay() {
        var opponentConfig = Data.getOpponentConfig(gameState.opponent.type);
        elements.opponentName.textContent = opponentConfig.emoji + ' ' + opponentConfig.name;
        elements.opponentEmoji.textContent = opponentConfig.emoji;
        elements.opponentInfoName.textContent = opponentConfig.name;
    }

    function updateUI() {
        elements.playerScore.textContent = gameState.playerScore;
        elements.opponentScore.textContent = gameState.opponentScore;
        elements.playerGames.textContent = gameState.playerGames;
        elements.opponentGames.textContent = gameState.opponentGames;
    }

    function startGameLoop() {
        if (gameLoop) return;
        
        lastTime = Utils.now();
        
        if (!autosaveTimer) {
            autosaveTimer = setInterval(function() {
                if (gameState && gameState.isStarted && !gameState.isPaused) {
                    saveGameState();
                }
            }, 2000);
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
            render();
            
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

    function saveGameState() {
        var currentTime = Utils.now();
        var elapsed = gameState.isStarted ? (currentTime - gameState.startTime) : 0;
        
        Data.saveGame({
            isStarted: gameState.isStarted,
            isPaused: gameState.isPaused,
            isGameOver: gameState.isGameOver,
            startTime: gameState.startTime,
            elapsedTime: gameState.elapsedTime + elapsed,
            playerScore: gameState.playerScore,
            opponentScore: gameState.opponentScore,
            playerGames: gameState.playerGames,
            opponentGames: gameState.opponentGames,
            playerSets: gameState.playerSets,
            opponentSets: gameState.opponentSets,
            currentServer: gameState.currentServer,
            rallyCount: gameState.rallyCount,
            maxRally: maxRally,
            lastHitBy: gameState.lastHitBy,
            ball: gameState.ball,
            player: gameState.player,
            opponent: gameState.opponent,
            effects: gameState.effects
        });
    }

    return {
        init: init,
        getState: function() { return gameState; }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});
