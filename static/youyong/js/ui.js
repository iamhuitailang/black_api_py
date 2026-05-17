const UI = (() => {
    let elements = {};
    let game = null;

    const init = (gameInstance) => {
        game = gameInstance;
        cacheElements();
        attachEventListeners();
        updatePlayerStats();
    };

    const cacheElements = () => {
        elements = {
            mainMenu: document.getElementById('main-menu'),
            strokeSelect: document.getElementById('stroke-select'),
            gameHUD: document.getElementById('game-hud'),
            pauseMenu: document.getElementById('pause-menu'),
            resultMenu: document.getElementById('result-menu'),
            recordsMenu: document.getElementById('records-menu'),
            controlHint: document.getElementById('control-hint'),
            hudPosition: document.getElementById('hud-position'),
            hudTime: document.getElementById('hud-time'),
            hudProgress: document.getElementById('hud-progress'),
            oxygenBar: document.getElementById('oxygen-bar'),
            oxygenValue: document.getElementById('oxygen-value'),
            staminaBar: document.getElementById('stamina-bar'),
            staminaValue: document.getElementById('stamina-value'),
            turnIndicator: document.getElementById('turn-indicator'),
            turnProgress: document.getElementById('turn-progress'),
            resultTitle: document.getElementById('result-title'),
            resultPosition: document.getElementById('result-position'),
            resultTime: document.getElementById('result-time'),
            resultSpeed: document.getElementById('result-speed'),
            resultAvgSpeed: document.getElementById('result-avg-speed'),
            resultTurns: document.getElementById('result-turns'),
            resultBreaths: document.getElementById('result-breaths'),
            resultBadges: document.getElementById('result-badges'),
            recordsList: document.getElementById('records-list'),
            statSpeed: document.getElementById('stat-speed'),
            statSpeedValue: document.getElementById('stat-speed-value'),
            statStamina: document.getElementById('stat-stamina'),
            statStaminaValue: document.getElementById('stat-stamina-value'),
            statRecovery: document.getElementById('stat-recovery'),
            statRecoveryValue: document.getElementById('stat-recovery-value')
        };
    };

    const attachEventListeners = () => {
        document.getElementById('btn-start').addEventListener('click', () => game.startGame('race'));
        document.getElementById('btn-select-stroke').addEventListener('click', showStrokeSelect);
        document.getElementById('btn-training').addEventListener('click', () => game.startGame('training'));
        document.getElementById('btn-records').addEventListener('click', showRecords);
        document.getElementById('btn-back-menu').addEventListener('click', showMainMenu);

        document.querySelectorAll('.stroke-item').forEach(item => {
            item.addEventListener('click', () => selectStroke(item.dataset.stroke));
        });

        document.getElementById('btn-breathe').addEventListener('click', () => game.playerBreathe());
        document.getElementById('btn-pause').addEventListener('click', () => game.pauseGame());

        document.getElementById('btn-resume').addEventListener('click', () => game.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => game.restartGame());
        document.getElementById('btn-quit').addEventListener('click', () => game.quitGame());

        document.getElementById('btn-again').addEventListener('click', () => game.restartGame());
        document.getElementById('btn-back').addEventListener('click', showMainMenu);

        document.getElementById('btn-clear-records').addEventListener('click', clearRecords);
        document.getElementById('btn-back-records').addEventListener('click', showMainMenu);
    };

    const showMainMenu = () => {
        hideAllMenus();
        elements.mainMenu.classList.remove('hidden');
        updatePlayerStats();
    };

    const showStrokeSelect = () => {
        hideAllMenus();
        elements.strokeSelect.classList.remove('hidden');
        updateStrokeSelection();
    };

    const showGameHUD = () => {
        hideAllMenus();
        elements.gameHUD.classList.remove('hidden');
        showControlHint();
    };

    const showPauseMenu = () => {
        elements.pauseMenu.classList.remove('hidden');
    };

    const hidePauseMenu = () => {
        elements.pauseMenu.classList.add('hidden');
    };

    const showResultMenu = (result) => {
        hideAllMenus();
        elements.resultMenu.classList.remove('hidden');
        updateResultDisplay(result);
    };

    const showRecords = () => {
        hideAllMenus();
        elements.recordsMenu.classList.remove('hidden');
        updateRecordsList();
    };

    const hideAllMenus = () => {
        elements.mainMenu.classList.add('hidden');
        elements.strokeSelect.classList.add('hidden');
        elements.gameHUD.classList.add('hidden');
        elements.pauseMenu.classList.add('hidden');
        elements.resultMenu.classList.add('hidden');
        elements.recordsMenu.classList.add('hidden');
    };

    const showControlHint = () => {
        elements.controlHint.classList.remove('hidden');
        setTimeout(() => {
            elements.controlHint.classList.add('hidden');
        }, 4000);
    };

    const selectStroke = (stroke) => {
        const settings = Storage.loadSettings() || {};
        settings.selectedStroke = stroke;
        Storage.saveSettings(settings);
        updateStrokeSelection();
    };

    const updateStrokeSelection = () => {
        const settings = Storage.loadSettings() || {};
        const selectedStroke = settings.selectedStroke || 'freestyle';

        document.querySelectorAll('.stroke-item').forEach(item => {
            if (item.dataset.stroke === selectedStroke) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    };

    const updatePlayerStats = () => {
        const playerData = Storage.loadPlayerData() || getDefaultPlayerData();
        const maxStats = getMaxStats();

        elements.statSpeed.style.width = `${(playerData.stats.speed / maxStats.speed) * 100}%`;
        elements.statSpeedValue.textContent = playerData.stats.speed;

        elements.statStamina.style.width = `${(playerData.stats.maxStamina / maxStats.maxStamina) * 100}%`;
        elements.statStaminaValue.textContent = playerData.stats.maxStamina;

        elements.statRecovery.style.width = `${(playerData.stats.recovery / maxStats.recovery) * 100}%`;
        elements.statRecoveryValue.textContent = `${playerData.stats.recovery}/s`;
    };

    const getDefaultPlayerData = () => ({
        stats: {
            speed: Config.PLAYER.baseSpeed,
            maxStamina: Config.PLAYER.baseStamina,
            recovery: Config.PLAYER.baseRecovery,
            turnSpeed: Config.PLAYER.baseTurnSpeed,
            power: Config.PLAYER.basePower
        }
    });

    const getMaxStats = () => ({
        speed: Config.PLAYER.maxSpeed,
        maxStamina: Config.PLAYER.maxStamina,
        recovery: Config.PLAYER.maxRecovery
    });

    const updateHUD = (gameState) => {
        const player = gameState.player;

        elements.hudPosition.textContent = `${gameState.position}/${gameState.totalPlayers}`;
        elements.hudTime.textContent = formatTime(gameState.elapsedTime);
        elements.hudProgress.textContent = `${Math.round(player.getProgress() * 100)}%`;

        const oxygenPercent = player.oxygen;
        elements.oxygenBar.style.width = `${oxygenPercent}%`;
        elements.oxygenValue.textContent = `${Math.round(oxygenPercent)}%`;

        elements.oxygenBar.classList.remove('warning', 'danger');
        if (oxygenPercent < 20) {
            elements.oxygenBar.classList.add('danger');
        } else if (oxygenPercent < 40) {
            elements.oxygenBar.classList.add('warning');
        }

        const staminaPercent = (player.stamina / player.stats.maxStamina) * 100;
        elements.staminaBar.style.width = `${staminaPercent}%`;
        elements.staminaValue.textContent = `${Math.round(staminaPercent)}%`;

        if (player.isTurning) {
            elements.turnIndicator.classList.remove('hidden');
            elements.turnProgress.style.width = `${player.turnProgress * 100}%`;
        } else {
            elements.turnIndicator.classList.add('hidden');
        }
    };

    const updateResultDisplay = (result) => {
        const positionText = ['🥇 第一名', '🥈 第二名', '🥉 第三名', '第四名', '第五名'];
        elements.resultPosition.textContent = positionText[result.position - 1] || `第 ${result.position} 名`;
        elements.resultTime.textContent = formatTime(result.time);
        elements.resultSpeed.textContent = `${result.maxSpeed.toFixed(2)} m/s`;
        elements.resultAvgSpeed.textContent = `${result.avgSpeed.toFixed(2)} m/s`;
        elements.resultTurns.textContent = result.turnCount;
        elements.resultBreaths.textContent = result.breathCount;

        if (result.position === 1) {
            elements.resultTitle.textContent = '🎉 恭喜夺冠！';
        } else if (result.position <= 3) {
            elements.resultTitle.textContent = '🎊 比赛完成！';
        } else {
            elements.resultTitle.textContent = '💪 继续加油！';
        }

        elements.resultBadges.innerHTML = '';
        result.badges.forEach(badge => {
            const badgeEl = document.createElement('div');
            badgeEl.className = 'badge';
            badgeEl.textContent = `${badge.icon} ${badge.name}`;
            elements.resultBadges.appendChild(badgeEl);
        });
    };

    const updateRecordsList = () => {
        const records = Storage.loadRecords();
        elements.recordsList.innerHTML = '';

        if (records.length === 0) {
            elements.recordsList.innerHTML = '<p style="text-align: center; color: #888;">暂无记录</p>';
            return;
        }

        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'record-item';

            const date = new Date(record.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

            const positionText = ['🥇', '🥈', '🥉', '4th', '5th'][record.position - 1] || `${record.position}th`;

            item.innerHTML = `
                <div class="record-info">
                    <div style="font-weight: bold; font-size: 1.1rem;">${positionText} ${Config.STROKES[record.stroke]?.icon || ''} ${Config.STROKES[record.stroke]?.name || record.stroke}</div>
                    <div class="record-date">${dateStr}</div>
                </div>
                <div class="record-time">${formatTime(record.time)}</div>
            `;

            elements.recordsList.appendChild(item);
        });
    };

    const clearRecords = () => {
        if (confirm('确定要清除所有历史记录吗？')) {
            Storage.clearRecords();
            updateRecordsList();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };

    return {
        init,
        showMainMenu,
        showGameHUD,
        showPauseMenu,
        hidePauseMenu,
        showResultMenu,
        showStrokeSelect,
        updateHUD,
        updatePlayerStats,
        formatTime
    };
})();
