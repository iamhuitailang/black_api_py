var App = (function() {
    'use strict';

    var elements = {};
    var gameState = null;
    var isAnimating = false;
    var animationFrameId = null;
    var hasWon = false;

    function init() {
        cacheElements();
        initModules();
        bindEvents();
        loadTheme();
        checkSavedGame();
        updateUI();
    }

    function cacheElements() {
        elements = {
            canvas: Utils.$('#game-canvas'),
            floatScores: Utils.$('#float-scores'),
            currentScore: Utils.$('#current-score'),
            bestScore: Utils.$('#best-score'),
            highScoreList: Utils.$('#high-score-list'),
            gameStatus: Utils.$('#game-status'),
            themeBtn: Utils.$('#theme-btn'),
            soundBtn: Utils.$('#sound-btn'),
            volumeSlider: Utils.$('#volume-slider'),
            undoBtn: Utils.$('#undo-btn'),
            newGameBtn: Utils.$('#new-game-btn'),
            startBtn: Utils.$('#start-btn'),
            pauseBtn: Utils.$('#pause-btn'),
            resumeBtn: Utils.$('#resume-btn'),
            restartBtn: Utils.$('#restart-btn'),
            retryBtn: Utils.$('#retry-btn'),
            continueBtn: Utils.$('#continue-btn'),
            newGameWinBtn: Utils.$('#new-game-win-btn'),
            startOverlay: Utils.$('#start-overlay'),
            gameOverOverlay: Utils.$('#game-over-overlay'),
            winOverlay: Utils.$('#win-overlay'),
            pauseOverlay: Utils.$('#pause-overlay'),
            finalScore: Utils.$('#final-score')
        };
    }

    function initModules() {
        Audio.init();
        Renderer.init(elements.canvas, elements.floatScores);
        GameCore.init();
        Animator.init();
        
        Input.init(elements.canvas.parentElement, function(direction) {
            handleMove(direction);
        });
    }

    function bindEvents() {
        elements.themeBtn.addEventListener('click', function() {
            toggleTheme();
            Audio.playThemeChange();
        });
        
        elements.soundBtn.addEventListener('click', function() {
            toggleSound();
            Audio.playButtonClick();
        });
        
        elements.volumeSlider.addEventListener('input', function(e) {
            var volume = e.target.value / 100;
            Audio.setVolume(volume);
        });
        
        elements.undoBtn.addEventListener('click', function() {
            handleUndo();
            Audio.playButtonClick();
        });
        
        elements.newGameBtn.addEventListener('click', function() {
            startNewGame();
            Audio.playButtonClick();
        });
        
        elements.startBtn.addEventListener('click', function() {
            startGame();
            Audio.playButtonClick();
            Audio.resume();
        });
        
        elements.pauseBtn.addEventListener('click', function() {
            pauseGame();
            Audio.playButtonClick();
        });
        
        elements.resumeBtn.addEventListener('click', function() {
            resumeGame();
            Audio.playButtonClick();
        });
        
        elements.restartBtn.addEventListener('click', function() {
            startNewGame();
            Audio.playButtonClick();
        });
        
        elements.retryBtn.addEventListener('click', function() {
            startNewGame();
            Audio.playButtonClick();
        });
        
        elements.continueBtn.addEventListener('click', function() {
            continueGame();
            Audio.playButtonClick();
        });
        
        elements.newGameWinBtn.addEventListener('click', function() {
            startNewGame();
            Audio.playButtonClick();
        });

        window.addEventListener('beforeunload', function() {
            if (gameState && !gameState.gameOver) {
                GameCore.saveCurrentState();
            }
        });

        window.addEventListener('pagehide', function() {
            if (gameState && !gameState.gameOver) {
                GameCore.saveCurrentState();
            }
        });
    }

    function loadTheme() {
        var savedTheme = Storage.getTheme();
        setTheme(savedTheme);
        loadSoundSettings();
    }

    function loadSoundSettings() {
        var savedVolume = Audio.getVolume();
        if (elements.volumeSlider) {
            elements.volumeSlider.value = savedVolume * 100;
        }
        updateSoundButton();
    }

    function toggleSound() {
        var isMuted = Audio.toggleMute();
        updateSoundButton();
    }

    function updateSoundButton() {
        var soundIcon = elements.soundBtn.querySelector('.sound-icon');
        if (soundIcon) {
            soundIcon.textContent = Audio.isMuted() ? '🔇' : '🔊';
        }
    }

    function toggleTheme() {
        var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        var newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        Storage.setTheme(newTheme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Renderer.setTheme(theme);
        
        var themeIcon = elements.themeBtn.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        if (gameState) {
            render();
        }
    }

    function checkSavedGame() {
        var saved = GameCore.loadSavedState();
        if (saved && !Storage.isGridEmpty(saved.grid)) {
            gameState = saved;
            GameCore.setState(saved);
            hideOverlay(elements.startOverlay);
            
            if (gameState.isPaused) {
                showOverlay(elements.pauseOverlay);
                updateGameStatus('已暂停');
            } else if (gameState.gameOver) {
                showOverlay(elements.gameOverOverlay);
                elements.finalScore.textContent = gameState.score;
                updateGameStatus('游戏结束');
            } else {
                updateGameStatus('进行中');
            }
            
            hasWon = gameState.isWin;
            render();
            updateUI();
        } else {
            showOverlay(elements.startOverlay);
            updateGameStatus('未开始');
        }
    }

    function startGame() {
        hideAllOverlays();
        gameState = GameCore.reset();
        hasWon = false;
        Input.enable();
        updateGameStatus('进行中');
        updateUI();
        render();
        GameCore.saveCurrentState();
        Utils.showToast('游戏开始！使用方向键或滑动屏幕', 'info');
    }

    function startNewGame() {
        hideAllOverlays();
        gameState = GameCore.reset();
        hasWon = false;
        Input.enable();
        updateGameStatus('进行中');
        updateUI();
        render();
        GameCore.saveCurrentState();
        Utils.showToast('新游戏开始！', 'info');
    }

    function pauseGame() {
        if (!gameState || gameState.gameOver || gameState.isPaused) return;
        
        if (GameCore.pause()) {
            gameState = GameCore.getState();
            showOverlay(elements.pauseOverlay);
            Input.disable();
            updateGameStatus('已暂停');
            Utils.showToast('游戏已暂停', 'info');
        }
    }

    function resumeGame() {
        if (!gameState || !gameState.isPaused) return;
        
        if (GameCore.resume()) {
            gameState = GameCore.getState();
            hideOverlay(elements.pauseOverlay);
            Input.enable();
            updateGameStatus('进行中');
            Utils.showToast('游戏继续', 'info');
        }
    }

    function continueGame() {
        hideOverlay(elements.winOverlay);
        Input.enable();
        updateGameStatus('进行中');
        Utils.showToast('继续挑战更高分数！', 'info');
    }

    function handleMove(direction) {
        if (!gameState || gameState.isPaused || gameState.gameOver || isAnimating) return;
        if (Animator.isAnimating()) return;

        var moveResult = GameCore.move(direction);
        
        if (moveResult.moved) {
            isAnimating = true;
            Input.disable();
            
            Audio.playMove();
            
            if (moveResult.mergeScores && moveResult.mergeScores.length > 0) {
                moveResult.mergeScores.forEach(function(score) {
                    Renderer.showFloatScore(score.row, score.col, score.value);
                    Audio.playMerge(score.value);
                });
            }
            
            Animator.prepareAnimations(moveResult);
            
            if (moveResult.newTile) {
                Audio.playNewTile();
            }
            
            gameState = moveResult.state;
            updateUI();
            
            startAnimationLoop(moveResult);
        }
    }

    function startAnimationLoop(moveResult) {
        function animate(timestamp) {
            Renderer.renderWithAnimation(gameState.grid, timestamp);
            
            if (Animator.isAnimating()) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                isAnimating = false;
                Input.enable();
                render();
                GameCore.saveCurrentState();
                
                checkGameResult(moveResult);
            }
        }
        
        Animator.start(function() {
            isAnimating = false;
        });
        
        animationFrameId = requestAnimationFrame(animate);
    }

    function checkGameResult(moveResult) {
        if (moveResult.isWin && !hasWon) {
            hasWon = true;
            showOverlay(elements.winOverlay);
            Input.disable();
            Audio.playWin();
            Utils.showToast('🎉 恭喜你合成了2048！', 'success');
        }
        
        if (moveResult.gameOver) {
            showOverlay(elements.gameOverOverlay);
            elements.finalScore.textContent = gameState.score;
            Input.disable();
            updateGameStatus('游戏结束');
            Audio.playGameOver();
            Utils.showToast('游戏结束！最终得分: ' + gameState.score, 'warning');
        }
    }

    function handleUndo() {
        if (!gameState || gameState.gameOver || isAnimating) return;
        if (!GameCore.canUndo()) {
            Utils.showToast('没有可撤销的操作', 'warning');
            return;
        }
        
        var previousState = GameCore.undo();
        if (previousState) {
            gameState = previousState;
            updateUI();
            render();
            GameCore.saveCurrentState();
            Audio.playUndo();
            Utils.showToast('已撤销上一步', 'info');
        }
    }

    function showOverlay(overlay) {
        if (overlay) {
            Utils.removeClass(overlay, 'hidden');
        }
    }

    function hideOverlay(overlay) {
        if (overlay) {
            Utils.addClass(overlay, 'hidden');
        }
    }

    function hideAllOverlays() {
        hideOverlay(elements.startOverlay);
        hideOverlay(elements.gameOverOverlay);
        hideOverlay(elements.winOverlay);
        hideOverlay(elements.pauseOverlay);
    }

    function updateUI() {
        if (!gameState) {
            elements.currentScore.textContent = '0';
            elements.bestScore.textContent = Storage.getBestScore().toString();
            elements.highScoreList.textContent = Storage.getBestScore().toString();
            updateUndoButton();
            return;
        }
        
        elements.currentScore.textContent = gameState.score.toString();
        elements.bestScore.textContent = gameState.bestScore.toString();
        elements.highScoreList.textContent = gameState.bestScore.toString();
        
        updateUndoButton();
    }

    function updateUndoButton() {
        var canUndo = GameCore.canUndo();
        elements.undoBtn.disabled = !canUndo;
        elements.undoBtn.style.opacity = canUndo ? '1' : '0.5';
    }

    function updateGameStatus(status) {
        if (elements.gameStatus) {
            elements.gameStatus.textContent = status;
            
            switch (status) {
                case '进行中':
                    elements.gameStatus.style.color = '#00c853';
                    break;
                case '已暂停':
                    elements.gameStatus.style.color = '#ffab00';
                    break;
                case '游戏结束':
                    elements.gameStatus.style.color = '#ff5252';
                    break;
                default:
                    elements.gameStatus.style.color = 'inherit';
            }
        }
    }

    function render() {
        if (gameState && gameState.grid) {
            Renderer.render(gameState.grid);
        }
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
