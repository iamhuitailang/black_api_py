class RhythmRunGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.audio = new RhythmAudio();

        this.gameState = 'idle';
        this.currentSong = null;
        this.songData = null;

        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;

        this.groundY = this.height - 80;
        this.judgeX = this.width * 0.25;

        this.player = {
            x: this.judgeX,
            y: this.groundY,
            width: 30,
            height: 50,
            velocityY: 0,
            isJumping: false,
            isSliding: false,
            state: 'run',
            animFrame: 0,
            animTimer: 0,
            jumpHeight: 0,
            slideTimer: 0
        };

        this.gravity = 0.8;
        this.jumpForce = -15;

        this.obstacles = [];
        this.obstacleSpawnIndex = 0;

        this.backgroundLayers = {
            far: { offset: 0, speed: 0.2, buildings: [] },
            mid: { offset: 0, speed: 0.5, buildings: [] },
            near: { offset: 0, speed: 1.0, objects: [] }
        };

        this.particles = [];

        this.judgeEffects = [];

        this.keys = {
            ArrowUp: false,
            ArrowDown: false
        };

        this.screenShake = 0;

        this.lastTime = 0;
        this.animationId = null;
        this.autoSaveTimer = 0;

        this.onGameEnd = null;
        this.onScoreUpdate = null;
        this.onComboUpdate = null;
        this.onJudgement = null;
        this.onProgressUpdate = null;

        this._initBackground();
        this._bindEvents();
    }

    _initBackground() {
        for (let i = 0; i < 15; i++) {
            this.backgroundLayers.far.buildings.push({
                x: i * 80 + Math.random() * 40,
                width: 40 + Math.random() * 30,
                height: 80 + Math.random() * 60,
                color: '#1a1a4a'
            });
        }

        for (let i = 0; i < 12; i++) {
            this.backgroundLayers.mid.buildings.push({
                x: i * 100 + Math.random() * 30,
                width: 50 + Math.random() * 40,
                height: 120 + Math.random() * 80,
                color: '#252555'
            });
        }

        for (let i = 0; i < 10; i++) {
            this.backgroundLayers.near.objects.push({
                x: i * 120,
                type: i % 2 === 0 ? 'lamp' : 'rail'
            });
        }
    }

    _bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
            }
            if (this.gameState !== 'playing') return;

            if (e.key === 'ArrowUp' && !this.keys.ArrowUp) {
                this.keys.ArrowUp = true;
                this._handleJumpInput();
            }
            if (e.key === 'ArrowDown' && !this.keys.ArrowDown) {
                this.keys.ArrowDown = true;
                this._handleSlideInput();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp') {
                this.keys.ArrowUp = false;
            }
            if (e.key === 'ArrowDown') {
                this.keys.ArrowDown = false;
            }
        });
    }

    setSong(songData) {
        this.currentSong = songData;
        this.audio.setBpm(songData.bpm);
        this.audio.setDuration(180);
        this._generateObstacles(songData);
    }

    _generateObstacles(songData) {
        this.obstacles = [];
        const bpm = songData.bpm;
        const totalBeats = Math.floor((bpm / 60) * 180);
        let beatInterval = 4;

        if (songData.id === 'song1') {
            beatInterval = 4;
            for (let beat = 8; beat < totalBeats - 4; beat += beatInterval) {
                const type = (beat / beatInterval) % 2 === 0 ? 'low' : 'pit';
                this.obstacles.push({
                    beat: beat,
                    type: type,
                    hit: false,
                    judged: false
                });
            }
        } else if (songData.id === 'song2') {
            beatInterval = 3;
            let patternIndex = 0;
            const patterns = ['low', 'pit', 'double'];
            for (let beat = 8; beat < totalBeats - 4; beat += beatInterval) {
                let type = patterns[patternIndex % patterns.length];
                patternIndex++;
                this.obstacles.push({
                    beat: beat,
                    type: type,
                    hit: false,
                    judged: false,
                    secondJudged: false
                });
            }
        } else {
            beatInterval = 2;
            const types = ['low', 'pit', 'double'];
            for (let beat = 8; beat < totalBeats - 4; beat += beatInterval) {
                const type = types[Math.floor(Math.random() * types.length)];
                this.obstacles.push({
                    beat: beat,
                    type: type,
                    hit: false,
                    judged: false,
                    secondJudged: false
                });
            }
        }

        this.obstacleSpawnIndex = 0;
    }

    start() {
        if (!this.currentSong) return;

        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        this.obstacleSpawnIndex = 0;
        this.screenShake = 0;

        this.player.y = this.groundY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.state = 'run';
        this.player.jumpHeight = 0;

        this.obstacles.forEach(obs => {
            obs.hit = false;
            obs.judged = false;
            if (obs.secondJudged !== undefined) obs.secondJudged = false;
        });

        this.audio.start();
        this.lastTime = performance.now();
        this._gameLoop();
    }

    stop() {
        this.gameState = 'idle';
        this.audio.stop();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        localStorage.removeItem('rhythm_run_game_state');
    }

    _gameLoop() {
        if (this.gameState !== 'playing') return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this._update(deltaTime);
        this._render();

        if (this.audio.getProgress() >= 1) {
            this._endGame();
            return;
        }

        this.animationId = requestAnimationFrame(() => this._gameLoop());
    }

    _update(deltaTime) {
        const beatTime = this.audio.getBeatTime();
        const pixelsPerBeat = 100;
        const scrollSpeed = pixelsPerBeat * (this.currentSong.bpm / 60);

        this._updatePlayer(deltaTime);
        this._updateObstacles(beatTime, pixelsPerBeat);
        this._updateBackground(scrollSpeed * deltaTime);
        this._updateParticles(deltaTime);
        this._updateJudgeEffects(deltaTime);

        if (this.screenShake > 0) {
            this.screenShake -= deltaTime * 20;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        if (this.onProgressUpdate) {
            this.onProgressUpdate(this.audio.getProgress());
        }

        this._checkMissedObstacles(beatTime);

        this.autoSaveTimer += deltaTime;
        if (this.autoSaveTimer >= 2) {
            this.autoSaveTimer = 0;
            this.saveState();
        }
    }

    _updatePlayer(deltaTime) {
        if (this.player.state === 'jump') {
            this.player.velocityY += this.gravity;
            this.player.y += this.player.velocityY;

            const jumpProgress = (this.groundY - this.player.y) / (this.groundY - (this.groundY - 100));
            if (jumpProgress < 0.33) {
                this.player.jumpFrame = 0;
            } else if (jumpProgress < 0.66) {
                this.player.jumpFrame = 1;
            } else {
                this.player.jumpFrame = 2;
            }

            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.player.velocityY = 0;
                this.player.isJumping = false;
                this.player.state = 'run';
            }
        } else if (this.player.state === 'slide') {
            this.player.slideTimer -= deltaTime;
            this.player.slideAnimTimer = (this.player.slideAnimTimer || 0) + deltaTime;
            if (this.player.slideAnimTimer >= 0.15) {
                this.player.slideAnimTimer = 0;
                this.player.slideFrame = ((this.player.slideFrame || 0) + 1) % 3;
            }
            if (this.player.slideTimer <= 0) {
                this._endSlide();
            }
        } else {
            this.player.animTimer += deltaTime;
            if (this.player.animTimer >= 0.1) {
                this.player.animTimer = 0;
                this.player.animFrame = (this.player.animFrame + 1) % 6;
            }
        }
    }

    _updateObstacles(beatTime, pixelsPerBeat) {
        for (const obs of this.obstacles) {
            obs.x = this.width + (obs.beat - beatTime) * pixelsPerBeat;
        }
    }

    _updateBackground(speed) {
        this.backgroundLayers.far.offset -= speed * 0.2;
        this.backgroundLayers.mid.offset -= speed * 0.5;
        this.backgroundLayers.near.offset -= speed * 1.0;

        const farWidth = 15 * 80;
        if (this.backgroundLayers.far.offset < -farWidth) {
            this.backgroundLayers.far.offset += farWidth;
        }

        const midWidth = 12 * 100;
        if (this.backgroundLayers.mid.offset < -midWidth) {
            this.backgroundLayers.mid.offset += midWidth;
        }

        const nearWidth = 10 * 120;
        if (this.backgroundLayers.near.offset < -nearWidth) {
            this.backgroundLayers.near.offset += nearWidth;
        }
    }

    _updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime * 60;
            p.y += p.vy * deltaTime * 60;
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    _updateJudgeEffects(deltaTime) {
        for (let i = this.judgeEffects.length - 1; i >= 0; i--) {
            const effect = this.judgeEffects[i];
            effect.life -= deltaTime;
            effect.radius += deltaTime * 100;
            if (effect.life <= 0) {
                this.judgeEffects.splice(i, 1);
            }
        }
    }

    _handleJumpInput() {
        if (this.player.state === 'run') {
            this.player.state = 'jump';
            this.player.velocityY = this.jumpForce;
            this.player.isJumping = true;
        }

        this._checkJudgement('jump');
    }

    _handleSlideInput() {
        if (this.player.state === 'run') {
            this.player.state = 'slide';
            this.player.isSliding = true;
            this.player.slideTimer = 0.5;
        } else if (this.player.state === 'jump') {
        }

        this._checkJudgement('slide');
    }

    _endSlide() {
        if (this.player.state === 'slide') {
            this.player.state = 'run';
            this.player.isSliding = false;
        }
    }

    _checkJudgement(inputType) {
        const beatTime = this.audio.getBeatTime();
        const perfectWindow = 0.08;
        const goodWindow = 0.15;

        for (const obs of this.obstacles) {
            if (obs.judged && (obs.type !== 'double' || obs.secondJudged)) continue;

            const timeDiff = Math.abs(obs.beat - beatTime);
            if (timeDiff > 0.3) continue;

            if (obs.type === 'low' && inputType === 'jump') {
                this._doJudgement(obs, timeDiff, perfectWindow, goodWindow);
                obs.judged = true;
                return;
            } else if (obs.type === 'pit' && inputType === 'slide') {
                this._doJudgement(obs, timeDiff, perfectWindow, goodWindow);
                obs.judged = true;
                return;
            } else if (obs.type === 'double') {
                if (!obs.judged && inputType === 'jump') {
                    this._doJudgement(obs, timeDiff, perfectWindow, goodWindow);
                    obs.judged = true;
                    return;
                } else if (obs.judged && !obs.secondJudged && inputType === 'slide') {
                    const secondBeat = obs.beat + 1;
                    const secondTimeDiff = Math.abs(secondBeat - beatTime);
                    if (secondTimeDiff < 0.3) {
                        this._doJudgement(obs, secondTimeDiff, perfectWindow, goodWindow, true);
                        obs.secondJudged = true;
                        return;
                    }
                }
            }
        }
    }

    _doJudgement(obs, timeDiff, perfectWindow, goodWindow, isSecond = false) {
        let judgement = 'miss';
        let points = 0;

        if (timeDiff <= perfectWindow) {
            judgement = 'perfect';
            points = 100;
        } else if (timeDiff <= goodWindow) {
            judgement = 'good';
            points = 50;
        } else {
            judgement = 'miss';
            points = 0;
        }

        if (judgement === 'perfect') {
            this.perfectCount++;
            this.combo++;
            this.score += points * (1 + Math.floor(this.combo / 50) * 0.1);
        } else if (judgement === 'good') {
            this.goodCount++;
            this.combo++;
            this.score += points * (1 + Math.floor(this.combo / 50) * 0.1);
        } else {
            this.missCount++;
            this.combo = 0;
            this.screenShake = 5;
        }

        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        this.score = Math.floor(this.score);

        this._addJudgeEffect(this.judgeX, this.player.y - 30, judgement);

        if (this.onScoreUpdate) {
            this.onScoreUpdate(this.score);
        }
        if (this.onComboUpdate) {
            this.onComboUpdate(this.combo);
        }
        if (this.onJudgement) {
            this.onJudgement(judgement);
        }

        if (this.combo > 0 && this.combo % 50 === 0 && judgement !== 'miss') {
            this._spawnCelebrationParticles();
        }
    }

    _checkMissedObstacles(beatTime) {
        for (const obs of this.obstacles) {
            if (obs.judged && (obs.type !== 'double' || obs.secondJudged)) continue;
            if (obs.beat < beatTime - 0.15) {
                if (!obs.judged) {
                    this.missCount++;
                    this.combo = 0;
                    obs.judged = true;
                    this.screenShake = 5;

                    if (this.onComboUpdate) {
                        this.onComboUpdate(0);
                    }
                    if (this.onJudgement) {
                        this.onJudgement('miss');
                    }
                } else if (obs.type === 'double' && !obs.secondJudged) {
                    const secondBeat = obs.beat + 1;
                    if (secondBeat < beatTime - 0.15) {
                        this.missCount++;
                        this.combo = 0;
                        obs.secondJudged = true;
                        this.screenShake = 5;

                        if (this.onComboUpdate) {
                            this.onComboUpdate(0);
                        }
                        if (this.onJudgement) {
                            this.onJudgement('miss');
                        }
                    }
                }
            }
        }
    }

    _addJudgeEffect(x, y, type) {
        let color;
        if (type === 'perfect') color = '#ffdd00';
        else if (type === 'good') color = '#4a9eff';
        else color = '#ff6b6b';

        this.judgeEffects.push({
            x: x,
            y: y,
            radius: 20,
            maxRadius: 60,
            life: 0.5,
            maxLife: 0.5,
            color: color
        });

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 0.5,
                color: color,
                size: 4
            });
        }
    }

    _spawnCelebrationParticles() {
        const colors = ['#ffdd00', '#ff6b6b', '#4ecdc4', '#a855f7'];
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: this.width / 2,
                y: this.height / 3,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 3,
                life: 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 4
            });
        }
    }

    _endGame() {
        this.stop();
        localStorage.removeItem('rhythm_run_game_state');
        if (this.onGameEnd) {
            this.onGameEnd({
                score: this.score,
                maxCombo: this.maxCombo,
                perfectCount: this.perfectCount,
                goodCount: this.goodCount,
                missCount: this.missCount
            });
        }
    }

    saveState() {
        if (this.gameState !== 'playing') return;

        const state = {
            songId: this.currentSong.id,
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            perfectCount: this.perfectCount,
            goodCount: this.goodCount,
            missCount: this.missCount,
            currentBeat: this.audio.getBeatTime(),
            playerState: this.player.state,
            playerY: this.player.y,
            playerVelocityY: this.player.velocityY,
            playerIsJumping: this.player.isJumping,
            playerIsSliding: this.player.isSliding,
            playerSlideTimer: this.player.slideTimer || 0,
            obstacles: this.obstacles.map(obs => ({
                beat: obs.beat,
                type: obs.type,
                hit: obs.hit,
                judged: obs.judged,
                secondJudged: obs.secondJudged || false
            })),
            backgroundOffsets: {
                far: this.backgroundLayers.far.offset,
                mid: this.backgroundLayers.mid.offset,
                near: this.backgroundLayers.near.offset
            },
            timestamp: Date.now()
        };

        localStorage.setItem('rhythm_run_game_state', JSON.stringify(state));
    }

    restoreState(state) {
        if (!state || !state.songId) return false;

        const song = { id: state.songId };
        const songData = this._findSongData(state.songId);
        if (!songData) return false;

        this.currentSong = songData;
        this.audio.setBpm(songData.bpm);
        this.audio.setDuration(180);
        this._generateObstacles(songData);

        this.score = state.score;
        this.combo = state.combo;
        this.maxCombo = state.maxCombo;
        this.perfectCount = state.perfectCount;
        this.goodCount = state.goodCount;
        this.missCount = state.missCount;

        this.player.state = 'run';
        this.player.y = this.groundY;
        this.player.velocityY = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.slideTimer = 0;

        if (state.obstacles) {
            for (let i = 0; i < this.obstacles.length && i < state.obstacles.length; i++) {
                this.obstacles[i].judged = state.obstacles[i].judged;
                this.obstacles[i].hit = state.obstacles[i].hit;
                if (state.obstacles[i].secondJudged !== undefined) {
                    this.obstacles[i].secondJudged = state.obstacles[i].secondJudged;
                }
            }
        }

        if (state.backgroundOffsets) {
            this.backgroundLayers.far.offset = state.backgroundOffsets.far;
            this.backgroundLayers.mid.offset = state.backgroundOffsets.mid;
            this.backgroundLayers.near.offset = state.backgroundOffsets.near;
        }

        this.gameState = 'playing';
        this.screenShake = 0;
        this.particles = [];
        this.judgeEffects = [];
        this.autoSaveTimer = 0;

        this.audio.startFromBeat(state.currentBeat || 0);

        const pixelsPerBeat = 100;
        const beatTime = this.audio.getBeatTime();
        this._updateObstacles(beatTime, pixelsPerBeat);
        this._render();

        this.lastTime = performance.now();
        this._gameLoop();

        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (this.onComboUpdate) this.onComboUpdate(this.combo);
        if (this.onProgressUpdate) this.onProgressUpdate(this.audio.getProgress());

        return true;
    }

    _findSongData(songId) {
        const songs = [
            { id: 'song1', name: '夜色初章', bpm: 100, difficulty: 'Easy', difficultyLabel: '简单' },
            { id: 'song2', name: '霓虹狂奔', bpm: 130, difficulty: 'Normal', difficultyLabel: '普通' },
            { id: 'song3', name: '极速都市', bpm: 160, difficulty: 'Hard', difficultyLabel: '困难' }
        ];
        return songs.find(s => s.id === songId);
    }

    _render() {
        const ctx = this.ctx;
        ctx.save();

        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        ctx.fillStyle = '#050515';
        ctx.fillRect(0, 0, this.width, this.height);

        this._drawSky();
        this._drawFarBackground();
        this._drawMidBackground();
        this._drawGround();
        this._drawNearBackground();
        this._drawObstacles();
        this._drawJudgeLine();
        this._drawPlayer();
        this._drawParticles();
        this._drawJudgeEffects();

        ctx.restore();
    }

    _drawSky() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(0.6, '#151540');
        gradient.addColorStop(1, '#1a1a50');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + this.backgroundLayers.far.offset * 0.1) % this.width;
            const y = (i * 37) % (this.groundY - 100);
            const size = (i % 3) * 0.5 + 0.5;
            ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
            ctx.fillRect(x, y, size, size);
        }
        ctx.globalAlpha = 1;
    }

    _drawFarBackground() {
        const ctx = this.ctx;
        const layer = this.backgroundLayers.far;

        for (let i = 0; i < 2; i++) {
            const offsetX = layer.offset + i * 15 * 80;
            for (const b of layer.buildings) {
                const x = offsetX + b.x;
                const y = this.groundY - b.height;

                ctx.fillStyle = '#1a1a4a';
                ctx.fillRect(x, y, b.width, b.height);

                ctx.fillStyle = '#4a9eff';
                ctx.globalAlpha = 0.3;
                for (let wy = y + 10; wy < this.groundY - 10; wy += 15) {
                    for (let wx = x + 8; wx < x + b.width - 8; wx += 12) {
                        if (Math.random() > 0.3) {
                            ctx.fillRect(wx, wy, 4, 6);
                        }
                    }
                }
                ctx.globalAlpha = 1;
            }
        }
    }

    _drawMidBackground() {
        const ctx = this.ctx;
        const layer = this.backgroundLayers.mid;

        for (let i = 0; i < 2; i++) {
            const offsetX = layer.offset + i * 12 * 100;
            for (const b of layer.buildings) {
                const x = offsetX + b.x;
                const y = this.groundY - b.height;

                ctx.fillStyle = '#252555';
                ctx.fillRect(x, y, b.width, b.height);

                ctx.fillStyle = '#7a5aff';
                ctx.globalAlpha = 0.4;
                for (let wy = y + 12; wy < this.groundY - 12; wy += 18) {
                    for (let wx = x + 10; wx < x + b.width - 10; wx += 15) {
                        if (Math.random() > 0.4) {
                            ctx.fillRect(wx, wy, 5, 8);
                        }
                    }
                }
                ctx.globalAlpha = 1;

                ctx.shadowColor = '#7a5aff';
                ctx.shadowBlur = 5;
                ctx.strokeStyle = 'rgba(122, 90, 255, 0.3)';
                ctx.strokeRect(x, y, b.width, b.height);
                ctx.shadowBlur = 0;
            }
        }
    }

    _drawGround() {
        const ctx = this.ctx;

        const groundGradient = ctx.createLinearGradient(0, this.groundY, 0, this.height);
        groundGradient.addColorStop(0, '#2a2a4a');
        groundGradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);

        ctx.strokeStyle = '#4a4a7a';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        const dashOffset = -this.backgroundLayers.near.offset % 40;
        ctx.lineDashOffset = dashOffset;
        ctx.moveTo(0, this.groundY + 30);
        ctx.lineTo(this.width, this.groundY + 30);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.strokeStyle = '#3a3a6a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.width, this.groundY);
        ctx.stroke();
    }

    _drawNearBackground() {
        const ctx = this.ctx;
        const layer = this.backgroundLayers.near;

        for (let i = 0; i < 2; i++) {
            const offsetX = layer.offset + i * 10 * 120;
            for (const obj of layer.objects) {
                const x = offsetX + obj.x;

                if (obj.type === 'lamp') {
                    ctx.fillStyle = '#3a3a6a';
                    ctx.fillRect(x, this.groundY - 80, 6, 80);

                    ctx.fillStyle = '#ffdd88';
                    ctx.shadowColor = '#ffdd88';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(x + 3, this.groundY - 85, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;

                    const lightGradient = ctx.createRadialGradient(x + 3, this.groundY - 85, 0, x + 3, this.groundY - 85, 60);
                    lightGradient.addColorStop(0, 'rgba(255, 221, 136, 0.2)');
                    lightGradient.addColorStop(1, 'rgba(255, 221, 136, 0)');
                    ctx.fillStyle = lightGradient;
                    ctx.beginPath();
                    ctx.arc(x + 3, this.groundY - 85, 60, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#4a4a7a';
                    ctx.fillRect(x, this.groundY - 25, 4, 25);
                    ctx.fillRect(x - 5, this.groundY - 25, 14, 3);
                }
            }
        }
    }

    _drawJudgeLine() {
        const ctx = this.ctx;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.judgeX, 0);
        ctx.lineTo(this.judgeX, this.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const gradient = ctx.createLinearGradient(this.judgeX - 30, 0, this.judgeX + 30, 0);
        gradient.addColorStop(0, 'rgba(74, 158, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(74, 158, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(74, 158, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.judgeX - 30, 0, 60, this.height);
    }

    _drawObstacles() {
        const ctx = this.ctx;

        for (const obs of this.obstacles) {
            if (obs.x < -100 || obs.x > this.width + 100) continue;

            if (obs.type === 'low') {
                this._drawLowObstacle(obs);
            } else if (obs.type === 'pit') {
                this._drawPitObstacle(obs);
            } else if (obs.type === 'double') {
                this._drawDoubleObstacle(obs);
            }
        }
    }

    _drawLowObstacle(obs) {
        const ctx = this.ctx;
        const w = 40;
        const h = 40;
        const x = obs.x - w / 2;
        const y = this.groundY - h;

        ctx.fillStyle = '#ff8c42';
        ctx.shadowColor = '#ff8c42';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffaa66';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + 5, y + 5, w - 10, 5);
    }

    _drawPitObstacle(obs) {
        const ctx = this.ctx;
        const w = 50;
        const h = 25;
        const x = obs.x - w / 2;
        const y = this.groundY - h;

        ctx.fillStyle = '#ff4444';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x, this.groundY);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, this.groundY);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x + 10, this.groundY - 5);
        ctx.lineTo(x + w / 2, y + 5);
        ctx.lineTo(x + w / 2, y + 12);
        ctx.lineTo(x + 15, this.groundY - 5);
        ctx.closePath();
        ctx.fill();
    }

    _drawDoubleObstacle(obs) {
        const ctx = this.ctx;
        const pixelsPerBeat = 100;

        const w1 = 35;
        const h1 = 35;
        const x1 = obs.x - w1 / 2;
        const y1 = this.groundY - h1;

        ctx.fillStyle = '#ff8c42';
        ctx.shadowColor = '#ff8c42';
        ctx.shadowBlur = 8;
        ctx.fillRect(x1, y1, w1, h1);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffaa66';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1 + 1, y1 + 1, w1 - 2, h1 - 2);

        const w2 = 35;
        const h2 = 65;
        const x2 = obs.x + pixelsPerBeat - w2 / 2;
        const y2 = this.groundY - h2;

        ctx.fillStyle = '#aa55ff';
        ctx.shadowColor = '#aa55ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(x2, y2, w2, h2);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#cc88ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x2 + 1, y2 + 1, w2 - 2, h2 - 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↑', x1 + w1 / 2, y1 - 5);
        ctx.fillText('↓', x2 + w2 / 2, y2 - 5);
    }

    _drawPlayer() {
        const ctx = this.ctx;
        const p = this.player;

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.state === 'run') {
            this._drawPlayerRun();
        } else if (p.state === 'jump') {
            this._drawPlayerJump();
        } else if (p.state === 'slide') {
            this._drawPlayerSlide();
        }

        ctx.restore();
    }

    _drawPlayerRun() {
        const ctx = this.ctx;
        const frame = this.player.animFrame;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 5;

        ctx.beginPath();
        ctx.arc(0, -42, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(-6, -32, 12, 20);

        const legAngles = [
            -0.6, -0.3, 0, 0.3, 0.6, 0.3
        ];
        const legAngle = legAngles[frame];

        ctx.save();
        ctx.translate(-4, -12);
        ctx.rotate(legAngle);
        ctx.fillRect(-3, 0, 6, 14);
        ctx.restore();

        ctx.save();
        ctx.translate(4, -12);
        ctx.rotate(-legAngle);
        ctx.fillRect(-3, 0, 6, 14);
        ctx.restore();

        const armAngle = legAngle * 0.7;
        ctx.save();
        ctx.translate(-5, -28);
        ctx.rotate(-armAngle);
        ctx.fillRect(-2, 0, 4, 12);
        ctx.restore();

        ctx.save();
        ctx.translate(5, -28);
        ctx.rotate(armAngle);
        ctx.fillRect(-2, 0, 4, 12);
        ctx.restore();

        ctx.shadowBlur = 0;
    }

    _drawPlayerJump() {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.arc(0, -42, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(0, -35);
        ctx.rotate(0.2);
        ctx.fillRect(-6, -10, 12, 18);
        ctx.restore();

        ctx.save();
        ctx.translate(-5, -22);
        ctx.rotate(-0.8);
        ctx.fillRect(-3, 0, 6, 12);
        ctx.restore();

        ctx.save();
        ctx.translate(5, -22);
        ctx.rotate(0.8);
        ctx.fillRect(-3, 0, 6, 12);
        ctx.restore();

        ctx.save();
        ctx.translate(-4, -18);
        ctx.rotate(0.6);
        ctx.fillRect(-3, 0, 6, 10);
        ctx.restore();

        ctx.save();
        ctx.translate(4, -18);
        ctx.rotate(-0.6);
        ctx.fillRect(-3, 0, 6, 10);
        ctx.restore();

        ctx.shadowBlur = 0;
    }

    _drawPlayerSlide() {
        const ctx = this.ctx;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 8;

        ctx.save();
        ctx.translate(5, -15);
        ctx.rotate(-0.3);

        ctx.beginPath();
        ctx.arc(-5, -8, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillRect(-12, -5, 25, 10);

        ctx.fillRect(-15, 2, 12, 6);

        ctx.fillRect(-8, -15, 4, 12);
        ctx.fillRect(2, -15, 4, 12);

        ctx.restore();

        ctx.shadowBlur = 0;
    }

    _drawParticles() {
        const ctx = this.ctx;

        for (const p of this.particles) {
            const alpha = p.life / 1.5;
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 5;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    _drawJudgeEffects() {
        const ctx = this.ctx;

        for (const effect of this.judgeEffects) {
            const alpha = effect.life / effect.maxLife;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = effect.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    getStats() {
        return {
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            perfectCount: this.perfectCount,
            goodCount: this.goodCount,
            missCount: this.missCount
        };
    }
}
