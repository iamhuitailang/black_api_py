const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },

    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    getPointOnPath(path, distance) {
        let accumulated = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const segmentLength = this.distance(
                path[i].x, path[i].y,
                path[i + 1].x, path[i + 1].y
            );
            
            if (accumulated + segmentLength >= distance) {
                const remaining = distance - accumulated;
                const t = remaining / segmentLength;
                return {
                    x: this.lerp(path[i].x, path[i + 1].x, t),
                    y: this.lerp(path[i].y, path[i + 1].y, t),
                    segmentIndex: i
                };
            }
            accumulated += segmentLength;
        }
        return { ...path[path.length - 1], segmentIndex: path.length - 1, endOfPath: true };
    },

    getPathLength(path) {
        let length = 0;
        for (let i = 0; i < path.length - 1; i++) {
            length += this.distance(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
        }
        return length;
    },

    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },

    pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    },

    findClosestEnemy(enemies, x, y, range = Infinity, filterFlying = false, groundOnly = false) {
        let closest = null;
        let closestDist = range;

        for (const enemy of enemies) {
            if (enemy.dead) continue;
            if (filterFlying && enemy.flying) continue;
            if (groundOnly && enemy.flying) continue;
            
            const dist = this.distance(x, y, enemy.x, enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        return closest;
    },

    findEnemiesInRange(enemies, x, y, range, filterFlying = false) {
        const result = [];
        for (const enemy of enemies) {
            if (enemy.dead) continue;
            if (filterFlying && enemy.flying) continue;
            
            if (this.pointInCircle(enemy.x, enemy.y, x, y, range)) {
                result.push(enemy);
            }
        }
        return result;
    },

    calculateDamage(baseDamage, armor, ignoreArmor = false) {
        const effectiveArmor = ignoreArmor ? 0 : armor;
        const reduction = effectiveArmor / (effectiveArmor + 100);
        return Math.floor(baseDamage * (1 - reduction));
    },

    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInQuad(t) {
        return t * t;
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
};
