const Timer = (function() {
    let totalTime = 240;
    let remainingTime = 240;
    let isRunning = false;
    let isPaused = false;
    let timerInterval = null;
    let onTickCallback = null;
    let onCompleteCallback = null;
    let warningThreshold = 60;
    
    function init(time, callbacks = {}) {
        totalTime = time;
        remainingTime = time;
        isRunning = false;
        isPaused = false;
        onTickCallback = callbacks.onTick;
        onCompleteCallback = callbacks.onComplete;
        clearInterval(timerInterval);
        updateDisplay();
    }
    
    function start() {
        if (isRunning && !isPaused) return;
        
        isRunning = true;
        isPaused = false;
        
        timerInterval = setInterval(() => {
            if (!isPaused) {
                remainingTime--;
                updateDisplay();
                
                if (onTickCallback) {
                    onTickCallback(remainingTime);
                }
                
                if (remainingTime <= 0) {
                    stop();
                    if (onCompleteCallback) {
                        onCompleteCallback();
                    }
                }
            }
        }, 1000);
    }
    
    function pause() {
        isPaused = true;
    }
    
    function resume() {
        isPaused = false;
    }
    
    function stop() {
        isRunning = false;
        isPaused = false;
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    function reset(newTime = null) {
        stop();
        remainingTime = newTime !== null ? newTime : totalTime;
        updateDisplay();
    }
    
    function addTime(seconds) {
        remainingTime = Math.min(remainingTime + seconds, totalTime);
        updateDisplay();
    }
    
    function subtractTime(seconds) {
        remainingTime = Math.max(remainingTime - seconds, 0);
        updateDisplay();
        
        if (onTickCallback) {
            onTickCallback(remainingTime);
        }
        
        if (remainingTime <= 0) {
            stop();
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        }
    }
    
    function updateDisplay() {
        const timerText = document.getElementById('timer-text');
        const timerDisplay = document.querySelector('.timer-display');
        
        if (timerText) {
            timerText.textContent = Utils.formatTime(remainingTime);
        }
        
        if (timerDisplay) {
            if (remainingTime <= warningThreshold) {
                timerDisplay.classList.add('warning');
            } else {
                timerDisplay.classList.remove('warning');
            }
        }
    }
    
    function getRemainingTime() {
        return remainingTime;
    }
    
    function getElapsedTime() {
        return totalTime - remainingTime;
    }
    
    function getTotalTime() {
        return totalTime;
    }
    
    function getIsRunning() {
        return isRunning;
    }
    
    function getIsPaused() {
        return isPaused;
    }
    
    function setWarningThreshold(seconds) {
        warningThreshold = seconds;
    }
    
    function setCallbacks(callbacks) {
        if (callbacks.onTick) onTickCallback = callbacks.onTick;
        if (callbacks.onComplete) onCompleteCallback = callbacks.onComplete;
    }
    
    return {
        init,
        start,
        pause,
        resume,
        stop,
        reset,
        addTime,
        subtractTime,
        updateDisplay,
        getRemainingTime,
        getElapsedTime,
        getTotalTime,
        getIsRunning,
        getIsPaused,
        setWarningThreshold,
        setCallbacks
    };
})();
