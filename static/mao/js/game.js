var Game = (function() {
    'use strict';

    var GameState = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver'
    };

    var state = GameState.MENU;
    var mouse = null;
    var cat = null;
    var cheeses = [];
    var score = 0;
    var startTime = 0;
    var pauseTime = 0;
    var totalPauseTime = 0;
    var cheesesCollectedThisGame = 0;
    var gameLoopId = null;
    var autosaveTimer = null;

    var keys = {
        up: false,
        down: false,
        left: false,
        right: false,
        w: false,
        s: false,
        a: false,
        d: false
    };

    var elements = {};

    function init() {
        cacheElements();
        bindEvents();
        
        Renderer.init(elements.canvas);
        AudioManager.init();
        
        var savedState = Storage.loadGameState();
        if (savedState && savedState.state !== GameState.MENU) {
            restoreFromSavedState(savedState);
        } else {
            showStartScreen();
        }

        updateStatsDisplay();
    }

    function cacheElements() {
        elements = {
            canvas: Utils.$('#game-canvas'),
            startScreen: Utils.$('#start-screen'),
            gameUI: Utils.$('#game-ui'),
            gameOverModal: Utils.$('#game-over-modal'),
            startBtn: Utils.$('#start-btn'),
            pauseBtn: Utils.$('#pause-btn'),
            restartBtn: Utils.$('#restart-btn'),
            retryBtn: Utils.$('#retry-btn'),
            resumeBtn: Utils.$('#resume-btn'),
            scoreDisplay: Utils.$('#score-display'),
            timeDisplay: Utils.$('#time-display'),
            finalScore: Utils.$('#final-score'),
            finalTime: Utils.$('#final-time'),
            highScore: Utils.$('#high-score'),
            longestSurvival: Utils.$('#longest-survival'),
            totalCheeses: Utils.$('#total-cheeses'),
            totalGames: Utils.$('#total-games'),
            statsHighScore: Utils.$('#stats-high-score'),
            statsLongestSurvival: Utils.$('#stats-longest-survival'),
            statsTotalCheeses: Utils.$('#stats-total-cheeses'),
            statsTotalGames: Utils.$('#stats-total-games'),
            volumeSlider: Utils.$('#volume-slider'),
            volumeValue: Utils.$('#volume-value'),
            soundToggle: Utils.$('#sound-toggle')
        };
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', startGame);
        elements.pauseBtn.addEventListener('click', togglePause);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.retryBtn.addEventListener('click', restartGame);
        elements.resumeBtn.addEventListener('click', resumeGame);

        if (elements.volumeSlider) {
            elements.volumeSlider.addEventListener('input', handleVolumeChange);
        }
        if (elements.soundToggle) {
            elements.soundToggle.addEventListener('click', toggleSound);
        }

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        window.addEventListener('beforeunload', function(e) {
            if (state !== GameState.MENU) {
                saveGameState();
            }
        });
    }

    function handleVolumeChange(e) {
        var volume = parseInt(e.target.value) / 100;
        AudioManager.setVolume(volume);
        if (elements.volumeValue) {
            elements.volumeValue.textContent = e.target.value + '%';
        }
    }

    function toggleSound() {
        var enabled = AudioManager.isEnabled();
        AudioManager.setEnabled(!enabled);
        
        if (elements.soundToggle) {
            if (enabled) {
                elements.soundToggle.textContent = '🔇 音效关';
            } else {
                elements.soundToggle.textContent = '🔊 音效开';
                AudioManager.playClick();
            }
        }
    }

    function handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
                keys.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
                keys.down = true;
                e.preventDefault();
                break;
            case 'ArrowLeft':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                keys.right = true;
                e.preventDefault();
                break;
            case 'w':
            case 'W':
                keys.w = true;
                break;
            case 's':
            case 'S':
                keys.s = true;
                break;
            case 'a':
            case 'A':
                keys.a = true;
                break;
            case 'd':
            case 'D':
                keys.d = true;
                break;
            case ' ':
                if (state === GameState.PLAYING || state === GameState.PAUSED) {
                    togglePause();
                }
                e.preventDefault();
                break;
            case 'Escape':
                if (state === GameState.PLAYING || state === GameState.PAUSED) {
                    togglePause();
                }
                break;
        }
    }

    function handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowUp':
                keys.up = false;
                break;
            case 'ArrowDown':
                keys.down = false;
                break;
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
            case 'w':
            case 'W':
                keys.w = false;
                break;
            case 's':
            case 'S':
                keys.s = false;
                break;
            case 'a':
            case 'A':
                keys.a = false;
                break;
            case 'd':
            case 'D':
                keys.d = false;
                break;
        }
    }

    function showStartScreen() {
        state = GameState.MENU;
        Utils.removeClass(elements.startScreen, 'hidden');
        Utils.addClass(elements.gameUI, 'hidden');
        Utils.addClass(elements.gameOverModal, 'hidden');

        Renderer.clear();
        Renderer.drawBackground();
    }

    function startGame() {
        state = GameState.PLAYING;
        
        Utils.addClass(elements.startScreen, 'hidden');
        Utils.removeClass(elements.gameUI, 'hidden');
        Utils.addClass(elements.gameOverModal, 'hidden');

        mouse = Entities.createMouseAtCenter();
        cat = Entities.createCatAtCorner();
        cheeses = Entities.createInitialCheeses(mouse, cat);
        
        score = 0;
        startTime = Utils.now();
        totalPauseTime = 0;
        cheesesCollectedThisGame = 0;

        updateUI();
        startGameLoop();
        startAutosave();
        
        AudioManager.playStartGame();
        Utils.showToast('游戏开始！用 WASD 或方向键控制老鼠', 'info');
    }

    function restartGame() {
        stopGameLoop();
        stopAutosave();
        Storage.removeGameState();
        startGame();
    }

    function togglePause() {
        if (state === GameState.PLAYING) {
            pauseGame();
        } else if (state === GameState.PAUSED) {
            resumeGame();
        }
    }

    function pauseGame() {
        if (state !== GameState.PLAYING) return;
        
        state = GameState.PAUSED;
        pauseTime = Utils.now();
        
        stopGameLoop();
        AudioManager.playPause();
        elements.pauseBtn.textContent = '▶️ 继续';
        Utils.removeClass(elements.resumeBtn, 'hidden');
        
        Renderer.drawGameScene(mouse, cat, cheeses);
        Renderer.drawPausedOverlay();
        
        saveGameState();
        Utils.showToast('游戏已暂停', 'info');
    }

    function resumeGame() {
        if (state !== GameState.PAUSED) return;
        
        var pauseDuration = Utils.now() - pauseTime;
        totalPauseTime += pauseDuration;
        
        state = GameState.PLAYING;
        elements.pauseBtn.textContent = '⏸️ 暂停';
        Utils.addClass(elements.resumeBtn, 'hidden');
        
        startGameLoop();
        AudioManager.playResume();
        Utils.showToast('游戏继续', 'info');
    }

    function gameOver() {
        state = GameState.GAME_OVER;
        stopGameLoop();
        stopAutosave();
        AudioManager.playGameOver();

        var survivalTime = getElapsedSeconds();
        Storage.updateStats(score, survivalTime, cheesesCollectedThisGame);
        
        elements.finalScore.textContent = score;
        elements.finalTime.textContent = Utils.formatTime(survivalTime);
        
        Utils.removeClass(elements.gameOverModal, 'hidden');
        
        Renderer.drawGameScene(mouse, cat, cheeses);
        Renderer.drawGameOverOverlay(score, survivalTime);
        
        updateStatsDisplay();
        Storage.removeGameState();
        
        Utils.showToast('游戏结束！得分: ' + score, 'error');
    }

    function getElapsedSeconds() {
        var currentTime = state === GameState.PAUSED ? pauseTime : Utils.now();
        var totalTime = currentTime - startTime - totalPauseTime;
        return Math.max(0, totalTime / 1000);
    }

    function startGameLoop() {
        if (gameLoopId) return;

        function loop() {
            if (state !== GameState.PLAYING) return;

            update();
            render();

            gameLoopId = requestAnimationFrame(loop);
        }

        gameLoopId = requestAnimationFrame(loop);
    }

    function stopGameLoop() {
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
        }
        AudioManager.stopHeartbeat();
    }

    function startAutosave() {
        if (autosaveTimer) return;
        
        autosaveTimer = setInterval(function() {
            if (state === GameState.PLAYING) {
                saveGameState();
            }
        }, 1000);
    }

    function stopAutosave() {
        if (autosaveTimer) {
            clearInterval(autosaveTimer);
            autosaveTimer = null;
        }
    }

    function update() {
        var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
        var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');
        var elapsedSeconds = getElapsedSeconds();

        mouse.update(keys, canvasWidth, canvasHeight);
        cat.update(mouse.x, mouse.y, elapsedSeconds);

        updateHeartbeat();

        checkCheeseCollision();
        checkCatCollision();

        updateUI();
    }

    function updateHeartbeat() {
        if (!mouse || !cat) return;

        var distance = Utils.getDistance(mouse.x, mouse.y, cat.x, cat.y);
        var maxDistance = 400;

        if (distance < maxDistance) {
            var intensity = 1 + (1 - distance / maxDistance) * 1.5;
            
            if (AudioManager.isHeartbeatActive()) {
                AudioManager.updateHeartbeatIntensity(intensity);
            } else {
                AudioManager.startHeartbeat(intensity);
            }
        } else {
            if (AudioManager.isHeartbeatActive()) {
                AudioManager.stopHeartbeat();
            }
        }
    }

    function checkCheeseCollision() {
        var cheesesToRemove = [];

        for (var i = 0; i < cheeses.length; i++) {
            var cheese = cheeses[i];
            if (Utils.checkCollision(
                { x: mouse.x, y: mouse.y, radius: mouse.radius },
                { x: cheese.x, y: cheese.y, radius: cheese.radius }
            )) {
                cheesesToRemove.push(i);
                score += GameConfig.get('CHEESE.SCORE');
                cheesesCollectedThisGame++;
                AudioManager.playCollectCheese();
                Utils.showToast('+10 分！', 'success', 1000);
            }
        }

        for (var j = cheesesToRemove.length - 1; j >= 0; j--) {
            cheeses.splice(cheesesToRemove[j], 1);
            var newCheese = Entities.createRandomCheese(cheeses, mouse, cat);
            cheeses.push(newCheese);
        }
    }

    function checkCatCollision() {
        if (Utils.checkCollision(
            { x: mouse.x, y: mouse.y, radius: mouse.radius * 0.8 },
            { x: cat.x, y: cat.y, radius: cat.radius * 0.8 }
        )) {
            gameOver();
        }
    }

    function render() {
        Renderer.drawGameScene(mouse, cat, cheeses);
    }

    function updateUI() {
        elements.scoreDisplay.textContent = score;
        elements.timeDisplay.textContent = Utils.formatTime(getElapsedSeconds());
    }

    function updateStatsDisplay() {
        var stats = Storage.loadStats();
        
        elements.statsHighScore.textContent = stats.highScore;
        elements.statsLongestSurvival.textContent = Utils.formatTime(stats.longestSurvival);
        elements.statsTotalCheeses.textContent = stats.totalCheeses;
        elements.statsTotalGames.textContent = stats.totalGames;
    }

    function saveGameState() {
        var elapsedSeconds = getElapsedSeconds();
        var gameState = {
            state: state,
            score: score,
            elapsedSeconds: elapsedSeconds,
            startTime: startTime,
            totalPauseTime: totalPauseTime,
            pauseTime: pauseTime,
            cheesesCollectedThisGame: cheesesCollectedThisGame,
            mouse: mouse ? mouse.toJSON() : null,
            cat: cat ? cat.toJSON() : null,
            cheeses: cheeses.map(function(c) { return c.toJSON(); }),
            keys: keys,
            savedAt: Utils.now()
        };

        Storage.saveGameState(gameState);
    }

    function restoreFromSavedState(savedState) {
        try {
            if (!savedState) {
                throw new Error('保存的状态为空');
            }

            var validStates = [GameState.PLAYING, GameState.PAUSED];
            if (validStates.indexOf(savedState.state) === -1) {
                throw new Error('无效的游戏状态: ' + savedState.state);
            }

            if (typeof savedState.score === 'undefined') {
                throw new Error('缺少分数数据');
            }

            var elapsedSeconds;
            if (typeof savedState.elapsedSeconds !== 'undefined') {
                elapsedSeconds = savedState.elapsedSeconds;
            } else if (typeof savedState.startTime !== 'undefined') {
                console.warn('使用旧的保存格式，时间可能不准确');
                var totalTime = Utils.now() - savedState.startTime;
                var totalPause = savedState.totalPauseTime || 0;
                elapsedSeconds = Math.max(0, totalTime - totalPause) / 1000;
            } else {
                throw new Error('缺少时间数据');
            }

            state = savedState.state;
            score = savedState.score;
            totalPauseTime = 0;
            cheesesCollectedThisGame = savedState.cheesesCollectedThisGame || 0;

            startTime = Utils.now() - elapsedSeconds * 1000;

            if (savedState.mouse) {
                mouse = Entities.Mouse.fromJSON(savedState.mouse);
            } else {
                mouse = Entities.createMouseAtCenter();
            }

            if (savedState.cat) {
                cat = Entities.Cat.fromJSON(savedState.cat);
            } else {
                cat = Entities.createCatAtCorner();
            }

            if (savedState.cheeses && savedState.cheeses.length > 0) {
                cheeses = savedState.cheeses.map(function(c) {
                    return Entities.Cheese.fromJSON(c);
                });
            } else {
                cheeses = Entities.createInitialCheeses(mouse, cat);
            }

            if (savedState.keys) {
                keys = savedState.keys;
            }

            if (!mouse || !cat || !cheeses || cheeses.length === 0) {
                throw new Error('游戏实体初始化失败');
            }

            Utils.addClass(elements.startScreen, 'hidden');
            Utils.removeClass(elements.gameUI, 'hidden');
            Utils.addClass(elements.gameOverModal, 'hidden');

            if (state === GameState.PAUSED) {
                pauseTime = Utils.now();
                elements.pauseBtn.textContent = '▶️ 继续';
                Utils.removeClass(elements.resumeBtn, 'hidden');
                Renderer.drawGameScene(mouse, cat, cheeses);
                Renderer.drawPausedOverlay();
            } else if (state === GameState.PLAYING) {
                elements.pauseBtn.textContent = '⏸️ 暂停';
                Utils.addClass(elements.resumeBtn, 'hidden');
                updateUI();
                startGameLoop();
                startAutosave();
            }

            Utils.showToast('游戏状态已恢复', 'info');
            return true;

        } catch (error) {
            console.error('恢复游戏状态失败:', error);
            Storage.removeGameState();
            showStartScreen();
            Utils.showToast('恢复游戏状态失败，已重置', 'warning');
            return false;
        }
    }

    return {
        init: init,
        getState: function() { return state; },
        GameState: GameState
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});
