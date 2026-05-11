const TimerSystem = (function() {
    let timeRemaining = 0;
    let totalTime = 0;
    let timerInterval = null;
    let running = false;
    let onTimeUp = null;
    
    function start(seconds, callback) {
        stop();
        totalTime = seconds;
        timeRemaining = seconds;
        onTimeUp = callback;
        running = true;
        
        timerInterval = setInterval(() => {
            if (!running) return;
            
            timeRemaining -= 1;
            updateUI();
            
            if (timeRemaining <= 0) {
                timeRemaining = 0;
                stop();
                if (onTimeUp) {
                    onTimeUp();
                }
            }
        }, 1000);
        
        updateUI();
    }
    
    function stop() {
        running = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function pause() {
        running = false;
    }
    
    function resume() {
        running = true;
    }
    
    function getTimeRemaining() {
        return timeRemaining;
    }
    
    function getTotalTime() {
        return totalTime;
    }
    
    function isRunning() {
        return running;
    }
    
    function hasTimeLimit() {
        return totalTime > 0;
    }
    
    function updateUI() {
        const timeElement = document.getElementById('time-left');
        if (timeElement) {
            if (totalTime > 0) {
                timeElement.textContent = Helpers.formatTime(timeRemaining);
                if (timeRemaining <= 10) {
                    timeElement.style.color = '#ff0000';
                } else {
                    timeElement.style.color = '#ffd700';
                }
            } else {
                timeElement.textContent = '--';
                timeElement.style.color = '#ffd700';
            }
        }
    }
    
    return {
        start,
        stop,
        pause,
        resume,
        getTimeRemaining,
        getTotalTime,
        isRunning,
        hasTimeLimit,
        updateUI
    };
})();

window.TimerSystem = TimerSystem;