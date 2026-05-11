
window.GameManager = (function() {
    let gameLoopId = null;
    let pendingUnlocks = [];
    let timerInterval = null;

    function checkOrderCompletion(selectedIngredients, order) {
        if (!order) return { correct: false, reason: '没有订单' };

        const sushi = SushiData.getSushiById(order.sushiId);
        if (!sushi) return { correct: false, reason: '寿司类型不存在' };

        const selectedIds = selectedIngredients.map(i => i.id);

        const riceNeeded = sushi.rice;
        const mainNeeded = sushi.main;
        const toppingsNeeded = sushi.toppings;

        const hasCorrectRice = riceNeeded.length === 0 || 
            riceNeeded.some(needed => selectedIds.includes(needed));

        const hasCorrectMain = mainNeeded.some(needed => selectedIds.includes(needed));

        const toppingsSelected = selectedIngredients
            .filter(i => i.category === 'topping')
            .map(i => i.id);

        const allToppingsPresent = toppingsNeeded.every(needed => selectedIds.includes(needed));
        const onlyRequiredToppings = toppingsSelected.length === toppingsNeeded.length &&
            toppingsSelected.every(t => toppingsNeeded.includes(t));

        let details = {
            rice: hasCorrectRice,
            main: hasCorrectMain,
            toppings: allToppingsPresent,
            perfectToppings: toppingsNeeded.length > 0 && onlyRequiredToppings
        };

        if (riceNeeded.length > 0 && !hasCorrectRice) {
            return { correct: false, reason: '缺少米饭', details };
        }
        if (!hasCorrectMain) {
            return { correct: false, reason: '主料不正确', details };
        }
        if (toppingsNeeded.length > 0 && !allToppingsPresent) {
            return { correct: false, reason: '配料不完整', details };
        }

        return { correct: true, details };
    }

    function calculateScore(result, order) {
        const sushi = SushiData.getSushiById(order.sushiId);
        let score = sushi.baseScore;

        if (result.details.perfectToppings) {
            score += 5;
        }

        const timeTaken = Date.now() - order.startTime;
        if (timeTaken < 10000) {
            score += 10;
        }

        const combo = GameState.getState().combo + 1;
        if (combo > 1) {
            score += (combo - 1) * 2;
        }

        return score;
    }

    function generateOrder() {
        const state = GameState.getState();
        const available = SushiData.getAvailableSushi(state.totalScore);
        
        if (available.length === 0) {
            const basicSushi = SushiData.getSushiById('salmon_sushi');
            return {
                sushiId: basicSushi.id,
                customer: SushiData.getRandomCustomer(),
                startTime: Date.now()
            };
        }

        const selectedSushi = available[Math.floor(Math.random() * available.length)];
        
        return {
            sushiId: selectedSushi.id,
            customer: SushiData.getRandomCustomer(),
            startTime: Date.now()
        };
    }

    return {
        init: function() {
            const loadedState = StorageManager.loadGame();
            GameState.init(loadedState);
            AudioManager.init();
        },

        start: function() {
            const state = GameState.getState();
            
            if (!state.gameActive || state.lives <= 0) {
                GameState.startGame();
            }

            if (!GameState.getState().currentOrder) {
                this.nextOrder();
            }

            this.startGameLoop();
            this.render();
        },

        restart: function() {
            GameState.resetCurrentGame();
            GameState.startGame();
            pendingUnlocks = [];
            this.nextOrder();
            this.render();
        },

        reset: function() {
            if (confirm('确定要重置所有游戏进度吗？这将清除所有解锁的食材和分数！')) {
                StorageManager.resetGame();
                const loadedState = StorageManager.loadGame();
                GameState.init(loadedState);
                pendingUnlocks = [];
                this.start();
            }
        },

        nextOrder: function() {
            const order = generateOrder();
            GameState.setCurrentOrder(order);
            GameState.clearSelectedIngredients();
            UIManager.renderOrder(order);
            UIManager.renderSelectedIngredients([]);
        },

        selectIngredient: function(ingredientId, event) {
            const ingredient = SushiData.getIngredientById(ingredientId);
            if (!ingredient) return;

            const state = GameState.getState();
            if (!state.gameActive) {
                this.start();
                return;
            }

            if (ingredient.unlockScore > state.totalScore) {
                UIManager.showNotification(`🔒 需要 ${ingredient.unlockScore} 分解锁！`);
                AudioManager.error();
                return;
            }

            const alreadySelected = state.selectedIngredients.find(i => i.id === ingredientId);
            if (alreadySelected) {
                UIManager.showNotification('已选择过这个食材了');
                AudioManager.error();
                return;
            }

            AudioManager.select();
            AudioManager.pop();

            const ingredientElement = event ? event.target.closest('.ingredient') : null;
            if (ingredientElement && ingredient.icon) {
                EffectsManager.flyIngredient(ingredientElement, ingredient.icon, null);
            }

            GameState.addSelectedIngredient(ingredient);
            UIManager.renderSelectedIngredients(GameState.getState().selectedIngredients);
        },

        removeIngredient: function(ingredientId) {
            GameState.removeSelectedIngredient(ingredientId);
            AudioManager.select();
            UIManager.renderSelectedIngredients(GameState.getState().selectedIngredients);
        },

        clearIngredients: function() {
            GameState.clearSelectedIngredients();
            AudioManager.select();
            UIManager.renderSelectedIngredients([]);
        },

        confirmOrder: function() {
            const state = GameState.getState();
            if (!state.currentOrder) {
                UIManager.showNotification('没有订单需要完成');
                AudioManager.error();
                return;
            }

            if (state.selectedIngredients.length === 0) {
                UIManager.showNotification('请先选择食材！');
                AudioManager.error();
                EffectsManager.shake();
                return;
            }

            const result = checkOrderCompletion(state.selectedIngredients, state.currentOrder);

            if (result.correct) {
                AudioManager.confirm();
                
                const score = calculateScore(result, state.currentOrder);
                const unlocks = GameState.addScore(score);
                const newCombo = GameState.addCombo();
                GameState.completeOrder();

                EffectsManager.showScore(score);
                EffectsManager.successBurst();
                
                if (newCombo > 1) {
                    EffectsManager.showCombo(newCombo);
                    AudioManager.combo();
                }

                UIManager.showNotification(`✨ 太棒了! +${score}分`);
                
                if (unlocks.length > 0) {
                    pendingUnlocks = unlocks;
                    AudioManager.unlock();
                    unlocks.forEach(u => {
                        EffectsManager.showUnlock(`解锁: ${u.icon} ${u.name}`);
                    });
                }

                UIManager.updateStats(GameState.getState());
                UIManager.renderIngredients(GameState.getState().totalScore);

                setTimeout(() => {
                    if (pendingUnlocks.length > 0) {
                        UIManager.showUnlockModal(pendingUnlocks);
                        pendingUnlocks = [];
                    } else {
                        this.nextOrder();
                    }
                }, 800);

            } else {
                GameState.resetCombo();
                const livesLeft = GameState.loseLife();
                
                AudioManager.error();
                EffectsManager.showError();
                EffectsManager.shake();
                EffectsManager.headShake();
                UIManager.showNotification(`❌ ${result.reason}`);

                if (livesLeft <= 0) {
                    this.gameOver();
                } else {
                    setTimeout(() => {
                        UIManager.showNotification(`💔 剩余生命: ${livesLeft}`);
                        GameState.clearSelectedIngredients();
                        UIManager.renderSelectedIngredients([]);
                    }, 600);
                }
            }
        },

        handleOrderTimeout: function() {
            const state = GameState.getState();
            if (!state.currentOrder) return;

            GameState.resetCombo();
            const livesLeft = GameState.loseLife();
            
            AudioManager.error();
            EffectsManager.showError();
            EffectsManager.shake();
            EffectsManager.headShake();
            UIManager.showNotification('⏰ 订单超时!');

            if (livesLeft <= 0) {
                this.gameOver();
            } else {
                setTimeout(() => {
                    UIManager.showNotification(`💔 剩余生命: ${livesLeft}`);
                    this.nextOrder();
                }, 600);
            }
        },

        handleUnlockClose: function() {
            this.nextOrder();
        },

        gameOver: function() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            
            GameState.update({ gameActive: false });
            UIManager.showGameoverModal(GameState.getState());
        },

        startGameLoop: function() {
            if (timerInterval) return;

            const updateTimer = () => {
                const state = GameState.getState();
                if (state.gameActive && state.currentOrder) {
                    const remaining = GameState.getOrderTimeRemaining();
                    const total = GameState.getOrderTimeLimit();
                    UIManager.updateTimer(remaining, total);

                    if (remaining <= 0) {
                        this.handleOrderTimeout();
                    }
                }
            };

            updateTimer();
            timerInterval = setInterval(updateTimer, 100);
        },

        stopGameLoop: function() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        },

        render: function() {
            const state = GameState.getState();
            UIManager.updateStats(state);
            UIManager.renderIngredients(state.totalScore);
            UIManager.renderSelectedIngredients(state.selectedIngredients);
            UIManager.renderOrder(state.currentOrder);
        }
    };
})();
