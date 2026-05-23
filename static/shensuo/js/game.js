var Game = (function() {
    var gameState = 'menu';
    var currentLevel = 1;
    var levelData = null;
    var player = null;
    var startTime = 0;
    var elapsedTime = 0;
    var lastTime = 0;
    var trail = [];
    var animationFrameId = null;

    var keys = {
        left: false,
        right: false,
        power: false
    };

    var callbacks = {
        onStateChange: null,
        onLevelComplete: null,
        onGameOver: null
    };

    function init(canvasElement) {
        Renderer.init(canvasElement);
        Input.init(canvasElement);
        setupInputHandlers();
    }

    function setupInputHandlers() {
        Input.on('onPowerStart', function() {
            if (gameState === 'playing') {
                keys.power = true;
            }
        });

        Input.on('onPowerRelease', function(duration) {
            if (keys.power && gameState === 'playing') {
                handleRelease();
            }
            keys.power = false;
        });

        Input.on('onLeftPress', function(pressed) {
            keys.left = pressed;
        });

        Input.on('onRightPress', function(pressed) {
            keys.right = pressed;
        });

        Input.on('onPause', function() {
            if (gameState === 'playing') {
                pause();
            } else if (gameState === 'paused') {
                resume();
            }
        });
    }

    function handleRelease() {
        if (!player) return;

        if (player.isSwinging && player.rope) {
            Physics.releaseFromRope(player);
            player.power = 0;
        }
    }

    function startGame() {
        currentLevel = Storage.getCurrentLevel();
        loadLevel(currentLevel);
        gameState = 'playing';
        startTime = Date.now();
        elapsedTime = 0;
        trail = [];
        lastTime = 0;
        notifyStateChange();
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop(performance.now());
    }

    function loadLevel(levelNum) {
        var levelIndex = Math.min(levelNum - 1, GameData.levels.length - 1);
        levelData = JSON.parse(JSON.stringify(GameData.levels[levelIndex]));

        var characterType = Storage.getSelectedCharacter();
        var character = GameData.characters[characterType];

        var startPlatform = levelData.platforms[0];
        var startX = startPlatform.x + startPlatform.width / 2;
        var startY = startPlatform.y;

        player = {
            x: startX,
            y: startY,
            vx: 0,
            vy: 0,
            width: 30,
            height: 55,
            color: character.color,
            skinColor: character.skinColor,
            hairColor: character.hairColor,
            characterType: characterType,
            power: 0,
            maxPower: character.maxPower,
            airControl: character.airControl,
            landingTolerance: character.landingTolerance,
            balance: character.balance,
            onPlatform: true,
            isSwinging: false,
            rope: null,
            angle: 0,
            angularVel: 0,
            currentPlatform: startPlatform
        };

        for (var i = 0; i < levelData.obstacles.length; i++) {
            var obs = levelData.obstacles[i];
            if (obs.type === 'rock') {
                obs.currentX = obs.baseX;
                obs.currentY = obs.baseY;
            } else if (obs.type === 'wood') {
                obs.currentX = obs.baseX;
                obs.currentY = obs.baseY;
            }
        }
    }

    function gameLoop(timestamp) {
        if (gameState !== 'playing') return;

        if (!lastTime) lastTime = timestamp;
        var deltaTime = (timestamp - lastTime) / 1000;
        if (deltaTime > 0.05) deltaTime = 0.05;
        lastTime = timestamp;

        elapsedTime = (Date.now() - startTime) / 1000;

        update(deltaTime, timestamp);
        render(timestamp);

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function update(dt, time) {
        if (!player || !levelData) return;

        Physics.updateObstacles(levelData.obstacles, time, dt);
        Physics.updatePlatforms(levelData.platforms, time);

        if (keys.power && player.onPlatform) {
            player.power = Math.min(player.power + dt * 0.8, player.maxPower);
        }

        if (keys.power && player.onPlatform && player.power >= 0.15) {
            findAndAttachRope();
        }

        if (keys.left && !player.onPlatform) {
            player.x -= player.airControl * dt * 60;
            player.vx = -player.airControl;
        }
        if (keys.right && !player.onPlatform) {
            player.x += player.airControl * dt * 60;
            player.vx = player.airControl;
        }

        if (player.isSwinging && player.rope) {
            if (keys.power) {
                player.angularVel += 0.002 * dt * 60;
            }
            Physics.updatePendulum(player, dt);
            addToTrail();
        } else if (!player.onPlatform) {
            Physics.updateProjectile(player, dt, levelData.wind);
            addToTrail();

            var collision = Physics.checkPlatformCollision(player, levelData.platforms);
            if (collision) {
                player.y = collision.y;
                player.vy = 0;
                player.vx *= 0.5;
                player.onPlatform = true;
                player.currentPlatform = collision.platform;
                player.power = 0;
                trail = [];

                if (collision.platform.type === 'end') {
                    levelComplete();
                    return;
                }
            }

            if (Physics.checkOutOfBounds(player, levelData)) {
                gameOver();
                return;
            }

            if (Physics.checkObstacleCollision(player, levelData.obstacles)) {
                gameOver();
                return;
            }
        } else if (player.onPlatform && player.currentPlatform) {
            player.vx = 0;
            player.vy = 0;
            player.y = player.currentPlatform.y;

            if (player.currentPlatform.type === 'opening' && !player.currentPlatform.isOpen) {
                player.onPlatform = false;
            }
        }
    }

    function findAndAttachRope() {
        if (!levelData) return;

        for (var i = 0; i < levelData.ropes.length; i++) {
            var rope = levelData.ropes[i];
            var ropeEndX = rope.x;
            var ropeEndY = rope.y + rope.length;
            var dx = player.x - ropeEndX;
            var dy = player.y - ropeEndY;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                player.rope = rope;
                player.isSwinging = true;
                player.onPlatform = false;
                player.currentPlatform = null;
                player.angle = Math.atan2(dx, dy);
                player.angularVel = player.power * 0.01;
                break;
            }
        }
    }

    function addToTrail() {
        trail.push({ x: player.x, y: player.y - player.height / 2 });
        if (trail.length > 20) {
            trail.shift();
        }
    }

    function render(time) {
        if (!player || !levelData) return;

        Renderer.setCamera(player.x, player.y);
        Renderer.drawBackground(time);
        Renderer.drawTrail(trail);
        Renderer.drawLevel(levelData, time);
        Renderer.drawPlayer(player, time);
    }

    function levelComplete() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        gameState = 'levelComplete';

        var bestTime = Storage.getBestTime(currentLevel);
        if (!bestTime || elapsedTime < bestTime) {
            Storage.setBestTime(currentLevel, elapsedTime);
        }

        var highestLevel = Storage.getHighestLevel();
        if (currentLevel >= highestLevel && currentLevel < GameData.levels.length) {
            Storage.setHighestLevel(currentLevel + 1);
            Storage.setCurrentLevel(currentLevel + 1);
        }

        notifyStateChange();
        if (callbacks.onLevelComplete) {
            callbacks.onLevelComplete({
                level: currentLevel,
                time: elapsedTime,
                bestTime: Storage.getBestTime(currentLevel)
            });
        }
    }

    function gameOver() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        gameState = 'gameOver';
        notifyStateChange();
        if (callbacks.onGameOver) {
            callbacks.onGameOver();
        }
    }

    function restart() {
        loadLevel(currentLevel);
        gameState = 'playing';
        startTime = Date.now();
        elapsedTime = 0;
        trail = [];
        lastTime = 0;
        notifyStateChange();
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop(performance.now());
    }

    function nextLevel() {
        currentLevel++;
        if (currentLevel > GameData.levels.length) {
            currentLevel = GameData.levels.length;
        }
        Storage.setCurrentLevel(currentLevel);
        loadLevel(currentLevel);
        gameState = 'playing';
        startTime = Date.now();
        elapsedTime = 0;
        trail = [];
        lastTime = 0;
        notifyStateChange();
        
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        gameLoop(performance.now());
    }

    function pause() {
        if (gameState === 'playing') {
            gameState = 'paused';
            notifyStateChange();
        }
    }

    function resume() {
        if (gameState === 'paused') {
            gameState = 'playing';
            lastTime = 0;
            notifyStateChange();
            gameLoop(performance.now());
        }
    }

    function goToMenu() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        gameState = 'menu';
        lastTime = 0;
        notifyStateChange();
    }

    function notifyStateChange() {
        if (callbacks.onStateChange) {
            callbacks.onStateChange({
                state: gameState,
                level: currentLevel,
                time: elapsedTime,
                player: player,
                levelData: levelData
            });
        }
    }

    function onStateChange(callback) {
        callbacks.onStateChange = callback;
    }

    function onLevelComplete(callback) {
        callbacks.onLevelComplete = callback;
    }

    function onGameOver(callback) {
        callbacks.onGameOver = callback;
    }

    function getState() {
        return gameState;
    }

    return {
        init: init,
        startGame: startGame,
        restart: restart,
        nextLevel: nextLevel,
        pause: pause,
        resume: resume,
        goToMenu: goToMenu,
        onStateChange: onStateChange,
        onLevelComplete: onLevelComplete,
        onGameOver: onGameOver,
        getState: getState
    };
})();
