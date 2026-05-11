(function(global) {
    'use strict';
    
    const App = {
        state: null,
        currentDecorationCategory: 'feathers',
        autoSaveTimeout: null,
        
        init: function() {
            const self = this;
            
            this.loadState();
            
            if (!Renderer.init('maskCanvas')) {
                console.error('Failed to initialize renderer');
                return;
            }
            
            DecorationsManager.init('decorationsLayer', this);
            ExportService.init(Renderer, DecorationsManager);
            
            this.initUI();
            this.render();
            this.bindEvents();
            
            this.startAutoSave();
            
            window.addEventListener('beforeunload', function() {
                self.saveState();
            });
        },
        
        loadState: function() {
            const saved = Storage.load();
            if (saved) {
                this.state = Object.assign({}, Data.defaultState, saved);
            } else {
                this.state = JSON.parse(JSON.stringify(Data.defaultState));
            }
            
            if (!this.state.saveHistory) {
                this.state.saveHistory = [];
            }
            if (!this.state.history) {
                this.state.history = [];
            }
            if (this.state.historyIndex === undefined) {
                this.state.historyIndex = -1;
            }
        },
        
        saveState: function() {
            Storage.save({
                maskShape: this.state.maskShape,
                primaryColor: this.state.primaryColor,
                secondaryColor: this.state.secondaryColor,
                texture: this.state.texture,
                eyeShape: this.state.eyeShape,
                lensColor: this.state.lensColor,
                decorations: this.state.decorations,
                selectedDecorationId: this.state.selectedDecorationId,
                saveHistory: this.state.saveHistory
            });
        },
        
        startAutoSave: function() {
            const self = this;
            setInterval(function() {
                self.saveState();
            }, 5000);
        },
        
        saveToHistory: function(description) {
            description = description || this.generateHistoryDescription();
            
            const snapshot = {
                maskShape: this.state.maskShape,
                primaryColor: this.state.primaryColor,
                secondaryColor: this.state.secondaryColor,
                texture: this.state.texture,
                eyeShape: this.state.eyeShape,
                lensColor: this.state.lensColor,
                decorations: JSON.parse(JSON.stringify(this.state.decorations)),
                description: description,
                timestamp: Date.now()
            };
            
            if (this.state.historyIndex < this.state.history.length - 1) {
                this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
            }
            
            this.state.history.push(snapshot);
            if (this.state.history.length > 50) {
                this.state.history.shift();
            } else {
                this.state.historyIndex++;
            }
            
            this.saveState();
            this.renderHistoryList();
        },
        
        generateHistoryDescription: function() {
            const maskShape = Data.maskShapes.find(function(s) { return s.id === this.state.maskShape; }.bind(this));
            const texture = Data.textures.find(function(t) { return t.id === this.state.texture; }.bind(this));
            const eyeShape = Data.eyeShapes.find(function(e) { return e.id === this.state.eyeShape; }.bind(this));
            
            let desc = (maskShape ? maskShape.name : '面具') + ' - ';
            desc += (texture ? texture.name : '纯色') + ' - ';
            desc += (eyeShape ? eyeShape.name : '杏仁形');
            
            const decoCount = this.state.decorations.length;
            if (decoCount > 0) {
                desc += ' (' + decoCount + '个装饰)';
            }
            
            return desc;
        },
        
        undo: function() {
            if (this.state.historyIndex > 0) {
                this.state.historyIndex--;
                const snapshot = this.state.history[this.state.historyIndex];
                this.applySnapshot(snapshot);
                this.renderHistoryList();
                Helpers.showToast('撤销成功');
            } else {
                Helpers.showToast('无可撤销操作');
            }
        },
        
        redo: function() {
            if (this.state.historyIndex < this.state.history.length - 1) {
                this.state.historyIndex++;
                const snapshot = this.state.history[this.state.historyIndex];
                this.applySnapshot(snapshot);
                this.renderHistoryList();
                Helpers.showToast('重做成功');
            } else {
                Helpers.showToast('无可重做操作');
            }
        },
        
        goToHistoryIndex: function(index) {
            if (index >= 0 && index < this.state.history.length) {
                this.state.historyIndex = index;
                const snapshot = this.state.history[index];
                this.applySnapshot(snapshot);
                this.renderHistoryList();
                Helpers.showToast('已恢复到历史记录 ' + (index + 1));
            }
        },
        
        clearHistory: function() {
            this.state.saveHistory = [];
            this.saveState();
            this.renderHistoryList();
            Helpers.showToast('保存历史已清除');
        },
        
        saveToSaveHistory: function(customName) {
            const description = customName || this.generateHistoryDescription();
            
            const snapshot = {
                maskShape: this.state.maskShape,
                primaryColor: this.state.primaryColor,
                secondaryColor: this.state.secondaryColor,
                texture: this.state.texture,
                eyeShape: this.state.eyeShape,
                lensColor: this.state.lensColor,
                decorations: JSON.parse(JSON.stringify(this.state.decorations)),
                description: description,
                timestamp: Date.now()
            };
            
            this.state.saveHistory.push(snapshot);
            
            if (this.state.saveHistory.length > 50) {
                this.state.saveHistory.shift();
            }
            
            this.saveState();
            this.renderHistoryList();
        },
        
        restoreFromSaveHistory: function(index) {
            if (index >= 0 && index < this.state.saveHistory.length) {
                const snapshot = this.state.saveHistory[index];
                this.applySnapshot(snapshot);
                Helpers.showToast('已恢复到保存的历史记录');
            }
        },
        
        applySnapshot: function(snapshot) {
            this.state.maskShape = snapshot.maskShape;
            this.state.primaryColor = snapshot.primaryColor;
            this.state.secondaryColor = snapshot.secondaryColor;
            this.state.texture = snapshot.texture;
            this.state.eyeShape = snapshot.eyeShape;
            this.state.lensColor = snapshot.lensColor;
            this.state.decorations = JSON.parse(JSON.stringify(snapshot.decorations));
            this.state.selectedDecorationId = null;
            
            this.updateUI();
            this.render();
            this.renderHistoryList();
        },
        
        initUI: function() {
            this.renderMaskShapes();
            this.renderPresetColors();
            this.renderTextures();
            this.renderEyeShapes();
            this.renderLensColors();
            this.renderDecorationTabs();
            this.renderDecorationItems();
            this.renderHistoryList();
        },
        
        updateUI: function() {
            this.updateActiveStates();
            this.updateColorInputs();
            DecorationsManager.render();
            this.updateDecorationControls();
            this.renderHistoryList();
        },
        
        updateActiveStates: function() {
            const self = this;
            
            document.querySelectorAll('.shape-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.shape === self.state.maskShape);
            });
            
            document.querySelectorAll('.texture-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.texture === self.state.texture);
            });
            
            document.querySelectorAll('.eye-shape-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.eye === self.state.eyeShape);
            });
            
            document.querySelectorAll('.lens-color').forEach(function(btn) {
                btn.classList.toggle('active', btn.dataset.lens === self.state.lensColor);
            });
        },
        
        updateColorInputs: function() {
            const primaryColor = document.getElementById('primaryColor');
            const primaryColorText = document.getElementById('primaryColorText');
            const secondaryColor = document.getElementById('secondaryColor');
            const secondaryColorText = document.getElementById('secondaryColorText');
            
            if (primaryColor) primaryColor.value = this.state.primaryColor;
            if (primaryColorText) primaryColorText.value = this.state.primaryColor;
            if (secondaryColor) secondaryColor.value = this.state.secondaryColor;
            if (secondaryColorText) secondaryColorText.value = this.state.secondaryColor;
        },
        
        render: function() {
            Renderer.render(this.state);
            DecorationsManager.render();
        },
        
        renderMaskShapes: function() {
            const self = this;
            const container = document.getElementById('maskShapes');
            if (!container) return;
            
            container.innerHTML = '';
            
            Data.maskShapes.forEach(function(shape) {
                const btn = document.createElement('button');
                btn.className = 'shape-btn';
                if (shape.id === self.state.maskShape) {
                    btn.classList.add('active');
                }
                btn.dataset.shape = shape.id;
                btn.innerHTML = '<div>' + shape.icon + '</div><div>' + shape.name + '</div>';
                btn.title = shape.desc;
                
                btn.addEventListener('click', function() {
                    self.state.maskShape = shape.id;
                    self.updateActiveStates();
                    self.render();
                    self.saveToHistory();
                });
                
                container.appendChild(btn);
            });
        },
        
        renderPresetColors: function() {
            const self = this;
            
            function renderColors(containerId, isPrimary) {
                const container = document.getElementById(containerId);
                if (!container) return;
                
                container.innerHTML = '';
                
                Data.presetColors.forEach(function(color) {
                    const btn = document.createElement('div');
                    btn.className = 'preset-color';
                    btn.style.backgroundColor = color;
                    btn.dataset.color = color;
                    
                    if ((isPrimary && color === self.state.primaryColor) ||
                        (!isPrimary && color === self.state.secondaryColor)) {
                        btn.classList.add('active');
                    }
                    
                    btn.addEventListener('click', function() {
                        if (isPrimary) {
                            self.state.primaryColor = color;
                        } else {
                            self.state.secondaryColor = color;
                        }
                        self.updateColorInputs();
                        self.renderPresetColors();
                        self.render();
                        self.saveToHistory();
                    });
                    
                    container.appendChild(btn);
                });
            }
            
            renderColors('primaryPresetColors', true);
            renderColors('secondaryPresetColors', false);
        },
        
        renderTextures: function() {
            const self = this;
            const container = document.getElementById('textures');
            if (!container) return;
            
            container.innerHTML = '';
            
            Data.textures.forEach(function(texture) {
                const btn = document.createElement('button');
                btn.className = 'texture-btn';
                if (texture.id === self.state.texture) {
                    btn.classList.add('active');
                }
                btn.dataset.texture = texture.id;
                btn.textContent = texture.name;
                
                btn.addEventListener('click', function() {
                    self.state.texture = texture.id;
                    self.updateActiveStates();
                    self.render();
                    self.saveToHistory();
                });
                
                container.appendChild(btn);
            });
        },
        
        renderEyeShapes: function() {
            const self = this;
            const container = document.getElementById('eyeShapes');
            if (!container) return;
            
            container.innerHTML = '';
            
            Data.eyeShapes.forEach(function(eye) {
                const btn = document.createElement('button');
                btn.className = 'eye-shape-btn';
                if (eye.id === self.state.eyeShape) {
                    btn.classList.add('active');
                }
                btn.dataset.eye = eye.id;
                btn.textContent = eye.name;
                
                btn.addEventListener('click', function() {
                    self.state.eyeShape = eye.id;
                    self.updateActiveStates();
                    self.render();
                    self.saveToHistory();
                });
                
                container.appendChild(btn);
            });
        },
        
        renderLensColors: function() {
            const self = this;
            const container = document.getElementById('lensColors');
            if (!container) return;
            
            container.innerHTML = '';
            
            Data.lensColors.forEach(function(lens) {
                const btn = document.createElement('div');
                btn.className = 'lens-color';
                if (lens.id === self.state.lensColor) {
                    btn.classList.add('active');
                }
                btn.dataset.lens = lens.id;
                btn.title = lens.name;
                
                if (lens.id === 'transparent') {
                    btn.style.background = 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)';
                    btn.style.backgroundSize = '8px 8px';
                    btn.style.backgroundPosition = '0 0, 0 4px, 4px -4px, -4px 0px';
                } else if (lens.id === 'gradient') {
                    btn.style.background = 'linear-gradient(135deg, #EF4444, #8B5CF6, #3B82F6)';
                } else {
                    btn.style.background = lens.color;
                }
                
                btn.addEventListener('click', function() {
                    self.state.lensColor = lens.id;
                    self.updateActiveStates();
                    self.render();
                    self.saveToHistory();
                });
                
                container.appendChild(btn);
            });
        },
        
        renderDecorationTabs: function() {
            const self = this;
            const container = document.getElementById('decorationTabs');
            if (!container) return;
            
            container.innerHTML = '';
            
            Data.decorationCategories.forEach(function(cat) {
                const btn = document.createElement('button');
                btn.className = 'tab-btn';
                if (cat.id === self.currentDecorationCategory) {
                    btn.classList.add('active');
                }
                btn.dataset.category = cat.id;
                btn.textContent = cat.name;
                
                btn.addEventListener('click', function() {
                    self.currentDecorationCategory = cat.id;
                    self.renderDecorationTabs();
                    self.renderDecorationItems();
                });
                
                container.appendChild(btn);
            });
        },
        
        renderDecorationItems: function() {
            const self = this;
            const container = document.getElementById('decorationItems');
            if (!container) return;
            
            container.innerHTML = '';
            
            const items = Data.decorations[this.currentDecorationCategory] || [];
            
            items.forEach(function(item) {
                const btn = document.createElement('button');
                btn.className = 'decoration-item-btn';
                btn.title = item.name;
                btn.textContent = item.icon;
                btn.draggable = true;
                
                btn.addEventListener('click', function() {
                    DecorationsManager.addDecoration(item);
                    Helpers.showToast('已添加: ' + item.name);
                });
                
                btn.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', JSON.stringify(item));
                });
                
                container.appendChild(btn);
            });
        },
        
        updateDecorationControls: function() {
            const controlsPanel = document.getElementById('decorationControls');
            if (!controlsPanel) return;
            
            const selected = this.state.selectedDecorationId ? 
                DecorationsManager.getDecoration(this.state.selectedDecorationId) : null;
            
            if (selected) {
                controlsPanel.style.display = 'block';
                
                const sizeSlider = document.getElementById('decorationSize');
                const sizeValue = document.getElementById('decorationSizeValue');
                const rotationSlider = document.getElementById('decorationRotation');
                const rotationValue = document.getElementById('decorationRotationValue');
                const opacitySlider = document.getElementById('decorationOpacity');
                const opacityValue = document.getElementById('decorationOpacityValue');
                
                if (sizeSlider) {
                    sizeSlider.value = Math.round(selected.size);
                    sizeValue.textContent = Math.round(selected.size);
                }
                if (rotationSlider) {
                    rotationSlider.value = Math.round(selected.rotation);
                    rotationValue.textContent = Math.round(selected.rotation) + '°';
                }
                if (opacitySlider) {
                    opacitySlider.value = selected.opacity;
                    opacityValue.textContent = Math.round(selected.opacity * 100) + '%';
                }
            } else {
                controlsPanel.style.display = 'none';
            }
        },
        
        renderHistoryList: function() {
            const self = this;
            const container = document.getElementById('historyList');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!this.state.saveHistory || this.state.saveHistory.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'history-empty';
                emptyDiv.textContent = '点击"保存"按钮记录历史';
                container.appendChild(emptyDiv);
                return;
            }
            
            for (let i = this.state.saveHistory.length - 1; i >= 0; i--) {
                const snapshot = this.state.saveHistory[i];
                const item = this.createHistoryItem(snapshot, i);
                container.appendChild(item);
            }
        },
        
        createHistoryItem: function(snapshot, index) {
            const self = this;
            const item = document.createElement('div');
            item.className = 'history-item';
            item.dataset.index = index;
            
            const preview = document.createElement('div');
            preview.className = 'history-preview';
            preview.textContent = this.getMaskIcon(snapshot.maskShape);
            
            const info = document.createElement('div');
            info.className = 'history-info';
            
            const title = document.createElement('div');
            title.className = 'history-title';
            title.textContent = snapshot.description || '保存记录 ' + (index + 1);
            
            const time = document.createElement('div');
            time.className = 'history-time';
            time.textContent = this.formatTime(snapshot.timestamp);
            
            info.appendChild(title);
            info.appendChild(time);
            
            item.appendChild(preview);
            item.appendChild(info);
            
            item.addEventListener('click', function() {
                const idx = parseInt(item.dataset.index);
                if (confirm('确定要恢复到此保存的历史记录吗？')) {
                    self.restoreFromSaveHistory(idx);
                }
            });
            
            return item;
        },
        
        getMaskIcon: function(shapeId) {
            const shape = Data.maskShapes.find(function(s) { return s.id === shapeId; });
            return shape ? shape.icon : '🎭';
        },
        
        formatTime: function(timestamp) {
            if (!timestamp) return '';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
            if (diff < 60000) {
                return '刚刚';
            } else if (diff < 3600000) {
                return Math.floor(diff / 60000) + '分钟前';
            } else if (diff < 86400000) {
                return Math.floor(diff / 3600000) + '小时前';
            } else {
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return month + '-' + day + ' ' + hours + ':' + minutes;
            }
        },
        
        removeDecoration: function(id) {
            DecorationsManager.removeDecoration(id);
        },
        
        bindEvents: function() {
            const self = this;
            
            const primaryColor = document.getElementById('primaryColor');
            const primaryColorText = document.getElementById('primaryColorText');
            const secondaryColor = document.getElementById('secondaryColor');
            const secondaryColorText = document.getElementById('secondaryColorText');
            
            function updatePrimaryColor(color) {
                if (Helpers.isValidHex(color)) {
                    self.state.primaryColor = color;
                    self.updateUI();
                    self.render();
                    self.saveToHistory();
                }
            }
            
            function updateSecondaryColor(color) {
                if (Helpers.isValidHex(color)) {
                    self.state.secondaryColor = color;
                    self.updateUI();
                    self.render();
                    self.saveToHistory();
                }
            }
            
            if (primaryColor) {
                primaryColor.addEventListener('input', function(e) {
                    updatePrimaryColor(e.target.value);
                });
            }
            
            if (primaryColorText) {
                primaryColorText.addEventListener('change', function(e) {
                    let value = e.target.value;
                    if (!value.startsWith('#')) value = '#' + value;
                    updatePrimaryColor(value);
                });
            }
            
            if (secondaryColor) {
                secondaryColor.addEventListener('input', function(e) {
                    updateSecondaryColor(e.target.value);
                });
            }
            
            if (secondaryColorText) {
                secondaryColorText.addEventListener('change', function(e) {
                    let value = e.target.value;
                    if (!value.startsWith('#')) value = '#' + value;
                    updateSecondaryColor(value);
                });
            }
            
            const sizeSlider = document.getElementById('decorationSize');
            const rotationSlider = document.getElementById('decorationRotation');
            const opacitySlider = document.getElementById('decorationOpacity');
            const deleteBtn = document.getElementById('deleteDecorationBtn');
            
            if (sizeSlider) {
                sizeSlider.addEventListener('input', function(e) {
                    if (self.state.selectedDecorationId) {
                        DecorationsManager.updateDecoration(self.state.selectedDecorationId, {
                            size: parseInt(e.target.value)
                        });
                        self.updateDecorationControls();
                    }
                });
                
                sizeSlider.addEventListener('change', function() {
                    if (self.state.selectedDecorationId) {
                        self.saveToHistory();
                    }
                });
            }
            
            if (rotationSlider) {
                rotationSlider.addEventListener('input', function(e) {
                    if (self.state.selectedDecorationId) {
                        DecorationsManager.updateDecoration(self.state.selectedDecorationId, {
                            rotation: parseInt(e.target.value)
                        });
                        self.updateDecorationControls();
                    }
                });
                
                rotationSlider.addEventListener('change', function() {
                    if (self.state.selectedDecorationId) {
                        self.saveToHistory();
                    }
                });
            }
            
            if (opacitySlider) {
                opacitySlider.addEventListener('input', function(e) {
                    if (self.state.selectedDecorationId) {
                        DecorationsManager.updateDecoration(self.state.selectedDecorationId, {
                            opacity: parseFloat(e.target.value)
                        });
                        self.updateDecorationControls();
                    }
                });
                
                opacitySlider.addEventListener('change', function() {
                    if (self.state.selectedDecorationId) {
                        self.saveToHistory();
                    }
                });
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    if (self.state.selectedDecorationId) {
                        self.removeDecoration(self.state.selectedDecorationId);
                    }
                });
            }
            
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            const historyUndoBtn = document.getElementById('historyUndoBtn');
            const historyRedoBtn = document.getElementById('historyRedoBtn');
            const clearHistoryBtn = document.getElementById('clearHistoryBtn');
            const clearDecorationsBtn = document.getElementById('clearDecorationsBtn');
            
            if (undoBtn) {
                undoBtn.addEventListener('click', function() {
                    self.undo();
                });
            }
            
            if (redoBtn) {
                redoBtn.addEventListener('click', function() {
                    self.redo();
                });
            }
            
            if (historyUndoBtn) {
                historyUndoBtn.addEventListener('click', function() {
                    self.undo();
                });
            }
            
            if (historyRedoBtn) {
                historyRedoBtn.addEventListener('click', function() {
                    self.redo();
                });
            }
            
            if (clearHistoryBtn) {
                clearHistoryBtn.addEventListener('click', function() {
                    if (self.state.history && self.state.history.length > 0) {
                        if (confirm('确定要清除所有历史记录吗？当前状态会被保留。')) {
                            self.clearHistory();
                        }
                    } else {
                        Helpers.showToast('没有历史记录可清除');
                    }
                });
            }
            
            if (clearDecorationsBtn) {
                clearDecorationsBtn.addEventListener('click', function() {
                    if (confirm('确定要清除所有装饰元素吗？')) {
                        DecorationsManager.clearAll();
                        Helpers.showToast('已清除所有装饰');
                    }
                });
            }
            
            const resetBtn = document.getElementById('resetBtn');
            const saveBtn = document.getElementById('saveBtn');
            const shareBtn = document.getElementById('shareBtn');
            const printBtn = document.getElementById('printBtn');
            
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    if (confirm('确定要重置所有设置吗？这将清除您的所有工作。')) {
                        self.state = JSON.parse(JSON.stringify(Data.defaultState));
                        self.state.saveHistory = [];
                        self.state.history = [];
                        self.state.historyIndex = -1;
                        self.updateUI();
                        self.render();
                        self.saveState();
                        Helpers.showToast('已重置到默认状态');
                    }
                });
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    self.saveState();
                    self.saveToSaveHistory();
                    Helpers.showToast('已保存并记录到历史');
                });
            }
            
            if (shareBtn) {
                shareBtn.addEventListener('click', function() {
                    self.openShareModal();
                });
            }
            
            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    self.openPrintModal();
                });
            }
            
            const closeShareModal = document.getElementById('closeShareModal');
            const closePrintModal = document.getElementById('closePrintModal');
            const downloadPng = document.getElementById('downloadPng');
            const downloadJson = document.getElementById('downloadJson');
            const copyJson = document.getElementById('copyJson');
            const confirmPrint = document.getElementById('confirmPrint');
            
            if (closeShareModal) {
                closeShareModal.addEventListener('click', function() {
                    self.closeModal('shareModal');
                });
            }
            
            if (closePrintModal) {
                closePrintModal.addEventListener('click', function() {
                    self.closeModal('printModal');
                });
            }
            
            if (downloadPng) {
                downloadPng.addEventListener('click', function() {
                    ExportService.exportPNG(self.state);
                    Helpers.showToast('PNG 已下载');
                });
            }
            
            if (downloadJson) {
                downloadJson.addEventListener('click', function() {
                    ExportService.exportJSON(self.state);
                    Helpers.showToast('配置文件已下载');
                });
            }
            
            if (copyJson) {
                copyJson.addEventListener('click', async function() {
                    try {
                        const jsonStr = ExportService.exportJSONString(self.state);
                        await ExportService.copyToClipboard(jsonStr);
                        Helpers.showToast('配置已复制到剪贴板');
                    } catch (e) {
                        Helpers.showToast('复制失败，请手动复制');
                    }
                });
            }
            
            if (confirmPrint) {
                confirmPrint.addEventListener('click', function() {
                    window.print();
                });
            }
            
            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                canvasContainer.addEventListener('click', function(e) {
                    if (e.target === canvasContainer || 
                        e.target.id === 'maskCanvas' ||
                        e.target.id === 'decorationsLayer') {
                        DecorationsManager.deselectAll();
                    }
                });
                
                canvasContainer.addEventListener('dragover', function(e) {
                    e.preventDefault();
                });
                
                canvasContainer.addEventListener('drop', function(e) {
                    e.preventDefault();
                    try {
                        const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const rect = canvasContainer.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        const deco = DecorationsManager.addDecoration(itemData);
                        DecorationsManager.updateDecoration(deco.id, { x: x, y: y });
                        Helpers.showToast('已添加: ' + itemData.name);
                    } catch (err) {
                        console.error('Drop error:', err);
                    }
                });
            }
            
            document.addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        self.redo();
                    } else {
                        self.undo();
                    }
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                    e.preventDefault();
                    self.redo();
                }
                
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    self.saveState();
                    self.saveToSaveHistory();
                    Helpers.showToast('已保存并记录到历史');
                }
            });
        },
        
        openShareModal: function() {
            const modal = document.getElementById('shareModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        },
        
        openPrintModal: function() {
            const modal = document.getElementById('printModal');
            if (modal) {
                ExportService.printTemplate(this.state, 'printCanvas');
                modal.style.display = 'flex';
            }
        },
        
        closeModal: function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        App.init();
    });
    
    global.App = App;
})(window);