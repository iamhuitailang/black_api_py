const Input = (function() {
    let element = null;
    let callbacks = {
        cutLeft: null,
        cutRight: null,
        chainsawStart: null,
        chainsawEnd: null
    };
    let isChainsawMode = false;
    let isHolding = false;
    let holdTimer = null;
    let lastSide = null;
    
    function init(canvasElement, hasChainsaw) {
        element = canvasElement;
        isChainsawMode = hasChainsaw;
        
        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mouseup', handleMouseUp);
        element.addEventListener('mouseleave', handleMouseUp);
        element.addEventListener('mousemove', handleMouseMove);
        
        element.addEventListener('touchstart', handleTouchStart, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: false });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }
    
    function destroy() {
        if (element) {
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mouseup', handleMouseUp);
            element.removeEventListener('mouseleave', handleMouseUp);
            element.removeEventListener('mousemove', handleMouseMove);
            
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('touchmove', handleTouchMove);
        }
        
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
        }
    }
    
    function setChainsawMode(enabled) {
        isChainsawMode = enabled;
    }
    
    function setCallback(type, callback) {
        callbacks[type] = callback;
    }
    
    function getPositionFromEvent(event) {
        const rect = element.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        return clientX - rect.left;
    }
    
    function getSide(x) {
        const center = element.getBoundingClientRect().width / 2;
        return x < center ? SIDE.LEFT : SIDE.RIGHT;
    }
    
    function handleMouseDown(event) {
        const x = getPositionFromEvent(event);
        const side = getSide(x);
        handlePress(side);
    }
    
    function handleMouseMove(event) {
        if (isHolding) {
            const x = getPositionFromEvent(event);
            const side = getSide(x);
            if (side !== lastSide) {
                lastSide = side;
                if (isChainsawMode && callbacks.cutLeft && callbacks.cutRight) {
                    if (side === SIDE.LEFT) {
                        callbacks.cutLeft();
                    } else {
                        callbacks.cutRight();
                    }
                }
            }
        }
    }
    
    function handleMouseUp() {
        handleRelease();
    }
    
    function handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const x = getPositionFromEvent(event);
            const side = getSide(x);
            handlePress(side);
        }
    }
    
    function handleTouchMove(event) {
        event.preventDefault();
        if (isHolding && event.touches.length > 0) {
            const x = getPositionFromEvent(event);
            const side = getSide(x);
            if (side !== lastSide) {
                lastSide = side;
                if (isChainsawMode && callbacks.cutLeft && callbacks.cutRight) {
                    if (side === SIDE.LEFT) {
                        callbacks.cutLeft();
                    } else {
                        callbacks.cutRight();
                    }
                }
            }
        }
    }
    
    function handleTouchEnd(event) {
        event.preventDefault();
        if (event.touches.length === 0) {
            handleRelease();
        }
    }
    
    function handlePress(side) {
        isHolding = true;
        lastSide = side;
        
        if (isChainsawMode) {
            if (callbacks.chainsawStart) {
                callbacks.chainsawStart(side);
            }
            
            if (holdTimer) clearInterval(holdTimer);
            holdTimer = setInterval(() => {
                if (side === SIDE.LEFT && callbacks.cutLeft) {
                    callbacks.cutLeft();
                } else if (side === SIDE.RIGHT && callbacks.cutRight) {
                    callbacks.cutRight();
                }
            }, 200);
        } else {
            if (side === SIDE.LEFT && callbacks.cutLeft) {
                callbacks.cutLeft();
            } else if (side === SIDE.RIGHT && callbacks.cutRight) {
                callbacks.cutRight();
            }
        }
    }
    
    function handleRelease() {
        if (isHolding) {
            isHolding = false;
            
            if (holdTimer) {
                clearInterval(holdTimer);
                holdTimer = null;
            }
            
            if (isChainsawMode && callbacks.chainsawEnd) {
                callbacks.chainsawEnd();
            }
        }
    }
    
    function handleKeyDown(event) {
        if (isHolding) return;
        
        if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
            if (isChainsawMode) {
                handlePress(SIDE.LEFT);
            } else {
                if (callbacks.cutLeft) callbacks.cutLeft();
            }
        } else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
            if (isChainsawMode) {
                handlePress(SIDE.RIGHT);
            } else {
                if (callbacks.cutRight) callbacks.cutRight();
            }
        }
    }
    
    function handleKeyUp(event) {
        if (isChainsawMode) {
            if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A' ||
                event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
                handleRelease();
            }
        }
    }
    
    return {
        init,
        destroy,
        setChainsawMode,
        setCallback
    };
})();