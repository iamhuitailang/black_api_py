import { Timer } from './timer.js';
import { CandleRenderer } from './renderer.js';
import { CANDLE_STATE, CANDLE_TYPES, TAGS, formatTime, generateId } from './config.js';
import { audioManager } from './audio.js';
import { StorageManager } from './storage.js';

class Candle {
    constructor(options = {}) {
        this.id = options.id || generateId();
        this.type = options.type || 'classic';
        this.tag = options.tag || 'custom';
        this.durationMinutes = options.durationMinutes || 25;
        this.state = options.state || CANDLE_STATE.IDLE;
        this.createdAt = options.createdAt || Date.now();
        this.startedAt = options.startedAt || null;
        this.completedAt = options.completedAt || null;
        
        this.timer = null;
        this.renderer = null;
        this.canvas = null;
        this.wrapper = null;
        this.settings = null;
        this.onStateChange = null;
        this.onComplete = null;
        this.longPressTimer = null;
        this.isLongPress = false;
        
        this.initTimer(options.timerData);
    }

    initTimer(timerData = null) {
        const durationSeconds = this.durationMinutes * 60;
        
        if (timerData) {
            this.timer = Timer.fromJSON(
                timerData,
                (remaining, duration) => this.handleTick(remaining, duration),
                () => this.handleComplete()
            );
        } else {
            this.timer = new Timer(
                durationSeconds,
                (remaining, duration) => this.handleTick(remaining, duration),
                () => this.handleComplete()
            );
        }
    }

    handleTick(remaining, duration) {
        if (this.renderer && this.settings) {
            const progress = 1 - (remaining / duration);
            this.renderer.render(this.state, progress, this.settings);
        }
        this.updateTimeDisplay(remaining);
    }

    handleComplete() {
        this.state = CANDLE_STATE.COMPLETED;
        this.completedAt = Date.now();
        
        if (this.renderer) {
            this.renderer.startExtinguishAnimation(
                this.canvas.offsetWidth / 2,
                this.canvas.offsetHeight * 0.2
            );
            this.renderer.render(CANDLE_STATE.EXTINGUISHED, 1, this.settings);
        }
        
        if (this.settings?.vibration) {
            audioManager.vibrate([200, 100, 200, 100, 400]);
        }
        
        if (this.settings?.ambientSound) {
            audioManager.playCompletionSound();
        }
        
        this.saveToHistory();
        this.updateStats();
        
        if (this.onComplete) {
            this.onComplete(this);
        }
        
        if (this.onStateChange) {
            this.onStateChange(this);
        }
    }

    saveToHistory() {
        const tagInfo = TAGS[this.tag];
        const candleTypeInfo = CANDLE_TYPES[this.type];
        
        StorageManager.addHistoryEntry({
            id: this.id,
            tag: this.tag,
            tagIcon: tagInfo?.icon || '✏️',
            tagName: tagInfo?.name || '自定义',
            duration: this.durationMinutes,
            candleType: this.type,
            candleTypeName: candleTypeInfo?.name || '经典白蜡',
            candleTypeIcon: candleTypeInfo?.icon || '🕯️',
            startedAt: this.startedAt,
            completedAt: this.completedAt
        });
    }

    updateStats() {
        StorageManager.updateStats(this.durationMinutes);
        StorageManager.checkUnlocks();
    }

    light() {
        if (this.state !== CANDLE_STATE.IDLE && this.state !== CANDLE_STATE.EXTINGUISHED) {
            return false;
        }
        
        this.state = CANDLE_STATE.BURNING;
        this.startedAt = Date.now();
        this.timer.start();
        
        if (this.settings?.ambientSound) {
            audioManager.playLightSound();
            audioManager.playBurnSound();
        }
        
        if (this.onStateChange) {
            this.onStateChange(this);
        }
        
        return true;
    }

    extinguish() {
        if (this.state !== CANDLE_STATE.BURNING) {
            return false;
        }
        
        this.state = CANDLE_STATE.EXTINGUISHED;
        this.timer.pause();
        
        if (this.renderer) {
            this.renderer.startExtinguishAnimation(
                this.canvas.offsetWidth / 2,
                this.canvas.offsetHeight * 0.2
            );
            this.renderer.render(CANDLE_STATE.EXTINGUISHED, this.timer.getProgress(), this.settings);
        }
        
        if (this.settings?.ambientSound) {
            audioManager.playExtinguishSound();
            audioManager.stopBurnSound();
        }
        
        if (this.onStateChange) {
            this.onStateChange(this);
        }
        
        return true;
    }

    reset() {
        this.timer.reset(this.durationMinutes * 60);
        this.state = CANDLE_STATE.IDLE;
        this.startedAt = null;
        this.completedAt = null;
        
        if (this.renderer) {
            this.renderer.smokeParticles = [];
            this.renderer.waxDrips = [];
            this.renderer.render(CANDLE_STATE.IDLE, 0, this.settings);
        }
        
        audioManager.stopBurnSound();
        
        if (this.onStateChange) {
            this.onStateChange(this);
        }
    }

    setDuration(minutes) {
        const candleType = CANDLE_TYPES[this.type];
        const minTime = candleType?.minTime || 1;
        const maxTime = candleType?.maxTime || 120;
        
        minutes = Math.max(minTime, Math.min(maxTime, minutes));
        this.durationMinutes = minutes;
        
        if (this.timer) {
            this.timer.reset(minutes * 60);
        }
        
        if (this.state === CANDLE_STATE.IDLE && this.renderer && this.settings) {
            this.renderer.render(CANDLE_STATE.IDLE, 0, this.settings);
        }
    }

    setType(type) {
        const candleType = CANDLE_TYPES[type];
        if (!candleType) return false;
        
        this.type = type;
        
        if (this.durationMinutes > candleType.maxTime) {
            this.setDuration(candleType.maxTime);
        }
        
        if (this.renderer) {
            this.renderer.candleData.type = type;
            this.renderer.render(this.state, this.timer.getProgress(), this.settings);
        }
        
        return true;
    }

    setTag(tag) {
        const tagInfo = TAGS[tag];
        if (!tagInfo) return false;
        
        this.tag = tag;
        
        if (tagInfo.defaultTime && tag !== 'custom') {
            this.setDuration(tagInfo.defaultTime);
        }
        
        if (this.wrapper) {
            const tagEl = this.wrapper.querySelector('.candle-tag');
            if (tagEl) {
                tagEl.textContent = `${tagInfo.icon} ${tagInfo.name}`;
            }
        }
        
        return true;
    }

    setSettings(settings) {
        this.settings = settings;
        
        if (this.renderer) {
            this.renderer.render(this.state, this.timer.getProgress(), this.settings);
        }
    }

    updateTimeDisplay(remaining) {
        if (!this.wrapper) return;
        
        const timeEl = this.wrapper.querySelector('.candle-time');
        if (timeEl) {
            timeEl.textContent = formatTime(Math.ceil(remaining));
        }
    }

    render(container, settings) {
        this.settings = settings;
        
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'candle-wrapper';
        this.wrapper.dataset.candleId = this.id;
        
        const tagInfo = TAGS[this.tag] || TAGS.custom;
        
        this.wrapper.innerHTML = `
            <canvas class="candle-canvas"></canvas>
            <div class="candle-info">
                <div class="candle-tag">${tagInfo.icon} ${tagInfo.name}</div>
                <div class="candle-time">${formatTime(this.durationMinutes * 60)}</div>
            </div>
        `;
        
        container.appendChild(this.wrapper);
        
        this.canvas = this.wrapper.querySelector('.candle-canvas');
        this.renderer = new CandleRenderer(this.canvas, { type: this.type });
        
        requestAnimationFrame(() => {
            const progress = this.timer ? this.timer.getProgress() : 0;
            this.renderer.render(this.state, progress, this.settings);
        });
        
        this.setupEventListeners();
        
        return this.wrapper;
    }

    setupEventListeners() {
        if (!this.wrapper) return;
        
        this.wrapper.addEventListener('click', (e) => {
            if (this.isLongPress) {
                this.isLongPress = false;
                return;
            }
            if (this.onClick) {
                this.onClick(this);
            }
        });
        
        this.wrapper.addEventListener('touchstart', (e) => {
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.extinguish();
                if (this.onLongPress) {
                    this.onLongPress(this);
                }
            }, 800);
        });
        
        this.wrapper.addEventListener('touchend', (e) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
        
        this.wrapper.addEventListener('touchmove', (e) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
        
        this.wrapper.addEventListener('mousedown', (e) => {
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                this.extinguish();
                if (this.onLongPress) {
                    this.onLongPress(this);
                }
            }, 800);
        });
        
        this.wrapper.addEventListener('mouseup', (e) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
        
        this.wrapper.addEventListener('mouseleave', (e) => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        });
    }

    setSelected(selected) {
        if (this.wrapper) {
            if (selected) {
                this.wrapper.classList.add('selected');
            } else {
                this.wrapper.classList.remove('selected');
            }
        }
    }

    destroy() {
        if (this.timer) {
            this.timer.destroy();
        }
        if (this.renderer) {
            this.renderer.destroy();
        }
        if (this.wrapper) {
            this.wrapper.remove();
        }
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
        audioManager.stopBurnSound();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            tag: this.tag,
            durationMinutes: this.durationMinutes,
            state: this.state,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            timerData: this.timer ? this.timer.toJSON() : null
        };
    }

    static fromJSON(json, settings) {
        const candle = new Candle({
            id: json.id,
            type: json.type,
            tag: json.tag,
            durationMinutes: json.durationMinutes,
            state: json.state,
            createdAt: json.createdAt,
            startedAt: json.startedAt,
            completedAt: json.completedAt,
            timerData: json.timerData
        });
        
        return candle;
    }
}

export { Candle };
