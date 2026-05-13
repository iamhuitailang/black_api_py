const App = (function() {
    let currentSettings = {};
    let polyphoneQueue = [];
    let currentInput = '';
    let pinyinResults = [];

    function init() {
        currentSettings = StorageManager.getSettings();
        loadSettingsToUI();
        loadSavedState();
        bindEvents();
        renderHistory();
        updateCharCount();
    }

    function loadSettingsToUI() {
        const toneRadio = document.querySelector('input[name="toneMode"][value="' + (currentSettings.tone ? 'with' : 'without') + '"]');
        if (toneRadio) toneRadio.checked = true;
        
        const sepRadio = document.querySelector('input[name="separator"][value="' + currentSettings.separator + '"]');
        if (sepRadio) sepRadio.checked = true;
        
        document.getElementById('customSeparator').value = currentSettings.customSeparator;
        
        const caseRadio = document.querySelector('input[name="caseMode"][value="' + currentSettings.caseMode + '"]');
        if (caseRadio) caseRadio.checked = true;
        
        toggleCustomSeparator(currentSettings.separator === 'custom');
    }

    function loadSavedState() {
        const savedInput = StorageManager.getInputState();
        const savedOutput = StorageManager.getOutputState();
        
        if (savedInput) {
            document.getElementById('inputText').value = savedInput;
        }
        if (savedOutput) {
            document.getElementById('outputText').textContent = savedOutput;
        }
    }

    function bindEvents() {
        document.getElementById('convertBtn').addEventListener('click', handleConvert);
        document.getElementById('clearBtn').addEventListener('click', handleClear);
        document.getElementById('copyBtn').addEventListener('click', handleCopy);
        document.getElementById('exportBtn').addEventListener('click', handleExport);
        document.getElementById('clearHistoryBtn').addEventListener('click', handleClearHistory);

        document.querySelectorAll('input[name="toneMode"]').forEach(function(radio) {
            radio.addEventListener('change', handleSettingChange);
        });
        document.querySelectorAll('input[name="separator"]').forEach(function(radio) {
            radio.addEventListener('change', handleSettingChange);
        });
        document.getElementById('customSeparator').addEventListener('input', handleSettingChange);
        document.querySelectorAll('input[name="caseMode"]').forEach(function(radio) {
            radio.addEventListener('change', handleSettingChange);
        });

        document.getElementById('inputText').addEventListener('input', function() {
            updateCharCount();
            StorageManager.saveInputState(this.value);
        });

        document.querySelector('.modal-close').addEventListener('click', closePolyphoneModal);
        document.querySelector('.modal-confirm').addEventListener('click', handleConfirmPolyphone);
        document.querySelector('.modal-cancel').addEventListener('click', closePolyphoneModal);

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('history-use')) {
                useHistoryItem(parseInt(e.target.dataset.id));
            } else if (e.target.classList.contains('history-delete')) {
                deleteHistoryItem(parseInt(e.target.dataset.id));
            }
        });
    }

    function toggleCustomSeparator(show) {
        const customGroup = document.getElementById('customSeparatorGroup');
        if (show) {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
    }

    function handleSettingChange() {
        const toneRadio = document.querySelector('input[name="toneMode"]:checked');
        currentSettings.tone = toneRadio ? (toneRadio.value === 'with') : true;
        
        const sepRadio = document.querySelector('input[name="separator"]:checked');
        currentSettings.separator = sepRadio ? sepRadio.value : 'space';
        
        currentSettings.customSeparator = document.getElementById('customSeparator').value;
        
        const caseRadio = document.querySelector('input[name="caseMode"]:checked');
        currentSettings.caseMode = caseRadio ? caseRadio.value : 'lower';

        toggleCustomSeparator(currentSettings.separator === 'custom');
        StorageManager.saveSettings(currentSettings);
    }

    function updateCharCount() {
        const input = document.getElementById('inputText').value;
        document.getElementById('charCount').textContent = input.length;
    }

    function handleConvert() {
        const input = document.getElementById('inputText').value.trim();
        if (!input) {
            Utils.showToast('请输入要转换的文字');
            return;
        }

        currentInput = input;
        polyphoneQueue = [];
        pinyinResults = [];

        const chars = input.split('');
        chars.forEach(function(char, index) {
            if (Converter.isChineseChar(char) && PolyphoneManager.isPolyphone(char)) {
                polyphoneQueue.push({
                    char: char,
                    index: index,
                    options: PolyphoneManager.getPinyinOptions(char)
                });
            }
        });

        if (polyphoneQueue.length > 0) {
            showPolyphoneModal();
        } else {
            performConversion({});
        }
    }

    function showPolyphoneModal() {
        const modal = document.getElementById('polyphoneModal');
        const container = document.getElementById('polyphoneOptions');
        container.innerHTML = '';

        polyphoneQueue.forEach(function(item, queueIndex) {
            const div = document.createElement('div');
            div.className = 'polyphone-item';
            div.innerHTML = '<span class="polyphone-char">' + item.char + '</span>';

            item.options.forEach(function(pinyin, optIndex) {
                const label = document.createElement('label');
                label.innerHTML = '<input type="radio" name="polyphone_' + queueIndex + '" value="' + pinyin + '"' + (optIndex === 0 ? ' checked' : '') + '> ' + pinyin;
                div.appendChild(label);
            });

            container.appendChild(div);
        });

        modal.style.display = 'flex';
    }

    function closePolyphoneModal() {
        document.getElementById('polyphoneModal').style.display = 'none';
    }

    function handleConfirmPolyphone() {
        const selections = {};
        polyphoneQueue.forEach(function(item, queueIndex) {
            const selected = document.querySelector('input[name="polyphone_' + queueIndex + '"]:checked');
            if (selected) {
                selections[item.index] = selected.value;
            }
        });

        closePolyphoneModal();
        performConversion(selections);
    }

    function performConversion(polyphoneSelections) {
        const conversion = Converter.convert(currentInput, {
            tone: currentSettings.tone,
            separator: currentSettings.separator === 'space' ? ' ' : 
                       currentSettings.separator === 'custom' ? currentSettings.customSeparator : '',
            caseMode: currentSettings.caseMode,
            polyphoneSelections: polyphoneSelections
        });

        const result = conversion.result || conversion;
        document.getElementById('outputText').textContent = result;
        StorageManager.saveOutputState(result);
        drawToCanvas(result);

        StorageManager.addToHistory(currentInput, result, { ...currentSettings });
        renderHistory();
        Utils.showToast('转换成功！');
    }

    function drawToCanvas(text) {
        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.offsetWidth;
        canvas.height = Math.max(100, Math.ceil(text.length / 50) * 30 + 40);

        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#333';
        ctx.font = '16px "Microsoft YaHei", sans-serif';
        ctx.textBaseline = 'top';

        const lineHeight = 24;
        const maxWidth = canvas.width - 40;
        const words = text.split(/(\s+)/);
        let line = '';
        let y = 20;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, 20, y);
                line = words[i];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 20, y);
    }

    function handleClear() {
        document.getElementById('inputText').value = '';
        document.getElementById('outputText').textContent = '';
        StorageManager.saveInputState('');
        StorageManager.saveOutputState('');
        updateCharCount();
        
        const canvas = document.getElementById('outputCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function handleCopy() {
        const output = document.getElementById('outputText').textContent;
        if (!output) {
            Utils.showToast('没有可复制的内容');
            return;
        }

        navigator.clipboard.writeText(output).then(function() {
            Utils.showToast('已复制到剪贴板');
        }).catch(function() {
            const textarea = document.createElement('textarea');
            textarea.value = output;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Utils.showToast('已复制到剪贴板');
        });
    }

    function handleExport() {
        const output = document.getElementById('outputText').textContent;
        if (!output) {
            Utils.showToast('没有可导出的内容');
            return;
        }

        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pinyin_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Utils.showToast('导出成功！');
    }

    function renderHistory() {
        const history = StorageManager.getHistory();
        const container = document.getElementById('historyList');
        
        if (history.length === 0) {
            container.innerHTML = '<div class="history-empty">暂无历史记录</div>';
            return;
        }

        container.innerHTML = '';
        history.forEach(function(item) {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = 
                '<div class="history-content">' +
                    '<div class="history-input">' + escapeHtml(item.input.substring(0, 50)) + (item.input.length > 50 ? '...' : '') + '</div>' +
                    '<div class="history-output">' + escapeHtml(item.output.substring(0, 80)) + (item.output.length > 80 ? '...' : '') + '</div>' +
                '</div>' +
                '<div class="history-actions">' +
                    '<button class="history-use" data-id="' + item.id + '">使用</button>' +
                    '<button class="history-delete" data-id="' + item.id + '">删除</button>' +
                '</div>';
            container.appendChild(div);
        });
    }

    function useHistoryItem(id) {
        const history = StorageManager.getHistory();
        const item = history.find(function(h) { return h.id === id; });
        if (item) {
            document.getElementById('inputText').value = item.input;
            document.getElementById('outputText').textContent = item.output;
            StorageManager.saveInputState(item.input);
            StorageManager.saveOutputState(item.output);
            updateCharCount();
            drawToCanvas(item.output);
            Utils.showToast('已加载历史记录');
        }
    }

    function deleteHistoryItem(id) {
        StorageManager.deleteHistoryItem(id);
        renderHistory();
        Utils.showToast('已删除');
    }

    function handleClearHistory() {
        StorageManager.clearHistory();
        renderHistory();
        Utils.showToast('历史记录已清空');
    }

    function escapeHtml(text) {
        return Utils.escapeHtml(text);
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
