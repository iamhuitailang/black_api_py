import { catSounds, learnCommands, catTypes } from './data.js';
import { Storage } from './storage.js';
import { Audio } from './audio.js';
import { Translator } from './translator.js';
import { CatAnimation, HeartAnimation } from './animation.js';
import { Share } from './share.js';

export const UI = {
    currentMode: 'cat-to-human',
    currentCatType: null,
    isRecording: false,
    currentTranslation: null,

    init() {
        this.bindEvents();
        this.renderCatSoundButtons();
        this.renderLearnCommands();
        this.loadSavedState();
        this.renderHistory();
        this.renderChatMessages();
        this.updateLearnProgress();
    },

    bindEvents() {
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        document.querySelectorAll('.cat-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const typeId = e.target.dataset.type;
                this.switchCatType(typeId === 'null' ? null : typeId);
            });
        });

        document.getElementById('soundToggle').addEventListener('click', () => {
            const isEnabled = Audio.toggleMute();
            document.getElementById('soundToggle').textContent = isEnabled ? '🔊' : '🔇';
            Audio.playClickSound();
        });

        document.getElementById('catAvatar').addEventListener('click', () => {
            this.triggerSneezeAnimation();
        });

        document.getElementById('recordBtn').addEventListener('click', () => {
            this.toggleRecording();
        });

        document.getElementById('randomCatBtn').addEventListener('click', () => {
            this.translateRandomCatSound();
        });

        document.getElementById('translateToCatBtn').addEventListener('click', () => {
            this.translateHumanToCat();
        });

        document.getElementById('randomHumanBtn').addEventListener('click', () => {
            this.translateRandomHumanPhrase();
        });

        document.getElementById('playCatSoundBtn').addEventListener('click', () => {
            this.playCurrentCatSound();
        });

        document.querySelectorAll('.quick-phrase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phrase = e.target.dataset.phrase;
                document.getElementById('humanInput').value = phrase;
                Audio.playClickSound();
            });
        });

        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        document.getElementById('chatMicBtn').addEventListener('click', () => {
            this.sendRandomCatMessage();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal();
        });

        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeShareModal();
        });

        document.getElementById('downloadCardBtn').addEventListener('click', () => {
            Share.downloadCard();
            Audio.playSuccessSound();
        });

        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.closeShareModal();
            }
        });
    },

    switchMode(mode) {
        this.currentMode = mode;
        Storage.saveSettings({ currentMode: mode });
        Audio.playClickSound();

        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        document.querySelectorAll('.mode-content').forEach(content => {
            content.classList.toggle('active', content.id === `${mode}-mode`);
        });
    },

    renderCatSoundButtons() {
        const grid = document.getElementById('catSoundGrid');
        grid.innerHTML = '';

        catSounds.forEach(sound => {
            const btn = document.createElement('button');
            btn.className = 'sound-btn';
            btn.dataset.soundId = sound.id;
            btn.innerHTML = `
                <span class="sound-emoji">${sound.emoji}</span>
                <span class="sound-name">${sound.name}</span>
            `;
            btn.addEventListener('click', () => {
                this.translateCatSound(sound.id);
            });
            grid.appendChild(btn);
        });
    },

    renderLearnCommands() {
        const container = document.getElementById('learnCommands');
        container.innerHTML = '';

        learnCommands.forEach(command => {
            const isLearned = Storage.isCommandLearned(command.id);
            const btn = document.createElement('button');
            btn.className = `learn-command-btn ${isLearned ? 'learned' : ''}`;
            btn.dataset.commandId = command.id;
            btn.innerHTML = `
                <span class="command-emoji">${command.emoji}</span>
                <span class="command-text">${command.command}</span>
                ${isLearned ? '<span class="learned-badge">✓ 已学会</span>' : ''}
            `;
            btn.addEventListener('click', () => {
                this.learnCommand(command);
            });
            container.appendChild(btn);
        });
    },

    updateLearnProgress() {
        const progress = Storage.getLearnProgress();
        const totalCommands = learnCommands.length;
        const percentage = (progress.totalLearned / totalCommands) * 100;

        document.getElementById('learnProgress').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${progress.totalLearned}/${totalCommands}`;
    },

    async translateCatSound(soundId) {
        if (Translator.isNightTime()) {
            this.showSleepingMessage();
            return;
        }

        const result = Translator.translateCatToHuman(soundId);
        if (result) {
            this.currentTranslation = {
                type: 'cat-to-human',
                from: result.soundText,
                to: result.translation
            };

            document.getElementById('catToHumanText').innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 10px;">${result.emoji} ${result.soundText}</div>
                <div style="color: #FF6B9D; font-weight: bold;">${result.translation}</div>
            `;

            await Audio.playMeowSound(result.audioType);

            if (result.audioType === 'happy' || result.audioType === 'purr') {
                CatAnimation.setEmotion('happy');
                setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);
            } else if (result.audioType === 'low' || result.audioType === 'sad') {
                CatAnimation.setEmotion('sad');
                setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);
            } else if (result.audioType === 'hiss' || result.audioType === 'high') {
                CatAnimation.setEmotion('angry');
                setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);
            }

            this.renderHistory();
            this.checkEasterEggs();
        }
    },

    translateRandomCatSound() {
        const result = Translator.getRandomCatSound();
        if (result) {
            this.currentTranslation = {
                type: 'cat-to-human',
                from: result.soundText,
                to: result.translation
            };

            document.getElementById('catToHumanText').innerHTML = `
                <div style="font-size: 1.5rem; margin-bottom: 10px;">🎲 ${result.emoji} ${result.soundText}</div>
                <div style="color: #FF6B9D; font-weight: bold;">${result.translation}</div>
            `;

            Audio.playMeowSound(result.audioType);
            this.renderHistory();
            this.checkEasterEggs();
        }
    },

    translateHumanToCat() {
        if (Translator.isNightTime()) {
            this.showSleepingMessage();
            return;
        }

        const input = document.getElementById('humanInput').value.trim();
        if (!input) {
            alert('请输入想说的话~');
            return;
        }

        const result = Translator.translateHumanToCat(input);
        this.currentTranslation = {
            type: 'human-to-cat',
            from: input,
            to: result.catTranslation
        };

        document.getElementById('humanToCatText').innerHTML = result.catTranslation;

        Audio.playMeowSound(result.audioType);
        CatAnimation.setEmotion('happy');
        setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);

        this.renderHistory();
        this.checkEasterEggs();
    },

    translateRandomHumanPhrase() {
        const result = Translator.getRandomHumanPhrase();
        document.getElementById('humanInput').value = result.original;

        this.currentTranslation = {
            type: 'human-to-cat',
            from: result.original,
            to: result.catTranslation
        };

        document.getElementById('humanToCatText').innerHTML = result.catTranslation;
        Audio.playMeowSound(result.audioType);
        this.renderHistory();
        this.checkEasterEggs();
    },

    playCurrentCatSound() {
        const text = document.getElementById('humanToCatText').textContent;
        if (text && text !== '等待翻译...') {
            if (text.includes('呼噜') || text.includes('舒服')) {
                Audio.playMeowSound('purr');
            } else if (text.includes('急促') || text.includes('饿')) {
                Audio.playMeowSound('rapid');
            } else if (text.includes('嘶') || text.includes('别烦')) {
                Audio.playMeowSound('hiss');
            } else if (text.includes('跳') || text.includes('玩')) {
                Audio.playMeowSound('playful');
            } else if (text.includes('呜') || text.includes('伤心')) {
                Audio.playMeowSound('sad');
            } else {
                Audio.playMeowSound('short');
            }
        }
    },

    async toggleRecording() {
        const btn = document.getElementById('recordBtn');

        if (!this.isRecording) {
            try {
                await Audio.startRecording();
                this.isRecording = true;
                btn.classList.add('recording');
                btn.textContent = '⏹️ 停止录音';
            } catch (e) {
                alert('录音功能无法使用，请检查麦克风权限。将使用随机猫叫代替。');
                this.translateRandomCatSound();
            }
        } else {
            btn.classList.remove('recording');
            btn.textContent = '🎤 录音识别';
            this.isRecording = false;

            await Audio.stopRecording();
            this.translateRandomCatSound();
        }
    },

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        this.addChatMessage('user', message);
        input.value = '';

        setTimeout(() => {
            const response = Translator.getChatResponse(message);
            this.addChatMessage('cat', response.text);

            if (response.type === 'happy' || response.type === 'affectionate') {
                CatAnimation.setEmotion('happy');
            } else if (response.type === 'sad' || response.type === 'sleepy') {
                CatAnimation.setEmotion('sad');
            } else if (response.type === 'angry') {
                CatAnimation.setEmotion('angry');
            } else if (response.type === 'confused') {
                CatAnimation.setEmotion('surprised');
            }

            setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);
            Audio.playMeowSound('short');
        }, 1000);
    },

    sendRandomCatMessage() {
        const randomMessages = [
            '喵～（蹭蹭你）',
            '喵喵喵！（扑向你的手）',
            '呼噜呼噜～（开始踩奶）',
            '喵呜？（歪头看你）',
            '喵～（伸个懒腰）'
        ];
        const randomIndex = Math.floor(Math.random() * randomMessages.length);
        this.addChatMessage('cat', randomMessages[randomIndex]);
        Audio.playMeowSound('short');
    },

    addChatMessage(sender, text) {
        const container = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">${text}</div>
        `;
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    renderChatMessages() {
        const messages = Storage.getChatMessages();
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        if (messages.length === 0) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'chat-message cat';
            welcomeDiv.innerHTML = `
                <div class="message-bubble">喵～欢迎来找我聊天！有什么事吗？</div>
            `;
            container.appendChild(welcomeDiv);
        } else {
            messages.forEach(msg => {
                this.addChatMessage(msg.sender, msg.text);
            });
        }
    },

    learnCommand(command) {
        const isLearned = Storage.isCommandLearned(command.id);

        if (isLearned) {
            alert(`猫咪已经学会了"${command.command}"！它说：${command.catResponse}`);
            return;
        }

        Storage.markCommandLearned(command.id);
        this.renderLearnCommands();
        this.updateLearnProgress();

        alert(`🎉 猫咪学会了"${command.command}"！\n${command.catResponse}`);

        CatAnimation.setEmotion('happy');
        Audio.playMeowSound('purr');
        setTimeout(() => CatAnimation.setEmotion('neutral'), 2000);
    },

    renderHistory() {
        const history = Storage.getHistory();
        const container = document.getElementById('historyList');

        if (history.length === 0) {
            container.innerHTML = '<p class="empty-history">暂无翻译记录</p>';
            return;
        }

        container.innerHTML = '';
        history.slice(0, 10).forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-from">${item.type === 'cat-to-human' ? '🐱' : '💬'} ${item.from}</div>
                <div class="history-to">${item.type === 'cat-to-human' ? '→ 💬' : '→ 🐱'} ${item.to}</div>
            `;
            container.appendChild(div);
        });
    },

    switchCatType(catTypeId) {
        this.currentCatType = catTypeId;
        Storage.saveSettings({ currentCatType: catTypeId });

        document.querySelectorAll('.cat-type-btn').forEach(btn => {
            const btnType = btn.dataset.type;
            btn.classList.toggle('active', (catTypeId === null && btnType === 'null') || (btnType === catTypeId));
        });

        document.body.classList.remove('theme-ragdoll', 'theme-siamese', 'theme-orange_tabby');

        if (catTypeId) {
            document.body.classList.add(`theme-${catTypeId}`);
        }

        CatAnimation.setCatType(catTypeId);

        Audio.playClickSound();
    },

    loadSavedState() {
        const settings = Storage.getSettings();

        const soundBtn = document.getElementById('soundToggle');
        soundBtn.textContent = settings.soundEnabled ? '🔊' : '🔇';

        if (settings.currentMode && settings.currentMode !== this.currentMode) {
            this.switchMode(settings.currentMode);
        }

        if (settings.currentCatType !== undefined) {
            this.switchCatType(settings.currentCatType);
        }
    },

    triggerSneezeAnimation() {
        CatAnimation.triggerSneeze();
        Audio.playMeowSound('short');

        const sneezeDiv = document.createElement('div');
        sneezeDiv.className = 'sneeze-animation';
        sneezeDiv.innerHTML = '<div class="sneeze-text">阿～嚏～ 🤧</div>';
        document.body.appendChild(sneezeDiv);

        setTimeout(() => {
            sneezeDiv.remove();
        }, 600);
    },

    showSleepingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'sleep-message';
        messageDiv.innerHTML = `
            <div class="zzz">💤 Zzz...</div>
            <h3>猫咪在睡觉呢</h3>
            <p>现在是凌晨，猫咪正在美梦中~</p>
            <p>等天亮再来找它玩吧！</p>
        `;
        document.body.appendChild(messageDiv);

        CatAnimation.setEmotion('sleepy');

        setTimeout(() => {
            messageDiv.remove();
            CatAnimation.setEmotion('neutral');
        }, 3000);
    },

    showVideoCallEaster() {
        const callDiv = document.createElement('div');
        callDiv.className = 'video-call-easter';
        callDiv.innerHTML = `
            <div class="call-icon">📹</div>
            <h3>喵星人请求视频通话</h3>
            <p>猫咪想和你视频聊天啦！</p>
            <button style="padding: 10px 30px; margin-top: 15px; border: none; border-radius: 25px; background: linear-gradient(135deg, #FF6B9D, #FF9A9E); color: white; font-size: 1rem; cursor: pointer;" onclick="this.parentElement.remove()">接受通话</button>
        `;
        document.body.appendChild(callDiv);

        Translator.markEasterTriggered('video_call');

        Audio.playMeowSound('rapid');
        CatAnimation.setEmotion('happy');

        setTimeout(() => CatAnimation.setEmotion('neutral'), 3000);
    },

    checkEasterEggs() {
        const triggers = Translator.getEasterEggTriggers();

        triggers.forEach(trigger => {
            if (trigger.type === 'video_call') {
                this.showVideoCallEaster();
            } else if (trigger.type === 'heart_animation') {
                HeartAnimation.start();
                Translator.markEasterTriggered('heart_animation');
                CatAnimation.setEmotion('happy');
                setTimeout(() => CatAnimation.setEmotion('neutral'), 6000);
            } else if (trigger.type === 'sleeping') {
                this.showSleepingMessage();
            }
        });
    },

    openShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.add('active');

        const latestTranslation = Share.getLatestTranslation() || this.currentTranslation;
        Share.generateCard(latestTranslation);

        Audio.playClickSound();
    },

    closeShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.remove('active');
        Audio.playClickSound();
    }
};

export default UI;
