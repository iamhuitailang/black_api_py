const UI = (function() {
    let elements = {};
    let callbacks = {};

    function init() {
        cacheElements();
        bindEvents();
        updateMenuRecords();
    }

    function cacheElements() {
        elements = {
            score: document.getElementById('score'),
            highScore: document.getElementById('high-score'),
            distance: document.getElementById('distance'),
            healthFill: document.getElementById('health-fill'),
            pauseBtn: document.getElementById('pause-btn'),
            startScreen: document.getElementById('start-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            startBtn: document.getElementById('start-btn'),
            resumeBtn: document.getElementById('resume-btn'),
            restartBtn: document.getElementById('restart-btn'),
            quitBtn: document.getElementById('quit-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            backMenuBtn: document.getElementById('back-menu-btn'),
            menuHighScore: document.getElementById('menu-high-score'),
            menuHighDistance: document.getElementById('menu-high-distance'),
            finalScore: document.getElementById('final-score'),
            finalDistance: document.getElementById('final-distance'),
            newRecord: document.getElementById('new-record')
        };
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', () => trigger('start'));
        elements.pauseBtn.addEventListener('click', () => trigger('pause'));
        elements.resumeBtn.addEventListener('click', () => trigger('resume'));
        elements.restartBtn.addEventListener('click', () => trigger('restart'));
        elements.quitBtn.addEventListener('click', () => trigger('quit'));
        elements.playAgainBtn.addEventListener('click', () => trigger('restart'));
        elements.backMenuBtn.addEventListener('click', () => trigger('menu'));
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                trigger('togglePause');
            }
        });
    }

    function on(event, callback) {
        callbacks[event] = callback;
    }

    function trigger(event) {
        if (callbacks[event]) {
            callbacks[event]();
        }
    }

    function updateScore(score) {
        elements.score.textContent = score;
    }

    function updateHighScore(score) {
        elements.highScore.textContent = score;
    }

    function updateDistance(distance) {
        elements.distance.textContent = Math.floor(distance) + 'm';
    }

    function updateHealth(health, maxHealth) {
        const percentage = (health / maxHealth) * 100;
        elements.healthFill.style.width = percentage + '%';
    }

    function showStartScreen() {
        hideAllScreens();
        elements.startScreen.classList.remove('hidden');
        updateMenuRecords();
    }

    function showPauseScreen() {
        elements.pauseScreen.classList.remove('hidden');
    }

    function hidePauseScreen() {
        elements.pauseScreen.classList.add('hidden');
    }

    function showGameOverScreen(score, distance, isNewRecord) {
        elements.finalScore.textContent = score;
        elements.finalDistance.textContent = Math.floor(distance) + 'm';
        elements.newRecord.classList.toggle('hidden', !isNewRecord);
        elements.gameoverScreen.classList.remove('hidden');
    }

    function hideGameOverScreen() {
        elements.gameoverScreen.classList.add('hidden');
    }

    function hideAllScreens() {
        elements.startScreen.classList.add('hidden');
        elements.pauseScreen.classList.add('hidden');
        elements.gameoverScreen.classList.add('hidden');
    }

    function updateMenuRecords() {
        elements.menuHighScore.textContent = Storage.getHighScore();
        elements.menuHighDistance.textContent = Storage.getHighDistance() + 'm';
        elements.highScore.textContent = Storage.getHighScore();
    }

    return {
        init,
        on,
        updateScore,
        updateHighScore,
        updateDistance,
        updateHealth,
        showStartScreen,
        showPauseScreen,
        hidePauseScreen,
        showGameOverScreen,
        hideGameOverScreen,
        hideAllScreens,
        updateMenuRecords
    };
})();
