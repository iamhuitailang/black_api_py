import { GAME_CONFIG } from './config.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.elements.startScreen = document.getElementById('start-screen');
        this.elements.pauseScreen = document.getElementById('pause-screen');
        this.elements.resultScreen = document.getElementById('result-screen');
        this.elements.hud = document.getElementById('hud');
        
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.continueBtn = document.getElementById('continue-btn');
        this.elements.resumeBtn = document.getElementById('resume-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
        this.elements.quitBtn = document.getElementById('quit-btn');
        this.elements.playAgainBtn = document.getElementById('play-again-btn');
        this.elements.backMenuBtn = document.getElementById('back-menu-btn');
        this.elements.pauseBtn = document.getElementById('pause-btn');
        
        this.elements.playerName = document.getElementById('player-name');
        this.elements.playerHp = document.getElementById('player-hp');
        this.elements.playerHpText = document.getElementById('player-hp-text');
        this.elements.playerEnergy = document.getElementById('player-energy');
        
        this.elements.enemyName = document.getElementById('enemy-name');
        this.elements.enemyHp = document.getElementById('enemy-hp');
        this.elements.enemyHpText = document.getElementById('enemy-hp-text');
        this.elements.enemyEnergy = document.getElementById('enemy-energy');
        
        this.elements.resultTitle = document.getElementById('result-title');
        this.elements.resultText = document.getElementById('result-text');
        this.elements.roundText = document.getElementById('round-text');
        
        this.elements.characterCards = document.querySelectorAll('.character-card');
    }

    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.game.startGame());
        this.elements.continueBtn.addEventListener('click', () => this.game.continueGame());
        this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.quitBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.playAgainBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.backMenuBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.pauseBtn.addEventListener('click', () => this.game.togglePause());
        
        this.elements.characterCards.forEach(card => {
            card.addEventListener('click', () => {
                const charId = card.dataset.character;
                this.game.selectCharacter(charId);
                this.updateCharacterSelection(charId);
            });
        });
    }

    updateCharacterSelection(charId) {
        this.elements.characterCards.forEach(card => {
            card.classList.toggle('selected', card.dataset.character === charId);
        });
    }

    showStartScreen(hasSave) {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.resultScreen.classList.add('hidden');
        this.elements.hud.classList.add('hidden');
        
        if (hasSave) {
            this.elements.continueBtn.style.display = 'block';
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    }

    showPauseScreen() {
        this.elements.pauseScreen.classList.remove('hidden');
    }

    hidePauseScreen() {
        this.elements.pauseScreen.classList.add('hidden');
    }

    showResultScreen(playerWon) {
        this.elements.resultScreen.classList.remove('hidden');
        if (playerWon) {
            this.elements.resultTitle.textContent = '胜利！';
            this.elements.resultText.textContent = '恭喜你击败了对手！';
        } else {
            this.elements.resultTitle.textContent = '失败';
            this.elements.resultText.textContent = '你被对手击败了，再接再厉！';
        }
    }

    hideAllScreens() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.resultScreen.classList.add('hidden');
    }

    showHUD() {
        this.elements.hud.classList.remove('hidden');
    }

    hideHUD() {
        this.elements.hud.classList.add('hidden');
    }

    updateHUD(player, enemy, round, playerWins, enemyWins) {
        if (player) {
            this.elements.playerName.textContent = player.name;
            const playerHpPercent = (player.hp / player.maxHp) * 100;
            this.elements.playerHp.style.width = playerHpPercent + '%';
            this.elements.playerHpText.textContent = `${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`;
            this.elements.playerEnergy.style.width = (player.energy / player.maxEnergy) * 100 + '%';
        }
        
        if (enemy) {
            this.elements.enemyName.textContent = enemy.name;
            const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;
            this.elements.enemyHp.style.width = enemyHpPercent + '%';
            this.elements.enemyHpText.textContent = `${Math.max(0, Math.floor(enemy.hp))}/${enemy.maxHp}`;
            this.elements.enemyEnergy.style.width = (enemy.energy / enemy.maxEnergy) * 100 + '%';
        }
        
        this.elements.roundText.textContent = `第 ${round} 局 (${playerWins}:${enemyWins})`;
    }

    updateRound(round, playerWins, enemyWins) {
        this.elements.roundText.textContent = `第 ${round} 局 (${playerWins}:${enemyWins})`;
    }
}
