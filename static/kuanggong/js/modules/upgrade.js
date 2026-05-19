import { UPGRADES } from './config.js';

export class UpgradeSystem {
    getUpgradeCost(upgradeId, currentLevel) {
        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return Infinity;
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, currentLevel));
    }
    
    canUpgrade(state, upgradeId) {
        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return false;
        
        const currentLevel = state.upgrades[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) return false;
        
        const cost = this.getUpgradeCost(upgradeId, currentLevel);
        return state.gold >= cost;
    }
    
    upgrade(state, upgradeId) {
        console.log('Attempting upgrade:', upgradeId);
        console.log('Can upgrade:', this.canUpgrade(state, upgradeId));
        console.log('Current gold:', state.gold);
        console.log('Current level:', state.upgrades[upgradeId] || 0);
        
        if (!this.canUpgrade(state, upgradeId)) {
            state.addFloatingText(450, 300, '金币不足！', '#f87171');
            return false;
        }
        
        const upgrade = UPGRADES[upgradeId];
        const currentLevel = state.upgrades[upgradeId] || 0;
        const cost = this.getUpgradeCost(upgradeId, currentLevel);
        
        state.gold -= cost;
        state.upgrades[upgradeId] = currentLevel + 1;
        
        state.addFloatingText(450, 300, `${upgrade.icon} ${upgrade.name} Lv.${currentLevel + 1}！`, '#4ade80');
        
        console.log('Upgrade successful! New level:', state.upgrades[upgradeId]);
        console.log('Auto miner count:', state.getAutoMinerCount());
        
        state.save();
        
        return true;
    }
    
    getUpgradeInfo(upgradeId, currentLevel) {
        const upgrade = UPGRADES[upgradeId];
        if (!upgrade) return null;
        
        const isMaxed = currentLevel >= upgrade.maxLevel;
        const cost = isMaxed ? 0 : this.getUpgradeCost(upgradeId, currentLevel);
        const currentEffect = upgrade.effect(currentLevel);
        const nextEffect = isMaxed ? currentEffect : upgrade.effect(currentLevel + 1);
        
        return {
            ...upgrade,
            currentLevel,
            cost,
            isMaxed,
            currentEffect,
            nextEffect
        };
    }
}
