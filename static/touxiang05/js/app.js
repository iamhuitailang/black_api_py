const App = (function() {
    let state = null;
    let canvas = null;

    function init() {
        state = Storage.loadCurrentState();
        canvas = document.getElementById('preview-canvas');
        
        Renderer.init(canvas);
        AnimationModule.init(canvas, renderWithOptions);
        
        UI.initTabs((tabId) => {
            state.activeTab = tabId;
            saveState();
        });
        UI.initModals();
        
        initModules();
        initEventListeners();
        
        render();
        updateUIState();
        
        if (state.activeTab && state.activeTab !== 'face') {
            UI.switchToTab(state.activeTab);
        }
        
        window.addEventListener('beforeunload', saveState);
    }

    function initModules() {
        FaceModule.init((faceId) => {
            state.face = faceId;
            saveAndRender();
        });

        HairModule.init({
            onSkinChange: (color) => {
                state.skinColor = color;
                saveAndRender();
            },
            onHairColorChange: (color) => {
                state.hairColor = color;
                saveAndRender();
            },
            onHairStyleChange: (style) => {
                state.hair = style;
                saveAndRender();
            }
        });

        FeaturesModule.init({
            onEyeChange: (id) => {
                state.eyes = id;
                saveAndRender();
            },
            onEyebrowChange: (id) => {
                state.eyebrow = id;
                saveAndRender();
            },
            onMouthChange: (id) => {
                state.mouth = id;
                saveAndRender();
            },
            onNoseChange: (id) => {
                state.nose = id;
                saveAndRender();
            },
            onBlushChange: (id) => {
                state.blush = id;
                saveAndRender();
            }
        });

        ClothingModule.init({
            onShirtChange: (id) => {
                state.shirt = id;
                saveAndRender();
            },
            onHeadwearChange: (id) => {
                state.headwear = id;
                saveAndRender();
            },
            onFaceAccessoryChange: (id) => {
                state.faceAccessory = id;
                saveAndRender();
            },
            onBackgroundChange: (id) => {
                state.background = id;
                if (id === 'solid' || id === 'grid') {
                    if (!state.backgroundColor) {
                        state.backgroundColor = PixelData.backgroundColors[0];
                    }
                }
                saveAndRender();
            }
        });
    }

    function initEventListeners() {
        document.getElementById('btn-save').addEventListener('click', saveToHistory);
        
        document.getElementById('btn-history').addEventListener('click', () => {
            renderHistoryModal();
            UI.showModal('history-modal');
        });
        
        document.getElementById('close-history').addEventListener('click', () => {
            UI.hideModal('history-modal');
        });

        document.getElementById('btn-export-png').addEventListener('click', exportPNG);
        document.getElementById('btn-export-gif').addEventListener('click', exportGIF);
        
        document.getElementById('btn-share').addEventListener('click', () => {
            generateShareLink();
            UI.showModal('share-modal');
        });
        document.getElementById('close-share').addEventListener('click', () => {
            UI.hideModal('share-modal');
        });
        document.getElementById('btn-copy-link').addEventListener('click', copyShareLink);
        
        document.getElementById('btn-clear').addEventListener('click', clearAll);
        
        document.getElementById('animation-blink').addEventListener('change', (e) => {
            state.animation.blink = e.target.checked;
            AnimationModule.setBlinking(state.animation.blink);
            saveState();
        });
        
        document.getElementById('animation-breathe').addEventListener('change', (e) => {
            state.animation.breathe = e.target.checked;
            AnimationModule.setBreathing(state.animation.breathe);
            saveState();
        });
        
        document.getElementById('btn-test-expression').addEventListener('click', () => {
            AnimationModule.setState(state);
            AnimationModule.testExpression();
        });
    }

    function updateUIState() {
        FaceModule.updateActive(state.face);
        
        HairModule.updateActiveSkinColor(state.skinColor);
        HairModule.updateActiveHairColor(state.hairColor);
        HairModule.updateActiveHairstyle(state.hair);
        
        FeaturesModule.updateActive('eye', state.eyes);
        FeaturesModule.updateActive('eyebrow', state.eyebrow);
        FeaturesModule.updateActive('mouth', state.mouth);
        FeaturesModule.updateActive('nose', state.nose);
        FeaturesModule.updateActive('blush', state.blush);
        
        ClothingModule.updateActive('shirt', state.shirt);
        ClothingModule.updateActive('headwear', state.headwear);
        ClothingModule.updateActive('faceAccessory', state.faceAccessory);
        ClothingModule.updateActive('background', state.background);
        
        document.getElementById('animation-blink').checked = state.animation.blink;
        document.getElementById('animation-breathe').checked = state.animation.breathe;
        
        if (state.animation.blink || state.animation.breathe) {
            AnimationModule.setState(state);
            if (state.animation.blink) {
                AnimationModule.setBlinking(true);
            }
            if (state.animation.breathe) {
                AnimationModule.setBreathing(true);
            }
        }
    }

    function render() {
        Renderer.render(state, {});
        AnimationModule.setState(state);
    }

    function renderWithOptions(currentState, options) {
        Renderer.render(currentState, options);
    }

    function saveState() {
        Storage.saveCurrentState(state);
    }

    function saveAndRender() {
        render();
        saveState();
    }

    function saveToHistory() {
        const imageData = Renderer.toDataURL();
        Storage.saveToHistory(state, imageData);
        renderHistoryModal();
    }

    function renderHistoryModal() {
        const historyContainer = document.getElementById('history-list');
        const history = Storage.getHistory();
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-history">暂无历史记录<br>点击"保存"按钮可以保存当前设计</div>';
            return;
        }
        
        let html = '<div class="history-grid">';
        history.forEach((record, index) => {
            html += `
                <div class="history-item" data-id="${record.id}" data-index="${index}">
                    <img src="${record.imageData}" alt="历史记录 ${index + 1}">
                    <button class="history-delete" data-delete="${record.id}">×</button>
                </div>
            `;
        });
        html += '</div>';
        
        historyContainer.innerHTML = html;
        
        historyContainer.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('history-delete')) return;
                const recordId = parseInt(item.dataset.id);
                const record = history.find(r => r.id === recordId);
                if (record) {
                    loadHistoryState(record.state);
                    UI.hideModal('history-modal');
                }
            });
        });
        
        historyContainer.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recordId = parseInt(btn.dataset.delete);
                Storage.deleteFromHistory(recordId);
                renderHistoryModal();
            });
        });
    }

    function loadHistoryState(historyState) {
        state = Object.assign({}, state, historyState);
        render();
        updateUIState();
        saveState();
    }

    function exportPNG() {
        AnimationModule.stopAll();
        render();
        
        const dataUrl = Renderer.toDataURL();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `pixel-avatar-${timestamp}.png`;
        
        UI.downloadFile(dataUrl, filename);
        
        if (state.animation.blink) {
            AnimationModule.setBlinking(true);
        }
        if (state.animation.breathe) {
            AnimationModule.setBreathing(true);
        }
    }

    function exportGIF() {
        AnimationModule.stopAll();
        render();
        
        const dataUrl = Renderer.toDataURL();
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `pixel-avatar-${timestamp}.png`;
        
        alert('GIF导出功能需要额外的GIF编码库支持。\n\n当前已导出为PNG格式，同样可以用于大多数场景。\n如需真GIF动画，可以使用在线转换工具。');
        
        UI.downloadFile(dataUrl, filename);
    }

    function generateShareLink() {
        const stateString = JSON.stringify(state);
        const encodedState = btoa(encodeURIComponent(stateString));
        const shareUrl = `${window.location.origin}${window.location.pathname}?avatar=${encodedState}`;
        document.getElementById('share-link').value = shareUrl;
    }

    function copyShareLink() {
        const linkInput = document.getElementById('share-link');
        linkInput.select();
        document.execCommand('copy');
        
        const btn = document.getElementById('btn-copy-link');
        const originalText = btn.textContent;
        btn.textContent = '已复制!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    function loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const avatarParam = urlParams.get('avatar');
        
        if (avatarParam) {
            try {
                const decoded = decodeURIComponent(atob(avatarParam));
                const loadedState = JSON.parse(decoded);
                state = Object.assign(state, loadedState);
            } catch (e) {
                console.error('解析分享链接失败:', e);
            }
        }
    }

    function clearAll() {
        if (confirm('确定要清空所有设置吗？')) {
            AnimationModule.stopAll();
            state = Storage.getDefaultState();
            render();
            updateUIState();
            saveState();
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        state,
        render,
        saveState,
        init
    };
})();