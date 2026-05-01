/**
 * 幸运777老虎机游戏 - 主应用入口
 * 负责整合所有模块、处理DOM事件和UI更新
 */

(function() {
    'use strict';

    const { BET_OPTIONS, SYMBOLS, getSymbolById } = GameConfig;

    const DOM = {
        coins: document.getElementById('coins'),
        maxWin: document.getElementById('max-win'),
        winCount: document.getElementById('win-count'),
        totalSpins: document.getElementById('total-spins'),
        currentBet: document.getElementById('current-bet'),
        winMessage: document.getElementById('win-message'),
        winDisplay: document.getElementById('win-display'),
        startBtn: document.getElementById('start-btn'),
        spinBtn: document.getElementById('spin-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        restartBtn: document.getElementById('restart-btn'),
        lever: document.getElementById('lever'),
        betButtons: document.querySelectorAll('.bet-btn'),
        startModal: document.getElementById('start-modal'),
        modalStartBtn: document.getElementById('modal-start-btn'),
        gameOverModal: document.getElementById('game-over-modal'),
        addCoinsBtn: document.getElementById('add-coins-btn'),
        reelCanvases: document.querySelectorAll('.reel-canvas')
    };

    let audioInitialized = false;

    /**
     * 更新UI显示
     * @param {Object} state - 游戏状态
     */
    function updateUI(state) {
        DOM.coins.textContent = state.coins.toLocaleString();
        DOM.maxWin.textContent = state.maxWin.toLocaleString();
        DOM.winCount.textContent = state.winCount.toLocaleString();
        DOM.totalSpins.textContent = state.totalSpins.toLocaleString();
        DOM.currentBet.textContent = state.currentBet.toLocaleString();

        updateBetButtons(state.currentBet, state.coins);
        updateControlButtons(state);
    }

    /**
     * 更新下注按钮状态
     * @param {number} currentBet - 当前下注
     * @param {number} coins - 当前金币
     */
    function updateBetButtons(currentBet, coins) {
        DOM.betButtons.forEach(btn => {
            const betValue = btn.dataset.bet;
            let btnBet;

            if (betValue === 'max') {
                btnBet = Math.min(coins, 1000);
                btn.classList.toggle('active', currentBet === btnBet && currentBet > 100);
            } else {
                btnBet = parseInt(betValue);
                btn.classList.toggle('active', currentBet === btnBet);
            }

            btn.disabled = btnBet > coins || (betValue !== 'max' && btnBet > coins);
        });
    }

    /**
     * 更新控制按钮状态
     * @param {Object} state - 游戏状态
     */
    function updateControlButtons(state) {
        const isSpinning = Game.isSpinning();
        const isPaused = Game.isPaused();
        const canSpin = Game.canSpin().canSpin;

        DOM.spinBtn.disabled = !canSpin || isPaused;
        DOM.spinBtn.textContent = isSpinning ? '旋转中...' : '旋转';

        DOM.pauseBtn.disabled = !isSpinning || isPaused;
        DOM.pauseBtn.textContent = isPaused ? '已暂停' : '暂停';

        DOM.startBtn.disabled = isSpinning;
        DOM.restartBtn.disabled = false;

        DOM.lever.style.cursor = canSpin && !isPaused ? 'pointer' : 'not-allowed';
    }

    /**
     * 显示中奖消息
     * @param {Object} winResult - 中奖结果
     */
    function showWinMessage(winResult) {
        if (!winResult.isWin) {
            hideWinMessage();
            return;
        }

        const message = winResult.isJackpot
            ? `🎉 大奖！获得 ${winResult.winAmount} 金币！（${winResult.multiplier}倍）`
            : `✨ ${winResult.description}！获得 ${winResult.winAmount} 金币！`;

        DOM.winMessage.textContent = message;
        DOM.winMessage.style.color = winResult.isJackpot ? '#ffd700' : '#00ff88';
        DOM.winMessage.classList.add('show');

        DOM.reelCanvases.forEach(canvas => {
            canvas.classList.add('reel-winning');
        });

        setTimeout(() => {
            hideWinMessage();
        }, winResult.isJackpot ? 4000 : 2500);
    }

    /**
     * 隐藏中奖消息
     */
    function hideWinMessage() {
        DOM.winMessage.classList.remove('show');
        DOM.reelCanvases.forEach(canvas => {
            canvas.classList.remove('reel-winning');
        });
    }

    /**
     * 显示未中奖提示
     */
    function showLoseMessage() {
        DOM.winMessage.textContent = '😔 再接再厉！';
        DOM.winMessage.style.color = '#ff6b6b';
        DOM.winMessage.classList.add('show');

        setTimeout(() => {
            hideWinMessage();
        }, 1500);
    }

    /**
     * 显示开始模态框
     */
    function showStartModal() {
        DOM.startModal.classList.add('show');
    }

    /**
     * 隐藏开始模态框
     */
    function hideStartModal() {
        DOM.startModal.classList.remove('show');
    }

    /**
     * 显示游戏结束模态框
     */
    function showGameOverModal() {
        DOM.gameOverModal.classList.add('show');
    }

    /**
     * 隐藏游戏结束模态框
     */
    function hideGameOverModal() {
        DOM.gameOverModal.classList.remove('show');
    }

    /**
     * 初始化事件监听
     */
    function initEventListeners() {
        DOM.modalStartBtn.addEventListener('click', () => {
            if (!audioInitialized) {
                Audio.init();
                audioInitialized = true;
            }
            Audio.playClickSound();
            hideStartModal();
            Game.init({
                onStateChange: updateUI,
                onWin: showWinMessage,
                onLose: showLoseMessage,
                onGameOver: showGameOverModal
            });
        });

        DOM.startBtn.addEventListener('click', () => {
            if (!audioInitialized) {
                Audio.init();
                audioInitialized = true;
            }
            Audio.playClickSound();
            hideStartModal();
            Game.init({
                onStateChange: updateUI,
                onWin: showWinMessage,
                onLose: showLoseMessage,
                onGameOver: showGameOverModal
            });
        });

        DOM.betButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const betValue = btn.dataset.bet;
                const bet = betValue === 'max' ? 'max' : parseInt(betValue);
                Game.setBet(bet);
            });
        });

        DOM.spinBtn.addEventListener('click', () => {
            if (!audioInitialized) {
                Audio.init();
                audioInitialized = true;
            }
            Game.spin();
        });

        DOM.lever.addEventListener('click', () => {
            if (!audioInitialized) {
                Audio.init();
                audioInitialized = true;
            }

            DOM.lever.classList.add('pulled');
            setTimeout(() => {
                DOM.lever.classList.remove('pulled');
            }, 300);

            Game.spin();
        });

        DOM.pauseBtn.addEventListener('click', () => {
            if (Game.isPaused()) {
                Game.resume();
            } else {
                Game.pause();
            }
        });

        DOM.restartBtn.addEventListener('click', () => {
            hideWinMessage();
            hideGameOverModal();
            Game.restart();
        });

        DOM.addCoinsBtn.addEventListener('click', () => {
            Game.addCoins(1000);
            hideGameOverModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();

                if (DOM.startModal.classList.contains('show')) {
                    if (!audioInitialized) {
                        Audio.init();
                        audioInitialized = true;
                    }
                    Audio.playClickSound();
                    hideStartModal();
                    Game.init({
                        onStateChange: updateUI,
                        onWin: showWinMessage,
                        onLose: showLoseMessage,
                        onGameOver: showGameOverModal
                    });
                } else {
                    Game.spin();
                }
            }

            if (e.code === 'Escape' || e.code === 'KeyP') {
                if (Game.isSpinning()) {
                    if (Game.isPaused()) {
                        Game.resume();
                    } else {
                        Game.pause();
                    }
                }
            }

            if (e.code === 'KeyR') {
                hideWinMessage();
                hideGameOverModal();
                Game.restart();
            }
        });

        document.addEventListener('click', () => {
            if (!audioInitialized) {
                Audio.init();
                audioInitialized = true;
            }
        }, { once: true });
    }

    /**
     * 初始化闪烁灯效果
     */
    function initLampAnimation() {
        const lamps = document.querySelectorAll('.lamp');
        let lampIndex = 0;

        setInterval(() => {
            lamps.forEach((lamp, i) => {
                const offset = (i - lampIndex + lamps.length) % lamps.length;
                const scale = 1 - offset * 0.1;
                lamp.style.transform = `scale(${Math.max(0.5, scale)})`;
                lamp.style.opacity = Math.max(0.3, 1 - offset * 0.15);
            });
            lampIndex = (lampIndex + 1) % lamps.length;
        }, 200);
    }

    /**
     * 页面加载完成后初始化
     */
    function init() {
        console.log('🎰 幸运777老虎机游戏加载中...');

        initEventListeners();
        initLampAnimation();

        console.log('🎰 幸运777老虎机游戏已就绪！');
        console.log('🎮 操作提示：');
        console.log('   - 空格键：旋转转盘');
        console.log('   - P键/ESC：暂停/继续');
        console.log('   - R键：重新开始');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
