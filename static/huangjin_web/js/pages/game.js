const GamePage = {
    props: ['user', 'isAdmin'],
    template: `
    <div>
        <div class="page-header">
            <h2 class="page-title">⛏️ 挖矿寻宝</h2>
        </div>

        <div v-if="!gameStarted && !gameOver && hasSavedGame" class="card" style="text-align:center;padding:40px;margin-bottom:20px;">
            <h3 style="margin-bottom:16px;font-size:22px;" class="text-gold">📋 检测到未完成的游戏</h3>
            <p class="text-secondary mb-16">发现上次保存的游戏进度，是否继续？</p>
            <div style="margin-bottom:20px;padding:12px;background:var(--bg-input);border-radius:8px;display:inline-block;">
                <span style="margin:0 12px;">💰 {{ savedGameState.score }}分</span>
                <span style="margin:0 12px;">💎 {{ savedGameState.oreCount }}个</span>
                <span style="margin:0 12px;">⏱️ 剩余 {{ savedGameState.timeLeft }}秒</span>
            </div>
            <div style="display:flex;gap:12px;justify-content:center;">
                <button class="btn btn-primary" @click="resumeGame">▶️ 继续游戏</button>
                <button class="btn btn-secondary" @click="clearSavedGame">🆕 新游戏</button>
            </div>
        </div>

        <div v-if="!gameStarted && !gameOver" class="card" style="text-align:center;padding:40px;">
            <h3 style="margin-bottom:16px;font-size:22px;">准备好了吗？</h3>
            <p class="text-secondary mb-16">使用 ← → 方向键控制拉绳角度，按空格键发射抓钩</p>
            <p class="text-secondary mb-24">限时60秒，尽可能多地抓取矿石！</p>
            <div v-if="ores.length > 0" style="margin-bottom:24px;">
                <h4 class="mb-8">💎 可挖掘的矿石</h4>
                <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
                    <span v-for="ore in ores" :key="ore.id" style="display:flex;align-items:center;gap:4px;padding:4px 10px;background:var(--bg-input);border-radius:6px;font-size:13px;">
                        <span class="ore-sample" :style="{backgroundColor:ore.color,width:'14px',height:'14px'}"></span>
                        {{ ore.name }}({{ ore.value }}分)
                    </span>
                </div>
            </div>
            <button class="btn btn-primary btn-lg" @click="startGame" :disabled="starting">
                {{ starting ? '加载中...' : '🎮 开始游戏' }}
            </button>
        </div>

        <div v-if="gameStarted" class="game-canvas-container">
            <div class="game-hud">
                <div class="game-hud-item">⏱️ {{ timeLeft }}s</div>
                <div class="game-hud-item">💰 {{ score }}分</div>
                <div class="game-hud-item">💎 {{ oreCount }}个</div>
            </div>
            <canvas ref="gameCanvas" class="game-canvas" width="800" height="500"></canvas>
        </div>

        <div v-if="gameOver" class="card" style="text-align:center;padding:40px;">
            <h2 style="font-size:32px;margin-bottom:8px;" class="text-gold">🎉 游戏结束</h2>
            <div style="font-size:48px;font-weight:bold;margin:16px 0;" class="text-gold">{{ finalScore }} 分</div>
            <p class="text-secondary mb-8">收集了 {{ finalOreCount }} 个矿石</p>
            <div v-if="newAchievements.length > 0" style="margin:16px 0;">
                <h4 class="mb-8">🎖️ 解锁新成就!</h4>
                <div v-for="ach in newAchievements" :key="ach.id" style="display:inline-block;padding:8px 16px;margin:4px;border-radius:8px;border:1px solid var(--primary);background:rgba(212,160,23,0.1);">
                    <span>{{ ach.name }}</span>
                    <span class="text-secondary" style="font-size:12px;"> - {{ ach.description }}</span>
                </div>
            </div>
            <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;">
                <button class="btn btn-primary btn-lg" @click="startGame">🎮 再来一局</button>
                <button class="btn btn-secondary btn-lg" @click="$emit('navigate', 'leaderboard')">🏆 排行榜</button>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            gameStarted: false,
            gameOver: false,
            starting: false,
            score: 0,
            oreCount: 0,
            timeLeft: 60,
            finalScore: 0,
            finalOreCount: 0,
            newAchievements: [],
            ores: [],
            gameData: null,
            canvas: null,
            ctx: null,
            hook: { x: 400, y: 80, angle: 0, length: 40, speed: 2, swinging: true, extending: false, retracting: false, caught: null },
            minerals: [],
            timer: null,
            animFrame: null,
            collectedOres: [],
            keys: {},
            saveTimer: null,
            hasSavedGame: false,
            savedGameState: null
        };
    },
    computed: {
        SAVE_KEY() {
            return 'huangjin_game_state';
        }
    },
    mounted() {
        try {
            this.checkSavedGame();
            this.loadOres();
            window.addEventListener('beforeunload', this.handleBeforeUnload);
        } catch (e) {
            console.error('Game page init error:', e);
            this.clearSavedGame();
        }
    },
    methods: {
        async loadOres() {
            const result = await Api.ore.getEnabled();
            if (result.code === 0 && result.data) {
                this.ores = result.data;
            }
        },
        checkSavedGame() {
            try {
                const saved = sessionStorage.getItem(this.SAVE_KEY);
                if (saved) {
                    const state = JSON.parse(saved);
                    const now = Date.now();
                    const savedAt = state.savedAt || 0;
                    const isExpired = now - savedAt > 2 * 60 * 60 * 1000;
                    
                    if (state && 
                        state.gameStarted && 
                        !state.gameOver && 
                        state.timeLeft > 0 && 
                        state.timeLeft <= 60 &&
                        !isExpired &&
                        Array.isArray(state.minerals) &&
                        typeof state.score === 'number') {
                        this.hasSavedGame = true;
                        this.savedGameState = state;
                    } else {
                        this.clearSavedGame();
                    }
                }
            } catch (e) {
                console.error('Failed to load saved game:', e);
                this.clearSavedGame();
            }
        },
        saveGameState() {
            if (!this.gameStarted || this.gameOver) return;
            try {
                const hookToSave = { ...this.hook };
                delete hookToSave.caught;
                
                const state = {
                    gameStarted: this.gameStarted,
                    gameOver: this.gameOver,
                    score: this.score,
                    oreCount: this.oreCount,
                    timeLeft: this.timeLeft,
                    collectedOres: this.collectedOres,
                    hook: hookToSave,
                    minerals: this.minerals.map(m => ({
                        x: m.x,
                        y: m.y,
                        size: m.size,
                        ore: { id: m.ore.id, name: m.ore.name, value: m.ore.value, color: m.ore.color, weight: m.ore.weight, rarity: m.ore.rarity },
                        collected: m.collected
                    })),
                    savedAt: Date.now()
                };
                sessionStorage.setItem(this.SAVE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save game state:', e);
            }
        },
        clearSavedGame() {
            sessionStorage.removeItem(this.SAVE_KEY);
            this.hasSavedGame = false;
            this.savedGameState = null;
        },
        handleBeforeUnload() {
            this.saveGameState();
        },
        startAutoSave() {
            if (this.saveTimer) clearInterval(this.saveTimer);
            this.saveTimer = setInterval(() => {
                this.saveGameState();
            }, 2000);
        },
        stopAutoSave() {
            if (this.saveTimer) {
                clearInterval(this.saveTimer);
                this.saveTimer = null;
            }
        },
        async resumeGame() {
            if (!this.savedGameState) return;
            
            const savedState = { ...this.savedGameState };
            this.starting = true;
            this.clearSavedGame();
            
            try {
                if (this.ores.length === 0) {
                    await this.loadOres();
                }
                
                const result = await Api.game.start();
                if (result.code === 0 && result.data) {
                    this.gameData = result.data;
                    if (this.ores.length === 0) {
                        this.ores = result.data.ores || [];
                    }
                    
                    this.score = savedState.score || 0;
                    this.oreCount = savedState.oreCount || 0;
                    this.timeLeft = savedState.timeLeft || 60;
                    this.collectedOres = savedState.collectedOres || [];
                    this.gameOver = false;
                    this.gameStarted = true;
                    this.newAchievements = [];
                    
                    this.$nextTick(() => {
                        this.initCanvas();
                        
                        if (savedState.hook) {
                            this.hook = { ...savedState.hook };
                        }
                        
                        if (savedState.minerals) {
                            this.minerals = savedState.minerals.map(m => ({
                                ...m,
                                ore: this.ores.find(o => o.id === m.ore.id) || m.ore
                            }));
                        } else {
                            this.generateMinerals();
                        }
                        
                        this.startTimer();
                        this.startAutoSave();
                        this.gameLoop();
                    });
                } else {
                    alert(result.msg || '恢复游戏失败，请开始新游戏');
                }
            } catch (e) {
                console.error('Resume game error:', e);
                alert('恢复游戏失败，请开始新游戏');
            }
            this.starting = false;
        },
        async startGame() {
            this.$emit('navigate', 'game');
            this.starting = true;
            this.clearSavedGame();
            
            try {
                const result = await Api.game.start();
                if (result.code === 0 && result.data) {
                    this.gameData = result.data;
                    this.ores = result.data.ores || [];
                    this.score = 0;
                    this.oreCount = 0;
                    this.timeLeft = 60;
                    this.gameOver = false;
                    this.gameStarted = true;
                    this.newAchievements = [];
                    this.collectedOres = [];
                    this.$nextTick(() => {
                        this.initCanvas();
                        this.generateMinerals();
                        this.startTimer();
                        this.startAutoSave();
                        this.gameLoop();
                    });
                } else {
                    alert(result.msg || '开始游戏失败');
                }
            } catch (e) {
                console.error('Start game error:', e);
                alert('开始游戏失败');
            }
            this.starting = false;
        },
        initCanvas() {
            this.canvas = this.$refs.gameCanvas;
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = 800;
            this.canvas.height = 500;
            this.hook = { x: 400, y: 80, angle: 0, length: 40, speed: 2, swinging: true, extending: false, retracting: false, caught: null };

            const handleKeyDown = (e) => {
                this.keys[e.key] = true;
                if (e.key === ' ' && this.hook.swinging) {
                    e.preventDefault();
                    this.hook.swinging = false;
                    this.hook.extending = true;
                }
            };
            const handleKeyUp = (e) => {
                this.keys[e.key] = false;
            };

            window._huangjin_keydown = handleKeyDown;
            window._huangjin_keyup = handleKeyUp;
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        },
        generateMinerals() {
            this.minerals = [];
            const count = 8 + Math.floor(Math.random() * 5);
            for (let i = 0; i < count; i++) {
                const ore = this.ores[Math.floor(Math.random() * this.ores.length)];
                if (!ore) continue;
                const size = 20 + (1 - ore.weight / 3) * 20;
                this.minerals.push({
                    x: 50 + Math.random() * 700,
                    y: 180 + Math.random() * 280,
                    size: size,
                    ore: ore,
                    collected: false
                });
            }
        },
        startTimer() {
            if (this.timer) clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }, 1000);
        },
        gameLoop() {
            if (!this.gameStarted) return;
            this.update();
            this.draw();
            this.animFrame = requestAnimationFrame(() => this.gameLoop());
        },
        update() {
            if (this.keys['ArrowLeft']) {
                this.hook.angle -= 0.03;
            }
            if (this.keys['ArrowRight']) {
                this.hook.angle += 0.03;
            }
            this.hook.angle = Math.max(-1.2, Math.min(1.2, this.hook.angle));

            if (this.hook.swinging) {
                this.hook.angle += Math.sin(Date.now() / 500) * 0.02;
                this.hook.angle = Math.max(-1.2, Math.min(1.2, this.hook.angle));
            }

            if (this.hook.extending) {
                this.hook.length += 4;
                const tipX = this.hook.x + Math.sin(this.hook.angle) * this.hook.length;
                const tipY = this.hook.y + Math.cos(this.hook.angle) * this.hook.length;

                if (tipY >= 490 || tipX <= 10 || tipX >= 790) {
                    this.hook.extending = false;
                    this.hook.retracting = true;
                }

                for (const mineral of this.minerals) {
                    if (mineral.collected) continue;
                    const dx = tipX - mineral.x;
                    const dy = tipY - mineral.y;
                    if (Math.sqrt(dx * dx + dy * dy) < mineral.size) {
                        mineral.collected = true;
                        this.hook.caught = mineral;
                        this.hook.extending = false;
                        this.hook.retracting = true;
                        break;
                    }
                }
            }

            if (this.hook.retracting) {
                const retractSpeed = this.hook.caught ? Math.max(1, 4 - this.hook.caught.ore.weight) : 4;
                this.hook.length -= retractSpeed;
                if (this.hook.length <= 40) {
                    if (this.hook.caught) {
                        this.score += this.hook.caught.ore.value;
                        this.oreCount++;
                        this.collectedOres.push({
                            name: this.hook.caught.ore.name,
                            value: this.hook.caught.ore.value,
                            color: this.hook.caught.ore.color
                        });
                        this.hook.caught = null;
                    }
                    this.hook.length = 40;
                    this.hook.retracting = false;
                    this.hook.swinging = true;
                }
            }
        },
        draw() {
            const ctx = this.ctx;
            if (!ctx) return;

            ctx.clearRect(0, 0, 800, 500);

            const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
            skyGrad.addColorStop(0, '#1a1a3e');
            skyGrad.addColorStop(1, '#2a2a5e');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, 800, 160);

            const groundGrad = ctx.createLinearGradient(0, 160, 0, 500);
            groundGrad.addColorStop(0, '#3d2b1f');
            groundGrad.addColorStop(1, '#1a0e08');
            ctx.fillStyle = groundGrad;
            ctx.fillRect(0, 160, 800, 340);

            ctx.fillStyle = '#4a3728';
            ctx.fillRect(370, 50, 60, 30);
            ctx.fillStyle = '#5a4738';
            ctx.fillRect(350, 40, 100, 15);

            ctx.fillStyle = '#8B7355';
            ctx.fillRect(this.hook.x - 5, this.hook.y - 5, 10, 10);

            const tipX = this.hook.x + Math.sin(this.hook.angle) * this.hook.length;
            const tipY = this.hook.y + Math.cos(this.hook.angle) * this.hook.length;

            ctx.beginPath();
            ctx.moveTo(this.hook.x, this.hook.y);
            ctx.lineTo(tipX, tipY);
            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();

            if (this.hook.caught) {
                const m = this.hook.caught;
                ctx.beginPath();
                ctx.arc(tipX, tipY + m.size / 2, m.size / 2, 0, Math.PI * 2);
                ctx.fillStyle = m.ore.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(m.ore.name, tipX, tipY + m.size / 2 + 4);
            }

            for (const mineral of this.minerals) {
                if (mineral.collected) continue;
                ctx.beginPath();
                if (mineral.ore.rarity >= 3) {
                    this.drawDiamond(ctx, mineral.x, mineral.y, mineral.size / 2);
                } else {
                    ctx.arc(mineral.x, mineral.y, mineral.size / 2, 0, Math.PI * 2);
                }
                ctx.fillStyle = mineral.ore.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(mineral.ore.name, mineral.x, mineral.y + 4);
                ctx.font = '9px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.fillText(mineral.ore.value + '分', mineral.x, mineral.y + mineral.size / 2 + 12);

                if (mineral.ore.rarity >= 3) {
                    ctx.beginPath();
                    ctx.arc(mineral.x, mineral.y, mineral.size / 2 + 4, 0, Math.PI * 2);
                    ctx.strokeStyle = mineral.ore.color + '40';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        },
        drawDiamond(ctx, x, y, r) {
            ctx.beginPath();
            ctx.moveTo(x, y - r);
            ctx.lineTo(x + r, y);
            ctx.lineTo(x, y + r);
            ctx.lineTo(x - r, y);
            ctx.closePath();
        },
        async endGame() {
            this.gameStarted = false;
            this.gameOver = true;
            this.finalScore = this.score;
            this.finalOreCount = this.oreCount;

            this.stopAutoSave();
            this.clearSavedGame();

            if (this.timer) clearInterval(this.timer);
            if (this.animFrame) cancelAnimationFrame(this.animFrame);

            window.removeEventListener('keydown', window._huangjin_keydown);
            window.removeEventListener('keyup', window._huangjin_keyup);
            window.removeEventListener('beforeunload', this.handleBeforeUnload);

            const result = await Api.game.submit(this.score, 60, this.collectedOres);
            if (result.code === 0 && result.data) {
                if (result.data.new_achievements && result.data.new_achievements.length > 0) {
                    this.newAchievements = result.data.new_achievements;
                }
                if (result.data.user) {
                    Storage.setUser(result.data.user);
                    this.$emit('score-updated');
                }
            }
        }
    },
    beforeUnmount() {
        this.stopAutoSave();
        if (this.gameStarted && !this.gameOver) {
            this.saveGameState();
        }
        if (this.timer) clearInterval(this.timer);
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        window.removeEventListener('keydown', window._huangjin_keydown);
        window.removeEventListener('keyup', window._huangjin_keyup);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
};
