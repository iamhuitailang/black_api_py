import { MINE_LAYERS, ORE_TYPES, CHARACTERS } from './config.js';

export class OfflineReward {
    static calculate(state, lastSaveTime, currentTime) {
        const offlineSeconds = Math.min((currentTime - lastSaveTime) / 1000, 8 * 3600);
        
        if (offlineSeconds < 60) {
            return null;
        }
        
        const autoMinerCount = state.getAutoMinerCount();
        if (autoMinerCount === 0) {
            return null;
        }
        
        const character = CHARACTERS[state.selectedCharacter];
        let efficiency = 0.5;
        
        if (character.buff.autoEfficiency) {
            efficiency += character.buff.autoEfficiency;
        }
        
        const baseMinesPerSecond = 1 * efficiency * state.getMiningSpeedMultiplier();
        const totalMines = Math.floor(baseMinesPerSecond * offlineSeconds * autoMinerCount);
        
        const reward = {
            offlineSeconds,
            ores: {},
            gold: 0
        };
        
        const layer = MINE_LAYERS[state.currentLayer];
        const oreCounts = {};
        
        for (let i = 0; i < totalMines; i++) {
            const rand = Math.random();
            let cumulative = 0;
            
            for (const ore of layer.ores) {
                cumulative += ore.chance;
                if (rand < cumulative) {
                    oreCounts[ore.type] = (oreCounts[ore.type] || 0) + 1;
                    break;
                }
            }
        }
        
        let bonusChance = layer.rareBonus;
        if (character.buff.rareChance) {
            bonusChance += character.buff.rareChance;
        }
        
        Object.keys(oreCounts).forEach(oreId => {
            let count = oreCounts[oreId];
            const bonusCount = Math.floor(count * bonusChance * 0.3);
            count += bonusCount;
            
            reward.ores[oreId] = count;
        });
        
        const capacity = state.getBackpackCapacity();
        let totalOres = Object.values(reward.ores).reduce((a, b) => a + b, 0);
        
        if (totalOres > capacity * 0.5) {
            const ratio = (capacity * 0.5) / totalOres;
            Object.keys(reward.ores).forEach(oreId => {
                reward.ores[oreId] = Math.floor(reward.ores[oreId] * ratio);
            });
            totalOres = Object.values(reward.ores).reduce((a, b) => a + b, 0);
        }
        
        const sellRatio = 0.3;
        Object.keys(reward.ores).forEach(oreId => {
            const ore = ORE_TYPES[oreId.toUpperCase()];
            if (ore) {
                const sellCount = Math.floor(reward.ores[oreId] * sellRatio);
                reward.gold += sellCount * ore.price * state.getSellMultiplier();
                reward.ores[oreId] -= sellCount;
            }
        });
        
        return reward;
    }
}
