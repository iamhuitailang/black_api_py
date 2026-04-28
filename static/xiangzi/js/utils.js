class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    resize(rows, cols) {
        const maxSize = Math.min(window.innerWidth - 40, 480);
        this.tileSize = Math.floor(maxSize / Math.max(rows, cols));
        this.tileSize = Math.min(this.tileSize, 60);
        
        const canvasWidth = cols * this.tileSize;
        const canvasHeight = rows * this.tileSize;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        this.offsetX = 0;
        this.offsetY = 0;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#e8f4f8');
        gradient.addColorStop(1, '#d4e6f1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawFloor(x, y) {
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;
        const size = this.tileSize;
        const padding = 2;
        
        this.ctx.fillStyle = '#f5f5f5';
        this.ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
    }

    drawWall(x, y) {
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;
        const size = this.tileSize;
        const padding = 3;
        const radius = 8;
        
        this.ctx.fillStyle = '#8b7355';
        this.roundRect(px + padding, py + padding, size - padding * 2, size - padding * 2, radius);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#6b5344';
        this.roundRect(px + padding + 4, py + padding + 4, size - padding * 2 - 8, size - padding * 2 - 8, radius - 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#9b8365';
        this.ctx.fillRect(px + padding + 6, py + padding + 6, 8, 4);
        this.ctx.fillRect(px + padding + 18, py + padding + 6, 8, 4);
        this.ctx.fillRect(px + padding + 10, py + padding + 14, 10, 4);
    }

    drawTarget(x, y) {
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;
        const size = this.tileSize;
        const centerX = px + size / 2;
        const centerY = py + size / 2;
        const outerRadius = size / 3;
        const innerRadius = size / 6;
        
        const pulseOffset = Math.sin(Date.now() / 500) * 2;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, outerRadius + pulseOffset, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(72, 219, 251, 0.3)';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
        gradient.addColorStop(0, '#48dbfb');
        gradient.addColorStop(1, '#0abde3');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#0984e3';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 3]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawBox(x, y, onTarget = false) {
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;
        const size = this.tileSize;
        const padding = 6;
        const radius = 10;
        const boxSize = size - padding * 2;
        
        if (onTarget) {
            this.drawTarget(x, y);
        }
        
        const gradient = this.ctx.createLinearGradient(
            px + padding, py + padding,
            px + padding + boxSize, py + padding + boxSize
        );
        
        if (onTarget) {
            gradient.addColorStop(0, '#1dd1a1');
            gradient.addColorStop(1, '#10ac84');
        } else {
            gradient.addColorStop(0, '#feca57');
            gradient.addColorStop(1, '#ff9f43');
        }
        
        this.ctx.fillStyle = gradient;
        this.roundRect(px + padding, py + padding, boxSize, boxSize, radius);
        this.ctx.fill();
        
        this.ctx.strokeStyle = onTarget ? '#0d8c6a' : '#f39c12';
        this.ctx.lineWidth = 3;
        this.roundRect(px + padding, py + padding, boxSize, boxSize, radius);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(px + padding + boxSize / 3, py + padding + 8);
        this.ctx.lineTo(px + padding + boxSize / 3, py + padding + boxSize - 8);
        this.ctx.moveTo(px + padding + boxSize * 2 / 3, py + padding + 8);
        this.ctx.lineTo(px + padding + boxSize * 2 / 3, py + padding + boxSize - 8);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(px + padding + boxSize / 2, py + padding + boxSize / 2, 8, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawPlayer(x, y) {
        const px = x * this.tileSize + this.offsetX;
        const py = y * this.tileSize + this.offsetY;
        const size = this.tileSize;
        const centerX = px + size / 2;
        const centerY = py + size / 2;
        const radius = size / 3;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(243, 104, 224, 0.3)';
        this.ctx.fill();
        
        const bodyGradient = this.ctx.createRadialGradient(
            centerX - 5, centerY - 5, 0,
            centerX, centerY, radius
        );
        bodyGradient.addColorStop(0, '#ff9ff3');
        bodyGradient.addColorStop(1, '#f368e0');
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = bodyGradient;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#c44dff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        const eyeOffsetX = radius * 0.35;
        const eyeOffsetY = radius * 0.15;
        const eyeRadius = 4;
        
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - eyeOffsetX, centerY - eyeOffsetY, eyeRadius + 1, eyeRadius + 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + eyeOffsetX, centerY - eyeOffsetY, eyeRadius + 1, eyeRadius + 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#2d3436';
        this.ctx.beginPath();
        this.ctx.arc(centerX - eyeOffsetX + 1, centerY - eyeOffsetY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(centerX + eyeOffsetX + 1, centerY - eyeOffsetY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#2d3436';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + 2, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX - eyeOffsetX - 4, centerY + 2, 4, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + eyeOffsetX + 4, centerY + 2, 4, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawCell(cellType, x, y) {
        switch (cellType) {
            case CELL.FLOOR:
                this.drawFloor(x, y);
                break;
            case CELL.WALL:
                this.drawFloor(x, y);
                this.drawWall(x, y);
                break;
            case CELL.TARGET:
                this.drawFloor(x, y);
                this.drawTarget(x, y);
                break;
            case CELL.BOX:
                this.drawFloor(x, y);
                this.drawBox(x, y, false);
                break;
            case CELL.PLAYER:
                this.drawFloor(x, y);
                this.drawPlayer(x, y);
                break;
            case CELL.BOX_ON_TARGET:
                this.drawFloor(x, y);
                this.drawBox(x, y, true);
                break;
            case CELL.PLAYER_ON_TARGET:
                this.drawFloor(x, y);
                this.drawTarget(x, y);
                this.drawPlayer(x, y);
                break;
        }
    }

    render(map) {
        this.clear();
        this.drawBackground();
        
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                this.drawCell(map[y][x], x, y);
            }
        }
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
}

class StorageManager {
    constructor() {
        this.key = GAME_CONFIG.STORAGE_KEY;
    }

    getData() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
        }
        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            unlockedLevels: 1,
            completedLevels: [],
            bestTimes: {},
            bestMoves: {},
            lastPlayedLevel: 0,
            lastPlayedState: null
        };
    }

    saveData(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save game data:', e);
            return false;
        }
    }

    unlockLevel(levelIndex) {
        const data = this.getData();
        if (levelIndex + 1 > data.unlockedLevels) {
            data.unlockedLevels = levelIndex + 2;
            this.saveData(data);
        }
    }

    completeLevel(levelIndex, time, moves) {
        const data = this.getData();
        
        if (!data.completedLevels.includes(levelIndex)) {
            data.completedLevels.push(levelIndex);
        }
        
        const currentBestTime = data.bestTimes[levelIndex];
        const currentBestMoves = data.bestMoves[levelIndex];
        
        let isNewRecord = false;
        
        if (currentBestTime === undefined || time < currentBestTime) {
            data.bestTimes[levelIndex] = time;
            isNewRecord = true;
        }
        
        if (currentBestMoves === undefined || moves < currentBestMoves) {
            data.bestMoves[levelIndex] = moves;
            isNewRecord = true;
        }
        
        this.unlockLevel(levelIndex);
        this.saveData(data);
        
        return isNewRecord;
    }

    getBestTime(levelIndex) {
        const data = this.getData();
        return data.bestTimes[levelIndex];
    }

    getBestMoves(levelIndex) {
        const data = this.getData();
        return data.bestMoves[levelIndex];
    }

    isLevelUnlocked(levelIndex) {
        const data = this.getData();
        return levelIndex < data.unlockedLevels;
    }

    isLevelCompleted(levelIndex) {
        const data = this.getData();
        return data.completedLevels.includes(levelIndex);
    }

    saveGameState(levelIndex, gameState) {
        const data = this.getData();
        data.lastPlayedLevel = levelIndex;
        data.lastPlayedState = gameState;
        this.saveData(data);
    }

    loadGameState() {
        const data = this.getData();
        return {
            levelIndex: data.lastPlayedLevel,
            state: data.lastPlayedState
        };
    }

    clearGameState() {
        const data = this.getData();
        data.lastPlayedState = null;
        this.saveData(data);
    }
}

class SoundManager {
    static audioContext = null;
    static sounds = {};
    static enabled = true;

    static init() {
        try {
            SoundManager.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            SoundManager.enabled = false;
        }
    }

    static play(type) {
        if (!SoundManager.enabled || !SoundManager.audioContext) return;

        if (SoundManager.audioContext.state === 'suspended') {
            SoundManager.audioContext.resume();
        }

        switch (type) {
            case 'push':
                SoundManager.playPushSound();
                break;
            case 'boxOnTarget':
                SoundManager.playBoxOnTargetSound();
                break;
            case 'win':
                SoundManager.playWinSound();
                break;
            case 'lose':
                SoundManager.playLoseSound();
                break;
            case 'move':
                SoundManager.playMoveSound();
                break;
        }
    }

    static playPushSound() {
        const ctx = SoundManager.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    }

    static playBoxOnTargetSound() {
        const ctx = SoundManager.audioContext;
        
        [523.25, 659.25, 783.99].forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.08);

            gainNode.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.08);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.08 + 0.15);

            oscillator.start(ctx.currentTime + index * 0.08);
            oscillator.stop(ctx.currentTime + index * 0.08 + 0.15);
        });
    }

    static playWinSound() {
        const ctx = SoundManager.audioContext;
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
        
        notes.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);

            gainNode.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.2);

            oscillator.start(ctx.currentTime + index * 0.1);
            oscillator.stop(ctx.currentTime + index * 0.1 + 0.2);
        });
    }

    static playLoseSound() {
        const ctx = SoundManager.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    }

    static playMoveSound() {
        const ctx = SoundManager.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }
}

const storageManager = new StorageManager();
