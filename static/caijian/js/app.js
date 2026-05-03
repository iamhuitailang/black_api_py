/**
 * 主应用入口 - 负责UI事件绑定和模块协调
 * 这是编辑器的主控制器，连接所有模块
 */

const App = {
    /**
     * 初始化应用
     */
    init() {
        console.log('[App] 应用初始化开始...');

        CanvasEditor.init();
        
        this.setupSectionToggle();
        this.setupFileOperations();
        this.setupTransformControls();
        this.setupAdjustControls();
        this.setupFilterControls();
        this.setupToolControls();
        this.setupExportControls();
        this.setupHeaderControls();
        this.setupKeyboardShortcuts();

        if (Storage.hasSavedState()) {
            console.log('[App] 发现保存的状态，正在恢复...');
            CanvasEditor.loadSavedState();
        }

        console.log('[App] 应用初始化完成');
    },

    /**
     * 设置侧边栏面板折叠/展开
     */
    setupSectionToggle() {
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.sidebar-section');
                const isActive = section.classList.contains('active');
                
                document.querySelectorAll('.sidebar-section').forEach(s => {
                    s.classList.remove('active');
                });
                
                if (!isActive) {
                    section.classList.add('active');
                }
            });
        });
    },

    /**
     * 设置文件操作
     */
    setupFileOperations() {
        const fileInput = document.getElementById('fileInput');
        const btnChooseFile = document.getElementById('btnChooseFile');
        const uploadArea = document.getElementById('uploadArea');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput?.click();
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                if (e.dataTransfer.files.length > 0) {
                    CanvasEditor.loadFile(e.dataTransfer.files[0]);
                }
            });
        }

        if (btnChooseFile) {
            btnChooseFile.addEventListener('click', () => {
                fileInput?.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    CanvasEditor.loadFile(e.target.files[0]);
                }
            });
        }
    },

    /**
     * 设置变换控制（旋转、翻转、缩放、裁剪）
     */
    setupTransformControls() {
        document.querySelectorAll('.btn-transform').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!CanvasEditor.hasImage) {
                    alert('请先加载图片');
                    return;
                }

                const action = btn.dataset.action;
                let label = '';

                switch (action) {
                    case 'rotateLeft':
                        Transform.rotate(-90);
                        label = '左旋90°';
                        break;
                    case 'rotateRight':
                        Transform.rotate(90);
                        label = '右旋90°';
                        break;
                    case 'flipH':
                        Transform.flipHorizontal();
                        label = '水平翻转';
                        break;
                    case 'flipV':
                        Transform.flipVertical();
                        label = '垂直翻转';
                        break;
                }

                CanvasEditor.render();
                CanvasEditor.saveToHistory(label);
                CanvasEditor.saveState();
            });
        });

        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');

        if (scaleSlider) {
            scaleSlider.addEventListener('input', (e) => {
                const scale = parseInt(e.target.value);
                Transform.setScale(scale);
                if (scaleValue) {
                    scaleValue.textContent = scale + '%';
                }
            });
        }

        document.querySelectorAll('.btn-crop-ratio').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-crop-ratio').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const ratio = btn.dataset.ratio;
                Transform.setCropRatio(
                    ratio,
                    CanvasEditor.mainCanvas.width,
                    CanvasEditor.mainCanvas.height
                );
            });
        });

        const btnStartCrop = document.getElementById('btnStartCrop');
        const btnApplyCrop = document.getElementById('btnApplyCrop');
        const btnCancelCrop = document.getElementById('btnCancelCrop');

        if (btnStartCrop) {
            btnStartCrop.addEventListener('click', () => {
                if (!CanvasEditor.hasImage) {
                    alert('请先加载图片');
                    return;
                }
                CanvasEditor.startCrop();
            });
        }

        if (btnApplyCrop) {
            btnApplyCrop.addEventListener('click', () => {
                CanvasEditor.applyCrop();
            });
        }

        if (btnCancelCrop) {
            btnCancelCrop.addEventListener('click', () => {
                CanvasEditor.cancelCrop();
            });
        }
    },

    /**
     * 设置图像调节控制（亮度、对比度、饱和度、清晰度）
     */
    setupAdjustControls() {
        const brightnessSlider = document.getElementById('brightnessSlider');
        const brightnessValue = document.getElementById('brightnessValue');
        const contrastSlider = document.getElementById('contrastSlider');
        const contrastValue = document.getElementById('contrastValue');
        const saturationSlider = document.getElementById('saturationSlider');
        const saturationValue = document.getElementById('saturationValue');
        const sharpnessSlider = document.getElementById('sharpnessSlider');
        const sharpnessValue = document.getElementById('sharpnessValue');
        const btnResetAdjust = document.getElementById('btnResetAdjust');

        const updateAdjust = () => {
            if (!CanvasEditor.hasImage) return;
            CanvasEditor.render();
        };

        const saveAdjustHistory = (label) => {
            if (!CanvasEditor.hasImage) return;
            CanvasEditor.saveToHistory(label);
            CanvasEditor.saveState();
        };

        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                Adjust.setValue('brightness', value);
                if (brightnessValue) brightnessValue.textContent = value;
                updateAdjust();
            });
            brightnessSlider.addEventListener('change', () => {
                saveAdjustHistory('亮度调节');
            });
        }

        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                Adjust.setValue('contrast', value);
                if (contrastValue) contrastValue.textContent = value;
                updateAdjust();
            });
            contrastSlider.addEventListener('change', () => {
                saveAdjustHistory('对比度调节');
            });
        }

        if (saturationSlider) {
            saturationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                Adjust.setValue('saturation', value);
                if (saturationValue) saturationValue.textContent = value;
                updateAdjust();
            });
            saturationSlider.addEventListener('change', () => {
                saveAdjustHistory('饱和度调节');
            });
        }

        if (sharpnessSlider) {
            sharpnessSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                Adjust.setValue('sharpness', value);
                if (sharpnessValue) sharpnessValue.textContent = value;
                updateAdjust();
            });
            sharpnessSlider.addEventListener('change', () => {
                saveAdjustHistory('清晰度调节');
            });
        }

        if (btnResetAdjust) {
            btnResetAdjust.addEventListener('click', () => {
                if (!CanvasEditor.hasImage) {
                    alert('请先加载图片');
                    return;
                }
                Adjust.reset();
                CanvasEditor.render();
                CanvasEditor.saveToHistory('重置调节');
                CanvasEditor.saveState();
            });
        }
    },

    /**
     * 设置滤镜控制
     */
    setupFilterControls() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!CanvasEditor.hasImage) {
                    alert('请先加载图片');
                    return;
                }

                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                if (filter === 'none') {
                    Filters.reset();
                } else {
                    Filters.currentFilter = filter;
                }

                CanvasEditor.render();
                CanvasEditor.saveToHistory(`滤镜: ${btn.textContent.trim()}`);
                CanvasEditor.saveState();
            });
        });
    },

    /**
     * 设置工具控制
     */
    setupToolControls() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!CanvasEditor.hasImage && btn.dataset.tool !== 'none') {
                    alert('请先加载图片');
                    return;
                }

                const tool = btn.dataset.tool;
                Tools.setTool(tool);

                const mainCanvas = document.getElementById('mainCanvas');
                if (mainCanvas) {
                    mainCanvas.classList.toggle('tool-mosaic', tool === 'mosaic');
                }
            });
        });

        const textContent = document.getElementById('textContent');
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        const fontSizeValue = document.getElementById('fontSizeValue');
        const textColor = document.getElementById('textColor');
        const colorBtns = document.querySelectorAll('.color-btn[data-bg]');

        const updateTextSettings = () => {
            Tools.updateSettings('text', {
                content: textContent?.value || '文字',
                fontSize: parseInt(fontSizeSlider?.value || 32),
                color: textColor?.value || '#ff0000'
            });
        };

        if (textContent) {
            textContent.addEventListener('input', updateTextSettings);
        }

        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                if (fontSizeValue) fontSizeValue.textContent = size + 'px';
                updateTextSettings();
            });
        }

        if (textColor) {
            textColor.addEventListener('input', updateTextSettings);
        }

        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Tools.updateSettings('text', { bgColor: btn.dataset.bg });
            });
        });

        const shapeBorderColor = document.getElementById('shapeBorderColor');
        const shapeBorderWidth = document.getElementById('shapeBorderWidth');
        const shapeBorderWidthValue = document.getElementById('shapeBorderWidthValue');
        const fillBtns = document.querySelectorAll('.color-btn[data-fill]');

        const updateShapeSettings = () => {
            Tools.updateSettings('shape', {
                borderColor: shapeBorderColor?.value || '#ff0000',
                borderWidth: parseInt(shapeBorderWidth?.value || 3)
            });
        };

        if (shapeBorderColor) {
            shapeBorderColor.addEventListener('input', updateShapeSettings);
        }

        if (shapeBorderWidth) {
            shapeBorderWidth.addEventListener('input', (e) => {
                const width = parseInt(e.target.value);
                if (shapeBorderWidthValue) shapeBorderWidthValue.textContent = width + 'px';
                updateShapeSettings();
            });
        }

        fillBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                fillBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Tools.updateSettings('shape', { fillColor: btn.dataset.fill });
            });
        });

        const mosaicSize = document.getElementById('mosaicSize');
        const mosaicSizeValue = document.getElementById('mosaicSizeValue');
        const mosaicBlock = document.getElementById('mosaicBlock');
        const mosaicBlockValue = document.getElementById('mosaicBlockValue');

        const updateMosaicSettings = () => {
            Tools.updateSettings('mosaic', {
                size: parseInt(mosaicSize?.value || 30),
                blockSize: parseInt(mosaicBlock?.value || 15)
            });
        };

        if (mosaicSize) {
            mosaicSize.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                if (mosaicSizeValue) mosaicSizeValue.textContent = size + 'px';
                updateMosaicSettings();
            });
        }

        if (mosaicBlock) {
            mosaicBlock.addEventListener('input', (e) => {
                const size = parseInt(e.target.value);
                if (mosaicBlockValue) mosaicBlockValue.textContent = size + 'px';
                updateMosaicSettings();
            });
        }

        const btnClearAnnotations = document.getElementById('btnClearAnnotations');
        if (btnClearAnnotations) {
            btnClearAnnotations.addEventListener('click', () => {
                if (!CanvasEditor.hasImage) {
                    alert('请先加载图片');
                    return;
                }
                if (Tools.getAnnotations().length === 0) {
                    alert('没有可清除的标注');
                    return;
                }
                if (confirm('确定要清除所有标注吗？')) {
                    Tools.clearAnnotations();
                    CanvasEditor.render();
                    CanvasEditor.saveToHistory('清除标注');
                    CanvasEditor.saveState();
                }
            });
        }
    },

    /**
     * 设置导出控制
     */
    setupExportControls() {
        const btnExport = document.getElementById('btnExport');
        const exportModal = document.getElementById('exportModal');
        const closeExportModal = document.getElementById('closeExportModal');
        const btnCancelExport = document.getElementById('btnCancelExport');
        const btnConfirmExport = document.getElementById('btnConfirmExport');
        const qualityGroup = document.getElementById('qualityGroup');
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');

        if (btnExport) {
            btnExport.addEventListener('click', () => {
                CanvasEditor.exportImage();
            });
        }

        if (closeExportModal) {
            closeExportModal.addEventListener('click', () => {
                Export.closeExportModal();
            });
        }

        if (btnCancelExport) {
            btnCancelExport.addEventListener('click', () => {
                Export.closeExportModal();
            });
        }

        if (exportModal) {
            exportModal.addEventListener('click', (e) => {
                if (e.target === exportModal) {
                    Export.closeExportModal();
                }
            });
        }

        document.querySelectorAll('input[name="format"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const format = e.target.value;
                Export.setFormat(format);
                
                document.querySelectorAll('.format-option').forEach(opt => {
                    opt.classList.toggle('active', opt.querySelector('input')?.checked);
                });

                if (qualityGroup) {
                    qualityGroup.style.display = format === 'jpeg' ? 'block' : 'none';
                }

                const previewImg = document.getElementById('exportPreview');
                if (previewImg && CanvasEditor.hasImage) {
                    previewImg.src = Export.getPreviewImage(CanvasEditor.mainCanvas);
                }
            });
        });

        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                const quality = parseInt(e.target.value) / 100;
                Export.setQuality(quality);
                if (qualityValue) {
                    qualityValue.textContent = e.target.value + '%';
                }
            });
        }

        if (btnConfirmExport) {
            btnConfirmExport.addEventListener('click', () => {
                const filename = CanvasEditor.imageInfo.name 
                    ? CanvasEditor.imageInfo.name.replace(/\.[^/.]+$/, '')
                    : 'edited_image';
                Export.executeExport(CanvasEditor.mainCanvas, filename);
            });
        }
    },

    /**
     * 设置头部控制（撤销、重做、重置、原图对比）
     */
    setupHeaderControls() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');
        const btnReset = document.getElementById('btnReset');
        const btnCompare = document.getElementById('btnCompare');

        if (btnUndo) {
            btnUndo.addEventListener('click', () => {
                CanvasEditor.undo();
            });
        }

        if (btnRedo) {
            btnRedo.addEventListener('click', () => {
                CanvasEditor.redo();
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                CanvasEditor.resetImage();
            });
        }

        if (btnCompare) {
            let isPressed = false;
            
            const startCompare = () => {
                if (!CanvasEditor.hasImage || isPressed) return;
                isPressed = true;
                btnCompare.classList.add('active');
                btnCompare.style.backgroundColor = 'var(--primary-light)';
                CanvasEditor.toggleCompare(true);
            };

            const endCompare = () => {
                if (!isPressed) return;
                isPressed = false;
                btnCompare.classList.remove('active');
                btnCompare.style.backgroundColor = '';
                CanvasEditor.toggleCompare(false);
            };

            btnCompare.addEventListener('mousedown', startCompare);
            btnCompare.addEventListener('mouseup', endCompare);
            btnCompare.addEventListener('mouseleave', endCompare);
            
            btnCompare.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startCompare();
            });
            btnCompare.addEventListener('touchend', (e) => {
                e.preventDefault();
                endCompare();
            });
        }
    },

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            CanvasEditor.redo();
                        } else {
                            e.preventDefault();
                            CanvasEditor.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        CanvasEditor.redo();
                        break;
                    case 's':
                        e.preventDefault();
                        if (CanvasEditor.hasImage) {
                            CanvasEditor.exportImage();
                        }
                        break;
                }
            }

            if (e.key === 'Escape') {
                Export.closeExportModal();
                if (Transform.cropState.active) {
                    CanvasEditor.cancelCrop();
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
