const Input = (function() {
    let onAccelerate = null;
    let onJump = null;
    let isAccelerating = false;
    let accelerateTimeout = null;
    
    let touchStartY = 0;
    let touchStartX = 0;
    let lastSwipeTime = 0;

    function init(accelerateCallback, jumpCallback) {
        onAccelerate = accelerateCallback;
        onJump = jumpCallback;
        
        setupKeyboard();
        setupTouch();
    }

    function setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                triggerAccelerate();
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                triggerJump();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                endAccelerate();
            }
        });
    }

    function setupTouch() {
        const touchAccelerate = document.getElementById('touchAccelerate');
        const touchJump = document.getElementById('touchJump');

        if (touchAccelerate) {
            touchAccelerate.addEventListener('touchstart', (e) => {
                e.preventDefault();
                triggerAccelerate();
            }, { passive: false });

            touchAccelerate.addEventListener('touchend', (e) => {
                e.preventDefault();
                endAccelerate();
            }, { passive: false });

            touchAccelerate.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                endAccelerate();
            }, { passive: false });

            touchAccelerate.addEventListener('mousedown', (e) => {
                e.preventDefault();
                triggerAccelerate();
            });

            touchAccelerate.addEventListener('mouseup', (e) => {
                e.preventDefault();
                endAccelerate();
            });
        }

        if (touchJump) {
            let swipeDetected = false;
            
            touchJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
                swipeDetected = false;
            }, { passive: false });

            touchJump.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const currentY = e.touches[0].clientY;
                const currentX = e.touches[0].clientX;
                
                const deltaY = touchStartY - currentY;
                const deltaX = Math.abs(currentX - touchStartX);
                
                const now = Date.now();
                if (!swipeDetected && deltaY > 20 && deltaY > deltaX && now - lastSwipeTime > 200) {
                    triggerJump();
                    lastSwipeTime = now;
                    swipeDetected = true;
                }
            }, { passive: false });

            touchJump.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                
                const deltaY = touchStartY - touchEndY;
                const deltaX = Math.abs(touchEndX - touchStartX);
                
                const now = Date.now();
                if (!swipeDetected && deltaY > 10 && deltaY > deltaX && now - lastSwipeTime > 200) {
                    triggerJump();
                    lastSwipeTime = now;
                } else if (!swipeDetected && Math.abs(deltaY) < 10 && deltaX < 10) {
                    if (now - lastSwipeTime > 200) {
                        triggerJump();
                        lastSwipeTime = now;
                    }
                }
            }, { passive: false });

            touchJump.addEventListener('click', (e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - lastSwipeTime > 200) {
                    triggerJump();
                    lastSwipeTime = now;
                }
            });
        }
    }

    function triggerAccelerate() {
        isAccelerating = true;
        
        if (accelerateTimeout) {
            clearTimeout(accelerateTimeout);
        }
        
        if (onAccelerate) {
            onAccelerate();
        }
    }

    function endAccelerate() {
        accelerateTimeout = setTimeout(() => {
            isAccelerating = false;
        }, 100);
    }

    function triggerJump() {
        if (onJump) {
            onJump();
        }
    }

    function isPlayerAccelerating() {
        return isAccelerating;
    }

    return {
        init,
        isPlayerAccelerating
    };
})();