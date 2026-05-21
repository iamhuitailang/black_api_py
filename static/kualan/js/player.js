const Player = (function() {
    function create(laneIndex) {
        return {
            x: 0,
            y: 0,
            lane: laneIndex,
            speed: 0,
            maxSpeed: 12,
            acceleration: 0.5,
            deceleration: 0.015,
            isJumping: false,
            jumpHeight: 0,
            jumpVelocity: 0,
            jumpStartTime: 0,
            hurdlePhase: 'none',
            perfectHurdles: 0,
            hitHurdles: 0,
            currentHurdle: 0,
            hasFinished: false,
            finishTime: 0,
            trail: [],
            animateFrame: 0,
            lastTapTime: 0,
            tapCount: 0,
            lastHurdleResult: null
        };
    }

    function update(player, deltaTime, isAccelerating, weatherSpeedMod) {
        if (player.hasFinished) return;

        const effectiveMaxSpeed = player.maxSpeed * weatherSpeedMod;

        if (isAccelerating) {
            player.speed = Math.min(player.speed + player.acceleration, effectiveMaxSpeed);
        } else {
            player.speed = Math.max(player.speed - player.deceleration, 0);
        }

        if (player.isJumping) {
            player.jumpVelocity -= 0.4;
            player.jumpHeight += player.jumpVelocity * deltaTime * 0.08;
            
            if (player.jumpHeight <= 0) {
                player.jumpHeight = 0;
                player.isJumping = false;
                player.hurdlePhase = 'none';
            } else if (player.jumpHeight > 0 && player.jumpVelocity < 0) {
                player.hurdlePhase = 'descending';
            }
        }

        player.x += player.speed * deltaTime * 0.08;

        if (player.speed > 7) {
            player.trail.push({ x: player.x, alpha: 1 });
            if (player.trail.length > 5) {
                player.trail.shift();
            }
        }

        player.trail = player.trail.filter(t => {
            t.alpha -= 0.15;
            return t.alpha > 0;
        });

        player.animateFrame += deltaTime * 0.05;
    }

    function jump(player) {
        if (!player.isJumping && player.speed > 0.5) {
            player.isJumping = true;
            player.jumpVelocity = 20;
            player.jumpHeight = 0.1;
            player.hurdlePhase = 'ascending';
            return true;
        }
        return false;
    }

    function checkHurdleInteraction(player, hurdlePos, weatherHitMod) {
        const distanceToHurdle = player.x - hurdlePos;
        
        if (distanceToHurdle >= -0.5 && distanceToHurdle <= 0.5) {
            const jumpPeakHeight = player.jumpHeight;
            const wasJumping = player.isJumping || player.jumpHeight > 0.3;
            
            if (wasJumping && jumpPeakHeight > 0.8) {
                const perfectTiming = Math.abs(distanceToHurdle) < 0.3 && jumpPeakHeight > 1.2;
                if (perfectTiming) {
                    return 'perfect';
                }
                return 'cleared';
            } else {
                const hitChance = 0.85 + weatherHitMod;
                if (Math.random() < hitChance) {
                    return 'hit';
                }
                return 'missed';
            }
        }
        
        return null;
    }

    function handleHurdleResult(player, result) {
        if (result === 'perfect') {
            player.perfectHurdles++;
        } else if (result === 'hit') {
            player.hitHurdles++;
            player.speed *= 0.5;
        } else if (result === 'missed') {
            player.speed *= 0.7;
        }
        player.currentHurdle++;
    }

    function reset(player) {
        player.x = 0;
        player.speed = 0;
        player.isJumping = false;
        player.jumpHeight = 0;
        player.jumpVelocity = 0;
        player.hurdlePhase = 'none';
        player.perfectHurdles = 0;
        player.hitHurdles = 0;
        player.currentHurdle = 0;
        player.hasFinished = false;
        player.finishTime = 0;
        player.trail = [];
        player.animateFrame = 0;
    }

    return {
        create,
        update,
        jump,
        checkHurdleInteraction,
        handleHurdleResult,
        reset
    };
})();