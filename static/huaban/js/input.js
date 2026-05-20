const Input = (function() {
    const keys = {};
    const keyPressed = {};
    const touchState = {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        isTouched: false,
        touchStartTime: 0,
        touches: []
    };
    
    const listeners = {
        jump: [],
        jumpRelease: [],
        left: [],
        right: [],
        crouch: [],
        crouchRelease: [],
        trick1: [],
        trick2: [],
        grind: [],
        pause: [],
        any: []
    };
    
    function init() {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        }
    }
    
    function handleKeyDown(e) {
        if (e.repeat) return;
        
        keys[e.code] = true;
        keyPressed[e.code] = true;
        
        triggerEvent('any', e.code, true);
        
        switch (e.code) {
            case 'Space':
            case 'ArrowUp':
                e.preventDefault();
                triggerEvent('jump');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                triggerEvent('left', true);
                break;
            case 'ArrowRight':
                e.preventDefault();
                triggerEvent('right', true);
                break;
            case 'ArrowDown':
                e.preventDefault();
                triggerEvent('crouch');
                break;
            case 'KeyJ':
            case 'KeyK':
                triggerEvent('trick1');
                break;
            case 'KeyL':
            case 'KeyU':
                triggerEvent('trick2');
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                triggerEvent('grind', true);
                break;
            case 'Escape':
            case 'KeyP':
                triggerEvent('pause');
                break;
        }
    }
    
    function handleKeyUp(e) {
        keys[e.code] = false;
        keyPressed[e.code] = false;
        
        triggerEvent('any', e.code, false);
        
        switch (e.code) {
            case 'Space':
            case 'ArrowUp':
                triggerEvent('jumpRelease');
                break;
            case 'ArrowLeft':
                triggerEvent('left', false);
                break;
            case 'ArrowRight':
                triggerEvent('right', false);
                break;
            case 'ArrowDown':
                triggerEvent('crouchRelease');
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                triggerEvent('grind', false);
                break;
        }
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        touchState.startX = touch.clientX;
        touchState.startY = touch.clientY;
        touchState.currentX = touch.clientX;
        touchState.currentY = touch.clientY;
        touchState.isTouched = true;
        touchState.touchStartTime = Date.now();
        touchState.touches = Array.from(e.touches);
        
        if (e.touches.length >= 2) {
            triggerEvent('trick1');
        } else if (touch.clientX > window.innerWidth * 0.7) {
            triggerEvent('trick2');
        } else {
            triggerEvent('jump');
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (!touchState.isTouched) return;
        
        const touch = e.touches[0];
        touchState.currentX = touch.clientX;
        touchState.currentY = touch.clientY;
        
        const deltaX = touch.clientX - touchState.startX;
        const deltaY = touch.clientY - touchState.startY;
        
        if (Math.abs(deltaX) > 30) {
            if (deltaX > 0) {
                triggerEvent('right', true);
            } else {
                triggerEvent('left', true);
            }
        }
        
        if (deltaY < -50) {
            triggerEvent('grind', true);
        } else if (deltaY > 50) {
            triggerEvent('crouch');
        }
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        
        triggerEvent('jumpRelease');
        triggerEvent('left', false);
        triggerEvent('right', false);
        triggerEvent('crouchRelease');
        triggerEvent('grind', false);
        
        touchState.isTouched = false;
        touchState.touches = [];
    }
    
    function on(event, callback) {
        if (listeners[event]) {
            listeners[event].push(callback);
        }
    }
    
    function off(event, callback) {
        if (listeners[event]) {
            const index = listeners[event].indexOf(callback);
            if (index > -1) {
                listeners[event].splice(index, 1);
            }
        }
    }
    
    function triggerEvent(event, ...args) {
        if (listeners[event]) {
            listeners[event].forEach(cb => cb(...args));
        }
    }
    
    function isKeyPressed(code) {
        return !!keys[code];
    }
    
    function wasKeyPressed(code) {
        const pressed = !!keyPressed[code];
        keyPressed[code] = false;
        return pressed;
    }
    
    function getTouchState() {
        return { ...touchState };
    }
    
    function update() {
        for (const key in keyPressed) {
            keyPressed[key] = false;
        }
    }
    
    return {
        init,
        on,
        off,
        isKeyPressed,
        wasKeyPressed,
        getTouchState,
        update
    };
})();
