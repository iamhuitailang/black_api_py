const ChatModule = {
    messages: [],
    container: null,
    input: null,
    sendBtn: null,

    init() {
        this.container = document.getElementById('chat-messages');
        this.input = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');

        this.loadHistory();
        this.bindEvents();
        this.render();
    },

    loadHistory() {
        const history = Storage.getChatHistory();
        this.messages = history.map(msg => ({
            ...msg,
            isUser: msg.sender === 'user'
        }));
    },

    saveMessage(msg) {
        Storage.addChatMessage(msg);
    },

    bindEvents() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        const clearBtn = document.getElementById('chat-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }
    },

    sendMessage() {
        if (!this.input) return;

        const text = this.input.value.trim();
        if (!text) return;

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: text,
            timestamp: new Date().toISOString()
        };

        this.messages.push(userMsg);
        this.saveMessage(userMsg);
        this.input.value = '';

        this.render();
        this.scrollToBottom();

        AudioManager.playClick();

        setTimeout(() => {
            this.generateCatResponse(text);
        }, 500 + Math.random() * 500);
    },

    generateCatResponse(userText) {
        const responses = [
            { text: '喵～', soundType: 'short', emoji: '😺' },
            { text: '喵呜～', soundType: 'long', emoji: '💕' },
            { text: '呼噜呼噜～', soundType: 'purr', emoji: '😻' },
            { text: '喵喵喵！', soundType: 'fast', emoji: '😸' },
            { text: '呜喵...', soundType: 'low', emoji: '😿' },
            { text: '嘶...', soundType: 'hiss', emoji: '😾' }
        ];

        const keywordResponse = this.matchKeywords(userText);
        const response = keywordResponse || responses[Math.floor(Math.random() * responses.length)];

        const catMsg = {
            id: Date.now(),
            sender: 'cat',
            text: response.text,
            soundType: response.soundType,
            emoji: response.emoji,
            timestamp: new Date().toISOString()
        };

        this.messages.push(catMsg);
        this.saveMessage(catMsg);

        this.render();
        this.scrollToBottom();

        if (AudioManager.isEnabled()) {
            AudioManager.playMeow(response.soundType);
        }

        CatAnimator.triggerMeow(response.soundType);
    },

    matchKeywords(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('爱') || lowerText.includes('love') || lowerText.includes('喜欢')) {
            return { text: '呼噜呼噜～喵～💕', soundType: 'purr', emoji: '😻' };
        }

        if (lowerText.includes('饿') || lowerText.includes('吃') || lowerText.includes('小鱼')) {
            return { text: '喵喵喵喵喵！', soundType: 'fast', emoji: '😸' };
        }

        if (lowerText.includes('玩') || lowerText.includes('游戏') || lowerText.includes('逗猫')) {
            return { text: '喵～呜～喵～', soundType: 'long', emoji: '🎾' };
        }

        if (lowerText.includes('摸') || lowerText.includes('舒服') || lowerText.includes('爽')) {
            return { text: '呼噜呼噜呼噜～', soundType: 'purr', emoji: '😻' };
        }

        if (lowerText.includes('晚安') || lowerText.includes('睡')) {
            return { text: '喵～😴', soundType: 'short', emoji: '😴' };
        }

        if (lowerText.includes('你好') || lowerText.includes('hello') || lowerText.includes('hi')) {
            return { text: '喵～你好呀！', soundType: 'short', emoji: '👋' };
        }

        return null;
    },

    render() {
        if (!this.container) return;

        if (this.messages.length === 0) {
            this.container.innerHTML = `
                <div class="chat-empty">
                    <div class="chat-empty-icon">🐱</div>
                    <p>和猫咪聊聊天吧～</p>
                    <p class="hint">试试说："我爱你"、"陪我玩"、"你好"</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = this.messages.map(msg => `
            <div class="chat-message ${msg.sender === 'user' ? 'user' : 'cat'}">
                <div class="message-avatar">
                    ${msg.sender === 'user' ? '👤' : '🐱'}
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        <span class="message-emoji">${msg.emoji || ''}</span>
                        ${msg.text}
                    </div>
                    <div class="message-time">
                        ${this.formatTime(msg.timestamp)}
                    </div>
                </div>
            </div>
        `).join('');
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    scrollToBottom() {
        if (this.container) {
            setTimeout(() => {
                this.container.scrollTop = this.container.scrollHeight;
            }, 50);
        }
    },

    clearChat() {
        this.messages = [];
        Storage.clearChatHistory();
        this.render();
        AudioManager.playClick();
    },

    addQuickMessage(text) {
        if (this.input) {
            this.input.value = text;
        }
    }
};
