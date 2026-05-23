var Physics = (function() {
    var GRAVITY = 0.4;
    var AIR_RESISTANCE = 0.998;
    var PENDULUM_DAMPING = 0.995;

    function updatePendulum(player, dt) {
        if (!player.rope) return;

        var rope = player.rope;
        var anchorX = rope.x;
        var anchorY = rope.y + rope.length;
        var L = rope.length;

        var g = GRAVITY;
        var theta = player.angle || 0;
        var omega = player.angularVel || 0;

        var alpha = -(g / L) * Math.sin(theta);
        omega += alpha * dt;
        omega *= PENDULUM_DAMPING;
        theta += omega * dt;

        player.x = anchorX + Math.sin(theta) * L;
        player.y = anchorY + Math.cos(theta) * L;

        player.angle = theta;
        player.angularVel = omega;

        player.vx = omega * L * Math.cos(theta);
        player.vy = -omega * L * Math.sin(theta);
    }

    function updateProjectile(player, dt, wind) {
        player.vy += GRAVITY * dt * 60;

        if (wind && wind.enabled) {
            player.vx += wind.force * wind.direction * dt * 60;
        }

        player.vx *= AIR_RESISTANCE;
        player.vy *= AIR_RESISTANCE;

        player.x += player.vx * dt * 60;
        player.y += player.vy * dt * 60;
    }

    function checkPlatformCollision(player, platforms) {
        if (player.vy <= 0) return null;

        var playerBottom = player.y;
        var playerLeft = player.x - player.width / 2;
        var playerRight = player.x + player.width / 2;

        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];

            if (p.type === 'opening' && !p.isOpen) continue;

            var platTop = p.y;
            var platLeft = p.x;
            var platRight = p.x + p.width;

            if (playerRight > platLeft && playerLeft < platRight) {
                if (playerBottom >= platTop && playerBottom < platTop + 30) {
                    return {
                        platform: p,
                        y: platTop
                    };
                }
            }
        }
        return null;
    }

    function checkObstacleCollision(player, obstacles) {
        var px = player.x;
        var py = player.y - player.height / 2;
        var pr = Math.min(player.width, player.height) / 2;

        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];

            if (obs.type === 'rock') {
                if (!obs.currentX && obs.currentX !== 0) continue;
                var ox = obs.currentX;
                var oy = obs.currentY;
                var or = obs.radius + pr;
                var dx = px - ox;
                var dy = py - oy;
                if (dx * dx + dy * dy < or * or) {
                    return true;
                }
            } else if (obs.type === 'wood') {
                if (!obs.currentX && obs.currentX !== 0) continue;
                var woodLeft = obs.currentX - obs.width / 2;
                var woodRight = obs.currentX + obs.width / 2;
                var woodTop = obs.currentY - obs.height / 2;
                var woodBottom = obs.currentY + obs.height / 2;

                if (px + pr > woodLeft && px - pr < woodRight &&
                    py + pr > woodTop && py - pr < woodBottom) {
                    return true;
                }
            }
        }
        return false;
    }

    function updateObstacles(obstacles, time, dt) {
        for (var i = 0; i < obstacles.length; i++) {
            var obs = obstacles[i];

            if (obs.type === 'rock') {
                if (obs.baseY === undefined) obs.baseY = obs.baseX;
                obs.currentX = obs.baseX;
                obs.currentY = obs.baseY + Math.sin(time * 0.002 * (obs.speed || 1) + (obs.phase || 0)) * (obs.range || 30);
            } else if (obs.type === 'wood') {
                if (obs.baseX === undefined) continue;
                obs.currentX = obs.baseX + Math.sin(time * 0.002 * (obs.speed || 1) + (obs.phase || 0)) * (obs.range || 40);
                obs.currentY = obs.baseY;
            }
        }
    }

    function updatePlatforms(platforms, time) {
        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            if (p.type === 'opening') {
                var cycle = time * 0.001;
                var phase = (cycle + (p.phase || 0)) % (p.period || 3);
                p.isOpen = phase < (p.openDuration || 1.5);
            }
        }
    }

    function releaseFromRope(player) {
        if (!player.rope) return;

        var angle = player.angle || 0;
        var omega = player.angularVel || 0;
        var L = player.rope.length;

        var tangentSpeed = omega * L;
        player.vx = tangentSpeed * Math.cos(angle);
        player.vy = -tangentSpeed * Math.sin(angle);

        player.vy -= 5 + player.power * 3;
        player.vx *= 1.3;

        player.rope = null;
        player.isSwinging = false;
        player.angularVel = 0;
    }

    function checkOutOfBounds(player, levelData) {
        if (player.y > levelData.deathY) return true;
        if (player.x < -100) return true;
        return false;
    }

    return {
        updatePendulum: updatePendulum,
        updateProjectile: updateProjectile,
        checkPlatformCollision: checkPlatformCollision,
        checkObstacleCollision: checkObstacleCollision,
        updateObstacles: updateObstacles,
        updatePlatforms: updatePlatforms,
        releaseFromRope: releaseFromRope,
        checkOutOfBounds: checkOutOfBounds
    };
})();
