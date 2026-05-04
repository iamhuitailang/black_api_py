const App = {
    init() {
        this.applySettings();
        this.setupNavigation();
        this.registerRoutes();
        this.setupEventListeners();
        this.updateBadges();
        this.checkShareLink();
        Router.init();
    },

    checkShareLink() {
        const hash = window.location.hash;
        if (hash && hash.includes('share=')) {
            const shareData = ShareUtils.parseShareLink(hash);
            if (shareData) {
                this.showImportShareModal(shareData);
            }
        }
    },

    showImportShareModal(shareData) {
        const bankInfo = shareData.name || '分享的题库';
        const questionCount = shareData.questions?.length || 0;

        const modalContent = `
            <div class="modal-header">
                <h3 class="modal-title">📥 发现分享内容</h3>
                <button class="modal-close" data-action="close">✕</button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; padding: 16px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">
                        ${shareData.icon || '📚'}
                    </div>
                    <h4 style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
                        ${bankInfo}
                    </h4>
                    <p style="color: var(--text-secondary); margin-bottom: 4px;">
                        ${questionCount} 道题目
                    </p>
                    ${shareData.description ? `<p style="color: var(--text-secondary);">${shareData.description}</p>` : ''}
                </div>

                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-top: 16px;">
                    <p style="font-size: 14px; color: var(--text-secondary);">
                        💡 导入后，这个题库将添加到您的题库列表中，您可以开始学习。
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" data-action="cancel">跳过</button>
                <button class="btn btn-primary" data-action="import">导入题库</button>
            </div>
        `;

        this.showModal(modalContent);

        const modal = document.getElementById('modal-content');
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        const importBtn = modal.querySelector('[data-action="import"]');

        cancelBtn.onclick = async () => {
            this.hideModal();
            window.location.hash = '';
        };

        importBtn.onclick = async () => {
            const result = await ShareUtils.importShareData(shareData);
            this.hideModal();
            window.location.hash = '';

            if (result.success) {
                Toast.show(`成功导入 "${result.bankName}" (${result.questionCount} 题)`, 'success');
                EventBus.emit(EventBus.EVENTS.BANK_UPDATED);
                Router.navigate('bank', { id: result.bankId });
            } else {
                Toast.show('导入失败：' + result.message, 'error');
            }
        };
    },

    applySettings() {
        const settings = Storage.getSettings();
        Utils.applyTheme(settings.darkMode);
        Utils.applyFontSize(settings.fontSize);
    },

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-route]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                Router.navigate(route);
            });
        });
    },

    registerRoutes() {
        Router.register('home', () => HomePage.render());
        Router.register('bank', (params) => BankPage.render(params));
        Router.register('study', (params) => StudyPage.render(params));
        Router.register('wrong', () => WrongBookPage.render());
        Router.register('favorites', () => FavoritesPage.render());
        Router.register('review', () => ReviewPage.render());
        Router.register('stats', () => StatsPage.render());
        Router.register('settings', () => SettingsPage.render());
        Router.register('exam', (params) => ExamPage.render(params));
    },

    setupEventListeners() {
        EventBus.on(EventBus.EVENTS.BANK_UPDATED, () => this.updateBadges());
        EventBus.on(EventBus.EVENTS.BANK_DELETED, () => this.updateBadges());
        EventBus.on(EventBus.EVENTS.QUESTION_ANSWERED, () => this.updateBadges());
        EventBus.on(EventBus.EVENTS.WRONG_QUESTION_ADDED, () => this.updateBadges());
        EventBus.on(EventBus.EVENTS.WRONG_QUESTION_REMOVED, () => this.updateBadges());
        EventBus.on(EventBus.EVENTS.SETTINGS_UPDATED, (settings) => {
            Utils.applyTheme(settings.darkMode);
            Utils.applyFontSize(settings.fontSize);
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    },

    handleKeyboard(e) {
        const currentRoute = Router.getCurrentRoute();
        
        if (currentRoute === 'study' && StudyPage.handleKeyboard) {
            StudyPage.handleKeyboard(e);
        }
        
        if (currentRoute === 'exam' && ExamPage.handleKeyboard) {
            ExamPage.handleKeyboard(e);
        }
    },

    updateBadges() {
        const wrongQuestions = QuestionModel.getWrongQuestions();
        const reviewQuestions = QuestionModel.getQuestionsForReview();
        
        const wrongBadge = document.getElementById('wrong-badge');
        const reviewBadge = document.getElementById('review-badge');
        
        if (wrongBadge) {
            if (wrongQuestions.length > 0) {
                wrongBadge.textContent = wrongQuestions.length;
                wrongBadge.style.display = 'flex';
            } else {
                wrongBadge.style.display = 'none';
            }
        }
        
        if (reviewBadge) {
            if (reviewQuestions.length > 0) {
                reviewBadge.textContent = reviewQuestions.length;
                reviewBadge.style.display = 'flex';
            } else {
                reviewBadge.style.display = 'none';
            }
        }
    },

    showModal(content, options = {}) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('modal-content');
        
        if (!overlay || !modal) return;
        
        const {
            title = '',
            size = 'md',
            onClose = null
        } = options;
        
        modal.className = 'modal';
        if (size === 'lg') modal.classList.add('modal-lg');
        if (size === 'xl') modal.classList.add('modal-xl');
        
        if (typeof content === 'string') {
            modal.innerHTML = content;
        }
        
        overlay.classList.add('show');
        modal.dataset.onClose = onClose;
        
        const closeBtn = modal.querySelector('[data-action="close"]');
        if (closeBtn) {
            closeBtn.onclick = () => this.hideModal();
        }
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.hideModal();
            }
        };
    },

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('modal-content');
        
        if (!overlay || !modal) return;
        
        const onClose = modal.dataset.onClose;
        if (onClose && typeof window[onClose] === 'function') {
            window[onClose]();
        }
        
        overlay.classList.remove('show');
        modal.innerHTML = '';
    },

    confirm(message, title = '确认') {
        return new Promise((resolve) => {
            const modalContent = `
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" data-action="close">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-primary);">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">取消</button>
                    <button class="btn btn-primary" data-action="confirm">确认</button>
                </div>
            `;
            
            this.showModal(modalContent);
            
            const modal = document.getElementById('modal-content');
            const cancelBtn = modal.querySelector('[data-action="cancel"]');
            const confirmBtn = modal.querySelector('[data-action="confirm"]');
            
            const cleanup = () => {
                this.hideModal();
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                resolve(false);
            };
            
            confirmBtn.onclick = () => {
                cleanup();
                resolve(true);
            };
        });
    },

    getMainContent() {
        return document.getElementById('main-content');
    },

    renderMainContent(html) {
        const mainContent = this.getMainContent();
        if (mainContent) {
            mainContent.innerHTML = html;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.App = App;
