import { GAME_STATES, ITEM_CONFIG } from './config.js';
import { Storage } from './storage.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            finishScreen: document.getElementById('finishScreen'),
            hud: document.getElementById('hud'),
            
            startBtn: document.getElementById('startBtn'),
            resumeBtn: document.getElementById('resumeBtn'),
            restartBtn: document.getElementById('restartBtn'),
            quitBtn: document.getElementById('quitBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            playAgainBtn: document.getElementById('playAgainBtn'),
            backToMenuBtn: document.getElementById('backToMenuBtn'),
            
            hudRank: document.getElementById('hudRank'),
            hudSpeed: document.getElementById('hudSpeed'),
            hudProgress: document.getElementById('hudProgress'),
            hudTime: document.getElementById('hudTime'),
            balanceFill: document.getElementById('balanceFill'),
            itemSlot: document.getElementById('itemSlot'),
            
            finishTitle: document.getElementById('finishTitle'),
            finishStats: document.getElementById('finishStats'),
            
            riderCards: document.querySelectorAll('.rider-card')
        };
    }

    initEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.game.startGame());
        this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        this.elements.restartBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.quitBtn.addEventListener('click', () => this.game.quitToMenu());
        this.elements.pauseBtn.addEventListener('click', () => this.game.pauseGame());
        this.elements.playAgainBtn.addEventListener('click', () => this.game.restartGame());
        this.elements.backToMenuBtn.addEventListener('click', () => this.game.quitToMenu());
        
        this.elements.riderCards.forEach(card => {
            card.addEventListener('click', () => {
                this.elements.riderCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.game.selectedRider = card.dataset.rider;
            });
        });
    }

    showScreen(screenName) {
        this.elements.startScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.finishScreen.classList.add('hidden');
        this.elements.hud.classList.add('hidden');
        
        switch (screenName) {
            case GAME_STATES.MENU:
                this.elements.startScreen.classList.remove('hidden');
                break;
            case GAME_STATES.PLAYING:
                this.elements.hud.classList.remove('hidden');
                break;
            case GAME_STATES.PAUSED:
                this.elements.hud.classList.remove('hidden');
                this.elements.pauseScreen.classList.remove('hidden');
                break;
            case GAME_STATES.FINISHED:
                this.elements.hud.classList.remove('hidden');
                this.elements.finishScreen.classList.remove('hidden');
                break;
        }
    }

    updateHUD(player, allRiders, gameTime) {
        const rank = player.getRank(allRiders);
        this.elements.hudRank.textContent = rank;
        
        const speedKmh = Math.round(player.speed * 10);
        this.elements.hudSpeed.textContent = speedKmh;
        
        const progress = Math.min(100, Math.round(player.distance / this.game.track.length * 100));
        this.elements.hudProgress.textContent = progress + '%';
        
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        this.elements.hudTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const balancePercent = player.balance * 100;
        this.elements.balanceFill.style.width = balancePercent + '%';
        if (balancePercent < 30) {
            this.elements.balanceFill.classList.add('low');
        } else {
            this.elements.balanceFill.classList.remove('low');
        }
        
        if (player.heldItem) {
            const itemConfig = ITEM_CONFIG[player.heldItem.type];
            this.elements.itemSlot.textContent = itemConfig.icon;
            this.elements.itemSlot.title = itemConfig.name;
        } else {
            this.elements.itemSlot.textContent = '空';
            this.elements.itemSlot.title = '';
        }
    }

    showFinishScreen(player, allRiders, gameTime) {
        const rank = player.getRank(allRiders);
        const minutes = Math.floor(gameTime / 60000);
        const seconds = Math.floor((gameTime % 60000) / 1000);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (rank === 1) {
            this.elements.finishTitle.textContent = '🏆 冠军！';
        } else if (rank === 2) {
            this.elements.finishTitle.textContent = '🥈 亚军！';
        } else if (rank === 3) {
            this.elements.finishTitle.textContent = '🥉 季军！';
        } else {
            this.elements.finishTitle.textContent = '比赛结束';
        }
        
        this.elements.finishStats.innerHTML = `
            <p>排名：<strong>第 ${rank} 名</strong></p>
            <p>用时：<strong>${timeStr}</strong></p>
            <p>车手：<strong>${player.config.name}</strong></p>
        `;
        
        Storage.saveHighScore({
            rank,
            time: gameTime,
            rider: player.type,
            riderName: player.config.name
        });
    }

    initSelectedRider() {
        const settings = Storage.loadSettings();
        if (settings && settings.selectedRider) {
            this.game.selectedRider = settings.selectedRider;
            this.elements.riderCards.forEach(card => {
                if (card.dataset.rider === settings.selectedRider) {
                    card.classList.add('selected');
                }
            });
        } else {
            const firstCard = this.elements.riderCards[0];
            if (firstCard) {
                firstCard.classList.add('selected');
                this.game.selectedRider = firstCard.dataset.rider;
            }
        }
    }

    saveSelectedRider(riderType) {
        Storage.saveSettings({ selectedRider: riderType });
    }
}
