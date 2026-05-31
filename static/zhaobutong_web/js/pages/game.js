const GamePage = {
    template: `
    <div class="game-page">
        <div class="game-header">
            <button class="game-back-btn" @click="confirmQuit">✕</button>
            <div class="game-timer" :class="{ 'timer-warning': timeLeft <= 15 }">
                ⏱ {{ formatTime(timeLeft) }}
            </div>
            <div class="game-progress">
                <span class="found-count">{{ foundCount }}</span>/<span class="total-count">{{ totalDiffs }}</span>
            </div>
        </div>

        <div class="game-content" ref="gameContent">
            <div class="game-images">
                <div class="game-image-panel">
                    <div class="panel-label">原图</div>
                    <div class="canvas-wrapper" ref="canvasWrapper1"
                         @click="handleClick($event, 1)"
                         @touchstart.prevent="handleTouch($event, 1)">
                        <canvas ref="canvas1" class="game-canvas"></canvas>
                    </div>
                </div>
                <div class="game-image-panel">
                    <div class="panel-label">找不同</div>
                    <div class="canvas-wrapper" ref="canvasWrapper2"
                         @click="handleClick($event, 2)"
                         @touchstart.prevent="handleTouch($event, 2)">
                        <canvas ref="canvas2" class="game-canvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="game-footer">
            <button class="hint-btn" @click="useHint" :disabled="hintsUsed >= maxHints">
                💡 提示 ({{ maxHints - hintsUsed }})
            </button>
        </div>

        <div v-if="showResult" class="game-result-overlay" @click.self="closeResult">
            <div class="game-result-modal">
                <div class="result-icon">{{ gameWon ? '🎉' : '😢' }}</div>
                <div class="result-title">{{ gameWon ? '恭喜通关！' : '时间到！' }}</div>
                <div class="result-info">
                    <div class="result-row">
                        <span>用时</span>
                        <span>{{ formatTime(timeUsed) }}</span>
                    </div>
                    <div class="result-row">
                        <span>找到</span>
                        <span>{{ foundCount }}/{{ totalDiffs }}</span>
                    </div>
                    <div class="result-row">
                        <span>使用提示</span>
                        <span>{{ hintsUsed }}次</span>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" @click="closeResult">返回首页</button>
            </div>
        </div>

        <div v-if="showQuitConfirm" class="game-result-overlay">
            <div class="game-result-modal">
                <div class="result-icon">⚠️</div>
                <div class="result-title">确定退出？</div>
                <div class="result-info">
                    <p>当前游戏进度将不会保存</p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-outline" @click="showQuitConfirm = false">继续游戏</button>
                    <button class="btn btn-danger" @click="quitGame">退出</button>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            gameData: null,
            timeLeft: 0,
            timeUsed: 0,
            timer: null,
            foundDiffs: [],
            foundDiffIds: [],
            hintsUsed: 0,
            maxHints: 3,
            totalDiffs: 0,
            showResult: false,
            gameWon: false,
            showQuitConfirm: false,
            recordId: null,
            imgOriginal: null,
            imgModified: null,
            canvasScale: 1
        };
    },
    computed: {
        foundCount() {
            return this.foundDiffIds.length;
        }
    },
    mounted() {
        this.gameData = ZbtStorage.getGameData();
        if (!this.gameData) {
            ZbtRouter.navigate('/home');
            return;
        }

        const savedState = ZbtStorage.getGameState();
        this.recordId = this.gameData.record_id;
        this.timeLeft = this.gameData.time_limit || 120;
        this.totalDiffs = this.gameData.difference_count || 0;
        this.maxHints = this.gameData.hint_count || 3;

        if (savedState && savedState.record_id === this.recordId) {
            this.foundDiffIds = savedState.found_diff_ids || [];
            this.hintsUsed = savedState.hints_used || 0;
            this.timeUsed = savedState.time_used || 0;
            this.timeLeft = Math.max(0, (this.gameData.time_limit || 120) - this.timeUsed);
        }

        this.loadImages();
    },
    beforeUnmount() {
        this.stopTimer();
    },
    methods: {
        saveState() {
            ZbtStorage.setGameState({
                record_id: this.recordId,
                found_diff_ids: this.foundDiffIds,
                hints_used: this.hintsUsed,
                time_used: this.timeUsed
            });
        },

        async loadImages() {
            try {
                const themes = {
                    nature: [
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serene%20mountain%20lake%20with%20reflection%20and%20pine%20trees%20golden%20hour%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tropical%20waterfall%20in%20lush%20green%20rainforest%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=snowy%20mountain%20peak%20with%20alpine%20meadow%20wildflowers%20realistic%20photography&image_size=landscape_4_3'
                    ],
                    city: [
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20city%20skyline%20at%20sunset%20with%20illuminated%20buildings%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=charming%20european%20street%20with%20cafe%20and%20cobblestone%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tokyo%20neon%20street%20at%20night%20with%20rain%20reflections%20realistic%20photography&image_size=landscape_4_3'
                    ],
                    food: [
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20dessert%20table%20with%20cakes%20macarons%20and%20tea%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20sushi%20platter%20with%20sashimi%20and%20rolls%20realistic%20photography&image_size=landscape_4_3',
                        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=artisan%20bread%20bakery%20display%20with%20pastries%20realistic%20photography&image_size=landscape_4_3'
                    ]
                };

                const theme = this.gameData.theme || 'nature';
                const diff = this.gameData.difficulty || 1;
                const idx = diff - 1;
                const url = themes[theme]?.[idx] || themes.nature[0];

                this.imgOriginal = await this.loadImage(url);
                this.imgModified = await this.createModifiedImage(this.imgOriginal);

                this.$nextTick(() => {
                    this.drawCanvases();
                    if (this.foundDiffIds.length > 0) {
                        this.foundDiffs = (this.gameData.differences || []).filter(d => this.foundDiffIds.includes(d.id));
                        this.drawCanvases();
                    }
                    this.startTimer();
                });
            } catch (e) {
                console.error('加载图片失败:', e);
                this.showToast('图片加载失败');
            }
        },

        loadImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => {
                    const c = document.createElement('canvas');
                    c.width = 600; c.height = 400;
                    const ctx = c.getContext('2d');
                    const gradients = {
                        nature: ['#2d6a4f', '#52b788'],
                        city: ['#343a40', '#6c757d'],
                        food: ['#e76f51', '#f4a261']
                    };
                    const colors = gradients[this.gameData?.theme] || gradients.nature;
                    const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
                    grad.addColorStop(0, colors[0]);
                    grad.addColorStop(1, colors[1]);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.gameData?.level_name || '找不同', c.width / 2, c.height / 2);
                    const fallbackImg = new Image();
                    fallbackImg.onload = () => resolve(fallbackImg);
                    fallbackImg.src = c.toDataURL();
                };
                img.src = url;
            });
        },

        createModifiedImage(originalImg) {
            const canvas = document.createElement('canvas');
            canvas.width = originalImg.width;
            canvas.height = originalImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(originalImg, 0, 0);

            const diffs = this.gameData.differences || [];
            const diffColors = ['#e63946', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#ff5722', '#4caf50'];

            diffs.forEach((diff, idx) => {
                const x = diff.x || (100 + Math.random() * (canvas.width - 200));
                const y = diff.y || (100 + Math.random() * (canvas.height - 200));
                const radius = diff.radius || 25;

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                const imgData = ctx.getImageData(
                    Math.max(0, x - radius),
                    Math.max(0, y - radius),
                    radius * 2,
                    radius * 2
                );

                const shiftR = (idx * 60 + 40) % 120 - 60;
                const shiftG = (idx * 90 + 30) % 120 - 60;
                const shiftB = (idx * 120 + 20) % 120 - 60;

                for (let i = 0; i < imgData.data.length; i += 4) {
                    imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + shiftR));
                    imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + shiftG));
                    imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + shiftB));
                }

                ctx.putImageData(imgData, Math.max(0, x - radius), Math.max(0, y - radius));
                ctx.restore();

                if (!diff.x) {
                    diff.x = x;
                    diff.y = y;
                }
            });

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = canvas.toDataURL();
            });
        },

        drawCanvases() {
            this.drawOnCanvas(this.$refs.canvas1, this.imgOriginal);
            this.drawOnCanvas(this.$refs.canvas2, this.imgModified);
            this.drawFoundCircles();
        },

        drawOnCanvas(canvas, img) {
            if (!canvas || !img) return;
            const wrapper = canvas.parentElement;
            const wrapperWidth = wrapper.clientWidth;
            const aspectRatio = img.width / img.height;
            const canvasWidth = wrapperWidth;
            const canvasHeight = canvasWidth / aspectRatio;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            canvas.style.width = canvasWidth + 'px';
            canvas.style.height = canvasHeight + 'px';

            this.canvasScale = img.width / canvasWidth;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        },

        drawFoundCircles() {
            [this.$refs.canvas1, this.$refs.canvas2].forEach(canvas => {
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                this.foundDiffs.forEach((diff) => {
                    const x = diff.x / this.canvasScale;
                    const y = diff.y / this.canvasScale;
                    const r = (diff.radius || 25) / this.canvasScale;

                    ctx.beginPath();
                    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(x, y, r + 6, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('✓', x, y + 5);
                });
            });
        },

        handleClick(event, panel) {
            const canvas = panel === 1 ? this.$refs.canvas1 : this.$refs.canvas2;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * this.canvasScale;
            const y = (event.clientY - rect.top) * this.canvasScale;
            this.checkDifference(x, y);
        },

        handleTouch(event, panel) {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                const canvas = panel === 1 ? this.$refs.canvas1 : this.$refs.canvas2;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const x = (touch.clientX - rect.left) * this.canvasScale;
                const y = (touch.clientY - rect.top) * this.canvasScale;
                this.checkDifference(x, y);
            }
        },

        checkDifference(clickX, clickY) {
            const diffs = this.gameData.differences || [];
            for (const diff of diffs) {
                if (this.foundDiffIds.includes(diff.id)) continue;

                const dx = clickX - diff.x;
                const dy = clickY - diff.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const radius = (diff.radius || 25) * 1.5;

                if (dist <= radius) {
                    this.foundDiffIds.push(diff.id);
                    this.foundDiffs.push(diff);
                    this.drawCanvases();
                    this.saveState();

                    if (this.foundCount >= this.totalDiffs) {
                        this.winGame();
                    }
                    return;
                }
            }
        },

        async useHint() {
            if (this.hintsUsed >= this.maxHints) return;
            try {
                const result = await ZbtApi.get('/zbt/game/hint/get', { record_id: this.recordId });
                if (result.code === 0) {
                    this.hintsUsed = result.data.hints_used || (this.hintsUsed + 1);
                    const diff = this.gameData.differences.find(d =>
                        d.x === result.data.x && d.y === result.data.y
                    );
                    if (diff && !this.foundDiffIds.includes(diff.id)) {
                        this.foundDiffIds.push(diff.id);
                        this.foundDiffs.push(diff);
                        this.drawCanvases();
                        this.saveState();
                        if (this.foundCount >= this.totalDiffs) {
                            this.winGame();
                        }
                    }
                }
            } catch (e) {
                const unfound = (this.gameData.differences || []).find(d => !this.foundDiffIds.includes(d.id));
                if (unfound) {
                    this.foundDiffIds.push(unfound.id);
                    this.foundDiffs.push(unfound);
                    this.hintsUsed++;
                    this.drawCanvases();
                    this.saveState();
                    if (this.foundCount >= this.totalDiffs) {
                        this.winGame();
                    }
                }
            }
        },

        startTimer() {
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.timeUsed++;
                if (this.timeUsed % 5 === 0) {
                    this.saveState();
                }
                if (this.timeLeft <= 0) {
                    this.loseGame();
                }
            }, 1000);
        },

        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },

        async winGame() {
            this.stopTimer();
            this.gameWon = true;
            this.showResult = true;
            ZbtStorage.removeGameState();
            ZbtStorage.removeGameData();
            try {
                await ZbtApi.post('/zbt/game/complete', {
                    record_id: this.recordId,
                    time_used: this.timeUsed,
                    hints_used: this.hintsUsed,
                    differences_found: this.foundCount
                });
            } catch (e) {
                console.error(e);
            }
        },

        async loseGame() {
            this.stopTimer();
            this.gameWon = false;
            this.showResult = true;
            ZbtStorage.removeGameState();
            ZbtStorage.removeGameData();
            try {
                await ZbtApi.post('/zbt/game/fail', {
                    record_id: this.recordId,
                    time_used: this.timeUsed,
                    hints_used: this.hintsUsed,
                    differences_found: this.foundCount
                });
            } catch (e) {
                console.error(e);
            }
        },

        confirmQuit() {
            this.showQuitConfirm = true;
        },

        quitGame() {
            this.stopTimer();
            ZbtStorage.removeGameData();
            ZbtStorage.removeGameState();
            ZbtRouter.navigate('/home');
        },

        closeResult() {
            ZbtStorage.removeGameData();
            ZbtStorage.removeGameState();
            ZbtRouter.navigate('/home');
        },

        formatTime(seconds) {
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        },

        showToast(msg) {
            const existing = document.querySelector('.zbt-toast');
            if (existing) existing.remove();
            const el = document.createElement('div');
            el.className = 'zbt-toast';
            el.textContent = msg;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }
    }
};
