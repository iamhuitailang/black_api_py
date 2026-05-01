(function() {
    'use strict';

    let currentPoem = null;
    let elements = {};

    function init() {
        cacheElements();
        bindEvents();
        loadSavedSettings();
        CanvasRenderer.init(elements.canvas);
        tryRestoreLastPoem();
    }

    function cacheElements() {
        elements = {
            keywordsInput: document.getElementById('keywords'),
            formRadios: document.querySelectorAll('input[name="form"]'),
            styleRadios: document.querySelectorAll('input[name="style"]'),
            generateBtn: document.getElementById('generateBtn'),
            copyBtn: document.getElementById('copyBtn'),
            saveBtn: document.getElementById('saveBtn'),
            reGenerateBtn: document.getElementById('reGenerateBtn'),
            exampleBtns: document.querySelectorAll('.example-btn'),
            poemText: document.getElementById('poemText'),
            canvas: document.getElementById('poemCanvas'),
            resultSection: document.getElementById('resultSection')
        };
    }

    function bindEvents() {
        elements.generateBtn.addEventListener('click', handleGenerate);
        elements.copyBtn.addEventListener('click', handleCopy);
        elements.saveBtn.addEventListener('click', handleSave);
        elements.reGenerateBtn.addEventListener('click', handleReGenerate);

        elements.exampleBtns.forEach(btn => {
            btn.addEventListener('click', handleExampleClick);
        });

        elements.keywordsInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleGenerate();
            }
        });

        elements.formRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                Storage.saveSettings({ form: this.value });
            });
        });

        elements.styleRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                Storage.saveSettings({ style: this.value });
            });
        });
    }

    function loadSavedSettings() {
        const settings = Storage.getSettings();
        
        if (settings.form) {
            elements.formRadios.forEach(radio => {
                radio.checked = radio.value === settings.form;
            });
        }

        if (settings.style) {
            elements.styleRadios.forEach(radio => {
                radio.checked = radio.value === settings.style;
            });
        }
    }

    function tryRestoreLastPoem() {
        const lastPoem = Storage.getLastGenerated();
        if (lastPoem) {
            currentPoem = {
                success: true,
                keywords: lastPoem.keywords,
                form: lastPoem.form,
                style: lastPoem.style,
                lines: lastPoem.lines,
                hideWords: PoemGenerator.getHideWords(lastPoem.keywords),
                formName: PoemData.getFormName(lastPoem.form),
                styleName: PoemData.getStyleName(lastPoem.style)
            };
            
            elements.keywordsInput.value = lastPoem.keywords;
            elements.formRadios.forEach(radio => {
                radio.checked = radio.value === lastPoem.form;
            });
            elements.styleRadios.forEach(radio => {
                radio.checked = radio.value === lastPoem.style;
            });
            
            displayPoem(currentPoem);
            CanvasRenderer.render(currentPoem);
        }
    }

    function getSelectedForm() {
        const selected = document.querySelector('input[name="form"]:checked');
        return selected ? selected.value : 'five';
    }

    function getSelectedStyle() {
        const selected = document.querySelector('input[name="style"]:checked');
        return selected ? selected.value : 'classical';
    }

    function handleGenerate() {
        const keywords = elements.keywordsInput.value.trim();
        const form = getSelectedForm();
        const style = getSelectedStyle();

        const poem = PoemGenerator.generatePoem(keywords, form, style);

        if (!poem.success) {
            Utils.showError(poem.message);
            return;
        }

        currentPoem = poem;
        Storage.addToHistory(poem);
        displayPoem(poem);
        CanvasRenderer.render(poem);
        enableActionButtons();
        Utils.showSuccess('藏头诗生成成功！');
    }

    function handleExampleClick(e) {
        const btn = e.target;
        const keywords = btn.dataset.keywords;
        const form = btn.dataset.form;
        const style = btn.dataset.style;

        if (keywords) {
            elements.keywordsInput.value = keywords;
        }

        if (form) {
            elements.formRadios.forEach(radio => {
                radio.checked = radio.value === form;
            });
        }

        if (style) {
            elements.styleRadios.forEach(radio => {
                radio.checked = radio.value === style;
            });
        }

        handleGenerate();
    }

    function handleReGenerate() {
        if (!currentPoem) {
            Utils.showError('请先生成一首诗');
            return;
        }

        const poem = PoemGenerator.reGeneratePoem(currentPoem);

        if (!poem.success) {
            Utils.showError(poem.message);
            return;
        }

        currentPoem = poem;
        Storage.addToHistory(poem);
        displayPoem(poem);
        CanvasRenderer.render(poem);
        Utils.showSuccess('重新生成成功！');
    }

    async function handleCopy() {
        if (!currentPoem || !currentPoem.success) {
            Utils.showError('没有可复制的诗歌');
            return;
        }

        const text = PoemGenerator.formatPoem(currentPoem);
        const result = await Utils.copyToClipboard(text);

        if (result.success) {
            Utils.showSuccess(result.message);
        } else {
            Utils.showError(result.message);
        }
    }

    function handleSave() {
        if (!currentPoem || !currentPoem.success) {
            Utils.showError('没有可保存的诗歌');
            return;
        }

        const filename = Utils.generateFilename(currentPoem.keywords);
        const success = CanvasRenderer.downloadImage(filename);

        if (success) {
            Utils.showSuccess('图片保存成功！');
        } else {
            Utils.showError('保存失败，请重试');
        }
    }

    function displayPoem(poem) {
        if (!poem.success) {
            elements.poemText.innerHTML = `<p class="poem-line" style="color: #B22222;">${poem.message}</p>`;
            return;
        }

        const formattedLines = PoemGenerator.formatPoemWithHighlight(poem);
        let html = '';

        formattedLines.forEach(line => {
            const highlightedText = line.text.split('').map((char, index) => {
                if (index === line.hideIndex) {
                    return `<span class="hidden-word">${char}</span>`;
                }
                return char;
            }).join('');
            
            html += `<p class="poem-line">${highlightedText}</p>`;
        });

        elements.poemText.innerHTML = html;
    }

    function enableActionButtons() {
        elements.copyBtn.disabled = false;
        elements.saveBtn.disabled = false;
        elements.reGenerateBtn.disabled = false;
    }

    function disableActionButtons() {
        elements.copyBtn.disabled = true;
        elements.saveBtn.disabled = true;
        elements.reGenerateBtn.disabled = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
