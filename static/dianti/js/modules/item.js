const Item = (() => {
    class Item {
        constructor(type, x, y) {
            const config = Constants.ITEM_TYPES[type];
            this.type = type;
            this.name = config.name;
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 30;
            this.value = config.value;
            this.color = config.color;
            this.icon = config.icon;
            this.collected = false;
            this.animationFrame = 0;
        }
        
        update(deltaTime) {
            this.animationFrame += deltaTime;
        }
        
        checkCollision(entity) {
            if (this.collected) return false;
            
            return (
                entity.x < this.x + this.width &&
                entity.x + entity.width > this.x &&
                entity.y < this.y + this.height &&
                entity.y + entity.height > this.y
            );
        }
        
        collect() {
            this.collected = true;
            return {
                type: this.type,
                value: this.value
            };
        }
        
        getState() {
            return {
                type: this.type,
                x: this.x,
                y: this.y,
                collected: this.collected
            };
        }
        
        restoreState(state) {
            this.collected = state.collected;
        }
    }
    
    const createItem = (type, x, y) => {
        return new Item(type, x, y);
    };
    
    const generateRandomItem = (elevator) => {
        const types = Object.keys(Constants.ITEM_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        const x = elevator.x + 50 + Math.random() * (elevator.width - 100);
        const y = elevator.y + 100 + Math.random() * (elevator.height - 200);
        return new Item(type, x, y);
    };
    
    return {
        Item,
        createItem,
        generateRandomItem
    };
})();