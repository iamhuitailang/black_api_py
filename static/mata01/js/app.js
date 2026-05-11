(function() {
    let state = null;
    let canvas = null;
    let saveTimeout = null;

    function init() {
        canvas = document.getElementById('posterCanvas');
        PosterRenderer.init(canvas);
        
        loadState();
        renderUI();
        bindEvents();
        renderPoster();
    }

    function loadState() {
        const savedState = StorageManager.loadState();
        if (savedState) {
            state = savedState;
            ensureStateComplete();
        } else {
            state = PosterTemplates.getDefaultState();
        }
    }

    function ensureStateComplete() {
        const defaults = PosterTemplates.getDefaultState();
        if (!state.decorations) {
            state.decorations = defaults.decorations;
        }
        if (state.decorations.showFlags === undefined) state.decorations.showFlags = true;
        if (state.decorations.showStars === undefined) state.decorations.showStars = true;
        if (state.decorations.showLights === undefined) state.decorations.showLights = true;
        if (state.decorations.showQR === undefined) state.decorations.showQR = true;
    }

    function saveState() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            StorageManager.saveState(state);
        }, 300);
    }

    function renderUI() {
        renderStyleSelector();
        renderCharacterSelector();
        populateFormFields();
        populateColorInputs();
        populateCheckboxInputs();
    }

    function renderStyleSelector() {
        const container = document.getElementById('styleSelector');
        container.innerHTML = '';
        
        const styles = PosterTemplates.getAllStyles();
        styles.forEach(style => {
            const option = document.createElement('div');
            option.className = 'style-option' + (state.styleId === style.id ? ' active' : '');
            option.dataset.styleId = style.id;
            
            const preview = document.createElement('div');
            preview.className = 'style-preview';
            preview.style.background = getStylePreview(style);
            
            const info = document.createElement('div');
            info.className = 'style-info';
            info.innerHTML = `
                <h4>${style.name}</h4>
                <p>${style.description}</p>
            `;
            
            option.appendChild(preview);
            option.appendChild(info);
            container.appendChild(option);
        });
    }

    function getStylePreview(style) {
        if (style.background.type === 'gradient' || style.background.type === 'stripes') {
            if (style.background.stops) {
                return `linear-gradient(135deg, ${style.background.stops.join(', ')})`;
            }
            return `linear-gradient(135deg, ${style.colors.primary}, ${style.colors.secondary})`;
        } else if (style.background.type === 'paper') {
            return style.background.baseColor;
        }
        return style.colors.primary;
    }

    function renderCharacterSelector() {
        const container = document.getElementById('characterSelector');
        container.innerHTML = '';
        
        const characters = PosterTemplates.getAllCharacters();
        characters.forEach(char => {
            const option = document.createElement('div');
            option.className = 'character-option' + (state.characterId === char.id ? ' active' : '');
            option.dataset.characterId = char.id;
            
            option.innerHTML = `
                <span>${char.emoji}</span>
                <label>${char.name}</label>
            `;
            
            container.appendChild(option);
        });
    }

    function populateFormFields() {
        document.getElementById('title').value = state.title || '';
        document.getElementById('subtitle').value = state.subtitle || '';
        document.getElementById('date').value = state.date || '';
        document.getElementById('location').value = state.location || '';
        document.getElementById('price').value = state.price || '';
        document.getElementById('qrLink').value = state.qrLink || '';
    }

    function populateColorInputs() {
        const style = PosterTemplates.getStyleById(state.styleId);
        const colors = state.customColors || style.colors;
        
        document.getElementById('primaryColor').value = colors.primary;
        document.getElementById('secondaryColor').value = colors.secondary;
        document.getElementById('textColor').value = colors.text;
    }

    function populateCheckboxInputs() {
        document.getElementById('showFlags').checked = state.decorations.showFlags;
        document.getElementById('showStars').checked = state.decorations.showStars;
        document.getElementById('showLights').checked = state.decorations.showLights;
        document.getElementById('showQR').checked = state.decorations.showQR;
    }

    function bindEvents() {
        document.getElementById('styleSelector').addEventListener('click', (e) => {
            const option = e.target.closest('.style-option');
            if (option) {
                state.styleId = option.dataset.styleId;
                state.customColors = null;
                renderStyleSelector();
                populateColorInputs();
                renderPoster();
                saveState();
            }
        });

        document.getElementById('characterSelector').addEventListener('click', (e) => {
            const option = e.target.closest('.character-option');
            if (option) {
                state.characterId = option.dataset.characterId;
                renderCharacterSelector();
                renderPoster();
                saveState();
            }
        });

        const textInputs = ['title', 'subtitle', 'date', 'location', 'price', 'qrLink'];
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', () => {
                state[id] = input.value;
                renderPoster();
                saveState();
            });
        });

        const colorInputs = ['primaryColor', 'secondaryColor', 'textColor'];
        colorInputs.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('input', () => {
                if (!state.customColors) {
                    const style = PosterTemplates.getStyleById(state.styleId);
                    state.customColors = { ...style.colors };
                }
                const colorKey = id.replace('Color', '').toLowerCase();
                state.customColors[colorKey] = input.value;
                renderPoster();
                saveState();
            });
        });

        const checkboxes = ['showFlags', 'showStars', 'showLights', 'showQR'];
        checkboxes.forEach(id => {
            const input = document.getElementById(id);
            input.addEventListener('change', () => {
                state.decorations[id] = input.checked;
                renderPoster();
                saveState();
            });
        });

        document.getElementById('resetColors').addEventListener('click', () => {
            state.customColors = null;
            populateColorInputs();
            renderPoster();
            saveState();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('确定要重置所有设置吗？')) {
                state = PosterTemplates.getDefaultState();
                renderUI();
                renderPoster();
                saveState();
            }
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            const filename = `${state.title || 'circus_poster'}_${Date.now()}.png`;
            PosterRenderer.downloadPoster(filename);
        });

        document.getElementById('bgImageInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    state.backgroundImage = event.target.result;
                    const img = new Image();
                    img.onload = () => {
                        renderPoster();
                        saveState();
                    };
                    img.src = event.target.result;
                    renderPoster();
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('clearBgImage').addEventListener('click', () => {
            state.backgroundImage = null;
            document.getElementById('bgImageInput').value = '';
            renderPoster();
            saveState();
        });

        document.getElementById('saveTemplate').addEventListener('click', () => {
            document.getElementById('saveModal').classList.add('show');
            document.getElementById('templateName').focus();
        });

        document.getElementById('loadTemplate').addEventListener('click', () => {
            showTemplateList();
            document.getElementById('templateModal').classList.add('show');
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        document.getElementById('confirmSave').addEventListener('click', () => {
            const name = document.getElementById('templateName').value.trim();
            if (!name) {
                alert('请输入模板名称');
                return;
            }
            const template = {
                name: name,
                state: JSON.parse(JSON.stringify(state))
            };
            StorageManager.saveTemplate(template);
            document.getElementById('saveModal').classList.remove('show');
            document.getElementById('templateName').value = '';
            alert('模板保存成功！');
        });
    }

    function showTemplateList() {
        const container = document.getElementById('templateList');
        const templates = StorageManager.getSavedTemplates();
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="empty-templates">
                    <span>📭</span>
                    <p>暂无保存的模板</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            const date = new Date(template.createdAt);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            item.innerHTML = `
                <div class="template-info">
                    <div class="template-name">${template.name}</div>
                    <div class="template-date">${dateStr}</div>
                </div>
                <div class="template-actions">
                    <button class="btn-delete" data-id="${template.id}">删除</button>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    state = JSON.parse(JSON.stringify(template.state));
                    renderUI();
                    renderPoster();
                    saveState();
                    document.getElementById('templateModal').classList.remove('show');
                }
            });

            const deleteBtn = item.querySelector('.btn-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('确定要删除这个模板吗？')) {
                    StorageManager.deleteTemplate(template.id);
                    showTemplateList();
                }
            });

            container.appendChild(item);
        });
    }

    function renderPoster() {
        PosterRenderer.render(state);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
