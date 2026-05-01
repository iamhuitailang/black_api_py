/**
 * 幸运777老虎机游戏 - 动画模块
 * 负责管理转盘滚动动画和中奖动画
 */

const Animation = (function() {
    'use strict';

    const { ANIMATION_TIMING, SYMBOLS, generateRandomReels } = GameConfig;
    const { getCanvasSize } = Renderer;

    let animationFrameId = null;
    let isAnimating = false;
    let isPaused = false;
    let pauseTime = 0;
    let startTime = 0;

    /**
     * 生成滚动时的图案序列
     * @param {number} count - 需要的图案数量
     * @returns {Array} 图案索引数组
     */
    function generateScrollSymbols(count) {
        const symbols = [];
        for (let i = 0; i < count; i++) {
            const reel = generateRandomReels();
            symbols.push(reel[0]);
        }
        return symbols;
    }

    /**
     * 缓动函数 - 减速效果
     * @param {number} t - 时间进度（0-1）
     * @returns {number} 缓动后的值
     */
    function easeOutQuad(t) {
        return t * (2 - t);
    }

    /**
     * 缓动函数 - 弹性效果
     * @param {number} t - 时间进度（0-1）
     * @returns {number} 缓动后的值
     */
    function easeOutElastic(t) {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    }

    /**
     * 转盘滚动动画
     * @param {Object} options - 动画选项
     * @param {Array} options.targetReels - 最终停止的图案索引 [转盘1, 转盘2, 转盘3]
     * @param {Function} options.onUpdate - 每帧更新回调 (reelData, offsets, stoppedReels)
     * @param {Function} options.onComplete - 动画完成回调
     * @param {Function} options.onReelStop - 每个转盘停止时的回调 (reelIndex)
     */
    function spinReels(options) {
        const { targetReels, onUpdate, onComplete, onReelStop } = options;

        if (isAnimating) {
            console.warn('动画已在进行中');
            return;
        }

        isAnimating = true;
        isPaused = false;
        startTime = performance.now();

        const canvasSize = getCanvasSize();
        const slotHeight = canvasSize.height / 3;

        const scrollSymbols = [
            generateScrollSymbols(20),
            generateScrollSymbols(20),
            generateScrollSymbols(20)
        ];

        const reelData = [
            [...scrollSymbols[0].slice(-3)],
            [...scrollSymbols[1].slice(-3)],
            [...scrollSymbols[2].slice(-3)]
        ];

        const offsets = [0, 0, 0];
        const stoppedReels = [];
        const stopTimings = [
            ANIMATION_TIMING.FAST_SPIN_DURATION + ANIMATION_TIMING.SLOW_SPIN_DURATION,
            ANIMATION_TIMING.FAST_SPIN_DURATION + ANIMATION_TIMING.SLOW_SPIN_DURATION * 2,
            ANIMATION_TIMING.FAST_SPIN_DURATION + ANIMATION_TIMING.SLOW_SPIN_DURATION * 3
        ];

        let symbolIndices = [scrollSymbols[0].length - 1, scrollSymbols[1].length - 1, scrollSymbols[2].length - 1];

        function animate(currentTime) {
            if (!isAnimating) return;

            if (isPaused) {
                pauseTime = currentTime;
                animationFrameId = requestAnimationFrame(animate);
                return;
            }

            const elapsed = currentTime - startTime;

            for (let i = 0; i < 3; i++) {
                if (stoppedReels.includes(i)) continue;

                if (elapsed < ANIMATION_TIMING.FAST_SPIN_DURATION) {
                    const speed = slotHeight * 0.8;
                    offsets[i] += speed * 0.016;

                    if (offsets[i] >= slotHeight) {
                        offsets[i] -= slotHeight;
                        symbolIndices[i] = (symbolIndices[i] + 1) % scrollSymbols[i].length;
                        reelData[i] = [
                            scrollSymbols[i][(symbolIndices[i] - 2 + scrollSymbols[i].length) % scrollSymbols[i].length],
                            scrollSymbols[i][(symbolIndices[i] - 1 + scrollSymbols[i].length) % scrollSymbols[i].length],
                            scrollSymbols[i][symbolIndices[i]]
                        ];
                    }
                } else {
                    const slowPhaseStart = ANIMATION_TIMING.FAST_SPIN_DURATION + ANIMATION_TIMING.SLOW_SPIN_DURATION * i;
                    const slowPhaseEnd = stopTimings[i];

                    if (elapsed >= slowPhaseStart && elapsed < slowPhaseEnd) {
                        const slowProgress = (elapsed - slowPhaseStart) / ANIMATION_TIMING.SLOW_SPIN_DURATION;
                        const easedProgress = easeOutQuad(slowProgress);
                        const targetOffset = slotHeight * (1 - easedProgress);

                        if (slowProgress > 0.5 && reelData[i][1] !== targetReels[i]) {
                            reelData[i] = [
                                (targetReels[i] - 1 + SYMBOLS.length) % SYMBOLS.length,
                                targetReels[i],
                                (targetReels[i] + 1) % SYMBOLS.length
                            ];
                        }

                        offsets[i] = targetOffset;
                    } else if (elapsed >= slowPhaseEnd) {
                        reelData[i] = [
                            (targetReels[i] - 1 + SYMBOLS.length) % SYMBOLS.length,
                            targetReels[i],
                            (targetReels[i] + 1) % SYMBOLS.length
                        ];
                        offsets[i] = 0;
                        stoppedReels.push(i);

                        if (onReelStop) {
                            onReelStop(i);
                        }
                    }
                }
            }

            if (onUpdate) {
                onUpdate(reelData, offsets, stoppedReels);
            }

            if (stoppedReels.length >= 3) {
                isAnimating = false;
                if (onComplete) {
                    onComplete(targetReels);
                }
                return;
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * 中奖动画
     * @param {Object} options - 动画选项
     * @param {number} options.duration - 动画持续时间（毫秒）
     * @param {Function} options.onUpdate - 每帧更新回调 (flashIntensity, scale)
     * @param {Function} options.onComplete - 动画完成回调
     */
    function winAnimation(options) {
        const {
            duration = ANIMATION_TIMING.WIN_ANIMATION_DURATION,
            onUpdate,
            onComplete
        } = options;

        const animStartTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - animStartTime;
            const progress = Math.min(elapsed / duration, 1);

            const flashIntensity = (Math.sin(progress * Math.PI * 6) + 1) / 2;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.1;

            if (onUpdate) {
                onUpdate(flashIntensity, scale, progress);
            }

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                if (onComplete) {
                    onComplete();
                }
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * 暂停当前动画
     */
    function pause() {
        if (isAnimating && !isPaused) {
            isPaused = true;
            console.log('动画已暂停');
        }
    }

    /**
     * 恢复暂停的动画
     */
    function resume() {
        if (isAnimating && isPaused) {
            isPaused = false;
            const now = performance.now();
            startTime += (now - pauseTime);
            console.log('动画已恢复');
        }
    }

    /**
     * 停止所有动画
     */
    function stop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        isAnimating = false;
        isPaused = false;
    }

    /**
     * 检查是否正在动画中
     * @returns {boolean} 是否正在动画
     */
    function isInAnimation() {
        return isAnimating;
    }

    /**
     * 检查是否暂停
     * @returns {boolean} 是否暂停
     */
    function isInPause() {
        return isPaused;
    }

    return {
        spinReels,
        winAnimation,
        pause,
        resume,
        stop,
        isAnimating: isInAnimation,
        isPaused: isInPause
    };
})();

window.Animation = Animation;
