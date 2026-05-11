const InputSystem = (function() {
    let canvas = null;
    let gameState = null;
    let engine = null;
    
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;
    
    function init(canvasElement, gameStateRef, engineRef) {
        canvas = canvasElement;
        gameState = gameStateRef;
        engine = engineRef;
        
        setupEventListeners();
    }
    
    function setupEventListeners() {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseUp);
        
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchmove', handleTouchMove);
        canvas.addEventListener('touchend', handleTouchEnd);
        
        document.addEventListener('keydown', handleKeyDown);
    }
    
    function getCanvasPosition(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    function handleMouseDown(e) {
        if (!engine.isRunning() || engine.isPaused() || gameState.isGameOver()) return;
        if (!gameState.hasInfiniteArrows() && gameState.getArrowsRemaining() <= 0) return;
        
        isMouseDown = true;
        const pos = getCanvasPosition(e.clientX, e.clientY);
        startX = pos.x;
        startY = pos.y;
        
        gameState.setDrawing(true);
        gameState.setDrawPower(Constants.BOW.MIN_POWER + 5);
        
        updateAiming(pos.x, pos.y);
    }
    
    function calculatePower(mouseX, mouseY) {
        const gameObjects = engine.getGameObjects();
        if (!gameObjects.bow) return 0;
        
        const bowX = gameObjects.bow.x;
        const bowY = gameObjects.bow.y;
        const distance = Helpers.distance(bowX, bowY, mouseX, mouseY);
        const maxDistance = 200;
        const power = (distance / maxDistance) * Constants.BOW.MAX_POWER;
        
        return Helpers.clamp(power, Constants.BOW.MIN_POWER, Constants.BOW.MAX_POWER);
    }
    
    function handleMouseMove(e) {
        if (!isMouseDown) return;
        
        const pos = getCanvasPosition(e.clientX, e.clientY);
        updateAiming(pos.x, pos.y);
    }
    
    function handleMouseUp(e) {
        if (!isMouseDown) return;
        
        isMouseDown = false;
        
        if (gameState.isDrawing()) {
            const currentPower = gameState.getDrawPower();
            const minPower = Constants.BOW.MIN_POWER * 0.5;
            
            if (currentPower >= minPower) {
                shootArrow();
            }
        }
        
        gameState.setDrawing(false);
        gameState.setDrawPower(0);
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 0) return;
        
        const touch = e.touches[0];
        handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 0) return;
        
        const touch = e.touches[0];
        handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        handleMouseUp({});
    }
    
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (engine.isRunning() && !gameState.isGameOver()) {
                if (engine.isPaused()) {
                    resumeGame();
                } else {
                    pauseGame();
                }
            }
        }
        
        if (e.key === ' ') {
            e.preventDefault();
            if (engine.isRunning() && !engine.isPaused() && !gameState.isGameOver()) {
                if (!gameState.hasInfiniteArrows() && gameState.getArrowsRemaining() <= 0) return;
                
                if (!gameState.isDrawing()) {
                    gameState.setDrawing(true);
                    gameState.setDrawPower(15);
                }
            }
        }
    }
    
    function updateAiming(mouseX, mouseY) {
        const gameObjects = engine.getGameObjects();
        if (!gameObjects.bow) return;
        
        const bowX = gameObjects.bow.x;
        const bowY = gameObjects.bow.y;
        
        const angle = Helpers.angle(bowX, bowY, mouseX, mouseY);
        gameState.setDrawAngle(angle);
        
        const power = calculatePower(mouseX, mouseY);
        gameState.setDrawPower(power);
    }
    
    function shootArrow() {
        const gameObjects = engine.getGameObjects();
        if (!gameObjects.bow) return;
        
        const arrow = gameObjects.bow.shoot(
            gameState.getDrawAngle(),
            gameState.getDrawPower()
        );
        
        if (arrow) {
            engine.addArrow(arrow);
            gameState.useArrow();
        }
    }
    
    function pauseGame() {
        if (typeof window.pauseGame === 'function') {
            window.pauseGame();
        }
    }
    
    function resumeGame() {
        if (typeof window.resumeGame === 'function') {
            window.resumeGame();
        }
    }
    
    return {
        init
    };
})();

window.InputSystem = InputSystem;