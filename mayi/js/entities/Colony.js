class Colony {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.COLONY.WIDTH;
        this.height = CONFIG.COLONY.HEIGHT;
        this.maxHp = CONFIG.COLONY.MAX_HP;
        this.hp = this.maxHp;
    }

    takeDamage(amount) {
        const defense = GameState.getDefense();
        const actualDamage = Math.max(1, amount * (1 - defense));
        this.hp = Math.max(0, this.hp - actualDamage);
        if (this.hp <= 0) {
            GameState.isGameOver = true;
        }
        return actualDamage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            maxHp: this.maxHp,
            hp: this.hp
        };
    }

    static deserialize(data) {
        const colony = new Colony(data.x, data.y);
        colony.width = data.width;
        colony.height = data.height;
        colony.maxHp = data.maxHp;
        colony.hp = data.hp;
        return colony;
    }
}
