const AnimationModule = (function() {
    let canvas = null;
    let blinkInterval = null;
    let breatheInterval = null;
    let isBlinking = false;
    let isBreathing = false;
    let currentState = null;
    let renderFn = null;
    let breathePhase = 0;

    function init(canvasElement, renderCallback) {
        canvas = canvasElement;
        renderFn = renderCallback;
    }

    function setState(state) {
        currentState = JSON.parse(JSON.stringify(state));
    }

    function startBlink() {
        if (blinkInterval) {
            clearInterval(blinkInterval);
        }
        isBlinking = true;
        
        blinkInterval = setInterval(() => {
            renderFn(currentState, { isClosed: false });
            
            setTimeout(() => {
                renderFn(currentState, { isClosed: true });
                
                setTimeout(() => {
                    renderFn(currentState, { isClosed: false });
                }, 150);
            }, 200);
        }, 2000);
    }

    function stopBlink() {
        if (blinkInterval) {
            clearInterval(blinkInterval);
            blinkInterval = null;
        }
        isBlinking = false;
        if (renderFn && currentState) {
            renderFn(currentState, { isClosed: false });
        }
    }

    function startBreathe() {
        if (breatheInterval) {
            clearInterval(breatheInterval);
        }
        isBreathing = true;
        breathePhase = 0;
        
        breatheInterval = setInterval(() => {
            if (!currentState || !renderFn) return;
            
            breathePhase += 0.1;
            if (breathePhase > Math.PI * 2) {
                breathePhase = 0;
            }
            
            const offset = Math.sin(breathePhase) * 0.5;
            
            renderFn(currentState, { breatheOffset: offset });
        }, 50);
    }

    function stopBreathe() {
        if (breatheInterval) {
            clearInterval(breatheInterval);
            breatheInterval = null;
        }
        isBreathing = false;
        if (renderFn && currentState) {
            renderFn(currentState, {});
        }
    }

    function setBlinking(enabled) {
        if (enabled) {
            startBlink();
        } else {
            stopBlink();
        }
    }

    function setBreathing(enabled) {
        if (enabled) {
            startBreathe();
        } else {
            stopBreathe();
        }
    }

    function getRandomExpression() {
        const expressions = ['smile', 'laugh', 'sad', 'surprised'];
        return expressions[Math.floor(Math.random() * expressions.length)];
    }

    function testExpression() {
        if (!currentState || !renderFn) return;
        
        const originalMouth = currentState.mouth;
        const randomMouth = getRandomExpression();
        
        if (originalMouth !== randomMouth) {
            currentState.mouth = randomMouth;
            renderFn(currentState, {});
            
            setTimeout(() => {
                currentState.mouth = originalMouth;
                renderFn(currentState, {});
            }, 1500);
        }
    }

    function stopAll() {
        stopBlink();
        stopBreathe();
    }

    function isAnimationActive() {
        return isBlinking || isBreathing;
    }

    return {
        init,
        setState,
        setBlinking,
        setBreathing,
        testExpression,
        stopAll,
        isAnimationActive,
        getRandomExpression
    };
})();