class ClawGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GAME_STATE.IDLE;
        this.score = 0;
        this.time = GAME_CONFIG.INITIAL_TIME;
        this.dolls = [];
        this.caughtDolls = 0;
        this.collected = {
            bear: 0,
            rabbit: 0,
            dino: 0,
            octopus: 0,
            unicorn: 0
        };
        
        this.claw = {
            x: 0,
            y: 0,
            targetY: 0,
            width: 50,
            height: 30,
            angle: GAME_CONFIG.CLAW_OPEN_ANGLE,
            targetAngle: GAME_CONFIG.CLAW_OPEN_ANGLE,
            movingLeft: false,
            movingRight: false,
            movingDown: false,
            movingUp: false,
            isClosed: false,
            hasDoll: null,
            state: 'idle'
        };
        
        this.keys = {
            left: false,
            right: false,
            down: false,
            space: false
        };
        
        this.timers = {
            game: null,
            animation: null
        };
        
        this.exitZone = {
            x: 0,
            y: 0,
            width: 80,
            height: 60
        };
        
        this.effects = {
            stars: [],
            particles: []
        };
        
        this.lastTime = 0;
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.createLights();
        this.loadState();
        this.render();
    }
    
    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = wrapper.clientWidth * dpr;
        this.canvas.height = wrapper.clientHeight * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvasWidth = wrapper.clientWidth;
        this.canvasHeight = wrapper.clientHeight;
        
        this.claw.y = 30;
        this.claw.x = this.canvasWidth / 2;
        
        this.exitZone.x = this.canvasWidth - 90;
        this.exitZone.y = this.canvasHeight - 100;
        
        if (this.dolls.length === 0) {
            this.resetDolls();
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.setupTouchControls();
        
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-pause').addEventListener('click', () => this.pauseGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-play-again').addEventListener('click', () => this.restartGame());
    }
    
    setupTouchControls() {
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnDown = document.getElementById('btn-down');
        const btnGrab = document.getElementById('btn-grab');
        
        const addTouchEvents = (btn, keyName) => {
            const start = (e) => {
                e.preventDefault();
                this.keys[keyName] = true;
                btn.style.transform = 'scale(0.95)';
            };
            const end = (e) => {
                e.preventDefault();
                this.keys[keyName] = false;
                btn.style.transform = '';
            };
            
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };
        
        addTouchEvents(btnLeft, 'left');
        addTouchEvents(btnRight, 'right');
        addTouchEvents(btnDown, 'down');
        addTouchEvents(btnGrab, 'space');
    }
    
    handleKeyDown(e) {
        if (this.state !== GAME_STATE.PLAYING) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.keys.left = true;
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.keys.right = true;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.keys.down = true;
                break;
            case ' ':
                e.preventDefault();
                this.keys.space = true;
                break;
        }
    }
    
    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'ArrowDown':
                this.keys.down = false;
                break;
            case ' ':
                this.keys.space = false;
                break;
        }
    }
    
    createLights() {
        const lightsLayer = document.getElementById('lights-layer');
        lightsLayer.innerHTML = '';
        
        const lightCount = 12;
        for (let i = 0; i < lightCount; i++) {
            const light = document.createElement('div');
            light.className = 'light-bulb';
            light.style.color = LIGHT_COLORS[i % LIGHT_COLORS.length];
            light.style.animationDelay = `${i * 0.1}s`;
            lightsLayer.appendChild(light);
        }
    }
    
    startGame() {
        this.hideModal('start-modal');
        this.hideModal('end-modal');
        this.state = GAME_STATE.PLAYING;
        this.startTimer();
        this.saveState();
    }
    
    pauseGame() {
        if (this.state !== GAME_STATE.PLAYING) return;
        this.state = GAME_STATE.PAUSED;
        this.stopTimer();
        this.showModal('pause-modal');
        this.saveState();
    }
    
    resumeGame() {
        this.hideModal('pause-modal');
        this.state = GAME_STATE.PLAYING;
        this.startTimer();
    }
    
    restartGame() {
        this.hideModal('pause-modal');
        this.hideModal('end-modal');
        this.hideModal('start-modal');
        
        this.score = 0;
        this.time = GAME_CONFIG.INITIAL_TIME;
        this.caughtDolls = 0;
        this.collected = {
            bear: 0,
            rabbit: 0,
            dino: 0,
            octopus: 0,
            unicorn: 0
        };
        
        this.resetClaw();
        this.resetDolls();
        this.effects = { stars: [], particles: [] };
        
        this.state = GAME_STATE.PLAYING;
        this.startTimer();
        this.updateUI();
        this.saveState();
    }
    
    resetClaw() {
        this.claw.x = this.canvasWidth / 2;
        this.claw.y = 30;
        this.claw.targetY = 30;
        this.claw.angle = GAME_CONFIG.CLAW_OPEN_ANGLE;
        this.claw.targetAngle = GAME_CONFIG.CLAW_OPEN_ANGLE;
        this.claw.isClosed = false;
        this.claw.heldDoll = null;
        this.claw.state = 'idle';
        this.claw.animTimer = 0;
        this.claw.grabResult = null;
    }
    
    resetDolls() {
        this.dolls = generateDolls(GAME_CONFIG.TOTAL_DOLLS);
    }
    
    startTimer() {
        this.stopTimer();
        this.timers.game = setInterval(() => {
            if (this.state === GAME_STATE.PLAYING) {
                this.time -= 1;
                this.updateUI();
                this.saveState();
                
                if (this.time <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timers.game) {
            clearInterval(this.timers.game);
            this.timers.game = null;
        }
    }
    
    endGame() {
        this.state = GAME_STATE.ENDED;
        this.stopTimer();
        this.clearState();
        
        const win = this.caughtDolls >= GAME_CONFIG.TOTAL_DOLLS;
        document.getElementById('end-title').textContent = win ? '🎉 恭喜通关！' : '⏰ 游戏结束';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-dolls').textContent = this.caughtDolls;
        
        const endCollection = document.getElementById('end-collection');
        endCollection.innerHTML = '';
        for (const [type, count] of Object.entries(this.collected)) {
            if (count > 0) {
                const div = document.createElement('div');
                div.className = 'modal-doll';
                div.textContent = `${DOLL_TYPES[type].emoji} ${DOLL_TYPES[type].name} x${count}`;
                endCollection.appendChild(div);
            }
        }
        
        this.showModal('end-modal');
    }
    
    showModal(id) {
        document.getElementById(id).classList.remove('hidden');
    }
    
    hideModal(id) {
        document.getElementById(id).classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = Math.max(0, this.time);
        document.getElementById('dolls').textContent = `${this.caughtDolls}/${GAME_CONFIG.TOTAL_DOLLS}`;
        
        for (const [type, count] of Object.entries(this.collected)) {
            const el = document.getElementById(`${type}-count`);
            if (el) el.textContent = count;
        }
    }
    
    update(deltaTime) {
        if (this.state !== GAME_STATE.PLAYING) return;
        
        this.updateClaw(deltaTime);
        this.updateDolls(deltaTime);
        this.updateEffects(deltaTime);
        this.checkWinCondition();
    }
    
    updateClaw(deltaTime) {
        const claw = this.claw;
        
        claw.angle += (claw.targetAngle - claw.angle) * 0.15;
        
        if (claw.heldDoll) {
            claw.heldDoll.x = claw.x;
            claw.heldDoll.y = claw.y + 35;
        }
        
        switch(claw.state) {
            case 'idle':
                this.handleIdleState();
                break;
            case 'descending':
                this.handleDescendingState();
                break;
            case 'waiting_for_grab':
                this.handleWaitingState();
                break;
            case 'grabbing':
                this.handleGrabbingState(deltaTime);
                break;
            case 'ascending':
                this.handleAscendingState();
                break;
            case 'moving_to_exit':
                this.handleMovingToExitState();
                break;
            case 'releasing':
                this.handleReleasingState(deltaTime);
                break;
        }
    }
    
    handleIdleState() {
        const claw = this.claw;
        
        if (this.keys.left) {
            claw.x -= GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.max(claw.width / 2, claw.x);
        }
        if (this.keys.right) {
            claw.x += GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.min(this.canvasWidth - claw.width / 2, claw.x);
        }
        
        if (this.keys.down) {
            this.keys.down = false;
            claw.state = 'descending';
        }
    }
    
    handleDescendingState() {
        const claw = this.claw;
        const maxY = this.canvasHeight - 120;
        
        if (this.keys.left) {
            claw.x -= GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.max(claw.width / 2, claw.x);
        }
        if (this.keys.right) {
            claw.x += GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.min(this.canvasWidth - claw.width / 2, claw.x);
        }
        
        if (claw.y < maxY) {
            claw.y += GAME_CONFIG.CLAW_SPEED_Y;
            
            const hitDoll = this.checkClawCollision();
            if (hitDoll) {
                claw.state = 'waiting_for_grab';
                claw.nearbyDoll = hitDoll;
            }
        } else {
            claw.y = maxY;
            claw.state = 'waiting_for_grab';
            claw.nearbyDoll = this.checkClawCollision();
        }
    }
    
    handleWaitingState() {
        const claw = this.claw;
        
        if (this.keys.left) {
            claw.x -= GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.max(claw.width / 2, claw.x);
            claw.nearbyDoll = this.checkClawCollision();
        }
        if (this.keys.right) {
            claw.x += GAME_CONFIG.CLAW_SPEED_X;
            claw.x = Math.min(this.canvasWidth - claw.width / 2, claw.x);
            claw.nearbyDoll = this.checkClawCollision();
        }
        
        if (this.keys.space) {
            this.keys.space = false;
            claw.state = 'grabbing';
            claw.animTimer = 0;
            claw.targetAngle = GAME_CONFIG.CLAW_CLOSE_ANGLE;
            claw.isClosed = true;
        }
    }
    
    handleGrabbingState(deltaTime) {
        const claw = this.claw;
        claw.animTimer += deltaTime || 16;
        
        if (claw.animTimer > 300) {
            const nearbyDoll = claw.nearbyDoll;
            
            if (nearbyDoll && !nearbyDoll.caught && !nearbyDoll.falling) {
                if (Math.random() < GAME_CONFIG.DOLL_CATCH_PROBABILITY) {
                    nearbyDoll.heldByClaw = true;
                    claw.heldDoll = nearbyDoll;
                }
            }
            
            claw.state = 'ascending';
            claw.nearbyDoll = null;
        }
    }
    
    handleAscendingState() {
        const claw = this.claw;
        const topY = 30;
        
        if (claw.y > topY) {
            claw.y -= GAME_CONFIG.CLAW_SPEED_Y;
            
            if (claw.heldDoll && Math.random() < GAME_CONFIG.DOLL_DROP_PROBABILITY * 0.02) {
                this.dropHeldDoll();
            }
        } else {
            claw.y = topY;
            
            if (claw.heldDoll) {
                claw.state = 'moving_to_exit';
            } else {
                this.emptyGrabPenalty();
                claw.targetAngle = GAME_CONFIG.CLAW_OPEN_ANGLE;
                claw.isClosed = false;
                claw.state = 'idle';
            }
        }
    }
    
    handleMovingToExitState() {
        const claw = this.claw;
        
        if (!claw.heldDoll) {
            claw.state = 'idle';
            claw.targetAngle = GAME_CONFIG.CLAW_OPEN_ANGLE;
            claw.isClosed = false;
            return;
        }
        
        const exitCenterX = this.exitZone.x + this.exitZone.width / 2;
        const diff = exitCenterX - claw.x;
        
        if (Math.abs(diff) > 2) {
            claw.x += Math.sign(diff) * GAME_CONFIG.CLAW_SPEED_X;
        } else {
            claw.x = exitCenterX;
            claw.state = 'releasing';
            claw.animTimer = 0;
            claw.targetAngle = GAME_CONFIG.CLAW_OPEN_ANGLE;
            claw.isClosed = false;
        }
    }
    
    handleReleasingState(deltaTime) {
        const claw = this.claw;
        claw.animTimer += deltaTime || 16;
        
        if (claw.animTimer <= 400) {
            // 等待爪子张开动画
        }
        else if (claw.animTimer <= 600) {
            // 释放娃娃
            if (claw.heldDoll) {
                const doll = claw.heldDoll;
                doll.heldByClaw = false;
                doll.falling = true;
                doll.velocityY = 0;
                doll.caught = false;
                claw.heldDoll = null;
            }
        }
        else {
            // 回到 idle
            claw.state = 'idle';
        }
    }
    
    dropHeldDoll() {
        const claw = this.claw;
        if (!claw.heldDoll) return;
        
        const doll = claw.heldDoll;
        doll.heldByClaw = false;
        doll.falling = true;
        doll.velocityY = -2;
        doll.caught = false;
        
        claw.heldDoll = null;
        claw.targetAngle = GAME_CONFIG.CLAW_OPEN_ANGLE;
        claw.isClosed = false;
    }
    
    emptyGrabPenalty() {
        this.time = Math.max(0, this.time - GAME_CONFIG.EMPTY_GRAB_PENALTY);
        this.updateUI();
        this.saveState();
    }
    
    checkClawCollision() {
        const claw = this.claw;
        const clawLeft = claw.x - claw.width / 2;
        const clawRight = claw.x + claw.width / 2;
        const clawBottom = claw.y + claw.height + 20;
        
        for (const doll of this.dolls) {
            if (doll.caught || doll.falling || doll.heldByClaw) continue;
            
            const dollLeft = doll.x - doll.width / 2;
            const dollRight = doll.x + doll.width / 2;
            const dollTop = doll.y - doll.height / 2;
            const dollBottom = doll.y + doll.height / 2;
            
            if (clawRight > dollLeft && clawLeft < dollRight &&
                clawBottom > dollTop && claw.y < dollBottom) {
                return doll;
            }
        }
        return null;
    }
    
    isInExitZone(doll) {
        const zone = this.exitZone;
        return doll.x > zone.x && doll.x < zone.x + zone.width &&
               doll.y > zone.y && doll.y < zone.y + zone.height;
    }
    
    catchSuccess(doll) {
        const config = DOLL_TYPES[doll.type];
        
        this.score += config.score;
        this.time += config.timeBonus;
        this.caughtDolls++;
        this.collected[doll.type]++;
        
        this.updateUI();
        this.saveState();
        
        this.createStarEffect(doll.x, doll.y);
        this.showDingDong(doll);
        
        doll.caught = true;
        doll.falling = false;
        doll.heldByClaw = false;
    }
    
    updateDolls(deltaTime) {
        const time = Date.now() / 1000;
        
        for (const doll of this.dolls) {
            if (doll.caught || doll.heldByClaw) continue;
            
            if (!doll.falling) {
                doll.bobOffset += 0.02 * doll.bobSpeed;
            }
            
            if (doll.falling) {
                doll.velocityY += 0.3;
                doll.y += doll.velocityY;
                
                const floorY = this.canvasHeight - 80;
                if (doll.y + doll.height / 2 > floorY) {
                    if (this.isInExitZone(doll)) {
                        this.catchSuccess(doll);
                    } else {
                        doll.y = floorY - doll.height / 2;
                        doll.falling = false;
                        doll.velocityY = 0;
                        
                        if (doll.velocityY > 5) {
                            doll.x += (Math.random() - 0.5) * 30;
                        }
                    }
                }
            }
        }
    }
    
    createStarEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.effects.stars.push({
                x: x + (Math.random() - 0.5) * 60,
                y: y + (Math.random() - 0.5) * 60,
                size: Math.random() * 8 + 4,
                alpha: 1,
                speed: Math.random() * 2 + 1,
                angle: Math.random() * Math.PI * 2,
                color: ['#FFD700', '#FFF', '#FF69B4', '#87CEEB'][Math.floor(Math.random() * 4)]
            });
        }
    }
    
    updateEffects(deltaTime) {
        this.effects.stars = this.effects.stars.filter(star => {
            star.alpha -= 0.02;
            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;
            star.y += 0.5;
            return star.alpha > 0;
        });
    }
    
    showDingDong(doll) {
        const config = DOLL_TYPES[doll.type];
        const modal = document.getElementById('ding-dong-modal');
        
        document.getElementById('ding-dong-doll').textContent = config.emoji;
        document.getElementById('ding-dong-score').textContent = `+${config.score}分`;
        document.getElementById('ding-dong-time').textContent = `+${config.timeBonus}秒`;
        
        modal.classList.remove('hidden');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 2000);
    }
    
    checkWinCondition() {
        if (this.caughtDolls >= GAME_CONFIG.TOTAL_DOLLS) {
            this.endGame();
        }
    }
    
    saveState() {
        const state = {
            score: this.score,
            time: this.time,
            caughtDolls: this.caughtDolls,
            collected: { ...this.collected },
            state: this.state,
            claw: {
                x: this.claw.x,
                y: this.claw.y,
                angle: this.claw.angle,
                isClosed: this.claw.isClosed,
                state: this.claw.state
            },
            dolls: this.dolls.map(d => ({
                ...d,
                caught: d.caught,
                falling: d.falling,
                x: d.x,
                y: d.y
            }))
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    
    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            this.showModal('start-modal');
            return;
        }
        
        try {
            const state = JSON.parse(saved);
            
            if (state.state === GAME_STATE.ENDED || state.state === GAME_STATE.IDLE) {
                this.showModal('start-modal');
                return;
            }
            
            this.score = state.score || 0;
            this.time = state.time || GAME_CONFIG.INITIAL_TIME;
            this.caughtDolls = state.caughtDolls || 0;
            this.collected = state.collected || {
                bear: 0, rabbit: 0, dino: 0, octopus: 0, unicorn: 0
            };
            
            if (state.dolls) {
                this.dolls = generateDolls(GAME_CONFIG.TOTAL_DOLLS);
                state.dolls.forEach((saved, i) => {
                    if (this.dolls[i]) {
                        this.dolls[i].caught = saved.caught;
                        this.dolls[i].falling = saved.falling;
                        this.dolls[i].x = saved.x;
                        this.dolls[i].y = saved.y;
                    }
                });
            }
            
            this.updateUI();
            
            if (state.state === GAME_STATE.PAUSED) {
                this.state = GAME_STATE.PAUSED;
                this.showModal('pause-modal');
            } else if (state.state === GAME_STATE.PLAYING) {
                this.state = GAME_STATE.PLAYING;
                this.startTimer();
            }
        } catch (e) {
            console.error('Failed to load state:', e);
            this.showModal('start-modal');
        }
    }
    
    clearState() {
        localStorage.removeItem(STORAGE_KEY);
    }
    
    render(timestamp = 0) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.draw();
        
        this.timers.animation = requestAnimationFrame((t) => this.render(t));
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        
        ctx.clearRect(0, 0, w, h);
        
        this.drawBackground();
        this.drawExitZone();
        this.drawDolls();
        this.drawClaw();
        this.drawHeldDoll();
        this.drawEffects();
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
        bgGradient.addColorStop(0, '#FFF0F5');
        bgGradient.addColorStop(0.5, '#FFE4EC');
        bgGradient.addColorStop(1, '#F8BBD9');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = 'rgba(255, 107, 157, 0.1)';
        for (let i = 0; i < 5; i++) {
            const x = (w / 5) * i + 20;
            const y = 50;
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const floorY = h - 80;
        const floorGradient = ctx.createLinearGradient(0, floorY, 0, h);
        floorGradient.addColorStop(0, '#E8E8E8');
        floorGradient.addColorStop(1, '#D0D0D0');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(0, floorY, w, h - floorY);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(w, floorY);
        ctx.stroke();
    }
    
    drawExitZone() {
        const ctx = this.ctx;
        const zone = this.exitZone;
        
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        ctx.strokeStyle = '#FF6B9D';
        ctx.lineWidth = 3;
        ctx.strokeRect(zone.x - 2, zone.y - 2, zone.width + 4, zone.height + 4);
        
        ctx.fillStyle = '#FF6B9D';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('出口', zone.x + zone.width / 2, zone.y - 10);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            zone.x + zone.width / 2,
            zone.y + zone.height,
            zone.width / 2 + 5,
            10,
            0, 0, Math.PI * 2
        );
        ctx.fill();
    }
    
    drawDolls() {
        const ctx = this.ctx;
        
        for (const doll of this.dolls) {
            if (doll.caught || doll.heldByClaw) continue;
            
            ctx.save();
            ctx.translate(doll.x, doll.y + (doll.falling ? 0 : Math.sin(doll.bobOffset) * 3));
            ctx.rotate((doll.rotation * Math.PI) / 180);
            
            this.drawDoll(ctx, doll.type, doll.width, doll.height);
            
            ctx.restore();
        }
    }
    
    drawHeldDoll() {
        const claw = this.claw;
        if (!claw.heldDoll) return;
        
        const doll = claw.heldDoll;
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(doll.x, doll.y);
        ctx.rotate((doll.rotation * Math.PI) / 180);
        
        this.drawDoll(ctx, doll.type, doll.width, doll.height);
        
        ctx.restore();
    }
    
    drawDoll(ctx, type, width, height) {
        const config = DOLL_TYPES[type];
        const colors = config.colors;
        
        switch(type) {
            case 'bear':
                this.drawBear(ctx, colors, width, height);
                break;
            case 'rabbit':
                this.drawRabbit(ctx, colors, width, height);
                break;
            case 'dino':
                this.drawDino(ctx, colors, width, height);
                break;
            case 'octopus':
                this.drawOctopus(ctx, colors, width, height);
                break;
            case 'unicorn':
                this.drawUnicorn(ctx, colors, width, height);
                break;
        }
    }
    
    drawBear(ctx, colors, width, height) {
        const r = width / 2;
        
        ctx.fillStyle = colors.ear;
        ctx.beginPath();
        ctx.arc(-r * 0.7, -r * 0.6, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.7, -r * 0.6, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.bodyLight;
        ctx.beginPath();
        ctx.arc(-r * 0.7, -r * 0.6, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.7, -r * 0.6, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        bodyGrad.addColorStop(0, colors.bodyLight);
        bodyGrad.addColorStop(1, colors.body);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.bodyLight;
        ctx.beginPath();
        ctx.ellipse(0, r * 0.2, r * 0.4, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.2, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-r * 0.33, -r * 0.22, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.27, -r * 0.22, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.nose;
        ctx.beginPath();
        ctx.ellipse(0, r * 0.1, r * 0.12, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.6, r * 0.1, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.6, r * 0.1, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = colors.nose;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, r * 0.15, r * 0.15, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }
    
    drawRabbit(ctx, colors, width, height) {
        const r = width / 2;
        
        ctx.fillStyle = colors.body;
        ctx.beginPath();
        ctx.ellipse(-r * 0.5, -r * 1.3, r * 0.2, r * 0.6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.5, -r * 1.3, r * 0.2, r * 0.6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.earInner;
        ctx.beginPath();
        ctx.ellipse(-r * 0.5, -r * 1.3, r * 0.12, r * 0.45, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.5, -r * 1.3, r * 0.12, r * 0.45, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        bodyGrad.addColorStop(0, colors.bodyLight);
        bodyGrad.addColorStop(1, colors.body);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.15, r * 0.22, r * 0.25, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.15, r * 0.22, r * 0.25, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.1, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.1, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-r * 0.32, -r * 0.16, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.28, -r * 0.16, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 105, 180, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.6, r * 0.05, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.6, r * 0.05, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.nose;
        ctx.beginPath();
        ctx.ellipse(0, r * 0.15, r * 0.1, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.1);
        ctx.lineTo(-r * 0.2, r * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.25);
        ctx.lineTo(-r * 0.2, r * 0.22);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.1);
        ctx.lineTo(r * 0.2, r * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.25);
        ctx.lineTo(r * 0.2, r * 0.22);
        ctx.stroke();
    }
    
    drawDino(ctx, colors, width, height) {
        const r = width / 2;
        
        ctx.fillStyle = colors.back;
        ctx.beginPath();
        ctx.moveTo(-r * 0.1, -r);
        ctx.lineTo(0, -r * 1.4);
        ctx.lineTo(r * 0.1, -r);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.8);
        ctx.lineTo(-r * 0.3, -r * 1.2);
        ctx.lineTo(-r * 0.2, -r * 0.8);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.8);
        ctx.lineTo(r * 0.3, -r * 1.2);
        ctx.lineTo(r * 0.2, -r * 0.8);
        ctx.closePath();
        ctx.fill();
        
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.1, 0, 0, 0, r);
        bodyGrad.addColorStop(0, colors.bodyLight);
        bodyGrad.addColorStop(1, colors.body);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = colors.belly;
        ctx.beginPath();
        ctx.ellipse(0, r * 0.1, r * 0.5, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.2, r * 0.18, r * 0.22, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.25, -r * 0.25, r * 0.18, r * 0.22, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.18, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.22, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-r * 0.33, -r * 0.25, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.17, -r * 0.29, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(152, 251, 152, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.65, r * 0.1, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.55, r * 0.05, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(r * 0.5, r * 0.05, r * 0.12, r * 0.08, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(r * 0.3, r * 0.1, r * 0.15, 0, Math.PI);
        ctx.stroke();
    }
    
    drawOctopus(ctx, colors, width, height) {
        const r = width / 2;
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 5) * (i + 1) - Math.PI / 2;
            const wobble = Math.sin(time * 2 + i) * 0.1;
            
            ctx.fillStyle = colors.tentacle;
            ctx.beginPath();
            const startX = Math.cos(angle) * r * 0.5;
            const startY = Math.sin(angle) * r * 0.5;
            
            ctx.moveTo(startX - r * 0.1, startY);
            ctx.quadraticCurveTo(
                Math.cos(angle + wobble) * r * 1.2,
                Math.sin(angle + wobble) * r * 1.2,
                Math.cos(angle + wobble * 0.5) * r * 0.8,
                r * 0.9
            );
            ctx.quadraticCurveTo(
                Math.cos(angle - wobble) * r * 1.2,
                Math.sin(angle - wobble) * r * 1.2,
                startX + r * 0.1,
                startY
            );
            ctx.closePath();
            ctx.fill();
        }
        
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
        bodyGrad.addColorStop(0, colors.bodyLight);
        bodyGrad.addColorStop(1, colors.body);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.1, r, r * 0.8, 0, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-r, -r * 0.1, r * 2, r * 0.3);
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.2, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.2, r * 0.22, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF1493';
        ctx.beginPath();
        ctx.arc(-r * 0.35, -r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.35, -r * 0.15, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-r * 0.38, -r * 0.22, r * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.32, -r * 0.22, r * 0.045, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.7, -r * 0.1, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.7, -r * 0.1, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.05, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF1493';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, r * 0.02, r * 0.12, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }
    
    drawUnicorn(ctx, colors, width, height) {
        const r = width / 2;
        const time = Date.now() / 1000;
        
        for (let i = 0; i < 4; i++) {
            const yOffset = -r * (0.5 + i * 0.25);
            const wobble = Math.sin(time * 1.5 + i) * 3;
            
            ctx.fillStyle = colors.mane[i % colors.mane.length];
            ctx.beginPath();
            ctx.ellipse(-r * 0.7 + wobble, yOffset, r * 0.15, r * 0.15, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = colors.horn;
        ctx.beginPath();
        ctx.moveTo(-r * 0.1, -r * 0.5);
        ctx.lineTo(0, -r * 1.5);
        ctx.lineTo(r * 0.1, -r * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.moveTo(-r * 0.05, -r * 0.5);
        ctx.lineTo(-r * 0.02, -r * 1.2);
        ctx.lineTo(r * 0.02, -r * 0.8);
        ctx.closePath();
        ctx.fill();
        
        const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.1, 0, 0, 0, r);
        bodyGrad.addColorStop(0, colors.bodyLight);
        bodyGrad.addColorStop(1, colors.body);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
        ctx.beginPath();
        ctx.ellipse(r * 0.3, r * 0.2, r * 0.25, r * 0.2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.2, r * 0.25, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.3, -r * 0.2, r * 0.2, r * 0.25, 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#9370DB';
        ctx.beginPath();
        ctx.arc(-r * 0.3, -r * 0.15, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.3, -r * 0.15, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-r * 0.33, -r * 0.22, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.27, -r * 0.22, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.6, r * 0.05, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.6, r * 0.05, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.1, r * 0.12, r * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(147, 112, 219, 0.2)';
        ctx.beginPath();
        ctx.arc(-r * 0.3, r * 0.3, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(135, 206, 235, 0.2)';
        ctx.beginPath();
        ctx.arc(0, r * 0.35, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(152, 251, 152, 0.2)';
        ctx.beginPath();
        ctx.arc(r * 0.25, r * 0.25, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawClaw() {
        const ctx = this.ctx;
        const claw = this.claw;
        
        ctx.save();
        ctx.translate(claw.x, claw.y);
        
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -100);
        ctx.lineTo(0, 0);
        ctx.stroke();
        
        const gradient = ctx.createLinearGradient(-25, 0, 25, 0);
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.3, '#E0E0E0');
        gradient.addColorStop(0.7, '#E0E0E0');
        gradient.addColorStop(1, '#A0A0A0');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(-25, -5, 50, 15, 5);
        ctx.fill();
        
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        this.drawClawArm(ctx, -claw.width / 2, 5, -claw.angle, true);
        this.drawClawArm(ctx, 0, 5, 0, false);
        this.drawClawArm(ctx, claw.width / 2, 5, claw.angle, true);
        
        ctx.restore();
    }
    
    drawClawArm(ctx, baseX, baseY, angle, hasTip) {
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate((angle * Math.PI) / 180);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 40);
        gradient.addColorStop(0, '#D0D0D0');
        gradient.addColorStop(0.5, '#F0F0F0');
        gradient.addColorStop(1, '#C0C0C0');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(3, 35);
        ctx.lineTo(-3, 35);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        if (hasTip) {
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.moveTo(-3, 35);
            ctx.lineTo(3, 35);
            ctx.lineTo(0, 45);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawEffects() {
        const ctx = this.ctx;
        
        for (const star of this.effects.stars) {
            ctx.save();
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = star.color;
            ctx.translate(star.x, star.y);
            
            this.drawStar(ctx, 0, 0, 5, star.size, star.size / 2);
            
            ctx.restore();
        }
    }
    
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(
                cx + Math.cos(rot) * outerRadius,
                cy + Math.sin(rot) * outerRadius
            );
            rot += step;
            
            ctx.lineTo(
                cx + Math.cos(rot) * innerRadius,
                cy + Math.sin(rot) * innerRadius
            );
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ClawGame();
});
