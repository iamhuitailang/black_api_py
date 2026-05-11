const Engine = (function() {
    let canvas = null;
    let ctx = null;
    let width = 0;
    let height = 0;
    let running = false;
    let paused = false;
    let lastTime = 0;
    let animationId = null;
    
    let gameObjects = {
        bow: null,
        arrows: [],
        targets: [],
        explosions: [],
        scorePopups: []
    };
    
    let gameState = null;
    
    function init(canvasElement, gameStateRef) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
        gameState = gameStateRef;
        
        Renderer.init(canvas);
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        let scale = Math.min(
            containerWidth / Constants.CANVAS.WIDTH,
            containerHeight / Constants.CANVAS.HEIGHT
        );
        
        canvas.width = Constants.CANVAS.WIDTH;
        canvas.height = Constants.CANVAS.HEIGHT;
        canvas.style.width = `${Constants.CANVAS.WIDTH * scale}px`;
        canvas.style.height = `${Constants.CANVAS.HEIGHT * scale}px`;
        
        width = Constants.CANVAS.WIDTH;
        height = Constants.CANVAS.HEIGHT;
    }
    
    function start() {
        running = true;
        paused = false;
        lastTime = performance.now();
        gameLoop();
    }
    
    function stop() {
        running = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    function pause() {
        paused = true;
    }
    
    function resume() {
        paused = false;
        lastTime = performance.now();
    }
    
    function isPaused() {
        return paused;
    }
    
    function isRunning() {
        return running;
    }
    
    function gameLoop() {
        if (!running) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        if (!paused) {
            update(deltaTime);
        }
        
        render();
        
        animationId = requestAnimationFrame(gameLoop);
    }
    
    function update(deltaTime) {
        updateTargets();
        updateArrows();
        updateExplosions();
        updateScorePopups();
        checkGameOver();
    }
    
    function updateTargets() {
        for (let i = 0; i < gameObjects.targets.length; i++) {
            const target = gameObjects.targets[i];
            if (target.hit) continue;
            
            const targetType = Constants.TARGET_TYPES[target.type.toUpperCase()];
            if (!targetType) continue;
            
            if (targetType.moving) {
                if (!target.direction) target.direction = 1;
                if (!target.speed) target.speed = targetType.speed || 1;
                if (!target.moveRange) target.moveRange = 100;
                if (target.originalX === undefined) target.originalX = target.x;
                
                target.x += target.direction * target.speed;
                
                if (target.x > target.originalX + target.moveRange) {
                    target.direction = -1;
                } else if (target.x < target.originalX - target.moveRange) {
                    target.direction = 1;
                }
                
                if (targetType.flying) {
                    if (!target.yDirection) target.yDirection = 1;
                    if (!target.ySpeed) target.ySpeed = 0.5;
                    target.y += target.yDirection * target.ySpeed;
                    
                    if (target.y > target.originalY + 30) {
                        target.yDirection = -1;
                    } else if (target.y < target.originalY - 30) {
                        target.yDirection = 1;
                    }
                }
            }
        }
    }
    
    function updateArrows() {
        const arrowsToRemove = [];
        
        for (let i = 0; i < gameObjects.arrows.length; i++) {
            const arrow = gameObjects.arrows[i];
            
            Physics.updateArrow(arrow);
            
            const collisions = Physics.checkCollisions(arrow, gameObjects.targets);
            
            if (collisions.length > 0) {
                handleArrowHit(arrow, collisions);
                arrowsToRemove.push(i);
            } else if (Physics.isOutOfBounds(arrow, width, height)) {
                arrowsToRemove.push(i);
            }
        }
        
        for (let i = arrowsToRemove.length - 1; i >= 0; i--) {
            gameObjects.arrows.splice(arrowsToRemove[i], 1);
        }
    }
    
    function handleArrowHit(arrow, collisions) {
        const arrowType = Constants.ARROW_TYPES[arrow.type.toUpperCase()];
        
        for (let i = 0; i < collisions.length; i++) {
            const collision = collisions[i];
            const target = collision.target;
            
            target.hit = true;
            
            let score = Scoring.calculateScore(
                collision.ringScore,
                target.type,
                collision.isCritical,
                collision.isHeadshot
            );
            
            gameState.addScore(score);
            gameState.addHit();
            
            if (collision.ringScore === 10) {
                gameState.addPerfectHit();
            }
            
            addScorePopup(target.x, target.y - 30, score, collision.isCritical, collision.isHeadshot);
            
            if (arrowType && arrowType.explosive) {
                createExplosion(target.x, target.y, arrowType.explosionRadius);
                
                for (let j = 0; j < gameObjects.targets.length; j++) {
                    const otherTarget = gameObjects.targets[j];
                    if (otherTarget === target || otherTarget.hit) continue;
                    
                    const distance = Helpers.distance(target.x, target.y, otherTarget.x, otherTarget.y);
                    if (distance <= arrowType.explosionRadius) {
                        otherTarget.hit = true;
                        const explosionScore = Math.floor(score * 0.5);
                        gameState.addScore(explosionScore);
                        gameState.addHit();
                        addScorePopup(otherTarget.x, otherTarget.y - 30, explosionScore, false, false);
                    }
                }
            }
        }
    }
    
    function createExplosion(x, y, radius) {
        gameObjects.explosions.push({
            x: x,
            y: y,
            radius: radius,
            progress: 0,
            duration: 500,
            startTime: performance.now()
        });
    }
    
    function updateExplosions() {
        const now = performance.now();
        const explosionsToRemove = [];
        
        for (let i = 0; i < gameObjects.explosions.length; i++) {
            const explosion = gameObjects.explosions[i];
            const elapsed = now - explosion.startTime;
            explosion.progress = Math.min(elapsed / explosion.duration, 1);
            
            if (explosion.progress >= 1) {
                explosionsToRemove.push(i);
            }
        }
        
        for (let i = explosionsToRemove.length - 1; i >= 0; i--) {
            gameObjects.explosions.splice(explosionsToRemove[i], 1);
        }
    }
    
    function addScorePopup(x, y, score, isCritical, isHeadshot) {
        gameObjects.scorePopups.push({
            x: x,
            y: y,
            score: score,
            isCritical: isCritical,
            isHeadshot: isHeadshot,
            startTime: performance.now(),
            duration: 1000
        });
    }
    
    function updateScorePopups() {
        const now = performance.now();
        const popupsToRemove = [];
        
        for (let i = 0; i < gameObjects.scorePopups.length; i++) {
            const popup = gameObjects.scorePopups[i];
            const elapsed = now - popup.startTime;
            
            if (elapsed >= popup.duration) {
                popupsToRemove.push(i);
            } else {
                popup.y -= 0.5;
            }
        }
        
        for (let i = popupsToRemove.length - 1; i >= 0; i--) {
            gameObjects.scorePopups.splice(popupsToRemove[i], 1);
        }
    }
    
    function checkGameOver() {
        if (!gameState) return;
        
        const remainingTargets = gameObjects.targets.filter(t => !t.hit).length;
        
        if (remainingTargets === 0 && gameObjects.arrows.length === 0) {
            if (!gameState.hasTimeLimit() || gameState.getTimeRemaining() > 0) {
                if (gameState.getCurrentMode() === 'tournament') {
                    gameState.nextRound();
                    if (!gameState.isGameOver()) {
                        GameStateManager.spawnTargets(gameObjects, gameState);
                    }
                }
            }
        }
        
        if (!gameState.hasInfiniteArrows() && gameState.getArrowsRemaining() <= 0 && gameObjects.arrows.length === 0) {
            endGame();
        }
        
        if (gameState.hasTimeLimit() && gameState.getTimeRemaining() <= 0) {
            endGame();
        }
    }
    
    function endGame() {
        if (gameState) {
            gameState.endGame();
        }
    }
    
    function render() {
        Renderer.clear();
        Renderer.drawBackground();
        
        for (let i = 0; i < gameObjects.targets.length; i++) {
            const target = gameObjects.targets[i];
            if (!target.hit) {
                Renderer.drawTarget(target);
            }
        }
        
        if (gameObjects.bow) {
            Renderer.drawBow(
                gameObjects.bow,
                gameState && gameState.isDrawing(),
                gameState ? gameState.getDrawAngle() : -Math.PI / 2,
                gameState ? gameState.getDrawPower() : 0
            );
        }
        
        for (let i = 0; i < gameObjects.arrows.length; i++) {
            Renderer.drawArrow(gameObjects.arrows[i]);
        }
        
        for (let i = 0; i < gameObjects.explosions.length; i++) {
            const explosion = gameObjects.explosions[i];
            Renderer.drawExplosion(explosion.x, explosion.y, explosion.radius, explosion.progress);
        }
        
        if (gameState && gameState.isDrawing()) {
            const trajectory = calculateTrajectory();
            if (trajectory.length > 0) {
                Renderer.drawTrajectory(trajectory);
            }
        }
        
        for (let i = 0; i < gameObjects.scorePopups.length; i++) {
            const popup = gameObjects.scorePopups[i];
            const now = performance.now();
            const elapsed = now - popup.startTime;
            const alpha = 1 - (elapsed / popup.duration);
            
            ctx.globalAlpha = alpha;
            Renderer.drawScorePopup(popup.x, popup.y, popup.score, popup.isCritical, popup.isHeadshot);
            ctx.globalAlpha = 1;
        }
        
        if (gameState && gameState.isDrawing()) {
            Renderer.drawPowerBar(
                50,
                height - 100,
                200,
                20,
                gameState.getDrawPower(),
                Constants.BOW.MAX_POWER
            );
        }
    }
    
    function calculateTrajectory() {
        if (!gameObjects.bow || !gameState) return [];
        
        const angle = gameState.getDrawAngle();
        const power = gameState.getDrawPower();
        const arrowType = Constants.ARROW_TYPES[gameState.getCurrentArrowType().toUpperCase()];
        
        if (!arrowType) return [];
        
        const points = [];
        let x = gameObjects.bow.x;
        let y = gameObjects.bow.y;
        let vx = Math.cos(angle) * power * arrowType.speedMultiplier;
        let vy = Math.sin(angle) * power * arrowType.speedMultiplier;
        
        const originalGravity = Constants.PHYSICS.GRAVITY;
        const gravity = Physics.isEnabled() ? originalGravity * arrowType.gravityMultiplier : 0;
        const wind = Physics.getWind();
        const windForce = wind.speed > 0 ? wind.speed * arrowType.windResistance * 0.1 : 0;
        const windAngle = Helpers.degreesToRadians(wind.direction);
        
        for (let i = 0; i < 50; i++) {
            points.push({ x: x, y: y });
            
            vy += gravity;
            if (windForce > 0) {
                vx += Math.cos(windAngle) * windForce * 0.5;
                vy += Math.sin(windAngle) * windForce * 0.25;
            }
            
            x += vx * 0.5;
            y += vy * 0.5;
            
            if (y > height || x > width || x < 0) break;
        }
        
        return points;
    }
    
    function addArrow(arrow) {
        gameObjects.arrows.push(arrow);
    }
    
    function setBow(bow) {
        gameObjects.bow = bow;
    }
    
    function setTargets(targets) {
        gameObjects.targets = targets;
        for (let i = 0; i < targets.length; i++) {
            targets[i].originalX = targets[i].x;
            targets[i].originalY = targets[i].y;
        }
    }
    
    function clearAll() {
        gameObjects.arrows = [];
        gameObjects.targets = [];
        gameObjects.explosions = [];
        gameObjects.scorePopups = [];
        gameObjects.bow = null;
    }
    
    function getGameObjects() {
        return gameObjects;
    }
    
    function getWidth() {
        return width;
    }
    
    function getHeight() {
        return height;
    }
    
    return {
        init,
        start,
        stop,
        pause,
        resume,
        isPaused,
        isRunning,
        addArrow,
        setBow,
        setTargets,
        clearAll,
        getGameObjects,
        getWidth,
        getHeight,
        resizeCanvas
    };
})();

window.Engine = Engine;