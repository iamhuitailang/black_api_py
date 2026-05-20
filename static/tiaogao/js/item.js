class ItemSystem {
    constructor() {
        this.activeEffects = [];
    }

    useItem(itemId, character, balanceSystem) {
        const itemConfig = GameConfig.ITEMS.find(i => i.id === itemId);
        if (!itemConfig) return false;

        if (!Storage.useItem(itemId)) {
            return false;
        }

        switch (itemConfig.effect) {
            case 'balanceBoost':
                character.balanceBoost = 15;
                this.addEffect(itemId, itemConfig.duration, () => {
                    character.balanceBoost = 0;
                });
                break;
            case 'windImmune':
                character.windImmune = true;
                this.addEffect(itemId, itemConfig.duration, () => {
                    character.windImmune = false;
                });
                break;
            case 'instantCalm':
                balanceSystem.calm();
                break;
            case 'safetySave':
                character.safetyRope = true;
                break;
        }

        return true;
    }

    addEffect(itemId, duration, onEnd) {
        const effect = {
            itemId,
            endTime: Date.now() + duration,
            onEnd
        };
        this.activeEffects.push(effect);
    }

    update() {
        const now = Date.now();
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            if (now >= effect.endTime) {
                if (effect.onEnd) {
                    effect.onEnd();
                }
                this.activeEffects.splice(i, 1);
            }
        }
    }

    checkSafetyRope(character, balanceSystem) {
        if (character.safetyRope && balanceSystem.isFalling()) {
            character.safetyRope = false;
            balanceSystem.balance *= 0.3;
            balanceSystem.velocity = 0;
            return true;
        }
        return false;
    }

    getRemainingTime(itemId) {
        const effect = this.activeEffects.find(e => e.itemId === itemId);
        if (!effect) return 0;
        return Math.max(0, effect.endTime - Date.now());
    }

    reset() {
        this.activeEffects.forEach(e => {
            if (e.onEnd) {
                e.onEnd();
            }
        });
        this.activeEffects = [];
    }

    serialize() {
        return {
            activeEffects: this.activeEffects.map(e => ({
                itemId: e.itemId,
                remaining: e.endTime - Date.now()
            }))
        };
    }

    deserialize(data, character) {
        if (data && data.activeEffects) {
            this.activeEffects = [];
            data.activeEffects.forEach(e => {
                const itemConfig = GameConfig.ITEMS.find(i => i.id === e.itemId);
                if (itemConfig) {
                    this.addEffect(e.itemId, e.remaining, () => {
                        switch (itemConfig.effect) {
                            case 'balanceBoost':
                                character.balanceBoost = 0;
                                break;
                            case 'windImmune':
                                character.windImmune = false;
                                break;
                        }
                    });
                }
            });
        }
    }
}
