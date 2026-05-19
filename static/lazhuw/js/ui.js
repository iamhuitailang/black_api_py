import { CANDLE_TYPES, TAGS, PRESET_TIMES, CANDLE_STATE, formatTime, formatDate } from './config.js';
import { StorageManager } from './storage.js';
import { audioManager } from './audio.js';

class UIManager {
    constructor(app) {
        this.app = app;
        this.selectedCandle = null;
        this.elements = {};
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements = {
            candlesContainer: document.getElementById('candlesContainer'),
            controlPanel: document.getElementById('controlPanel'),
            panelTitle: document.getElementById('panelTitle'),
            btnClosePanel: document.getElementById('btnClosePanel'),
            timeDisplay: document.getElementById('timeDisplay'),
            timeSlider: document.getElementById('timeSlider'),
            btnTimeDown: document.getElementById('btnTimeDown'),
            btnTimeUp: document.getElementById('btnTimeUp'),
            presetButtons: document.querySelectorAll('.preset-btn'),
            tagButtons: document.querySelectorAll('.tag-btn'),
            candleTypeList: document.getElementById('candleTypeList'),
            btnLight: document.getElementById('btnLight'),
            btnExtinguish: document.getElementById('btnExtinguish'),
            btnDelete: document.getElementById('btnDelete'),
            btnAddCandle: document.getElementById('btnAddCandle'),
            btnSettings: document.getElementById('btnSettings'),
            btnHistory: document.getElementById('btnHistory'),
            settingsModal: document.getElementById('settingsModal'),
            historyModal: document.getElementById('historyModal'),
            flickerSpeed: document.getElementById('flickerSpeed'),
            burnSpeed: document.getElementById('burnSpeed'),
            bgBrightness: document.getElementById('bgBrightness'),
            bgBrightnessValue: document.getElementById('bgBrightnessValue'),
            waxDrip: document.getElementById('waxDrip'),
            ambientSound: document.getElementById('ambientSound'),
            keepAwake: document.getElementById('keepAwake'),
            vibration: document.getElementById('vibration'),
            whiteNoise: document.getElementById('whiteNoise'),
            totalSessions: document.getElementById('totalSessions'),
            totalMinutes: document.getElementById('totalMinutes'),
            streakDays: document.getElementById('streakDays'),
            historyList: document.getElementById('historyList'),
            btnClearHistory: document.getElementById('btnClearHistory'),
            breathingLight: document.getElementById('breathingLight'),
            closeButtons: document.querySelectorAll('[data-close]')
        };
    }

    initEventListeners() {
        this.elements.btnClosePanel.addEventListener('click', () => this.closeControlPanel());
        
        this.elements.timeSlider.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value);
            this.updateTimeDisplay(minutes * 60);
            if (this.selectedCandle) {
                this.selectedCandle.setDuration(minutes);
            }
        });
        
        this.elements.btnTimeDown.addEventListener('click', () => this.adjustTime(-1));
        this.elements.btnTimeUp.addEventListener('click', () => this.adjustTime(1));
        
        this.elements.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes);
                this.setPresetTime(minutes);
            });
        });
        
        this.elements.tagButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tag = e.target.dataset.tag;
                this.setTag(tag);
            });
        });
        
        this.elements.btnLight.addEventListener('click', () => {
            if (this.selectedCandle) {
                this.selectedCandle.light();
            }
        });
        
        this.elements.btnExtinguish.addEventListener('click', () => {
            if (this.selectedCandle) {
                this.selectedCandle.extinguish();
            }
        });
        
        this.elements.btnDelete.addEventListener('click', () => {
            if (this.selectedCandle) {
                if (confirm('确定要删除这根蜡烛吗？')) {
                    this.app.removeCandle(this.selectedCandle.id);
                    this.closeControlPanel();
                }
            }
        });
        
        this.elements.btnAddCandle.addEventListener('click', () => {
            this.app.addCandle();
        });
        
        this.elements.btnSettings.addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        this.elements.btnHistory.addEventListener('click', () => {
            this.openHistoryModal();
        });
        
        this.elements.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.dataset.close;
                this.closeModal(modalId);
            });
        });
        
        this.elements.flickerSpeed.addEventListener('change', (e) => {
            this.app.updateSettings({ flickerSpeed: e.target.value });
        });
        
        this.elements.burnSpeed.addEventListener('change', (e) => {
            this.app.updateSettings({ burnSpeed: e.target.value });
        });
        
        this.elements.bgBrightness.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.elements.bgBrightnessValue.textContent = `${value}%`;
            this.app.updateSettings({ bgBrightness: value });
            this.applyBackgroundBrightness(value);
        });
        
        this.elements.waxDrip.addEventListener('change', (e) => {
            this.app.updateSettings({ waxDrip: e.target.checked });
        });
        
        this.elements.ambientSound.addEventListener('change', (e) => {
            this.app.updateSettings({ ambientSound: e.target.checked });
            audioManager.setAmbientSound(e.target.checked);
        });
        
        this.elements.keepAwake.addEventListener('change', (e) => {
            this.app.updateSettings({ keepAwake: e.target.checked });
            this.applyKeepAwake(e.target.checked);
        });
        
        this.elements.vibration.addEventListener('change', (e) => {
            this.app.updateSettings({ vibration: e.target.checked });
        });
        
        this.elements.whiteNoise.addEventListener('change', (e) => {
            this.app.updateSettings({ whiteNoise: e.target.value });
            audioManager.setWhiteNoise(e.target.value);
        });
        
        this.elements.btnClearHistory.addEventListener('click', () => {
            if (confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
                StorageManager.clearHistory();
                this.renderHistory();
            }
        });
        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
    }

    openControlPanel(candle) {
        this.selectedCandle = candle;
        this.elements.controlPanel.classList.remove('hidden');
        
        const tagInfo = TAGS[candle.tag];
        this.elements.panelTitle.textContent = `${tagInfo?.icon || '🕯️'} ${tagInfo?.name || '设置蜡烛'}`;
        
        this.updateTimeDisplay(candle.durationMinutes * 60);
        this.elements.timeSlider.value = candle.durationMinutes;
        
        this.elements.presetButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes) === candle.durationMinutes);
        });
        
        this.elements.tagButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tag === candle.tag);
        });
        
        this.renderCandleTypes();
        this.updateActionButtons();
    }

    closeControlPanel() {
        this.elements.controlPanel.classList.add('hidden');
        if (this.selectedCandle) {
            this.selectedCandle.setSelected(false);
        }
        this.selectedCandle = null;
    }

    updateTimeDisplay(seconds) {
        this.elements.timeDisplay.textContent = formatTime(seconds);
    }

    adjustTime(delta) {
        if (!this.selectedCandle) return;
        
        const newMinutes = this.selectedCandle.durationMinutes + delta;
        const candleType = CANDLE_TYPES[this.selectedCandle.type];
        const minTime = candleType?.minTime || 1;
        const maxTime = candleType?.maxTime || 120;
        
        if (newMinutes >= minTime && newMinutes <= maxTime) {
            this.selectedCandle.setDuration(newMinutes);
            this.elements.timeSlider.value = newMinutes;
            this.updateTimeDisplay(newMinutes * 60);
            
            this.elements.presetButtons.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.minutes) === newMinutes);
            });
        }
    }

    setPresetTime(minutes) {
        if (!this.selectedCandle) return;
        
        this.selectedCandle.setDuration(minutes);
        this.elements.timeSlider.value = minutes;
        this.updateTimeDisplay(minutes * 60);
        
        this.elements.presetButtons.forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.minutes) === minutes);
        });
    }

    setTag(tag) {
        if (!this.selectedCandle) return;
        
        this.selectedCandle.setTag(tag);
        
        this.elements.tagButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tag === tag);
        });
        
        if (this.selectedCandle.durationMinutes) {
            this.elements.timeSlider.value = this.selectedCandle.durationMinutes;
            this.updateTimeDisplay(this.selectedCandle.durationMinutes * 60);
            
            this.elements.presetButtons.forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.minutes) === this.selectedCandle.durationMinutes);
            });
        }
        
        const tagInfo = TAGS[tag];
        this.elements.panelTitle.textContent = `${tagInfo?.icon || '🕯️'} ${tagInfo?.name || '设置蜡烛'}`;
    }

    renderCandleTypes() {
        const stats = StorageManager.loadStats();
        const unlockedTypes = stats.unlockedCandles || ['classic'];
        
        this.elements.candleTypeList.innerHTML = '';
        
        Object.values(CANDLE_TYPES).forEach(type => {
            const isUnlocked = unlockedTypes.includes(type.id);
            const isSelected = this.selectedCandle && this.selectedCandle.type === type.id;
            
            const item = document.createElement('div');
            item.className = `candle-type-item ${isSelected ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
            
            const previewStyle = type.color === 'rainbow'
                ? `background: linear-gradient(135deg, ${type.gradient.join(', ')});`
                : `background: ${type.gradient[1]};`;
            
            item.innerHTML = `
                <div class="candle-type-preview" style="${previewStyle}"></div>
                <div class="candle-type-name">${type.icon} ${type.name}</div>
                <div class="candle-type-condition">${isUnlocked ? '已解锁' : type.condition}</div>
            `;
            
            if (isUnlocked) {
                item.addEventListener('click', () => {
                    if (this.selectedCandle) {
                        this.selectedCandle.setType(type.id);
                        this.renderCandleTypes();
                        
                        const candleType = CANDLE_TYPES[type.id];
                        if (this.selectedCandle.durationMinutes > candleType.maxTime) {
                            this.elements.timeSlider.max = candleType.maxTime;
                            this.elements.timeSlider.value = candleType.maxTime;
                            this.updateTimeDisplay(candleType.maxTime * 60);
                        } else {
                            this.elements.timeSlider.max = candleType.maxTime;
                        }
                    }
                });
            }
            
            this.elements.candleTypeList.appendChild(item);
        });
    }

    updateActionButtons() {
        if (!this.selectedCandle) return;
        
        const state = this.selectedCandle.state;
        
        if (state === CANDLE_STATE.BURNING) {
            this.elements.btnLight.classList.add('hidden');
            this.elements.btnExtinguish.classList.remove('hidden');
            this.elements.btnDelete.classList.remove('hidden');
        } else if (state === CANDLE_STATE.EXTINGUISHED || state === CANDLE_STATE.COMPLETED) {
            this.elements.btnLight.classList.remove('hidden');
            this.elements.btnLight.textContent = '🔥 重新点燃';
            this.elements.btnExtinguish.classList.add('hidden');
            this.elements.btnDelete.classList.remove('hidden');
        } else {
            this.elements.btnLight.classList.remove('hidden');
            this.elements.btnLight.textContent = '🔥 点燃蜡烛';
            this.elements.btnExtinguish.classList.add('hidden');
            this.elements.btnDelete.classList.remove('hidden');
        }
    }

    updateAddButtonState(canAdd) {
        this.elements.btnAddCandle.disabled = !canAdd;
        this.elements.btnAddCandle.querySelector('.add-text').textContent = 
            canAdd ? '添加蜡烛' : '已达最大数量';
    }

    openSettingsModal() {
        const settings = this.app.settings;
        
        this.elements.flickerSpeed.value = settings.flickerSpeed;
        this.elements.burnSpeed.value = settings.burnSpeed;
        this.elements.bgBrightness.value = settings.bgBrightness;
        this.elements.bgBrightnessValue.textContent = `${settings.bgBrightness}%`;
        this.elements.waxDrip.checked = settings.waxDrip;
        this.elements.ambientSound.checked = settings.ambientSound;
        this.elements.keepAwake.checked = settings.keepAwake;
        this.elements.vibration.checked = settings.vibration;
        this.elements.whiteNoise.value = settings.whiteNoise;
        
        this.elements.settingsModal.classList.remove('hidden');
    }

    openHistoryModal() {
        this.renderHistory();
        this.elements.historyModal.classList.remove('hidden');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    renderHistory() {
        const history = StorageManager.loadHistory();
        const stats = StorageManager.loadStats();
        
        this.elements.totalSessions.textContent = stats.totalSessions;
        this.elements.totalMinutes.textContent = stats.totalMinutes;
        this.elements.streakDays.textContent = stats.streakDays;
        
        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="empty-history">暂无历史记录</p>';
            return;
        }
        
        this.elements.historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-item-left">
                    <span class="history-tag">${item.tagIcon || '✏️'}</span>
                    <div class="history-info">
                        <div class="history-duration">${item.duration}分钟</div>
                        <div class="history-date">${formatDate(item.completedAt || item.startedAt)}</div>
                    </div>
                </div>
                <span class="history-candle-type">${item.candleTypeIcon || '🕯️'} ${item.candleTypeName || '经典白蜡'}</span>
            </div>
        `).join('');
    }

    applyBackgroundBrightness(value) {
        const minBrightness = 20;
        const adjustedValue = Math.max(minBrightness, value);
        const brightness = adjustedValue / 100;
        document.body.style.filter = `brightness(${brightness})`;
    }

    applyKeepAwake(enabled) {
        if ('wakeLock' in navigator) {
            if (enabled) {
                navigator.wakeLock.request('screen').catch(err => {
                    console.log('Wake Lock error:', err);
                });
            }
        }
    }

    updateBreathingLight(hasBurningCandles) {
        if (hasBurningCandles) {
            this.elements.breathingLight.classList.add('active');
        } else {
            this.elements.breathingLight.classList.remove('active');
        }
    }

    showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('烛光计时', {
                body: message,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🕯️</text></svg>'
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

export { UIManager };
