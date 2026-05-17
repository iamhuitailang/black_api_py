const UI = {
    selectedCharacter: null,

    init: function() {
        this.bindEvents();
        this.checkSavedGame();
    },

    bindEvents: function() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacter(card.dataset.character);
            });
        });

        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueGame();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.showPauseMenu();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.hidePauseMenu();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });

        document.getElementById('result-close-btn').addEventListener('click', () => {
            this.hideResultModal();
        });

        document.getElementById('heat-slider').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('heat-value').textContent = value + '%';
            Game.setHeat(parseInt(value));
        });

        document.getElementById('stir-btn').addEventListener('click', () => {
            if (Game.stir()) {
                this.updateStirButton();
            }
        });

        document.getElementById('brew-btn').addEventListener('click', () => {
            this.brewPotion();
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCauldron();
        });
    },

    checkSavedGame: function() {
        if (Storage.hasSave()) {
            document.getElementById('continue-btn').style.display = 'block';
        }
    },

    selectCharacter: function(characterId) {
        this.selectedCharacter = characterId;
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-character="${characterId}"]`).classList.add('selected');
    },

    startGame: function() {
        if (!this.selectedCharacter) {
            alert('请先选择一个学徒！');
            return;
        }

        Game.startNewGame(this.selectedCharacter);
        this.enterGame();
    },

    continueGame: function() {
        if (Game.continueGame()) {
            this.enterGame();
        } else {
            alert('没有找到存档！');
        }
    },

    enterGame: function() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');

        const character = Game.getCharacter();
        document.getElementById('player-icon').textContent = character.icon;

        const state = Game.getState();
        document.getElementById('heat-slider').value = state.currentHeat;
        document.getElementById('heat-value').textContent = state.currentHeat + '%';
        Renderer.setHeat(state.currentHeat);
        document.getElementById('stir-btn').textContent = `搅拌 (${state.stirCount}次)`;

        this.renderMaterials();
        this.renderRecipes();
        this.renderCauldronContents();
        this.updateUI();

        Game.onBrewComplete = (result) => {
            this.onBrewComplete(result);
        };

        setInterval(() => {
            this.updateNPCMessage();
        }, 15000);
        
        this.updateNPCMessage();
    },

    renderMaterials: function() {
        const container = document.getElementById('materials-list');
        container.innerHTML = '';

        const state = Game.getState();
        const isCauldronFull = state.cauldronContents.length >= 6;
        const isBrewing = Game.isBrewing;
        
        Object.values(GameData.materials).forEach(material => {
            const count = state.materials[material.id] || 0;
            const inCauldronCount = state.cauldronContents.filter(m => m === material.id).length;
            const maxSameMaterial = 3;
            const isSameMaterialLimit = inCauldronCount >= maxSameMaterial;
            const isDisabled = count <= 0 || isCauldronFull || isBrewing || isSameMaterialLimit;
            const item = document.createElement('div');
            item.className = `material-item ${isDisabled ? 'disabled' : ''}`;
            item.dataset.materialId = material.id;
            item.innerHTML = `
                <div class="material-icon">${material.icon}</div>
                <div class="material-info">
                    <div class="material-name">${material.name}</div>
                    <div class="material-count">x${count}${inCauldronCount > 0 ? ` (坩埚:${inCauldronCount})` : ''}</div>
                </div>
                <div class="material-score">${material.baseScore}分</div>
            `;

            if (!isDisabled) {
                item.addEventListener('click', () => {
                    this.addMaterial(material.id);
                });
            }

            container.appendChild(item);
        });
    },

    renderRecipes: function() {
        const container = document.getElementById('recipes-list');
        container.innerHTML = '';

        const state = Game.getState();

        GameData.recipes.forEach(recipe => {
            const isUnlocked = state.unlockRecipes.includes(recipe.id);
            const item = document.createElement('div');
            item.className = `recipe-item ${!isUnlocked ? 'locked' : ''}`;
            
            if (isUnlocked) {
                const ingredientsHtml = recipe.ingredients.map(ingId => {
                    const material = GameData.getMaterialById(ingId);
                    return `<span class="recipe-ingredient">${material.icon} ${material.name}</span>`;
                }).join('');

                item.innerHTML = `
                    <div class="recipe-header">
                        <span class="recipe-icon">${recipe.icon}</span>
                        <span class="recipe-name">${recipe.name}</span>
                    </div>
                    <div class="recipe-result">价值: ${recipe.value}金币 | EXP: ${recipe.exp}</div>
                    <div class="recipe-ingredients">${ingredientsHtml}</div>
                `;
            } else {
                item.innerHTML = `
                    <div class="recipe-lock">
                        🔒 需要等级 ${recipe.requiredLevel} 解锁
                    </div>
                `;
            }

            container.appendChild(item);
        });
    },

    addMaterial: function(materialId) {
        if (Game.addMaterial(materialId)) {
            this.renderMaterials();
            this.renderCauldronContents();
            this.updateUI();
        }
    },

    renderCauldronContents: function() {
        const container = document.getElementById('cauldron-contents');
        const state = Game.getState();

        if (state.cauldronContents.length === 0) {
            container.innerHTML = '<div class="empty-text">尚未投放材料</div>';
            return;
        }

        const contentsList = document.createElement('div');
        contentsList.className = 'contents-list';

        state.cauldronContents.forEach((materialId, index) => {
            const material = GameData.getMaterialById(materialId);
            const item = document.createElement('div');
            item.className = 'content-item';
            item.innerHTML = `
                <span class="material-icon">${material.icon}</span>
                <span>${material.name}</span>
            `;
            contentsList.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(contentsList);
    },

    updateStirButton: function() {
        const state = Game.getState();
        document.getElementById('stir-btn').textContent = `搅拌 (${state.stirCount}次)`;
    },

    brewPotion: function() {
        const result = Game.brew();
        if (result.brewing) {
            document.getElementById('brew-btn').disabled = true;
            document.getElementById('brew-btn').textContent = '炼制中...';
            document.getElementById('cauldron-status').textContent = '正在炼制中...';
        }
    },

    onBrewComplete: function(result) {
        document.getElementById('brew-btn').disabled = false;
        document.getElementById('brew-btn').textContent = '开始炼制';
        document.getElementById('cauldron-status').textContent = '等待投放材料...';
        
        this.showResultModal(result);
        this.renderMaterials();
        this.renderCauldronContents();
        this.renderRecipes();
        this.updateUI();
        this.updateStirButton();
    },

    showResultModal: function(result) {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('result-title');
        const content = document.getElementById('result-content');

        if (result.success) {
            title.textContent = '✨ 炼制成功！';
            content.innerHTML = `
                <div class="result-potion">
                    <div class="result-potion-icon">${result.recipe.icon}</div>
                    <div class="result-potion-info">
                        <h3>${result.recipe.name} x${result.quantity}${result.isCrit ? ' 🔥暴击!' : ''}</h3>
                        <p>${result.recipe.description}</p>
                    </div>
                </div>
                <div class="result-stats">
                    <div class="result-stat">
                        <div class="result-stat-label">获得金币</div>
                        <div class="result-stat-value">+${result.goldGain}</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">获得经验</div>
                        <div class="result-stat-value">+${result.expGain}</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">成功率</div>
                        <div class="result-stat-value">${result.successRate.toFixed(0)}%</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">火候偏差</div>
                        <div class="result-stat-value">${result.heatDiff}</div>
                    </div>
                </div>
            `;
        } else {
            title.textContent = '💔 炼制失败';
            const failure = GameData.failureTypes[result.failureType];
            content.innerHTML = `
                <div class="result-failure">
                    <h3>${failure ? failure.name : '未知原因'}</h3>
                    <p>${result.message}</p>
                    <p style="margin-top: 10px; font-size: 0.8rem; color: #fca5a5;">
                        材料损失: ${failure ? failure.materialLoss : 0}单位 | 停滞时间: ${failure ? failure.delay : 0}s
                    </p>
                </div>
                <div class="result-stats">
                    <div class="result-stat">
                        <div class="result-stat-label">成功率</div>
                        <div class="result-stat-value">${result.successRate.toFixed(0)}%</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-label">火候偏差</div>
                        <div class="result-stat-value">${result.heatDiff}</div>
                    </div>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    },

    hideResultModal: function() {
        document.getElementById('result-modal').classList.add('hidden');
    },

    clearCauldron: function() {
        if (Game.clearCauldron()) {
            this.renderMaterials();
            this.renderCauldronContents();
            this.updateUI();
            this.updateStirButton();
        }
    },

    updateUI: function() {
        const state = Game.getState();

        document.getElementById('player-level').textContent = state.level;
        document.getElementById('current-exp').textContent = state.exp;
        document.getElementById('max-exp').textContent = GameData.getLevelExp(state.level);
        
        const expPercent = (state.exp / GameData.getLevelExp(state.level)) * 100;
        document.getElementById('exp-fill').style.width = expPercent + '%';

        document.getElementById('gold').textContent = state.gold;
        document.getElementById('potion-count').textContent = state.potionCount;

        this.renderBrewLog();
    },

    renderBrewLog: function() {
        const container = document.getElementById('brew-log');
        const state = Game.getState();

        container.innerHTML = state.brewLog.slice(0, 20).map(log => `
            <div class="log-entry ${log.type}">${log.message}</div>
        `).join('');
    },

    updateNPCMessage: function() {
        const messageEl = document.querySelector('.npc-message');
        if (messageEl) {
            messageEl.textContent = Game.getRandomTip();
        }
    },

    showPauseMenu: function() {
        Game.pause();
        document.getElementById('pause-menu').classList.remove('hidden');
    },

    hidePauseMenu: function() {
        Game.resume();
        document.getElementById('pause-menu').classList.add('hidden');
    },

    restartGame: function() {
        if (confirm('确定要重新开始吗？当前进度将会丢失！')) {
            Game.clearSave();
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('game-ui').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
            document.getElementById('continue-btn').style.display = 'none';
            this.selectedCharacter = null;
            document.querySelectorAll('.character-card').forEach(card => {
                card.classList.remove('selected');
            });
        }
    },

    quitToMenu: function() {
        Game.saveGame();
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.selectedCharacter = null;
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
};
