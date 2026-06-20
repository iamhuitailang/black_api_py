class SkateGameEngine {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.callbacks = callbacks;

        this.W = canvas.width;
        this.H = canvas.height;

        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.animationId = null;

        this.LANE_COUNT = 3;
        this.LANE_WIDTH = this.W / this.LANE_COUNT;
        this.GROUND_Y = this.H * 0.72;

        this.reset();
        this.bindInput();
    }

    reset() {
        this.player = {
            lane: 1,
            x: this.LANE_WIDTH * 1 + this.LANE_WIDTH / 2,
            targetLane: 1,
            y: 0,
            vy: 0,
            speed: 40,
            leanLeft: false,
            leanRight: false,
            crouched: false,
            isJumping: false,
            jumpPhase: 'ground',
            isFlipping: false,
            flipAngle: 0,
            flipStartY: 0,
            isGrabbing: false,
            grabTimer: 0,
            isOnRail: false,
            railTimer: 0,
            currentRail: null,
            crashed: false,
            crashTimer: 0,
            wheelRotation: 0
        };

        this.state = {
            position: 0,
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
            completed: false
        };

        this.trackData = null;
        this.terrain = [];
        this.obstacles = [];
        this.rails = [];
        this.trackLength = 5000;
        this.crashTimeoutId = null;

        this.currentTerrainType = 'flat';
        this.currentCurveDirection = null;
        this.overtakenSkaters = new Set();

        this.visualEffects = {
            speedLines: [],
            particles: [],
            dustTrails: []
        };

        this.backgroundOffset = 0;
    }

    loadTrack(trackData) {
        this.trackData = trackData;
        this.trackLength = trackData.length;
        this.terrain = trackData.terrain_data || [];
        this.obstacles = trackData.obstacle_data || [];
        this.rails = trackData.rail_data || [];
    }

    getSnapshot() {
        return {
            player: {
                lane: this.player.lane,
                targetLane: this.player.targetLane,
                y: this.player.y,
                vy: this.player.vy,
                speed: this.player.speed,
                crouched: this.player.crouched,
                leanLeft: this.player.leanLeft,
                leanRight: this.player.leanRight,
                isJumping: this.player.isJumping,
                jumpPhase: this.player.jumpPhase,
                isFlipping: this.player.isFlipping,
                flipAngle: this.player.flipAngle,
                isGrabbing: this.player.isGrabbing,
                grabTimer: this.player.grabTimer,
                isOnRail: this.player.isOnRail,
                railTimer: this.player.railTimer,
                crashed: this.player.crashed,
                crashTimer: this.player.crashTimer,
                wheelRotation: this.player.wheelRotation,
                x: this.player.x
            },
            state: { ...this.state },
            trackId: this.trackData ? this.trackData.id : null,
            overtakenSkaters: Array.from(this.overtakenSkaters),
            backgroundOffset: this.backgroundOffset,
            savedAt: Date.now()
        };
    }

    restoreFromSnapshot(snap) {
        if (!snap || !snap.player || !snap.state) return false;
        const p = snap.player;
        Object.assign(this.player, {
            lane: p.lane,
            targetLane: p.targetLane,
            y: p.y,
            vy: p.vy,
            speed: p.speed,
            crouched: !!p.crouched,
            leanLeft: !!p.leanLeft,
            leanRight: !!p.leanRight,
            isJumping: !!p.isJumping,
            jumpPhase: p.jumpPhase || 'ground',
            isFlipping: !!p.isFlipping,
            flipAngle: p.flipAngle || 0,
            isGrabbing: !!p.isGrabbing,
            grabTimer: p.grabTimer || 0,
            isOnRail: !!p.isOnRail,
            railTimer: p.railTimer || 0,
            crashed: false,
            crashTimer: 0,
            wheelRotation: p.wheelRotation || 0,
            x: p.x != null ? p.x : (this.LANE_WIDTH * p.lane + this.LANE_WIDTH / 2),
            currentRail: null,
            flipStartY: 0
        });
        Object.assign(this.state, snap.state);
        this.state.crashed = false;
        this.state.paused = false;

        if (Array.isArray(snap.overtakenSkaters)) {
            this.overtakenSkaters = new Set(snap.overtakenSkaters);
        }
        if (typeof snap.backgroundOffset === 'number') {
            this.backgroundOffset = snap.backgroundOffset;
        }
        this.crashTimeoutId = null;

        if (this.player.isOnRail) {
            for (const rail of this.rails) {
                if (this.state.position >= rail.start && this.state.position <= rail.end
                    && this.player.lane === rail.lane) {
                    this.player.currentRail = rail;
                    break;
                }
            }
            if (!this.player.currentRail) {
                this.player.isOnRail = false;
                this.player.y = 0;
            }
        }

        return true;
    }

    bindInput() {
        this.keyState = {};
        this.keyTimers = {};

        window.addEventListener('keydown', (e) => {
            if (!this.running) return;

            if (e.key === 'Escape') {
                this.togglePause();
                return;
            }

            if (this.paused || this.player.crashed) return;

            this.keyState[e.key.toLowerCase()] = true;
            this.keyState[e.code] = true;

            this.handleKeyPress(e);
        });

        window.addEventListener('keyup', (e) => {
            this.keyState[e.key.toLowerCase()] = false;
            this.keyState[e.code] = false;
            this.handleKeyRelease(e);
        });
    }

    handleKeyPress(e) {
        const key = e.key.toLowerCase();
        const now = performance.now();

        if (key === ' ' || key === 'arrowup' || key === 'arrowdown' ||
            key === 'arrowleft' || key === 'arrowright') {
            e.preventDefault();
        }

        if ((key === 'arrowleft' || key === 'a') && !this.player.isOnRail) {
            if (this.player.targetLane > 0) {
                this.player.targetLane--;
            }
        }
        if ((key === 'arrowright' || key === 'd') && !this.player.isOnRail) {
            if (this.player.targetLane < this.LANE_COUNT - 1) {
                this.player.targetLane++;
            }
        }

        if ((key === ' ' || key === 'w' || key === 'arrowup') && !this.player.isJumping) {
            this.startJump();
        }

        if (key === 's' || key === 'arrowdown') {
            e.preventDefault();
            this.player.crouched = true;
        }

        if (key === 'q') {
            this.player.leanLeft = true;
        }
        if (key === 'e') {
            this.player.leanRight = true;
        }

        if (key === 'f') {
            this.tryFlip();
        }

        if (key === 'g') {
            this.tryGrab();
        }

        if (key === 'r') {
            this.tryRailGrind();
        }
    }

    handleKeyRelease(e) {
        const key = e.key.toLowerCase();

        if (key === 's' || key === 'arrowdown') {
            this.player.crouched = false;
        }
        if (key === 'q') {
            this.player.leanLeft = false;
        }
        if (key === 'e') {
            this.player.leanRight = false;
        }
    }

    startJump() {
        this.player.isJumping = true;
        this.player.vy = -550;
        this.player.flipStartY = 0;
        this.jumpPhase = 'rising';
    }

    tryFlip() {
        if (this.player.crashed || this.paused) return;

        if (!this.player.isJumping) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '请先按空格跳跃！');
            }
            return;
        }
        if (this.player.isFlipping) return;
        if (this.player.isOnRail) return;

        if (this.player.y > -15) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '空翻时机太早！');
            }
            return;
        }

        const now = performance.now();
        if (this.keyTimers.lastFlip && now - this.keyTimers.lastFlip < 600) return;
        this.keyTimers.lastFlip = now;

        this.player.isFlipping = true;
        this.player.flipAngle = 0;
        this.flipStartTime = now;

        setTimeout(() => {
            if (this.running && this.player.flipAngle >= 270) {
                this.trickSuccess('完美空翻！+100', 100);
            } else if (this.running) {
                this.trickFail('空翻未完成！-50');
            }
            this.player.isFlipping = false;
            this.player.flipAngle = 0;
        }, 600);
    }

    tryGrab() {
        if (this.player.crashed || this.paused) return;

        if (!this.player.isJumping) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '请先按空格跳跃！');
            }
            return;
        }
        if (this.player.isGrabbing) return;
        if (this.player.isOnRail) return;
        if (this.player.isFlipping) return;

        if (this.player.y > -30) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '抓板时机不对！');
            }
            return;
        }

        this.player.isGrabbing = true;
        this.player.grabTimer = 0;
    }

    tryRailGrind() {
        if (this.player.crashed || this.paused) return;

        if (this.player.isOnRail) return;
        if (this.player.isJumping) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '请落地后再尝试！');
            }
            return;
        }

        const pos = this.state.position;
        let onRail = null;

        for (const rail of this.rails) {
            if (pos >= rail.start - 120 && pos <= rail.end + 60) {
                if (this.player.lane === rail.lane) {
                    if (pos >= rail.start - 80 && pos <= rail.start + 80) {
                        onRail = rail;
                        break;
                    }
                }
            }
        }

        if (!onRail) {
            if (this.callbacks.onTrickFeedback) {
                this.callbacks.onTrickFeedback('fail', '附近没有栏杆！');
            }
            return;
        }

        this.player.isOnRail = true;
        this.player.currentRail = onRail;
        this.player.railTimer = 0;
        this.player.isJumping = false;
        this.player.y = -onRail.height;
        this.player.vy = 0;
    }

    trickSuccess(message, points) {
        this.state.trickScore += points;
        this.state.score += points;
        const effectY = this.GROUND_Y + 20 + this.player.y * 0.3 - 40;
        this.spawnParticles(this.player.x, effectY, '#ffd700', 20);
        if (this.callbacks.onTrickFeedback) {
            this.callbacks.onTrickFeedback('success', message);
        }
    }

    trickFail(message) {
        this.state.score = Math.max(0, this.state.score - 50);
        const effectY = this.GROUND_Y + 20 + this.player.y * 0.3 - 40;
        this.spawnParticles(this.player.x, effectY, '#ff4d4f', 15);
        if (this.callbacks.onTrickFeedback) {
            this.callbacks.onTrickFeedback('fail', message);
        }
    }

    overtakeSkater(obstacleId) {
        if (this.overtakenSkaters.has(obstacleId)) return;
        this.overtakenSkaters.add(obstacleId);
        this.state.score += 50;
        const effectY = this.GROUND_Y + 20 + this.player.y * 0.3 - 40;
        this.spawnParticles(this.player.x, effectY, '#4facfe', 15);
        if (this.callbacks.onTrickFeedback) {
            this.callbacks.onTrickFeedback('overtake', '超越！+50');
        }
    }

    crash(reason = '') {
        if (this.player.crashed) return;
        this.player.crashed = true;
        this.player.crashTimer = 0;
        this.state.crashed = true;
        this.state.crashCount++;
        this.state.score = Math.max(0, this.state.score - 100);
        this.player.speed = 0;
        this.player.isJumping = false;
        this.player.isFlipping = false;
        this.player.isGrabbing = false;
        this.player.isOnRail = false;
        this.player.vy = 0;
        this.player.y = 0;
        this.spawnParticles(this.player.x, this.GROUND_Y - 30, '#ff0000', 30);

        if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate({ ...this.state });
        }

        this.crashTimeoutId = setTimeout(() => {
            this.crashTimeoutId = null;
            const wasCrashed = this.player.crashed;
            this.player.crashed = false;
            this.state.crashed = false;
            if (wasCrashed) {
                this.player.speed = this.getTerrainSpeed();
            }
            if (this.callbacks.onStateUpdate) {
                this.callbacks.onStateUpdate({ ...this.state });
            }
        }, 2000);
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.visualEffects.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.8) * 6,
                life: 1,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }

    getTerrainAt(position) {
        for (const seg of this.terrain) {
            if (position >= seg.start && position < seg.end) {
                return seg;
            }
        }
        return { type: 'flat', speed: 40 };
    }

    getTerrainSpeed() {
        const terrain = this.getTerrainAt(this.state.position);
        let speed = terrain.speed;

        if (terrain.type === 'uphill' && this.player.crouched) {
            speed = 40;
        }

        if (this.player.crouched && terrain.type === 'flat') {
            speed = 45;
        }

        return speed;
    }

    checkCurveSafety() {
        const terrain = this.getTerrainAt(this.state.position);
        if (terrain.type === 'curve') {
            const curveProgress = (this.state.position - terrain.start) / (terrain.end - terrain.start);
            if (curveProgress > 0.3 && curveProgress < 0.7) {
                if (terrain.direction === 'left' && !this.player.leanLeft) {
                    this.crash('弯道未向左倾斜');
                } else if (terrain.direction === 'right' && !this.player.leanRight) {
                    this.crash('弯道未向右倾斜');
                }
            }
        }
    }

    checkObstacleCollisions() {
        const pos = this.state.position;
        const checkRange = 120;

        for (const obs of this.obstacles) {
            const dist = obs.position - pos;
            if (Math.abs(dist) > checkRange) continue;

            if (Math.abs(dist) < 35) {
                if (obs.type === 'cone') {
                    if (obs.lane === this.player.lane) {
                        if (!this.player.isJumping && !this.player.isOnRail) {
                            this.crash('撞到路障');
                        }
                    }
                } else if (obs.type === 'pedestrian') {
                    if (obs.lane === this.player.lane) {
                        if (!this.player.isJumping) {
                            this.crash('撞到行人');
                        }
                    }
                } else if (obs.type === 'skater') {
                    if (obs.lane === this.player.lane) {
                        if (!this.player.isJumping && dist > -10 && dist < 30) {
                            this.crash('撞到其他滑板者');
                        }
                    } else if (dist <= 0 && dist > -40) {
                        this.overtakeSkater(obs.position + '_' + obs.lane);
                    }
                }
            }
        }
    }

    checkRailEnd() {
        if (this.player.isOnRail && this.player.currentRail) {
            const pos = this.state.position;
            const rail = this.player.currentRail;
            if (pos >= rail.end || this.player.lane !== rail.lane) {
                if (this.player.railTimer >= 1.0) {
                    this.trickSuccess('完美滑轨！+80', 80);
                } else if (this.player.railTimer >= 0.5) {
                    this.trickSuccess('滑轨完成！+80', 80);
                }
                this.player.isOnRail = false;
                this.player.currentRail = null;
                this.player.isJumping = true;
                this.player.vy = -6;
            }
        }
    }

    updateTrickAvailability() {
        this.state.canFlip = this.player.isJumping && !this.player.isFlipping && !this.player.isGrabbing;
        this.state.canGrab = this.player.isJumping && !this.player.isGrabbing && !this.player.isFlipping
                            && this.player.y < -20;

        this.state.canRail = false;
        if (!this.player.isOnRail && !this.player.isJumping) {
            const pos = this.state.position;
            for (const rail of this.rails) {
                if (pos >= rail.start - 120 && pos <= rail.start + 80 && this.player.lane === rail.lane) {
                    this.state.canRail = true;
                    break;
                }
            }
        }

        this.state.crashed = this.player.crashed;
        this.state.paused = this.paused;
    }

    update(dt) {
        if (this.paused) return;

        this.state.time += dt;

        if (this.state.position >= this.trackLength) {
            this.state.completed = true;
            this.stop();
            if (this.callbacks.onGameComplete) {
                this.callbacks.onGameComplete({
                    score: this.state.score,
                    trickScore: this.state.trickScore,
                    timeUsed: this.state.time,
                    crashCount: this.state.crashCount,
                    progress: 100,
                    completed: true
                });
            }
            return;
        }

        if (this.player.crashed) {
            this.player.crashTimer += dt;
            if (this.callbacks.onStateUpdate) {
                this.callbacks.onStateUpdate({ ...this.state });
            }
            this.updateVisualEffects(dt);
            return;
        }

        const targetSpeed = this.getTerrainSpeed();
        const terrain = this.getTerrainAt(this.state.position);
        this.currentTerrainType = terrain.type;
        this.currentCurveDirection = terrain.direction || null;

        const accel = this.player.isOnRail ? 2 : 8;
        this.player.speed += (targetSpeed - this.player.speed) * Math.min(1, dt * accel / 10);

        this.state.speed = Math.round(this.player.speed);
        this.state.position += this.player.speed * dt * 3;

        const laneTargetX = this.player.targetLane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
        this.player.x += (laneTargetX - this.player.x) * Math.min(1, dt * 12);
        const actualLane = Math.round((this.player.x - this.LANE_WIDTH / 2) / this.LANE_WIDTH);
        this.player.lane = Math.max(0, Math.min(this.LANE_COUNT - 1, actualLane));

        if (this.player.isJumping) {
            this.player.y += this.player.vy * dt;
            this.player.vy += 1200 * dt;

            if (this.player.jumpPhase === 'rising' && this.player.vy > 0) {
                this.player.jumpPhase = 'falling';
            }

            if (this.player.y >= 0) {
                this.player.y = 0;
                this.player.vy = 0;
                this.player.isJumping = false;
                this.player.isGrabbing = false;
                this.player.jumpPhase = 'ground';
                if (this.player.isFlipping) {
                    if (this.player.flipAngle >= 270) {
                        this.trickSuccess('平稳落地！+100', 100);
                    } else {
                        this.trickFail('空翻未完成落地！-50');
                    }
                    this.player.isFlipping = false;
                    this.player.flipAngle = 0;
                }
            }
        } else if (this.player.isOnRail) {
            this.player.y = -this.player.currentRail.height;
            this.player.railTimer += dt;
        } else {
            this.player.y = 0;
            this.player.jumpPhase = 'ground';
        }

        if (this.player.isFlipping) {
            this.player.flipAngle += 680 * dt;
        }

        if (this.player.isGrabbing) {
            this.player.grabTimer += dt;
            if (this.player.grabTimer > 0.35) {
                this.trickSuccess('抓板成功！+60', 60);
                this.player.isGrabbing = false;
            }
        }

        this.player.wheelRotation += this.player.speed * dt * 0.3;

        this.checkCurveSafety();
        this.checkObstacleCollisions();
        this.checkRailEnd();
        this.updateTrickAvailability();

        if (Math.random() < this.player.speed / 200) {
            this.visualEffects.speedLines.push({
                x: this.W,
                y: Math.random() * this.H,
                length: 20 + Math.random() * 40,
                speed: 5 + Math.random() * 10,
                alpha: 0.3 + Math.random() * 0.4
            });
        }

        if (this.player.speed > 30 && Math.random() < 0.3) {
            this.visualEffects.dustTrails.push({
                x: this.player.x - 30,
                y: this.GROUND_Y - 5,
                size: 4 + Math.random() * 4,
                life: 1,
                vx: -2 - Math.random() * 3
            });
        }

        this.updateVisualEffects(dt);
        this.backgroundOffset += this.player.speed * dt * 0.05;

        if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate({ ...this.state });
        }
    }

    updateVisualEffects(dt) {
        this.visualEffects.particles = this.visualEffects.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= dt * 2;
            return p.life > 0;
        });

        this.visualEffects.speedLines = this.visualEffects.speedLines.filter(l => {
            l.x -= l.speed * this.player.speed * dt * 0.5;
            return l.x > -l.length;
        });

        this.visualEffects.dustTrails = this.visualEffects.dustTrails.filter(d => {
            d.x += d.vx;
            d.life -= dt * 2;
            d.size += dt * 10;
            return d.life > 0;
        });
    }

    render() {
        const ctx = this.ctx;
        const pos = this.state.position;

        ctx.clearRect(0, 0, this.W, this.H);

        this.renderSky();
        this.renderMountains();
        this.renderBuildings();
        this.renderRoad();
        this.renderTerrainIndicators();
        this.renderRails(pos);
        this.renderObstacles(pos);
        this.renderDustTrails();
        this.renderPlayer();
        this.renderParticles();
        this.renderSpeedLines();
        this.renderHUD();
    }

    renderSky() {
        const ctx = this.ctx;
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.GROUND_Y);
        skyGrad.addColorStop(0, '#0a0a1a');
        skyGrad.addColorStop(0.5, '#1a1a3e');
        skyGrad.addColorStop(1, '#2d1f4e');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.W, this.GROUND_Y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 50; i++) {
            const sx = (i * 137 + this.backgroundOffset * 0.1) % this.W;
            const sy = (i * 53) % (this.GROUND_Y * 0.6);
            ctx.beginPath();
            ctx.arc(sx, sy, Math.random() + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        const moonX = this.W - 120;
        const moonY = 80;
        const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60);
        moonGrad.addColorStop(0, '#fffacd');
        moonGrad.addColorStop(0.5, 'rgba(255, 250, 205, 0.3)');
        moonGrad.addColorStop(1, 'rgba(255, 250, 205, 0)');
        ctx.fillStyle = moonGrad;
        ctx.fillRect(moonX - 60, moonY - 60, 120, 120);
        ctx.fillStyle = '#fffacd';
        ctx.beginPath();
        ctx.arc(moonX, moonY, 28, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMountains() {
        const ctx = this.ctx;
        const offset = (this.backgroundOffset * 0.1) % 400;

        ctx.fillStyle = '#1a1030';
        ctx.beginPath();
        ctx.moveTo(0, this.GROUND_Y);
        for (let x = -offset; x <= this.W + 400; x += 200) {
            ctx.lineTo(x + 50, this.GROUND_Y - 80 - (Math.sin(x * 0.01) * 30));
            ctx.lineTo(x + 100, this.GROUND_Y - 120);
            ctx.lineTo(x + 150, this.GROUND_Y - 70);
            ctx.lineTo(x + 200, this.GROUND_Y - 100);
        }
        ctx.lineTo(this.W, this.GROUND_Y);
        ctx.closePath();
        ctx.fill();

        const offset2 = (this.backgroundOffset * 0.2) % 300;
        ctx.fillStyle = '#221842';
        ctx.beginPath();
        ctx.moveTo(0, this.GROUND_Y);
        for (let x = -offset2; x <= this.W + 300; x += 150) {
            ctx.lineTo(x + 40, this.GROUND_Y - 50);
            ctx.lineTo(x + 80, this.GROUND_Y - 90);
            ctx.lineTo(x + 120, this.GROUND_Y - 40);
        }
        ctx.lineTo(this.W, this.GROUND_Y);
        ctx.closePath();
        ctx.fill();
    }

    renderBuildings() {
        const ctx = this.ctx;
        const offset = (this.backgroundOffset * 0.5) % 200;

        const buildings = [
            { w: 60, h: 150, color: '#1e1842' },
            { w: 80, h: 200, color: '#2a1f55' },
            { w: 50, h: 120, color: '#1a1338' },
            { w: 100, h: 260, color: '#251a4a' },
            { w: 70, h: 180, color: '#1e1842' },
            { w: 90, h: 220, color: '#2a1f55' },
            { w: 60, h: 140, color: '#1a1338' },
        ];

        let x = -offset;
        let bi = 0;
        while (x < this.W) {
            const b = buildings[bi % buildings.length];
            ctx.fillStyle = b.color;
            const y = this.GROUND_Y - b.h;
            ctx.fillRect(x, y, b.w, b.h);

            ctx.fillStyle = '#ffd700';
            for (let wy = y + 20; wy < this.GROUND_Y - 20; wy += 30) {
                for (let wx = x + 10; wx < x + b.w - 10; wx += 20) {
                    if (Math.random() > 0.3) {
                        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
                        ctx.fillRect(wx, wy, 8, 14);
                    }
                }
            }
            ctx.globalAlpha = 1;

            x += b.w + 20;
            bi++;
        }
    }

    renderRoad() {
        const ctx = this.ctx;

        const horizonY = this.GROUND_Y;
        const vanishX = this.W / 2;
        const vanishY = horizonY - 120;

        const roadGrad = ctx.createLinearGradient(0, vanishY, 0, this.H);
        roadGrad.addColorStop(0, '#1a1a2e');
        roadGrad.addColorStop(1, '#2d2d44');
        ctx.fillStyle = roadGrad;
        ctx.fillRect(0, horizonY, this.W, this.H - horizonY);

        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);

        for (let i = 1; i < this.LANE_COUNT; i++) {
            const laneX = this.LANE_WIDTH * i;
            const bottomX = laneX;
            const topX = vanishX + (laneX - this.W / 2) * 0.08;

            const dashOffset = (this.backgroundOffset * 2) % 60;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.setLineDash([30, 30]);
            ctx.lineDashOffset = -dashOffset;
            ctx.beginPath();
            ctx.moveTo(topX, vanishY);
            ctx.lineTo(bottomX, this.H);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(vanishX - (this.W / 2) * 0.08, vanishY);
        ctx.lineTo(0, this.H);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vanishX + (this.W / 2) * 0.08, vanishY);
        ctx.lineTo(this.W, this.H);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        const roadLinesOffset = (this.backgroundOffset * 3) % 80;
        for (let i = 0; i < 15; i++) {
            const t = (i * 80 - roadLinesOffset) / (this.H - vanishY);
            if (t < 0 || t > 1) continue;
            const y = vanishY + (this.H - vanishY) * t;
            const leftX = vanishX + (0 - this.W / 2) * 0.08 * t + 0 * (1 - t);
            const rightX = vanishX + (this.W - this.W / 2) * 0.08 * t + this.W * (1 - t);
            ctx.beginPath();
            ctx.moveTo(leftX, y);
            ctx.lineTo(rightX, y);
            ctx.stroke();
        }

        const terrain = this.getTerrainAt(this.state.position);
        let terrainIndicator = '';
        let terrainColor = '#52c41a';
        if (terrain.type === 'downhill') { terrainIndicator = '↘ 下坡加速中'; terrainColor = '#1890ff'; }
        else if (terrain.type === 'uphill') { terrainIndicator = '↗ 上坡减速'; terrainColor = '#fa8c16'; }
        else if (terrain.type === 'curve') {
            terrainIndicator = terrain.direction === 'left' ? '↰ 左弯道' : '↱ 右弯道';
            terrainColor = '#722ed1';
        }
        else { terrainIndicator = '→ 平路'; }

        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = terrainColor;
        ctx.fillText(terrainIndicator, 20, 30);

        if (terrain.type === 'curve') {
            const requiredLean = terrain.direction === 'left' ? 'Q 向左倾斜' : 'E 向右倾斜';
            const isSafe = terrain.direction === 'left' ? this.player.leanLeft : this.player.leanRight;
            ctx.fillStyle = isSafe ? '#52c41a' : '#ff4d4f';
            ctx.fillText(requiredLean, 20, 54);
        }
    }

    renderTerrainIndicators() {
    }

    getScreenX(lane, worldZ) {
        const perspective = 1 - worldZ * 0.0008;
        const baseX = lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
        const centerX = this.W / 2;
        return centerX + (baseX - centerX) * Math.max(0.1, perspective);
    }

    getScreenY(worldZ) {
        const perspective = 1 - worldZ * 0.0008;
        return this.GROUND_Y + (this.H - this.GROUND_Y) * (1 - Math.max(0.1, perspective));
    }

    renderObstacles(currentPos) {
        const ctx = this.ctx;
        const renderRange = 800;

        const sortedObs = this.obstacles
            .map(obs => ({ ...obs, relPos: obs.position - currentPos }))
            .filter(obs => obs.relPos > -50 && obs.relPos < renderRange)
            .sort((a, b) => b.relPos - a.relPos);

        for (const obs of sortedObs) {
            const worldZ = obs.relPos;
            const scale = Math.max(0.15, 1 - worldZ / renderRange);
            const x = this.getScreenX(obs.lane, worldZ);
            const y = this.GROUND_Y + 20;
            const size = 40 * scale;

            if (obs.type === 'cone') {
                this.drawCone(x, y, size, scale);
            } else if (obs.type === 'pedestrian') {
                this.drawPedestrian(x, y, size, scale);
            } else if (obs.type === 'skater') {
                this.drawOtherSkater(x, y, size, scale, obs.position);
            }
        }
    }

    drawCone(x, y, size, scale) {
        const ctx = this.ctx;
        const baseW = size;
        const h = size * 1.2;

        const grad = ctx.createLinearGradient(x - baseW / 2, y - h, x + baseW / 2, y);
        grad.addColorStop(0, '#ff6b35');
        grad.addColorStop(1, '#d63031');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x - baseW / 2, y);
        ctx.lineTo(x + baseW / 2, y);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(x - baseW * 0.3, y - h * 0.5, baseW * 0.6, h * 0.12);

        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(x - baseW * 0.6, y - 2 * scale, baseW * 1.2, 4 * scale);

        ctx.shadowColor = 'rgba(255, 107, 53, 0.5)';
        ctx.shadowBlur = 10 * scale;
        ctx.fillStyle = 'rgba(255, 107, 53, 0.3)';
        ctx.fillRect(x - baseW * 0.5, y - h, baseW, h);
        ctx.shadowBlur = 0;
    }

    drawPedestrian(x, y, size, scale) {
        const ctx = this.ctx;
        const walk = Math.sin(this.state.time * 4) * 3 * scale;

        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(x - size * 0.2, y - size * 1.4 + walk, size * 0.4, size * 0.8);

        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath();
        ctx.arc(x, y - size * 1.5 + walk, size * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(x - size * 0.2, y - size * 0.6 + walk, size * 0.15, size * 0.6);
        ctx.fillRect(x + size * 0.05, y - size * 0.6 - walk, size * 0.15, size * 0.6);

        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(x - size * 0.45, y - size * 1.2, size * 0.25, size * 0.5);
        ctx.fillRect(x + size * 0.2, y - size * 1.2, size * 0.25, size * 0.5);
    }

    drawOtherSkater(x, y, size, scale, obsId) {
        const ctx = this.ctx;
        const isOvertaken = this.overtakenSkaters.has(obsId + '_' + 0) ||
                            this.overtakenSkaters.has(obsId + '_' + 1) ||
                            this.overtakenSkaters.has(obsId + '_' + 2);

        ctx.fillStyle = isOvertaken ? '#888' : '#e84393';
        ctx.fillRect(x - size * 0.3, y - size * 0.1, size * 0.6, size * 0.1);

        for (let i = -1; i <= 1; i += 2) {
            ctx.fillStyle = '#2d2d2d';
            ctx.beginPath();
            ctx.arc(x + i * size * 0.2, y, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = isOvertaken ? '#555' : '#a29bfe';
        ctx.fillRect(x - size * 0.2, y - size * 1.0, size * 0.4, size * 0.7);

        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath();
        ctx.arc(x, y - size * 1.1, size * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, y - size * 1.2, size * 0.16, Math.PI, 0);
        ctx.fill();

        if (!isOvertaken) {
            ctx.fillStyle = '#e84393';
            ctx.font = `bold ${12 * scale}px sans-serif`;
            ctx.fillText('+50', x + size * 0.3, y - size * 1.2);
        }
    }

    renderRails(currentPos) {
        const ctx = this.ctx;
        const renderRange = 600;

        const visibleRails = this.rails
            .map(r => ({ ...r, relStart: r.start - currentPos, relEnd: r.end - currentPos }))
            .filter(r => r.relEnd > -50 && r.relStart < renderRange);

        for (const rail of visibleRails) {
            const h = rail.height;

            for (let z = Math.max(0, rail.relStart); z < Math.min(renderRange, rail.relEnd); z += 50) {
                const scale = Math.max(0.2, 1 - z / renderRange);
                const x = this.getScreenX(rail.lane, z);
                const y = this.GROUND_Y + 20;
                const w = 60 * scale;
                const rh = h * scale;

                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(x - w / 2, y - rh, w, 5 * scale);

                ctx.fillStyle = '#95a5a6';
                ctx.fillRect(x - w / 2, y - rh, w, 2 * scale);

                ctx.fillStyle = '#34495e';
                ctx.fillRect(x - w / 2 + 2 * scale, y - rh + 5 * scale, 4 * scale, rh);
                ctx.fillRect(x + w / 2 - 6 * scale, y - rh + 5 * scale, 4 * scale, rh);
            }
        }
    }

    renderPlayer() {
        const ctx = this.ctx;
        const p = this.player;
        const x = p.x;
        let jumpOffset = p.y * 0.3;
        if (p.isOnRail && p.currentRail) {
            jumpOffset = -p.currentRail.height * 0.3;
        }
        const baseY = this.GROUND_Y + 20 + jumpOffset;

        if (p.isJumping || p.isOnRail) {
            const shadowScale = Math.max(0.3, 1 - Math.abs(jumpOffset) / 80);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x, this.GROUND_Y + 25, 20 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(x, baseY - 80);

        if (p.isFlipping) {
            ctx.rotate(p.flipAngle * Math.PI / 180);
        } else {
            let leanAngle = 0;
            if (p.leanLeft) leanAngle = -0.3;
            if (p.leanRight) leanAngle = 0.3;
            if (p.crouched) leanAngle *= 0.5;
            ctx.rotate(leanAngle);
        }

        const scale = p.crouched && !p.isOnRail ? 0.85 : 1;
        ctx.scale(scale, p.crouched && !p.isOnRail ? 0.85 : 1);

        const grabOffset = p.isGrabbing ? 5 : 0;
        const crashShake = p.crashed ? (Math.random() - 0.5) * 10 : 0;
        ctx.translate(crashShake, crashShake);

        ctx.fillStyle = p.crashed ? '#888' : '#2d3436';
        ctx.fillRect(-22, 50, 44, 6);

        ctx.fillStyle = '#636e72';
        for (let i = -1; i <= 1; i += 2) {
            ctx.beginPath();
            ctx.arc(i * 14, 58, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        for (let i = -1; i <= 1; i += 2) {
            ctx.save();
            ctx.translate(i * 14, 58);
            ctx.rotate(p.wheelRotation * i);
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let a = 0; a < 4; a++) {
                ctx.moveTo(0, 0);
                const ang = a * Math.PI / 2;
                ctx.lineTo(Math.cos(ang) * 6, Math.sin(ang) * 6);
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        if (!p.isOnRail) {
            ctx.fillStyle = '#e17055';
            ctx.fillRect(-10, 30 + grabOffset, 8, 22);
            ctx.fillRect(2, 30 - grabOffset, 8, 22);

            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-12, 48, 12, 6);
            ctx.fillRect(0, 48, 12, 6);
        }

        const bodyColor = p.crashed ? '#999' : '#00b894';
        const grad = ctx.createLinearGradient(-15, -10, 15, 35);
        grad.addColorStop(0, bodyColor);
        grad.addColorStop(1, p.crashed ? '#666' : '#019875');
        ctx.fillStyle = grad;
        ctx.fillRect(-14, -5, 28, 40);

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-14, -5, 28, 40);

        ctx.fillStyle = '#ffe0bd';
        ctx.beginPath();
        ctx.arc(0, -20, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.crashed ? '#888' : '#e17055';
        ctx.beginPath();
        ctx.arc(0, -24, 14, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-14, -25, 28, 5);

        ctx.fillStyle = p.crashed ? '#2d3436' : '#fff';
        ctx.fillRect(-16, -32, 32, 10);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-16, -32, 32, 10);

        if (!p.crashed) {
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.arc(-5, -18, 2, 0, Math.PI * 2);
            ctx.arc(5, -18, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (p.speed > 50) {
                ctx.arc(0, -13, 4, 0, Math.PI);
            } else {
                ctx.moveTo(-4, -12);
                ctx.quadraticCurveTo(0, -14, 4, -12);
            }
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7, -22); ctx.lineTo(-3, -18);
            ctx.moveTo(-3, -22); ctx.lineTo(-7, -18);
            ctx.moveTo(3, -22); ctx.lineTo(7, -18);
            ctx.moveTo(7, -22); ctx.lineTo(3, -18);
            ctx.stroke();
        }

        if (p.isGrabbing) {
            ctx.fillStyle = '#ffe0bd';
            ctx.beginPath();
            ctx.arc(-22, 20, 7, 0, Math.PI * 2);
            ctx.arc(22, 20, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-14, 15);
            ctx.lineTo(-22, 20);
            ctx.moveTo(14, 15);
            ctx.lineTo(22, 20);
            ctx.stroke();
        } else {
            const armSwing = p.speed > 20 ? Math.sin(this.state.time * 10) * 8 : 0;
            ctx.fillStyle = '#ffe0bd';
            ctx.fillRect(-22, 0 + armSwing, 8, 22);
            ctx.fillRect(14, 0 - armSwing, 8, 22);
        }

        if (p.isFlipping) {
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.random() * 0.5})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 10, 50, p.flipAngle * Math.PI / 180,
                    (p.flipAngle + 120) * Math.PI / 180);
            ctx.stroke();
        }

        if (p.isOnRail) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-18 + i * 18, 56);
                ctx.lineTo(-12 + i * 18, 64);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    renderSpeedLines() {
        const ctx = this.ctx;
        for (const line of this.visualEffects.speedLines) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x - line.length, line.y);
            ctx.stroke();
        }
    }

    renderParticles() {
        const ctx = this.ctx;
        for (const p of this.visualEffects.particles) {
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderDustTrails() {
        const ctx = this.ctx;
        for (const d of this.visualEffects.dustTrails) {
            ctx.globalAlpha = d.life * 0.4;
            ctx.fillStyle = '#8B7355';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderHUD() {
        const ctx = this.ctx;

        if (this.currentTerrainType === 'uphill' && this.player.speed < 30) {
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = this.player.crouched ? '#52c41a' : '#fa8c16';
            ctx.fillText(this.player.crouched ? '蹬地加速中！' : '按住 S 蹬地加速！', 20, 80);
        }

        if (this.player.isOnRail) {
            const progress = Math.min(1, this.player.railTimer / 1.0);
            const barW = 200;
            const barX = this.W / 2 - barW / 2;
            const barY = this.H - 50;

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY, barW, 12);

            ctx.fillStyle = progress >= 1 ? '#52c41a' : '#faad14';
            ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, 8);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, 12);

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('滑轨进度', this.W / 2, barY - 6);
            ctx.textAlign = 'left';
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.crashTimeoutId) {
            clearTimeout(this.crashTimeoutId);
            this.crashTimeoutId = null;
        }
        this.player.crashed = false;
        this.state.crashed = false;
        if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate({ ...this.state });
        }
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
        }
    }

    loop() {
        if (!this.running) return;

        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;

        this.update(dt);
        this.render();

        this.animationId = requestAnimationFrame(() => this.loop());
    }
}
