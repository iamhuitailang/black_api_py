const GameEngine = {
    isRunning: false,
    isPaused: false,
    animationId: null,
    lastTime: 0,
    canvas: null,
    ctx: null,

    props: [],
    performers: [],
    playerIndex: 0,

    score: 0,
    combo: 0,
    maxCombo: 0,
    hp: 100,
    maxHp: 100,
    level: 1,
    difficulty: 'normal',
    characterType: 'clown',

    onScoreUpdate: null,
    onComboUpdate: null,
    onHpUpdate: null,
    onGameOver: null,
    onLevelComplete: null,
    onBeat: null,

    propTypes: {
        ball: { name: '彩球', speed: 1.0, fallTime: 1.0, catchRadius: 55, score: 10, color: '#ff6b6b' },
        ring: { name: '杂技圆环', speed: 1.2, fallTime: 0.8, catchRadius: 48, score: 15, color: '#00d2d3' },
        torch: { name: '旋转火把', speed: 0.8, fallTime: 1.2, catchRadius: 42, score: 22, color: '#ff9f43' },
        vase: { name: '晶晶花瓶', speed: 0.6, fallTime: 1.4, catchRadius: 38, score: 30, color: '#a29bfe' }
    },

    characterDefs: {
        clown: { name: '马戏小丑', emoji: '🤡', hatColor: '#ff6b35', bodyColor: '#e74c3c', ability: '快速连抛', tolerance: 20, description: '平衡百搭，快速连抛、小额容错' },
        street: { name: '街头艺人', emoji: '🎭', hatColor: '#00b894', bodyColor: '#0984e3', ability: '低空瞬接', tolerance: 15, description: '速度灵活，低空瞬接、位移接物' },
        palace: { name: '宫廷杂耍师', emoji: '👑', hatColor: '#fdcb6e', bodyColor: '#6c5ce7', ability: '双倍计分', tolerance: 10, description: '稳定高分，高空远抛、双倍计分' }
    },

    difficulties: {
        easy: { teammates: 1, mistakePenalty: 5, beatWindow: 200, aiAccuracy: 0.92 },
        normal: { teammates: 2, mistakePenalty: 10, beatWindow: 150, aiAccuracy: 0.85 },
        hard: { teammates: 3, mistakePenalty: 15, beatWindow: 100, aiAccuracy: 0.75 }
    },

    levels: [
        { targetCombo: 5, propTypes: ['ball'], spawnRate: 0.4 },
        { targetCombo: 10, propTypes: ['ball', 'ring'], spawnRate: 0.45 },
        { targetCombo: 15, propTypes: ['ball', 'ring', 'torch'], spawnRate: 0.5 },
        { targetCombo: 25, propTypes: ['ball', 'ring', 'torch', 'vase'], spawnRate: 0.5 },
        { targetCombo: 40, propTypes: ['ball', 'ring', 'torch', 'vase'], spawnRate: 0.55 }
    ],

    aiCooldowns: {},
    propIdCounter: 0,
    autoSaveTimer: null,

    init(canvasEl, options = {}) {
        this.stop();
        this.stopAutoSave();

        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        this.difficulty = options.difficulty || 'normal';
        this.characterType = options.characterType || 'clown';

        const rect = canvasEl.getBoundingClientRect();
        canvasEl.width = rect.width || 1000;
        canvasEl.height = 440;

        const diffConfig = this.difficulties[this.difficulty];
        this.performers = this.createPerformers(diffConfig.teammates + 1);

        this.props = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.level = 1;
        this.aiCooldowns = {};
        this.isRunning = false;
        this.isPaused = false;
        this.propIdCounter = 0;
        this.lastTime = 0;

        BeatSystem.init(120);
        BeatSystem.stop();

        this.onScoreUpdate = null;
        this.onComboUpdate = null;
        this.onHpUpdate = null;
        this.onGameOver = null;
        this.onLevelComplete = null;
        this.onBeat = null;

        this.renderStatic();
    },

    restoreState(state) {
        if (!state) return false;
        const hp = state.hp || 100;
        if (hp <= 0) return false;
        this.score = state.score || 0;
        this.combo = state.combo || 0;
        this.maxCombo = state.max_combo || state.maxCombo || 0;
        this.hp = hp;
        this.maxHp = state.max_hp || state.maxHp || 100;
        this.level = state.level || 1;
        return true;
    },

    createPerformers(count) {
        const cw = this.canvas.width;
        const positions = [];
        const spacing = cw / (count + 1);
        const charDef = this.characterDefs[this.characterType];
        const teammateTypes = Object.keys(this.characterDefs);
        let teammateIdx = 0;

        for (let i = 0; i < count; i++) {
            const isPlayer = i === this.playerIndex;
            let type = this.characterType;
            let charInfo = charDef;
            if (!isPlayer) {
                do {
                    type = teammateTypes[teammateIdx % teammateTypes.length];
                    teammateIdx++;
                } while (type === this.characterType && teammateTypes.length > 1);
                charInfo = this.characterDefs[type];
            }

            positions.push({
                id: i,
                x: spacing * (i + 1),
                y: this.canvas.height - 80,
                isPlayer: isPlayer,
                characterType: type,
                emoji: charInfo.emoji,
                hatColor: charInfo.hatColor,
                bodyColor: charInfo.bodyColor,
                name: isPlayer ? '你' : '队友' + i,
                catchRadius: 55 + charInfo.tolerance,
                holdingProp: null
            });
        }
        return positions;
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();

        BeatSystem.start((beat) => {
            this.handleBeat(beat);
            if (this.onBeat) this.onBeat(beat);
        });

        this.gameLoop(performance.now());
        this.startAutoSave();
    },

    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            if (this.isRunning && !this.isPaused) {
                this.saveGameState();
            }
        }, 5000);
    },

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    },

    pause() {
        this.isPaused = true;
        BeatSystem.stop();
    },

    resume() {
        if (!this.isRunning) return;
        this.isPaused = false;
        this.lastTime = performance.now();
        BeatSystem.start((beat) => {
            this.handleBeat(beat);
            if (this.onBeat) this.onBeat(beat);
        });
    },

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        BeatSystem.stop();
        this.stopAutoSave();
    },

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        if (!this.isPaused) {
            const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
            this.lastTime = currentTime;
            this.update(dt);
            this.renderCanvas();
        }

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    },

    update(dt) {
        this.updateProps(dt);
        this.updateAI(dt);
        this.autoCatchForAI();
        this.checkMisses();
        this.checkLevelComplete();
    },

    updateProps(dt) {
        for (const prop of this.props) {
            prop.elapsed += dt;
            if (prop.targetId !== undefined) {
                const target = this.performers[prop.targetId];
                const t = Math.min(prop.elapsed / prop.duration, 1.0);
                prop.x = prop.startX + (target.x - prop.startX) * t;
                const peakH = Math.abs(target.x - prop.startX) * 0.35 + 120;
                prop.y = prop.startY - 4 * peakH * t * (1 - t);
                prop.progress = t;
            }
        }
    },

    updateAI(dt) {
        const diffConfig = this.difficulties[this.difficulty];
        for (const perf of this.performers) {
            if (perf.isPlayer) continue;

            const now = Date.now();
            if (this.aiCooldowns[perf.id] && now < this.aiCooldowns[perf.id]) continue;

            const incomingProp = this.props.find(p =>
                p.targetId === perf.id &&
                p.progress > 0.75 &&
                p.progress < 0.95
            );

            if (incomingProp && Math.random() < diffConfig.aiAccuracy * 0.3) {
                this.aiCooldowns[perf.id] = now + 400 + Math.random() * 300;
            }
        }
    },

    autoCatchForAI() {
        const diffConfig = this.difficulties[this.difficulty];
        for (const perf of this.performers) {
            if (perf.isPlayer) continue;

            for (const prop of this.props) {
                if (prop.targetId !== perf.id) continue;
                if (prop.progress < 0.85 || prop.progress > 1.05) continue;

                const dx = prop.x - perf.x;
                const dy = prop.y - (perf.y - 30);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < perf.catchRadius) {
                    if (Math.random() < diffConfig.aiAccuracy) {
                        this.doCatch(perf.id, prop);
                        const availableTargets = this.performers.filter(p => p.id !== perf.id);
                        if (availableTargets.length > 0) {
                            const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                            const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
                            const propType = levelConfig.propTypes[Math.floor(Math.random() * levelConfig.propTypes.length)];
                            setTimeout(() => {
                                if (this.isRunning && !this.isPaused) {
                                    this.spawnProp(propType, perf.id, target.id);
                                }
                            }, 200 + Math.random() * 300);
                        }
                    } else {
                        this.props = this.props.filter(p => p.id !== prop.id);
                        this.onMiss(prop);
                    }
                    break;
                }
            }
        }
    },

    handleBeat(beat) {
        const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
        if (Math.random() < levelConfig.spawnRate) {
            const propType = levelConfig.propTypes[Math.floor(Math.random() * levelConfig.propTypes.length)];
            const fromIndex = Math.floor(Math.random() * this.performers.length);
            let toIndex;
            do {
                toIndex = Math.floor(Math.random() * this.performers.length);
            } while (toIndex === fromIndex);

            this.spawnProp(propType, fromIndex, toIndex);
        }
    },

    spawnProp(type, fromId, toId) {
        const propType = this.propTypes[type];
        const fromPerf = this.performers.find(p => p.id === fromId);
        const toPerf = this.performers.find(p => p.id === toId);
        if (!fromPerf || !toPerf) return;

        const dist = Math.abs(toPerf.x - fromPerf.x);
        const baseDur = propType.fallTime;
        const duration = baseDur * (dist / 300) / propType.speed;
        const finalDuration = Math.max(0.5, Math.min(duration, 2.0));

        this.propIdCounter++;
        this.props.push({
            id: 'prop_' + this.propIdCounter,
            type: type,
            x: fromPerf.x,
            y: fromPerf.y - 30,
            startX: fromPerf.x,
            startY: fromPerf.y - 30,
            targetId: toId,
            duration: finalDuration,
            elapsed: 0,
            progress: 0,
            score: propType.score,
            catchRadius: propType.catchRadius,
            color: propType.color
        });
    },

    doCatch(performerId, prop) {
        this.props = this.props.filter(p => p.id !== prop.id);
        const performer = this.performers.find(p => p.id === performerId);
        if (!performer) return;

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        let bonus = 1;
        if (performer.characterType === 'palace') bonus = 2;

        const syncPercent = BeatSystem.getSyncPercentage(Date.now());
        const syncBonus = 1 + Math.floor(syncPercent / 25) * 0.1;
        const totalScore = Math.floor(prop.score * bonus * syncBonus);

        this.addScore(totalScore);
        if (this.onComboUpdate) this.onComboUpdate(this.combo, this.maxCombo);
    },

    onMiss(prop) {
        if (prop.targetId === this.playerIndex) {
            this.breakCombo();
            this.takeDamage(this.difficulties[this.difficulty].mistakePenalty);
        }
    },

    checkMisses() {
        for (let i = this.props.length - 1; i >= 0; i--) {
            const prop = this.props[i];
            if (prop.progress >= 1.2 || prop.y > this.canvas.height) {
                this.props.splice(i, 1);
                this.onMiss(prop);
            }
        }
    },

    addScore(pts) {
        this.score += pts;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    },

    breakCombo() {
        this.combo = 0;
        if (this.onComboUpdate) this.onComboUpdate(this.combo, this.maxCombo);
    },

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        if (this.onHpUpdate) this.onHpUpdate(this.hp, this.maxHp);
        if (this.hp <= 0) this.gameOver();
    },

    checkLevelComplete() {
        const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
        if (this.combo >= levelConfig.targetCombo) {
            if (this.level < this.levels.length) {
                this.levelUp();
            } else {
                this.victory();
            }
        }
    },

    levelUp() {
        this.level++;
        this.combo = 0;
        this.maxCombo = 0;
        if (this.onLevelComplete) this.onLevelComplete(this.level);
    },

    gameOver() {
        this.stop();
        if (this.onGameOver) this.onGameOver(false, { score: this.score, maxCombo: this.maxCombo, level: this.level });
    },

    victory() {
        this.stop();
        if (this.onGameOver) this.onGameOver(true, { score: this.score, maxCombo: this.maxCombo, level: this.level });
    },

    movePlayer(direction) {
        const player = this.performers[this.playerIndex];
        if (!player) return;
        const speed = 15;
        if (direction === 'left') player.x = Math.max(40, player.x - speed);
        else if (direction === 'right') player.x = Math.min(this.canvas.width - 40, player.x + speed);
    },

    handleInput(action) {
        if (!this.isRunning || this.isPaused) return;

        if (action === 'throw') {
            this.throwProp(this.playerIndex);
        } else if (action === 'catch') {
            this.playerCatch();
        }
    },

    throwProp(fromId) {
        const performer = this.performers.find(p => p.id === fromId);
        if (!performer) return;

        const availableTargets = this.performers.filter(p => p.id !== fromId);
        if (availableTargets.length === 0) return;

        const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
        const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
        const propType = levelConfig.propTypes[Math.floor(Math.random() * levelConfig.propTypes.length)];

        this.spawnProp(propType, fromId, target.id);

        if (fromId === this.playerIndex) {
            const beatSync = BeatSystem.checkSync(Date.now(), this.difficulties[this.difficulty].beatWindow);
            if (beatSync) this.addScore(5);
        }
    },

    playerCatch() {
        const player = this.performers[this.playerIndex];
        if (!player) return;

        let bestProp = null;
        let bestDist = Infinity;

        for (const prop of this.props) {
            if (prop.targetId !== player.id) continue;
            if (prop.progress < 0.5) continue;

            const dx = prop.x - player.x;
            const dy = prop.y - (player.y - 30);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.catchRadius && dist < bestDist) {
                bestProp = prop;
                bestDist = dist;
            }
        }

        if (bestProp) {
            this.doCatch(player.id, bestProp);
            const availableTargets = this.performers.filter(p => p.id !== player.id);
            if (availableTargets.length > 0) {
                const target = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
                const propType = levelConfig.propTypes[Math.floor(Math.random() * levelConfig.propTypes.length)];
                setTimeout(() => {
                    if (this.isRunning && !this.isPaused) {
                        this.spawnProp(propType, player.id, target.id);
                    }
                }, 200);
            }
        }
    },

    getIncomingPropsForPlayer() {
        const player = this.performers[this.playerIndex];
        if (!player) return [];
        return this.props.filter(p => p.targetId === player.id && p.progress > 0.3);
    },

    renderStatic() {
        this.renderCanvas();
    },

    renderCanvas() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.clearRect(0, 0, cw, ch);

        const settings = Storage.getSettings ? Storage.getSettings() : {};
        const theme = settings.theme || 'circus';
        let bgColor1, bgColor2, floorColor, spotColor;
        if (theme === 'carnival') {
            bgColor1 = '#0d1b2a'; bgColor2 = '#1b263b'; floorColor = '#415a77'; spotColor = 'rgba(144,224,239,0.12)';
        } else if (theme === 'palace') {
            bgColor1 = '#2b1a0e'; bgColor2 = '#3d2b1f'; floorColor = '#8b6914'; spotColor = 'rgba(240,230,140,0.12)';
        } else {
            bgColor1 = '#1a0a2e'; bgColor2 = '#2d1b4e'; floorColor = '#8b4513'; spotColor = 'rgba(255,215,0,0.12)';
        }

        const grad = ctx.createLinearGradient(0, 0, 0, ch);
        grad.addColorStop(0, bgColor1);
        grad.addColorStop(1, bgColor2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        ctx.beginPath();
        ctx.ellipse(cw / 2, 0, cw * 0.4, ch * 0.8, 0, 0, Math.PI);
        ctx.fillStyle = spotColor;
        ctx.fill();

        const floorY = ch - 50;
        ctx.fillStyle = floorColor;
        ctx.fillRect(0, floorY, cw, 50);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, floorY, cw, 3);

        for (const prop of this.props) {
            this.drawProp(ctx, prop);
        }

        for (const perf of this.performers) {
            this.drawPerformer(ctx, perf, floorY);
        }

        if (this.isRunning) {
            const incomingProps = this.getIncomingPropsForPlayer();
            for (const ip of incomingProps) {
                if (ip.progress > 0.5) {
                    const player = this.performers[this.playerIndex];
                    if (player) {
                        ctx.save();
                        ctx.strokeStyle = ip.progress > 0.7 ? '#ff6b6b' : '#ffd700';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        ctx.arc(player.x, player.y - 30, player.catchRadius, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        if (ip.progress > 0.75) {
                            ctx.font = 'bold 14px sans-serif';
                            ctx.fillStyle = '#ffd700';
                            ctx.textAlign = 'center';
                            ctx.shadowColor = '#000';
                            ctx.shadowBlur = 4;
                            ctx.fillText('按 Shift 接住!', player.x, player.y - 90);
                        }
                        ctx.restore();
                    }
                    break;
                }
            }
        }

        if (this.combo > 0 && this.isRunning) {
            ctx.save();
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.fillText(this.combo + ' COMBO', cw / 2, 35);

            const levelConfig = this.levels[Math.min(this.level - 1, this.levels.length - 1)];
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.shadowBlur = 0;
            ctx.fillText('目标: ' + levelConfig.targetCombo + ' 连击', cw / 2, 55);
            ctx.restore();
        }
    },

    drawPerformer(ctx, perf, floorY) {
        const x = perf.x;
        const y = floorY;
        const charDef = this.characterDefs[perf.characterType];

        ctx.save();

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = charDef.bodyColor;
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x - 8, y - 40);
        ctx.lineTo(x + 8, y - 40);
        ctx.lineTo(x + 12, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = charDef.hatColor;
        ctx.beginPath();
        ctx.arc(x, y - 50, 14, 0, Math.PI * 2);
        ctx.fill();

        if (perf.characterType === 'clown') {
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.moveTo(x, y - 68);
            ctx.lineTo(x - 8, y - 50);
            ctx.lineTo(x + 8, y - 50);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#ffdd57';
            ctx.beginPath();
            ctx.arc(x, y - 50, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (perf.characterType === 'street') {
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x - 16, y - 58, 32, 6);
            ctx.fillStyle = '#00b894';
            ctx.fillRect(x - 14, y - 55, 28, 3);
        } else if (perf.characterType === 'palace') {
            ctx.fillStyle = '#fdcb6e';
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 58);
            ctx.lineTo(x, y - 70);
            ctx.lineTo(x + 12, y - 58);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#e17055';
            ctx.beginPath();
            ctx.arc(x, y - 68, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 52, 3, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 52, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x - 5, y - 52, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 52, 1.5, 0, Math.PI * 2);
        ctx.fill();

        if (perf.isPlayer) {
            ctx.fillStyle = 'rgba(255,107,53,0.3)';
            ctx.beginPath();
            ctx.arc(x, y - 50, 25, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText(perf.name, x, y + 18);

        if (perf.isPlayer && this.isRunning) {
            const beatPhase = BeatSystem.currentBeat % 4;
            ctx.fillStyle = beatPhase === 0 ? '#ffd700' : 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(x, y - 78, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    drawProp(ctx, prop) {
        const x = prop.x;
        const y = prop.y;
        ctx.save();

        ctx.shadowColor = prop.color;
        ctx.shadowBlur = 8;

        if (prop.type === 'ball') {
            ctx.fillStyle = prop.color;
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(x - 3, y - 3, 4, 0, Math.PI * 2);
            ctx.fill();
        } else if (prop.type === 'ring') {
            ctx.strokeStyle = prop.color;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.stroke();
        } else if (prop.type === 'torch') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(x - 3, y - 5, 6, 18);
            ctx.fillStyle = prop.color;
            ctx.beginPath();
            ctx.arc(x, y - 8, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(x, y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (prop.type === 'vase') {
            ctx.fillStyle = prop.color;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 10);
            ctx.quadraticCurveTo(x - 12, y, x - 8, y + 10);
            ctx.lineTo(x + 8, y + 10);
            ctx.quadraticCurveTo(x + 12, y, x + 5, y - 10);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(x - 6, y - 12, 12, 4);
        }

        ctx.restore();
    },

    getState() {
        return {
            score: this.score,
            combo: this.combo,
            max_combo: this.maxCombo,
            hp: this.hp,
            max_hp: this.maxHp,
            level: this.level,
            difficulty: this.difficulty,
            character_type: this.characterType
        };
    },

    async saveGameState() {
        const state = this.getState();
        Storage.setGameState(state);
        try {
            await ApiService.post('/zashua02/game/state/set', state);
        } catch (e) {}
    },

    saveGameStateSync() {
        const state = this.getState();
        const token = Storage.getToken();
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/zashua02/game/state/set', false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            xhr.send(JSON.stringify(state));
        } catch (e) {}
    },

    async loadGameState() {
        let state = null;
        try {
            const result = await ApiService.get('/zashua02/game/state/get');
            if (result.code === 0 && result.data && result.data.state) {
                state = result.data.state;
            }
        } catch (e) {}

        if (!state) {
            state = Storage.getGameState();
        }

        if (state && typeof state === 'object') {
            if ('max_combo' in state && !('maxCombo' in state)) {
                state.maxCombo = state.max_combo;
            }
            if ('max_hp' in state && !('maxHp' in state)) {
                state.maxHp = state.max_hp;
            }
            if ('character_type' in state && !('characterType' in state)) {
                state.characterType = state.character_type;
            }
        }

        return state;
    },

    async saveRecord(passed) {
        try {
            await ApiService.post('/zashua02/record/add', {
                level: this.level,
                score: this.score,
                combo: this.combo,
                max_combo: this.maxCombo,
                character_type: this.characterType,
                difficulty: this.difficulty,
                passed: passed ? 1 : 0
            });
        } catch (e) {}
    },

    clearSavedState() {
        Storage.setGameState(null);
        try {
            ApiService.post('/zashua02/game/state/set', {
                score: 0, combo: 0, max_combo: 0,
                hp: 0, max_hp: 100, level: 1,
                difficulty: this.difficulty, character_type: this.characterType
            });
        } catch (e) {}
    }
};

window.GameEngine = GameEngine;
