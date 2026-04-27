class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = GameState.MENU;
        this.mode = 4;
        this.isEndlessMode = false;
        
        this.noteManager = new NoteManager();
        this.particleSystem = new ParticleSystem();
        this.rippleManager = new RippleManager();
        this.floatingNumbers = new FloatingNumberManager();
        this.judgmentDisplay = new JudgmentDisplay();
        this.comboEffect = new ComboEffect();
        this.backgroundParticles = new BackgroundParticles();
        
        this.gameData = {
            width: 0,
            height: 0,
            laneCenters: [],
            judgmentLineY: 0,
            laneWidth: 0
        };
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = GameConfig.HEALTH.START;
        this.maxPerfect = 0;
        this.timeRemaining = GameConfig.ENDLESS_TIME;
        
        this.lastTime = 0;
        this.gameTime = 0;
        this.lastFrameTime = 0;
        this.lastSaveTime = 0;
        
        this.keysPressed = {};
        this.keysJustPressed = {};
        this.keyLaneMap = {};
        
        this.holdingNotes = new Map();
        
        this.init();
    }
    
    init() {
        this.resize();
        this.setupEventListeners();
        this.updateHighScoreDisplay();
        
        this.backgroundParticles.init(this.gameData.width, this.gameData.height);
        
        this.gameLoop(0);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.gameData.width = this.canvas.width;
        this.gameData.height = this.canvas.height;
        
        this.calculateLanePositions();
        
        this.backgroundParticles.init(this.gameData.width, this.gameData.height);
    }
    
    calculateLanePositions() {
        const { width, height, mode } = { ...this.gameData, mode: this.mode };
        
        const laneWidth = width * GameConfig.LANE_WIDTH;
        const totalTrackWidth = laneWidth * this.mode;
        const startX = (width - totalTrackWidth) / 2;
        
        this.gameData.laneWidth = laneWidth;
        this.gameData.judgmentLineY = height * GameConfig.JUDGMENT_LINE_Y;
        this.gameData.laneCenters = [];
        
        for (let i = 0; i < this.mode; i++) {
            this.gameData.laneCenters.push(startX + laneWidth * i + laneWidth / 2);
        }
        
        this.updateKeyMap();
    }
    
    updateKeyMap() {
        this.keyLaneMap = {};
        const keys = GameConfig.KEY_MAPS[this.mode];
        
        for (let i = 0; i < keys.length; i++) {
            this.keyLaneMap[keys[i]] = i;
        }
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('keydown', (e) => {
            if (!this.keysPressed[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keysPressed[e.code] = true;
            
            if (e.code === 'Escape' && this.state === GameState.PLAYING) {
                this.pauseGame();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keysPressed[e.code] = false;
            this.handleKeyRelease(e.code);
        });
    }
    
    handleKeyRelease(code) {
        if (this.holdingNotes.has(code)) {
            const note = this.holdingNotes.get(code);
            if (note && note.type === NoteType.HOLD) {
                const holdTime = (Utils.getTime() - note.holdStartTime) / 1000;
                const holdProgress = Math.min(1, holdTime / note.holdDuration);
                
                if (holdProgress >= 0.8) {
                    this.onNoteHit(note, 'PERFECT');
                } else if (holdProgress >= 0.5) {
                    this.onNoteHit(note, 'GREAT');
                }
                
                note.isActive = false;
            }
            this.holdingNotes.delete(code);
        }
    }
    
    setMode(mode) {
        this.mode = mode;
        this.noteManager.setMode(mode);
        this.calculateLanePositions();
    }
    
    startGame(endless = false) {
        this.state = GameState.PLAYING;
        this.isEndlessMode = endless;
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.health = GameConfig.HEALTH.START;
        this.maxPerfect = 0;
        this.timeRemaining = GameConfig.ENDLESS_TIME;
        
        this.gameTime = 0;
        this.lastTime = Utils.getTime();
        
        this.noteManager.clear();
        this.particleSystem.clear();
        this.rippleManager.clear();
        this.floatingNumbers.clear();
        this.holdingNotes.clear();
        
        this.updateUI();
        
        if (endless) {
            document.getElementById('timer-display').classList.remove('hidden');
        } else {
            document.getElementById('timer-display').classList.add('hidden');
        }
    }
    
    pauseGame() {
        if (this.state !== GameState.PLAYING) return;
        
        this.state = GameState.PAUSED;
        this.saveGameState();
    }
    
    resumeGame() {
        if (this.state !== GameState.PAUSED) return;
        
        this.state = GameState.PLAYING;
        this.lastTime = Utils.getTime();
    }
    
    gameOver() {
        this.state = GameState.GAMEOVER;
        this.clearSavedState();
        
        const isNewRecord = Utils.saveHighScore(this.score, this.mode);
        
        document.getElementById('final-score').textContent = Utils.formatNumber(this.score);
        document.getElementById('final-combo').textContent = this.maxCombo;
        document.getElementById('final-perfect').textContent = this.maxPerfect;
        
        if (isNewRecord) {
            document.getElementById('new-record').classList.remove('hidden');
            document.getElementById('not-record').classList.add('hidden');
        } else {
            document.getElementById('new-record').classList.add('hidden');
            document.getElementById('not-record').classList.remove('hidden');
        }
        
        this.updateHighScoreDisplay();
    }
    
    returnToMenu() {
        this.state = GameState.MENU;
        this.clearSavedState();
        this.noteManager.clear();
        this.particleSystem.clear();
        this.rippleManager.clear();
        this.floatingNumbers.clear();
        this.holdingNotes.clear();
        this.lastSaveTime = 0;
    }
    
    updateHighScoreDisplay() {
        const highScore = Utils.getHighScore(this.mode);
        document.getElementById('menu-high-score').textContent = Utils.formatNumber(highScore);
    }
    
    saveGameState() {
        if (this.state !== GameState.PLAYING && this.state !== GameState.PAUSED) {
            this.clearSavedState();
            return;
        }
        
        const state = {
            state: this.state,
            mode: this.mode,
            isEndlessMode: this.isEndlessMode,
            score: this.score,
            combo: this.combo,
            maxCombo: this.maxCombo,
            health: this.health,
            maxPerfect: this.maxPerfect,
            timeRemaining: this.timeRemaining,
            gameTime: this.gameTime,
            notesState: this.noteManager.serializeState(),
            savedAt: Utils.getAbsoluteTime()
        };
        
        localStorage.setItem('rhythm_game_saved_state', JSON.stringify(state));
    }
    
    loadGameState() {
        const saved = localStorage.getItem('rhythm_game_saved_state');
        if (!saved) return null;
        
        try {
            const state = JSON.parse(saved);
            return state;
        } catch (e) {
            this.clearSavedState();
            return null;
        }
    }
    
    hasSavedState() {
        const state = this.loadGameState();
        if (!state) return false;
        
        const maxAge = 5 * 60 * 1000;
        const age = Utils.getAbsoluteTime() - state.savedAt;
        if (age > maxAge) {
            this.clearSavedState();
            return false;
        }
        
        return state.state === GameState.PLAYING || state.state === GameState.PAUSED;
    }
    
    clearSavedState() {
        localStorage.removeItem('rhythm_game_saved_state');
    }
    
    restoreGameState(state) {
        this.mode = state.mode;
        this.isEndlessMode = state.isEndlessMode;
        this.score = state.score;
        this.combo = state.combo;
        this.maxCombo = state.maxCombo;
        this.health = state.health;
        this.maxPerfect = state.maxPerfect;
        
        const currentTime = Utils.getAbsoluteTime();
        const timeOffset = (currentTime - state.savedAt) / 1000;
        
        this.gameTime = state.gameTime + timeOffset;
        
        if (this.isEndlessMode) {
            this.timeRemaining = Math.max(0, state.timeRemaining - timeOffset);
        } else {
            this.timeRemaining = state.timeRemaining;
        }
        
        this.noteManager.setMode(this.mode);
        this.noteManager.clear();
        
        if (state.notesState) {
            const quickRefreshThreshold = 10;
            const maxRestoreThreshold = 60;
            
            if (timeOffset <= quickRefreshThreshold) {
                this.noteManager.restoreState(state.notesState, timeOffset);
                this.processRestoredNotes(false);
            } else if (timeOffset <= maxRestoreThreshold) {
                this.noteManager.lastSpawnTime = this.gameTime;
            } else {
                this.noteManager.lastSpawnTime = this.gameTime;
            }
        } else {
            this.noteManager.lastSpawnTime = this.gameTime;
        }
        
        this.calculateLanePositions();
        
        this.state = GameState.PLAYING;
        this.lastTime = currentTime;
        
        this.updateUI();
        
        if (this.isEndlessMode) {
            document.getElementById('timer-display').classList.remove('hidden');
            document.getElementById('timer').textContent = Math.ceil(this.timeRemaining);
        } else {
            document.getElementById('timer-display').classList.add('hidden');
        }
    }
    
    processRestoredNotes(punishMissed = false) {
        const notes = this.noteManager.notes;
        
        for (let i = notes.length - 1; i >= 0; i--) {
            const note = notes[i];
            
            if (note.isPastDeadline(this.gameTime)) {
                if (punishMissed) {
                    this.combo = 0;
                    this.health = Math.max(0, this.health - GameConfig.HEALTH.LOSE_MISS);
                }
                note.miss();
                notes.splice(i, 1);
            }
        }
        
        if (punishMissed && this.health <= 0) {
            this.gameOver();
        }
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp ? (timestamp - this.lastFrameTime) / 1000 : 0.016;
        this.lastFrameTime = timestamp || 0;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(deltaTime) {
        this.backgroundParticles.update(deltaTime, this.gameData.height);
        
        if (this.state !== GameState.PLAYING) {
            return;
        }
        
        const currentTime = Utils.getTime();
        const elapsed = (currentTime - this.lastTime) / 1000;
        this.gameTime += elapsed;
        this.lastTime = currentTime;
        
        if (this.isEndlessMode) {
            this.timeRemaining -= elapsed;
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.gameOver();
                return;
            }
            document.getElementById('timer').textContent = Math.ceil(this.timeRemaining);
        }
        
        this.processInput();
        
        this.noteManager.update(this.gameTime, this.gameData);
        
        this.particleSystem.update(deltaTime);
        this.rippleManager.update(deltaTime);
        this.floatingNumbers.update(deltaTime);
        this.judgmentDisplay.update(deltaTime);
        this.comboEffect.update(deltaTime);
        
        this.checkMissedNotes();
        
        if (!this.lastSaveTime || currentTime - this.lastSaveTime > 1000) {
            this.saveGameState();
            this.lastSaveTime = currentTime;
        }
    }
    
    processInput() {
        for (const code in this.keysJustPressed) {
            if (this.keysJustPressed[code] && this.keyLaneMap[code] !== undefined) {
                const lane = this.keyLaneMap[code];
                this.handleInput(lane, code);
            }
        }
        this.keysJustPressed = {};
    }
    
    handleInput(lane, code) {
        const notesInLane = this.noteManager.getNotesInLane(lane);
        
        if (notesInLane.length === 0) return;
        
        let closestNote = null;
        let closestTimeDiff = Infinity;
        
        for (const note of notesInLane) {
            const timeDiff = Math.abs(this.gameTime - note.targetTime);
            if (timeDiff < closestTimeDiff && timeDiff <= GameConfig.JUDGMENT.MISS.range) {
                closestTimeDiff = timeDiff;
                closestNote = note;
            }
        }
        
        if (!closestNote) return;
        
        switch (closestNote.type) {
            case NoteType.NORMAL:
                this.handleNormalNote(closestNote);
                break;
            case NoteType.HOLD:
                this.handleHoldNote(closestNote, code);
                break;
            case NoteType.SLIDE:
                this.handleSlideNote(closestNote);
                break;
            case NoteType.RAPID:
                this.handleRapidNote(closestNote);
                break;
        }
    }
    
    handleNormalNote(note) {
        const judgment = note.judge(this.gameTime, this.gameData.judgmentLineY);
        
        if (judgment) {
            if (judgment.type === 'MISS') {
                this.onNoteMiss(note);
            } else {
                this.onNoteHit(note, judgment.type);
            }
            note.hit();
        }
    }
    
    handleHoldNote(note, code) {
        const judgment = note.judge(this.gameTime, this.gameData.judgmentLineY);
        
        if (judgment && judgment.type !== 'MISS') {
            note.isHolding = true;
            note.holdStartTime = Utils.getTime();
            this.holdingNotes.set(code, note);
        } else if (judgment && judgment.type === 'MISS') {
            this.onNoteMiss(note);
            note.hit();
        }
    }
    
    handleSlideNote(note) {
        const judgment = note.judge(this.gameTime, this.gameData.judgmentLineY);
        
        if (judgment) {
            if (judgment.type === 'MISS') {
                this.onNoteMiss(note);
            } else {
                this.onNoteHit(note, judgment.type);
            }
            note.hit();
        }
    }
    
    handleRapidNote(note) {
        const judgment = note.judge(this.gameTime, this.gameData.judgmentLineY);
        
        if (judgment && judgment.type !== 'MISS') {
            note.clickCount++;
            
            this.createHitEffects(note.x, this.gameData.judgmentLineY, note.color);
            this.floatingNumbers.create(
                note.x,
                this.gameData.judgmentLineY - 30,
                `${note.clickCount}`,
                '#ffff00'
            );
            
            if (note.clickCount >= note.maxClicks) {
                this.onNoteHit(note, 'PERFECT');
                note.hit();
            }
        }
    }
    
    checkMissedNotes() {
        for (let i = this.noteManager.notes.length - 1; i >= 0; i--) {
            const note = this.noteManager.notes[i];
            
            if (note.isPastDeadline(this.gameTime) && !note.isHit) {
                this.onNoteMiss(note);
                note.miss();
            }
        }
    }
    
    onNoteHit(note, judgmentType) {
        const judgment = GameConfig.JUDGMENT[judgmentType];
        
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        if (judgmentType === 'PERFECT') {
            this.maxPerfect++;
        }
        
        const multiplier = this.getComboMultiplier();
        const baseScore = judgment.score;
        const finalScore = Math.floor(baseScore * multiplier);
        
        this.score += finalScore;
        
        this.health = Math.min(GameConfig.HEALTH.MAX, this.health + GameConfig.HEALTH.GAIN_HIT);
        
        const laneCenter = this.gameData.laneCenters[note.lane];
        const judgmentY = this.gameData.judgmentLineY;
        
        this.createHitEffects(laneCenter, judgmentY, note.color);
        
        this.judgmentDisplay.show(laneCenter, judgmentY, judgmentType);
        
        if (this.combo >= 10) {
            this.comboEffect.show(laneCenter, judgmentY - 100, this.combo);
        }
        
        this.floatingNumbers.create(
            laneCenter,
            judgmentY - 80,
            `+${finalScore}`,
            judgment.color
        );
        
        this.updateUI();
    }
    
    onNoteMiss(note) {
        this.combo = 0;
        
        this.health = Math.max(0, this.health - GameConfig.HEALTH.LOSE_MISS);
        
        if (this.health <= 0) {
            this.gameOver();
            return;
        }
        
        const laneCenter = this.gameData.laneCenters[note.lane];
        const judgmentY = this.gameData.judgmentLineY;
        
        this.judgmentDisplay.show(laneCenter, judgmentY, 'MISS');
        
        this.updateUI();
    }
    
    createHitEffects(x, y, color) {
        this.particleSystem.emit(x, y, color, 30);
        
        this.rippleManager.create(x, y, color, 80);
        this.rippleManager.create(x, y, '#fff', 60);
    }
    
    getComboMultiplier() {
        const multipliers = GameConfig.COMBO_MULTIPLIER;
        let multiplier = 1;
        
        for (const threshold in multipliers) {
            if (this.combo >= parseInt(threshold)) {
                multiplier = multipliers[threshold];
            }
        }
        
        return multiplier;
    }
    
    updateUI() {
        document.getElementById('score').textContent = Utils.formatNumber(this.score);
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('health-fill').style.width = `${this.health}%`;
    }
    
    render() {
        const { ctx, gameData } = this;
        const { width, height } = gameData;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        this.drawBackground();
        
        this.backgroundParticles.draw(ctx);
        
        this.drawLanes();
        
        this.drawJudgmentLine();
        
        this.noteManager.draw(ctx, gameData);
        
        this.rippleManager.draw(ctx);
        
        this.particleSystem.draw(ctx);
        
        this.floatingNumbers.draw(ctx);
        
        this.judgmentDisplay.draw(ctx);
        
        this.comboEffect.draw(ctx);
    }
    
    drawBackground() {
        const { ctx, gameData } = this;
        const { width, height } = gameData;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#1a0a2a');
        gradient.addColorStop(1, '#0a1a2a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        const centerGradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );
        centerGradient.addColorStop(0, 'rgba(0, 255, 255, 0.05)');
        centerGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.03)');
        centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = centerGradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    drawLanes() {
        const { ctx, gameData, mode } = this;
        const { width, height, laneCenters, laneWidth } = gameData;
        
        const colors = GameConfig.LANE_COLORS[mode];
        const totalTrackWidth = laneWidth * mode;
        const startX = (width - totalTrackWidth) / 2;
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(startX, 0, totalTrackWidth, height);
        ctx.restore();
        
        for (let i = 0; i <= mode; i++) {
            const x = startX + laneWidth * i;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.stroke();
            ctx.restore();
        }
        
        for (let i = 0; i < mode; i++) {
            const centerX = laneCenters[i];
            const color = colors[i];
            
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
            
            ctx.save();
            const glowGradient = ctx.createRadialGradient(
                centerX, height / 2, 0,
                centerX, height / 2, laneWidth / 2
            );
            glowGradient.addColorStop(0, Utils.hexToRgba(color, 0.1));
            glowGradient.addColorStop(1, Utils.hexToRgba(color, 0));
            
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = glowGradient;
            ctx.fillRect(centerX - laneWidth / 2, 0, laneWidth, height);
            ctx.restore();
        }
    }
    
    drawJudgmentLine() {
        const { ctx, gameData } = this;
        const { width, judgmentLineY } = gameData;
        
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        
        const gradient = ctx.createLinearGradient(0, judgmentLineY, width, judgmentLineY);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
        gradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
        
        ctx.beginPath();
        ctx.moveTo(0, judgmentLineY);
        ctx.lineTo(width, judgmentLineY);
        ctx.lineWidth = 4;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        
        ctx.restore();
        
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, judgmentLineY - 30, width, 60);
        ctx.restore();
    }
}
