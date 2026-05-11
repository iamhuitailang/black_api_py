var Effects = (function() {
    var feathers = [];
    var smokes = [];
    var crosshairFlashes = [];
    
    function createFeathers(x, y, isGolden) {
        var count = GameConfig.FEATHER_COUNT;
        for (var i = 0; i < count; i++) {
            var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            var speed = 2 + Math.random() * 3;
            feathers.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                size: 8 + Math.random() * 8,
                color: isGolden ? '#FFD700' : GameConfig.FEATHER_COLOR,
                alpha: 1,
                gravity: 0.1,
                life: GameConfig.FEATHER_DURATION,
                startTime: Date.now()
            });
        }
    }
    
    function createSmoke(x, y) {
        smokes.push({
            x: x,
            y: y,
            size: 10,
            maxSize: 40,
            alpha: 0.6,
            life: GameConfig.SMOKE_DURATION,
            startTime: Date.now()
        });
    }
    
    function createCrosshairFlash(x, y) {
        crosshairFlashes.push({
            x: x,
            y: y,
            size: 35,
            alpha: 1,
            life: 500,
            startTime: Date.now()
        });
    }
    
    function updateFeathers(deltaTime) {
        var now = Date.now();
        for (var i = feathers.length - 1; i >= 0; i--) {
            var feather = feathers[i];
            feather.vy += feather.gravity;
            feather.x += feather.vx * (deltaTime / 16);
            feather.y += feather.vy * (deltaTime / 16);
            feather.rotation += feather.rotationSpeed;
            
            var elapsed = now - feather.startTime;
            feather.alpha = 1 - (elapsed / feather.life);
            
            if (elapsed >= feather.life) {
                feathers.splice(i, 1);
            }
        }
    }
    
    function updateSmokes(deltaTime) {
        var now = Date.now();
        for (var i = smokes.length - 1; i >= 0; i--) {
            var smoke = smokes[i];
            var elapsed = now - smoke.startTime;
            var progress = elapsed / smoke.life;
            
            smoke.size = 10 + (smoke.maxSize - 10) * progress;
            smoke.alpha = 0.6 * (1 - progress);
            
            if (elapsed >= smoke.life) {
                smokes.splice(i, 1);
            }
        }
    }
    
    function updateCrosshairFlashes(deltaTime) {
        var now = Date.now();
        for (var i = crosshairFlashes.length - 1; i >= 0; i--) {
            var flash = crosshairFlashes[i];
            var elapsed = now - flash.startTime;
            var progress = elapsed / flash.life;
            
            flash.size = 20 + 10 * progress;
            flash.alpha = 1 - progress;
            
            if (elapsed >= flash.life) {
                crosshairFlashes.splice(i, 1);
            }
        }
    }
    
    function update(deltaTime) {
        updateFeathers(deltaTime);
        updateSmokes(deltaTime);
        updateCrosshairFlashes(deltaTime);
    }
    
    function clear() {
        feathers = [];
        smokes = [];
        crosshairFlashes = [];
    }
    
    function getFeathers() {
        return feathers;
    }
    
    function getSmokes() {
        return smokes;
    }
    
    function getCrosshairFlashes() {
        return crosshairFlashes;
    }
    
    return {
        createFeathers: createFeathers,
        createSmoke: createSmoke,
        createCrosshairFlash: createCrosshairFlash,
        update: update,
        clear: clear,
        getFeathers: getFeathers,
        getSmokes: getSmokes,
        getCrosshairFlashes: getCrosshairFlashes
    };
})();
