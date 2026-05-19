const UI = (function() {
    let elements = {};
    let floatingTexts = [];
    
    function init() {
        elements = {
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            hud: document.getElementById('hud'),
            distance: document.getElementById('distance'),
            score: document.getElementById('score'),
            healthFill: document.getElementById('health-fill'),
            activeBuffs: document.getElementById('active-buffs'),
            highScoreDisplay: document.getElementById('high-score-display'),
            finalDistance: document.getElementById('final-distance'),
            finalScore: document.getElementById('final-score'),
            finalHighScore: document.getElementById('final-high-score'),
            startBtn: document.getElementById('start-btn'),
            restartBtn: document.getElementById('restart-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            quitBtn: document.getElementById('quit-btn'),
            pauseBtn: document.getElementById('pause-btn')
        };
    }
    
    function showStartScreen() {
        elements.startScreen.classList.remove('hidden');
        elements.gameOverScreen.classList.add('hidden');
        elements.pauseScreen.classList.add('hidden');
        elements.hud.style.display = 'flex';
        elements.highScoreDisplay.textContent = Storage.getHighDistance();
    }
    
    function showGameOverScreen(distance, score) {
        elements.gameOverScreen.classList.remove('hidden');
        elements.startScreen.classList.add('hidden');
        elements.finalDistance.textContent = Math.floor(distance);
        elements.finalScore.textContent = Math.floor(score);
        elements.finalHighScore.textContent = Storage.getHighDistance();
    }
    
    function showPauseScreen() {
        elements.pauseScreen.classList.remove('hidden');
    }
    
    function hidePauseScreen() {
        elements.pauseScreen.classList.add('hidden');
    }
    
    function hideAllScreens() {
        elements.startScreen.classList.add('hidden');
        elements.gameOverScreen.classList.add('hidden');
        elements.pauseScreen.classList.add('hidden');
    }
    
    function updateHUD(distance, score) {
        elements.distance.textContent = Math.floor(distance);
        elements.score.textContent = Math.floor(score);
    }
    
    function updateHealth(health, maxHealth) {
        const percentage = (health / maxHealth) * 100;
        elements.healthFill.style.width = percentage + '%';
        
        elements.healthFill.classList.remove('warning', 'danger');
        if (percentage <= 33) {
            elements.healthFill.classList.add('danger');
        } else if (percentage <= 66) {
            elements.healthFill.classList.add('warning');
        }
    }
    
    function updateBuffs() {
        elements.activeBuffs.innerHTML = '';
        
        if (Player.getSpeedBoostTimer() > 0) {
            const buff = createBuffIcon('🚀', Math.ceil(Player.getSpeedBoostTimer() / 1000));
            elements.activeBuffs.appendChild(buff);
        }
        
        if (Player.hasShield()) {
            const buff = createBuffIcon('🛡️');
            elements.activeBuffs.appendChild(buff);
        }
    }
    
    function createBuffIcon(emoji, timer) {
        const div = document.createElement('div');
        div.className = 'buff-icon';
        div.textContent = emoji;
        
        if (timer) {
            const timerSpan = document.createElement('span');
            timerSpan.className = 'buff-timer';
            timerSpan.textContent = timer;
            div.appendChild(timerSpan);
        }
        
        return div;
    }
    
    function addFloatingText(x, y, text, color) {
        floatingTexts.push({
            x, y, text, color,
            alpha: 1,
            life: 1000,
            vy: -2
        });
    }
    
    function updateFloatingTexts(deltaTime) {
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy;
            ft.life -= deltaTime;
            ft.alpha = Math.max(0, ft.life / 1000);
            
            if (ft.life <= 0) {
                floatingTexts.splice(i, 1);
            }
        }
    }
    
    function drawFloatingTexts(ctx) {
        floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        });
    }
    
    function getElement(id) {
        return elements[id];
    }
    
    return {
        init,
        showStartScreen,
        showGameOverScreen,
        showPauseScreen,
        hidePauseScreen,
        hideAllScreens,
        updateHUD,
        updateHealth,
        updateBuffs,
        addFloatingText,
        updateFloatingTexts,
        drawFloatingTexts,
        getElement
    };
})();
