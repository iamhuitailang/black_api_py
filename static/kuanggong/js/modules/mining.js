import { ORE_TYPES, MINE_LAYERS, CHARACTERS, CANVAS_CONFIG } from './config.js';

export class MiningSystem {
    constructor() {
        this.autoMineTimer = 0;
        this.baseMineInterval = 1000;
    }
    
    manualMine(state) {
        if (state.isInventoryFull()) {
            state.addFloatingText(450, 300, '背包已满！', '#f87171');
            return false;
        }
        
        if (!state.currentRock) return false;
        
        const character = CHARACTERS[state.selectedCharacter];
        let damage = state.getPickaxeDamage();
        
        if (character.buff.miningSpeed) {
            damage *= (1 + character.buff.miningSpeed);
        }
        
        state.rockHealth -= damage;
        
        const ore = ORE_TYPES[state.currentRock.type.toUpperCase()] || ORE_TYPES.STONE;
        const { x, y, width, height } = CANVAS_CONFIG.mineArea;
        const rockX = x + width / 2;
        const rockY = y + height / 2 + 50;
        
        for (let i = 0; i < 5; i++) {
            state.addParticle(
                rockX + (Math.random() - 0.5) * 60,
                rockY + (Math.random() - 0.5) * 40,
                'ore',
                ore.color
            );
        }
        
        state.addFloatingText(rockX, rockY - 50, `-${Math.floor(damage)}`, '#fbbf24');
        
        if (state.rockHealth <= 0) {
            this.breakRock(state, rockX, rockY);
        }
        
        return true;
    }
    
    breakRock(state, rockX, rockY) {
        const ore = ORE_TYPES[state.currentRock.type.toUpperCase()] || ORE_TYPES.STONE;
        const character = CHARACTERS[state.selectedCharacter];
        
        let amount = 1;
        let bonusChance = MINE_LAYERS[state.currentLayer].rareBonus;
        
        if (character.buff.rareChance) {
            bonusChance += character.buff.rareChance;
        }
        
        if (Math.random() < bonusChance) {
            amount = 2;
            state.addFloatingText(rockX, rockY - 80, '🎁 双倍掉落！', '#ffd700');
        }
        
        const added = state.addOre(state.currentRock.type, amount);
        
        if (added) {
            state.addFloatingText(rockX, rockY - 100, `+${amount} ${ore.name}`, ore.color);
            
            for (let i = 0; i < 15; i++) {
                state.addParticle(
                    rockX + (Math.random() - 0.5) * 100,
                    rockY + (Math.random() - 0.5) * 60,
                    'ore',
                    ore.color
                );
            }
        }
        
        state.currentRock = null;
        state.rockHealth = 0;
    }
    
    updateAutoMine(state, deltaTime) {
        const autoMinerCount = state.getAutoMinerCount();
        if (autoMinerCount === 0) return;
        
        const character = CHARACTERS[state.selectedCharacter];
        let efficiency = 1;
        
        if (character.buff.autoEfficiency) {
            efficiency += character.buff.autoEfficiency;
        }
        
        const mineInterval = this.baseMineInterval / (efficiency * state.getMiningSpeedMultiplier());
        
        this.autoMineTimer += deltaTime;
        
        const minesPerUpdate = Math.floor(this.autoMineTimer / mineInterval);
        
        if (minesPerUpdate > 0) {
            this.autoMineTimer %= mineInterval;
            
            for (let i = 0; i < minesPerUpdate * autoMinerCount; i++) {
                if (state.isInventoryFull()) {
                    break;
                }
                this.autoMineOnce(state);
            }
        }
    }
    
    autoMineOnce(state) {
        if (!state.currentRock) {
            const layer = MINE_LAYERS[state.currentLayer];
            const rand = Math.random();
            let cumulative = 0;
            let selectedOre = layer.ores[0];
            
            for (const ore of layer.ores) {
                cumulative += ore.chance;
                if (rand < cumulative) {
                    selectedOre = ore;
                    break;
                }
            }
            
            state.currentRock = { type: selectedOre.type };
            state.rockMaxHealth = 10 + state.currentLayer * 5;
            state.rockHealth = state.rockMaxHealth;
        }
        
        const character = CHARACTERS[state.selectedCharacter];
        let damage = state.getPickaxeDamage() * 0.5;
        
        if (character.buff.miningSpeed) {
            damage *= (1 + character.buff.miningSpeed);
        }
        
        state.rockHealth -= damage;
        
        if (state.rockHealth <= 0) {
            const ore = ORE_TYPES[state.currentRock.type.toUpperCase()] || ORE_TYPES.STONE;
            let amount = 1;
            
            let bonusChance = MINE_LAYERS[state.currentLayer].rareBonus;
            if (character.buff.rareChance) {
                bonusChance += character.buff.rareChance;
            }
            
            if (Math.random() < bonusChance * 0.5) {
                amount = 2;
            }
            
            state.addOre(state.currentRock.type, amount);
            state.currentRock = null;
            state.rockHealth = 0;
        }
    }
    
    changeLayer(state, direction) {
        const newLayer = state.currentLayer + direction;
        
        if (newLayer < 0 || newLayer >= MINE_LAYERS.length) {
            return false;
        }
        
        if (!state.unlockedLayers.includes(newLayer)) {
            const layer = MINE_LAYERS[newLayer];
            if (layer.unlockCost.type !== 'none') {
                if (!state.canAfford(layer.unlockCost.amount, layer.unlockCost.type)) {
                    state.addFloatingText(450, 300, `需要 ${layer.unlockCost.amount} ${layer.unlockCost.type === 'gold' ? '金币' : ORE_TYPES[layer.unlockCost.type.toUpperCase()].name}`, '#f87171');
                    return false;
                }
                state.spendResource(layer.unlockCost.amount, layer.unlockCost.type);
            }
            state.unlockLayer(newLayer);
            state.addFloatingText(450, 300, `🎉 解锁 ${layer.name}！`, '#ffd700');
        }
        
        state.currentLayer = newLayer;
        state.currentRock = null;
        state.rockHealth = 0;
        state.save();
        
        return true;
    }
}
