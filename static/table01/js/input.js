var Input = (function() {
    'use strict';

    var canvas = null;
    var gameState = null;

    var inputState = {
        isDragging: false,
        isPlacingCueBall: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        angle: 0,
        force: 0
    };

    function init(canvasElement, game) {
        canvas = canvasElement;
        gameState = game;

        bindEvents();
    }

    function bindEvents() {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    function handleMouseDown(e) {
        e.preventDefault();
        startInput(e);
    }

    function handleMouseMove(e) {
        e.preventDefault();
        if (inputState.isDragging || inputState.isPlacingCueBall) {
            updateInput(e);
        }
    }

    function handleMouseUp(e) {
        e.preventDefault();
        endInput(e);
    }

    function handleMouseLeave(e) {
        e.preventDefault();
        if (inputState.isDragging || inputState.isPlacingCueBall) {
            endInput(e);
        }
    }

    function handleTouchStart(e) {
        e.preventDefault();
        startInput(e);
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (inputState.isDragging || inputState.isPlacingCueBall) {
            updateInput(e);
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        endInput(e);
    }

    function startInput(e) {
        var coords = Utils.getCanvasCoords(e, canvas);
        inputState.startX = coords.x;
        inputState.startY = coords.y;
        inputState.currentX = coords.x;
        inputState.currentY = coords.y;

        if (gameState.canPlaceCueBall()) {
            inputState.isPlacingCueBall = true;
            gameState.startPlacingCueBall(coords.x, coords.y);
        } else if (gameState.canAim()) {
            inputState.isDragging = true;
            updateAngleAndForce(coords.x, coords.y);
            gameState.startAiming(inputState.angle, inputState.force);
        }
    }

    function updateInput(e) {
        var coords = Utils.getCanvasCoords(e, canvas);
        inputState.currentX = coords.x;
        inputState.currentY = coords.y;

        if (inputState.isPlacingCueBall) {
            gameState.updatePlacingCueBall(coords.x, coords.y);
        } else if (inputState.isDragging) {
            updateAngleAndForce(coords.x, coords.y);
            gameState.updateAiming(inputState.angle, inputState.force);
        }
    }

    function endInput(e) {
        if (inputState.isPlacingCueBall) {
            var coords = Utils.getCanvasCoords(e, canvas);
            gameState.confirmPlacingCueBall(coords.x, coords.y);
            inputState.isPlacingCueBall = false;
        } else if (inputState.isDragging) {
            gameState.shoot(inputState.angle, inputState.force);
            inputState.isDragging = false;
        }

        inputState.force = 0;
    }

    function updateAngleAndForce(mouseX, mouseY) {
        var cueBall = gameState.getCueBall();
        if (!cueBall) return;

        var dx = mouseX - cueBall.x;
        var dy = mouseY - cueBall.y;

        inputState.angle = Math.atan2(dy, dx);

        var distance = Utils.getDistance(cueBall.x, cueBall.y, mouseX, mouseY);
        var difficulty = gameState.getDifficultyConfig();
        var maxDistance = 200;
        inputState.force = Utils.clamp(distance * gameConfig.forceScale, difficulty.minForce, difficulty.maxForce);
    }

    var gameConfig = Config.GAME_CONFIG;

    function getState() {
        return inputState;
    }

    function isActive() {
        return inputState.isDragging || inputState.isPlacingCueBall;
    }

    return {
        init: init,
        getState: getState,
        isActive: isActive
    };
})();
