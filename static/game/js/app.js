const { createApp, ref, onMounted, onUnmounted, watch, nextTick, computed } = Vue;

const app = createApp({
    setup() {
        const gameState = ref('menu');
        const playerName = ref('');
        const score = ref(0);
        const wave = ref(1);
        const kills = ref(0);
        const health = ref(100);
        const energy = ref(0);
        const energyCollected = ref(0);
        const bossKilled = ref(0);
        const waveAnnouncement = ref('');
        const isNewHighScore = ref(false);
        const topScores = ref([]);
        const playerProgress = ref(null);
        const nameError = ref('');
        const hasResumeData = ref(false);

        let gameEngine = null;
        let gameOverData = null;

        const loadPlayerProgress = async () => {
            if (!playerName.value.trim()) {
                playerProgress.value = null;
                return;
            }
            
            const result = await gameAPI.getPlayerProgress(playerName.value);
            if (result.code === 0 && result.data) {
                playerProgress.value = result.data;
            }
        };

        const checkResumeData = () => {
            const saved = localStorage.getItem('spaceShooterSaveState');
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    hasResumeData.value = state && state.player && state.player.health > 0;
                } catch {
                    hasResumeData.value = false;
                }
            } else {
                hasResumeData.value = false;
            }
        };

        watch(playerName, () => {
            if (gameState.value === 'menu') {
                loadPlayerProgress();
            }
        });

        const setupGameEngine = async (canvas) => {
            gameEngine = initGameEngine(canvas);
            
            gameEngine.onScoreUpdate = (value) => {
                score.value = value;
            };
            
            gameEngine.onWaveUpdate = (value) => {
                wave.value = value;
            };
            
            gameEngine.onHealthUpdate = (value) => {
                health.value = value;
            };
            
            gameEngine.onEnergyUpdate = (value) => {
                energy.value = value;
            };
            
            gameEngine.onKillsUpdate = (value) => {
                kills.value = value;
            };
            
            gameEngine.onWaveAnnouncement = (value) => {
                waveAnnouncement.value = value;
            };
            
            gameEngine.onGameOver = async (data) => {
                gameOverData = data;
                score.value = data.score;
                wave.value = data.wave;
                kills.value = data.kills;
                energyCollected.value = data.energyCollected;
                bossKilled.value = data.bossKilled;
                
                const saveResult = await gameAPI.saveScore(
                    playerName.value,
                    data.score,
                    data.wave,
                    data.kills,
                    data.energyCollected,
                    data.bossKilled > 0
                );
                
                if (saveResult.code === 0 && saveResult.data && saveResult.data.progress) {
                    const progress = saveResult.data.progress;
                    isNewHighScore.value = data.score >= progress.highest_score;
                } else {
                    isNewHighScore.value = true;
                }
                
                hasResumeData.value = false;
                gameState.value = 'gameover';
            };
            
            return gameEngine;
        };

        const startGame = async () => {
            if (!playerName.value.trim()) {
                nameError.value = '请输入您的昵称';
                return;
            }
            if (playerName.value.trim().length < 2) {
                nameError.value = '昵称至少需要2个字符';
                return;
            }
            nameError.value = '';
            
            gameState.value = 'playing';
            
            await nextTick();
            
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                await setupGameEngine(canvas);
                gameEngine.start();
            }
        };

        const resumeFromSave = async () => {
            if (!playerName.value.trim()) {
                nameError.value = '请输入您的昵称';
                return;
            }
            if (playerName.value.trim().length < 2) {
                nameError.value = '昵称至少需要2个字符';
                return;
            }
            nameError.value = '';
            
            const saved = localStorage.getItem('spaceShooterSaveState');
            if (!saved) {
                hasResumeData.value = false;
                return;
            }
            
            gameState.value = 'playing';
            
            await nextTick();
            
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                await setupGameEngine(canvas);
                gameEngine.startFromState(saved);
            }
        };

        const discardSave = () => {
            localStorage.removeItem('spaceShooterSaveState');
            hasResumeData.value = false;
        };

        const resumeGame = () => {
            if (gameEngine) {
                gameEngine.togglePause();
                gameState.value = 'playing';
            }
        };

        const quitToMenu = () => {
            if (gameEngine) {
                gameEngine.stop();
            }
            gameState.value = 'menu';
            checkResumeData();
            loadPlayerProgress();
        };

        const backToMenu = () => {
            gameState.value = 'menu';
            checkResumeData();
            loadPlayerProgress();
        };

        const showLeaderboard = async () => {
            gameState.value = 'leaderboard';
            
            const result = await gameAPI.getTopScores(20);
            if (result.code === 0 && result.data) {
                topScores.value = result.data.scores || [];
            }
        };

        const handleBeforeUnload = (e) => {
            if (gameState.value === 'playing' && gameEngine) {
                gameEngine.saveState();
                e.preventDefault();
                e.returnValue = '游戏正在进行中，刷新后可从主菜单继续上次游戏，确定要刷新吗？';
                return e.returnValue;
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && gameState.value === 'playing' && gameEngine) {
                gameEngine.saveState();
            }
        };

        onMounted(() => {
            const savedName = localStorage.getItem('spaceShooterPlayerName');
            if (savedName) {
                playerName.value = savedName;
                loadPlayerProgress();
            }

            checkResumeData();
            window.addEventListener('beforeunload', handleBeforeUnload);
            document.addEventListener('visibilitychange', handleVisibilityChange);
        });

        watch(playerName, (newName) => {
            if (newName.trim()) {
                localStorage.setItem('spaceShooterPlayerName', newName.trim());
                if (nameError.value) {
                    nameError.value = '';
                }
            }
        });

        onUnmounted(() => {
            if (gameEngine) {
                gameEngine.stop();
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        });

        const savedGameInfo = computed(() => {
            const saved = localStorage.getItem('spaceShooterSaveState');
            if (!saved) return null;
            try {
                const state = JSON.parse(saved);
                if (!state || !state.player || state.player.health <= 0) return null;
                return {
                    wave: state.wave,
                    score: state.score,
                    kills: state.kills,
                    health: state.player.health,
                    enemyCount: state.enemies ? state.enemies.length : 0
                };
            } catch {
                return null;
            }
        });

        return {
            gameState,
            playerName,
            score,
            wave,
            kills,
            health,
            energy,
            energyCollected,
            bossKilled,
            waveAnnouncement,
            isNewHighScore,
            topScores,
            playerProgress,
            nameError,
            hasResumeData,
            savedGameInfo,
            startGame,
            resumeFromSave,
            discardSave,
            resumeGame,
            quitToMenu,
            backToMenu,
            showLeaderboard
        };
    }
});

app.mount('#app');
