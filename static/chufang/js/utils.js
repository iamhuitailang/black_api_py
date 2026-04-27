const Utils = {
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    uniqueArray(arr) {
        return [...new Set(arr)];
    }
};

const Effects = {
    effectsLayer: null,
    
    init() {
        this.effectsLayer = document.getElementById('effects-layer');
    },
    
    createFloatingText(text, x, y, type = 'success') {
        const floatEl = document.createElement('div');
        floatEl.className = `floating-text ${type}`;
        floatEl.textContent = text;
        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;
        this.effectsLayer.appendChild(floatEl);
        
        setTimeout(() => {
            floatEl.remove();
        }, 1000);
    },
    
    createStarParticles(x, y, count = 8) {
        const starEmojis = ['⭐', '✨', '🌟', '💫'];
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star-particle';
            star.textContent = Utils.randomChoice(starEmojis);
            
            const angle = (i / count) * Math.PI * 2;
            const distance = Utils.random(60, 120);
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            star.style.setProperty('--tx', `${tx}px`);
            star.style.setProperty('--ty', `${ty}px`);
            
            this.effectsLayer.appendChild(star);
            
            setTimeout(() => {
                star.remove();
            }, 800);
        }
    },
    
    createSuccessEffect(x, y, score) {
        this.createFloatingText('美味！', x, y - 30, 'success');
        setTimeout(() => {
            this.createFloatingText(`+${score}`, x, y + 10, 'score');
        }, 200);
        this.createStarParticles(x, y, 12);
    },
    
    createErrorEffect(x, y) {
        this.createFloatingText('-50', x, y, 'error');
    },
    
    shakeScreen(times = 1) {
        const container = document.getElementById('game-container');
        container.classList.remove('shake-screen', 'shake-screen-twice');
        
        void container.offsetWidth;
        
        if (times === 2) {
            container.classList.add('shake-screen-twice');
        } else {
            container.classList.add('shake-screen');
        }
        
        setTimeout(() => {
            container.classList.remove('shake-screen', 'shake-screen-twice');
        }, times === 2 ? 500 : 300);
    },
    
    darkenScreen() {
        const gameScreen = document.getElementById('game-screen');
        gameScreen.classList.add('screen-darken');
    },
    
    playIngredientClick(element) {
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 300);
    },
    
    playIngredientError(element) {
        element.classList.add('error');
        setTimeout(() => {
            element.classList.remove('error');
        }, 500);
    }
};

const SoundManager = {
    audioContext: null,
    
    init() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    },
    
    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio play error:', e);
        }
    },
    
    playClick() {
        this.playTone(880, 0.1, 'sine', 0.4);
    },
    
    playSuccess() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'sine', 0.3);
            }, i * 100);
        });
    },
    
    playError() {
        this.playTone(200, 0.3, 'square', 0.2);
    },
    
    playGameEnd() {
        const notes = [392, 330, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.4, 'sine', 0.3);
            }, i * 200);
        });
    }
};

const Vibration = {
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },
    
    click() {
        this.vibrate(15);
    },
    
    success() {
        this.vibrate([50, 50, 50]);
    },
    
    error() {
        this.vibrate(100);
    },
    
    gameEnd() {
        this.vibrate([100, 50, 100, 50, 100]);
    }
};

const StorageManager = {
    STORAGE_KEY: 'kitchen_war_game_state_v1',
    autoSaveInterval: null,
    
    init() {
        window.addEventListener('beforeunload', () => {
            if (Game && Game.state && Game.state.isPlaying) {
                this.saveGameState();
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && Game && Game.state && Game.state.isPlaying) {
                this.saveGameState();
            }
        });
    },
    
    saveGameState() {
        if (!Game || !Game.state) return false;
        
        try {
            const cookingList = Game.getCookingIngredientsState();
            const stateToSave = {
                isPlaying: Game.state.isPlaying,
                score: Game.state.score,
                timeLeft: Game.state.timeLeft,
                combo: Game.state.combo,
                maxCombo: Game.state.maxCombo,
                dishesCompleted: Game.state.dishesCompleted,
                currentDish: Game.state.currentDish,
                currentStep: Game.state.currentStep,
                timestamp: Date.now(),
                cookingIngredients: cookingList,
                cookingIngredientsList: cookingList,
                customerEmoji: Game.state.customerEmoji,
                orderText: Game.state.orderText
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
            console.log('游戏状态已自动保存:', new Date().toLocaleTimeString());
            return true;
        } catch (e) {
            console.error('保存游戏状态失败:', e);
            return false;
        }
    },
    
    loadGameState() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) return null;
            
            const state = JSON.parse(saved);
            
            if (state.timestamp && state.isPlaying && state.timeLeft > 0) {
                const now = Date.now();
                const elapsed = (now - state.timestamp) / 1000;
                state.timeLeft = Math.max(0, state.timeLeft - Math.floor(elapsed));
            }
            
            return state;
        } catch (e) {
            console.error('加载游戏状态失败:', e);
            return null;
        }
    },
    
    clearGameState() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('游戏状态已清除');
            return true;
        } catch (e) {
            console.error('清除游戏状态失败:', e);
            return false;
        }
    },
    
    hasSavedGame() {
        const state = this.loadGameState();
        return state !== null && this.isStateValid(state);
    },
    
    isStateValid(state) {
        if (!state) return false;
        if (!state.isPlaying) return false;
        if (state.timeLeft <= 0) return false;
        return true;
    },
    
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        this.autoSaveInterval = setInterval(() => {
            if (Game && Game.state && Game.state.isPlaying) {
                this.saveGameState();
            }
        }, 5000);
    },
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
};
