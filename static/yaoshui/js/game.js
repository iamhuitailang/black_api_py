const Game = {
    state: null,
    isPaused: false,
    isBrewing: false,
    selectedCharacter: null,
    autoSaveInterval: null,

    init: function() {
        this.state = this.createInitialState();
    },

    createInitialState: function() {
        return {
            character: null,
            level: 1,
            exp: 0,
            gold: 100,
            potionCount: 0,
            materials: {},
            cauldronContents: [],
            currentHeat: 50,
            stirCount: 0,
            unlockRecipes: ['health_potion', 'mana_potion'],
            brewLog: [],
            totalSuccess: 0,
            totalFailure: 0
        };
    },

    startNewGame: function(characterId) {
        this.state = this.createInitialState();
        this.state.character = characterId;
        
        const character = GameData.getCharacterById(characterId);
        if (character) {
            Object.values(GameData.materials).forEach(material => {
                this.state.materials[material.id] = material.startCount;
            });
        }
        
        this.selectedCharacter = characterId;
        this.saveGame();
        this.startAutoSave();
    },

    continueGame: function() {
        const savedState = Storage.load();
        if (savedState) {
            this.state = savedState;
            this.selectedCharacter = savedState.character;
            this.startAutoSave();
            return true;
        }
        return false;
    },

    startAutoSave: function() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            if (!this.isPaused && this.state) {
                this.saveGame();
            }
        }, 10000);
    },

    saveGame: function() {
        if (this.state) {
            Storage.save(this.state);
        }
    },

    clearSave: function() {
        Storage.clear();
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    },

    addMaterial: function(materialId) {
        if (!this.state || !this.state.materials[materialId] || this.state.materials[materialId] <= 0) {
            return false;
        }
        
        if (this.isBrewing) {
            return false;
        }
        
        const maxMaterials = 6;
        if (this.state.cauldronContents.length >= maxMaterials) {
            return false;
        }
        
        const maxSameMaterial = 3;
        const currentCount = this.state.cauldronContents.filter(m => m === materialId).length;
        if (currentCount >= maxSameMaterial) {
            return false;
        }
        
        this.state.materials[materialId]--;
        this.state.cauldronContents.push(materialId);
        
        const material = GameData.getMaterialById(materialId);
        if (material) {
            Renderer.addBrewParticles(material.color);
        }
        
        this.addLog(`投放了 ${GameData.getMaterialById(materialId)?.name || materialId}`, 'info');
        this.saveGame();
        return true;
    },

    removeLastMaterial: function() {
        if (this.isBrewing || this.state.cauldronContents.length === 0) {
            return false;
        }
        
        const lastMaterial = this.state.cauldronContents.pop();
        if (lastMaterial && this.state.materials[lastMaterial] !== undefined) {
            this.state.materials[lastMaterial]++;
        }
        
        this.saveGame();
        return true;
    },

    clearCauldron: function() {
        if (this.isBrewing) {
            return false;
        }
        
        this.state.cauldronContents.forEach(materialId => {
            if (this.state.materials[materialId] !== undefined) {
                this.state.materials[materialId]++;
            }
        });
        
        this.state.cauldronContents = [];
        this.state.stirCount = 0;
        this.saveGame();
        return true;
    },

    setHeat: function(heat) {
        this.state.currentHeat = Math.max(0, Math.min(100, heat));
        Renderer.setHeat(this.state.currentHeat);
    },

    stir: function() {
        if (this.isBrewing || this.state.cauldronContents.length === 0) {
            return false;
        }
        
        this.state.stirCount++;
        this.addLog(`搅拌了一次 (${this.state.stirCount}次)`, 'info');
        return true;
    },

    brew: function() {
        if (this.isBrewing || this.state.cauldronContents.length === 0) {
            return { success: false, reason: '坩埚为空或正在炼制中' };
        }

        const character = GameData.getCharacterById(this.state.character);
        if (!character) {
            return { success: false, reason: '未选择角色' };
        }

        this.isBrewing = true;
        Renderer.setBrewing(true);

        const contentsCopy = [...this.state.cauldronContents];
        const sortedContents = [...contentsCopy].sort().join(',');
        
        let matchedRecipe = null;
        for (const recipe of GameData.recipes) {
            if (!this.state.unlockRecipes.includes(recipe.id)) continue;
            
            const sortedIngredients = [...recipe.ingredients].sort().join(',');
            if (sortedIngredients === sortedContents) {
                matchedRecipe = recipe;
                break;
            }
        }

        const result = this.calculateResult(matchedRecipe, character);
        
        setTimeout(() => {
            this.completeBrew(result, matchedRecipe, contentsCopy);
        }, 2000);

        return { brewing: true };
    },

    calculateResult: function(recipe, character) {
        if (!recipe) {
            return {
                success: false,
                failureType: 'wrong_materials',
                message: '材料组合错误，没有匹配的配方！'
            };
        }

        const heatDiff = Math.abs(this.state.currentHeat - recipe.idealHeat);
        const stirDiff = Math.abs(this.state.stirCount - recipe.idealStirs);
        
        let successRate = character.stats.successRate;
        
        if (heatDiff > character.stats.heatTolerance) {
            successRate -= (heatDiff - character.stats.heatTolerance) * 5;
        }
        
        if (stirDiff > 2) {
            successRate -= (stirDiff - 2) * 8;
        }
        
        successRate = Math.max(10, Math.min(100, successRate));
        
        const roll = Math.random() * 100;
        const success = roll < successRate;
        
        if (success) {
            const isCrit = Math.random() < character.stats.critChance;
            const quantity = isCrit ? 2 : 1;
            const expGain = Math.floor(recipe.exp * character.stats.expBonus * (isCrit ? 1.5 : 1));
            const goldGain = recipe.value * quantity;
            
            return {
                success: true,
                recipe: recipe,
                quantity: quantity,
                isCrit: isCrit,
                expGain: expGain,
                goldGain: goldGain,
                successRate: successRate,
                heatDiff: heatDiff,
                stirDiff: stirDiff
            };
        } else {
            let failureType = 'high_tier_failure';
            if (heatDiff > character.stats.heatTolerance + 5) {
                failureType = 'heat_control';
            } else if (recipe.tier <= 2) {
                failureType = 'wrong_materials';
            }
            
            return {
                success: false,
                recipe: recipe,
                failureType: failureType,
                successRate: successRate,
                heatDiff: heatDiff,
                stirDiff: stirDiff,
                message: '炼制失败了...'
            };
        }
    },

    completeBrew: function(result, recipe, cauldronContents) {
        this.isBrewing = false;
        Renderer.setBrewing(false);
        
        const character = GameData.getCharacterById(this.state.character);
        
        if (result.success) {
            Renderer.addSuccessParticles();
            
            this.state.potionCount += result.quantity;
            this.state.gold += result.goldGain;
            this.state.totalSuccess++;
            
            this.addExp(result.expGain);
            
            this.checkRecipeUnlock();
            this.checkMaterialRestock();
            
            this.addLog(
                `✨ 成功炼制 ${result.recipe.name} x${result.quantity}${result.isCrit ? ' (暴击!)' : ''}`, 
                'success'
            );
        } else {
            Renderer.addFailureParticles();
            
            const failure = GameData.failureTypes[result.failureType];
            if (failure && character && cauldronContents && cauldronContents.length > 0) {
                const returnRate = Math.max(0, 1 - character.stats.materialLossRate / 100);
                const uniqueMaterials = [...new Set(cauldronContents)];
                uniqueMaterials.forEach(id => {
                    const usedCount = cauldronContents.filter(m => m === id).length;
                    const returnCount = Math.floor(usedCount * returnRate);
                    if (returnCount > 0) {
                        this.state.materials[id] = (this.state.materials[id] || 0) + returnCount;
                    }
                });
                const returnedMaterials = uniqueMaterials.filter(id => {
                    const usedCount = cauldronContents.filter(m => m === id).length;
                    return Math.floor(usedCount * returnRate) > 0;
                });
                if (returnedMaterials.length > 0) {
                    this.addLog(`📦 部分材料已返还：${returnedMaterials.map(id => GameData.getMaterialById(id)?.name).join('、')}`, 'info');
                }
            }
            
            this.state.totalFailure++;
            this.addLog(`💔 炼制失败：${result.message}`, 'failure');
        }
        
        this.state.cauldronContents = [];
        this.state.stirCount = 0;
        
        this.saveGame();
        
        if (typeof this.onBrewComplete === 'function') {
            this.onBrewComplete(result);
        }
    },

    addExp: function(amount) {
        this.state.exp += amount;
        
        let leveledUp = false;
        while (this.state.exp >= GameData.getLevelExp(this.state.level) && this.state.level < 100) {
            this.state.exp -= GameData.getLevelExp(this.state.level);
            this.state.level++;
            leveledUp = true;
            this.addLog(`🎉 升级了！当前等级：${this.state.level}`, 'success');
        }
        
        if (leveledUp) {
            this.checkRecipeUnlock();
        }
        
        return leveledUp;
    },

    checkRecipeUnlock: function() {
        GameData.recipes.forEach(recipe => {
            if (!this.state.unlockRecipes.includes(recipe.id) && this.state.level >= recipe.requiredLevel) {
                this.state.unlockRecipes.push(recipe.id);
                this.addLog(`📜 解锁新配方：${recipe.name}！`, 'success');
            }
        });
    },

    checkMaterialRestock: function() {
        const successCount = this.state.totalSuccess;
        if (successCount > 0 && successCount % 5 === 0) {
            Object.keys(this.state.materials).forEach(id => {
                const material = GameData.getMaterialById(id);
                if (material && material.weight === 'basic') {
                    this.state.materials[id] += 10;
                } else if (material && material.weight === 'support') {
                    this.state.materials[id] += 5;
                } else if (material && material.weight === 'advanced') {
                    this.state.materials[id] += 3;
                } else if (material) {
                    this.state.materials[id] += 2;
                }
            });
            this.addLog('🎁 NPC补给了一批材料！', 'info');
        }
    },

    addLog: function(message, type = 'info') {
        this.state.brewLog.unshift({
            message: message,
            type: type,
            timestamp: Date.now()
        });
        
        if (this.state.brewLog.length > 50) {
            this.state.brewLog = this.state.brewLog.slice(0, 50);
        }
    },

    getRandomTip: function() {
        const tips = GameData.npcTips;
        return tips[Math.floor(Math.random() * tips.length)];
    },

    pause: function() {
        this.isPaused = true;
    },

    resume: function() {
        this.isPaused = false;
    },

    getState: function() {
        return this.state;
    },

    getCharacter: function() {
        return GameData.getCharacterById(this.state.character);
    }
};
