import { CHARACTERS } from './config.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        
        this.mainMenu = document.getElementById('main-menu');
        this.charSelect = document.getElementById('char-select');
        this.pauseMenu = document.getElementById('pause-menu');
        this.gameResult = document.getElementById('game-result');
        this.gameHud = document.getElementById('game-hud');
        this.controlsHint = document.getElementById('controls-hint');
        
        this.player1Health = document.getElementById('player1-health');
        this.player2Health = document.getElementById('player2-health');
        this.player1Name = document.getElementById('player1-name');
        this.player2Name = document.getElementById('player2-name');
        
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        
        this.selectedChar = 'yellow';
        this.initEventListeners();
    }

    safeAddClickListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', callback);
            console.log(`✅ 已绑定点击事件: ${id}`);
        } else {
            console.error(`❌ 找不到元素: #${id}`);
        }
    }

    initEventListeners() {
        console.log('🎮 初始化UI事件监听器...');
        
        this.safeAddClickListener('start-btn', () => {
            console.log('点击了开始游戏按钮');
            this.game.startGame(this.selectedChar);
        });
        
        this.safeAddClickListener('select-char-btn', () => {
            console.log('点击了选择角色按钮');
            this.showCharSelect();
        });
        
        this.safeAddClickListener('back-to-menu', () => {
            this.showMainMenu();
        });
        
        const charCards = document.querySelectorAll('.char-card');
        console.log(`找到 ${charCards.length} 个角色卡片`);
        charCards.forEach(card => {
            card.addEventListener('click', () => {
                console.log('选择了角色:', card.dataset.char);
                this.selectedChar = card.dataset.char;
                this.updateCharSelection();
            });
        });
        
        this.safeAddClickListener('pause-btn', () => {
            this.game.pauseGame();
        });
        
        this.safeAddClickListener('resume-btn', () => {
            this.game.resumeGame();
        });
        
        this.safeAddClickListener('restart-btn', () => {
            this.game.restartGame();
        });
        
        this.safeAddClickListener('quit-btn', () => {
            this.game.quitToMenu();
        });
        
        this.safeAddClickListener('result-restart', () => {
            this.game.restartGame();
        });
        
        this.safeAddClickListener('result-menu', () => {
            this.game.quitToMenu();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.game.gameState === 'playing') {
                this.game.pauseGame();
            } else if (e.code === 'Escape' && this.game.gameState === 'paused') {
                this.game.resumeGame();
            }
        });
        
        this.updateCharSelection();
        console.log('✅ UI事件监听器初始化完成');
    }

    showMainMenu() {
        this.hideAll();
        this.mainMenu.classList.remove('hidden');
    }

    showCharSelect() {
        this.hideAll();
        this.charSelect.classList.remove('hidden');
    }

    showPauseMenu() {
        this.pauseMenu.classList.remove('hidden');
    }

    hidePauseMenu() {
        this.pauseMenu.classList.add('hidden');
    }

    showHud() {
        this.gameHud.classList.remove('hidden');
        this.controlsHint.classList.remove('hidden');
    }

    hideHud() {
        this.gameHud.classList.add('hidden');
        this.controlsHint.classList.add('hidden');
    }

    showResult(playerWon) {
        this.hideAll();
        this.gameResult.classList.remove('hidden');
        
        if (playerWon) {
            this.resultTitle.textContent = '🎉 胜利！ 🎉';
            this.resultMessage.textContent = '你打败了对手，成为了农场最强菜鸡！';
        } else {
            this.resultTitle.textContent = '😢 失败 😢';
            this.resultMessage.textContent = '被打败了... 下次再来挑战吧！';
        }
    }

    hideAll() {
        this.mainMenu.classList.add('hidden');
        this.charSelect.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
        this.gameResult.classList.add('hidden');
        this.hideHud();
    }

    updateCharSelection() {
        document.querySelectorAll('.char-card').forEach(card => {
            if (card.dataset.char === this.selectedChar) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    updateHealthBars(player1, player2) {
        const p1Percent = (player1.health / player1.maxHealth) * 100;
        const p2Percent = (player2.health / player2.maxHealth) * 100;
        
        this.player1Health.style.width = `${p1Percent}%`;
        this.player2Health.style.width = `${p2Percent}%`;
        
        this.updateHealthColor(this.player1Health, p1Percent);
        this.updateHealthColor(this.player2Health, p2Percent);
        
        this.player1Name.textContent = player1.name;
        this.player2Name.textContent = player2.name;
    }

    updateHealthColor(element, percent) {
        if (percent > 60) {
            element.style.background = 'linear-gradient(90deg, #32CD32, #7CFC00)';
        } else if (percent > 30) {
            element.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
        } else {
            element.style.background = 'linear-gradient(90deg, #FF6B6B, #FF4500)';
        }
    }
}