var GameUI = (function() {
    var elements = {};
    var hasSavedGame = false;
    
    function init(hasSaved) {
        hasSavedGame = hasSaved;
        cacheElements();
        bindEvents();
        updateHighScore();
        showStartOverlay();
    }
    
    function cacheElements() {
        elements.startOverlay = document.getElementById('startOverlay');
        elements.pauseOverlay = document.getElementById('pauseOverlay');
        elements.gameOverOverlay = document.getElementById('gameOverOverlay');
        elements.startBtn = document.getElementById('startBtn');
        elements.resumeBtn = document.getElementById('resumeBtn');
        elements.pauseBtn = document.getElementById('pauseBtn');
        elements.restartBtn = document.getElementById('restartBtn');
        elements.backToMenuBtn = document.getElementById('backToMenuBtn');
        elements.resumeFromPauseBtn = document.getElementById('resumeFromPauseBtn');
        elements.restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
        elements.exitToMenuBtn = document.getElementById('exitToMenuBtn');
        elements.missedCount = document.getElementById('missedCount');
        elements.timeLeft = document.getElementById('timeLeft');
        elements.currentScore = document.getElementById('currentScore');
        elements.highScore = document.getElementById('highScore');
        elements.finalScore = document.getElementById('finalScore');
        elements.hitCount = document.getElementById('hitCount');
        elements.missedTotal = document.getElementById('missedTotal');
        elements.newRecord = document.getElementById('newRecord');
        elements.canvas = document.getElementById('gameCanvas');
    }
    
    function bindEvents() {
        elements.startBtn.addEventListener('click', handleStartClick);
        elements.resumeBtn.addEventListener('click', handleResumeClick);
        elements.pauseBtn.addEventListener('click', handlePauseClick);
        elements.restartBtn.addEventListener('click', handleRestartClick);
        elements.backToMenuBtn.addEventListener('click', handleBackToMenuClick);
        elements.resumeFromPauseBtn.addEventListener('click', handleResumeClick);
        elements.restartFromPauseBtn.addEventListener('click', handleRestartClick);
        elements.exitToMenuBtn.addEventListener('click', handleBackToMenuClick);
        
        elements.canvas.addEventListener('mousedown', handleCanvasClick);
        elements.canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    function handleStartClick() {
        Audio.init();
        Audio.playStart();
        
        Storage.clearCurrentGame();
        GameEngine.startNewGame();
    }
    
    function handleResumeClick() {
        Audio.init();
        Audio.playStart();
        
        var restored = GameEngine.restoreSavedGame();
        if (!restored) {
            GameEngine.startNewGame();
            return;
        }
        
        var gameState = GameEngine.getGameState();
        if (gameState.state === GameConfig.GAME_STATE.PAUSED) {
            GameEngine.resume();
        }
    }
    
    function handlePauseClick() {
        GameEngine.pause();
    }
    
    function handleRestartClick() {
        Audio.playStart();
        hideAllOverlays();
        GameEngine.startNewGame();
    }
    
    function handleBackToMenuClick() {
        GameEngine.resetGame();
        hideAllOverlays();
        showStartOverlay();
    }
    
    function handleCanvasClick(e) {
        var rect = elements.canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        
        GameEngine.handleClick(x, y);
    }
    
    function handleCanvasTouch(e) {
        e.preventDefault();
        var rect = elements.canvas.getBoundingClientRect();
        var touch = e.touches[0] || e.changedTouches[0];
        var x = touch.clientX - rect.left;
        var y = touch.clientY - rect.top;
        
        GameEngine.handleClick(x, y);
    }
    
    function handleResize() {
        Renderer.resize();
    }
    
    function handleBeforeUnload() {
        GameEngine.saveGame();
    }
    
    function hideAllOverlays() {
        elements.startOverlay.style.display = 'none';
        elements.pauseOverlay.style.display = 'none';
        elements.gameOverOverlay.style.display = 'none';
    }
    
    function showStartOverlay() {
        hideAllOverlays();
        elements.pauseBtn.style.display = 'none';
        
        var savedGame = Storage.getCurrentGame();
        if (savedGame) {
            elements.startBtn.textContent = '新游戏';
            elements.resumeBtn.style.display = 'inline-block';
            elements.resumeBtn.textContent = '继续游戏 (' + savedGame.score + '分)';
        } else {
            elements.startBtn.textContent = '开始游戏';
            elements.resumeBtn.style.display = 'none';
        }
        
        elements.startOverlay.style.display = 'flex';
    }
    
    function showPauseOverlay() {
        hideAllOverlays();
        elements.pauseOverlay.style.display = 'flex';
    }
    
    function showGameOverOverlay(gameState) {
        hideAllOverlays();
        elements.pauseBtn.style.display = 'none';
        
        elements.finalScore.textContent = gameState.score;
        elements.hitCount.textContent = gameState.hit;
        elements.missedTotal.textContent = gameState.missed;
        
        var isNewRecord = gameState.score === Storage.getHighScore() && gameState.score > 0;
        elements.newRecord.textContent = isNewRecord ? '是!' : '否';
        elements.newRecord.style.color = isNewRecord ? '#ffd700' : '#fff';
        
        elements.gameOverOverlay.style.display = 'flex';
    }
    
    function updateStats(gameState) {
        elements.missedCount.textContent = gameState.missed + '/' + GameConfig.MAX_MISSED;
        elements.timeLeft.textContent = gameState.timeLeft + 's';
        elements.currentScore.textContent = gameState.score;
        elements.highScore.textContent = Math.max(gameState.highScore, gameState.score);
    }
    
    function updateHighScore() {
        elements.highScore.textContent = Storage.getHighScore();
    }
    
    function handleStateChange(gameState) {
        if (gameState.state === GameConfig.GAME_STATE.MENU) {
            showStartOverlay();
        } else if (gameState.state === GameConfig.GAME_STATE.PLAYING) {
            hideAllOverlays();
            elements.pauseBtn.style.display = 'inline-block';
            updateStats(gameState);
        } else if (gameState.state === GameConfig.GAME_STATE.PAUSED) {
            showPauseOverlay();
        } else if (gameState.state === GameConfig.GAME_STATE.GAME_OVER) {
            showGameOverOverlay(gameState);
            updateHighScore();
        }
    }
    
    function handleScoreChange(gameState) {
        updateStats(gameState);
    }
    
    return {
        init: init,
        handleStateChange: handleStateChange,
        handleScoreChange: handleScoreChange,
        updateStats: updateStats
    };
})();
