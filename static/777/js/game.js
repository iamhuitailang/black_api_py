/**
 * 幸运777老虎机游戏 - 游戏逻辑模块
 * 负责管理游戏状态、业务逻辑和各模块的协调
 */

const Game = (function() {
    'use strict';

    const {
        SYMBOLS,
        BET_OPTIONS,
        DEFAULT_STATE,
        ANIMATION_TIMING,
        calculateWin,
        generateRandomReels,
        getSymbolById
    } = GameConfig;

    const {
        getInitialState,
        saveGameState,
        resetGameState,
        clearGameState
    } = Storage;

    const {
        init: initAudio,
        playSpinSound,
        playStopSound,
        playWinSound,
        playJackpotSound,
        playLoseSound,
        playClickSound,
        playCoinSound
    } = Audio;

    const {
        init: initRenderer,
        drawAllReels,
        drawReelSymbols,
        clearAllReels
    } = Renderer;

    const {
        spinReels,
        winAnimation,
        pause: pauseAnimation,
        resume: resumeAnimation,
        stop: stopAnimation,
        isAnimating,
        isPaused: isAnimationPaused
    } = Animation;

    let gameState = null;
    let isInitialized = false;
    let onStateChange = null;
    let onWin = null;
    let onLose = null;
    let onSpinComplete = null;
    let onGameOver = null;

    /**
     * 初始化游戏
     * @param {Object} options - 初始化选项
     * @param {Function} options.onStateChange - 状态改变回调
     * @param {Function} options.onWin - 中奖回调
     * @param {Function} options.onLose - 未中奖回调
     * @param {Function} options.onSpinComplete - 旋转完成回调
     * @param {Function} options.onGameOver - 游戏结束回调
     */
    function init(options = {}) {
        if (isInitialized) {
            console.warn('游戏已初始化');
            return;
        }

        onStateChange = options.onStateChange;
        onWin = options.onWin;
        onLose = options.onLose;
        onSpinComplete = options.onSpinComplete;
        onGameOver = options.onGameOver;

        initAudio();
        initRenderer(['reel1', 'reel2', 'reel3']);

        gameState = getInitialState();

        isInitialized = true;
        console.log('游戏初始化完成');
        console.log('当前游戏状态:', gameState);

        renderInitialReels();

        notifyStateChange();
    }

    /**
     * 渲染初始转盘
     */
    function renderInitialReels() {
        const reelData = gameState.currentReels.map(symbolIdx => [
            (symbolIdx - 1 + SYMBOLS.length) % SYMBOLS.length,
            symbolIdx,
            (symbolIdx + 1) % SYMBOLS.length
        ]);
        drawAllReels(reelData, [0, 0, 0]);
    }

    /**
     * 通知状态改变
     */
    function notifyStateChange() {
        if (onStateChange) {
            onStateChange({ ...gameState });
        }
        saveGameState(gameState);
    }

    /**
     * 获取当前游戏状态
     * @returns {Object} 游戏状态副本
     */
    function getState() {
        return { ...gameState };
    }

    /**
     * 设置下注金额
     * @param {number} amount - 下注金额
     * @returns {boolean} 是否设置成功
     */
    function setBet(amount) {
        if (isAnimating()) {
            console.warn('旋转中无法更改下注');
            return false;
        }

        let betAmount = amount;

        if (amount === 'max' || amount === 'MAX') {
            betAmount = Math.min(gameState.coins, 1000);
        }

        betAmount = Math.max(10, Math.min(betAmount, gameState.coins));

        if (betAmount < 10) {
            console.warn('下注金额不能小于10');
            return false;
        }

        gameState.currentBet = betAmount;
        playClickSound();
        notifyStateChange();
        return true;
    }

    /**
     * 检查是否可以旋转
     * @returns {Object} { canSpin: boolean, reason: string }
     */
    function canSpin() {
        if (!isInitialized) {
            return { canSpin: false, reason: '游戏未初始化' };
        }

        if (isAnimating()) {
            return { canSpin: false, reason: '旋转中' };
        }

        if (gameState.coins < gameState.currentBet) {
            return { canSpin: false, reason: '金币不足' };
        }

        if (gameState.isPaused) {
            return { canSpin: false, reason: '游戏已暂停' };
        }

        return { canSpin: true, reason: '' };
    }

    /**
     * 开始旋转
     * @returns {boolean} 是否成功开始
     */
    function spin() {
        const { canSpin: canDoSpin, reason } = canSpin();

        if (!canDoSpin) {
            console.warn('无法旋转:', reason);

            if (reason === '金币不足') {
                if (onGameOver) {
                    onGameOver();
                }
            }
            return false;
        }

        initAudio();

        gameState.isPlaying = true;
        gameState.totalSpins++;

        const targetReels = generateRandomReels();

        spinReels({
            targetReels,
            onUpdate: (reelData, offsets, stoppedReels) => {
                drawAllReels(reelData, offsets);

                if (stoppedReels.length > 0 && stoppedReels.length <= 3) {
                    playSpinSound();
                }
            },
            onReelStop: (reelIndex) => {
                playStopSound(reelIndex);
            },
            onComplete: (finalReels) => {
                handleSpinComplete(finalReels);
            }
        });

        notifyStateChange();
        return true;
    }

    /**
     * 处理旋转完成
     * @param {Array} finalReels - 最终的三个图案索引
     */
    function handleSpinComplete(finalReels) {
        gameState.currentReels = finalReels;

        const symbolIds = finalReels.map(idx => SYMBOLS[idx].id);
        const winResult = calculateWin(symbolIds, gameState.currentBet);

        if (winResult.isWin) {
            gameState.coins += winResult.winAmount;
            gameState.winCount++;

            if (winResult.winAmount > gameState.maxWin) {
                gameState.maxWin = winResult.winAmount;
            }

            if (winResult.isJackpot) {
                playJackpotSound();
            } else {
                playWinSound();
            }

            playCoinSound();

            if (onWin) {
                onWin(winResult);
            }

            showWinAnimation(winResult);
        } else {
            gameState.coins -= gameState.currentBet;

            playLoseSound();

            if (onLose) {
                onLose();
            }

            if (gameState.coins < gameState.currentBet && gameState.coins < 10) {
                if (onGameOver) {
                    onGameOver();
                }
            }
        }

        gameState.isPlaying = false;
        notifyStateChange();

        if (onSpinComplete) {
            onSpinComplete(winResult);
        }
    }

    /**
     * 显示中奖动画
     * @param {Object} winResult - 中奖结果
     */
    function showWinAnimation(winResult) {
        const reelData = gameState.currentReels.map(symbolIdx => [
            (symbolIdx - 1 + SYMBOLS.length) % SYMBOLS.length,
            symbolIdx,
            (symbolIdx + 1) % SYMBOLS.length
        ]);

        winAnimation({
            duration: winResult.isJackpot ? 3000 : ANIMATION_TIMING.WIN_ANIMATION_DURATION,
            onUpdate: (flashIntensity, scale, progress) => {
                drawAllReels(reelData, [0, 0, 0], {
                    winningReels: [0, 1, 2]
                });
            },
            onComplete: () => {
                renderInitialReels();
            }
        });
    }

    /**
     * 暂停游戏
     * @returns {boolean} 是否成功暂停
     */
    function pause() {
        if (!gameState.isPlaying) {
            console.warn('游戏未在进行中');
            return false;
        }

        if (isAnimationPaused()) {
            console.warn('游戏已暂停');
            return false;
        }

        pauseAnimation();
        gameState.isPaused = true;
        notifyStateChange();
        console.log('游戏已暂停');
        return true;
    }

    /**
     * 恢复游戏
     * @returns {boolean} 是否成功恢复
     */
    function resume() {
        if (!gameState.isPaused) {
            console.warn('游戏未暂停');
            return false;
        }

        resumeAnimation();
        gameState.isPaused = false;
        notifyStateChange();
        console.log('游戏已恢复');
        return true;
    }

    /**
     * 重新开始游戏
     * 重置本局游戏状态，但保留统计数据
     */
    function restart() {
        stopAnimation();

        gameState.isPlaying = false;
        gameState.isPaused = false;
        gameState.currentReels = generateRandomReels();

        if (gameState.coins < 10) {
            gameState.coins = 1000;
        }

        renderInitialReels();
        notifyStateChange();
        playClickSound();
        console.log('游戏已重新开始');
    }

    /**
     * 重置游戏（清除所有数据）
     */
    function reset() {
        stopAnimation();
        clearGameState();
        gameState = resetGameState();
        renderInitialReels();
        notifyStateChange();
        playClickSound();
        console.log('游戏已完全重置');
    }

    /**
     * 补充金币
     * @param {number} amount - 补充的金币数量
     */
    function addCoins(amount = 1000) {
        gameState.coins += amount;
        playCoinSound();
        notifyStateChange();
        console.log(`补充金币: ${amount}`);
    }

    /**
     * 检查游戏是否结束
     * @returns {boolean} 是否结束
     */
    function isGameOver() {
        return gameState.coins < 10 && gameState.coins < gameState.currentBet;
    }

    /**
     * 检查是否正在旋转
     * @returns {boolean} 是否正在旋转
     */
    function isSpinning() {
        return isAnimating();
    }

    /**
     * 检查是否已暂停
     * @returns {boolean} 是否已暂停
     */
    function isPaused() {
        return gameState.isPaused;
    }

    return {
        init,
        getState,
        setBet,
        canSpin,
        spin,
        pause,
        resume,
        restart,
        reset,
        addCoins,
        isGameOver,
        isSpinning,
        isPaused
    };
})();

window.Game = Game;
