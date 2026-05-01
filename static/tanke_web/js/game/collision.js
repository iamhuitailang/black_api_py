const Collision = {
    checkRect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    },

    checkCircle(a, b) {
        const centerA = a.getCenter();
        const centerB = b.getCenter();
        const dx = centerA.x - centerB.x;
        const dy = centerA.y - centerB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusA = Math.max(a.width, a.height) / 2;
        const radiusB = Math.max(b.width, b.height) / 2;
        return distance < radiusA + radiusB;
    },

    checkPlayerEnemy(player, enemy) {
        if (!player.active || !enemy.active) return false;
        
        const playerBounds = player.getBounds();
        const enemyBounds = enemy.getBounds();
        
        playerBounds.x += 5;
        playerBounds.width -= 10;
        playerBounds.y += 5;
        playerBounds.height -= 10;
        
        enemyBounds.x += 3;
        enemyBounds.width -= 6;
        enemyBounds.y += 3;
        enemyBounds.height -= 6;
        
        return this.checkRect(playerBounds, enemyBounds);
    },

    checkBulletEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active || !bullet.isPlayer) return false;
        
        const bulletBounds = bullet.getBounds();
        const enemyBounds = enemy.getBounds();
        
        enemyBounds.x += 5;
        enemyBounds.width -= 10;
        enemyBounds.y += 5;
        enemyBounds.height -= 10;
        
        return this.checkRect(bulletBounds, enemyBounds);
    },

    checkBulletPlayer(bullet, player) {
        if (!bullet.active || !player.active || bullet.isPlayer || player.invincible) return false;
        
        const bulletBounds = bullet.getBounds();
        const playerBounds = player.getBounds();
        
        playerBounds.x += 8;
        playerBounds.width -= 16;
        playerBounds.y += 8;
        playerBounds.height -= 16;
        
        return this.checkRect(bulletBounds, playerBounds);
    },

    checkAllBulletsEnemies(bullets, enemies) {
        const collisions = [];
        
        for (const bullet of bullets) {
            if (!bullet.active || !bullet.isPlayer) continue;
            
            for (const enemy of enemies) {
                if (!enemy.active) continue;
                
                if (this.checkBulletEnemy(bullet, enemy)) {
                    collisions.push({
                        bullet: bullet,
                        enemy: enemy
                    });
                    break;
                }
            }
        }
        
        return collisions;
    },

    checkAllBulletsPlayer(bullets, player) {
        const collisions = [];
        
        for (const bullet of bullets) {
            if (!bullet.active || bullet.isPlayer) continue;
            
            if (this.checkBulletPlayer(bullet, player)) {
                collisions.push({
                    bullet: bullet,
                    player: player
                });
            }
        }
        
        return collisions;
    },

    checkSuicideCollision(player, enemies) {
        const collisions = [];
        
        for (const enemy of enemies) {
            if (!enemy.active || !enemy.config.isSuicide) continue;
            
            if (this.checkPlayerEnemy(player, enemy)) {
                collisions.push({
                    enemy: enemy,
                    player: player
                });
            }
        }
        
        return collisions;
    },

    createExplosionParticles(x, y, color, count = 15) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(
                x + Utils.random(-10, 10),
                y + Utils.random(-10, 10),
                color
            ));
        }
        return particles;
    },

    createMuzzleFlash(x, y, isPlayer) {
        return new MuzzleFlash(x, y, isPlayer);
    }
};

window.Collision = Collision;
