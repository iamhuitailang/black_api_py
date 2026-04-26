class PomodoroTimer {
    constructor() {
        console.log('=== PomodoroTimer 初始化 ===');
        
        this.defaultSettings = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            pomodorosBeforeLongBreak: 4,
            enableLongBreak: true,
            enableSound: true,
            enableNotification: true
        };
        
        this.settings = this.loadSettings();
        console.log('设置:', this.settings);
        
        this.workSeconds = this.settings.workDuration * 60;
        this.breakSeconds = this.settings.breakDuration * 60;
        this.longBreakSeconds = this.settings.longBreakDuration * 60;
        
        this.initElements();
        
        this.modeTimes = {
            work: this.workSeconds,
            break: this.breakSeconds,
            longBreak: this.longBreakSeconds
        };
        
        this.totalTimes = {
            work: this.workSeconds,
            break: this.breakSeconds,
            longBreak: this.longBreakSeconds
        };
        
        this.currentMode = 'work';
        this.timeRemaining = this.modeTimes[this.currentMode];
        this.totalTime = this.totalTimes[this.currentMode];
        this.isRunning = false;
        this.pomodoroCount = 0;
        this.todayCount = 0;
        this.timerInterval = null;
        this.notificationTimeout = null;
        
        this.loadAppState();
        console.log('加载状态后:', {
            currentMode: this.currentMode,
            modeTimes: this.modeTimes,
            timeRemaining: this.timeRemaining
        });
        
        this.initEventListeners();
        
        this.updateUI();
        this.updatePomodoroCount();
        this.requestNotificationPermission();
        
        window.addEventListener('beforeunload', () => {
            console.log('页面关闭前保存状态');
            this.saveAppState();
        });
        
        console.log('=== 初始化完成 ===');
    }
    
    initElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.statusText = document.getElementById('statusText');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.workModeBtn = document.getElementById('workModeBtn');
        this.breakModeBtn = document.getElementById('breakModeBtn');
        this.pomodoroCountEl = document.getElementById('pomodoroCount');
        this.progressRing = document.querySelector('.progress-ring-progress');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsModal = document.getElementById('settingsModal');
        this.modalClose = document.getElementById('modalClose');
        this.saveSettings = document.getElementById('saveSettings');
        this.cancelSettings = document.getElementById('cancelSettings');
        this.notification = document.getElementById('notification');
        this.notificationIcon = document.getElementById('notificationIcon');
        this.notificationText = document.getElementById('notificationText');
        
        this.workDurationInput = document.getElementById('workDuration');
        this.breakDurationInput = document.getElementById('breakDuration');
        this.longBreakDurationInput = document.getElementById('longBreakDuration');
        this.pomodorosBeforeLongBreakInput = document.getElementById('pomodorosBeforeLongBreak');
        this.enableLongBreakInput = document.getElementById('enableLongBreak');
        this.enableSoundInput = document.getElementById('enableSound');
        this.enableNotificationInput = document.getElementById('enableNotification');
    }
    
    initEventListeners() {
        this.startBtn.addEventListener('click', () => {
            console.log('点击开始按钮');
            this.start();
        });
        
        this.pauseBtn.addEventListener('click', () => {
            console.log('点击暂停按钮');
            this.pause();
        });
        
        this.resetBtn.addEventListener('click', () => {
            console.log('点击重置按钮');
            this.reset();
        });
        
        this.workModeBtn.addEventListener('click', () => {
            console.log('点击工作模式按钮');
            this.switchMode('work');
        });
        
        this.breakModeBtn.addEventListener('click', () => {
            console.log('点击休息模式按钮');
            this.switchMode('break');
        });
        
        this.settingsToggle.addEventListener('click', () => this.openSettings());
        this.modalClose.addEventListener('click', () => this.closeSettings());
        this.saveSettings.addEventListener('click', () => this.saveSettingsModal());
        this.cancelSettings.addEventListener('click', () => this.closeSettings());
        
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            } else if (e.code === 'Escape') {
                this.reset();
            }
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('pomodoroSettings');
        if (saved) {
            try {
                return { ...this.defaultSettings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
        return { ...this.defaultSettings };
    }
    
    saveSettingsToStorage() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        console.log('设置已保存');
    }
    
    loadAppState() {
        const today = new Date().toDateString();
        const savedState = localStorage.getItem('pomodoroAppState');
        
        console.log('从 localStorage 加载状态:', savedState);
        
        if (!savedState) {
            console.log('没有保存的状态，使用默认值');
            return;
        }
        
        try {
            const state = JSON.parse(savedState);
            console.log('解析的状态:', state);
            
            if (state.date !== today) {
                console.log('日期不匹配，重置状态');
                return;
            }
            
            if (state.currentMode) {
                this.currentMode = state.currentMode;
            }
            if (typeof state.pomodoroCount === 'number') {
                this.pomodoroCount = state.pomodoroCount;
            }
            if (typeof state.todayCount === 'number') {
                this.todayCount = state.todayCount;
            }
            
            if (state.modeTimes && typeof state.modeTimes === 'object') {
                if (typeof state.modeTimes.work === 'number' && state.modeTimes.work >= 0) {
                    this.modeTimes.work = state.modeTimes.work;
                }
                if (typeof state.modeTimes.break === 'number' && state.modeTimes.break >= 0) {
                    this.modeTimes.break = state.modeTimes.break;
                }
                if (typeof state.modeTimes.longBreak === 'number' && state.modeTimes.longBreak >= 0) {
                    this.modeTimes.longBreak = state.modeTimes.longBreak;
                }
            }
            
            if (state.totalTimes && typeof state.totalTimes === 'object') {
                if (typeof state.totalTimes.work === 'number' && state.totalTimes.work > 0) {
                    this.totalTimes.work = state.totalTimes.work;
                }
                if (typeof state.totalTimes.break === 'number' && state.totalTimes.break > 0) {
                    this.totalTimes.break = state.totalTimes.break;
                }
                if (typeof state.totalTimes.longBreak === 'number' && state.totalTimes.longBreak > 0) {
                    this.totalTimes.longBreak = state.totalTimes.longBreak;
                }
            }
            
            this.timeRemaining = this.modeTimes[this.currentMode];
            this.totalTime = this.totalTimes[this.currentMode];
            
            console.log('状态加载成功:', {
                currentMode: this.currentMode,
                modeTimes: this.modeTimes,
                timeRemaining: this.timeRemaining
            });
            
        } catch (e) {
            console.error('加载状态失败:', e);
        }
    }
    
    saveAppState() {
        this.modeTimes[this.currentMode] = this.timeRemaining;
        this.totalTimes[this.currentMode] = this.totalTime;
        
        const state = {
            date: new Date().toDateString(),
            currentMode: this.currentMode,
            pomodoroCount: this.pomodoroCount,
            todayCount: this.todayCount,
            modeTimes: {
                work: this.modeTimes.work,
                break: this.modeTimes.break,
                longBreak: this.modeTimes.longBreak
            },
            totalTimes: {
                work: this.totalTimes.work,
                break: this.totalTimes.break,
                longBreak: this.totalTimes.longBreak
            }
        };
        
        localStorage.setItem('pomodoroAppState', JSON.stringify(state));
        console.log('状态已保存:', state);
    }
    
    saveTodayCount() {
        const today = new Date().toDateString();
        localStorage.setItem('pomodoroToday', JSON.stringify({
            date: today,
            count: this.todayCount
        }));
    }
    
    start() {
        if (this.isRunning) {
            console.log('已经在运行中');
            return;
        }
        
        console.log('开始计时, 当前模式:', this.currentMode, '剩余时间:', this.timeRemaining);
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.startBtn.style.opacity = '0.5';
        this.pauseBtn.disabled = false;
        this.pauseBtn.style.opacity = '1';
        
        this.timerInterval = setInterval(() => {
            this.tick();
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning) {
            console.log('没有在运行');
            return;
        }
        
        console.log('暂停计时, 当前模式:', this.currentMode, '剩余时间:', this.timeRemaining);
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.startBtn.style.opacity = '1';
        this.pauseBtn.disabled = true;
        this.pauseBtn.style.opacity = '0.5';
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.saveAppState();
    }
    
    reset() {
        this.pause();
        
        console.log('重置当前模式:', this.currentMode);
        
        if (this.currentMode === 'work') {
            this.timeRemaining = this.workSeconds;
            this.totalTime = this.workSeconds;
            this.modeTimes.work = this.timeRemaining;
            this.totalTimes.work = this.totalTime;
        } else if (this.currentMode === 'break') {
            this.timeRemaining = this.breakSeconds;
            this.totalTime = this.breakSeconds;
            this.modeTimes.break = this.timeRemaining;
            this.totalTimes.break = this.totalTime;
        } else if (this.currentMode === 'longBreak') {
            this.timeRemaining = this.longBreakSeconds;
            this.totalTime = this.longBreakSeconds;
            this.modeTimes.longBreak = this.timeRemaining;
            this.totalTimes.longBreak = this.totalTime;
        }
        
        console.log('重置后时间:', this.timeRemaining);
        
        this.saveAppState();
        this.updateUI();
    }
    
    tick() {
        if (this.timeRemaining > 0) {
            this.timeRemaining--;
            this.modeTimes[this.currentMode] = this.timeRemaining;
            
            if (this.timeRemaining % 5 === 0) {
                this.saveAppState();
            }
            
            this.updateUI();
        } else {
            this.complete();
        }
    }
    
    complete() {
        this.pause();
        
        console.log('计时完成, 当前模式:', this.currentMode);
        
        if (this.currentMode === 'work') {
            this.pomodoroCount++;
            this.todayCount++;
            this.saveTodayCount();
            
            this.modeTimes.work = this.workSeconds;
            this.totalTimes.work = this.workSeconds;
            
            this.updatePomodoroCount();
            this.showNotification('☕', '工作时间结束！该休息了');
            this.playSound();
            this.sendBrowserNotification('工作时间结束！', '该休息一下了。');
            
            this.saveAppState();
            
            if (this.settings.enableLongBreak && this.pomodoroCount % this.settings.pomodorosBeforeLongBreak === 0) {
                setTimeout(() => {
                    this.switchMode('longBreak');
                }, 6000);
            } else {
                setTimeout(() => {
                    this.switchMode('break');
                }, 6000);
            }
        } else {
            if (this.currentMode === 'break') {
                this.modeTimes.break = this.breakSeconds;
                this.totalTimes.break = this.breakSeconds;
            } else if (this.currentMode === 'longBreak') {
                this.modeTimes.longBreak = this.longBreakSeconds;
                this.totalTimes.longBreak = this.longBreakSeconds;
            }
            
            this.showNotification('🛠️', '休息结束！继续工作');
            this.playSound();
            this.sendBrowserNotification('休息结束！', '继续专注工作吧。');
            
            this.saveAppState();
            
            setTimeout(() => {
                this.switchMode('work');
            }, 6000);
        }
    }
    
    switchMode(targetMode) {
        console.log('=== 切换模式开始 ===');
        console.log('当前模式:', this.currentMode);
        console.log('目标模式:', targetMode);
        console.log('切换前 modeTimes:', JSON.stringify(this.modeTimes));
        console.log('切换前 timeRemaining:', this.timeRemaining);
        
        if (targetMode === this.currentMode) {
            console.log('目标模式与当前模式相同，不切换');
            return;
        }
        
        const wasRunning = this.isRunning;
        
        if (wasRunning) {
            console.log('计时器正在运行，先暂停');
            this.pause();
        }
        
        console.log('保存当前模式时间:', this.currentMode, '->', this.timeRemaining);
        this.modeTimes[this.currentMode] = this.timeRemaining;
        this.totalTimes[this.currentMode] = this.totalTime;
        
        console.log('保存后 modeTimes:', JSON.stringify(this.modeTimes));
        
        this.currentMode = targetMode;
        
        console.log('切换到新模式:', targetMode);
        console.log('新模式的时间:', this.modeTimes[targetMode]);
        
        let targetTime = this.modeTimes[targetMode];
        let targetTotal = this.totalTimes[targetMode];
        
        if (targetTime === undefined || targetTime < 0 || isNaN(targetTime)) {
            console.log('目标模式时间无效，使用默认值');
            if (targetMode === 'work') {
                targetTime = this.workSeconds;
                targetTotal = this.workSeconds;
            } else if (targetMode === 'break') {
                targetTime = this.breakSeconds;
                targetTotal = this.breakSeconds;
            } else if (targetMode === 'longBreak') {
                targetTime = this.longBreakSeconds;
                targetTotal = this.longBreakSeconds;
            }
            this.modeTimes[targetMode] = targetTime;
            this.totalTimes[targetMode] = targetTotal;
        }
        
        this.timeRemaining = targetTime;
        this.totalTime = targetTotal;
        
        console.log('设置 timeRemaining:', this.timeRemaining);
        console.log('设置 totalTime:', this.totalTime);
        
        if (targetMode === 'work') {
            this.statusText.textContent = '🛠️ 工作时间';
            document.body.className = 'mode-work';
        } else if (targetMode === 'break') {
            this.statusText.textContent = '☕ 休息时间';
            document.body.className = 'mode-break';
        } else if (targetMode === 'longBreak') {
            this.statusText.textContent = '🌴 长休息时间';
            document.body.className = 'mode-break';
        }
        
        this.workModeBtn.classList.toggle('active', targetMode === 'work');
        this.breakModeBtn.classList.toggle('active', targetMode !== 'work');
        
        this.saveAppState();
        this.updateUI();
        
        console.log('切换后 modeTimes:', JSON.stringify(this.modeTimes));
        console.log('切换后 timeRemaining:', this.timeRemaining);
        console.log('=== 切换模式完成 ===');
    }
    
    updateUI() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        this.updateProgressRing();
    }
    
    updateProgressRing() {
        const radius = this.progressRing.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        
        this.progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.progressRing.style.strokeDashoffset = circumference;
        
        const progress = this.totalTime > 0 ? this.timeRemaining / this.totalTime : 1;
        const offset = circumference * (1 - progress);
        this.progressRing.style.strokeDashoffset = offset;
    }
    
    updatePomodoroCount() {
        this.pomodoroCountEl.textContent = `🏆 今日已完成: ${this.todayCount}`;
    }
    
    showNotification(icon, text) {
        this.notificationIcon.textContent = icon;
        this.notificationText.textContent = text;
        this.notification.classList.add('active');
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        this.notificationTimeout = setTimeout(() => {
            this.notification.classList.remove('active');
        }, 6000);
    }
    
    playSound() {
        if (!this.settings.enableSound) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            
            setTimeout(() => {
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();
                
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                
                oscillator2.type = 'sine';
                oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
                oscillator2.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
                
                gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator2.start(audioContext.currentTime);
                oscillator2.stop(audioContext.currentTime + 0.5);
            }, 600);
        } catch (e) {
            console.log('无法播放声音:', e);
        }
    }
    
    requestNotificationPermission() {
        if (this.settings.enableNotification && 'Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    sendBrowserNotification(title, body) {
        if (!this.settings.enableNotification) return;
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '🍅'
            });
        }
    }
    
    openSettings() {
        this.workDurationInput.value = this.settings.workDuration;
        this.breakDurationInput.value = this.settings.breakDuration;
        this.longBreakDurationInput.value = this.settings.longBreakDuration;
        this.pomodorosBeforeLongBreakInput.value = this.settings.pomodorosBeforeLongBreak;
        this.enableLongBreakInput.checked = this.settings.enableLongBreak;
        this.enableSoundInput.checked = this.settings.enableSound;
        this.enableNotificationInput.checked = this.settings.enableNotification;
        
        this.settingsModal.classList.add('active');
    }
    
    closeSettings() {
        this.settingsModal.classList.remove('active');
    }
    
    saveSettingsModal() {
        const workDuration = parseInt(this.workDurationInput.value) || 25;
        const breakDuration = parseInt(this.breakDurationInput.value) || 5;
        const longBreakDuration = parseInt(this.longBreakDurationInput.value) || 15;
        const pomodorosBeforeLongBreak = parseInt(this.pomodorosBeforeLongBreakInput.value) || 4;
        
        const oldWorkDuration = this.settings.workDuration;
        const oldBreakDuration = this.settings.breakDuration;
        const oldLongBreakDuration = this.settings.longBreakDuration;
        
        this.settings = {
            workDuration: Math.max(1, Math.min(60, workDuration)),
            breakDuration: Math.max(1, Math.min(30, breakDuration)),
            longBreakDuration: Math.max(1, Math.min(60, longBreakDuration)),
            pomodorosBeforeLongBreak: Math.max(1, Math.min(10, pomodorosBeforeLongBreak)),
            enableLongBreak: this.enableLongBreakInput.checked,
            enableSound: this.enableSoundInput.checked,
            enableNotification: this.enableNotificationInput.checked
        };
        
        this.saveSettingsToStorage();
        
        if (this.enableNotificationInput.checked) {
            this.requestNotificationPermission();
        }
        
        if (!this.isRunning) {
            const newWorkSeconds = this.settings.workDuration * 60;
            const newBreakSeconds = this.settings.breakDuration * 60;
            const newLongBreakSeconds = this.settings.longBreakDuration * 60;
            
            if (oldWorkDuration !== this.settings.workDuration) {
                this.workSeconds = newWorkSeconds;
                this.modeTimes.work = newWorkSeconds;
                this.totalTimes.work = newWorkSeconds;
            }
            if (oldBreakDuration !== this.settings.breakDuration) {
                this.breakSeconds = newBreakSeconds;
                this.modeTimes.break = newBreakSeconds;
                this.totalTimes.break = newBreakSeconds;
            }
            if (oldLongBreakDuration !== this.settings.longBreakDuration) {
                this.longBreakSeconds = newLongBreakSeconds;
                this.modeTimes.longBreak = newLongBreakSeconds;
                this.totalTimes.longBreak = newLongBreakSeconds;
            }
            
            this.timeRemaining = this.modeTimes[this.currentMode];
            this.totalTime = this.totalTimes[this.currentMode];
            
            this.saveAppState();
            this.updateUI();
        }
        
        this.closeSettings();
        this.showNotification('⚙️', '设置已保存');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
