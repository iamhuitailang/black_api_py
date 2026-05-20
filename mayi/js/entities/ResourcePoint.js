class ResourcePoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxAmount = CONFIG.RESOURCE_POINTS.FOOD_AMOUNT;
        this.amount = this.maxAmount;
        this.size = 20;
        this.regenTimer = 0;
        this.isEmpty = false;
        this.type = Math.random() > 0.5 ? 'leaf' : 'berry';
    }

    gather(amount) {
        if (this.isEmpty) return 0;
        
        const gathered = Math.min(amount, this.amount);
        this.amount -= gathered;
        
        if (this.amount <= 0) {
            this.isEmpty = true;
            this.regenTimer = CONFIG.RESOURCE_POINTS.REGEN_TIME;
        }
        
        return gathered;
    }

    update(deltaTime) {
        if (this.isEmpty) {
            this.regenTimer -= deltaTime;
            if (this.regenTimer <= 0) {
                this.amount = this.maxAmount;
                this.isEmpty = false;
                this.type = Math.random() > 0.5 ? 'leaf' : 'berry';
            }
        }
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            maxAmount: this.maxAmount,
            amount: this.amount,
            size: this.size,
            regenTimer: this.regenTimer,
            isEmpty: this.isEmpty,
            type: this.type
        };
    }

    static deserialize(data) {
        const point = new ResourcePoint(data.x, data.y);
        point.maxAmount = data.maxAmount;
        point.amount = data.amount;
        point.size = data.size;
        point.regenTimer = data.regenTimer;
        point.isEmpty = data.isEmpty;
        point.type = data.type;
        return point;
    }
}
