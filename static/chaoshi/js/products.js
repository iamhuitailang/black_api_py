class Product {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.type = type;
        this.name = type.name;
        this.emoji = type.emoji;
        this.price = type.price;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.spawnTime = Date.now();
    }
    
    update(deltaTime) {
        this.bobOffset += deltaTime * 0.003;
    }
    
    getBobY() {
        return Math.sin(this.bobOffset) * 5;
    }
    
    getState() {
        return {
            x: this.x,
            y: this.y,
            typeIndex: CONSTANTS.PRODUCT_TYPES.indexOf(this.type),
            collected: this.collected,
            bobOffset: this.bobOffset,
            spawnTime: this.spawnTime
        };
    }
    
    static fromState(state) {
        const product = new Product(
            state.x,
            state.y,
            CONSTANTS.PRODUCT_TYPES[state.typeIndex]
        );
        product.collected = state.collected;
        product.bobOffset = state.bobOffset;
        product.spawnTime = state.spawnTime;
        return product;
    }
}

class ProductManager {
    constructor() {
        this.products = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.maxProducts = 15;
        this.shelves = this.createShelves();
    }
    
    createShelves() {
        return [
            { x: 200, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 450, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 700, y: CONSTANTS.GROUND_Y - 120, width: 150 },
            { x: 950, y: CONSTANTS.GROUND_Y - 120, width: 150 }
        ];
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.products.length < this.maxProducts) {
            this.spawnProduct();
            this.spawnTimer = 0;
        }
        
        this.products.forEach(product => {
            if (!product.collected) {
                product.update(deltaTime);
            }
        });
        
        this.products = this.products.filter(p => !p.collected);
    }
    
    spawnProduct() {
        const productType = this.getRandomProductType();
        
        const shelf = this.shelves[Math.floor(Math.random() * this.shelves.length)];
        const x = shelf.x + Math.random() * (shelf.width - 40);
        const y = shelf.y - 40 + Math.random() * 20;
        
        const product = new Product(x, y, productType);
        this.products.push(product);
    }
    
    getRandomProductType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const type of CONSTANTS.PRODUCT_TYPES) {
            cumulative += type.rarity;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return CONSTANTS.PRODUCT_TYPES[0];
    }
    
    checkPickup(player) {
        const pickupRange = player.getPickupRange();
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        const pickedProducts = [];
        
        this.products.forEach(product => {
            if (product.collected) return;
            
            const productCenterX = product.x + product.width / 2;
            const productCenterY = product.y + product.height / 2 + product.getBobY();
            
            const dx = playerCenterX - productCenterX;
            const dy = playerCenterY - productCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= pickupRange) {
                product.collected = true;
                pickedProducts.push(product);
            }
        });
        
        return pickedProducts;
    }
    
    getState() {
        return {
            products: this.products.map(p => p.getState()),
            spawnTimer: this.spawnTimer,
            spawnInterval: this.spawnInterval
        };
    }
    
    loadState(state) {
        this.products = state.products.map(p => Product.fromState(p));
        this.spawnTimer = state.spawnTimer;
        this.spawnInterval = state.spawnInterval;
    }
    
    reset() {
        this.products = [];
        this.spawnTimer = 0;
    }
}