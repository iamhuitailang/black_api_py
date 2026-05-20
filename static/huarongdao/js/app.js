import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { Controller } from './controller.js';
import { Storage } from './storage.js';
import { GAME_STATE, LAYOUTS } from './data.js';

class App {
    constructor() {
        this.game = new Game();
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.controller = new Controller(this.game, this.renderer, this.onStateChange.bind(this));
        this.lastTime = 0;
        this.animationId = null;

        this.elements = {
            layoutSelect: document.getElementById('layoutSelect'),
            stepCount: document.getElementById('stepCount'),
            timer: document.getElementById('timer'),
            bestRecord: document.getElementById('bestRecord'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            undoBtn: document.getElementById('undoBtn'),
            resetBtn: document.getElementById('resetBtn'),
            pauseModal: document.getElementById('pauseModal'),
            winModal: document.getElementById('winModal'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            exitBtn: document.getElementById('exitBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            closeWinBtn: document.getElementById('closeWinBtn'),
            finalSteps: document.getElementById('finalSteps'),
            finalTime: document.getElementById('finalTime'),
            newRecord: document.getElementById('newRecord'),
            directionBtns: document.querySelectorAll('.direction-btn')
        };

        this.init();
    }

    init() {
        const savedState = Storage.loadGameState();
        if (savedState && savedState.state !== GAME_STATE.WON) {
            this.game.loadState(savedState);
        } else {
            this.game.init(this.elements.layoutSelect.value);
        }

        this.elements.layoutSelect.value = this.game.currentLayout;

        this.controller.setupEventListeners(this.canvas);
        this.bindEvents();
        this.updateUI();
        this.updateBestRecord();
        this.renderer.render(this.game);

        if (this.game.state === GAME_STATE.PLAYING || this.game.state === GAME_STATE.PAUSED) {
            this.startGameLoop();
        }

        if (this.game.state === GAME_STATE.PAUSED) {
            this.showPauseModal();
        }
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.restartFromModal());
        this.elements.exitBtn.addEventListener('click', () => this.exitGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.elements.closeWinBtn.addEventListener('click', () => this.closeWinModal());
        this.elements.layoutSelect.addEventListener('change', () => this.changeLayout());

        this.elements.directionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.dir;
                this.controller.handleDirectionButton(direction);
            });
        });

        window.addEventListener('beforeunload', () => this.saveState());
    }

    startGame() {
        if (this.game.state === GAME_STATE.IDLE) {
            this.game.start();
            this.startGameLoop();
            this.updateUI();
            this.saveState();
        }
    }

    pauseGame() {
        if (this.game.isPlaying()) {
            this.game.pause();
            this.showPauseModal();
            this.updateUI();
            this.saveState();
        }
    }

    resumeGame() {
        if (this.game.state === GAME_STATE.PAUSED) {
            this.game.resume();
            this.hidePauseModal();
            this.updateUI();
            this.saveState();
        }
    }

    undo() {
        if (this.game.undo()) {
            this.updateUI();
            this.renderer.render(this.game);
            this.saveState();
        }
    }

    resetGame() {
        this.stopGameLoop();
        this.game.reset();
        this.updateUI();
        this.renderer.render(this.game);
        Storage.clearGameState();
    }

    restartFromModal() {
        this.hidePauseModal();
        this.stopGameLoop();
        this.game.reset();
        this.game.start();
        this.startGameLoop();
        this.updateUI();
        this.saveState();
    }

    exitGame() {
        this.hidePauseModal();
        this.stopGameLoop();
        this.game.reset();
        this.updateUI();
        this.renderer.render(this.game);
        Storage.clearGameState();
    }

    playAgain() {
        this.hideWinModal();
        this.stopGameLoop();
        this.game.reset();
        this.game.start();
        this.startGameLoop();
        this.updateUI();
        this.saveState();
    }

    closeWinModal() {
        this.hideWinModal();
        this.stopGameLoop();
        this.game.reset();
        this.updateUI();
        this.renderer.render(this.game);
        Storage.clearGameState();
    }

    changeLayout() {
        const layoutId = this.elements.layoutSelect.value;
        this.stopGameLoop();
        this.game.init(layoutId);
        this.updateUI();
        this.updateBestRecord();
        this.renderer.render(this.game);
        Storage.clearGameState();
    }

    showPauseModal() {
        this.elements.pauseModal.classList.remove('hidden');
    }

    hidePauseModal() {
        this.elements.pauseModal.classList.add('hidden');
    }

    showWinModal(isNewRecord) {
        this.elements.finalSteps.textContent = this.game.steps;
        this.elements.finalTime.textContent = this.game.getFormattedTime();
        this.elements.newRecord.classList.toggle('hidden', !isNewRecord);
        this.elements.winModal.classList.remove('hidden');
    }

    hideWinModal() {
        this.elements.winModal.classList.add('hidden');
    }

    startGameLoop() {
        if (this.animationId) return;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    gameLoop(currentTime = performance.now()) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.game.updateTime(deltaTime);
        this.elements.timer.textContent = this.game.getFormattedTime();

        if (this.game.state === GAME_STATE.WON) {
            this.handleWin();
            return;
        }

        this.animationId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    handleWin() {
        this.stopGameLoop();

        const record = {
            steps: this.game.steps,
            time: this.game.elapsedTime,
            date: new Date().toISOString()
        };

        const isNewRecord = Storage.saveRecord(this.game.currentLayout, record);
        this.updateBestRecord();

        Storage.clearGameState();
        this.showWinModal(isNewRecord);
    }

    onStateChange() {
        this.updateUI();
        this.renderer.render(this.game);
        this.saveState();
    }

    updateUI() {
        this.elements.stepCount.textContent = this.game.steps;
        this.elements.timer.textContent = this.game.getFormattedTime();

        const isPlaying = this.game.isPlaying();
        const isPaused = this.game.state === GAME_STATE.PAUSED;
        const isIdle = this.game.state === GAME_STATE.IDLE;

        this.elements.startBtn.disabled = !isIdle;
        this.elements.pauseBtn.disabled = !isPlaying && !isPaused;
        this.elements.pauseBtn.textContent = isPaused ? '继续' : '暂停';
        this.elements.undoBtn.disabled = !this.game.canUndo();
        this.elements.layoutSelect.disabled = !isIdle;

        if (isPaused) {
            this.elements.pauseBtn.textContent = '继续';
        } else {
            this.elements.pauseBtn.textContent = '暂停';
        }
    }

    updateBestRecord() {
        const record = Storage.getRecord(this.game.currentLayout);
        if (record) {
            const minutes = Math.floor(record.time / 60);
            const seconds = Math.floor(record.time % 60);
            const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            this.elements.bestRecord.textContent = `${record.steps}步 / ${timeStr}`;
        } else {
            this.elements.bestRecord.textContent = '-';
        }
    }

    saveState() {
        if (this.game.state !== GAME_STATE.WON) {
            Storage.saveGameState(this.game.getState());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
