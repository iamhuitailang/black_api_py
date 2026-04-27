const Game = {
    state: {
        isPlaying: false,
        score: 0,
        timeLeft: 0,
        combo: 0,
        maxCombo: 0,
        dishesCompleted: 0,
        currentDish: null,
        currentStep: 0,
        timer: null,
        cookingIngredientsList: [],
        customerEmoji: null,
        orderText: null
    },
    
    elements: {},
    
    init() {
        this.cacheElements();
        this.bindEvents();
        Effects.init();
        SoundManager.init();
        StorageManager.init();
        
        this.checkSavedGame();
    },
    
    cacheElements() {
        this.elements = {
            startScreen: document.getElementById('start-screen'),
            gameScreen: document.getElementById('game-screen'),
            endScreen: document.getElementById('end-screen'),
            startBtn: document.getElementById('start-btn'),
            continueBtn: document.getElementById('continue-btn'),
            restartBtn: document.getElementById('restart-btn'),
            scoreDisplay: document.getElementById('score'),
            comboDisplay: document.getElementById('combo'),
            timeDisplay: document.getElementById('time'),
            orderText: document.getElementById('order-text'),
            dishEmoji: document.getElementById('dish-emoji'),
            dishName: document.getElementById('dish-name'),
            ingredientsRequired: document.getElementById('ingredients-required'),
            cookingIngredients: document.getElementById('cooking-ingredients'),
            ingredientsPanel: document.getElementById('ingredients-panel'),
            finalScore: document.getElementById('final-score'),
            finalDishes: document.getElementById('final-dishes'),
            finalCombo: document.getElementById('final-combo')
        };
    },
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => {
            SoundManager.init();
            this.startNewGame();
        });
        
        this.elements.continueBtn.addEventListener('click', () => {
            SoundManager.init();
            this.continueSavedGame();
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            SoundManager.init();
            this.startNewGame();
        });
    },
    
    checkSavedGame() {
        if (StorageManager.hasSavedGame()) {
            this.elements.continueBtn.style.display = 'block';
            const savedState = StorageManager.loadGameState();
            if (savedState) {
                this.elements.continueBtn.textContent = `继续游戏 (剩余${savedState.timeLeft}秒)`;
            }
        } else {
            this.elements.continueBtn.style.display = 'none';
        }
    },
    
    startNewGame() {
        StorageManager.clearGameState();
        this.elements.continueBtn.style.display = 'none';
        
        this.state = {
            isPlaying: true,
            score: 0,
            timeLeft: GAME_DATA.gameTime,
            combo: 0,
            maxCombo: 0,
            dishesCompleted: 0,
            currentDish: null,
            currentStep: 0,
            timer: null,
            cookingIngredientsList: [],
            customerEmoji: null,
            orderText: null
        };
        
        this.updateDisplays();
        this.showScreen('game');
        this.generateNewDish();
        this.startTimer();
        
        StorageManager.startAutoSave();
    },
    
    continueSavedGame() {
        const savedState = StorageManager.loadGameState();
        
        if (!savedState || !StorageManager.isStateValid(savedState)) {
            StorageManager.clearGameState();
            this.startNewGame();
            return;
        }
        
        const cookingList = savedState.cookingIngredientsList || savedState.cookingIngredients || [];
        
        this.state = {
            isPlaying: true,
            score: savedState.score,
            timeLeft: savedState.timeLeft,
            combo: savedState.combo,
            maxCombo: savedState.maxCombo,
            dishesCompleted: savedState.dishesCompleted,
            currentDish: savedState.currentDish,
            currentStep: savedState.currentStep,
            timer: null,
            cookingIngredientsList: cookingList,
            customerEmoji: savedState.customerEmoji,
            orderText: savedState.orderText
        };
        
        this.elements.continueBtn.style.display = 'none';
        
        this.updateDisplays();
        this.showScreen('game');
        
        if (this.state.currentDish) {
            this.restoreDishState();
        } else {
            this.generateNewDish();
        }
        
        this.startTimer();
        StorageManager.startAutoSave();
    },
    
    restoreDishState() {
        this.updateOrderDisplay(true);
        this.restoreCookingArea();
        this.generateIngredientsPanel();
        
        const requiredEls = this.elements.ingredientsRequired.querySelectorAll('.ingredient-required');
        for (let i = 0; i < this.state.currentStep; i++) {
            if (requiredEls[i]) {
                requiredEls[i].classList.add('completed');
            }
        }
    },
    
    restoreCookingArea() {
        this.elements.cookingIngredients.innerHTML = '';
        this.state.cookingIngredientsList.forEach(ingredientId => {
            const ingredient = GAME_DATA.ingredients[ingredientId];
            if (ingredient) {
                const cookingEl = document.createElement('div');
                cookingEl.className = 'cooking-ingredient';
                cookingEl.textContent = ingredient.emoji;
                this.elements.cookingIngredients.appendChild(cookingEl);
            }
        });
    },
    
    getCookingIngredientsState() {
        return this.state.cookingIngredientsList || [];
    },
    
    showScreen(screenName) {
        this.elements.startScreen.classList.remove('active');
        this.elements.gameScreen.classList.remove('active');
        this.elements.endScreen.classList.remove('active');
        
        this.elements.gameScreen.classList.remove('screen-darken');
        
        switch (screenName) {
            case 'start':
                this.elements.startScreen.classList.add('active');
                break;
            case 'game':
                this.elements.gameScreen.classList.add('active');
                break;
            case 'end':
                this.elements.endScreen.classList.add('active');
                break;
        }
    },
    
    startTimer() {
        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimeDisplay();
            
            if (this.state.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    },
    
    stopTimer() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    },
    
    updateDisplays() {
        this.elements.scoreDisplay.textContent = this.state.score;
        
        const comboIndex = Math.min(this.state.combo, GAME_DATA.comboMultipliers.length - 1);
        const multiplier = GAME_DATA.comboMultipliers[comboIndex];
        this.elements.comboDisplay.textContent = `×${multiplier}`;
        
        this.updateTimeDisplay();
    },
    
    updateTimeDisplay() {
        this.elements.timeDisplay.textContent = this.state.timeLeft;
        
        if (this.state.timeLeft <= 10) {
            this.elements.timeDisplay.classList.add('warning');
        } else {
            this.elements.timeDisplay.classList.remove('warning');
        }
    },
    
    generateNewDish() {
        this.state.currentDish = Utils.randomChoice(GAME_DATA.dishes);
        this.state.currentStep = 0;
        this.state.cookingIngredientsList = [];
        
        this.updateOrderDisplay();
        this.updateCookingArea();
        this.generateIngredientsPanel();
        
        StorageManager.saveGameState();
    },
    
    updateOrderDisplay(useSaved = false) {
        const dish = this.state.currentDish;
        
        let customerEmoji, orderText;
        
        if (useSaved && this.state.customerEmoji && this.state.orderText) {
            customerEmoji = this.state.customerEmoji;
            orderText = this.state.orderText;
        } else {
            customerEmoji = Utils.randomChoice(GAME_DATA.customerEmojis);
            orderText = Utils.randomChoice(GAME_DATA.orderTexts);
            this.state.customerEmoji = customerEmoji;
            this.state.orderText = orderText;
        }
        
        document.querySelector('.customer-emoji').textContent = customerEmoji;
        this.elements.orderText.textContent = `${orderText}${dish.name}！`;
        this.elements.dishEmoji.textContent = dish.emoji;
        this.elements.dishName.textContent = dish.name;
        
        this.elements.ingredientsRequired.innerHTML = '';
        
        dish.ingredients.forEach((ingredientId, index) => {
            const ingredient = GAME_DATA.ingredients[ingredientId];
            const div = document.createElement('div');
            div.className = 'ingredient-required';
            div.dataset.ingredient = ingredientId;
            div.dataset.index = index;
            div.innerHTML = `
                <span class="ingredient-emoji">${ingredient.emoji}</span>
                <span class="ingredient-name">${ingredient.name}</span>
            `;
            
            if (index < dish.ingredients.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrow.textContent = '→';
                this.elements.ingredientsRequired.appendChild(div);
                this.elements.ingredientsRequired.appendChild(arrow);
            } else {
                this.elements.ingredientsRequired.appendChild(div);
            }
        });
    },
    
    updateCookingArea() {
        this.elements.cookingIngredients.innerHTML = '';
        this.state.cookingIngredientsList = [];
    },
    
    generateIngredientsPanel() {
        const dish = this.state.currentDish;
        const requiredIngredients = dish.ingredients;
        
        let panelIngredients = [...requiredIngredients];
        
        const allIngredientIds = Object.keys(GAME_DATA.ingredients);
        const distractionCount = Utils.random(2, 4);
        const availableDistractions = allIngredientIds.filter(id => !requiredIngredients.includes(id));
        
        for (let i = 0; i < distractionCount && availableDistractions.length > 0; i++) {
            const randomIndex = Utils.random(0, availableDistractions.length - 1);
            panelIngredients.push(availableDistractions.splice(randomIndex, 1)[0]);
        }
        
        panelIngredients = Utils.shuffle(panelIngredients);
        
        this.elements.ingredientsPanel.innerHTML = '';
        
        panelIngredients.forEach(ingredientId => {
            const ingredient = GAME_DATA.ingredients[ingredientId];
            const btn = document.createElement('button');
            btn.className = 'ingredient-btn';
            btn.dataset.ingredient = ingredientId;
            btn.innerHTML = `
                <span class="emoji">${ingredient.emoji}</span>
                <span class="name">${ingredient.name}</span>
            `;
            
            btn.addEventListener('click', (e) => this.onIngredientClick(ingredientId, e));
            
            this.elements.ingredientsPanel.appendChild(btn);
        });
    },
    
    onIngredientClick(ingredientId, event) {
        if (!this.state.isPlaying) return;
        
        const dish = this.state.currentDish;
        const expectedIngredient = dish.ingredients[this.state.currentStep];
        const btn = event.currentTarget;
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        Effects.playIngredientClick(btn);
        SoundManager.playClick();
        Vibration.click();
        
        if (ingredientId === expectedIngredient) {
            this.handleCorrectIngredient(ingredientId, centerX, centerY);
        } else {
            this.handleWrongIngredient(btn, centerX, centerY);
        }
    },
    
    handleCorrectIngredient(ingredientId, x, y) {
        const ingredient = GAME_DATA.ingredients[ingredientId];
        
        const cookingEl = document.createElement('div');
        cookingEl.className = 'cooking-ingredient';
        cookingEl.textContent = ingredient.emoji;
        this.elements.cookingIngredients.appendChild(cookingEl);
        
        this.state.cookingIngredientsList.push(ingredientId);
        
        const requiredEls = this.elements.ingredientsRequired.querySelectorAll('.ingredient-required');
        if (requiredEls[this.state.currentStep]) {
            requiredEls[this.state.currentStep].classList.add('completed');
        }
        
        this.state.currentStep++;
        
        StorageManager.saveGameState();
        
        if (this.state.currentStep >= this.state.currentDish.ingredients.length) {
            this.handleDishComplete(x, y);
        }
    },
    
    handleDishComplete(x, y) {
        const dish = this.state.currentDish;
        const baseScore = dish.baseScore;
        const timeBonus = this.state.timeLeft * GAME_DATA.timeBonusPerSecond;
        
        const comboIndex = Math.min(this.state.combo, GAME_DATA.comboMultipliers.length - 1);
        const multiplier = GAME_DATA.comboMultipliers[comboIndex];
        const totalScore = Math.floor((baseScore + timeBonus) * multiplier);
        
        this.state.score += totalScore;
        this.state.combo++;
        this.state.dishesCompleted++;
        
        if (this.state.combo > this.state.maxCombo) {
            this.state.maxCombo = this.state.combo;
        }
        
        this.updateDisplays();
        
        Effects.createSuccessEffect(x, y - 50, totalScore);
        Effects.shakeScreen(1);
        SoundManager.playSuccess();
        Vibration.success();
        
        StorageManager.saveGameState();
        
        setTimeout(() => {
            this.generateNewDish();
        }, 500);
    },
    
    handleWrongIngredient(btn, x, y) {
        this.state.combo = 0;
        this.state.score = Math.max(0, this.state.score - GAME_DATA.penaltyScore);
        
        this.updateDisplays();
        
        Effects.playIngredientError(btn);
        Effects.createErrorEffect(x, y);
        Effects.shakeScreen(1);
        SoundManager.playError();
        Vibration.error();
        
        StorageManager.saveGameState();
    },
    
    endGame() {
        this.state.isPlaying = false;
        this.stopTimer();
        StorageManager.stopAutoSave();
        StorageManager.clearGameState();
        
        Effects.darkenScreen();
        Effects.shakeScreen(2);
        SoundManager.playGameEnd();
        Vibration.gameEnd();
        
        setTimeout(() => {
            this.showFinalStats();
            this.showScreen('end');
        }, 500);
    },
    
    showFinalStats() {
        this.elements.finalScore.textContent = this.state.score;
        this.elements.finalDishes.textContent = this.state.dishesCompleted;
        
        const maxComboIndex = Math.min(this.state.maxCombo, GAME_DATA.comboMultipliers.length - 1);
        const maxMultiplier = GAME_DATA.comboMultipliers[maxComboIndex];
        this.elements.finalCombo.textContent = `×${maxMultiplier}`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

window.addEventListener('pagehide', () => {
    if (Game && Game.state && Game.state.isPlaying) {
        StorageManager.saveGameState();
    }
});
