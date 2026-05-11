
window.UIManager = (function() {
    let elements = {};
    let eventHandlers = {};

    function $(id) {
        return document.getElementById(id);
    }

    function createIngredientElement(ingredient, isUnlocked) {
        const div = document.createElement('div');
        div.className = `ingredient ${isUnlocked ? 'unlocked' : 'locked'}`;
        div.dataset.id = ingredient.id;
        div.dataset.category = ingredient.category;
        div.innerHTML = `
            <span class="ingredient-icon">${ingredient.icon}</span>
            <span class="ingredient-name">${ingredient.name}</span>
            ${!isUnlocked ? `<span class="ingredient-lock">🔒 ${ingredient.unlockScore}分</span>` : ''}
        `;
        return div;
    }

    function createSelectedIngredientElement(ingredient) {
        const div = document.createElement('div');
        div.className = 'selected-item';
        div.dataset.id = ingredient.id;
        div.innerHTML = `
            <span class="selected-icon">${ingredient.icon}</span>
            <span class="selected-name">${ingredient.name}</span>
            <span class="remove-btn">✕</span>
        `;
        return div;
    }

    function getDifficultyStars(difficulty) {
        return '⭐'.repeat(difficulty);
    }

    return {
        init: function(handlers) {
            eventHandlers = handlers;
            
            elements = {
                scoreDisplay: $('score-display'),
                comboDisplay: $('combo-display'),
                ordersDisplay: $('orders-display'),
                currentOrder: $('current-order'),
                timerProgress: $('timer-progress'),
                selectedItems: $('selected-items'),
                riceIngredients: $('rice-ingredients'),
                mainIngredients: $('main-ingredients'),
                toppingIngredients: $('topping-ingredients'),
                confirmBtn: $('confirm-btn'),
                clearBtn: $('clear-btn'),
                resetBtn: $('reset-btn'),
                notification: $('notification'),
                unlockModal: $('unlock-modal'),
                unlockContent: $('unlock-content'),
                unlockOkBtn: $('unlock-ok-btn'),
                gameoverModal: $('gameover-modal'),
                gameoverContent: $('gameover-content'),
                restartBtn: $('restart-btn'),
                customerAvatar: document.querySelector('.customer-avatar')
            };

            this.bindEvents();
        },

        bindEvents: function() {
            elements.confirmBtn.addEventListener('click', () => {
                if (eventHandlers.onConfirm) eventHandlers.onConfirm();
            });

            elements.clearBtn.addEventListener('click', () => {
                if (eventHandlers.onClear) eventHandlers.onClear();
            });

            elements.resetBtn.addEventListener('click', () => {
                if (eventHandlers.onReset) eventHandlers.onReset();
            });

            elements.unlockOkBtn.addEventListener('click', () => {
                this.hideUnlockModal();
                if (eventHandlers.onUnlockClose) eventHandlers.onUnlockClose();
            });

            elements.restartBtn.addEventListener('click', () => {
                this.hideGameoverModal();
                if (eventHandlers.onRestart) eventHandlers.onRestart();
            });

            [elements.riceIngredients, elements.mainIngredients, elements.toppingIngredients].forEach(container => {
                container.addEventListener('click', (e) => {
                    const ingredientEl = e.target.closest('.ingredient');
                    if (ingredientEl && !ingredientEl.classList.contains('locked')) {
                        const id = ingredientEl.dataset.id;
                        if (eventHandlers.onIngredientClick) {
                            eventHandlers.onIngredientClick(id, e);
                        }
                    }
                });
            });

            elements.selectedItems.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    const item = e.target.closest('.selected-item');
                    if (item) {
                        const id = item.dataset.id;
                        if (eventHandlers.onRemoveIngredient) {
                            eventHandlers.onRemoveIngredient(id);
                        }
                    }
                }
            });
        },

        renderIngredients: function(totalScore) {
            ['rice', 'main', 'topping'].forEach(category => {
                const container = elements[`${category}Ingredients`];
                if (!container) return;
                
                container.innerHTML = '';
                const ingredients = SushiData.getIngredientsByCategory(category);
                
                ingredients.forEach(ingredient => {
                    const isUnlocked = totalScore >= ingredient.unlockScore;
                    const el = createIngredientElement(ingredient, isUnlocked);
                    container.appendChild(el);
                });
            });
        },

        renderSelectedIngredients: function(ingredients) {
            elements.selectedItems.innerHTML = '';
            ingredients.forEach(ingredient => {
                const el = createSelectedIngredientElement(ingredient);
                elements.selectedItems.appendChild(el);
            });
        },

        renderOrder: function(order) {
            if (!order) {
                elements.currentOrder.innerHTML = '<div class="no-order">等待顾客...</div>';
                return;
            }

            const sushi = SushiData.getSushiById(order.sushiId);
            if (!sushi) return;

            const riceIng = sushi.rice.map(id => SushiData.getIngredientById(id)).filter(Boolean);
            const mainIng = sushi.main.map(id => SushiData.getIngredientById(id)).filter(Boolean);
            const toppingIng = sushi.toppings.map(id => SushiData.getIngredientById(id)).filter(Boolean);

            elements.customerAvatar.textContent = order.customer;

            elements.currentOrder.innerHTML = `
                <div class="order-item">
                    <div class="order-header">
                        <span class="order-icon">${sushi.icon}</span>
                        <span class="order-name">${sushi.name}</span>
                        <span class="order-difficulty">${getDifficultyStars(sushi.difficulty)}</span>
                    </div>
                    <div class="order-description">${sushi.description}</div>
                    <div class="order-requirements">
                        ${riceIng.length > 0 ? `<div class="req-section"><span class="req-label">🍚</span>${riceIng.map(i => i.icon).join(' ')}</div>` : ''}
                        ${mainIng.length > 0 ? `<div class="req-section"><span class="req-label">🐟</span>${mainIng.map(i => i.icon).join(' ')}</div>` : ''}
                        ${toppingIng.length > 0 ? `<div class="req-section"><span class="req-label">🌿</span>${toppingIng.map(i => i.icon).join(' ')}</div>` : ''}
                    </div>
                </div>
            `;
        },

        updateStats: function(state) {
            elements.scoreDisplay.textContent = state.totalScore;
            elements.comboDisplay.textContent = state.combo;
            elements.ordersDisplay.textContent = state.ordersCompleted;
        },

        updateTimer: function(remaining, total) {
            const percent = (remaining / total) * 100;
            elements.timerProgress.style.width = `${percent}%`;
            
            if (percent < 30) {
                elements.timerProgress.style.background = '#ff4757';
            } else if (percent < 60) {
                elements.timerProgress.style.background = '#ffa502';
            } else {
                elements.timerProgress.style.background = '#7bed9f';
            }
        },

        showNotification: function(message, duration = 2000) {
            const content = elements.notification.querySelector('.notification-content');
            content.textContent = message;
            elements.notification.classList.remove('hidden');
            
            setTimeout(() => {
                elements.notification.classList.add('hidden');
            }, duration);
        },

        showUnlockModal: function(unlocks) {
            let html = '<div class="unlock-items">';
            unlocks.forEach(ing => {
                html += `
                    <div class="unlock-item">
                    <span class="unlock-icon">${ing.icon}</span>
                    <span class="unlock-name">${ing.name}</span>
                </div>
                `;
            });
            html += '</div>';
            
            elements.unlockContent.innerHTML = html;
            elements.unlockModal.classList.remove('hidden');
        },

        hideUnlockModal: function() {
            elements.unlockModal.classList.add('hidden');
        },

        showGameoverModal: function(state) {
            elements.gameoverContent.innerHTML = `
                <div class="gameover-stats">
                    <div class="stat-row">
                        <span>💰 本局得分:</span>
                        <span>${state.currentScore}</span>
                    </div>
                    <div class="stat-row">
                        <span>📜 完成订单:</span>
                        <span>${state.ordersCompleted}</span>
                    </div>
                    <div class="stat-row">
                        <span>⭐ 最高连击:</span>
                        <span>${state.maxCombo}</span>
                    </div>
                    <div class="stat-row highlight">
                        <span>🏆 累计总分:</span>
                        <span>${state.totalScore}</span>
                    </div>
                </div>
            `;
            elements.gameoverModal.classList.remove('hidden');
        },

        hideGameoverModal: function() {
            elements.gameoverModal.classList.add('hidden');
        }
    };
})();
