export class AutoSellSystem {
    constructor() {
        this.sellTimer = 0;
        this.sellInterval = 5000;
        this.enabled = true;
    }
    
    update(state, deltaTime) {
        if (!this.enabled) return;
        
        const autoMinerCount = state.getAutoMinerCount();
        if (autoMinerCount === 0) return;
        
        this.sellTimer += deltaTime;
        
        if (this.sellTimer >= this.sellInterval) {
            this.sellTimer = 0;
            
            if (state.isInventoryFull()) {
                const earnings = state.sellAllOres();
                if (earnings > 0) {
                    state.addFloatingText(450, 300, `💰 自动售卖 +${Math.floor(earnings)}`, '#ffd700');
                }
            }
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
