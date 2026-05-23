var Input = (function() {
    var state = {
        keys: {},
        mouseDown: false,
        mouseX: 0,
        mouseY: 0,
        pressingPower: false,
        powerPressStartTime: 0
    };

    var callbacks = {
        onPowerStart: null,
        onPowerRelease: null,
        onLeftPress: null,
        onRightPress: null,
        onPause: null
    };

    function init(canvas) {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    function handleKeyDown(e) {
        state.keys[e.code] = true;

        if (e.code === 'Space' && !state.pressingPower) {
            state.pressingPower = true;
            state.powerPressStartTime = Date.now();
            if (callbacks.onPowerStart) {
                callbacks.onPowerStart();
            }
        }

        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            if (callbacks.onLeftPress) {
                callbacks.onLeftPress(true);
            }
        }

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            if (callbacks.onRightPress) {
                callbacks.onRightPress(true);
            }
        }

        if (e.code === 'Escape' || e.code === 'KeyP') {
            if (callbacks.onPause) {
                callbacks.onPause();
            }
        }
    }

    function handleKeyUp(e) {
        state.keys[e.code] = false;

        if (e.code === 'Space' && state.pressingPower) {
            state.pressingPower = false;
            var pressDuration = Date.now() - state.powerPressStartTime;
            if (callbacks.onPowerRelease) {
                callbacks.onPowerRelease(pressDuration);
            }
        }

        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            if (callbacks.onLeftPress) {
                callbacks.onLeftPress(false);
            }
        }

        if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            if (callbacks.onRightPress) {
                callbacks.onRightPress(false);
            }
        }
    }

    function handleMouseDown(e) {
        if (e.button === 0) {
            state.mouseDown = true;
            if (!state.pressingPower) {
                state.pressingPower = true;
                state.powerPressStartTime = Date.now();
                if (callbacks.onPowerStart) {
                    callbacks.onPowerStart();
                }
            }
        }
    }

    function handleMouseUp(e) {
        if (e.button === 0) {
            state.mouseDown = false;
            if (state.pressingPower) {
                state.pressingPower = false;
                var pressDuration = Date.now() - state.powerPressStartTime;
                if (callbacks.onPowerRelease) {
                    callbacks.onPowerRelease(pressDuration);
                }
            }
        }
    }

    function handleMouseMove(e) {
        var rect = e.target.getBoundingClientRect();
        state.mouseX = e.clientX - rect.left;
        state.mouseY = e.clientY - rect.top;
    }

    function handleTouchStart(e) {
        e.preventDefault();
        var touch = e.touches[0];
        state.mouseDown = true;
        state.mouseX = touch.clientX;
        state.mouseY = touch.clientY;

        if (!state.pressingPower) {
            state.pressingPower = true;
            state.powerPressStartTime = Date.now();
            if (callbacks.onPowerStart) {
                callbacks.onPowerStart();
            }
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        state.mouseDown = false;

        if (state.pressingPower) {
            state.pressingPower = false;
            var pressDuration = Date.now() - state.powerPressStartTime;
            if (callbacks.onPowerRelease) {
                callbacks.onPowerRelease(pressDuration);
            }
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            var touch = e.touches[0];
            state.mouseX = touch.clientX;
            state.mouseY = touch.clientY;
        }
    }

    function isKeyPressed(code) {
        return state.keys[code] || false;
    }

    function isLeftPressed() {
        return state.keys['KeyA'] || state.keys['ArrowLeft'] || false;
    }

    function isRightPressed() {
        return state.keys['KeyD'] || state.keys['ArrowRight'] || false;
    }

    function isPressingPower() {
        return state.pressingPower;
    }

    function getPowerProgress() {
        if (!state.pressingPower) return 0;
        var elapsed = Date.now() - state.powerPressStartTime;
        return Math.min(elapsed / 1500, 1);
    }

    function on(event, callback) {
        if (callbacks.hasOwnProperty(event)) {
            callbacks[event] = callback;
        }
    }

    function reset() {
        state.keys = {};
        state.mouseDown = false;
        state.pressingPower = false;
        state.powerPressStartTime = 0;
    }

    return {
        init: init,
        isKeyPressed: isKeyPressed,
        isLeftPressed: isLeftPressed,
        isRightPressed: isRightPressed,
        isPressingPower: isPressingPower,
        getPowerProgress: getPowerProgress,
        on: on,
        reset: reset
    };
})();
