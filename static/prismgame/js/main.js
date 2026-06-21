document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    let levelsData = [];
    let currentLevelIndex = 0;
    let playerName = localStorage.getItem('prismGamePlayerName') || 'Anonymous';

    async function initGame() {
        game.start();
        await loadAllLevels();
        const restored = game.loadState();
        if (!restored) {
            await loadLevel(1, false);
        } else {
            currentLevelIndex = levelsData.findIndex(l => l.level_number === game.currentLevel);
            if (currentLevelIndex === -1) currentLevelIndex = 0;
        }
        await loadScoreboard();
        setupEventListeners();
        setupAutoSave();
    }

    async function loadAllLevels() {
        const result = await prismGameAPI.getLevels();
        if (result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
            levelsData = result.data.items;
        } else {
            const genResult = await prismGameAPI.generateLevels();
            if (genResult.code === 0) {
                const levelsResult = await prismGameAPI.getLevels();
                if (levelsResult.code === 0 && levelsResult.data && levelsResult.data.items) {
                    levelsData = levelsResult.data.items;
                }
            }
        }
    }

    async function loadLevel(levelNumber, save = true) {
        const result = await prismGameAPI.getLevel(null, levelNumber);
        if (result.code === 0 && result.data) {
            game.loadLevel(result.data);
            currentLevelIndex = levelsData.findIndex(l => l.level_number === levelNumber);
            if (currentLevelIndex === -1) currentLevelIndex = 0;
            if (save) {
                game.saveState();
            }
        }
    }

    async function loadScoreboard() {
        const result = await prismGameAPI.getTopScores(5);
        const previewEl = document.getElementById('scoreboardPreview');
        
        if (result.code === 0 && result.data && result.data.items && result.data.items.length > 0) {
            let html = '';
            result.data.items.forEach((item, index) => {
                html += `
                    <div class="score-item">
                        <span class="score-rank">${index + 1}</span>
                        <span class="score-name">${escapeHtml(item.player_name)}</span>
                        <span class="score-value">${item.total_score}</span>
                    </div>
                `;
            });
            previewEl.innerHTML = html;
        } else {
            previewEl.innerHTML = '<p class="loading">暂无记录</p>';
        }
    }

    async function showFullScoreboard() {
        const result = await prismGameAPI.getScoreboard(1, 20);
        const listEl = document.getElementById('scoreboardList');
        
        if (result.code === 0 && result.data && result.data.items) {
            let html = '';
            result.data.items.forEach(item => {
                html += `
                    <div class="score-item">
                        <span class="score-rank">#${item.rank}</span>
                        <span class="score-name">${escapeHtml(item.player_name)}</span>
                        <span class="score-value">${item.total_score}</span>
                    </div>
                    <div style="font-size: 0.8em; color: #888; padding-left: 35px; margin-bottom: 8px;">
                        通关: ${item.levels_cleared} 关 | 总旋转: ${item.total_rotations} 次
                    </div>
                `;
            });
            listEl.innerHTML = html || '<p style="text-align: center; color: #888;">暂无记录</p>';
        }
        
        document.getElementById('scoreboardModal').classList.add('visible');
    }

    function setupEventListeners() {
        document.getElementById('btnRotateLeft').addEventListener('click', () => {
            game.rotateSelected(-15);
            game.saveState();
        });

        document.getElementById('btnRotateRight').addEventListener('click', () => {
            game.rotateSelected(15);
            game.saveState();
        });

        document.getElementById('btnReset').addEventListener('click', () => {
            game.resetLevel();
            game.saveState();
        });

        document.getElementById('btnPrevLevel').addEventListener('click', () => {
            const prevNum = Math.max(1, game.currentLevel - 1);
            loadLevel(prevNum);
        });

        document.getElementById('btnNextLevel').addEventListener('click', () => {
            const nextNum = game.currentLevel + 1;
            if (nextNum <= levelsData.length) {
                loadLevel(nextNum);
            }
        });

        document.getElementById('btnShowScoreboard').addEventListener('click', showFullScoreboard);

        document.getElementById('btnCloseModal').addEventListener('click', () => {
            document.getElementById('scoreboardModal').classList.remove('visible');
        });

        document.getElementById('btnSaveScore').addEventListener('click', handleSaveScore);

        document.getElementById('btnNextFromWin').addEventListener('click', () => {
            document.getElementById('winModal').classList.remove('visible');
            const nextNum = game.currentLevel + 1;
            if (nextNum <= levelsData.length) {
                loadLevel(nextNum);
            }
        });

        document.addEventListener('gameWin', handleGameWin);

        const nameInput = document.getElementById('playerName');
        nameInput.value = playerName;
        nameInput.addEventListener('change', (e) => {
            playerName = e.target.value || 'Anonymous';
            localStorage.setItem('prismGamePlayerName', playerName);
        });
    }

    function setupAutoSave() {
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E' || e.key === 'r' || e.key === 'R') && !game.isWon) {
                setTimeout(() => game.saveState(), 100);
            }
        });

        window.addEventListener('beforeunload', () => {
            game.saveState();
        });

        setInterval(() => {
            game.saveState();
        }, 30000);
    }

    function handleGameWin(e) {
        const detail = e.detail;
        document.getElementById('winRotations').textContent = detail.rotations;
        document.getElementById('winIntensity').textContent = Math.round(detail.intensity * 100) + '%';
        document.getElementById('winScore').textContent = detail.score;
        document.getElementById('winModal').classList.add('visible');
    }

    async function handleSaveScore() {
        const nameInput = document.getElementById('playerName');
        playerName = nameInput.value.trim() || 'Anonymous';
        localStorage.setItem('prismGamePlayerName', playerName);

        const result = await prismGameAPI.addScore(
            playerName,
            game.winScore,
            game.rotationCount,
            true
        );

        if (result.code === 0) {
            await loadScoreboard();
            document.getElementById('btnSaveScore').textContent = '已保存 ✓';
            document.getElementById('btnSaveScore').disabled = true;
            
            setTimeout(() => {
                document.getElementById('winModal').classList.remove('visible');
                document.getElementById('btnSaveScore').textContent = '保存分数';
                document.getElementById('btnSaveScore').disabled = false;
            }, 1500);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initGame();
});
