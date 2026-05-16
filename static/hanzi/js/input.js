const InputManager = {
    maxInputLength: 4,
    inputElement: null,
    isComposing: false,
    
    init() {
        this.inputElement = document.getElementById('inputBox');
        this.bindEvents();
    },
    
    bindEvents() {
        if (this.inputElement) {
            this.inputElement.addEventListener('input', (e) => this.handleInput(e));
            this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
            this.inputElement.addEventListener('compositionstart', () => this.handleCompositionStart());
            this.inputElement.addEventListener('compositionupdate', () => this.handleCompositionUpdate());
            this.inputElement.addEventListener('compositionend', (e) => this.handleCompositionEnd(e));
        }
    },
    
    handleCompositionStart() {
        this.isComposing = true;
    },
    
    handleCompositionUpdate() {
    },
    
    handleCompositionEnd(e) {
        this.isComposing = false;
        if (e.data) {
            const currentValue = this.inputElement.value;
            if (currentValue.length > this.maxInputLength) {
                this.inputElement.value = currentValue.slice(0, this.maxInputLength);
            }
        }
        if (window.game && window.game.gameState === 'playing') {
            window.game.saveState();
        }
    },
    
    handleInput(e) {
        if (!this.isComposing && e.target.value.length > this.maxInputLength) {
            e.target.value = e.target.value.slice(0, this.maxInputLength);
        }
        if (window.game && window.game.gameState === 'playing') {
            window.game.saveState();
        }
    },
    
    handleKeyDown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!this.isComposing) {
                this.submitInput();
            }
        }
    },
    
    submitInput() {
        const value = this.inputElement.value.trim();
        if (!value) return;
        
        const attackType = CombatSystem.determineAttackType(value);
        
        if (attackType && window.game && window.game.gameState === 'playing') {
            window.game.triggerAttack(attackType, value);
        }
        
        this.clear();
    },
    
    updateDisplay() {
    },
    
    clear() {
        if (this.inputElement) {
            this.inputElement.value = '';
            this.inputElement.focus();
        }
    },
    
    getInput() {
        return this.inputElement ? this.inputElement.value : '';
    },
    
    setInput(value) {
        if (this.inputElement && value) {
            this.inputElement.value = value.slice(0, this.maxInputLength);
        }
    },
    
    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }
};

const EnemyAI = {
    attackInterval: 2000,
    lastAttackTime: 0,
    currentDelay: 0,
    
    update(deltaTime, enemy, player) {
        this.currentDelay += deltaTime;
        
        if (this.currentDelay >= this.attackInterval && !enemy.isAttacking) {
            this.performAttack(enemy);
            this.currentDelay = 0;
            this.attackInterval = 1500 + Math.random() * 2000;
        }
    },
    
    performAttack(enemy) {
        const attackTypes = ['SINGLE_CHAR', 'PINYIN'];
        const randomType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        
        let attackText = '';
        if (randomType === 'SINGLE_CHAR') {
            attackText = WordDatabase.singleChars[Math.floor(Math.random() * WordDatabase.singleChars.length)];
        } else {
            const pinyinKeys = Object.keys(WordDatabase.pinyinMap);
            attackText = pinyinKeys[Math.floor(Math.random() * pinyinKeys.length)];
        }
        
        if (window.game && window.game.gameState === 'playing') {
            window.game.triggerEnemyAttack(randomType, attackText);
        }
    },
    
    reset() {
        this.lastAttackTime = 0;
        this.currentDelay = 0;
    }
};
