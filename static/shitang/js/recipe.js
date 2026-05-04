/**
 * 菜谱系统模块
 * 负责菜谱的购买、升级和解锁
 */

const RecipeSystem = {
    /**
     * 购买菜谱
     * @param {string} recipeId - 菜谱ID
     * @returns {boolean} 是否购买成功
     */
    buyRecipe(recipeId) {
        const recipe = GameState.recipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            console.error(`找不到菜谱: ${recipeId}`);
            return false;
        }
        
        if (recipe.owned) {
            console.log(`菜谱 ${recipeId} 已经拥有`);
            return false;
        }
        
        // 检查解锁等级
        if (recipe.unlockLevel > GameState.restaurantLevel) {
            console.log(`需要餐厅等级 ${recipe.unlockLevel} 才能解锁此菜谱`);
            return false;
        }
        
        // 购买价格是升级到2星的价格
        const buyPrice = recipe.upgradePrices[1];
        
        if (GameState.gold < buyPrice) {
            console.log(`金币不足，需要 ${buyPrice} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= buyPrice;
        recipe.owned = true;
        recipe.stars = 1;
        
        console.log(`购买菜谱 ${recipe.name} 成功，花费 ${buyPrice} 金币`);
        return true;
    },

    /**
     * 升级菜谱星级
     * @param {string} recipeId - 菜谱ID
     * @returns {boolean} 是否升级成功
     */
    upgradeRecipe(recipeId) {
        const recipe = GameState.recipes.find(r => r.id === recipeId);
        
        if (!recipe) {
            console.error(`找不到菜谱: ${recipeId}`);
            return false;
        }
        
        if (!recipe.owned) {
            console.log(`还没有购买此菜谱`);
            return false;
        }
        
        if (recipe.stars >= 5) {
            console.log(`菜谱已经是最高星级`);
            return false;
        }
        
        const upgradePrice = recipe.upgradePrices[recipe.stars];
        
        if (GameState.gold < upgradePrice) {
            console.log(`金币不足，需要 ${upgradePrice} 金币`);
            return false;
        }
        
        // 扣除金币
        GameState.gold -= upgradePrice;
        recipe.stars++;
        
        console.log(`升级菜谱 ${recipe.name} 到 ${recipe.stars} 星成功，花费 ${upgradePrice} 金币`);
        return true;
    },

    /**
     * 获取菜谱的当前售价
     * @param {Object} recipe - 菜谱对象
     * @returns {number} 售价
     */
    getRecipePrice(recipe) {
        if (!recipe.owned) {
            return 0;
        }
        const starMultiplier = CONFIG.RECIPE_STAR_MULTIPLIERS[recipe.stars - 1];
        return Math.floor(recipe.basePrice * starMultiplier);
    },

    /**
     * 获取菜谱的下一次升级价格
     * @param {Object} recipe - 菜谱对象
     * @returns {number|null} 升级价格，如果已是最高级则返回 null
     */
    getNextUpgradePrice(recipe) {
        if (!recipe.owned || recipe.stars >= 5) {
            return null;
        }
        return recipe.upgradePrices[recipe.stars];
    },

    /**
     * 获取菜谱的星级显示
     * @param {number} stars - 星级
     * @returns {string} 星级显示字符串
     */
    getStarsDisplay(stars) {
        const fullStars = '★'.repeat(stars);
        const emptyStars = '☆'.repeat(5 - stars);
        return fullStars + emptyStars;
    }
};

// 导出 RecipeSystem 对象
window.RecipeSystem = RecipeSystem;