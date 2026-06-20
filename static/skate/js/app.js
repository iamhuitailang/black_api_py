const { createApp, ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } = Vue;

const App = {
    setup() {
        const currentView = ref('home');
        const showTrackSelect = ref(false);
        const showScores = ref(false);
        const showHelp = ref(false);
        const showRestoreDialog = ref(false);
        const restoreInfo = ref(null);
        let pendingSnapshot = null;

        const tracks = ref([]);
        const loadingTracks = ref(false);
        const selectedTrack = ref(null);
        const playerName = ref('Player');
        const currentTrackData = ref(null);

        const scores = ref([]);
        const loadingScores = ref(false);
        const scoreFilterTrack = ref(null);

        const gameCanvas = ref(null);
        let gameEngine = null;
        let snapshotTimer = null;

        const gameState = reactive({
            score: 0,
            trickScore: 0,
            time: 0,
            crashCount: 0,
            speed: 40,
            canFlip: false,
            canGrab: false,
            canRail: false,
            crashed: false,
            paused: false,
            position: 0,
            completed: false
        });

        const crashRecoveryCountdown = ref(0);
        const trickFeedback = reactive({
            show: false,
            type: 'success',
            message: ''
        });
        let trickFeedbackTimer = null;

        const gameResult = reactive({
            score: 0,
            trickScore: 0,
            timeUsed: 0,
            crashCount: 0,
            progress: 0,
            completed: false,
            rank: 0
        });

        const progressPercent = computed(() => {
            if (!currentTrackData.value) return 0;
            const p = (gameState.position / currentTrackData.value.length) * 100;
            return Math.min(100, Math.round(p));
        });

        const terrainSegments = computed(() => {
            if (!currentTrackData.value) return [];
            return currentTrackData.value.terrain_data || [];
        });

        let crashTimer = null;
        let isInGame = false;

        function getSnapshotStorageKey() {
            return 'skate_game_full_snapshot_v1';
        }

        function saveGameSession() {
            if (!isInGame || !currentTrackData.value || !gameEngine) return;
            try {
                const snap = gameEngine.getSnapshot();
                snap.trackId = currentTrackData.value.id;
                snap.playerName = playerName.value;
                snap.trackLength = currentTrackData.value.length;
                snap.trackName = currentTrackData.value.name;
                localStorage.setItem(getSnapshotStorageKey(), JSON.stringify(snap));
            } catch (e) {
                console.warn('保存游戏快照失败:', e);
            }
        }

        function clearGameSession() {
            try {
                localStorage.removeItem(getSnapshotStorageKey());
                sessionStorage.removeItem('skate_game_session');
            } catch (e) {}
            isInGame = false;
            if (snapshotTimer) {
                clearInterval(snapshotTimer);
                snapshotTimer = null;
            }
        }

        function handleBeforeUnload(e) {
            if (isInGame) {
                saveGameSession();
                e.preventDefault();
                e.returnValue = '';
            }
        }

        function checkPendingRestore() {
            try {
                const raw = localStorage.getItem(getSnapshotStorageKey());
                if (!raw) return false;
                const snap = JSON.parse(raw);
                if (!snap || !snap.trackId || !snap.state || snap.state.completed) {
                    clearGameSession();
                    return false;
                }
                const now = Date.now();
                if (now - (snap.savedAt || 0) > 1000 * 60 * 60 * 24) {
                    clearGameSession();
                    return false;
                }
                pendingSnapshot = snap;
                const trackObj = tracks.value.find(t => t.id === snap.trackId);
                const progress = snap.trackLength
                    ? Math.min(100, Math.round((snap.state.position / snap.trackLength) * 100))
                    : 0;
                restoreInfo.value = {
                    playerName: snap.playerName || 'Player',
                    trackName: trackObj ? trackObj.name : (snap.trackName || '未知赛道'),
                    progress,
                    score: snap.state.score || 0,
                    savedAt: snap.savedAt || Date.now()
                };
                return true;
            } catch (e) {
                console.warn('检查恢复数据失败:', e);
                clearGameSession();
                return false;
            }
        }

        async function doRestoreGame() {
            if (!pendingSnapshot) return;
            showRestoreDialog.value = false;

            const trackId = pendingSnapshot.trackId;
            const pName = pendingSnapshot.playerName || 'Player';
            playerName.value = pName;

            let trackDetail = null;
            try {
                const res = await SkateApi.getTrackDetail(trackId);
                if (res.code === 0 && res.data) {
                    trackDetail = res.data;
                }
            } catch (e) {
                console.error('加载赛道详情失败:', e);
            }
            if (!trackDetail) {
                pendingSnapshot = null;
                restoreInfo.value = null;
                return;
            }

            selectedTrack.value = { id: trackId, name: trackDetail.name };
            currentTrackData.value = trackDetail;
            currentView.value = 'game';
            isInGame = true;

            await nextTick();
            if (gameEngine) gameEngine.stop();
            resetGameState();

            gameEngine = new SkateGameEngine(gameCanvas.value, buildEngineCallbacks());
            gameEngine.loadTrack(trackDetail);
            const ok = gameEngine.restoreFromSnapshot(pendingSnapshot);
            if (ok) {
                Object.assign(gameState, gameEngine.state);
                crashRecoveryCountdown.value = 0;
            }

            pendingSnapshot = null;
            restoreInfo.value = null;

            gameEngine.start();
            startSnapshotTimer();
        }

        function discardRestore() {
            clearGameSession();
            pendingSnapshot = null;
            restoreInfo.value = null;
            showRestoreDialog.value = false;
        }

        function startSnapshotTimer() {
            if (snapshotTimer) clearInterval(snapshotTimer);
            snapshotTimer = setInterval(() => {
                saveGameSession();
            }, 1500);
        }

        function buildEngineCallbacks() {
            return {
                onStateUpdate: (state) => {
                    Object.assign(gameState, state);

                    if (state.crashed) {
                        if (!crashTimer) {
                            crashRecoveryCountdown.value = 2;
                            crashTimer = setInterval(() => {
                                crashRecoveryCountdown.value = Math.max(0, crashRecoveryCountdown.value - 0.1);
                                if (crashRecoveryCountdown.value <= 0) {
                                    clearInterval(crashTimer);
                                    crashTimer = null;
                                }
                            }, 100);
                        }
                    } else {
                        if (crashTimer) {
                            clearInterval(crashTimer);
                            crashTimer = null;
                        }
                        crashRecoveryCountdown.value = 0;
                    }
                },
                onTrickFeedback: (type, message) => {
                    showTrickFeedback(type, message);
                },
                onGameComplete: (result) => {
                    handleGameEnd(result);
                }
            };
        }

        async function loadTracks() {
            loadingTracks.value = true;
            try {
                const res = await SkateApi.getTracks();
                if (res.code === 0) {
                    tracks.value = res.data || [];
                }
            } catch (e) {
                console.error('加载赛道失败:', e);
            } finally {
                loadingTracks.value = false;
            }
        }

        async function loadScores() {
            loadingScores.value = true;
            try {
                const res = await SkateApi.getTopScores(scoreFilterTrack.value, 50);
                if (res.code === 0) {
                    scores.value = res.data || [];
                }
            } catch (e) {
                console.error('加载得分失败:', e);
            } finally {
                loadingScores.value = false;
            }
        }

        function selectTrack(track) {
            selectedTrack.value = track;
        }

        async function startGame() {
            if (!selectedTrack.value) return;
            if (!playerName.value.trim()) return;

            loadingTracks.value = true;
            try {
                const res = await SkateApi.getTrackDetail(selectedTrack.value.id);
                if (res.code === 0 && res.data) {
                    currentTrackData.value = res.data;
                    showTrackSelect.value = false;
                    currentView.value = 'game';
                    isInGame = true;
                    saveGameSession();

                    await nextTick();

                    if (gameEngine) {
                        gameEngine.stop();
                    }

                    resetGameState();

                    gameEngine = new SkateGameEngine(gameCanvas.value, buildEngineCallbacks());
                    gameEngine.loadTrack(res.data);
                    gameEngine.start();
                    startSnapshotTimer();
                }
            } catch (e) {
                console.error('启动游戏失败:', e);
            } finally {
                loadingTracks.value = false;
            }
        }

        function resetGameState() {
            Object.assign(gameState, {
                score: 0,
                trickScore: 0,
                time: 0,
                crashCount: 0,
                speed: 40,
                canFlip: false,
                canGrab: false,
                canRail: false,
                crashed: false,
                paused: false,
                position: 0,
                completed: false
            });
            crashRecoveryCountdown.value = 0;
            if (crashTimer) {
                clearInterval(crashTimer);
                crashTimer = null;
            }
        }

        function showTrickFeedback(type, message) {
            if (trickFeedbackTimer) clearTimeout(trickFeedbackTimer);
            trickFeedback.type = type;
            trickFeedback.message = message;
            trickFeedback.show = true;
            trickFeedbackTimer = setTimeout(() => {
                trickFeedback.show = false;
            }, 900);
        }

        async function handleGameEnd(result) {
            gameState.crashed = false;
            crashRecoveryCountdown.value = 0;
            isInGame = false;
            clearGameSession();

            if (crashTimer) {
                clearInterval(crashTimer);
                crashTimer = null;
            }

            if (gameEngine) {
                try { gameEngine.stop(); } catch (e) {}
            }

            gameResult.score = result.score;
            gameResult.trickScore = result.trickScore;
            gameResult.timeUsed = result.timeUsed;
            gameResult.crashCount = result.crashCount;
            gameResult.progress = result.progress;
            gameResult.completed = result.completed;
            gameResult.rank = 0;

            if (result.completed && currentTrackData.value) {
                try {
                    const res = await SkateApi.addScore({
                        player_name: playerName.value || 'Player',
                        track_id: currentTrackData.value.id,
                        score: result.score,
                        trick_score: result.trickScore,
                        time_used: result.timeUsed,
                        crash_count: result.crashCount
                    });
                    if (res.code === 0 && res.data) {
                        gameResult.rank = res.data.rank || 0;
                    }
                } catch (e) {
                    console.error('提交得分失败:', e);
                }
            }

            currentView.value = 'gameover';
        }

        function confirmExitGame() {
            if (confirm('确定要退出当前游戏吗？进度将丢失！')) {
                if (gameEngine) {
                    try { gameEngine.stop(); } catch (e) {}
                }
                if (crashTimer) {
                    clearInterval(crashTimer);
                    crashTimer = null;
                }
                gameState.crashed = false;
                crashRecoveryCountdown.value = 0;
                isInGame = false;
                clearGameSession();
                currentView.value = 'home';
            }
        }

        function restartGame() {
            if (selectedTrack.value) {
                gameState.crashed = false;
                crashRecoveryCountdown.value = 0;
                startGame();
            }
        }

        function backToHome() {
            if (gameEngine) {
                try { gameEngine.stop(); } catch (e) {}
            }
            gameState.crashed = false;
            crashRecoveryCountdown.value = 0;
            isInGame = false;
            clearGameSession();
            currentView.value = 'home';
            showScores.value = false;
            selectedTrack.value = null;
        }

        function formatDate(dateStr) {
            if (!dateStr) return '-';
            try {
                const d = new Date(typeof dateStr === 'string' ? dateStr : dateStr);
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hour = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${month}-${day} ${hour}:${min}`;
            } catch {
                return dateStr;
            }
        }

        watch(scoreFilterTrack, () => {
            if (showScores.value) loadScores();
        });

        watch(showScores, (val) => {
            if (val) loadScores();
        });

        watch(showTrackSelect, (val) => {
            if (val) loadTracks();
        });

        onMounted(async () => {
            await loadTracks();
            if (checkPendingRestore()) {
                showRestoreDialog.value = true;
            }
            window.addEventListener('beforeunload', handleBeforeUnload);
        });

        onBeforeUnmount(() => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (gameEngine) {
                try { gameEngine.stop(); } catch (e) {}
            }
            if (crashTimer) {
                clearInterval(crashTimer);
                crashTimer = null;
            }
            if (snapshotTimer) {
                clearInterval(snapshotTimer);
                snapshotTimer = null;
            }
            if (isInGame) saveGameSession();
        });

        return {
            currentView,
            showTrackSelect,
            showScores,
            showHelp,
            showRestoreDialog,
            restoreInfo,
            tracks,
            loadingTracks,
            selectedTrack,
            playerName,
            currentTrackData,
            scores,
            loadingScores,
            scoreFilterTrack,
            gameCanvas,
            gameState,
            gameResult,
            crashRecoveryCountdown,
            trickFeedback,
            progressPercent,
            terrainSegments,
            startGame,
            selectTrack,
            loadScores,
            confirmExitGame,
            restartGame,
            backToHome,
            formatDate,
            doRestoreGame,
            discardRestore
        };
    }
};

createApp(App).mount('#app');
