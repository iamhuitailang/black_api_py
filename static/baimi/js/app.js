const App = (() => {
    const elements = {};
    let isInitialized = false;

    const init = () => {
        if (isInitialized) return;
        
        cacheElements();
        initGame();
        bindEvents();
        updateBestRecord();
        renderModeOptions();
        isInitialized = true;
    };

    const cacheElements = () => {
        elements.canvas = document.getElementById('gameCanvas');
        elements.startBtn = document.getElementById('startBtn');
        elements.modeBtn = document.getElementById('modeBtn');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.modeModal = document.getElementById('modeModal');
        elements.modeOptions = document.getElementById('modeOptions');
        elements.closeModalBtn = document.getElementById('closeModalBtn');
        elements.resultModal = document.getElementById('resultModal');
        elements.resultDetails = document.getElementById('resultDetails');
        elements.raceAgainBtn = document.getElementById('raceAgainBtn');
        elements.closeResultBtn = document.getElementById('closeResultBtn');
        elements.gameOverlay = document.getElementById('gameOverlay');
        elements.overlayContent = document.getElementById('overlayContent');
        elements.weatherDisplay = document.getElementById('weatherDisplay');
        elements.bestRecord = document.getElementById('bestRecord');
        elements.modeDisplay = document.getElementById('modeDisplay');
        elements.currentSpeed = document.getElementById('currentSpeed');
        elements.currentDistance = document.getElementById('currentDistance');
        elements.currentTime = document.getElementById('currentTime');
        elements.staminaFill = document.getElementById('staminaFill');
        elements.reactionTime = document.getElementById('reactionTime');
        elements.currentRank = document.getElementById('currentRank');
        elements.opponentsList = document.getElementById('opponentsList');
    };

    const initGame = () => {
        Renderer.init(elements.canvas);
        
        const savedMode = Storage.getCurrentMode();
        
        Game.setOnStateChange(handleStateChange);
        Game.setOnRaceComplete(handleRaceComplete);
        
        const hasResumed = Game.resumeFromSavedState();
        
        if (!hasResumed) {
            Game.init(savedMode);
        }
        
        const state = Game.getState();
        updateUI(state);
        updateWeatherDisplay(state.weather);
        updateStartButton(state.gamePhase);
        
        requestAnimationFrame(renderLoop);
    };

    const bindEvents = () => {
        elements.startBtn.addEventListener('click', handleStartClick);
        elements.modeBtn.addEventListener('click', openModeModal);
        elements.resetBtn.addEventListener('click', handleReset);
        elements.closeModalBtn.addEventListener('click', closeModeModal);
        elements.raceAgainBtn.addEventListener('click', handleRaceAgain);
        elements.closeResultBtn.addEventListener('click', closeResultModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                Game.handleInput();
            }
        });
        
        elements.canvas.addEventListener('click', () => {
            Game.handleInput();
        });
        
        window.addEventListener('beforeunload', () => {
            const state = Game.getState();
            if (state.gamePhase === Game.GAME_PHASES.RACING || state.gamePhase === Game.GAME_PHASES.GO) {
                Storage.saveGameState({
                    gamePhase: state.gamePhase,
                    mode: state.mode,
                    weather: state.weather,
                    player: state.player,
                    opponents: state.opponents,
                    runners: state.runners,
                    raceTime: state.raceTime,
                    gunTime: state.gunTime,
                    time: state.time,
                    tournamentRound: state.tournamentRound
                });
            }
        });
    };

    const handleStartClick = () => {
        const state = Game.getState();
        if (state.gamePhase === Game.GAME_PHASES.IDLE || 
            state.gamePhase === Game.GAME_PHASES.FINISHED || 
            state.gamePhase === Game.GAME_PHASES.FALSE_START) {
            Game.startRace();
        }
    };

    const handleReset = () => {
        if (confirm('确定要重置所有记录吗？这将清除所有历史记录和最佳成绩。')) {
            Storage.resetAll();
            Game.reset();
            updateBestRecord();
            Game.init(Storage.getCurrentMode());
            const state = Game.getState();
            updateUI(state);
            updateWeatherDisplay(state.weather);
            updateStartButton(state.gamePhase);
        }
    };

    const handleRaceAgain = () => {
        closeResultModal();
        Game.reset();
        setTimeout(() => Game.startRace(), 100);
    };

    const openModeModal = () => {
        elements.modeModal.classList.add('active');
    };

    const closeModeModal = () => {
        elements.modeModal.classList.remove('active');
    };

    const closeResultModal = () => {
        elements.resultModal.classList.remove('active');
    };

    const renderModeOptions = () => {
        const modes = Mode.getAllModes();
        const currentMode = Storage.getCurrentMode();
        
        elements.modeOptions.innerHTML = modes.map(mode => `
            <div class="mode-option ${mode.id === currentMode ? 'selected' : ''}" data-mode="${mode.id}">
                <h4>${mode.name}</h4>
                <p>${mode.description}</p>
                <p>对手数量: ${mode.opponents}人</p>
                <p>特点: ${mode.features.join('、')}</p>
            </div>
        `).join('');
        
        elements.modeOptions.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', () => {
                const modeId = option.dataset.mode;
                selectMode(modeId);
            });
        });
    };

    const selectMode = (modeId) => {
        Storage.setCurrentMode(modeId);
        Game.reset();
        Game.init(modeId);
        const state = Game.getState();
        updateUI(state);
        updateWeatherDisplay(state.weather);
        updateStartButton(state.gamePhase);
        renderModeOptions();
        closeModeModal();
    };

    const handleStateChange = (state) => {
        updateUI(state);
        updateOverlay(state);
        updateStartButton(state.gamePhase);
    };

    const handleRaceComplete = (results) => {
        showResults(results);
        updateBestRecord();
    };

    const updateStartButton = (gamePhase) => {
        const btn = elements.startBtn;
        
        switch (gamePhase) {
            case Game.GAME_PHASES.IDLE:
                btn.textContent = '开始比赛';
                btn.disabled = false;
                btn.style.opacity = '1';
                break;
            case Game.GAME_PHASES.READY:
            case Game.GAME_PHASES.SET:
            case Game.GAME_PHASES.GO:
            case Game.GAME_PHASES.RACING:
                btn.textContent = '比赛中...';
                btn.disabled = true;
                btn.style.opacity = '0.5';
                break;
            case Game.GAME_PHASES.FINISHED:
                btn.textContent = '再来一局';
                btn.disabled = false;
                btn.style.opacity = '1';
                break;
            case Game.GAME_PHASES.FALSE_START:
                btn.textContent = '重新开始';
                btn.disabled = false;
                btn.style.opacity = '1';
                break;
            default:
                btn.textContent = '开始比赛';
                btn.disabled = false;
                btn.style.opacity = '1';
        }
    };

    const updateUI = (state) => {
        if (!state.player) return;
        
        const mode = Mode.getModeById(state.mode);
        elements.modeDisplay.textContent = mode.name;
        
        elements.currentSpeed.textContent = state.player.speed.toFixed(1);
        elements.currentDistance.textContent = state.player.position.toFixed(2);
        elements.currentTime.textContent = state.raceTime.toFixed(2);
        elements.staminaFill.style.width = state.player.stamina + '%';
        elements.reactionTime.textContent = state.player.reactionTime 
            ? state.player.reactionTime.toFixed(3)
            : '--';
        
        if (state.runners && state.runners.length > 1) {
            elements.currentRank.textContent = Game.getCurrentRank();
        } else {
            elements.currentRank.textContent = '--';
        }
        
        updateOpponentsList(state);
        updateWeatherDisplay(state.weather);
    };

    const updateWeatherDisplay = (weather) => {
        if (!weather) return;
        
        elements.weatherDisplay.innerHTML = `
            <span class="weather-icon">${weather.icon}</span>
            <span class="weather-text">${weather.name}</span>
        `;
    };

    const updateOpponentsList = (state) => {
        if (!state.opponents || state.opponents.length === 0) {
            elements.opponentsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">暂无对手</p>';
            return;
        }
        
        const sorted = [...state.runners]
            .filter(r => r.type === 'opponent')
            .sort((a, b) => b.position - a.position);
        
        elements.opponentsList.innerHTML = sorted.map(opponent => `
            <div class="opponent-item ${opponent.isFinished ? 'finished' : ''}">
                <div>
                    <span class="opponent-name">${opponent.name}</span>
                    <span style="font-size: 0.8rem; opacity: 0.7;">(${opponent.typeName})</span>
                </div>
                <span class="opponent-time">${opponent.isFinished ? opponent.finishTime.toFixed(2) + 's' : opponent.position.toFixed(1) + 'm'}</span>
            </div>
        `).join('');
    };

    const updateOverlay = (state) => {
        const overlay = elements.gameOverlay;
        const content = elements.overlayContent;
        
        overlay.classList.remove('active');
        content.className = 'overlay-content';
        
        switch (state.gamePhase) {
            case Game.GAME_PHASES.READY:
                overlay.classList.add('active');
                content.classList.add('ready');
                content.textContent = '各就位...';
                break;
            case Game.GAME_PHASES.SET:
                overlay.classList.add('active');
                content.classList.add('set');
                content.textContent = '预备...';
                break;
            case Game.GAME_PHASES.GO:
                overlay.classList.add('active');
                content.classList.add('go');
                content.textContent = '跑！';
                break;
            case Game.GAME_PHASES.FALSE_START:
                overlay.classList.add('active');
                content.classList.add('false-start');
                content.textContent = '抢跑！犯规！';
                break;
            default:
                overlay.classList.remove('active');
        }
    };

    const showResults = (results) => {
        elements.resultModal.classList.add('active');
        
        if (results.isFalseStart) {
            elements.resultDetails.innerHTML = `
                <div class="result-rank">犯规</div>
                <div class="result-item">
                    <span class="label">结果</span>
                    <span class="value">抢跑，成绩取消</span>
                </div>
            `;
            return;
        }
        
        const rankText = getRankText(results.rank);
        const bestRecord = Storage.getBestRecord();
        const isNewRecord = results.playerTime && bestRecord && Math.abs(results.playerTime - bestRecord) < 0.001;
        
        let html = `
            <div class="result-rank">${rankText}</div>
        `;
        
        if (isNewRecord) {
            html += `<div style="color: #FFD700; font-size: 1.2rem; margin-bottom: 20px;">🎉 新纪录！</div>`;
        }
        
        html += `
            <div class="result-item">
                <span class="label">比赛成绩</span>
                <span class="value">${results.playerTime ? results.playerTime.toFixed(2) + ' 秒' : '未完成'}</span>
            </div>
            <div class="result-item">
                <span class="label">起跑反应</span>
                <span class="value">${results.reactionTime ? results.reactionTime.toFixed(3) + ' 秒' : '--'}</span>
            </div>
            <div class="result-item">
                <span class="label">天气</span>
                <span class="value">${results.weather.icon} ${results.weather.name}</span>
            </div>
            <div class="result-item">
                <span class="label">模式</span>
                <span class="value">${Mode.getModeById(results.mode).name}</span>
            </div>
        `;
        
        if (results.runners && results.runners.length > 1) {
            html += `<h3 style="margin-top: 20px; color: #ffd700;">排名</h3>`;
            results.runners.slice(0, Math.min(5, results.runners.length)).forEach((runner, index) => {
                html += `
                    <div class="result-item">
                    <span class="label">${index + 1}. ${runner.name}${runner.isPlayer ? ' (你)' : ''}</span>
                    <span class="value">${runner.time ? runner.time.toFixed(2) + 's' : '--'}</span>
                    </div>
                `;
            });
        }
        
        elements.resultDetails.innerHTML = html;
    };

    const getRankText = (rank) => {
        if (rank === 'DQ') return '犯规';
        if (rank === 1) return '🥇 第1名';
        if (rank === 2) return '🥈 第2名';
        if (rank === 3) return '🥉 第3名';
        return `第${rank}名`;
    };

    const updateBestRecord = () => {
        const best = Storage.getBestRecord();
        elements.bestRecord.textContent = best ? best.toFixed(2) + ' 秒' : '--';
    };

    const renderLoop = () => {
        const state = Game.getState();
        Renderer.render(state);
        requestAnimationFrame(renderLoop);
    };

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
