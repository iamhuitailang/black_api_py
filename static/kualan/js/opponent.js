const Opponent = (function() {
    function create(type, laneIndex, weather) {
        const typeData = GameData.getOpponentType(type);
        const targetTime = typeData.minTime + Math.random() * (typeData.maxTime - typeData.minTime);
        
        return {
            x: 0,
            y: 0,
            lane: laneIndex,
            type: type,
            name: typeData.name,
            speed: 0,
            targetSpeed: 0,
            targetTime: targetTime,
            difficulty: typeData.difficulty,
            mistakeRate: typeData.mistakeRate,
            isJumping: false,
            jumpHeight: 0,
            jumpVelocity: 0,
            hurdlePhase: 'none',
            perfectHurdles: 0,
            hitHurdles: 0,
            currentHurdle: 0,
            hasFinished: false,
            finishTime: 0,
            animateFrame: 0,
            weather: weather
        };
    }

    function update(opponent, deltaTime, raceDistance) {
        if (opponent.hasFinished) return;

        const distanceLeft = raceDistance - opponent.x;
        const timeLeft = opponent.targetTime - (opponent.x > 0 ? opponent.x / opponent.targetSpeed * 0.1 : 0);
        
        if (timeLeft > 0 && distanceLeft > 0) {
            opponent.targetSpeed = (distanceLeft / timeLeft) * 8;
        }

        const weatherMod = opponent.weather ? opponent.weather.speedMod : 1;
        opponent.targetSpeed *= weatherMod;

        if (opponent.speed < opponent.targetSpeed) {
            opponent.speed = Math.min(opponent.speed + 0.08 * opponent.difficulty, opponent.targetSpeed);
        } else {
            opponent.speed = Math.max(opponent.speed - 0.08, opponent.targetSpeed);
        }

        if (opponent.isJumping) {
            opponent.jumpVelocity -= 0.5;
            opponent.jumpHeight += opponent.jumpVelocity * deltaTime * 0.08;
            
            if (opponent.jumpHeight <= 0) {
                opponent.jumpHeight = 0;
                opponent.isJumping = false;
                opponent.hurdlePhase = 'none';
            }
        }

        opponent.x += opponent.speed * deltaTime * 0.08;
        opponent.animateFrame += deltaTime * 0.05;
    }

    function tryJump(opponent, hurdlePos) {
        if (opponent.isJumping) return false;
        
        const distanceToHurdle = hurdlePos - opponent.x;
        const jumpThreshold = 1.5 + opponent.difficulty * 1.5;
        
        if (distanceToHurdle > 0 && distanceToHurdle < jumpThreshold) {
            const jumpChance = 0.6 + opponent.difficulty * 0.3;
            if (Math.random() < jumpChance) {
                opponent.isJumping = true;
                opponent.jumpVelocity = 16 + Math.random() * 3;
                opponent.jumpHeight = 0.1;
                opponent.hurdlePhase = 'ascending';
                return true;
            }
        }
        return false;
    }

    function checkHurdleInteraction(opponent, hurdlePos, weatherHitMod) {
        const distanceToHurdle = opponent.x - hurdlePos;
        
        if (distanceToHurdle >= -0.5 && distanceToHurdle <= 0.5) {
            const wasJumping = opponent.isJumping || opponent.jumpHeight > 0.3;
            
            if (Math.random() < opponent.mistakeRate + weatherHitMod) {
                return 'hit';
            }
            
            if (wasJumping && opponent.jumpHeight > 0.6) {
                if (Math.random() < 0.2 * opponent.difficulty) {
                    return 'perfect';
                }
                return 'cleared';
            } else {
                return 'hit';
            }
        }
        
        return null;
    }

    function handleHurdleResult(opponent, result) {
        if (result === 'perfect') {
            opponent.perfectHurdles++;
        } else if (result === 'hit') {
            opponent.hitHurdles++;
            opponent.speed *= 0.6;
            opponent.targetTime += 0.5;
        }
        opponent.currentHurdle++;
    }

    function reset(opponent) {
        const typeData = GameData.getOpponentType(opponent.type);
        opponent.x = 0;
        opponent.speed = 0;
        opponent.targetSpeed = 0;
        opponent.targetTime = typeData.minTime + Math.random() * (typeData.maxTime - typeData.minTime);
        opponent.isJumping = false;
        opponent.jumpHeight = 0;
        opponent.jumpVelocity = 0;
        opponent.hurdlePhase = 'none';
        opponent.perfectHurdles = 0;
        opponent.hitHurdles = 0;
        opponent.currentHurdle = 0;
        opponent.hasFinished = false;
        opponent.finishTime = 0;
        opponent.animateFrame = 0;
    }

    return {
        create,
        update,
        tryJump,
        checkHurdleInteraction,
        handleHurdleResult,
        reset
    };
})();