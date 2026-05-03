const LearningModule = {
    commands: [],
    container: null,
    form: null,
    commandInput: null,
    translationInput: null,
    addBtn: null,

    init() {
        this.container = document.getElementById('learned-list');
        this.form = document.getElementById('learn-form');
        this.commandInput = document.getElementById('learn-command');
        this.translationInput = document.getElementById('learn-translation');
        this.addBtn = document.getElementById('learn-add-btn');

        this.loadCommands();
        this.bindEvents();
        this.render();
    },

    loadCommands() {
        this.commands = Storage.getLearnedCommands();
    },

    bindEvents() {
        if (this.addBtn) {
            this.addBtn.addEventListener('click', () => this.addCommand());
        }

        if (this.commandInput) {
            this.commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.translationInput?.focus();
                }
            });
        }

        if (this.translationInput) {
            this.translationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCommand();
                }
            });
        }

        if (this.container) {
            this.container.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.learn-delete-btn');
                if (deleteBtn) {
                    const id = parseInt(deleteBtn.dataset.id);
                    this.deleteCommand(id);
                }

                const useBtn = e.target.closest('.learn-use-btn');
                if (useBtn) {
                    const id = parseInt(useBtn.dataset.id);
                    this.useCommand(id);
                }
            });
        }
    },

    addCommand() {
        const command = this.commandInput?.value.trim();
        const translation = this.translationInput?.value.trim();

        if (!command || !translation) {
            this.showToast('请输入完整内容！', 'error');
            return;
        }

        if (command.length > 20) {
            this.showToast('指令太长了（最多20字）', 'error');
            return;
        }

        if (translation.length > 50) {
            this.showToast('翻译太长了（最多50字）', 'error');
            return;
        }

        Storage.addLearnedCommand(command, translation);
        this.loadCommands();
        this.render();

        if (this.commandInput) this.commandInput.value = '';
        if (this.translationInput) this.translationInput.value = '';

        AudioManager.playSuccess();
        this.showToast('猫咪学会了新指令！🎉', 'success');
    },

    deleteCommand(id) {
        Storage.deleteLearnedCommand(id);
        this.loadCommands();
        this.render();
        AudioManager.playClick();
        this.showToast('已删除指令', 'info');
    },

    useCommand(id) {
        const cmd = this.commands.find(c => c.id === id);
        if (!cmd) return;

        this.showToast(`猫咪说：${cmd.translation}`, 'success');
        AudioManager.playMeow('short');
        CatAnimator.triggerMeow('short');
    },

    getRandomCommand() {
        if (this.commands.length === 0) return null;
        const index = Math.floor(Math.random() * this.commands.length);
        return this.commands[index];
    },

    translateLearned(input) {
        const normalized = input.trim().toLowerCase();
        return this.commands.find(cmd => 
            cmd.command.toLowerCase() === normalized ||
            normalized.includes(cmd.command.toLowerCase())
        );
    },

    render() {
        if (!this.container) return;

        if (this.commands.length === 0) {
            this.container.innerHTML = `
                <div class="learn-empty">
                    <div class="learn-empty-icon">📚</div>
                    <p>还没有学习任何指令</p>
                    <p class="hint">在上方输入框添加新指令，教猫咪说话～</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = `
            <div class="learn-list-header">
                <span>已学会 ${this.commands.length} 条指令</span>
            </div>
            ${this.commands.map(cmd => `
                <div class="learn-item">
                    <div class="learn-item-content">
                        <div class="learn-item-command">
                            <span class="command-label">🐱 猫语：</span>
                            <span class="command-text">${this.escapeHtml(cmd.command)}</span>
                        </div>
                        <div class="learn-item-translation">
                            <span class="translation-label">💬 人话：</span>
                            <span class="translation-text">${this.escapeHtml(cmd.translation)}</span>
                        </div>
                    </div>
                    <div class="learn-item-actions">
                        <button class="learn-use-btn" data-id="${cmd.id}" title="使用">
                            🔊
                        </button>
                        <button class="learn-delete-btn" data-id="${cmd.id}" title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('')}
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    }
};
