var Duck = (function() {
    function createDuck(canvasWidth, canvasHeight, savedState) {
        if (savedState) {
            return restoreDuck(savedState);
        }
        
        var isGolden = Math.random() < GameConfig.GOLDEN_DUCK_CHANCE;
        var baseSpeed = GameConfig.DUCK_SPEED_BASE + Math.random() * GameConfig.DUCK_SPEED_VARIANCE;
        var size = GameConfig.DUCK_SIZE;
        
        var minY = canvasHeight * 0.2;
        var maxY = canvasHeight * 0.65;
        var y = minY + Math.random() * (maxY - minY);
        
        var flightPath = Math.random() > 0.5 ? 1 : -1;
        
        var duck = {
            id: Date.now() + Math.random(),
            x: -size,
            y: y,
            width: size,
            height: size * 0.7,
            speed: isGolden ? baseSpeed * GameConfig.GOLDEN_DUCK_SPEED_BONUS : baseSpeed,
            isGolden: isGolden,
            isHit: false,
            isMissed: false,
            wingPhase: 0,
            lastWingFlap: Date.now(),
            initialY: y,
            flightAmplitude: 20 + Math.random() * 30,
            flightFrequency: 0.005 + Math.random() * 0.01,
            startTime: Date.now(),
            flightPath: flightPath
        };
        
        return duck;
    }
    
    function restoreDuck(savedState) {
        return {
            id: savedState.id,
            x: savedState.x,
            y: savedState.y,
            width: savedState.width,
            height: savedState.height,
            speed: savedState.speed,
            isGolden: savedState.isGolden,
            isHit: savedState.isHit,
            isMissed: savedState.isMissed,
            wingPhase: savedState.wingPhase,
            lastWingFlap: Date.now(),
            initialY: savedState.initialY,
            flightAmplitude: savedState.flightAmplitude,
            flightFrequency: savedState.flightFrequency,
            startTime: savedState.startTime,
            flightPath: savedState.flightPath
        };
    }
    
    function updateDuck(duck, deltaTime, canvasWidth) {
        if (duck.isHit || duck.isMissed) return;
        
        duck.x += duck.speed * (deltaTime / 16);
        
        var elapsed = Date.now() - duck.startTime;
        duck.y = duck.initialY + Math.sin(elapsed * duck.flightFrequency) * duck.flightAmplitude * duck.flightPath;
        
        if (Date.now() - duck.lastWingFlap > GameConfig.WING_FLAP_INTERVAL) {
            duck.wingPhase = (duck.wingPhase + 1) % 4;
            duck.lastWingFlap = Date.now();
        }
        
        if (duck.x > canvasWidth + duck.width) {
            duck.isMissed = true;
        }
    }
    
    function checkCollision(duck, clickX, clickY) {
        if (duck.isHit || duck.isMissed) return false;
        
        var centerX = duck.x + duck.width / 2;
        var centerY = duck.y + duck.height / 2;
        var radiusX = duck.width / 2 * 0.9;
        var radiusY = duck.height / 2 * 0.9;
        
        var dx = clickX - centerX;
        var dy = clickY - centerY;
        
        return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
    }
    
    function getDuckState(duck) {
        return {
            id: duck.id,
            x: duck.x,
            y: duck.y,
            width: duck.width,
            height: duck.height,
            speed: duck.speed,
            isGolden: duck.isGolden,
            isHit: duck.isHit,
            isMissed: duck.isMissed,
            wingPhase: duck.wingPhase,
            initialY: duck.initialY,
            flightAmplitude: duck.flightAmplitude,
            flightFrequency: duck.flightFrequency,
            startTime: duck.startTime,
            flightPath: duck.flightPath
        };
    }
    
    return {
        createDuck: createDuck,
        updateDuck: updateDuck,
        checkCollision: checkCollision,
        getDuckState: getDuckState
    };
})();
