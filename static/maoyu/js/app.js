const App = {
    currentTab: 'translate',
    lastResult: null,
    isSleeping: false,

    init() {
        this.loadSavedState();
        this.initModules();
        this.setupEventListeners();
        this.renderInitialUI();
        this.checkSleepingState();
    },

    loadSavedState() {
        const lastTab = Storage.getLastTab();
        this.currentTab = lastTab;
    },

    initModules() {
        AudioManager.init();
        CatAnimator.init('cat-canvas');
        ChatModule.init();
        LearningModule.init();
        ShareModule.init();
    },

    setupEventListeners() {
        this.setupTabNavigation();
        this.setupSoundButtons();
        this.setupTranslateButtons();
        this.setupSettings();
        this.setupCatInteraction();
        this.setupVideoCall();
        this.setupQuickMessages();
    },

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    },

    switchTab(tabId) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        this.currentTab = tabId;
        Storage.setLastTab(tabId);
        AudioManager.playClick();
    },

    setupSoundButtons() {
        const container = document.getElementById('cat-sounds');
        if (!container) return;

        const catSounds = Translator.getCatToHumanList();
        
        container.innerHTML = catSounds.map(sound => `
            <button class="sound-btn" data-sound-id="${sound.id}" data-sound-type="${sound.soundType}">
                <span class="sound-emoji">${sound.emoji}</span>
                <span class="sound-text">"${sound.sound}"</span>
                <span class="sound-desc">${sound.description.split(' - ')[0]}</span>
            </button>
        `).join('');

        container.addEventListener('click', (e) => {
            const soundBtn = e.target.closest('.sound-btn');
            if (soundBtn) {
                const soundId = soundBtn.dataset.soundId;
                const soundType = soundBtn.dataset.soundType;
                this.handleCatSoundClick(soundId, soundType);
            }
        });
    },

    handleCatSoundClick(soundId, soundType) {
        if (this.isSleeping) {
            this.showSleepingMessage();
            return;
        }

        if (AudioManager.isEnabled()) {
            AudioManager.playMeow(soundType);
        }

        CatAnimator.triggerMeow(soundType);

        const result = Translator.translateCatToHuman(soundId);
        if (result.success) {
            this.displayResult(result);
            this.saveTranslation(result);
        }
    },

    setupTranslateButtons() {
        const randomBtn = document.getElementById('random-btn');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => this.handleRandomTranslate());
        }

        const translateHumanBtn = document.getElementById('translate-human-btn');
        if (translateHumanBtn) {
            translateHumanBtn.addEventListener('click', () => this.handleHumanToCatTranslate());
        }

        const humanInput = document.getElementById('human-input');
        if (humanInput) {
            humanInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleHumanToCatTranslate();
                }
            });
        }
    },

    handleRandomTranslate() {
        if (this.isSleeping) {
            this.showSleepingMessage();
            return;
        }

        const result = Translator.getRandomCatSound();
        if (result.success) {
            if (AudioManager.isEnabled()) {
                AudioManager.playMeow(result.soundType);
            }
            CatAnimator.triggerMeow(result.soundType);
            this.displayResult(result);
            this.saveTranslation(result);
        }

        AudioManager.playClick();
    },

    handleHumanToCatTranslate() {
        const input = document.getElementById('human-input');
        if (!input) return;

        const text = input.value.trim();
        if (!text) {
            this.showToast('请输入内容！', 'error');
            return;
        }

        if (this.isSleeping) {
            this.showSleepingMessage();
            return;
        }

        const learned = LearningModule.translateLearned(text);
        if (learned) {
            const result = {
                success: true,
                input: text,
                output: learned.translation,
                emoji: '📚',
                description: learned.command,
                soundType: 'short',
                direction: 'learned',
                isLearned: true
            };
            this.displayResult(result);
            this.saveTranslation(result);
            
            if (AudioManager.isEnabled()) {
                AudioManager.playMeow('short');
            }
            CatAnimator.triggerMeow('short');
            return;
        }

        const result = Translator.translateHumanToCat(text);
        if (result.success) {
            if (AudioManager.isEnabled()) {
                AudioManager.playMeow(result.soundType);
            }
            CatAnimator.triggerMeow(result.soundType);
            this.displayResult(result);
            this.saveTranslation(result);

            if (result.isLoveYou) {
                const loveCount = Storage.incrementLoveYouCount();
                const milestone = Translator.checkLoveYouMilestone(loveCount);
                if (milestone) {
                    this.showHeartsAnimation();
                    if (AudioManager.isEnabled()) {
                        AudioManager.playHeart();
                    }
                }
            }
        }

        input.value = '';
        AudioManager.playClick();
    },

    displayResult(result) {
        const container = document.getElementById('result-container');
        const placeholder = document.getElementById('result-placeholder');
        
        if (!container) return;

        this.lastResult = result;

        if (placeholder) {
            placeholder.style.display = 'none';
        }

        container.classList.add('has-result');
        container.innerHTML = `
            <div class="result-emoji">${result.emoji}</div>
            <div class="result-text">${this.escapeHtml(result.output)}</div>
            ${result.description ? `<div class="result-desc">${this.escapeHtml(result.description)}</div>` : ''}
            <div class="result-actions">
                <button class="btn btn-outline" id="result-share-btn">
                    📤 分享
                </button>
                <button class="btn btn-secondary" id="result-replay-btn">
                    🔊 重听
                </button>
            </div>
        `;

        this.setupResultActions();
    },

    setupResultActions() {
        const shareBtn = document.getElementById('result-share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                if (this.lastResult) {
                    ShareModule.open(this.lastResult);
                }
            });
        }

        const replayBtn = document.getElementById('result-replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                if (this.lastResult && AudioManager.isEnabled()) {
                    AudioManager.playMeow(this.lastResult.soundType || 'short');
                    CatAnimator.triggerMeow(this.lastResult.soundType || 'short');
                }
                AudioManager.playClick();
            });
        }
    },

    saveTranslation(result) {
        const count = Storage.incrementTranslationCount();
        
        Storage.addHistory({
            input: result.input,
            output: result.output,
            direction: result.direction,
            emoji: result.emoji
        });

        this.updateStats();

        const milestone = Translator.checkTranslationMilestone(count);
        if (milestone) {
            this.showVideoCallModal(milestone.message);
        }
    },

    updateStats() {
        const stats = Storage.getStats();
        const statTranslations = document.getElementById('stat-translations');
        const statLove = document.getElementById('stat-love');

        if (statTranslations) {
            statTranslations.textContent = stats.totalTranslations || 0;
        }
        if (statLove) {
            statLove.textContent = stats.loveYouCount || 0;
        }
    },

    setupSettings() {
        const catTypeSelector = document.getElementById('cat-type-selector');
        if (catTypeSelector) {
            const settings = Storage.getSettings();
            const currentCatType = settings.catType || 'lihua';
            
            const catTypeBtns = catTypeSelector.querySelectorAll('.cat-type-btn');
            catTypeBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.catType === currentCatType);
            });
            
            catTypeSelector.addEventListener('click', (e) => {
                const catTypeBtn = e.target.closest('.cat-type-btn');
                if (catTypeBtn) {
                    const catType = catTypeBtn.dataset.catType;
                    this.switchCatType(catType);
                }
            });
        }

        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            const settings = Storage.getSettings();
            soundToggle.checked = settings.soundEnabled !== false;

            soundToggle.addEventListener('change', () => {
                AudioManager.toggle();
                AudioManager.playClick();
            });
        }

        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                Storage.clearHistory();
                this.showToast('历史记录已清空', 'success');
                AudioManager.playClick();
            });
        }
    },

    switchCatType(catType) {
        const catTypeBtns = document.querySelectorAll('.cat-type-btn');
        catTypeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.catType === catType);
        });
        
        AudioManager.setCatType(catType);
        CatAnimator.setCatType(catType);
        Storage.setSettings({ catType: catType });
        
        const catInfo = AudioManager.getCatTypeInfo(catType);
        this.showToast(`已切换到 ${catInfo.name}！喵～`, 'success');
        
        if (AudioManager.isEnabled()) {
            setTimeout(() => {
                AudioManager.playMeow('short');
                CatAnimator.triggerMeow('short');
            }, 200);
        }
    },

    setupCatInteraction() {
        const container = document.getElementById('cat-container');
        if (!container) return;

        let clickCount = 0;
        let clickTimeout = null;

        container.addEventListener('click', (e) => {
            if (this.isSleeping) {
                this.showToast('猫咪在睡觉呢，轻点...', 'info');
                return;
            }

            clickCount++;
            
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }

            clickTimeout = setTimeout(() => {
                if (clickCount >= 2) {
                    this.triggerCatSneeze();
                } else {
                    this.triggerCatMeow();
                }
                clickCount = 0;
            }, 300);
        });
    },

    triggerCatMeow() {
        const soundTypes = ['short', 'long', 'purr'];
        const randomType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
        
        if (AudioManager.isEnabled()) {
            AudioManager.playMeow(randomType);
        }
        CatAnimator.triggerMeow(randomType);
    },

    triggerCatSneeze() {
        if (AudioManager.isEnabled()) {
            AudioManager.playSneeze();
        }
        CatAnimator.triggerSneeze();
        this.showToast('猫咪打了个喷嚏～', 'info');
    },

    setupVideoCall() {
        const answerBtn = document.getElementById('video-answer-btn');
        const declineBtn = document.getElementById('video-decline-btn');
        const overlay = document.getElementById('video-call-overlay');

        if (answerBtn) {
            answerBtn.addEventListener('click', () => {
                if (overlay) {
                    overlay.classList.remove('active');
                }
                this.showHeartsAnimation();
                if (AudioManager.isEnabled()) {
                    AudioManager.playSuccess();
                    AudioManager.playMeow('long');
                }
                CatAnimator.triggerMeow('long');
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                if (overlay) {
                    overlay.classList.remove('active');
                }
                if (AudioManager.isEnabled()) {
                    AudioManager.playMeow('hiss');
                }
                CatAnimator.triggerMeow('hiss');
            });
        }
    },

    setupQuickMessages() {
        document.addEventListener('click', (e) => {
            const quickBtn = e.target.closest('.quick-msg-btn');
            if (quickBtn) {
                const msg = quickBtn.dataset.msg;
                ChatModule.addQuickMessage(msg);
                AudioManager.playClick();
            }
        });
    },

    showVideoCallModal(message) {
        const overlay = document.getElementById('video-call-overlay');
        if (overlay) {
            const textEl = overlay.querySelector('.video-call-text');
            if (textEl) {
                textEl.textContent = message;
            }
            overlay.classList.add('active');
        }
    },

    showHeartsAnimation() {
        CatAnimator.triggerHearts();
        
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createFloatingHeart();
            }, i * 100);
        }
    },

    createFloatingHeart() {
        const heart = document.createElement('div');
        heart.className = 'heart-animation';
        heart.textContent = '💕';
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.bottom = '50px';
        document.body.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 2000);
    },

    checkSleepingState() {
        this.isSleeping = Translator.isLateNight();
        const overlay = document.getElementById('sleeping-overlay');
        
        if (overlay) {
            overlay.classList.toggle('active', this.isSleeping);
        }

        setTimeout(() => this.checkSleepingState(), 60000);
    },

    showSleepingMessage() {
        const result = Translator.getSleepingMessage();
        this.displayResult(result);
        this.showToast('猫咪在睡觉呢 Zzz', 'info');
    },

    renderInitialUI() {
        this.switchTab(this.currentTab);
        this.updateStats();
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            background: ${type === 'success' ? '#51CF66' : type === 'error' ? '#FF6B6B' : '#74C0FC'};
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: toast-in 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toast-out 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
