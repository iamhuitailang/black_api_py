const GamePage = {
    data() {
        return {
            user: null,
            music: null,
            character: null,
            gameState: 'ready',
            score: 0,
            combo: 0,
            maxCombo: 0,
            perfectCount: 0,
            goodCount: 0,
            missCount: 0,
            coinsEarned: 0,
            distance: 0,
            playTime: 0,
            showCombo: false,
            judgmentText: '',
            judgmentType: '',
            showGameOver: false,
            finalScore: null,
            bonuses: null,
            visualizerBars: Array(32).fill(0)
        };
    },
    template: `
        <div class="main-layout">
            <header class="header">
                <div class="header-left">
                    <div class="header-logo">🎮 游戏</div>
                </div>
                <div class="user-info">
                    <div class="user-coins">💰 {{ user ? user.coins : 0 }}</div>
                    <button class="btn btn-secondary" style="padding: 8px 16px;" @click="goBack">
                        返回
                    </button>
                </div>
            </header>

            <div class="content">
                <div class="game-container">
                    <canvas id="gameCanvas" ref="gameCanvas"></canvas>

                    <div class="game-hud" v-if="gameState === 'playing'">
                        <div class="hud-item">
                            <div class="hud-label">分数</div>
                            <div class="hud-value">{{ Utils.formatNumber(score) }}</div>
                        </div>
                        <div class="hud-item">
                            <div class="hud-label">距离</div>
                            <div class="hud-value">{{ Utils.formatNumber(distance) }}m</div>
                        </div>
                        <div class="hud-item">
                            <div class="hud-label">时间</div>
                            <div class="hud-value">{{ Utils.formatTime(playTime) }}</div>
                        </div>
                    </div>

                    <div class="combo-display" :class="{ show: showCombo && combo >= 5 }">
                        <div class="combo-number">{{ combo }}</div>
                        <div class="combo-text">COMBO</div>
                    </div>

                    <div 
                        v-if="judgmentText" 
                        class="judgment"
                        :class="judgmentType"
                    >
                        {{ judgmentText }}
                    </div>

                    <div class="beat-indicator" :class="{ pulse: beatPulse }" ref="beatIndicator"></div>

                    <div class="visualizer">
                        <div 
                            v-for="(bar, index) in visualizerBars" 
                            :key="index"
                            class="visualizer-bar"
                            :style="{ height: Math.max(4, bar) + 'px' }"
                        ></div>
                    </div>

                    <div v-if="gameState === 'ready'" class="game-overlay">
                        <div class="game-overlay-content">
                            <div v-if="music" style="margin-bottom: 24px;">
                                <div style="font-size: 48px; margin-bottom: 12px;">🎵</div>
                                <h2 style="font-size: 24px; margin-bottom: 4px;">{{ music.name }}</h2>
                                <p style="color: var(--text-secondary);">{{ music.artist }}</p>
                                <p style="color: var(--text-secondary); margin-top: 8px;">
                                    {{ music.bpm }} BPM · {{ Utils.getDifficultyText(music.difficulty) }}
                                </p>
                            </div>
                            <div v-else style="margin-bottom: 24px;">
                                <div style="font-size: 48px; margin-bottom: 12px;">🎮</div>
                                <h2 style="font-size: 24px;">无尽模式</h2>
                                <p style="color: var(--text-secondary);">随机音乐，挑战极限</p>
                            </div>
                            
                            <div v-if="character" style="margin-bottom: 24px;">
                                <div 
                                    style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 36px;"
                                    :style="{ background: Utils.getRarityGradient(character.rarity) }"
                                >
                                    {{ character.avatar || '👤' }}
                                </div>
                                <p style="color: var(--text-secondary); font-size: 14px;">
                                    使用角色: {{ character.name }}
                                </p>
                            </div>

                            <div v-if="bonuses" class="grid grid-3" style="margin-bottom: 24px;">
                                <div class="card stats-card" style="padding: 12px;">
                                    <div class="stats-value" style="font-size: 20px;">
                                        +{{ bonuses.character_bonus || 0 }}%
                                    </div>
                                    <div class="stats-label">角色加成</div>
                                </div>
                                <div class="card stats-card" style="padding: 12px;">
                                    <div class="stats-value" style="font-size: 20px;">
                                        +{{ bonuses.skill_bonus || 0 }}%
                                    </div>
                                    <div class="stats-label">技能加成</div>
                                </div>
                                <div class="card stats-card" style="padding: 12px;">
                                    <div class="stats-value" style="font-size: 20px;">
                                        {{ bonuses.shield_count || 0 }}
                                    </div>
                                    <div class="stats-label">护盾</div>
                                </div>
                            </div>

                            <p style="color: var(--text-secondary); margin-bottom: 24px;">
                                按 <strong>空格键</strong> 或 <strong>点击屏幕</strong> 跳跃
                            </p>
                            
                            <button class="btn btn-primary" style="font-size: 20px; padding: 18px 48px;" @click="startGame">
                                开始游戏
                            </button>
                        </div>
                    </div>

                    <div v-if="showGameOver && finalScore" class="game-overlay">
                        <div class="game-overlay-content">
                            <div class="game-overlay-title">游戏结束</div>
                            <div class="game-overlay-score">{{ Utils.formatNumber(finalScore.final_score) }}</div>
                            <div class="game-overlay-label">最终得分</div>
                            
                            <div class="game-stats">
                                <div class="game-stat">
                                    <div class="game-stat-value" style="color: #fbbf24;">{{ finalScore.perfect_count }}</div>
                                    <div class="game-stat-label">Perfect</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value" style="color: #10b981;">{{ finalScore.good_count }}</div>
                                    <div class="game-stat-label">Good</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value" style="color: #ef4444;">{{ finalScore.miss_count }}</div>
                                    <div class="game-stat-label">Miss</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value" style="color: #8b5cf6;">{{ finalScore.max_combo }}</div>
                                    <div class="game-stat-label">Max Combo</div>
                                </div>
                            </div>

                            <div class="game-stats">
                                <div class="game-stat">
                                    <div class="game-stat-value" style="color: #f59e0b;">+{{ finalScore.coins_earned }}</div>
                                    <div class="game-stat-label">金币</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value">{{ Utils.formatNumber(finalScore.distance) }}m</div>
                                    <div class="game-stat-label">距离</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value">{{ Utils.formatTime(finalScore.play_time) }}</div>
                                    <div class="game-stat-label">时长</div>
                                </div>
                                <div class="game-stat">
                                    <div class="game-stat-value">#{{ finalScore.rank || '-' }}</div>
                                    <div class="game-stat-label">排名</div>
                                </div>
                            </div>

                            <div class="btn-group">
                                <button class="btn btn-secondary" @click="goBack">
                                    返回大厅
                                </button>
                                <button class="btn btn-primary" @click="restartGame">
                                    再来一局
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 24px; text-align: center; color: var(--text-secondary);">
                    <p>💡 提示：在节拍点跳跃可以获得额外奖励！</p>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            user: null,
            music: null,
            character: null,
            gameState: 'ready',
            score: 0,
            combo: 0,
            maxCombo: 0,
            perfectCount: 0,
            goodCount: 0,
            missCount: 0,
            coinsEarned: 0,
            distance: 0,
            playTime: 0,
            showCombo: false,
            judgmentText: '',
            judgmentType: '',
            showGameOver: false,
            finalScore: null,
            bonuses: null,
            visualizerBars: Array(32).fill(0),
            beatPulse: false,
            gameEngine: null,
            audioContext: null
        };
    },
    methods: {
        async loadData() {
            this.user = Auth.getUser();
            const params = Router.getCurrentParams();
            const musicId = params.musicId;

            const [musicRes, charRes, bonusesRes] = await Promise.all([
                musicId ? YpAPI.music.detail(musicId) : Promise.resolve({ code: 0, data: null }),
                YpAPI.character.my(),
                YpAPI.game.bonuses()
            ]);

            if (musicRes.code === 0) {
                this.music = musicRes.data;
            }

            if (charRes.code === 0 && charRes.data) {
                const chars = charRes.data.characters || [];
                const usingId = charRes.data.using_character_id;
                const charResAll = await YpAPI.character.list();
                if (charResAll.code === 0 && charResAll.data) {
                    const allChars = charResAll.data.items || charResAll.data || [];
                    this.character = allChars.find(c => c.id === usingId) || allChars[0];
                }
            }

            if (bonusesRes.code === 0 && bonusesRes.data) {
                this.bonuses = bonusesRes.data;
            }
        },
        startGame() {
            this.gameState = 'playing';
            this.score = 0;
            this.combo = 0;
            this.maxCombo = 0;
            this.perfectCount = 0;
            this.goodCount = 0;
            this.missCount = 0;
            this.coinsEarned = 0;
            this.distance = 0;
            this.playTime = 0;
            this.showGameOver = false;
            this.finalScore = null;

            this.initGame();
        },
        initGame() {
            const canvas = this.$refs.gameCanvas;
            if (!canvas) return;

            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            const bpm = this.music ? this.music.bpm : 120;
            const difficulty = this.music ? this.music.difficulty : 2;

            this.gameEngine = new YPGame(canvas, {
                bpm: bpm,
                difficulty: difficulty,
                music: this.music,
                character: this.character,
                bonuses: this.bonuses,
                onScore: (points, type) => this.onScore(points, type),
                onCombo: (combo) => this.onCombo(combo),
                onBeat: () => this.onBeat(),
                onGameOver: (stats) => this.onGameOver(stats),
                onDistance: (dist) => this.onDistance(dist),
                onTime: (time) => this.onTime(time),
                onVisualizer: (data) => this.onVisualizer(data)
            });

            this.gameEngine.start();

            document.addEventListener('keydown', this.handleKeydown);
            canvas.addEventListener('click', this.handleClick);
            canvas.addEventListener('touchstart', this.handleTouch);
        },
        handleKeydown(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameEngine) {
                    this.gameEngine.jump();
                }
            }
        },
        handleClick(e) {
            if (this.gameEngine) {
                this.gameEngine.jump();
            }
        },
        handleTouch(e) {
            e.preventDefault();
            if (this.gameEngine) {
                this.gameEngine.jump();
            }
        },
        onScore(points, type) {
            this.score += points;
            this.coinsEarned += Math.floor(points / 100);

            if (type === 'perfect') {
                this.perfectCount++;
                this.showJudgment('PERFECT!', 'perfect');
            } else if (type === 'good') {
                this.goodCount++;
                this.showJudgment('GOOD!', 'good');
            } else if (type === 'miss') {
                this.missCount++;
                this.showJudgment('MISS', 'miss');
            } else if (type === 'note') {
                this.perfectCount++;
                this.showJudgment('NOTE!', 'perfect');
            } else if (type === 'beat') {
                this.perfectCount++;
                this.showJudgment('BEAT!', 'perfect');
            }
        },
        onCombo(combo) {
            this.combo = combo;
            if (combo > this.maxCombo) {
                this.maxCombo = combo;
            }
            this.showCombo = true;
            setTimeout(() => {
                this.showCombo = false;
            }, 1000);
        },
        onBeat() {
            this.beatPulse = true;
            setTimeout(() => {
                this.beatPulse = false;
            }, 300);
        },
        onDistance(dist) {
            this.distance = Math.floor(dist);
        },
        onTime(time) {
            this.playTime = time;
        },
        onVisualizer(data) {
            this.visualizerBars = data;
        },
        showJudgment(text, type) {
            this.judgmentText = text;
            this.judgmentType = type;
            setTimeout(() => {
                this.judgmentText = '';
            }, 500);
        },
        async onGameOver(stats) {
            this.gameState = 'ended';
            document.removeEventListener('keydown', this.handleKeydown);

            const response = await YpAPI.score.submit({
                music_id: this.music ? this.music.id : null,
                score: this.score,
                max_combo: this.maxCombo,
                perfect_count: this.perfectCount,
                good_count: this.goodCount,
                miss_count: this.missCount,
                coins_earned: this.coinsEarned,
                distance: this.distance,
                play_time: Math.floor(this.playTime)
            });

            if (response.code === 0 && response.data) {
                this.finalScore = response.data;
                this.user.coins = response.data.user.coins;
                this.user.highest_score = response.data.user.highest_score;
                this.user.total_score = response.data.user.total_score;
                this.user.level = response.data.user.level;
                this.user.exp = response.data.user.exp;
                Auth.setUser(this.user);
            } else {
                this.finalScore = {
                    final_score: this.score,
                    perfect_count: this.perfectCount,
                    good_count: this.goodCount,
                    miss_count: this.missCount,
                    max_combo: this.maxCombo,
                    coins_earned: this.coinsEarned,
                    distance: this.distance,
                    play_time: this.playTime,
                    rank: '-'
                };
            }

            this.showGameOver = true;
            if (this.gameEngine) {
                this.gameEngine.destroy();
                this.gameEngine = null;
            }
        },
        restartGame() {
            this.showGameOver = false;
            this.gameState = 'ready';
        },
        goBack() {
            if (this.gameEngine) {
                this.gameEngine.destroy();
                this.gameEngine = null;
            }
            document.removeEventListener('keydown', this.handleKeydown);
            Router.navigate('music');
        }
    },
    async mounted() {
        await this.loadData();
    },
    beforeUnmount() {
        if (this.gameEngine) {
            this.gameEngine.destroy();
            this.gameEngine = null;
        }
        document.removeEventListener('keydown', this.handleKeydown);
    }
};
