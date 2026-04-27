class Note {
    constructor(lane, type, targetTime, options = {}) {
        this.lane = lane;
        this.type = type;
        this.targetTime = targetTime;
        this.options = options;
        
        this.x = 0;
        this.y = 0;
        this.radius = GameConfig.NOTE_RADIUS;
        this.color = this.getColor();
        this.isActive = true;
        this.isHit = false;
        this.trail = [];
        this.maxTrailLength = 10;
        
        if (type === NoteType.HOLD) {
            this.holdDuration = options.holdDuration || 2.0;
            this.isHolding = false;
            this.holdProgress = 0;
        }
        
        if (type === NoteType.SLIDE) {
            this.targetLane = options.targetLane || lane + 1;
            this.isSliding = false;
        }
        
        if (type === NoteType.RAPID) {
            this.clickCount = 0;
            this.maxClicks = options.maxClicks || GameConfig.RAPID_COUNT;
            this.rapidTimeLimit = options.timeLimit || 1.0;
            this.lastClickTime = 0;
        }
        
        this.alpha = 1;
        this.scale = 1;
        this.glowIntensity = 1;
    }
    
    getColor() {
        switch (this.type) {
            case NoteType.NORMAL:
                return GameConfig.NOTE_COLORS.NORMAL;
            case NoteType.HOLD:
                return GameConfig.NOTE_COLORS.HOLD;
            case NoteType.SLIDE:
                return GameConfig.NOTE_COLORS.SLIDE;
            case NoteType.RAPID:
                return GameConfig.NOTE_COLORS.RAPID;
            default:
                return GameConfig.NOTE_COLORS.NORMAL;
        }
    }
    
    calculatePosition(gameTime, gameData) {
        if (typeof gameTime !== 'number' || typeof this.targetTime !== 'number') {
            return;
        }
        
        const timeToTarget = this.targetTime - gameTime;
        const totalTravelTime = gameData.judgmentLineY / GameConfig.NOTE_SPEED;
        
        if (totalTravelTime === 0 || !isFinite(totalTravelTime)) {
            return;
        }
        
        const progress = 1 - (timeToTarget / totalTravelTime);
        
        this.y = progress * gameData.judgmentLineY;
        
        if (gameData.laneCenters && typeof this.lane === 'number' && this.lane >= 0 && this.lane < gameData.laneCenters.length) {
            this.x = gameData.laneCenters[this.lane];
        }
        
        if (typeof this.x !== 'number' || !isFinite(this.x)) {
            this.x = 0;
        }
        if (typeof this.y !== 'number' || !isFinite(this.y)) {
            this.y = 0;
        }
        
        if (this.trail.length < this.maxTrailLength) {
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        } else {
            this.trail.shift();
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        }
        
        this.trail.forEach((point, index) => {
            point.alpha = (index + 1) / this.trail.length;
        });
    }
    
    draw(ctx, gameData) {
        if (!this.isActive) return;
        
        this.drawTrail(ctx);
        
        switch (this.type) {
            case NoteType.NORMAL:
                this.drawNormalNote(ctx, gameData);
                break;
            case NoteType.HOLD:
                this.drawHoldNote(ctx, gameData);
                break;
            case NoteType.SLIDE:
                this.drawSlideNote(ctx, gameData);
                break;
            case NoteType.RAPID:
                this.drawRapidNote(ctx, gameData);
                break;
        }
    }
    
    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.save();
        ctx.lineCap = 'round';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = this.trail[i].alpha * 0.5;
            const width = this.radius * 0.3 * (i / this.trail.length);
            
            ctx.beginPath();
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.lineWidth = width;
            ctx.strokeStyle = Utils.hexToRgba(this.color, alpha);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawNormalNote(ctx, gameData) {
        const x = this.x;
        const y = this.y;
        const r = this.radius * this.scale;
        
        CanvasUtils.drawGlow(ctx, x, y, r * 2, this.color, this.glowIntensity);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, Utils.hexToRgba(this.color, 1));
        gradient.addColorStop(0.7, Utils.hexToRgba(this.color, 0.8));
        gradient.addColorStop(1, Utils.hexToRgba(this.color, 0.3));
        
        CanvasUtils.drawCircle(ctx, x, y, r, gradient, this.alpha);
        
        CanvasUtils.drawCircleStroke(ctx, x, y, r, 2, '#fff', this.alpha * 0.8);
        
        ctx.save();
        ctx.font = `bold ${r * 0.8}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♪', x, y);
        ctx.restore();
    }
    
    drawHoldNote(ctx, gameData) {
        const x = this.x;
        const y = this.y;
        const r = this.radius * this.scale;
        
        const holdHeight = GameConfig.HOLD_HEIGHT * gameData.height;
        const trailStartY = y - holdHeight;
        
        const trailGradient = ctx.createLinearGradient(x, trailStartY, x, y);
        trailGradient.addColorStop(0, Utils.hexToRgba(this.color, 0.2));
        trailGradient.addColorStop(0.5, Utils.hexToRgba(this.color, 0.5));
        trailGradient.addColorStop(1, Utils.hexToRgba(this.color, 0.8));
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = trailGradient;
        ctx.fillRect(x - r * 0.6, trailStartY, r * 1.2, y - trailStartY);
        ctx.restore();
        
        if (this.isHolding) {
            const progressHeight = holdHeight * this.holdProgress;
            ctx.save();
            ctx.globalAlpha = this.alpha * 0.5;
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - r * 0.6, y - progressHeight, r * 1.2, progressHeight);
            ctx.restore();
        }
        
        CanvasUtils.drawGlow(ctx, x, y, r * 2, this.color, this.glowIntensity);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, Utils.hexToRgba(this.color, 1));
        gradient.addColorStop(0.7, Utils.hexToRgba(this.color, 0.8));
        gradient.addColorStop(1, Utils.hexToRgba(this.color, 0.3));
        
        CanvasUtils.drawCircle(ctx, x, y, r, gradient, this.alpha);
        
        CanvasUtils.drawCircleStroke(ctx, x, y, r, 2, '#fff', this.alpha * 0.8);
        
        ctx.save();
        ctx.font = `bold ${r * 0.8}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('━━', x, y);
        ctx.restore();
    }
    
    drawSlideNote(ctx, gameData) {
        const x = this.x;
        const y = this.y;
        const r = this.radius * this.scale;
        
        const targetX = gameData.laneCenters[this.targetLane];
        
        const slideGradient = ctx.createLinearGradient(x, y, targetX, y);
        slideGradient.addColorStop(0, Utils.hexToRgba(this.color, 0.8));
        slideGradient.addColorStop(1, Utils.hexToRgba(this.color, 0.3));
        
        CanvasUtils.drawLine(ctx, x, y, targetX, y, r * 0.5, slideGradient, this.alpha * 0.6);
        
        CanvasUtils.drawGlow(ctx, x, y, r * 2, this.color, this.glowIntensity);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, Utils.hexToRgba(this.color, 1));
        gradient.addColorStop(0.7, Utils.hexToRgba(this.color, 0.8));
        gradient.addColorStop(1, Utils.hexToRgba(this.color, 0.3));
        
        CanvasUtils.drawCircle(ctx, x, y, r, gradient, this.alpha);
        
        CanvasUtils.drawCircleStroke(ctx, x, y, r, 2, '#fff', this.alpha * 0.8);
        
        ctx.save();
        ctx.font = `bold ${r * 0.8}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⇢', x, y);
        ctx.restore();
    }
    
    drawRapidNote(ctx, gameData) {
        const x = this.x;
        const y = this.y;
        const r = this.radius * this.scale;
        
        CanvasUtils.drawGlow(ctx, x, y, r * 2.5, this.color, this.glowIntensity * 1.5);
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, Utils.hexToRgba(this.color, 1));
        gradient.addColorStop(0.7, Utils.hexToRgba(this.color, 0.8));
        gradient.addColorStop(1, Utils.hexToRgba(this.color, 0.3));
        
        CanvasUtils.drawCircle(ctx, x, y, r, gradient, this.alpha);
        
        CanvasUtils.drawCircleStroke(ctx, x, y, r, 2, '#fff', this.alpha * 0.8);
        
        ctx.save();
        ctx.font = `bold ${r * 0.8}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💥', x, y);
        ctx.restore();
        
        if (this.clickCount > 0) {
            ctx.save();
            ctx.font = `bold ${r * 0.5}px Arial`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.clickCount}/${this.maxClicks}`, x, y + r + 10);
            ctx.restore();
        }
    }
    
    judge(gameTime, judgmentLineY) {
        const timeDiff = Math.abs(gameTime - this.targetTime);
        
        if (timeDiff <= GameConfig.JUDGMENT.PERFECT.range) {
            return { type: 'PERFECT', ...GameConfig.JUDGMENT.PERFECT };
        } else if (timeDiff <= GameConfig.JUDGMENT.GREAT.range) {
            return { type: 'GREAT', ...GameConfig.JUDGMENT.GREAT };
        } else if (timeDiff <= GameConfig.JUDGMENT.GOOD.range) {
            return { type: 'GOOD', ...GameConfig.JUDGMENT.GOOD };
        } else if (timeDiff <= GameConfig.JUDGMENT.MISS.range) {
            return { type: 'MISS', ...GameConfig.JUDGMENT.MISS };
        }
        
        return null;
    }
    
    isPastDeadline(gameTime) {
        return gameTime > this.targetTime + GameConfig.JUDGMENT.MISS.range;
    }
    
    hit() {
        this.isHit = true;
        this.isActive = false;
    }
    
    miss() {
        this.isHit = false;
        this.isActive = false;
    }
    
    serialize() {
        const data = {
            lane: this.lane,
            type: this.type,
            targetTime: this.targetTime,
            options: {},
            isActive: this.isActive,
            isHit: this.isHit
        };
        
        if (this.type === NoteType.HOLD) {
            data.options.holdDuration = this.holdDuration;
            data.isHolding = this.isHolding;
            data.holdProgress = this.holdProgress;
        }
        
        if (this.type === NoteType.SLIDE) {
            data.options.targetLane = this.targetLane;
        }
        
        if (this.type === NoteType.RAPID) {
            data.options.maxClicks = this.maxClicks;
            data.clickCount = this.clickCount;
        }
        
        return data;
    }
    
    static deserialize(data) {
        if (!data || 
            typeof data.lane !== 'number' || 
            typeof data.type !== 'string' || 
            typeof data.targetTime !== 'number') {
            return null;
        }
        
        const options = data.options || {};
        const note = new Note(data.lane, data.type, data.targetTime, options);
        
        if (data.type === NoteType.HOLD) {
            if (data.isHolding !== undefined) note.isHolding = data.isHolding;
            if (data.holdProgress !== undefined) note.holdProgress = data.holdProgress;
        }
        
        if (data.type === NoteType.RAPID) {
            if (typeof data.clickCount === 'number') note.clickCount = data.clickCount;
        }
        
        if (typeof data.isActive === 'boolean') note.isActive = data.isActive;
        if (typeof data.isHit === 'boolean') note.isHit = data.isHit;
        
        return note;
    }
}

class NoteManager {
    constructor() {
        this.notes = [];
        this.lastSpawnTime = 0;
        this.gameMode = 4;
    }
    
    setMode(mode) {
        this.gameMode = mode;
    }
    
    spawnNote(currentTime, gameData) {
        if (currentTime - this.lastSpawnTime < GameConfig.SPAWN_INTERVAL.MIN) {
            return;
        }
        
        const lane = Utils.randomInt(0, this.gameMode - 1);
        
        const typeRoll = Math.random();
        let type, options = {};
        
        if (typeRoll < 0.5) {
            type = NoteType.NORMAL;
        } else if (typeRoll < 0.7) {
            type = NoteType.HOLD;
            options.holdDuration = Utils.random(1.0, 3.0);
        } else if (typeRoll < 0.85 && this.gameMode > 4) {
            type = NoteType.SLIDE;
            const direction = Math.random() < 0.5 ? -1 : 1;
            const targetLane = lane + direction;
            if (targetLane >= 0 && targetLane < this.gameMode) {
                options.targetLane = targetLane;
            } else {
                type = NoteType.NORMAL;
            }
        } else {
            type = NoteType.RAPID;
            options.maxClicks = Utils.randomInt(2, 4);
        }
        
        const travelTime = gameData.judgmentLineY / GameConfig.NOTE_SPEED;
        const targetTime = currentTime + travelTime;
        
        const note = new Note(lane, type, targetTime, options);
        this.notes.push(note);
        
        this.lastSpawnTime = currentTime;
    }
    
    update(gameTime, gameData) {
        this.spawnNote(gameTime, gameData);
        
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            
            if (!note.isActive) {
                this.notes.splice(i, 1);
                continue;
            }
            
            note.calculatePosition(gameTime, gameData);
            
            if (note.isPastDeadline(gameTime)) {
                note.miss();
                this.notes.splice(i, 1);
            }
        }
    }
    
    draw(ctx, gameData) {
        this.notes.forEach(note => {
            note.draw(ctx, gameData);
        });
    }
    
    getNotesInLane(lane) {
        return this.notes.filter(note => note.lane === lane && note.isActive);
    }
    
    clear() {
        this.notes = [];
        this.lastSpawnTime = 0;
    }
    
    serializeState() {
        return {
            notes: this.notes.filter(note => note.isActive).map(note => note.serialize()),
            lastSpawnTime: this.lastSpawnTime
        };
    }
    
    restoreState(data, timeOffset = 0) {
        this.notes = [];
        
        const lastSpawnTime = (typeof data.lastSpawnTime === 'number') ? data.lastSpawnTime : 0;
        this.lastSpawnTime = lastSpawnTime + timeOffset;
        
        const notesToRestore = data.notes || [];
        
        for (const noteData of notesToRestore) {
            if (noteData && typeof noteData.targetTime === 'number') {
                noteData.targetTime += timeOffset;
                const note = Note.deserialize(noteData);
                if (note) {
                    this.notes.push(note);
                }
            }
        }
    }
}
