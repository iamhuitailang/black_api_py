var Game = (function() {
    'use strict';

    var gameConfig = Config.GAME_CONFIG;
    var colors = Config.COLORS;

    var canvas, ctx;
    var animationId;
    var lastTime;

    var state = {
        level: 1,
        score: 0,
        combo: 0,
        difficulty: 'easy',
        isStarted: false,
        isPaused: false,
        isPlaying: false,
        isAiming: false,
        isPlacingCueBall: false,
        cueAngle: 0,
        cueForce: 0,
        balls: [],
        tableBounds: null,
        pockets: []
    };

    var elements = {};

    function init() {
        cacheElements();
        setupCanvas();
        bindEvents();
        loadOrCreateGame();
        startRenderLoop();
        updateUI();
    }

    function cacheElements() {
        elements = {
            canvas: Utils.$('#game-canvas'),
            startOverlay: Utils.$('#start-overlay'),
            pauseOverlay: Utils.$('#pause-overlay'),
            winOverlay: Utils.$('#win-overlay'),
            difficultyOverlay: Utils.$('#difficulty-overlay'),
            startBtn: Utils.$('#start-btn'),
            pauseBtn: Utils.$('#pause-btn'),
            restartBtn: Utils.$('#restart-btn'),
            difficultyBtn: Utils.$('#difficulty-btn'),
            resumeBtn: Utils.$('#resume-btn'),
            pauseRestartBtn: Utils.$('#pause-restart-btn'),
            pauseExitBtn: Utils.$('#pause-exit-btn'),
            nextLevelBtn: Utils.$('#next-level-btn'),
            difficultyCloseBtn: Utils.$('#difficulty-close-btn'),
            levelDisplay: Utils.$('#level-display'),
            scoreDisplay: Utils.$('#score-display'),
            comboDisplay: Utils.$('#combo-display'),
            difficultyDisplay: Utils.$('#difficulty-display'),
            winLevel: Utils.$('#win-level'),
            winScore: Utils.$('#win-score'),
            gameTip: Utils.$('#game-tip')
        };
    }

    function setupCanvas() {
        canvas = elements.canvas;
        ctx = canvas.getContext('2d');
        canvas.width = gameConfig.canvasWidth;
        canvas.height = gameConfig.canvasHeight;
        state.tableBounds = Physics.getTableBounds(canvas.width, canvas.height);
        state.pockets = Physics.getPockets(state.tableBounds);
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', startGame);
        elements.pauseBtn.addEventListener('click', pauseGame);
        elements.restartBtn.addEventListener('click', restartGame);
        elements.difficultyBtn.addEventListener('click', showDifficultySelect);
        elements.resumeBtn.addEventListener('click', resumeGame);
        elements.pauseRestartBtn.addEventListener('click', restartGame);
        elements.pauseExitBtn.addEventListener('click', exitGame);
        elements.nextLevelBtn.addEventListener('click', nextLevel);
        elements.difficultyCloseBtn.addEventListener('click', hideDifficultySelect);

        var difficultyButtons = Utils.$$('.btn-difficulty');
        difficultyButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var difficulty = btn.dataset.difficulty;
                setDifficulty(difficulty);
                hideDifficultySelect();
            });
        });

        window.addEventListener('beforeunload', function(e) {
            if (state.isStarted) {
                saveGameState();
            }
        });

        window.addEventListener('resize', Utils.debounce(function() {
        }, 100));

        Input.init(canvas, {
            canPlaceCueBall: canPlaceCueBall,
            canAim: canAim,
            getCueBall: getCueBall,
            getDifficultyConfig: getDifficultyConfig,
            startPlacingCueBall: startPlacingCueBall,
            updatePlacingCueBall: updatePlacingCueBall,
            confirmPlacingCueBall: confirmPlacingCueBall,
            startAiming: startAiming,
            updateAiming: updateAiming,
            shoot: shoot
        });
    }

    function loadOrCreateGame() {
        var saved = Storage.loadGame();
        if (saved && saved.isStarted && saved.balls && saved.balls.length > 0) {
            state.level = saved.level || 1;
            state.score = saved.score || 0;
            state.combo = saved.combo || 0;
            state.difficulty = saved.difficulty || 'easy';
            state.isStarted = true;
            state.isPaused = false;
            state.isPlaying = false;
            state.isAiming = false;
            state.isPlacingCueBall = false;

            state.balls = Storage.deserializeBalls(saved.balls);
            
            var remainingBalls = getRemainingTargetBalls();
            if (remainingBalls.length === 0) {
                initLevel();
            } else {
                var cueBall = getCueBall();
                if (cueBall && cueBall.isPocketed) {
                    state.isPlacingCueBall = true;
                    resetCueBall();
                }
            }

            Utils.showToast('游戏已恢复！', 'info');
        } else {
            state.level = 1;
            state.score = 0;
            state.combo = 0;
            state.difficulty = 'easy';
            state.isStarted = false;
            state.isPaused = false;
            state.isPlaying = false;
            Storage.clearGame();
            Utils.addClass(elements.startOverlay, 'show');
            initLevel();
        }
    }

    function initLevel() {
        var difficultyConfig = getDifficultyConfig();
        state.balls = [];
        state.isPlaying = false;
        state.isAiming = false;
        state.isPlacingCueBall = true;

        var cueBall = Physics.createBall(
            state.tableBounds.left + state.tableBounds.width * 0.2,
            (state.tableBounds.top + state.tableBounds.bottom) / 2,
            gameConfig.ballRadius,
            colors.cueBall,
            '',
            true
        );
        state.balls.push(cueBall);

        var positions = Physics.generateBallPositions(
            difficultyConfig.ballCount,
            state.tableBounds,
            gameConfig.ballRadius
        );

        for (var i = 0; i < difficultyConfig.ballCount; i++) {
            var colorIndex = i % colors.ballColors.length;
            var ball = Physics.createBall(
                positions[i].x,
                positions[i].y,
                gameConfig.ballRadius,
                colors.ballColors[colorIndex],
                Config.BALL_LABELS[i],
                false
            );
            state.balls.push(ball);
        }

        updateGameTip();
    }

    function resetCueBall() {
        var cueBall = getCueBall();
        if (cueBall) {
            cueBall.x = state.tableBounds.left + state.tableBounds.width * 0.2;
            cueBall.y = (state.tableBounds.top + state.tableBounds.bottom) / 2;
            cueBall.vx = 0;
            cueBall.vy = 0;
            cueBall.isPocketed = false;
            cueBall.isMoving = false;
        }
    }

    function startGame() {
        Utils.removeClass(elements.startOverlay, 'show');
        state.isStarted = true;
        state.isPaused = false;
        state.level = 1;
        state.score = 0;
        state.combo = 0;
        initLevel();
        updateUI();
        saveGameState();
    }

    function pauseGame() {
        if (!state.isStarted || state.isPaused) return;
        state.isPaused = true;
        Utils.addClass(elements.pauseOverlay, 'show');
        saveGameState();
    }

    function resumeGame() {
        Utils.removeClass(elements.pauseOverlay, 'show');
        state.isPaused = false;
    }

    function restartGame() {
        Utils.removeClass(elements.pauseOverlay, 'show');
        Utils.removeClass(elements.winOverlay, 'show');
        state.level = 1;
        state.score = 0;
        state.combo = 0;
        state.isPlaying = false;
        state.isPaused = false;
        state.isAiming = false;
        state.isPlacingCueBall = false;
        Effects.clear();
        initLevel();
        updateUI();
        saveGameState();
        Utils.showToast('游戏已重新开始！', 'info');
    }

    function exitGame() {
        Utils.removeClass(elements.pauseOverlay, 'show');
        Utils.removeClass(elements.winOverlay, 'show');
        state.isStarted = false;
        state.isPaused = false;
        Storage.clearGame();
        Utils.addClass(elements.startOverlay, 'show');
        initLevel();
    }

    function nextLevel() {
        Utils.removeClass(elements.winOverlay, 'show');
        state.level++;
        state.combo = 0;
        state.isPlaying = false;
        state.isAiming = false;
        state.isPlacingCueBall = false;
        Effects.clear();
        initLevel();
        updateUI();
        saveGameState();
    }

    function showDifficultySelect() {
        Utils.addClass(elements.difficultyOverlay, 'show');
    }

    function hideDifficultySelect() {
        Utils.removeClass(elements.difficultyOverlay, 'show');
    }

    function setDifficulty(difficulty) {
        if (state.isPlaying) {
            Utils.showToast('游戏进行中无法切换难度！', 'warning');
            return;
        }
        state.difficulty = difficulty;
        state.level = 1;
        state.score = 0;
        state.combo = 0;
        state.isPlacingCueBall = false;
        Effects.clear();
        initLevel();
        updateUI();
        saveGameState();
        var config = Config.getDifficultyConfig(difficulty);
        Utils.showToast('难度已设置为 ' + config.name, 'success');
    }

    function canPlaceCueBall() {
        if (!state.isStarted || state.isPaused || state.isPlaying) return false;
        var cueBall = getCueBall();
        if (!cueBall) return false;
        return cueBall.isPocketed || state.isPlacingCueBall;
    }

    function canAim() {
        if (!state.isStarted || state.isPaused || state.isPlaying) return false;
        if (state.isPlacingCueBall) return false;
        var cueBall = getCueBall();
        if (!cueBall) return false;
        return !cueBall.isPocketed && !cueBall.isMoving;
    }

    function getCueBall() {
        for (var i = 0; i < state.balls.length; i++) {
            if (state.balls[i].isCue) {
                return state.balls[i];
            }
        }
        return null;
    }

    function getRemainingTargetBalls() {
        return state.balls.filter(function(ball) {
            return !ball.isCue && !ball.isPocketed;
        });
    }

    function getDifficultyConfig() {
        return Config.getDifficultyConfig(state.difficulty);
    }

    function startPlacingCueBall(x, y) {
        state.isPlacingCueBall = true;
        updatePlacingCueBall(x, y);
    }

    function updatePlacingCueBall(x, y) {
        var cueBall = getCueBall();
        if (!cueBall) return;

        var newX = Utils.clamp(x, state.tableBounds.left + cueBall.radius, state.tableBounds.right - cueBall.radius);
        var newY = Utils.clamp(y, state.tableBounds.top + cueBall.radius, state.tableBounds.bottom - cueBall.radius);

        var valid = true;
        for (var i = 0; i < state.balls.length; i++) {
            var ball = state.balls[i];
            if (ball.isCue || ball.isPocketed) continue;
            var distance = Utils.getDistance(newX, newY, ball.x, ball.y);
            if (distance < cueBall.radius * 2) {
                valid = false;
                break;
            }
        }

        if (valid) {
            cueBall.x = newX;
            cueBall.y = newY;
        }
    }

    function confirmPlacingCueBall(x, y) {
        updatePlacingCueBall(x, y);
        state.isPlacingCueBall = false;
        updateGameTip();
        saveGameState();
    }

    function startAiming(angle, force) {
        state.isAiming = true;
        state.cueAngle = angle;
        state.cueForce = force;
    }

    function updateAiming(angle, force) {
        state.cueAngle = angle;
        state.cueForce = force;
    }

    function shoot(angle, force) {
        var cueBall = getCueBall();
        if (!cueBall || force < 0.5) return;

        state.isAiming = false;
        state.isPlaying = true;

        cueBall.vx = Math.cos(angle) * force;
        cueBall.vy = Math.sin(angle) * force;
        cueBall.isMoving = true;

        Effects.createCueStreak(cueBall.x, cueBall.y, angle);
        state.cueForce = 0;
        saveGameState();
    }

    function startRenderLoop() {
        if (animationId) return;
        lastTime = Utils.now();

        function loop() {
            var currentTime = Utils.now();
            var deltaTime = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;

            if (state.isStarted && !state.isPaused) {
                update(deltaTime);
            }
            
            render();

            animationId = requestAnimationFrame(loop);
        }

        animationId = requestAnimationFrame(loop);
    }

    function stopRenderLoop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function update(deltaTime) {
        var difficultyConfig = getDifficultyConfig();
        var ballsPocketedThisFrame = [];

        for (var i = 0; i < state.balls.length; i++) {
            var ball = state.balls[i];
            if (ball.isPocketed) continue;

            if (ball.isMoving) {
                Physics.updateBall(ball, difficultyConfig.friction);
                Physics.checkWallCollision(ball, state.tableBounds);
            }
        }

        for (var i = 0; i < state.balls.length; i++) {
            for (var j = i + 1; j < state.balls.length; j++) {
                var b1 = state.balls[i];
                var b2 = state.balls[j];
                if (b1.isPocketed || b2.isPocketed) continue;

                var collision = Physics.checkBallCollision(b1, b2);
                if (collision.collided) {
                    var collisionX = (b1.x + b2.x) / 2;
                    var collisionY = (b1.y + b2.y) / 2;
                    Effects.createSparkParticles(collisionX, collisionY, 8, '#ffd700');
                }
            }
        }

        for (var i = 0; i < state.balls.length; i++) {
            var ball = state.balls[i];
            if (ball.isPocketed) continue;

            var pocketResult = Physics.checkPocketCollision(ball, state.pockets, difficultyConfig.pocketRadius);
            if (pocketResult.pocketed) {
                ball.isPocketed = true;
                ball.vx = 0;
                ball.vy = 0;
                ball.isMoving = false;
                ballsPocketedThisFrame.push({
                    ball: ball,
                    pocketIndex: pocketResult.pocketIndex
                });
            }
        }

        ballsPocketedThisFrame.forEach(function(item) {
            var pocket = state.pockets[item.pocketIndex];
            Effects.createPocketSplash(pocket.x, pocket.y);

            if (item.ball.isCue) {
                state.score = Math.max(0, state.score - gameConfig.cueBallPenalty);
                state.combo = 0;
                state.isPlacingCueBall = true;
                resetCueBall();
                Utils.showToast('母球入袋，-5分！', 'error');
            } else {
                state.score += gameConfig.scorePerBall;
                state.combo++;
                var comboBonus = (state.combo - 1) * gameConfig.comboBonus;
                if (comboBonus > 0) {
                    state.score += comboBonus;
                    Utils.showToast('目标球入袋，+10分！连击 +' + comboBonus, 'success');
                } else {
                    Utils.showToast('目标球入袋，+10分！', 'success');
                }
            }
        });

        if (ballsPocketedThisFrame.length > 0) {
            updateUI();
        }

        if (state.isPlaying && !Physics.areAnyBallsMoving(state.balls)) {
            state.isPlaying = false;
            var remaining = getRemainingTargetBalls();

            if (remaining.length === 0) {
                state.score += gameConfig.clearBonus;
                Effects.createMultipleFireworks(5);
                Utils.showToast('清台完成！+50分', 'success');
                elements.winLevel.textContent = state.level;
                elements.winScore.textContent = state.score;
                Utils.addClass(elements.winOverlay, 'show');
            } else {
                state.combo = 0;
            }

            updateUI();
            saveGameState();
        }

        Effects.update();
        updateGameTip();
    }

    function render() {
        Renderer.clear(ctx, canvas.width, canvas.height);

        var difficultyConfig = getDifficultyConfig();

        Renderer.drawTable(ctx, canvas.width, canvas.height, state.tableBounds);
        Renderer.drawPockets(ctx, state.pockets, difficultyConfig.pocketRadius);

        for (var i = 0; i < state.balls.length; i++) {
            var ball = state.balls[i];
            if (ball.isPocketed) continue;

            if (state.isPlacingCueBall && ball.isCue) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                Renderer.drawBall(ctx, ball);
                ctx.restore();

                var valid = isCueBallPositionValid(ball);
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
                ctx.strokeStyle = valid ? 'rgba(85, 239, 196, 0.8)' : 'rgba(255, 107, 107, 0.8)';
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                Renderer.drawBall(ctx, ball);
            }
        }

        if (state.isStarted) {
            var cueBall = getCueBall();
            if (state.isAiming && cueBall && !cueBall.isPocketed && !cueBall.isMoving) {
                Renderer.drawAimLine(ctx, cueBall, state.cueAngle, state.cueForce, difficultyConfig.maxForce);
                Renderer.drawCue(ctx, cueBall, state.cueAngle, state.cueForce, difficultyConfig.maxForce, true);
            }
        }

        Effects.render(ctx);
    }

    function isCueBallPositionValid(cueBall) {
        if (cueBall.x - cueBall.radius < state.tableBounds.left ||
            cueBall.x + cueBall.radius > state.tableBounds.right ||
            cueBall.y - cueBall.radius < state.tableBounds.top ||
            cueBall.y + cueBall.radius > state.tableBounds.bottom) {
            return false;
        }

        for (var i = 0; i < state.balls.length; i++) {
            var ball = state.balls[i];
            if (ball.isCue || ball.isPocketed) continue;
            var distance = Utils.getDistance(cueBall.x, cueBall.y, ball.x, ball.y);
            if (distance < cueBall.radius * 2) {
                return false;
            }
        }

        return true;
    }

    function updateUI() {
        var difficultyConfig = getDifficultyConfig();
        elements.levelDisplay.textContent = state.level;
        elements.scoreDisplay.textContent = state.score;
        elements.comboDisplay.textContent = state.combo;
        elements.difficultyDisplay.textContent = difficultyConfig.icon + ' ' + difficultyConfig.name;
    }

    function updateGameTip() {
        var remaining = getRemainingTargetBalls();
        var cueBall = getCueBall();

        if (!state.isStarted) {
            elements.gameTip.textContent = '点击开始游戏按钮开始游戏';
        } else if (state.isPlacingCueBall) {
            elements.gameTip.textContent = '拖动鼠标/手指放置母球位置';
        } else if (state.isPlaying) {
            elements.gameTip.textContent = '球在运动中... 剩余 ' + remaining.length + ' 个目标球';
        } else if (cueBall && cueBall.isPocketed) {
            elements.gameTip.textContent = '母球入袋！点击屏幕重新放置母球';
        } else {
            elements.gameTip.textContent = '按住并拖动鼠标/手指瞄准，释放击球！剩余 ' + remaining.length + ' 个目标球';
        }
    }

    function saveGameState() {
        var data = {
            level: state.level,
            score: state.score,
            combo: state.combo,
            difficulty: state.difficulty,
            isStarted: state.isStarted,
            isPaused: state.isPaused,
            balls: Storage.serializeBalls(state.balls)
        };
        Storage.saveGame(data);
    }

    return {
        init: init,
        getState: function() { return state; }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});
