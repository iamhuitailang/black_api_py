import { Candle } from './candle.js';
import { UIManager } from './ui.js';
import { StorageManager } from './storage.js';
import { audioManager } from './audio.js';
import { MAX_CANDLES, CANDLE_STATE, CANDLE_TYPES } from './config.js';

class CandleTimerApp {
    constructor() {
        this.candles = [];
        this.settings = null;
        this.ui = null;
        this.saveInterval = null;
    }

    async init() {
        this.settings = StorageManager.loadSettings();
        this.ui = new UIManager(this);
        
        await audioManager.init();
        
        this.applySettings();
        
        this.loadCandles();
        
        if (this.candles.length === 0) {
            this.addCandle();
        }
        
        this.ui.requestNotificationPermission();
        
        this.startAutoSave();
        
        this.setupVisibilityChange();
        
        this.checkUnlocks();
    }

    loadCandles() {
        const savedCandles = StorageManager.loadCandles();
        
        savedCandles.forEach(candleData => {
            const candle = Candle.fromJSON(candleData, this.settings);
            this.setupCandleCallbacks(candle);
            this.candles.push(candle);
            this.renderCandle(candle);
        });
        
        this.updateAddButtonState();
        this.updateBreathingLight();
    }

    setupCandleCallbacks(candle) {
        candle.onClick = (c) => this.handleCandleClick(c);
        candle.onLongPress = (c) => this.handleCandleLongPress(c);
        candle.onStateChange = (c) => this.handleCandleStateChange(c);
        candle.onComplete = (c) => this.handleCandleComplete(c);
    }

    renderCandle(candle) {
        candle.render(this.ui.elements.candlesContainer, this.settings);
    }

    addCandle(options = {}) {
        if (this.candles.length >= MAX_CANDLES) {
            return null;
        }
        
        const candle = new Candle({
            type: options.type || 'classic',
            tag: options.tag || 'custom',
            durationMinutes: options.durationMinutes || 25
        });
        
        this.setupCandleCallbacks(candle);
        this.candles.push(candle);
        this.renderCandle(candle);
        
        this.updateAddButtonState();
        this.saveCandles();
        
        return candle;
    }

    removeCandle(candleId) {
        const index = this.candles.findIndex(c => c.id === candleId);
        if (index !== -1) {
            const candle = this.candles[index];
            candle.destroy();
            this.candles.splice(index, 1);
            this.updateAddButtonState();
            this.saveCandles();
            this.updateBreathingLight();
        }
    }

    handleCandleClick(candle) {
        audioManager.resume();
        
        if (this.ui.selectedCandle && this.ui.selectedCandle.id !== candle.id) {
            this.ui.selectedCandle.setSelected(false);
        }
        
        candle.setSelected(true);
        this.ui.openControlPanel(candle);
    }

    handleCandleLongPress(candle) {
        audioManager.resume();
    }

    handleCandleStateChange(candle) {
        if (this.ui.selectedCandle && this.ui.selectedCandle.id === candle.id) {
            this.ui.updateActionButtons();
        }
        this.updateBreathingLight();
        this.saveCandles();
    }

    handleCandleComplete(candle) {
        const tagInfo = candle.tag;
        this.ui.showNotification(`计时完成！${candle.durationMinutes}分钟的${tagInfo}已结束。`);
        
        if (this.ui.selectedCandle && this.ui.selectedCandle.id === candle.id) {
            this.ui.updateActionButtons();
        }
        
        this.updateBreathingLight();
        this.saveCandles();
        this.checkUnlocks();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        StorageManager.saveSettings(this.settings);
        
        this.candles.forEach(candle => {
            candle.setSettings(this.settings);
        });
    }

    applySettings() {
        if (this.settings.bgBrightness !== undefined) {
            const adjustedBrightness = Math.max(20, this.settings.bgBrightness);
            this.ui.applyBackgroundBrightness(adjustedBrightness);
        }
        
        if (this.settings.keepAwake) {
            this.ui.applyKeepAwake(true);
        }
        
        if (this.settings.ambientSound !== undefined) {
            audioManager.setAmbientSound(this.settings.ambientSound);
        }
        
        if (this.settings.whiteNoise !== undefined) {
            audioManager.setWhiteNoise(this.settings.whiteNoise);
        }
    }

    updateAddButtonState() {
        this.ui.updateAddButtonState(this.candles.length < MAX_CANDLES);
    }

    updateBreathingLight() {
        const hasBurning = this.candles.some(c => c.state === CANDLE_STATE.BURNING);
        this.ui.updateBreathingLight(hasBurning);
    }

    checkUnlocks() {
        const newUnlocks = StorageManager.checkUnlocks();
        if (newUnlocks.length > 0) {
            const names = newUnlocks.map(id => {
                const type = CANDLE_TYPES[id];
                return type ? `${type.icon} ${type.name}` : id;
            }).join('、');
            alert(`🎉 恭喜解锁新蜡烛：${names}`);
        }
    }

    saveCandles() {
        StorageManager.saveCandles(this.candles);
    }

    startAutoSave() {
        this.saveInterval = setInterval(() => {
            this.saveCandles();
        }, 5000);
    }

    setupVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveCandles();
            }
        });
        
        window.addEventListener('beforeunload', () => {
            this.saveCandles();
        });
    }

    destroy() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
        }
        
        this.candles.forEach(candle => candle.destroy());
        this.candles = [];
        
        audioManager.destroy();
    }
}

let app = null;

document.addEventListener('DOMContentLoaded', async () => {
    app = new CandleTimerApp();
    await app.init();
    window.candleTimerApp = app;
});

export { CandleTimerApp };
