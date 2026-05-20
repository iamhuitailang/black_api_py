import { ITEM_TYPES, ITEM_CONFIG, TRACK_LENGTH, TRACK_WIDTH } from './config.js';

export class ItemManager {
    constructor() {
        this.items = [];
        this.activeTraps = [];
        this.explosions = [];
        this.generateItems();
    }

    generateItems() {
        this.items = [];
        const itemTypes = Object.values(ITEM_TYPES);
        const numItems = Math.floor(TRACK_LENGTH / 600);
        
        let lastPosition = 600;
        for (let i = 0; i < numItems; i++) {
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            const config = ITEM_CONFIG[type];
            const position = lastPosition + 200 + Math.random() * 400;
            
            if (position > TRACK_LENGTH - 500) break;
            
            const lateralOffset = (Math.random() - 0.5) * (TRACK_WIDTH - 60);
            
            this.items.push({
                id: `item_${Date.now()}_${i}`,
                type,
                position,
                lateralOffset,
                ...config,
                collected: false
            });
            
            lastPosition = position;
        }
    }

    checkPickup(rider) {
        if (rider.heldItem) return null;
        
        for (const item of this.items) {
            if (item.collected) continue;
            
            const distanceDiff = Math.abs(rider.distance - item.position);
            const lateralDiff = Math.abs(rider.lateralPosition - item.lateralOffset);
            
            if (distanceDiff < 30 && lateralDiff < rider.config.pickupRange) {
                item.collected = true;
                rider.pickupItem({
                    type: item.type,
                    ...item
                });
                return item;
            }
        }
        return null;
    }

    useItem(rider, allRiders) {
        const item = rider.useItem();
        if (!item) return null;
        
        switch (item.type) {
            case ITEM_TYPES.BOOST:
                rider.applyEffect({
                    type: 'boost',
                    duration: item.duration,
                    multiplier: item.speedMultiplier
                });
                break;
                
            case ITEM_TYPES.SHIELD:
                rider.applyEffect({
                    type: 'shield',
                    duration: item.duration
                });
                break;
                
            case ITEM_TYPES.BOMB:
                this.createExplosion(rider, allRiders);
                break;
                
            case ITEM_TYPES.TRAP:
                this.placeTrap(rider);
                break;
        }
        
        return item;
    }

    createExplosion(rider, allRiders) {
        const explosion = {
            x: rider.distance,
            y: rider.lateralPosition,
            radius: ITEM_CONFIG[ITEM_TYPES.BOMB].radius,
            startTime: Date.now(),
            duration: 500
        };
        this.explosions.push(explosion);
        
        for (const other of allRiders) {
            if (other === rider) continue;
            const dist = Math.hypot(other.distance - rider.distance, other.lateralPosition - rider.lateralPosition);
            if (dist < explosion.radius) {
                other.takeBalanceDamage(ITEM_CONFIG[ITEM_TYPES.BOMB].balanceDamage);
            }
        }
    }

    placeTrap(rider) {
        const trap = {
            id: `trap_${Date.now()}`,
            position: rider.distance - 50,
            lateralOffset: rider.lateralPosition,
            duration: ITEM_CONFIG[ITEM_TYPES.TRAP].slowDuration,
            speedReduction: ITEM_CONFIG[ITEM_TYPES.TRAP].speedReduction,
            startTime: Date.now()
        };
        this.activeTraps.push(trap);
    }

    checkTrapCollision(rider) {
        for (let i = this.activeTraps.length - 1; i >= 0; i--) {
            const trap = this.activeTraps[i];
            
            if (Date.now() - trap.startTime > 10000) {
                this.activeTraps.splice(i, 1);
                continue;
            }
            
            const distanceDiff = Math.abs(rider.distance - trap.position);
            const lateralDiff = Math.abs(rider.lateralPosition - trap.lateralOffset);
            
            if (distanceDiff < 25 && lateralDiff < 30) {
                rider.slow(trap.duration);
                this.activeTraps.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    update(deltaTime) {
        this.explosions = this.explosions.filter(exp => 
            Date.now() - exp.startTime < exp.duration
        );
    }

    getItemsInRange(startDistance, endDistance) {
        return this.items.filter(item => 
            !item.collected && 
            item.position >= startDistance - 50 && 
            item.position <= endDistance + 50
        );
    }

    getTrapsInRange(startDistance, endDistance) {
        return this.activeTraps.filter(trap => 
            trap.position >= startDistance - 50 && 
            trap.position <= endDistance + 50
        );
    }

    serialize() {
        return {
            items: this.items,
            activeTraps: this.activeTraps
        };
    }

    static deserialize(data) {
        const manager = new ItemManager();
        manager.items = data.items || [];
        manager.activeTraps = data.activeTraps || [];
        return manager;
    }
}
