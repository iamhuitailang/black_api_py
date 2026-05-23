const ItemSystem = {
    items: [],
    heldItem: null,
    spawnTimer: 0,
    spawnInterval: 3000,

    init(levelConfig) {
        this.items = [];
        this.heldItem = null;
        this.spawnTimer = 0;
        this.spawnInterval = Math.max(2000, 4000 - levelConfig.id * 500);
    },

    generateItems(levelConfig, trackLength) {
        const itemTypes = Object.keys(GameConfig.ITEMS);
        const count = levelConfig.itemCount;

        for (let i = 0; i < count; i++) {
            const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            const config = GameConfig.ITEMS[type];

            this.items.push({
                id: `item_${i}_${Date.now()}`,
                type,
                config,
                x: this.randomPosition().x,
                y: 200 + Math.random() * (trackLength - 400),
                collected: false,
                bobOffset: Math.random() * Math.PI * 2
            });
        }

        return this.items;
    },

    randomPosition() {
        const padding = 60;
        const trackWidth = GameConfig.CANVAS.TRACK_WIDTH;
        return {
            x: padding + Math.random() * (trackWidth - padding * 2),
            y: 0
        };
    },

    update(deltaTime, characterSystem) {
        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnRandomItem();
        }

        const magnetRange = characterSystem.getMagnetRange();
        if (magnetRange > 0) {
            const currentChar = characterSystem.getCurrent();
            if (currentChar) {
                this.items.forEach(item => {
                    if (!item.collected) {
                        const dist = Math.hypot(item.x - currentChar.x, item.y - currentChar.y);
                        if (dist < magnetRange && dist > currentChar.pickupRange) {
                            const angle = Math.atan2(currentChar.y - item.y, currentChar.x - item.x);
                            const pullSpeed = 3;
                            item.x += Math.cos(angle) * pullSpeed;
                            item.y += Math.sin(angle) * pullSpeed;
                        }
                    }
                });
            }
        }
    },

    spawnRandomItem() {
        const itemTypes = Object.keys(GameConfig.ITEMS);
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        const config = GameConfig.ITEMS[type];

        const currentChar = CharacterSystem.getCurrent();
        if (!currentChar) return;

        this.items.push({
            id: `item_spawn_${Date.now()}`,
            type,
            config,
            x: this.randomPosition().x,
            y: currentChar.y + 300 + Math.random() * 200,
            collected: false,
            bobOffset: Math.random() * Math.PI * 2
        });
    },

    checkPickup(characterSystem) {
        const char = characterSystem.getCurrent();
        if (!char || char.finished) return null;

        const pickupRange = characterSystem.getPickupRange();

        for (const item of this.items) {
            if (item.collected) continue;

            const dist = Math.hypot(item.x - char.x, item.y - char.y);
            if (dist < pickupRange + item.config.size / 2) {
                item.collected = true;
                return item;
            }
        }
        return null;
    },

    pickUpItem(item) {
        if (item.config.type === 'score') {
            return { score: item.config.effect.score };
        }

        if (item.config.effect.staminaRestore) {
            CharacterSystem.restoreStamina(item.config.effect.staminaRestore);
            return { stamina: item.config.effect.staminaRestore };
        }

        this.heldItem = item;
        return { held: true };
    },

    useHeldItem() {
        if (!this.heldItem) return false;

        const config = this.heldItem.config;
        const effects = config.effect;

        for (const [key, value] of Object.entries(effects)) {
            if (key === 'staminaRestore') {
                CharacterSystem.restoreStamina(value);
            } else if (key === 'speedMultiplier') {
                CharacterSystem.addEffect({
                    type: 'speedMultiplier',
                    value,
                    duration: config.duration
                });
            } else if (key === 'shield') {
                CharacterSystem.addEffect({
                    type: 'shield',
                    value: true,
                    duration: config.duration
                });
            } else if (key === 'magnetRange') {
                CharacterSystem.addEffect({
                    type: 'magnetRange',
                    value,
                    duration: config.duration
                });
            } else if (key === 'reverseControl') {
                CharacterSystem.addEffect({
                    type: 'reverseControl',
                    value: true,
                    duration: config.duration
                });
            }
        }

        this.heldItem = null;
        return true;
    },

    getHeldItem() {
        return this.heldItem;
    },

    clearCollected() {
        this.items = this.items.filter(item => !item.collected);
    },

    getItemsInView(viewY, viewHeight) {
        return this.items.filter(item => {
            return !item.collected &&
                   item.y > viewY - 50 &&
                   item.y < viewY + viewHeight + 50;
        });
    }
};