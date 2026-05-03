import { puzzleGame } from './modules/game.js';
import { renderer } from './modules/renderer.js';
import { storage } from './modules/storage.js';
import { imageManager } from './modules/imageManager.js';

class App {
    constructor() {
        this.elements = {};
        this.autoSaveTimer = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        this.cacheElements();
        this.setupEventListeners();
        
        renderer.init('gameCanvas', 'previewCanvas', puzzleGame, imageManager);
        
        const savedState = storage.loadGameState();
        
        if (savedState && savedState.theme && savedState.isShuffled) {
            await imageManager.loadThemeImage(savedState.theme);
            puzzleGame.loadState(savedState);
            this.updateUIButtonStates(savedState);
            this.updateUI();
            this.render();
            this.setupGameListeners();
        } else {
            await imageManager.init('cat');
            puzzleGame.init(4, 'cat');
            this.updateUI();
            this.render();
            this.setupGameListeners();
            
            setTimeout(() => {
                puzzleGame.shuffle();
            }, 500);
        }
        
        this.startAutoSave();
        this.isInitialized = true;
    }

    cacheElements() {
        this.elements = {
            movesEl: document.getElementById('moves'),
            timerEl: document.getElementById('timer'),
            bestEl: document.getElementById('best'),
            victoryOverlay: document.getElementById('victoryOverlay'),
            finalMovesEl: document.getElementById('finalMoves'),
            finalTimeEl: document.getElementById('finalTime'),
            newRecordEl: document.getElementById('newRecord'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            difficultyBtns: document.querySelectorAll('.difficulty-btn'),
            themeBtns: document.querySelectorAll('.theme-btn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            resetBtn: document.getElementById('resetBtn'),
            hintBtn: document.getElementById('hintBtn'),
            uploadBtn: document.getElementById('uploadBtn'),
            imageUpload: document.getElementById('imageUpload'),
            randomBtn: document.getElementById('randomBtn')
        };
    }

    setupEventListeners() {
        this.elements.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleDifficultyChange(btn));
        });
        
        this.elements.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleThemeChange(btn));
        });
        
        this.elements.shuffleBtn.addEventListener('click', () => this.handleShuffle());
        this.elements.resetBtn.addEventListener('click', () => this.handleReset());
        this.elements.hintBtn.addEventListener('click', () => this.handleHint());
        
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.imageUpload.click();
        });
        
        this.elements.imageUpload.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });
        
        this.elements.randomBtn.addEventListener('click', () => this.handleRandomImage());
        
        this.elements.playAgainBtn.addEventListener('click', () => this.handlePlayAgain());
        
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }

    setupGameListeners() {
        puzzleGame.on('move', () => {
            this.updateMovesUI();
            this.render();
            this.saveGameState();
        });
        
        puzzleGame.on('timer', () => {
            this.updateTimerUI();
        });
        
        puzzleGame.on('win', (data) => {
            this.handleWin(data);
        });
        
        puzzleGame.on('reset', () => {
            this.updateUI();
            this.render();
            this.saveGameState();
        });
    }

    async handleDifficultyChange(btn) {
        const size = parseInt(btn.dataset.size);
        const difficulty = btn.dataset.difficulty;
        
        this.elements.difficultyBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.elements.victoryOverlay.classList.add('hidden');
        
        puzzleGame.init(size, imageManager.getCurrentTheme());
        
        this.updateUI();
        this.render();
        
        setTimeout(() => {
            puzzleGame.shuffle();
        }, 300);
    }

    async handleThemeChange(btn) {
        const theme = btn.dataset.theme;
        
        this.elements.themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.elements.victoryOverlay.classList.add('hidden');
        
        await imageManager.loadThemeImage(theme);
        
        this.updateBestRecordUI();
        this.render();
        renderer.renderPreview();
    }

    handleShuffle() {
        this.elements.victoryOverlay.classList.add('hidden');
        puzzleGame.shuffle();
    }

    handleReset() {
        this.elements.victoryOverlay.classList.add('hidden');
        puzzleGame.reset();
        this.updateUI();
        this.render();
        
        setTimeout(() => {
            puzzleGame.shuffle();
        }, 300);
    }

    handleHint() {
        const isActive = puzzleGame.toggleHint();
        this.elements.hintBtn.classList.toggle('active', isActive);
        this.render();
    }

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            await imageManager.loadImageFromFile(file);
            
            this.elements.victoryOverlay.classList.add('hidden');
            
            puzzleGame.reset();
            this.updateUI();
            this.render();
            renderer.renderPreview();
            
            setTimeout(() => {
                puzzleGame.shuffle();
            }, 300);
        } catch (error) {
            console.error('Failed to load image:', error);
            alert('图片加载失败，请尝试其他图片');
        }
        
        e.target.value = '';
    }

    async handleRandomImage() {
        this.elements.themeBtns.forEach(b => b.classList.remove('active'));
        
        await imageManager.loadRandomImage();
        
        this.elements.victoryOverlay.classList.add('hidden');
        
        puzzleGame.reset();
        this.updateUI();
        this.render();
        renderer.renderPreview();
        
        setTimeout(() => {
            puzzleGame.shuffle();
        }, 300);
    }

    handleWin(data) {
        const isNewRecord = storage.updateBestRecord(
            puzzleGame.size,
            data.moves,
            data.time
        );
        
        this.elements.finalMovesEl.textContent = data.moves;
        this.elements.finalTimeEl.textContent = puzzleGame.formatTime(data.time);
        
        this.elements.newRecordEl.classList.toggle('hidden', !isNewRecord);
        this.elements.victoryOverlay.classList.remove('hidden');
        
        this.updateBestRecordUI();
        this.saveGameState();
    }

    handlePlayAgain() {
        this.elements.victoryOverlay.classList.add('hidden');
        puzzleGame.shuffle();
    }

    updateUIButtonStates(state) {
        this.elements.difficultyBtns.forEach(btn => {
            const size = parseInt(btn.dataset.size);
            btn.classList.toggle('active', size === state.size);
        });
        
        if (state.theme) {
            this.elements.themeBtns.forEach(btn => {
                const theme = btn.dataset.theme;
                btn.classList.toggle('active', theme === state.theme);
            });
        }
        
        if (state.hintMode !== undefined) {
            this.elements.hintBtn.classList.toggle('active', state.hintMode);
        }
    }

    updateUI() {
        this.updateMovesUI();
        this.updateTimerUI();
        this.updateBestRecordUI();
        renderer.renderPreview();
    }

    updateMovesUI() {
        if (this.elements.movesEl) {
            this.elements.movesEl.textContent = puzzleGame.moves;
        }
    }

    updateTimerUI() {
        if (this.elements.timerEl) {
            this.elements.timerEl.textContent = puzzleGame.formatTime(puzzleGame.elapsedTime);
        }
    }

    updateBestRecordUI() {
        const best = storage.getBestRecord(puzzleGame.size);
        
        if (this.elements.bestEl) {
            if (best.moves === Infinity || best.time === Infinity) {
                this.elements.bestEl.textContent = '--';
            } else {
                this.elements.bestEl.textContent = `${best.moves}步/${puzzleGame.formatTime(best.time)}`;
            }
        }
    }

    render() {
        renderer.render();
    }

    saveGameState() {
        const state = puzzleGame.getState();
        storage.saveGameState(state);
    }

    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.saveGameState();
        }, 5000);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

export default app;
