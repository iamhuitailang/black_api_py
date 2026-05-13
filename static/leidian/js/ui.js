const UI = (() => {
    let startScreen, pauseScreen, gameOverScreen, victoryScreen, hud;
    let startBtn, resumeBtn, restartBtn, quitBtn, retryBtn, homeBtn;
    let victoryRetryBtn, victoryHomeBtn;
    let pauseBtn, scoreEl, levelEl, waveEl, livesEl, finalScoreEl, victoryScoreEl;
    
    const init = () => {
        startScreen = document.getElementById('start-screen');
        pauseScreen = document.getElementById('pause-screen');
        gameOverScreen = document.getElementById('gameover-screen');
        victoryScreen = document.getElementById('victory-screen');
        hud = document.getElementById('hud');
        
        startBtn = document.getElementById('start-btn');
        resumeBtn = document.getElementById('resume-btn');
        restartBtn = document.getElementById('restart-btn');
        quitBtn = document.getElementById('quit-btn');
        retryBtn = document.getElementById('retry-btn');
        homeBtn = document.getElementById('home-btn');
        victoryRetryBtn = document.getElementById('victory-retry-btn');
        victoryHomeBtn = document.getElementById('victory-home-btn');
        
        pauseBtn = document.getElementById('pause-btn');
        scoreEl = document.getElementById('score');
        levelEl = document.getElementById('level');
        waveEl = document.getElementById('wave');
        livesEl = document.getElementById('lives');
        finalScoreEl = document.getElementById('final-score');
        victoryScoreEl = document.getElementById('victory-score');
    };
    
    const showScreen = (screen) => {
        [startScreen, pauseScreen, gameOverScreen, victoryScreen].forEach(s => {
            if (s) s.classList.add('hidden');
        });
        if (screen) screen.classList.remove('hidden');
    };
    
    const showStartScreen = () => {
        showScreen(startScreen);
        if (hud) hud.classList.add('hidden');
    };
    
    const showPauseScreen = () => {
        showScreen(pauseScreen);
    };
    
    const showGameOverScreen = (score) => {
        showScreen(gameOverScreen);
        if (hud) hud.classList.add('hidden');
        if (finalScoreEl) finalScoreEl.textContent = `得分: ${score}`;
    };
    
    const showVictoryScreen = (score) => {
        showScreen(victoryScreen);
        if (hud) hud.classList.add('hidden');
        if (victoryScoreEl) victoryScoreEl.textContent = `得分: ${score}`;
    };
    
    const showHUD = () => {
        showScreen(null);
        if (hud) hud.classList.remove('hidden');
    };
    
    const updateHUD = (score, level, wave, lives) => {
        if (scoreEl) scoreEl.textContent = score;
        if (levelEl) levelEl.textContent = level + 1;
        if (waveEl) waveEl.textContent = wave;
        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
    };
    
    const bindEvents = (callbacks) => {
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onStart) callbacks.onStart();
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onPause) callbacks.onPause();
            });
        }
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onResume) callbacks.onResume();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onRestart) callbacks.onRestart();
            });
        }
        
        if (quitBtn) {
            quitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onQuit) callbacks.onQuit();
            });
        }
        
        if (retryBtn) {
            retryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onRestart) callbacks.onRestart();
            });
        }
        
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onQuit) callbacks.onQuit();
            });
        }
        
        if (victoryRetryBtn) {
            victoryRetryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onRestart) callbacks.onRestart();
            });
        }
        
        if (victoryHomeBtn) {
            victoryHomeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (callbacks.onQuit) callbacks.onQuit();
            });
        }
    };
    
    return {
        init,
        showStartScreen,
        showPauseScreen,
        showGameOverScreen,
        showVictoryScreen,
        showHUD,
        updateHUD,
        bindEvents
    };
})();
