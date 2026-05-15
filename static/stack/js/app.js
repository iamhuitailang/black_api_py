import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { GAME_STATES } from './config.js';
import { storageManager } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const renderer = new Renderer(canvas);
    
    const game = new Game();
    
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    const stackHeightEl = document.getElementById('stack-height');
    const finalScoreEl = document.getElementById('final-score');
    const finalHeightEl = document.getElementById('final-height');
    const finalLevelEl = document.getElementById('final-level');
    
    const startScreen = document.getElementById('start-screen');
    const pauseScreen = document.getElementById('pause-screen');
    const gameoverScreen = document.getElementById('gameover-screen');
    const flashEffect = document.getElementById('flash-effect');
    
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');
    const quitBtn = document.getElementById('quit-btn');
    const retryBtn = document.getElementById('retry-btn');
    const homeBtn = document.getElementById('home-btn');
    
    function updateUI() {
        const state = game.getState();
        scoreEl.textContent = state.score;
        levelEl.textContent = state.level;
        stackHeightEl.textContent = state.stackHeight;
        finalScoreEl.textContent = state.score;
        finalHeightEl.textContent = state.maxHeight;
        finalLevelEl.textContent = state.level;
    }
    
    function showScreen(screen) {
        startScreen.classList.remove('active');
        pauseScreen.classList.remove('active');
        gameoverScreen.classList.remove('active');
        
        if (screen) {
            screen.classList.add('active');
        }
    }
    
    function triggerFlash(type) {
        flashEffect.className = 'flash';
        void flashEffect.offsetWidth;
        flashEffect.classList.add(type);
        
        setTimeout(() => {
            flashEffect.className = 'flash';
        }, 300);
    }
    
    game.onFlash = triggerFlash;
    game.onStateChange = (newState) => {
        switch (newState) {
            case GAME_STATES.PLAYING:
                showScreen(null);
                break;
            case GAME_STATES.PAUSED:
                showScreen(pauseScreen);
                break;
            case GAME_STATES.GAMEOVER:
                updateUI();
                showScreen(gameoverScreen);
                break;
        }
    };
    
    function gameLoop(currentTime) {
        game.update(currentTime);
        renderer.render(game);
        updateUI();
        requestAnimationFrame(gameLoop);
    }
    
    function handleDrop() {
        game.dropBox();
    }
    
    startBtn.addEventListener('click', () => {
        game.start();
    });
    
    pauseBtn.addEventListener('click', () => {
        game.pause();
    });
    
    resumeBtn.addEventListener('click', () => {
        game.resume();
    });
    
    restartBtn.addEventListener('click', () => {
        game.reset();
        game.gameState = GAME_STATES.PLAYING;
        game.saveState();
        showScreen(null);
        game.lastTime = 0;
    });
    
    quitBtn.addEventListener('click', () => {
        game.gameState = GAME_STATES.MENU;
        storageManager.clear();
        showScreen(startScreen);
    });
    
    retryBtn.addEventListener('click', () => {
        game.reset();
        game.gameState = GAME_STATES.PLAYING;
        game.saveState();
        game.lastTime = 0;
        showScreen(null);
        updateUI();
    });
    
    homeBtn.addEventListener('click', () => {
        game.gameState = GAME_STATES.MENU;
        storageManager.clear();
        showScreen(startScreen);
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleDrop();
        }
        if (e.code === 'Escape') {
            if (game.gameState === GAME_STATES.PLAYING) {
                game.pause();
            } else if (game.gameState === GAME_STATES.PAUSED) {
                game.resume();
            }
        }
    });
    
    canvas.addEventListener('click', handleDrop);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDrop();
    });
    
    window.addEventListener('resize', () => {
        renderer.resize();
    });
    
    game.init();
    renderer.resize();
    updateUI();
    
    if (game.gameState === GAME_STATES.PLAYING) {
        showScreen(null);
    } else {
        showScreen(startScreen);
    }
    
    requestAnimationFrame(gameLoop);
});