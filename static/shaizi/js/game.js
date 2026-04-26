(function() {
    'use strict';

    const STORAGE_KEY = 'lucky_shooter_game_data';

    let gameState = {
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        maxStreak: 0,
        playTime: 0,
        isPaused: false,
        isRolling: false,
        lastPlayerValue: null,
        lastComputerValue: null,
        lastResult: null
    };

    let startTime = null;
    let timeInterval = null;

    let playerCanvas, playerCtx;
    let computerCanvas, computerCtx;
    const CANVAS_SIZE = 120;
    const DICE_SIZE = 100;

    function init() {
        loadGameState();
        initCanvas();
        bindEvents();
        initTimers();
        updateAllDisplays();
        updateButtonStates();
        
        const hasSavedDice = isValidDiceValue(gameState.lastPlayerValue) && 
                              isValidDiceValue(gameState.lastComputerValue);
        
        if (hasSavedDice) {
            drawDice(playerCtx, gameState.lastPlayerValue);
            drawDice(computerCtx, gameState.lastComputerValue);
            document.getElementById('player-value').textContent = gameState.lastPlayerValue;
            document.getElementById('computer-value').textContent = gameState.lastComputerValue;
            
            if (gameState.isPaused) {
                const resultEl = document.getElementById('result-message');
                resultEl.textContent = '⏸️ 游戏已暂停';
                resultEl.className = 'result-message';
            } else {
                updateResultDisplay(gameState.lastResult);
            }
        } else {
            drawDice(playerCtx, 1);
            drawDice(computerCtx, 1);
            document.getElementById('player-value').textContent = '-';
            document.getElementById('computer-value').textContent = '-';
        }
    }

    function initCanvas() {
        playerCanvas = document.getElementById('player-dice');
        computerCanvas = document.getElementById('computer-dice');
        playerCtx = playerCanvas.getContext('2d');
        computerCtx = computerCanvas.getContext('2d');
    }

    function drawDice(ctx, value, angleX = 0, angleY = 0) {
        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;
        const size = DICE_SIZE / 2;

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const projection = 400;
        const scaleX = 0.9 + 0.1 * Math.cos(angleX);
        const scaleY = 0.9 + 0.1 * Math.cos(angleY);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scaleX, scaleY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-size + 5, -size + 5, size * 2, size * 2, 18);
        ctx.fill();

        const diceGradient = ctx.createLinearGradient(-size, -size, size, size);
        diceGradient.addColorStop(0, '#ffffff');
        diceGradient.addColorStop(0.3, '#f8f8f8');
        diceGradient.addColorStop(0.7, '#e8e8e8');
        diceGradient.addColorStop(1, '#d0d0d0');

        ctx.fillStyle = diceGradient;
        ctx.beginPath();
        ctx.roundRect(-size, -size, size * 2, size * 2, 16);
        ctx.fill();

        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.roundRect(-size + 4, -size + 4, size * 2 - 8, size * 2 - 8, 14);
        ctx.fill();

        const edgeGradient = ctx.createLinearGradient(-size, -size, -size + 8, -size + 8);
        edgeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        edgeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = edgeGradient;
        ctx.beginPath();
        ctx.roundRect(-size, -size, size * 2, 15, [14, 14, 0, 0]);
        ctx.fill();

        drawDots(ctx, value, size);

        ctx.restore();
    }

    function drawDots(ctx, value, size) {
        const dotRadius = size * 0.14;
        const dotColor = '#1a1a1a';
        const dotShadeColor = '#000';

        const dotPositions = getDotPositions(value, size);

        dotPositions.forEach(pos => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(pos.x + 2, pos.y + 2, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            const dotGradient = ctx.createRadialGradient(
                pos.x - dotRadius * 0.3, pos.y - dotRadius * 0.3, dotRadius * 0.1,
                pos.x, pos.y, dotRadius
            );
            dotGradient.addColorStop(0, '#4a4a4a');
            dotGradient.addColorStop(0.5, dotColor);
            dotGradient.addColorStop(1, dotShadeColor);

            ctx.fillStyle = dotGradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(pos.x - dotRadius * 0.3, pos.y - dotRadius * 0.3, dotRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function getDotPositions(value, size) {
        const positions = [];
        const spacing = size * 0.55;
        const offset = spacing * 0.5;

        switch (value) {
            case 1:
                positions.push({ x: 0, y: 0 });
                break;
            case 2:
                positions.push({ x: -offset, y: -offset });
                positions.push({ x: offset, y: offset });
                break;
            case 3:
                positions.push({ x: -offset, y: -offset });
                positions.push({ x: 0, y: 0 });
                positions.push({ x: offset, y: offset });
                break;
            case 4:
                positions.push({ x: -offset, y: -offset });
                positions.push({ x: offset, y: -offset });
                positions.push({ x: -offset, y: offset });
                positions.push({ x: offset, y: offset });
                break;
            case 5:
                positions.push({ x: -offset, y: -offset });
                positions.push({ x: offset, y: -offset });
                positions.push({ x: 0, y: 0 });
                positions.push({ x: -offset, y: offset });
                positions.push({ x: offset, y: offset });
                break;
            case 6:
                positions.push({ x: -offset, y: -offset });
                positions.push({ x: offset, y: -offset });
                positions.push({ x: -offset, y: 0 });
                positions.push({ x: offset, y: 0 });
                positions.push({ x: -offset, y: offset });
                positions.push({ x: offset, y: offset });
                break;
        }
        return positions;
    }

    function bindEvents() {
        document.getElementById('roll-btn').addEventListener('click', handleRoll);
        document.getElementById('pause-btn').addEventListener('click', handlePause);
        document.getElementById('restart-btn').addEventListener('click', handleRestart);

        const buttons = document.querySelectorAll('.control-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                createRipple(e, this);
            });
        });
    }

    function createRipple(e, button) {
        const rippleContainer = document.getElementById('ripple-container');
        const ripple = document.createElement('div');
        ripple.className = 'ripple';

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.left + x) + 'px';
        ripple.style.top = (rect.top + y) + 'px';
        
        const bgColor = getComputedStyle(button).background;
        ripple.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%)';

        rippleContainer.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    function handleRoll() {
        if (gameState.isRolling || gameState.isPaused) return;

        gameState.isRolling = true;
        updateButtonStates();

        const playerValue = rollDice();
        const computerValue = rollDice();

        animateRoll(playerCtx, playerValue, 'player');
        animateRoll(computerCtx, computerValue, 'computer');

        setTimeout(() => {
            gameState.lastPlayerValue = playerValue;
            gameState.lastComputerValue = computerValue;
            document.getElementById('player-value').textContent = playerValue;
            document.getElementById('computer-value').textContent = computerValue;

            const result = determineWinner(playerValue, computerValue);
            gameState.lastResult = result;
            updateStats(result);
            updateResultDisplay(result);
            saveGameState();

            gameState.isRolling = false;
            updateButtonStates();
        }, 1000);
    }

    function rollDice() {
        return Math.floor(Math.random() * 6) + 1;
    }

    function animateRoll(ctx, finalValue, type) {
        const wrapper = type === 'player' 
            ? document.getElementById('player-dice').parentElement
            : document.getElementById('computer-dice').parentElement;
        
        wrapper.classList.add('shaking');

        let frameCount = 0;
        const totalFrames = 20;
        let currentValue = 1;

        const interval = setInterval(() => {
            currentValue = rollDice();
            const angleX = (Math.random() - 0.5) * Math.PI;
            const angleY = (Math.random() - 0.5) * Math.PI;
            drawDice(ctx, currentValue, angleX, angleY);
            frameCount++;

            if (frameCount >= totalFrames) {
                clearInterval(interval);
                drawDice(ctx, finalValue);
                wrapper.classList.remove('shaking');
            }
        }, 50);
    }

    function determineWinner(player, computer) {
        if (player > computer) return 'win';
        if (player < computer) return 'lose';
        return 'draw';
    }

    function updateStats(result) {
        switch (result) {
            case 'win':
                gameState.wins++;
                gameState.currentStreak++;
                if (gameState.currentStreak > gameState.maxStreak) {
                    gameState.maxStreak = gameState.currentStreak;
                }
                break;
            case 'lose':
                gameState.losses++;
                gameState.currentStreak = 0;
                break;
            case 'draw':
                gameState.draws++;
                break;
        }
        updateAllDisplays();
    }

    function updateResultDisplay(result) {
        const resultEl = document.getElementById('result-message');
        resultEl.className = 'result-message';

        if (!result) {
            resultEl.textContent = '点击投掷开始游戏！';
            return;
        }

        switch (result) {
            case 'win':
                resultEl.textContent = '🎉 你赢了！';
                resultEl.classList.add('win');
                break;
            case 'lose':
                resultEl.textContent = '😢 你输了！';
                resultEl.classList.add('lose');
                break;
            case 'draw':
                resultEl.textContent = '🤝 平局！';
                resultEl.classList.add('draw');
                break;
        }
    }

    function updateAllDisplays() {
        document.getElementById('wins-count').textContent = gameState.wins;
        document.getElementById('losses-count').textContent = gameState.losses;
        document.getElementById('draws-count').textContent = gameState.draws;
        document.getElementById('streak-count').textContent = gameState.currentStreak;
        document.getElementById('max-streak').textContent = gameState.maxStreak;
        updateTimeDisplay();
    }

    function updateButtonStates() {
        const rollBtn = document.getElementById('roll-btn');
        const pauseBtn = document.getElementById('pause-btn');

        rollBtn.disabled = gameState.isRolling || gameState.isPaused;
        
        if (gameState.isPaused) {
            pauseBtn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">继续</span>';
        } else {
            pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">暂停</span>';
        }
    }

    function handlePause() {
        gameState.isPaused = !gameState.isPaused;
        updateButtonStates();
        saveGameState();

        const resultEl = document.getElementById('result-message');
        if (gameState.isPaused) {
            resultEl.textContent = '⏸️ 游戏已暂停';
            resultEl.className = 'result-message';
        } else {
            updateResultDisplay(gameState.lastResult);
        }
    }

    function handleRestart() {
        if (confirm('确定要重新开始吗？本局将重置，但总统计数据会保留。')) {
            gameState.currentStreak = 0;
            gameState.isPaused = false;
            gameState.isRolling = false;
            gameState.lastPlayerValue = null;
            gameState.lastComputerValue = null;
            gameState.lastResult = null;

            document.getElementById('player-value').textContent = '-';
            document.getElementById('computer-value').textContent = '-';
            
            drawDice(playerCtx, 1);
            drawDice(computerCtx, 1);
            
            updateResultDisplay(null);
            updateAllDisplays();
            updateButtonStates();
            saveGameState();
        }
    }

    function initTimers() {
        if (gameState.playTime === 0) {
            startTime = Date.now();
        } else {
            startTime = Date.now() - gameState.playTime * 1000;
        }

        timeInterval = setInterval(() => {
            if (!gameState.isPaused) {
                gameState.playTime = Math.floor((Date.now() - startTime) / 1000);
                updateTimeDisplay();
                saveGameState();
            }
        }, 1000);
    }

    function updateTimeDisplay() {
        const minutes = Math.floor(gameState.playTime / 60);
        const seconds = gameState.playTime % 60;
        document.getElementById('game-time').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function saveGameState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        } catch (e) {
            console.warn('Failed to save game state:', e);
        }
    }

    function isValidDiceValue(value) {
        return typeof value === 'number' && value >= 1 && value <= 6;
    }

    function isValidResult(value) {
        return value === 'win' || value === 'lose' || value === 'draw';
    }

    function loadGameState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                if (typeof parsed.wins === 'number') gameState.wins = parsed.wins;
                if (typeof parsed.losses === 'number') gameState.losses = parsed.losses;
                if (typeof parsed.draws === 'number') gameState.draws = parsed.draws;
                if (typeof parsed.currentStreak === 'number') gameState.currentStreak = parsed.currentStreak;
                if (typeof parsed.maxStreak === 'number') gameState.maxStreak = parsed.maxStreak;
                if (typeof parsed.playTime === 'number') gameState.playTime = parsed.playTime;
                
                if (isValidDiceValue(parsed.lastPlayerValue)) {
                    gameState.lastPlayerValue = parsed.lastPlayerValue;
                }
                if (isValidDiceValue(parsed.lastComputerValue)) {
                    gameState.lastComputerValue = parsed.lastComputerValue;
                }
                if (isValidResult(parsed.lastResult)) {
                    gameState.lastResult = parsed.lastResult;
                }
                
                if (typeof parsed.isPaused === 'boolean') {
                    gameState.isPaused = parsed.isPaused;
                } else {
                    gameState.isPaused = false;
                }
                gameState.isRolling = false;
            }
        } catch (e) {
            console.warn('Failed to load game state:', e);
        }
    }

    window.addEventListener('beforeunload', () => {
        if (timeInterval) {
            clearInterval(timeInterval);
        }
        saveGameState();
    });

    document.addEventListener('DOMContentLoaded', init);
})();
