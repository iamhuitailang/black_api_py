const GamePage = {
    template: `
        <div class="game-page">
            <div class="game-container">
                <div class="game-canvas-wrapper">
                    <canvas id="gameCanvas" width="600" height="800"></canvas>

                    <div v-if="showRestoreDialog" class="game-over-overlay" style="z-index: 100;">
                        <div class="game-over-content">
                            <h2>💾 发现未完成的游戏</h2>
                            <p style="margin: 16px 0; color: #94a3b8;">检测到上次未完成的游戏，得分 <strong style="color: #ffd93d;">{{ restorePreviewScore.toLocaleString() }}</strong> 分，剩余 <strong style="color: #4ecdc4;">{{ restorePreviewBalls }}</strong> 球</p>
                            <div class="game-over-actions">
                                <button class="btn btn-primary btn-lg" @click="doRestore">
                                    继续游戏
                                </button>
                                <button class="btn btn-outline btn-lg" @click="doNewGame">
                                    开始新游戏
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="gameOver" class="game-over-overlay">
                        <div class="game-over-content">
                            <h2>🎮 游戏结束</h2>
                            <div class="final-score">
                                <div class="score-label">最终得分</div>
                                <div class="score-value">{{ finalResult.score?.toLocaleString() || 0 }}</div>
                            </div>
                            <div class="final-stats">
                                <div class="stat">
                                    <div class="stat-value">{{ finalResult.combo_max || 0 }}</div>
                                    <div class="stat-label">最大连击</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">{{ finalResult.hit_count || 0 }}</div>
                                    <div class="stat-label">碰撞次数</div>
                                </div>
                                <div class="stat">
                                    <div class="stat-value">{{ formatTime(finalResult.play_duration) }}</div>
                                    <div class="stat-label">游戏时长</div>
                                </div>
                            </div>
                            <div v-if="finalResult.is_new_record" class="new-record">
                                🎉 新纪录！
                            </div>
                            <div class="game-over-actions">
                                <button class="btn btn-primary btn-lg" @click="restartGame">
                                    再来一局
                                </button>
                                <button class="btn btn-outline btn-lg" @click="goHome">
                                    返回首页
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="game-info">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🎯 游戏信息</h3>
                        </div>
                        <div class="game-stats">
                            <div class="stat-item">
                                <span class="stat-label">得分</span>
                                <span class="stat-value">{{ score.toLocaleString() }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">剩余球数</span>
                                <span class="stat-value">{{ ballsLeft }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">碰撞次数</span>
                                <span class="stat-value">{{ hitCount }}</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="combo > 0" class="combo-display">
                        <div class="combo-count">{{ combo }}x</div>
                        <div class="combo-text">COMBO!</div>
                    </div>

                    <div class="game-controls">
                        <h4 style="margin-bottom: 12px;">🎮 操作说明</h4>
                        <div class="control-hint">
                            <p><kbd>A</kbd> / <kbd>←</kbd> 左侧挡板</p>
                            <p><kbd>D</kbd> / <kbd>→</kbd> 右侧挡板</p>
                            <p><kbd>空格</kbd> 发射弹珠</p>
                        </div>
                    </div>

                    <div class="level-selector">
                        <h4 style="margin-bottom: 12px;">🎯 选择关卡</h4>
                        <div v-for="level in levels" :key="level.id"
                             :class="['level-option', {active: selectedLevel?.id === level.id}]"
                             @click="selectLevel(level)">
                            <div>
                                <div class="level-name">{{ level.name }}</div>
                                <div class="level-difficulty">
                                    {{ level.difficulty_text }} · {{ level.ball_count }}球
                                </div>
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-outline" @click="restartGame" style="width: 100%;">
                        🔄 重新开始
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            game: null,
            score: 0,
            combo: 0,
            maxCombo: 0,
            ballsLeft: 3,
            hitCount: 0,
            gameOver: false,
            levels: [],
            selectedLevel: null,
            finalResult: {},
            saveInterval: null,
            showRestoreDialog: false,
            restorePreviewScore: 0,
            restorePreviewBalls: 0,
            savedStateCache: null
        };
    },
    async mounted() {
        if (!Auth.isLoggedIn()) {
            Router.navigate('/login');
            return;
        }

        this._beforeUnload = () => {
            if (this.game && this.game.isPlaying && !this.game.gameOver) {
                this.game.saveState();
            }
        };
        window.addEventListener('beforeunload', this._beforeUnload);

        await this.loadLevels();
        this.initGame();
    },
    beforeUnmount() {
        window.removeEventListener('beforeunload', this._beforeUnload);
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        if (this.game) {
            this.game.saveState();
            this.game.destroy();
        }
    },
    methods: {
        async loadLevels() {
            try {
                const result = await API.game.getLevels();
                if (result.code === 0 && result.data) {
                    this.levels = result.data;
                    if (this.levels.length > 0) {
                        this.selectedLevel = this.levels[0];
                    }
                }
            } catch (e) {
                console.error(e);
            }
        },
        initGame() {
            this.$nextTick(() => {
                this.game = new PinballGame('gameCanvas');
                if (!this.game.canvas) {
                    setTimeout(() => {
                        this.game = new PinballGame('gameCanvas');
                        if (this.game.canvas) {
                            this._afterGameCreated();
                        }
                    }, 200);
                    return;
                }
                this._afterGameCreated();
            });
        },
        _afterGameCreated() {
            this.game.onScoreUpdate = (score, combo) => {
                this.score = score;
                this.combo = combo;
            };

            this.game.onComboUpdate = (combo, maxCombo) => {
                this.combo = combo;
                if (maxCombo > this.maxCombo) {
                    this.maxCombo = maxCombo;
                }
            };

            this.game.onBallLost = (ballsLeft) => {
                this.ballsLeft = ballsLeft;
            };

            this.game.onGameOver = async (result) => {
                this.gameOver = true;
                this.finalResult = result;
                this.game.clearSavedState();

                try {
                    const saveResult = await API.game.saveResult(result);
                    if (saveResult.code === 0 && saveResult.data) {
                        this.finalResult = { ...result, ...saveResult.data };
                    }
                } catch (e) {
                    console.error(e);
                }
            };

            const savedState = Storage.get('danzhu_game_state');
            if (savedState && !savedState.gameOver) {
                const age = Date.now() - (savedState.savedAt || 0);
                if (age < 30 * 60 * 1000) {
                    this.savedStateCache = savedState;
                    this.restorePreviewScore = savedState.score || 0;
                    this.restorePreviewBalls = savedState.ballsLeft ?? 3;
                    this.showRestoreDialog = true;
                    this.game.renderIdle();
                    return;
                }
            }

            this.startNewGame();
        },
        doRestore() {
            this.showRestoreDialog = false;
            if (this.savedStateCache && this.game) {
                const s = this.savedStateCache;
                this.score = s.score || 0;
                this.combo = s.combo || 0;
                this.maxCombo = s.maxCombo || 0;
                this.hitCount = s.hitCount || 0;
                this.ballsLeft = s.ballsLeft ?? 3;
                this.gameOver = false;

                if (s.levelConfig) {
                    this.selectedLevel = this.levels.find(l => l.id === s.levelConfig.id) || this.levels[0];
                }

                this.game.restoreState(s);
            } else {
                this.startNewGame();
            }
            this.savedStateCache = null;
            this._startAutoSave();
        },
        doNewGame() {
            this.showRestoreDialog = false;
            this.savedStateCache = null;
            this.game.clearSavedState();
            this.startNewGame();
        },
        startNewGame() {
            if (this.selectedLevel) {
                this.game.loadLevel(this.selectedLevel);
                this.ballsLeft = this.selectedLevel.ball_count || 3;
            }
            this.game.start();
            this._startAutoSave();
        },
        _startAutoSave() {
            if (this.saveInterval) clearInterval(this.saveInterval);
            this.saveInterval = setInterval(() => {
                if (this.game && this.game.isPlaying && !this.game.gameOver) {
                    this.game.saveState();
                }
            }, 3000);
        },
        selectLevel(level) {
            this.selectedLevel = level;
            if (this.game) {
                this.game.clearSavedState();
                this.game.loadLevel(level);
                this.ballsLeft = level.ball_count || 3;
                this.score = 0;
                this.combo = 0;
                this.maxCombo = 0;
                this.hitCount = 0;
                this.gameOver = false;
                this.game.start();
            }
        },
        restartGame() {
            this.score = 0;
            this.combo = 0;
            this.maxCombo = 0;
            this.hitCount = 0;
            this.gameOver = false;
            this.finalResult = {};

            if (this.selectedLevel) {
                this.ballsLeft = this.selectedLevel.ball_count || 3;
            }

            if (this.game) {
                this.game.clearSavedState();
                this.game.restart();
            }
        },
        goHome() {
            Router.navigate('/');
        },
        formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }
};
