function createUI(gameState, callbacks) {
    const elements = {
        startBtn: document.getElementById('start-btn'),
        hitBtn: document.getElementById('hit-btn'),
        standBtn: document.getElementById('stand-btn'),
        doubleBtn: document.getElementById('double-btn'),
        newGameBtn: document.getElementById('new-game-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        resumeBtn: document.getElementById('resume-btn'),
        restartBtn: document.getElementById('restart-btn'),
        quitBtn: document.getElementById('quit-btn'),
        confirmQuitBtn: document.getElementById('confirm-quit-btn'),
        cancelQuitBtn: document.getElementById('cancel-quit-btn'),
        rechargeBtn: document.getElementById('recharge-btn'),
        betMinus: document.getElementById('bet-minus'),
        betPlus: document.getElementById('bet-plus'),
        betAmount: document.getElementById('bet-amount'),
        presetBtns: document.querySelectorAll('.btn-preset'),
        chips: document.getElementById('chips'),
        currentScore: document.getElementById('current-score'),
        highScore: document.getElementById('high-score'),
        wins: document.getElementById('wins'),
        losses: document.getElementById('losses'),
        pushes: document.getElementById('pushes'),
        maxStreak: document.getElementById('max-streak'),
        totalProfit: document.getElementById('total-profit'),
        pauseModal: document.getElementById('pause-modal'),
        quitModal: document.getElementById('quit-modal'),
        statusMessage: document.getElementById('status-message')
    };

    function updateAll(gameState) {
        updateStats(gameState);
        updateButtons(gameState);
    }

    function updateStats(gameState) {
        const stats = gameState.stats;
        
        elements.chips.textContent = gameState.chips;
        elements.currentScore.textContent = stats.currentScore;
        elements.highScore.textContent = stats.highScore;
        elements.wins.textContent = stats.wins;
        elements.losses.textContent = stats.losses;
        elements.pushes.textContent = stats.pushes;
        elements.maxStreak.textContent = stats.maxStreak;
        elements.totalProfit.textContent = stats.totalProfit;
        
        const profitEl = elements.totalProfit;
        if (stats.totalProfit > 0) {
            profitEl.textContent = '+' + stats.totalProfit;
            profitEl.style.color = '#4ade80';
        } else if (stats.totalProfit < 0) {
            profitEl.style.color = '#f87171';
        } else {
            profitEl.style.color = '#fbbf24';
        }
    }

    function updateButtons(gameState) {
        const state = gameState.state;
        const canDouble = gameState.playerHand.cards.length === 2 && 
                         gameState.chips >= gameState.bet;

        elements.startBtn.classList.toggle('hidden', state !== 'idle');
        elements.hitBtn.classList.toggle('hidden', state !== 'player_turn');
        elements.standBtn.classList.toggle('hidden', state !== 'player_turn');
        elements.doubleBtn.classList.toggle('hidden', state !== 'player_turn' || !canDouble);
        elements.newGameBtn.classList.toggle('hidden', state !== 'settlement');

        elements.betMinus.disabled = state !== 'idle';
        elements.betPlus.disabled = state !== 'idle';
        elements.betAmount.disabled = state !== 'idle';
        elements.presetBtns.forEach(btn => {
            btn.disabled = state !== 'idle';
        });
    }

    function showStatusMessage(message, duration = 2000) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.classList.remove('hidden');

        if (duration > 0) {
            setTimeout(() => {
                hideStatusMessage();
            }, duration);
        }
    }

    function hideStatusMessage() {
        elements.statusMessage.classList.add('hidden');
    }

    function showPauseModal() {
        elements.pauseModal.classList.remove('hidden');
    }

    function hidePauseModal() {
        elements.pauseModal.classList.add('hidden');
    }

    function showQuitModal() {
        elements.quitModal.classList.remove('hidden');
    }

    function hideQuitModal() {
        elements.quitModal.classList.add('hidden');
    }

    function bindEvents() {
        elements.startBtn.addEventListener('click', () => {
            const betAmount = parseInt(elements.betAmount.value) || 100;
            if (callbacks.onStart) {
                callbacks.onStart(betAmount);
            }
        });

        elements.hitBtn.addEventListener('click', () => {
            if (callbacks.onHit) {
                callbacks.onHit();
            }
        });

        elements.standBtn.addEventListener('click', () => {
            if (callbacks.onStand) {
                callbacks.onStand();
            }
        });

        elements.doubleBtn.addEventListener('click', () => {
            if (callbacks.onDouble) {
                callbacks.onDouble();
            }
        });

        elements.newGameBtn.addEventListener('click', () => {
            if (callbacks.onNewGame) {
                callbacks.onNewGame();
            }
        });

        elements.pauseBtn.addEventListener('click', () => {
            if (callbacks.onPause) {
                callbacks.onPause();
            }
        });

        elements.resumeBtn.addEventListener('click', () => {
            if (callbacks.onResume) {
                callbacks.onResume();
            }
        });

        elements.restartBtn.addEventListener('click', () => {
            if (callbacks.onRestart) {
                callbacks.onRestart();
            }
        });

        elements.quitBtn.addEventListener('click', () => {
            hidePauseModal();
            showQuitModal();
        });

        elements.confirmQuitBtn.addEventListener('click', () => {
            if (callbacks.onQuit) {
                callbacks.onQuit();
            }
        });

        elements.cancelQuitBtn.addEventListener('click', () => {
            hideQuitModal();
        });

        elements.betMinus.addEventListener('click', () => {
            const current = parseInt(elements.betAmount.value) || 100;
            const min = parseInt(elements.betAmount.min) || 10;
            const step = parseInt(elements.betAmount.step) || 10;
            const newValue = Math.max(min, current - step);
            elements.betAmount.value = newValue;
        });

        elements.betPlus.addEventListener('click', () => {
            const current = parseInt(elements.betAmount.value) || 100;
            const step = parseInt(elements.betAmount.step) || 10;
            const maxChips = gameState.chips;
            const newValue = Math.min(maxChips, current + step);
            elements.betAmount.value = newValue;
        });

        elements.betAmount.addEventListener('change', () => {
            let value = parseInt(elements.betAmount.value) || 100;
            const min = parseInt(elements.betAmount.min) || 10;
            const step = parseInt(elements.betAmount.step) || 10;
            
            value = Math.max(min, Math.min(gameState.chips, value));
            value = Math.round(value / step) * step;
            
            elements.betAmount.value = value;
        });

        elements.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const bet = parseInt(btn.dataset.bet);
                if (bet <= gameState.chips) {
                    elements.betAmount.value = bet;
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (gameState.state === 'idle') return;
            if (gameState.state === 'settlement') return;

            switch(e.key.toLowerCase()) {
                case 'h':
                    if (gameState.state === 'player_turn' && callbacks.onHit) {
                        callbacks.onHit();
                    }
                    break;
                case 's':
                    if (gameState.state === 'player_turn' && callbacks.onStand) {
                        callbacks.onStand();
                    }
                    break;
                case 'd':
                    if (gameState.state === 'player_turn' && callbacks.onDouble) {
                        callbacks.onDouble();
                    }
                    break;
                case 'escape':
                    if (gameState.state === 'paused' && callbacks.onResume) {
                        callbacks.onResume();
                    } else if (callbacks.onPause) {
                        callbacks.onPause();
                    }
                    break;
            }
        });
    }

    function setBetInputMax(max) {
        elements.betAmount.max = max;
    }

    return {
        elements,
        updateAll,
        updateStats,
        updateButtons,
        showStatusMessage,
        hideStatusMessage,
        showPauseModal,
        hidePauseModal,
        showQuitModal,
        hideQuitModal,
        bindEvents,
        setBetInputMax
    };
}

export { createUI };
