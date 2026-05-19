import { ORE_TYPES, UPGRADES, GAME_STATUS, AUTO_MINER_STATUS } from './config.js';
import { Storage } from './storage.js';

export class GameState {
    constructor() {
        this.status = GAME_STATUS.MENU;
        this.selectedCharacter = 0;
        this.gold = 0;
        this.currentLayer = 0;
        this.unlockedLayers = [0];
        
        this.inventory = {};
        Object.values(ORE_TYPES).forEach(ore => {
            this.inventory[ore.id] = 0;
        });
        
        this.upgrades = {};
        Object.keys(UPGRADES).forEach(key => {
            this.upgrades[key] = 0;
        });
        
        this.autoMiners = [];
        this.miningProgress = 0;
        this.currentRock = null;
        this.rockHealth = 0;
        this.rockMaxHealth = 10;
        
        this.totalMined = 0;
        this.totalGoldEarned = 0;
        this.playTime = 0;
        this.lastSaveTime = 0;
        
        this.particles = [];
        this.floatingTexts = [];
    }
    
    getPickaxeDamage() {
        return UPGRADES.pickaxe.effect(this.upgrades.pickaxe);
    }
    
    getBackpackCapacity() {
        return UPGRADES.backpack.effect(this.upgrades.backpack);
    }
    
    getMiningSpeedMultiplier() {
        return UPGRADES.efficiency.effect(this.upgrades.efficiency);
    }
    
    getSellMultiplier() {
        return UPGRADES.sellLevel.effect(this.upgrades.sellLevel);
    }
    
    getAutoMinerCount() {
        return UPGRADES.autoMiner.effect(this.upgrades.autoMiner);
    }
    
    getTotalInventory() {
        return Object.values(this.inventory).reduce((a, b) => a + b, 0);
    }
    
    isInventoryFull() {
        return this.getTotalInventory() >= this.getBackpackCapacity();
    }
    
    canAfford(cost, type = 'gold') {
        if (type === 'gold') {
            return this.gold >= cost;
        }
        return (this.inventory[type] || 0) >= cost;
    }
    
    spendResource(amount, type = 'gold') {
        if (type === 'gold') {
            this.gold -= amount;
        } else {
            this.inventory[type] = (this.inventory[type] || 0) - amount;
        }
    }
    
    addOre(oreId, amount = 1) {
        if (this.isInventoryFull()) return false;
        const space = this.getBackpackCapacity() - this.getTotalInventory();
        const actualAmount = Math.min(amount, space);
        this.inventory[oreId] = (this.inventory[oreId] || 0) + actualAmount;
        this.totalMined += actualAmount;
        return actualAmount > 0;
    }
    
    sellOre(oreId, amount) {
        const ore = Object.values(ORE_TYPES).find(o => o.id === oreId);
        if (!ore || !this.inventory[oreId]) return 0;
        
        const sellAmount = Math.min(amount, this.inventory[oreId]);
        const earnings = sellAmount * ore.price * this.getSellMultiplier();
        
        this.inventory[oreId] -= sellAmount;
        this.gold += earnings;
        this.totalGoldEarned += earnings;
        
        return earnings;
    }
    
    sellAllOres() {
        let totalEarnings = 0;
        Object.keys(this.inventory).forEach(oreId => {
            if (this.inventory[oreId] > 0) {
                totalEarnings += this.sellOre(oreId, this.inventory[oreId]);
            }
        });
        return totalEarnings;
    }
    
    unlockLayer(layerId) {
        if (!this.unlockedLayers.includes(layerId)) {
            this.unlockedLayers.push(layerId);
            return true;
        }
        return false;
    }
    
    addParticle(x, y, type, color) {
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 3 - 1,
            life: 30,
            maxLife: 30,
            type,
            color
        });
    }
    
    addFloatingText(x, y, text, color = '#fff') {
        this.floatingTexts.push({
            x, y,
            text,
            color,
            life: 60,
            maxLife: 60
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
            return p.life > 0;
        });
        
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y -= 1;
            t.life--;
            return t.life > 0;
        });
    }
    
    toJSON() {
        return {
            status: this.status,
            selectedCharacter: this.selectedCharacter,
            gold: this.gold,
            currentLayer: this.currentLayer,
            unlockedLayers: this.unlockedLayers,
            inventory: this.inventory,
            upgrades: this.upgrades,
            totalMined: this.totalMined,
            totalGoldEarned: this.totalGoldEarned,
            playTime: this.playTime,
            lastSaveTime: this.lastSaveTime
        };
    }
    
    static fromJSON(data) {
        const state = new GameState();
        state.status = data.status !== undefined ? data.status : GAME_STATUS.MENU;
        state.selectedCharacter = data.selectedCharacter !== undefined ? data.selectedCharacter : 0;
        state.gold = data.gold !== undefined ? data.gold : 0;
        state.currentLayer = data.currentLayer !== undefined ? data.currentLayer : 0;
        state.unlockedLayers = data.unlockedLayers || [0];
        
        if (data.inventory) {
            Object.keys(state.inventory).forEach(key => {
                state.inventory[key] = data.inventory[key] || 0;
            });
        }
        
        if (data.upgrades) {
            Object.keys(state.upgrades).forEach(key => {
                state.upgrades[key] = data.upgrades[key] !== undefined ? data.upgrades[key] : 0;
            });
        }
        
        state.totalMined = data.totalMined !== undefined ? data.totalMined : 0;
        state.totalGoldEarned = data.totalGoldEarned !== undefined ? data.totalGoldEarned : 0;
        state.playTime = data.playTime !== undefined ? data.playTime : 0;
        state.lastSaveTime = data.lastSaveTime !== undefined ? data.lastSaveTime : 0;
        return state;
    }
    
    save() {
        this.lastSaveTime = Date.now();
        Storage.save(this.toJSON());
    }
    
    static load() {
        const data = Storage.load();
        if (data) {
            return GameState.fromJSON(data);
        }
        return null;
    }
}
