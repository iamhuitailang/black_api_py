class App {
    constructor() {
        this.game = null;
        this.selectedCharacter = 'clown';
        this.init();
    }
    
    init() {
        this.setupCharacterSelect();
        this.setupButtons();
        
        setTimeout(() => {
            this.checkSavedGame();
        }, 100);
    }
    
    setupCharacterSelect() {
        const cards = document.querySelectorAll('.character-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedCharacter = card.dataset.character;
            });
        });
        
        const defaultCard = document.querySelector('.character-card[data-character="clown"]');
        if (defaultCard) {
            defaultCard.classList.add('selected');
        }
    }
    
    setupButtons() {
        const startBtn = document.getElementById('start-btn');
        startBtn.addEventListener('click', () => this.startGame());
        
        const restartBtn = document.getElementById('restart-btn');
        restartBtn.addEventListener('click', () => this.restartGame());
        
        const backBtn = document.getElementById('back-btn');
        backBtn.addEventListener('click', () => this.backToSelect());
    }
    
    checkSavedGame() {
        try {
            const savedState = Storage.load();
            if (savedState && savedState.player && savedState.enemy) {
                const shouldResume = confirm('🎪 检测到未完成的马戏团表演！\n是否继续你的精彩表演？');
                if (shouldResume) {
                    this.resumeGame(savedState);
                } else {
                    Storage.clear();
                }
            }
        } catch (e) {
            console.log('无法加载保存的游戏:', e);
            Storage.clear();
        }
    }
    
    startGame() {
        const characterSelect = document.getElementById('character-select');
        const gameScreen = document.getElementById('game-screen');
        
        if (this.game) {
            this.game.stop();
        }
        
        this.game = new Game();
        this.game.init(this.selectedCharacter);
        
        characterSelect.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        this.game.start();
    }
    
    resumeGame(savedState) {
        const characterSelect = document.getElementById('character-select');
        const gameScreen = document.getElementById('game-screen');
        
        if (this.game) {
            this.game.stop();
        }
        
        try {
            this.game = new Game();
            this.game.loadFromSavedState(savedState);
            
            this.selectedCharacter = savedState.player.dataId;
            
            const cards = document.querySelectorAll('.character-card');
            cards.forEach(c => c.classList.remove('selected'));
            const selectedCard = document.querySelector(`.character-card[data-character="${this.selectedCharacter}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
            
            characterSelect.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            
            this.game.start();
        } catch (e) {
            console.error('恢复游戏失败:', e);
            Storage.clear();
            alert('恢复游戏失败，将开始新游戏');
        }
    }
    
    restartGame() {
        const resultScreen = document.getElementById('result-screen');
        const gameScreen = document.getElementById('game-screen');
        
        if (this.game) {
            this.game.stop();
        }
        
        this.game = new Game();
        this.game.init(this.selectedCharacter);
        
        resultScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        this.game.start();
    }
    
    backToSelect() {
        const resultScreen = document.getElementById('result-screen');
        const gameScreen = document.getElementById('game-screen');
        const characterSelect = document.getElementById('character-select');
        
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        
        resultScreen.classList.add('hidden');
        gameScreen.classList.add('hidden');
        characterSelect.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
