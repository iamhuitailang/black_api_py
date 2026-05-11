const WindSystem = (function() {
    let currentWind = { speed: 0, direction: 0 };
    let variableWind = false;
    let windChangeInterval = null;
    let enabled = false;
    
    function start(baseSpeed = 0, variable = false) {
        enabled = true;
        variableWind = variable;
        currentWind.speed = baseSpeed;
        currentWind.direction = 0;
        
        Physics.setWind(currentWind.speed, currentWind.direction);
        
        if (variableWind) {
            startWindVariation();
        }
        
        updateUI();
    }
    
    function stop() {
        enabled = false;
        if (windChangeInterval) {
            clearInterval(windChangeInterval);
            windChangeInterval = null;
        }
        currentWind = { speed: 0, direction: 0 };
        Physics.setWind(0, 0);
        updateUI();
    }
    
    function startWindVariation() {
        if (windChangeInterval) {
            clearInterval(windChangeInterval);
        }
        
        windChangeInterval = setInterval(() => {
            if (!enabled) return;
            
            const speedChange = (Math.random() - 0.5) * 0.5;
            const directionChange = (Math.random() - 0.5) * 30;
            
            currentWind.speed = Math.max(0, Math.min(3, currentWind.speed + speedChange));
            currentWind.direction = Helpers.normalizeAngle(
                currentWind.direction + directionChange
            );
            
            Physics.setWind(currentWind.speed, currentWind.direction);
            updateUI();
        }, 3000);
    }
    
    function updateUI() {
        const windArrow = document.getElementById('wind-arrow');
        const windSpeed = document.getElementById('wind-speed');
        const windIndicator = document.getElementById('wind-indicator');
        
        if (!windArrow || !windSpeed || !windIndicator) return;
        
        if (!enabled || currentWind.speed === 0) {
            windIndicator.classList.add('hidden');
            return;
        }
        
        windIndicator.classList.remove('hidden');
        
        windArrow.style.transform = `rotate(${currentWind.direction + 90}deg)`;
        
        const directionText = Helpers.getWindDirectionText(currentWind.direction);
        const strengthText = Helpers.getWindStrengthText(currentWind.speed);
        windSpeed.textContent = `${strengthText} (${directionText})`;
    }
    
    function getWind() {
        return { ...currentWind };
    }
    
    function isEnabled() {
        return enabled;
    }
    
    function isVariable() {
        return variableWind;
    }
    
    return {
        start,
        stop,
        getWind,
        isEnabled,
        isVariable,
        updateUI
    };
})();

window.WindSystem = WindSystem;