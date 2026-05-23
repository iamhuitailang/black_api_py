var App = (function() {
    function init() {
        var canvas = document.getElementById('gameCanvas');
        Game.init(canvas);
        bindUIEvents();
        updateUI();
    }

    function bindUIEvents() {
        document.querySelectorAll('.character-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var characterType = this.dataset.character;
                Storage.setSelectedCharacter(characterType);
                updateCharacterSelection();
            });
        });

        document.getElementById('startBtn').addEventListener('click', function() {
            hideAllScreens();
            showScreen('gameUI');
            Game.startGame();
        });

        document.getElementById('pauseBtn').addEventListener('click', function() {
            Game.pause();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', function() {
            hideAllScreens();
            showScreen('gameUI');
            Game.nextLevel();
        });

        document.getElementById('replayBtn').addEventListener('click', function() {
            hideAllScreens();
            showScreen('gameUI');
            Game.restart();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', function() {
            hideAllScreens();
            Game.goToMenu();
            showScreen('startScreen');
            updateUI();
        });

        document.getElementById('retryBtn').addEventListener('click', function() {
            hideAllScreens();
            showScreen('gameUI');
            Game.restart();
        });

        document.getElementById('gameOverBackBtn').addEventListener('click', function() {
            hideAllScreens();
            Game.goToMenu();
            showScreen('startScreen');
            updateUI();
        });

        document.getElementById('resumeBtn').addEventListener('click', function() {
            hideAllScreens();
            showScreen('gameUI');
            Game.resume();
        });

        document.getElementById('pauseBackBtn').addEventListener('click', function() {
            hideAllScreens();
            Game.goToMenu();
            showScreen('startScreen');
            updateUI();
        });

        Game.onStateChange(function(data) {
            if (data.state === 'paused') {
                showScreen('pauseScreen');
            } else if (data.state === 'levelComplete') {
                hideAllScreens();
                var bestTime = Storage.getBestTime(data.level);
                document.getElementById('levelCompleteInfo').innerHTML =
                    '第 ' + data.level + ' 关完成！<br>用时: ' + data.time.toFixed(2) + ' 秒<br>最佳: ' + (bestTime ? bestTime.toFixed(2) + ' 秒' : '--');
                showScreen('levelCompleteScreen');
            } else if (data.state === 'gameOver') {
                hideAllScreens();
                showScreen('gameOverScreen');
            } else if (data.state === 'playing') {
                updateGameUI(data);
            } else if (data.state === 'menu') {
                hideAllScreens();
                showScreen('startScreen');
                updateUI();
            }
        });
    }

    function updateUI() {
        var highestLevel = Storage.getHighestLevel();
        var selectedCharacter = Storage.getSelectedCharacter();

        document.getElementById('highestLevel').textContent = highestLevel;
        updateCharacterSelection();

        var bestTimes = [];
        for (var i = 1; i <= GameData.getTotalLevels(); i++) {
            var time = Storage.getBestTime(i);
            if (time) {
                bestTimes.push('第' + i + '关: ' + time.toFixed(2) + '秒');
            }
        }
        if (bestTimes.length > 0) {
            document.getElementById('bestTimes').innerHTML = bestTimes.join('<br>');
        }
    }

    function updateCharacterSelection() {
        var selectedCharacter = Storage.getSelectedCharacter();
        document.querySelectorAll('.character-card').forEach(function(card) {
            if (card.dataset.character === selectedCharacter) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

    function updateGameUI(data) {
        if (data && data.level) {
            document.getElementById('currentLevel').textContent = data.level;
        }
        if (data && data.time) {
            document.getElementById('timer').textContent = data.time.toFixed(1) + 's';
        }
    }

    function showScreen(screenId) {
        var screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
            screen.classList.add('active');
        }
    }

    function hideAllScreens() {
        var screens = document.querySelectorAll('.screen');
        screens.forEach(function(screen) {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
