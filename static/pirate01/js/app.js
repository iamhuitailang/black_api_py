const App = (function() {
    let elements = {};
    let currentTheme = 'pirate';
    let isSpeaking = false;

    function init() {
        cacheElements();
        loadSavedState();
        bindEvents();
        initRenderer();
    }

    function cacheElements() {
        elements = {
            canvas: document.getElementById('gameCanvas'),
            inputText: document.getElementById('inputText'),
            outputText: document.getElementById('outputText'),
            translateBtn: document.getElementById('translateBtn'),
            randomBtn: document.getElementById('randomBtn'),
            historyBtn: document.getElementById('historyBtn'),
            speakBtn: document.getElementById('speakBtn'),
            copyBtn: document.getElementById('copyBtn'),
            shareBtn: document.getElementById('shareBtn'),
            historyModal: document.getElementById('historyModal'),
            historyList: document.getElementById('historyList'),
            closeHistoryBtn: document.getElementById('closeHistoryBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            imageModal: document.getElementById('imageModal'),
            shareImage: document.getElementById('shareImage'),
            closeImageBtn: document.getElementById('closeImageBtn'),
            downloadImageBtn: document.getElementById('downloadImageBtn'),
            themeBtns: document.querySelectorAll('.theme-btn'),
            exampleBtns: document.querySelectorAll('.example-btn')
        };
    }

    function loadSavedState() {
        const settings = Storage.getSettings();
        currentTheme = settings.theme || 'pirate';
        
        if (settings.lastInput) {
            elements.inputText.value = settings.lastInput;
        }
        if (settings.lastOutput) {
            elements.outputText.textContent = settings.lastOutput;
        }
        
        updateThemeUI();
    }

    let currentImageDataUrl = null;

    function bindEvents() {
        elements.translateBtn.addEventListener('click', handleTranslate);
        elements.randomBtn.addEventListener('click', handleRandomQuote);
        elements.historyBtn.addEventListener('click', openHistoryModal);
        elements.closeHistoryBtn.addEventListener('click', closeHistoryModal);
        elements.clearHistoryBtn.addEventListener('click', handleClearHistory);
        
        elements.speakBtn.addEventListener('click', handleSpeak);
        elements.copyBtn.addEventListener('click', handleCopy);
        elements.shareBtn.addEventListener('click', handleShare);
        
        elements.closeImageBtn.addEventListener('click', closeImageModal);
        elements.downloadImageBtn.addEventListener('click', downloadCurrentImage);
        
        elements.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                setTheme(theme);
            });
        });
        
        elements.exampleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.inputText.value = btn.dataset.text;
            });
        });
        
        elements.inputText.addEventListener('input', handleInputChange);
        
        elements.historyModal.addEventListener('click', (e) => {
            if (e.target === elements.historyModal) {
                closeHistoryModal();
            }
        });
        
        elements.imageModal.addEventListener('click', (e) => {
            if (e.target === elements.imageModal) {
                closeImageModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeHistoryModal();
                closeImageModal();
            }
        });
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {};
        }
    }

    function initRenderer() {
        Renderer.init(elements.canvas);
        setTheme(currentTheme);
    }

    function setTheme(theme) {
        currentTheme = theme;
        document.body.classList.remove('theme-pirate', 'theme-deepsea', 'theme-steampunk');
        document.body.classList.add(`theme-${theme}`);
        
        Renderer.setTheme(theme);
        Storage.setTheme(theme);
        
        updateThemeUI();
    }

    function updateThemeUI() {
        elements.themeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('active');
            }
        });
    }

    function handleInputChange() {
        Storage.setLastInput(elements.inputText.value);
    }

    function handleTranslate() {
        const input = elements.inputText.value.trim();
        
        if (!input) {
            showToast('请输入要翻译的文本，matey!', 'warning');
            return;
        }
        
        const translated = Translator.translate(input);
        elements.outputText.textContent = translated;
        
        Storage.setLastInput(input);
        Storage.setLastOutput(translated);
        Storage.addHistoryItem(input, translated);
        
        showToast('翻译完成，Arrr!', 'success');
    }

    function handleRandomQuote() {
        const quote = Translator.getRandomQuote();
        elements.outputText.textContent = quote;
        elements.inputText.value = '';
        
        Storage.setLastInput('');
        Storage.setLastOutput(quote);
        Storage.addHistoryItem('[随机语录]', quote);
        
        showToast('随机海盗语录生成!', 'success');
    }

    async function handleSpeak() {
        const text = elements.outputText.textContent.trim();
        
        if (!text) {
            showToast('没有内容可以朗读，matey!', 'warning');
            return;
        }
        
        if (isSpeaking) {
            Translator.stopSpeaking();
            isSpeaking = false;
            elements.speakBtn.textContent = '🔊 朗读';
            return;
        }
        
        try {
            isSpeaking = true;
            elements.speakBtn.textContent = '⏹️ 停止';
            await Translator.speak(text);
        } catch (error) {
            showToast('朗读功能不可用，shiver me timbers!', 'error');
            console.error('Speak error:', error);
        } finally {
            isSpeaking = false;
            elements.speakBtn.textContent = '🔊 朗读';
        }
    }

    async function handleCopy() {
        const text = elements.outputText.textContent.trim();
        
        if (!text) {
            showToast('没有内容可以复制，matey!', 'warning');
            return;
        }
        
        try {
            await Translator.copyToClipboard(text);
            showToast('已复制到剪贴板，Arrr!', 'success');
        } catch (error) {
            showToast('复制失败，shiver me timbers!', 'error');
            console.error('Copy error:', error);
        }
    }

    async function handleShare() {
        const text = elements.outputText.textContent.trim();
        const originalText = elements.inputText.value.trim();
        
        if (!text) {
            showToast('没有内容可以分享，matey!', 'warning');
            return;
        }
        
        showToast('正在生成分享图片...', 'info');
        
        try {
            currentImageDataUrl = await Translator.generateShareImage(text, originalText, currentTheme);
            elements.shareImage.src = currentImageDataUrl;
            openImageModal();
            showToast('图片生成成功！', 'success');
        } catch (error) {
            showToast('分享失败，shiver me timbers!', 'error');
            console.error('Share error:', error);
        }
    }

    function openImageModal() {
        elements.imageModal.classList.remove('hidden');
    }

    function closeImageModal() {
        elements.imageModal.classList.add('hidden');
    }

    function downloadCurrentImage() {
        if (!currentImageDataUrl) {
            showToast('没有图片可以下载，matey!', 'warning');
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.download = 'pirate-translation.png';
            link.href = currentImageDataUrl;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
            showToast('图片已下载，Yo ho ho!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('下载失败，shiver me timbers!', 'error');
        }
    }

    function openHistoryModal() {
        renderHistoryList();
        elements.historyModal.classList.remove('hidden');
        Storage.saveState({ historyModalOpen: true });
    }

    function closeHistoryModal() {
        elements.historyModal.classList.add('hidden');
        Storage.saveState({ historyModalOpen: false });
    }

    function renderHistoryList() {
        const history = Storage.getHistory();
        
        if (history.length === 0) {
            elements.historyList.innerHTML = '<div class="history-empty">📜 暂无翻译历史，开始翻译吧!</div>';
            return;
        }
        
        elements.historyList.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="original">📝 ${escapeHtml(item.original)}</div>
                <div class="translated">⚓ ${escapeHtml(item.translated)}</div>
                <div class="timestamp">${Storage.formatTimestamp(item.timestamp)}</div>
            </div>
        `).join('');
        
        elements.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const historyItem = history.find(h => h.id === id);
                if (historyItem) {
                    elements.inputText.value = historyItem.original === '[随机语录]' ? '' : historyItem.original;
                    elements.outputText.textContent = historyItem.translated;
                    Storage.setLastInput(elements.inputText.value);
                    Storage.setLastOutput(historyItem.translated);
                    closeHistoryModal();
                    showToast('已加载历史记录，Arrr!', 'success');
                }
            });
        });
    }

    function handleClearHistory() {
        if (confirm('确定要清空所有翻译历史吗？这无法撤销!')) {
            Storage.clearHistory();
            renderHistoryList();
            showToast('历史记录已清空，shiver me timbers!', 'success');
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            zIndex: '1000',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            maxWidth: '90%',
            textAlign: 'center'
        });
        
        const colors = {
            success: { bg: '#28a745', text: '#fff' },
            warning: { bg: '#ffc107', text: '#000' },
            error: { bg: '#dc3545', text: '#fff' },
            info: { bg: '#17a2b8', text: '#fff' }
        };
        
        const color = colors[type] || colors.info;
        toast.style.background = color.bg;
        toast.style.color = color.text;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(-10px)';
        });
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    return {
        init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
