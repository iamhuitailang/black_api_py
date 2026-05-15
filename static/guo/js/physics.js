const Physics = {
    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    checkAttackHit(attacker, defender) {
        if (attacker.state !== 'attack' && !attacker.specialActive) return false;
        
        const hitbox = attacker.getAttackHitbox();
        const defenderBox = {
            x: defender.x,
            y: defender.y,
            width: defender.width,
            height: defender.height
        };
        
        return this.checkCollision(hitbox, defenderBox);
    },

    getDistance(a, b) {
        const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
        const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    },

    getHorizontalDistance(a, b) {
        return Math.abs((a.x + a.width / 2) - (b.x + b.width / 2));
    },

    isInDirection(from, to, direction) {
        const toX = to.x + to.width / 2;
        const fromX = from.x + from.width / 2;
        
        if (direction === 1) {
            return toX > fromX;
        } else {
            return toX < fromX;
        }
    }
};