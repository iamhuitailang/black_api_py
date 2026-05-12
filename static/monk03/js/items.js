class ItemGenerator {
    constructor() {
        this.lastGenerateHeight = 0;
        this.generateInterval = 3;
    }

    generate() {
        const heightDiff = gameState.height - this.lastGenerateHeight;
        
        if (heightDiff >= 60) {
            const itemTypes = this.getAvailableItemTypes();
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            
            const item = {
                type: type,
                height: gameState.height + 300 + Math.random() * 200,
                side: Math.random() > 0.5 ? 1 : -1
            };
            
            gameState.items.push(item);
            this.lastGenerateHeight = gameState.height;
        }
    }

    getAvailableItemTypes() {
        const types = [CONSTANTS.ITEM_TYPES.BANANA];
        
        if (Math.random() < 0.15) {
            const powerups = [
                CONSTANTS.ITEM_TYPES.SPEED_BANANA,
                CONSTANTS.ITEM_TYPES.SHIELD_LEAF,
                CONSTANTS.ITEM_TYPES.MAGNET,
                CONSTANTS.ITEM_TYPES.SPRING_SHOES
            ];
            types.push(powerups[Math.floor(Math.random() * powerups.length)]);
        }
        
        return types;
    }

    reset() {
        this.lastGenerateHeight = 0;
    }
}

const itemGenerator = new ItemGenerator();
