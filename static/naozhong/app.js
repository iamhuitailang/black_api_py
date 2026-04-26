class PetAlarm {
    constructor() {
        this.currentPet = 'cat';
        this.mode = 'countdown';
        
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.totalTime = 0;
        this.startTimestamp = 0;
        this.pausedTimestamp = 0;
        
        this.alarmTime = null;
        this.alarmCheckInterval = null;
        
        this.repeatEnabled = false;
        this.repeatType = 'infinite';
        this.repeatCount = 3;
        this.currentRepeat = 0;
        
        this.timerInterval = null;
        this.alarmActive = false;
        this.flashInterval = null;
        this.vibrateInterval = null;
        this.audioContext = null;
        this.animationFrame = null;
        
        this.pickerState = {
            hour: { value: 0, offset: 0 },
            minute: { value: 5, offset: 0 },
            second: { value: 0, offset: 0 }
        };
        
        this.animationState = {
            frame: 0,
            blinkFrame: 0,
            tailAngle: 0,
            tailDirection: 1,
            breathPhase: 0,
            eyePhase: 0,
            isBlinking: false
        };
        
        this.init();
    }

    init() {
        this.loadPickerDefaults();
        this.initCanvas();
        this.initEventListeners();
        this.loadState();
        this.renderPet();
        this.requestAnimationFrame(this.update.bind(this));
    }

    loadPickerDefaults() {
        const savedHour = localStorage.getItem('petAlarm_hour');
        const savedMinute = localStorage.getItem('petAlarm_minute');
        const savedSecond = localStorage.getItem('petAlarm_second');
        
        if (savedHour !== null) this.pickerState.hour.value = parseInt(savedHour);
        if (savedMinute !== null) this.pickerState.minute.value = parseInt(savedMinute);
        if (savedSecond !== null) this.pickerState.second.value = parseInt(savedSecond);
    }

    initCanvas() {
        this.petCanvas = document.getElementById('petCanvas');
        this.alarmPetCanvas = document.getElementById('alarmPetCanvas');
        
        this.setupCanvas(this.petCanvas, 200);
        this.setupCanvas(this.alarmPetCanvas, 250);
    }

    setupCanvas(canvas, size) {
        const dpr = window.devicePixelRatio || 2;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, size };
    }

    initEventListeners() {
        document.getElementById('switchPet').addEventListener('click', () => {
            this.switchPet();
        });

        document.getElementById('countdownBtn').addEventListener('click', () => {
            this.setMode('countdown');
        });
        document.getElementById('alarmBtn').addEventListener('click', () => {
            this.setMode('alarm');
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const seconds = parseInt(btn.dataset.time);
                this.setPresetTime(seconds);
            });
        });

        document.getElementById('enableRepeat').addEventListener('change', (e) => {
            this.repeatEnabled = e.target.checked;
            const options = document.getElementById('repeatOptions');
            options.classList.toggle('hidden', !this.repeatEnabled);
            this.saveState();
        });

        document.querySelectorAll('input[name="repeatType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.repeatType = e.target.value;
                this.saveState();
            });
        });

        document.getElementById('repeatCount').addEventListener('change', (e) => {
            this.repeatCount = parseInt(e.target.value) || 3;
            this.saveState();
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startTimer();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeTimer();
            } else {
                this.pauseTimer();
            }
        });

        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopTimer();
        });

        document.getElementById('dismissBtn').addEventListener('click', () => {
            this.dismissAlarm();
        });
        document.getElementById('alarmPetCanvas').addEventListener('click', () => {
            this.dismissAlarm();
        });
        document.getElementById('alarmOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'alarmOverlay') {
                this.dismissAlarm();
            }
        });

        document.getElementById('alarmTime').addEventListener('change', (e) => {
            this.alarmTime = e.target.value;
            this.saveState();
        });

        document.getElementById('petCanvas').addEventListener('click', () => {
            if (this.alarmActive) {
                this.dismissAlarm();
            } else {
                this.playInteractionAnimation();
            }
        });

        this.initPickers();
    }

    initPickers() {
        this.createPicker('hourPicker', 0, 23, 'hour');
        this.createPicker('minutePicker', 0, 59, 'minute');
        this.createPicker('secondPicker', 0, 59, 'second');
    }

    createPicker(elementId, min, max, stateKey) {
        const container = document.getElementById(elementId);
        const wrapper = container.parentElement;
        
        if (!wrapper.querySelector('.center-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'center-indicator';
            wrapper.appendChild(indicator);
        }

        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        const items = [];
        const itemHeight = 60;
        const visibleCount = 5;
        
        for (let i = min; i <= max; i++) {
            const item = document.createElement('div');
            item.className = 'picker-item';
            item.textContent = i.toString().padStart(2, '0');
            item.dataset.value = i;
            container.appendChild(item);
            items.push(item);
        }

        let isDragging = false;
        let startY = 0;
        let currentOffset = 0;
        let initialOffset = 0;
        let lastY = 0;
        let lastTime = 0;
        let velocity = 0;
        let animationId = null;
        let momentumPhase = false;

        const updatePickerDisplay = (offset) => {
            const selectedIndex = Math.round(-offset / itemHeight);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, selectedIndex));
            
            container.style.transform = `translateY(${-clampedIndex * itemHeight}px)`;
            
            items.forEach((item, index) => {
                const distance = Math.abs(index - clampedIndex);
                const scale = Math.max(0.6, 1 - distance * 0.15);
                const opacity = Math.max(0.3, 1 - distance * 0.3);
                
                item.style.transform = `scale(${scale})`;
                item.style.opacity = opacity;
                
                if (distance === 0) {
                    item.classList.add('selected');
                    this.pickerState[stateKey].value = parseInt(item.dataset.value);
                } else {
                    item.classList.remove('selected');
                }
            });
        };

        const snapToNearest = (animate = true) => {
            const targetIndex = Math.round(-currentOffset / itemHeight);
            const clampedIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
            const targetOffset = -clampedIndex * itemHeight;
            
            if (animate) {
                const startValue = currentOffset;
                const endValue = targetOffset;
                const startTime = performance.now();
                const duration = 300;
                
                const animateSnap = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    currentOffset = startValue + (endValue - startValue) * easeProgress;
                    
                    updatePickerDisplay(currentOffset);
                    
                    if (progress < 1) {
                        animationId = requestAnimationFrame(animateSnap);
                    } else {
                        currentOffset = endValue;
                        this.updatePickerValues();
                    }
                };
                
                if (animationId) cancelAnimationFrame(animationId);
                animationId = requestAnimationFrame(animateSnap);
            } else {
                currentOffset = targetOffset;
                updatePickerDisplay(currentOffset);
                this.updatePickerValues();
            }
        };

        const handleStart = (e) => {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            isDragging = true;
            momentumPhase = false;
            
            const event = e.touches ? e.touches[0] : e;
            startY = event.clientY;
            lastY = event.clientY;
            lastTime = performance.now();
            initialOffset = currentOffset;
            velocity = 0;
            
            container.style.transition = 'none';
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            
            const event = e.touches ? e.touches[0] : e;
            const deltaY = event.clientY - lastY;
            
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime > 0) {
                const instantVelocity = deltaY / deltaTime * 10;
                velocity = velocity * 0.7 + instantVelocity * 0.3;
            }
            
            lastY = event.clientY;
            lastTime = currentTime;
            
            currentOffset = initialOffset + (event.clientY - startY);
            
            const maxOffset = 0;
            const minOffset = -(items.length - 1) * itemHeight;
            
            if (currentOffset > maxOffset) {
                currentOffset = maxOffset + (currentOffset - maxOffset) * 0.3;
            } else if (currentOffset < minOffset) {
                currentOffset = minOffset + (currentOffset - minOffset) * 0.3;
            }
            
            updatePickerDisplay(currentOffset);
        };

        const handleEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const maxOffset = 0;
            const minOffset = -(items.length - 1) * itemHeight;
            
            if (currentOffset > maxOffset) {
                currentOffset = maxOffset;
                snapToNearest(true);
            } else if (currentOffset < minOffset) {
                currentOffset = minOffset;
                snapToNearest(true);
            } else if (Math.abs(velocity) > 2) {
                momentumPhase = true;
                const deceleration = 0.95;
                const minVelocity = 0.1;
                
                const applyMomentum = () => {
                    if (!momentumPhase) return;
                    
                    velocity *= deceleration;
                    currentOffset += velocity;
                    
                    if (currentOffset > maxOffset) {
                        currentOffset = maxOffset;
                        velocity = 0;
                        momentumPhase = false;
                    } else if (currentOffset < minOffset) {
                        currentOffset = minOffset;
                        velocity = 0;
                        momentumPhase = false;
                    }
                    
                    updatePickerDisplay(currentOffset);
                    
                    if (Math.abs(velocity) > minVelocity && momentumPhase) {
                        animationId = requestAnimationFrame(applyMomentum);
                    } else {
                        snapToNearest(true);
                    }
                };
                
                applyMomentum();
            } else {
                snapToNearest(true);
            }
        };

        wrapper.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        
        wrapper.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);

        const initialIndex = this.pickerState[stateKey].value;
        currentOffset = -initialIndex * itemHeight;
        snapToNearest(false);
    }

    updatePickerValues() {
        localStorage.setItem('petAlarm_hour', this.pickerState.hour.value);
        localStorage.setItem('petAlarm_minute', this.pickerState.minute.value);
        localStorage.setItem('petAlarm_second', this.pickerState.second.value);
    }

    getPickerTime() {
        const hours = this.pickerState.hour.value;
        const minutes = this.pickerState.minute.value;
        const seconds = this.pickerState.second.value;
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    switchPet() {
        this.currentPet = this.currentPet === 'cat' ? 'dog' : 'cat';
        this.saveState();
    }

    setMode(mode) {
        this.mode = mode;
        
        document.getElementById('countdownBtn').classList.toggle('active', mode === 'countdown');
        document.getElementById('alarmBtn').classList.toggle('active', mode === 'alarm');
        document.getElementById('countdownPanel').classList.toggle('active', mode === 'countdown');
        document.getElementById('alarmPanel').classList.toggle('active', mode === 'alarm');
        
        this.saveState();
    }

    setPresetTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        this.pickerState.hour.value = hours;
        this.pickerState.minute.value = minutes;
        this.pickerState.second.value = secs;
        
        this.initPickers();
        this.updatePickerValues();
    }

    startTimer() {
        if (this.isRunning && !this.isPaused) return;

        if (this.mode === 'countdown') {
            if (!this.isPaused) {
                this.totalTime = this.getPickerTime();
                this.remainingTime = this.totalTime;
                this.currentRepeat = 0;
            }
            
            if (this.totalTime === 0) {
                alert('请设置倒计时时间');
                return;
            }
        } else {
            const timeInput = document.getElementById('alarmTime');
            if (!timeInput.value) {
                alert('请设置闹钟时间');
                return;
            }
            this.alarmTime = timeInput.value;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.startTimestamp = Date.now();

        document.getElementById('timerDisplay').classList.remove('hidden');
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('pauseBtn').classList.remove('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
        document.getElementById('pauseBtn').textContent = '暂停';

        if (this.mode === 'countdown') {
            document.getElementById('timerStatus').textContent = '倒计时中...';
            this.startCountdown();
        } else {
            document.getElementById('timerStatus').textContent = `闹钟已设置: ${this.alarmTime}`;
            this.startAlarmCheck();
        }

        this.saveState();
    }

    startCountdown() {
        this.updateTimeDisplay();
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            
            this.remainingTime--;
            this.updateTimeDisplay();
            this.saveState();

            if (this.remainingTime <= 0) {
                this.triggerAlarm();
            }
        }, 1000);
    }

    startAlarmCheck() {
        if (this.alarmCheckInterval) {
            clearInterval(this.alarmCheckInterval);
        }
        
        this.alarmCheckInterval = setInterval(() => {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            
            if (currentTime === this.alarmTime) {
                this.triggerAlarm();
            }
        }, 1000);
    }

    updateTimeDisplay() {
        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = this.remainingTime % 60;

        const timeText = document.getElementById('timeText');
        timeText.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.remainingTime <= 10 && this.remainingTime > 0) {
            timeText.classList.add('warning');
        } else {
            timeText.classList.remove('warning');
        }
    }

    pauseTimer() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        this.pausedTimestamp = Date.now();

        document.getElementById('pauseBtn').textContent = '继续';
        document.getElementById('timerStatus').textContent = '已暂停';
        
        this.saveState();
    }

    resumeTimer() {
        if (!this.isRunning || !this.isPaused) return;

        this.isPaused = false;
        this.startTimestamp = Date.now();
        
        if (this.mode === 'countdown') {
            document.getElementById('timerStatus').textContent = '倒计时中...';
            this.startCountdown();
        } else {
            document.getElementById('timerStatus').textContent = `闹钟已设置: ${this.alarmTime}`;
            this.startAlarmCheck();
        }
        
        document.getElementById('pauseBtn').textContent = '暂停';
        this.saveState();
    }

    stopTimer() {
        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.totalTime = 0;
        this.currentRepeat = 0;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.alarmCheckInterval) {
            clearInterval(this.alarmCheckInterval);
            this.alarmCheckInterval = null;
        }

        document.getElementById('timerDisplay').classList.add('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = '暂停';

        this.saveState();
    }

    triggerAlarm() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.alarmCheckInterval) {
            clearInterval(this.alarmCheckInterval);
            this.alarmCheckInterval = null;
        }

        this.alarmActive = true;
        this.isRunning = false;

        const overlay = document.getElementById('alarmOverlay');
        const message = document.getElementById('alarmMessage');
        
        message.textContent = this.currentPet === 'cat' ? '喵～时间到啦！' : '汪汪！起床啦！';
        overlay.classList.remove('hidden');

        this.startAlarmAnimation();
        this.playAlarmSound();
        this.startFlashing();
        this.startVibration();
    }

    startAlarmAnimation() {
        const canvas = this.alarmPetCanvas;
        const { ctx, size } = this.setupCanvas(canvas, 250);
        
        let jumpOffset = 0;
        let jumpVelocity = 0;
        let jumpGravity = 0.5;
        let mouthOpen = 0;
        let mouthPhase = 0;
        let frame = 0;
        let squish = 1;
        let squashPhase = 0;

        const animate = () => {
            if (!this.alarmActive) return;

            frame++;
            
            jumpVelocity += jumpGravity;
            jumpOffset += jumpVelocity;
            
            if (jumpOffset > 0) {
                jumpOffset = 0;
                jumpVelocity = -12;
                squashPhase = 1;
            }
            
            squish = 1;
            if (squashPhase > 0) {
                squashPhase -= 0.1;
                squish = 1 + Math.sin(squashPhase * Math.PI) * 0.3;
            }
            
            mouthPhase += 0.15;
            mouthOpen = (Math.sin(mouthPhase) + 1) / 2;

            ctx.clearRect(0, 0, size, size);
            
            ctx.save();
            ctx.translate(0, jumpOffset);
            ctx.scale(1 + (1 - squish) * 0.2, squish);
            
            if (this.currentPet === 'cat') {
                this.drawCuteCat(ctx, size, frame, mouthOpen, true);
            } else {
                this.drawCuteDog(ctx, size, frame, mouthOpen, true);
            }
            
            ctx.restore();
            
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    playAlarmSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const playSound = () => {
            if (!this.alarmActive) return;
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            const now = this.audioContext.currentTime;
            const variation = Math.random();
            
            if (this.currentPet === 'cat') {
                oscillator.type = 'sine';
                
                if (variation < 0.33) {
                    oscillator.frequency.setValueAtTime(600, now);
                    oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.1);
                    oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.25);
                    gainNode.gain.setValueAtTime(0.35, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                } else if (variation < 0.66) {
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(800, now);
                    oscillator.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
                    oscillator.frequency.exponentialRampToValueAtTime(850, now + 0.2);
                    oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.4);
                    gainNode.gain.setValueAtTime(0.3, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                } else {
                    oscillator.frequency.setValueAtTime(500, now);
                    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
                    oscillator.frequency.linearRampToValueAtTime(850, now + 0.2);
                    oscillator.frequency.exponentialRampToValueAtTime(650, now + 0.5);
                    gainNode.gain.setValueAtTime(0.35, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
                }
                
                oscillator.start(now);
                oscillator.stop(now + 0.7);
            } else {
                const playBark = (startTime, pitchShift = 0) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    filter.type = 'lowpass';
                    filter.frequency.value = 1000 + pitchShift * 200;
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(250 + pitchShift * 50, startTime);
                    osc.frequency.exponentialRampToValueAtTime(150 + pitchShift * 30, startTime + 0.08);
                    
                    gain.gain.setValueAtTime(0.35, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.12);
                };
                
                const barkCount = 2 + Math.floor(Math.random() * 2);
                for (let i = 0; i < barkCount; i++) {
                    playBark(now + i * 0.15, i * 0.3);
                }
            }
        };

        const interval = this.currentPet === 'cat' ? 700 : 400;
        const soundInterval = setInterval(() => {
            if (!this.alarmActive) {
                clearInterval(soundInterval);
                return;
            }
            playSound();
        }, interval);

        setTimeout(() => {
            clearInterval(soundInterval);
        }, 8000);
    }

    startFlashing() {
        const overlay = document.getElementById('alarmOverlay');
        overlay.classList.add('flash-orange');
        
        let isOrange = true;
        let flashCount = 0;
        const maxFlashes = 12;

        this.flashInterval = setInterval(() => {
            if (flashCount >= maxFlashes) {
                clearInterval(this.flashInterval);
                overlay.classList.remove('flash-orange', 'flash-pink');
                return;
            }

            overlay.classList.remove('flash-orange', 'flash-pink');
            overlay.classList.add(isOrange ? 'flash-orange' : 'flash-pink');
            
            isOrange = !isOrange;
            flashCount++;
        }, 250);
    }

    startVibration() {
        if (!navigator.vibrate) return;

        const vibratePattern = () => {
            if (!this.alarmActive) return;
            navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
        };

        vibratePattern();
        this.vibrateInterval = setInterval(vibratePattern, 1300);

        setTimeout(() => {
            if (this.vibrateInterval) {
                clearInterval(this.vibrateInterval);
                navigator.vibrate(0);
            }
        }, 8000);
    }

    dismissAlarm() {
        this.alarmActive = false;

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }

        if (this.vibrateInterval) {
            clearInterval(this.vibrateInterval);
            this.vibrateInterval = null;
            if (navigator.vibrate) navigator.vibrate(0);
        }

        const overlay = document.getElementById('alarmOverlay');
        overlay.classList.remove('hidden', 'flash-orange', 'flash-pink');
        overlay.classList.add('hidden');

        document.getElementById('timerDisplay').classList.add('hidden');
        document.getElementById('startBtn').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.add('hidden');
        document.getElementById('pauseBtn').textContent = '暂停';

        if (this.mode === 'countdown' && this.repeatEnabled) {
            this.currentRepeat++;
            
            if (this.repeatType === 'infinite' || this.currentRepeat < this.repeatCount) {
                this.remainingTime = this.totalTime;
                setTimeout(() => this.startTimer(), 500);
                return;
            }
        }

        this.isRunning = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.totalTime = 0;
        this.currentRepeat = 0;
        this.saveState();
    }

    update() {
        this.animationState.frame++;
        this.animationState.blinkFrame++;
        
        this.animationState.tailAngle += this.animationState.tailDirection * 0.02;
        if (this.animationState.tailAngle > 0.4) {
            this.animationState.tailDirection = -1;
        } else if (this.animationState.tailAngle < -0.4) {
            this.animationState.tailDirection = 1;
        }
        
        this.animationState.breathPhase += 0.03;
        
        const blinkCycle = this.animationState.blinkFrame % 300;
        if (blinkCycle >= 290 && blinkCycle <= 298) {
            this.animationState.isBlinking = true;
        } else {
            this.animationState.isBlinking = false;
        }
        
        this.renderPet();
        this.requestAnimationFrame(this.update.bind(this));
    }

    renderPet() {
        const canvas = this.petCanvas;
        const ctx = canvas.getContext('2d');
        const size = 200;
        
        ctx.clearRect(0, 0, size, size);
        
        if (this.currentPet === 'cat') {
            this.drawCuteCat(ctx, size, this.animationState.frame, 0, false);
        } else {
            this.drawCuteDog(ctx, size, this.animationState.frame, 0, false);
        }
    }

    drawCuteCat(ctx, size, frame, mouthOpen, isAlarm) {
        const cx = size / 2;
        const cy = size / 2;
        const scale = size / 200;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        const breath = Math.sin(this.animationState.breathPhase) * 0.03;
        const tailAngle = this.animationState.tailAngle;
        const isBlinking = this.animationState.isBlinking;
        
        ctx.save();
        ctx.translate(-40, 25);
        ctx.rotate(-Math.PI / 4 + tailAngle);
        
        const gradient = ctx.createLinearGradient(-8, -45, 8, 5);
        gradient.addColorStop(0, '#FFB6C1');
        gradient.addColorStop(1, '#FFC0CB');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, -20, 7, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(0, -45, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.scale(1 + breath, 1 + breath);
        
        const bodyGradient = ctx.createRadialGradient(0, 20, 10, 0, 20, 55);
        bodyGradient.addColorStop(0, '#FFF0F5');
        bodyGradient.addColorStop(0.5, '#FFE4EC');
        bodyGradient.addColorStop(1, '#FFC0CB');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 20, 52, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF5F9';
        ctx.beginPath();
        ctx.ellipse(0, 25, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        const pawGradient = ctx.createLinearGradient(-40, 35, -40, 65);
        pawGradient.addColorStop(0, '#FFB6C1');
        pawGradient.addColorStop(1, '#FFA0B0');
        
        ctx.fillStyle = pawGradient;
        
        ctx.beginPath();
        ctx.ellipse(-35, 58, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(35, 58, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4E9';
        ctx.beginPath();
        ctx.ellipse(-35, 60, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, 60, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FF8FA3';
        ctx.beginPath();
        ctx.ellipse(-38, 62, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-33, 63, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-35, 59, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(32, 62, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(37, 63, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, 59, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(0, -30, 5, 0, -30, 50);
        headGradient.addColorStop(0, '#FFF0F5');
        headGradient.addColorStop(0.6, '#FFE4EC');
        headGradient.addColorStop(1, '#FFC0CB');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(0, -28, 48, 43, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.moveTo(-42, -55);
        ctx.quadraticCurveTo(-45, -80, -28, -60);
        ctx.quadraticCurveTo(-35, -45, -42, -55);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(42, -55);
        ctx.quadraticCurveTo(45, -80, 28, -60);
        ctx.quadraticCurveTo(35, -45, 42, -55);
        ctx.fill();
        
        ctx.fillStyle = '#FFB0C0';
        ctx.beginPath();
        ctx.moveTo(-40, -56);
        ctx.quadraticCurveTo(-42, -72, -30, -58);
        ctx.quadraticCurveTo(-35, -48, -40, -56);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(40, -56);
        ctx.quadraticCurveTo(42, -72, 30, -58);
        ctx.quadraticCurveTo(35, -48, 40, -56);
        ctx.fill();
        
        ctx.fillStyle = '#FF8FA3';
        ctx.beginPath();
        ctx.ellipse(-43, -60, 5, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(43, -60, 5, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeY = -35;
        
        if (isBlinking) {
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-24, eyeY);
            ctx.quadraticCurveTo(-15, eyeY - 3, -6, eyeY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(6, eyeY);
            ctx.quadraticCurveTo(15, eyeY - 3, 24, eyeY);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const irisGradient = ctx.createRadialGradient(-15, eyeY, 0, -15, eyeY, 7);
            irisGradient.addColorStop(0, '#7CB342');
            irisGradient.addColorStop(0.7, '#558B2F');
            irisGradient.addColorStop(1, '#33691E');
            
            ctx.fillStyle = irisGradient;
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 7, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-18, eyeY - 4, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-12, eyeY - 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(12, eyeY - 4, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18, eyeY - 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.quadraticCurveTo(-7, -12, -6, -8);
        ctx.quadraticCurveTo(0, -5, 6, -8);
        ctx.quadraticCurveTo(7, -12, 0, -18);
        ctx.fill();
        
        ctx.fillStyle = '#FF8FB1';
        ctx.beginPath();
        ctx.moveTo(-2, -15);
        ctx.quadraticCurveTo(-4, -13, -3, -11);
        ctx.quadraticCurveTo(-1, -10, 0, -11);
        ctx.quadraticCurveTo(1, -10, 3, -11);
        ctx.quadraticCurveTo(4, -13, 2, -15);
        ctx.fill();
        
        if (mouthOpen > 0) {
            ctx.fillStyle = '#FF8FAB';
            ctx.beginPath();
            ctx.ellipse(0, 0, 14, 10 + mouthOpen * 20, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.ellipse(0, 5 + mouthOpen * 15, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(-10, -2);
            ctx.lineTo(-8, 5);
            ctx.lineTo(-12, 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(10, -2);
            ctx.lineTo(8, 5);
            ctx.lineTo(12, 5);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(0, 4);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(-9, 2, 9, 0.1, Math.PI - 0.1);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(9, 2, 9, 0.1, Math.PI - 0.1);
            ctx.stroke();
        }
        
        ctx.strokeStyle = '#6D4C41';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        for (let i = -1; i <= 1; i++) {
            const yOffset = i * 7;
            
            ctx.beginPath();
            ctx.moveTo(-38, -2 + yOffset);
            ctx.quadraticCurveTo(-55, -5 + yOffset, -65, -8 + yOffset);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(38, -2 + yOffset);
            ctx.quadraticCurveTo(55, -5 + yOffset, 65, -8 + yOffset);
            ctx.stroke();
        }
        
        ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-32, -8, 14, 10, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, -8, 14, 10, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 105, 180, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-32, -6, 8, 6, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, -6, 8, 6, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawCuteDog(ctx, size, frame, mouthOpen, isAlarm) {
        const cx = size / 2;
        const cy = size / 2;
        const scale = size / 200;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        const breath = Math.sin(this.animationState.breathPhase) * 0.03;
        const tailAngle = this.animationState.tailAngle;
        const isBlinking = this.animationState.isBlinking;
        
        ctx.save();
        ctx.translate(45, 18);
        ctx.rotate(Math.PI / 6 + tailAngle);
        
        const tailGradient = ctx.createLinearGradient(-8, -55, 8, 5);
        tailGradient.addColorStop(0, '#A0522D');
        tailGradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = tailGradient;
        ctx.beginPath();
        ctx.ellipse(0, -25, 8, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.ellipse(0, -52, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        ctx.save();
        ctx.scale(1 + breath, 1 + breath);
        
        const bodyGradient = ctx.createRadialGradient(0, 18, 10, 0, 18, 55);
        bodyGradient.addColorStop(0, '#FAEBD7');
        bodyGradient.addColorStop(0.5, '#DEB887');
        bodyGradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 20, 52, 45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFEFD5';
        ctx.beginPath();
        ctx.ellipse(0, 25, 38, 32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        const pawGradient = ctx.createLinearGradient(-40, 35, -40, 65);
        pawGradient.addColorStop(0, '#A0522D');
        pawGradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = pawGradient;
        
        ctx.beginPath();
        ctx.ellipse(-35, 58, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, 58, 13, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFEFD5';
        ctx.beginPath();
        ctx.ellipse(-35, 60, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, 60, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const headGradient = ctx.createRadialGradient(0, -30, 5, 0, -30, 50);
        headGradient.addColorStop(0, '#FAEBD7');
        headGradient.addColorStop(0.6, '#DEB887');
        headGradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.ellipse(0, -28, 48, 43, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(-45, -48, 18, 28, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(45, -48, 18, 28, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.ellipse(-45, -48, 10, 18, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(45, -48, 10, 18, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.ellipse(-45, -48, 5, 12, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(45, -48, 5, 12, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFEFD5';
        ctx.beginPath();
        ctx.ellipse(0, -20, 32, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const eyeY = -35;
        
        if (isBlinking) {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-24, eyeY);
            ctx.quadraticCurveTo(-15, eyeY - 3, -6, eyeY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(6, eyeY);
            ctx.quadraticCurveTo(15, eyeY - 3, 24, eyeY);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const irisGradient = ctx.createRadialGradient(-15, eyeY, 0, -15, eyeY, 8);
            irisGradient.addColorStop(0, '#8B4513');
            irisGradient.addColorStop(0.7, '#5D4037');
            irisGradient.addColorStop(1, '#3E2723');
            
            ctx.fillStyle = irisGradient;
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 8, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 8, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#1A1A1A';
            ctx.beginPath();
            ctx.ellipse(-15, eyeY, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(15, eyeY, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-18, eyeY - 4, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-12, eyeY - 6, 1.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(12, eyeY - 4, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18, eyeY - 6, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#2C1810';
        ctx.beginPath();
        ctx.ellipse(0, -15, 11, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.ellipse(-3, -17, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-2, -17, 1.5, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (mouthOpen > 0) {
            ctx.fillStyle = '#FF8FAB';
            ctx.beginPath();
            ctx.ellipse(0, 8, 16, 12 + mouthOpen * 22, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.ellipse(0, 12 + mouthOpen * 18, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.rect(-14, -2, 7, 10);
            ctx.fill();
            ctx.beginPath();
            ctx.rect(7, -2, 7, 10);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(-6, 8);
            ctx.lineTo(-4, 12);
            ctx.lineTo(-8, 12);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(6, 8);
            ctx.lineTo(4, 12);
            ctx.lineTo(8, 12);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 2, 14, 0.15, Math.PI - 0.15);
            ctx.stroke();
            
            ctx.fillStyle = '#FF8FAB';
            ctx.beginPath();
            ctx.ellipse(0, 8, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(222, 184, 135, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-32, -12, 14, 10, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, -12, 14, 10, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(-32, -10, 8, 6, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(32, -10, 8, 6, -0.1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    playInteractionAnimation() {
        this.animationState.interactionPhase = 1;
    }

    requestAnimationFrame(callback) {
        return window.requestAnimationFrame(callback);
    }

    saveState() {
        const state = {
            currentPet: this.currentPet,
            mode: this.mode,
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            remainingTime: this.remainingTime,
            totalTime: this.totalTime,
            alarmTime: this.alarmTime,
            repeatEnabled: this.repeatEnabled,
            repeatType: this.repeatType,
            repeatCount: this.repeatCount,
            currentRepeat: this.currentRepeat,
            startTimestamp: this.startTimestamp,
            pausedTimestamp: this.pausedTimestamp,
            savedAt: Date.now()
        };

        localStorage.setItem('petAlarm_state', JSON.stringify(state));
    }

    loadState() {
        const saved = localStorage.getItem('petAlarm_state');
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            
            if (state.currentPet) {
                this.currentPet = state.currentPet;
            }
            
            if (state.mode) {
                this.mode = state.mode;
                this.setMode(state.mode);
            }
            
            if (state.alarmTime) {
                document.getElementById('alarmTime').value = state.alarmTime;
                this.alarmTime = state.alarmTime;
            }
            
            this.repeatEnabled = state.repeatEnabled || false;
            document.getElementById('enableRepeat').checked = this.repeatEnabled;
            const options = document.getElementById('repeatOptions');
            options.classList.toggle('hidden', !this.repeatEnabled);

            this.repeatType = state.repeatType || 'infinite';
            const radio = document.querySelector(`input[name="repeatType"][value="${this.repeatType}"]`);
            if (radio) radio.checked = true;

            this.repeatCount = state.repeatCount || 3;
            document.getElementById('repeatCount').value = this.repeatCount;

            if (state.isRunning && state.remainingTime > 0) {
                let actualRemaining = state.remainingTime;
                
                if (!state.isPaused && state.savedAt) {
                    const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
                    actualRemaining = Math.max(0, state.remainingTime - elapsed);
                    console.log('Calculating elapsed time:', {
                        savedAt: state.savedAt,
                        now: Date.now(),
                        elapsedSeconds: elapsed,
                        originalRemaining: state.remainingTime,
                        actualRemaining: actualRemaining
                    });
                }
                
                if (actualRemaining > 0) {
                    this.remainingTime = actualRemaining;
                    this.totalTime = state.totalTime || actualRemaining;
                    this.currentRepeat = state.currentRepeat || 0;
                    
                    if (state.isPaused) {
                        this.isPaused = true;
                        this.isRunning = true;
                        this.pausedTimestamp = state.pausedTimestamp || Date.now();
                        
                        document.getElementById('timerDisplay').classList.remove('hidden');
                        document.getElementById('startBtn').classList.add('hidden');
                        document.getElementById('pauseBtn').classList.remove('hidden');
                        document.getElementById('stopBtn').classList.remove('hidden');
                        document.getElementById('pauseBtn').textContent = '继续';
                        document.getElementById('timerStatus').textContent = '已暂停';
                        this.updateTimeDisplay();
                        
                        this.saveState();
                    } else {
                        this.isRunning = true;
                        this.isPaused = false;
                        this.startTimestamp = Date.now();
                        
                        document.getElementById('timerDisplay').classList.remove('hidden');
                        document.getElementById('startBtn').classList.add('hidden');
                        document.getElementById('pauseBtn').classList.remove('hidden');
                        document.getElementById('stopBtn').classList.remove('hidden');
                        document.getElementById('pauseBtn').textContent = '暂停';
                        
                        this.saveState();
                        
                        if (this.mode === 'countdown') {
                            document.getElementById('timerStatus').textContent = '倒计时中...';
                            this.startCountdown();
                        } else {
                            document.getElementById('timerStatus').textContent = `闹钟已设置: ${this.alarmTime}`;
                            this.startAlarmCheck();
                        }
                    }
                } else {
                    console.log('Time elapsed, clearing state');
                    localStorage.removeItem('petAlarm_state');
                }
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.petAlarm = new PetAlarm();
});
