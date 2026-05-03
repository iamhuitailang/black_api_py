var Input = (function() {
    'use strict';

    var targetElement = null;
    var onMove = null;

    var touchStartX = 0;
    var touchStartY = 0;
    var touchEndX = 0;
    var touchEndY = 0;

    var SWIPE_THRESHOLD = 30;
    var isEnabled = true;

    function init(element, moveCallback) {
        targetElement = element;
        onMove = moveCallback;
        
        bindKeyboardEvents();
        bindTouchEvents();
        bindMouseSwipeEvents();
    }

    function enable() {
        isEnabled = true;
    }

    function disable() {
        isEnabled = false;
    }

    function isInputEnabled() {
        return isEnabled;
    }

    function bindKeyboardEvents() {
        document.addEventListener('keydown', function(e) {
            if (!isEnabled) return;
            
            var direction = null;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    direction = 'right';
                    break;
            }
            
            if (direction) {
                e.preventDefault();
                if (onMove) {
                    onMove(direction);
                }
            }
        });
    }

    function bindTouchEvents() {
        if (!targetElement) return;

        targetElement.addEventListener('touchstart', function(e) {
            if (!isEnabled) return;
            if (e.touches.length !== 1) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        targetElement.addEventListener('touchmove', function(e) {
            if (!isEnabled) return;
            e.preventDefault();
        }, { passive: false });

        targetElement.addEventListener('touchend', function(e) {
            if (!isEnabled) return;
            if (e.changedTouches.length !== 1) return;
            
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            
            handleSwipe();
        }, { passive: false });
    }

    function bindMouseSwipeEvents() {
        if (!targetElement) return;

        var isMouseDown = false;
        var mouseStartX = 0;
        var mouseStartY = 0;

        targetElement.addEventListener('mousedown', function(e) {
            if (!isEnabled) return;
            
            isMouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
        });

        document.addEventListener('mouseup', function(e) {
            if (!isEnabled || !isMouseDown) return;
            
            isMouseDown = false;
            
            var deltaX = e.clientX - mouseStartX;
            var deltaY = e.clientY - mouseStartY;
            
            var direction = getSwipeDirection(deltaX, deltaY);
            if (direction && onMove) {
                onMove(direction);
            }
        });

        targetElement.addEventListener('mousemove', function(e) {
            if (!isEnabled || !isMouseDown) return;
            e.preventDefault();
        });
    }

    function handleSwipe() {
        var deltaX = touchEndX - touchStartX;
        var deltaY = touchEndY - touchStartY;
        
        var direction = getSwipeDirection(deltaX, deltaY);
        if (direction && onMove) {
            onMove(direction);
        }
    }

    function getSwipeDirection(deltaX, deltaY) {
        var absX = Math.abs(deltaX);
        var absY = Math.abs(deltaY);
        
        if (absX < SWIPE_THRESHOLD && absY < SWIPE_THRESHOLD) {
            return null;
        }
        
        if (absX > absY) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    return {
        init: init,
        enable: enable,
        disable: disable,
        isEnabled: isInputEnabled
    };
})();
