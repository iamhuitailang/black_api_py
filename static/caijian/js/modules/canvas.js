/**
 * Canvas核心模块 - 负责画布操作和各模块协调
 * 是整个编辑器的核心，协调存储、变换、滤镜、调节、工具等模块
 */

const CanvasEditor = {
    /**
     * Canvas元素
     */
    mainCanvas: null,
    mainCtx: null,
    originalCanvas: null,
    originalCtx: null,
    previewCanvas: null,
    previewCtx: null,

    /**
     * 原始图像数据
     */
    originalImage: null,
    originalImageData: null,

    /**
     * 图像信息
     */
    imageInfo: {
        name: '',
        size: 0,
        width: 0,
        height: 0
    },

    /**
     * 是否有加载的图片
     */
    hasImage: false,

    /**
     * 原图对比状态
     */
    compareMode: false,

    /**
     * 当前活动的工具状态
     */
    toolState: {
        isDragging: false,
        lastX: 0,
        lastY: 0
    },

    /**
     * 初始化Canvas模块
     */
    init() {
        this.mainCanvas = document.getElementById('mainCanvas');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.previewCanvas = document.getElementById('previewCanvas');

        if (!this.mainCanvas || !this.originalCanvas || !this.previewCanvas) {
            console.error('[CanvasEditor] 无法找到Canvas元素');
            return;
        }

        this.mainCtx = this.mainCanvas.getContext('2d');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this.setupEventListeners();
        this.loadSampleImages();
        
        console.log('[CanvasEditor] Canvas模块初始化完成');
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.mainCanvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.mainCanvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.mainCanvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.mainCanvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
    },

    /**
     * 加载文件
     * @param {File} file - 文件对象
     */
    loadFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
        
        if (!validTypes.includes(file.type)) {
            alert('不支持的文件格式。请上传 JPG、PNG、WebP 或 BMP 图片。');
            return;
        }

        this.showLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            this.loadImageFromUrl(e.target.result, file.name, file.size);
        };
        reader.onerror = () => {
            alert('文件读取失败');
            this.showLoading(false);
        };
        reader.readAsDataURL(file);
    },

    /**
     * 从URL加载图像
     * @param {string} url - 图像URL（可以是data URL）
     * @param {string} name - 图像名称
     * @param {number} size - 图像大小
     */
    loadImageFromUrl(url, name = '', size = 0) {
        this.showLoading(true);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            this.originalImage = img;
            this.imageInfo = {
                name: name,
                size: size,
                width: img.width,
                height: img.height
            };

            this.originalCanvas.width = img.width;
            this.originalCanvas.height = img.height;
            this.originalCtx.drawImage(img, 0, 0);

            this.mainCanvas.width = img.width;
            this.mainCanvas.height = img.height;
            
            this.previewCanvas.width = img.width;
            this.previewCanvas.height = img.height;

            this.hasImage = true;
            this.compareMode = false;

            Adjust.reset();
            Transform.reset();
            Filters.reset();
            Tools.clearAnnotations();
            History.clear();

            this.render();

            this.updateImageInfo();
            this.showEmptyState(false);
            this.showLoading(false);

            this.saveToHistory('加载图片');
            this.saveState();

            console.log('[CanvasEditor] 图片加载成功:', this.imageInfo);
        };

        img.onerror = () => {
            alert('图片加载失败');
            this.showLoading(false);
        };

        img.src = url;
    },

    /**
     * 加载示例图片
     */
    loadSampleImages() {
        const sampleList = document.getElementById('sampleList');
        if (!sampleList) return;

        const samples = [
            { name: '风景', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:%2387CEEB"/><stop offset="100%" style="stop-color:%23E0F6FF"/></linearGradient><linearGradient id="grass" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:%237CFC00"/><stop offset="100%" style="stop-color:%23228B22"/></linearGradient></defs><rect fill="url(%23sky)" width="200" height="150"/><circle cx="160" cy="35" r="25" fill="%23FFD700"/><ellipse cx="60" cy="40" rx="30" ry="18" fill="white"/><ellipse cx="85" cy="35" rx="25" ry="15" fill="white"/><ellipse cx="130" cy="50" rx="20" ry="12" fill="white"/><polygon points="0,120 50,70 100,120" fill="%23696969"/><polygon points="60,120 110,50 160,120" fill="%23808080"/><rect fill="url(%23grass)" y="120" width="200" height="30"/></svg>' },
            { name: '自然', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:%232C3E50"/><stop offset="100%" style="stop-color:%234A6785"/></linearGradient></defs><rect fill="url(%23bg)" width="200" height="150"/><rect x="40" y="80" width="15" height="70" fill="%238B4513"/><polygon points="47,30 15,80 80,80" fill="%23228B22"/><polygon points="47,50 20,80 75,80" fill="%232E8B57"/><rect x="140" y="90" width="12" height="60" fill="%238B4513"/><polygon points="146,55 120,90 172,90" fill="%23228B22"/><polygon points="146,70 125,90 167,90" fill="%232E8B57"/><rect y="130" width="200" height="20" fill="%23228B22"/><circle cx="180" cy="25" r="8" fill="%23F0E68C"/><circle cx="175" cy="20" r="6" fill="%23FFFACD"/><circle cx="30" cy="30" r="2" fill="white"/><circle cx="60" cy="20" r="1.5" fill="white"/><circle cx="90" cy="35" r="2" fill="white"/><circle cx="120" cy="15" r="1.5" fill="white"/></svg>' }
        ];

        sampleList.innerHTML = '';

        samples.forEach(sample => {
            const item = document.createElement('div');
            item.className = 'sample-item';
            item.innerHTML = `<img src="${sample.url}" alt="${sample.name}" title="${sample.name}">`;
            item.addEventListener('click', () => {
                this.loadImageFromUrl(sample.url, sample.name, 0);
            });
            sampleList.appendChild(item);
        });
    },

    /**
     * 渲染画布
     */
    render() {
        if (!this.hasImage || !this.originalImage) return;

        if (this.compareMode) {
            this.mainCanvas.width = this.originalCanvas.width;
            this.mainCanvas.height = this.originalCanvas.height;
            this.mainCtx.drawImage(this.originalCanvas, 0, 0);
            Tools.drawAnnotations(this.mainCtx);
            return;
        }

        this.previewCanvas.width = this.originalCanvas.width;
        this.previewCanvas.height = this.originalCanvas.height;
        this.previewCtx.drawImage(this.originalCanvas, 0, 0);

        Adjust.applyAdjustments(this.previewCanvas, this.previewCanvas);

        const currentFilter = Filters.getCurrentFilter();
        if (currentFilter !== 'none') {
            Filters.applyFilter(this.previewCanvas, this.previewCanvas, currentFilter);
        }

        Transform.applyTransform(this.previewCanvas, this.previewCanvas);

        this.mainCanvas.width = this.previewCanvas.width;
        this.mainCanvas.height = this.previewCanvas.height;
        this.mainCtx.drawImage(this.previewCanvas, 0, 0);

        Tools.drawAnnotations(this.mainCtx);
    },

    /**
     * 鼠标按下事件
     */
    onMouseDown(e) {
        if (!this.hasImage) return;

        const rect = this.mainCanvas.getBoundingClientRect();
        const scaleX = this.mainCanvas.width / rect.width;
        const scaleY = this.mainCanvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const currentTool = Tools.getTool();

        if (currentTool === 'mosaic') {
            this.toolState.isDragging = true;
            this.toolState.lastX = x;
            this.toolState.lastY = y;
            Tools.applyMosaic(this.mainCanvas, x, y);
            this.saveOriginalCanvasToTemp();
            return;
        }

        if (currentTool === 'none' || currentTool === 'select') {
            const hitIndex = Tools.hitTest(x, y);
            if (hitIndex >= 0) {
                Tools.selectedIndex = hitIndex;
                this.toolState.isDragging = true;
                this.toolState.lastX = x;
                this.toolState.lastY = y;
                this.render();
            } else {
                Tools.selectedIndex = -1;
                this.render();
            }
            return;
        }

        if (['text', 'rect', 'circle', 'arrow'].includes(currentTool)) {
            Tools.startDrawing(x, y);
            this.toolState.isDragging = true;
        }
    },

    /**
     * 鼠标移动事件
     */
    onMouseMove(e) {
        if (!this.hasImage) return;

        const rect = this.mainCanvas.getBoundingClientRect();
        const scaleX = this.mainCanvas.width / rect.width;
        const scaleY = this.mainCanvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const currentTool = Tools.getTool();

        if (currentTool === 'mosaic' && this.toolState.isDragging) {
            const steps = Math.max(Math.abs(x - this.toolState.lastX), Math.abs(y - this.toolState.lastY));
            for (let i = 0; i <= steps; i++) {
                const t = steps > 0 ? i / steps : 0;
                const mx = this.toolState.lastX + (x - this.toolState.lastX) * t;
                const my = this.toolState.lastY + (y - this.toolState.lastY) * t;
                Tools.applyMosaic(this.mainCanvas, mx, my);
            }
            this.toolState.lastX = x;
            this.toolState.lastY = y;
            return;
        }

        if (this.toolState.isDragging && Tools.selectedIndex >= 0) {
            const dx = x - this.toolState.lastX;
            const dy = y - this.toolState.lastY;
            Tools.moveSelected(dx, dy);
            this.toolState.lastX = x;
            this.toolState.lastY = y;
            this.render();
            return;
        }

        if (this.toolState.isDragging && ['rect', 'circle', 'arrow'].includes(currentTool)) {
            Tools.updateDrawing(x, y);
        }
    },

    /**
     * 鼠标抬起事件
     */
    onMouseUp(e) {
        if (!this.hasImage) return;

        const rect = this.mainCanvas.getBoundingClientRect();
        const scaleX = this.mainCanvas.width / rect.width;
        const scaleY = this.mainCanvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const currentTool = Tools.getTool();

        if (currentTool === 'mosaic' && this.toolState.isDragging) {
            this.toolState.isDragging = false;
            this.updateOriginalCanvasFromMain();
            this.saveToHistory('马赛克');
            this.saveState();
            return;
        }

        if (this.toolState.isDragging && Tools.selectedIndex >= 0) {
            this.toolState.isDragging = false;
            this.saveToHistory('移动标注');
            this.saveState();
            return;
        }

        if (this.toolState.isDragging && ['text', 'rect', 'circle', 'arrow'].includes(currentTool)) {
            Tools.endDrawing(x, y);
            this.toolState.isDragging = false;
            this.render();
            this.saveToHistory(`添加${currentTool === 'text' ? '文字' : currentTool === 'rect' ? '矩形' : currentTool === 'circle' ? '圆形' : '箭头'}`);
            this.saveState();
        }
    },

    /**
     * 键盘事件
     */
    onKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (Tools.selectedIndex >= 0) {
                Tools.deleteSelected();
                this.render();
                this.saveToHistory('删除标注');
                this.saveState();
            }
        }
    },

    /**
     * 保存原始画布到临时
     */
    saveOriginalCanvasToTemp() {
        this.originalImageData = this.mainCtx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
    },

    /**
     * 从主画布更新原始画布
     */
    updateOriginalCanvasFromMain() {
        this.originalCanvas.width = this.mainCanvas.width;
        this.originalCanvas.height = this.mainCanvas.height;
        this.originalCtx.drawImage(this.mainCanvas, 0, 0);
    },

    /**
     * 撤销
     */
    undo() {
        const state = History.undo();
        if (state) {
            this.restoreState(state);
        }
    },

    /**
     * 重做
     */
    redo() {
        const state = History.redo();
        if (state) {
            this.restoreState(state);
        }
    },

    /**
     * 保存到历史记录
     * @param {string} label - 操作标签
     */
    saveToHistory(label) {
        const state = this.getCurrentState();
        History.saveState(state, label);
    },

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getCurrentState() {
        return {
            originalCanvasData: this.originalCanvas.toDataURL(),
            annotations: Tools.getAnnotations(),
            settings: {
                ...Adjust.getSettings(),
                ...Transform.getSettings(),
                filter: Filters.getCurrentFilter()
            }
        };
    },

    /**
     * 恢复状态
     * @param {Object} state - 状态对象
     */
    restoreState(state) {
        if (state.originalCanvasData) {
            const img = new Image();
            img.onload = () => {
                this.originalCanvas.width = img.width;
                this.originalCanvas.height = img.height;
                this.originalCtx.drawImage(img, 0, 0);
                
                this.mainCanvas.width = img.width;
                this.mainCanvas.height = img.height;

                if (state.annotations) {
                    Tools.restoreAnnotations(state.annotations);
                }

                if (state.settings) {
                    Adjust.restoreSettings(state.settings);
                    Transform.restoreSettings(state.settings);
                    if (state.settings.filter) {
                        Filters.currentFilter = state.settings.filter;
                    }
                }

                this.render();
                this.saveState();
            };
            img.src = state.originalCanvasData;
        }
    },

    /**
     * 保存当前状态到存储
     */
    saveState() {
        const state = {
            hasImage: this.hasImage,
            imageName: this.imageInfo.name,
            imageSize: this.imageInfo.size,
            imageWidth: this.originalCanvas.width,
            imageHeight: this.originalCanvas.height,
            originalImageData: this.originalCanvas.toDataURL(),
            currentImageData: this.mainCanvas.toDataURL(),
            annotations: Tools.getAnnotations(),
            settings: {
                ...Adjust.getSettings(),
                ...Transform.getSettings(),
                filter: Filters.getCurrentFilter()
            }
        };
        Storage.saveState(state);
        Storage.saveAnnotations(Tools.getAnnotations());
    },

    /**
     * 从存储恢复状态
     */
    loadSavedState() {
        const state = Storage.loadState();
        if (!state || !state.originalImageData) return false;

        this.showLoading(true);

        const img = new Image();
        img.onload = () => {
            this.originalCanvas.width = state.imageWidth || img.width;
            this.originalCanvas.height = state.imageHeight || img.height;
            this.originalCtx.drawImage(img, 0, 0);

            this.mainCanvas.width = this.originalCanvas.width;
            this.mainCanvas.height = this.originalCanvas.height;

            this.imageInfo = {
                name: state.imageName || '',
                size: state.imageSize || 0,
                width: this.originalCanvas.width,
                height: this.originalCanvas.height
            };

            this.hasImage = true;

            if (state.annotations) {
                Tools.restoreAnnotations(state.annotations);
            }

            if (state.settings) {
                Adjust.restoreSettings(state.settings);
                Transform.restoreSettings(state.settings);
                if (state.settings.filter) {
                    Filters.currentFilter = state.settings.filter;
                }
            }

            this.render();
            this.updateImageInfo();
            this.showEmptyState(false);
            this.showLoading(false);

            History.loadFromStorage();

            console.log('[CanvasEditor] 从存储恢复状态成功');
        };
        img.onerror = () => {
            console.error('[CanvasEditor] 恢复图片失败');
            this.showLoading(false);
        };
        img.src = state.originalImageData;

        return true;
    },

    /**
     * 重置图片
     */
    resetImage() {
        if (!this.hasImage) return;

        if (confirm('确定要重置所有编辑操作吗？这将恢复到原始图片状态。')) {
            if (this.originalImage) {
                this.originalCanvas.width = this.originalImage.width;
                this.originalCanvas.height = this.originalImage.height;
                this.originalCtx.drawImage(this.originalImage, 0, 0);

                this.mainCanvas.width = this.originalImage.width;
                this.mainCanvas.height = this.originalImage.height;
            }

            Adjust.reset();
            Transform.reset();
            Filters.reset();
            Tools.clearAnnotations();
            History.clear();

            this.render();
            this.saveToHistory('重置图片');
            this.saveState();

            console.log('[CanvasEditor] 图片已重置');
        }
    },

    /**
     * 切换原图对比模式
     * @param {boolean} showOriginal - 是否显示原图
     */
    toggleCompare(showOriginal) {
        if (!this.hasImage) return;
        
        this.compareMode = showOriginal;
        this.render();
    },

    /**
     * 更新图片信息显示
     */
    updateImageInfo() {
        const imageInfo = document.getElementById('imageInfo');
        const imageSize = document.getElementById('imageSize');
        const imageDimensions = document.getElementById('imageDimensions');

        if (imageInfo) {
            imageInfo.classList.toggle('hidden', !this.hasImage);
        }

        if (this.hasImage) {
            if (imageSize) {
                imageSize.textContent = this.imageInfo.size > 0 
                    ? `大小: ${this.formatFileSize(this.imageInfo.size)}`
                    : '大小: 示例图片';
            }
            if (imageDimensions) {
                imageDimensions.textContent = `尺寸: ${this.imageInfo.width} × ${this.imageInfo.height}`;
            }
        }
    },

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * 显示/隐藏加载状态
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('hidden', !show);
        }
    },

    /**
     * 显示/隐藏空状态
     */
    showEmptyState(show) {
        const emptyState = document.getElementById('emptyState');
        const canvasContainer = document.getElementById('canvasContainer');

        if (emptyState) {
            emptyState.classList.toggle('hidden', !show);
        }
        if (canvasContainer) {
            canvasContainer.classList.toggle('hidden', show);
        }
    },

    /**
     * 开始裁剪
     */
    startCrop() {
        if (!this.hasImage) return;
        
        const cropState = Transform.startCrop(this.mainCanvas.width, this.mainCanvas.height);
        this.showCropOverlay(true, cropState);
        
        const btnStartCrop = document.getElementById('btnStartCrop');
        const btnApplyCrop = document.getElementById('btnApplyCrop');
        const btnCancelCrop = document.getElementById('btnCancelCrop');

        if (btnStartCrop) btnStartCrop.classList.add('hidden');
        if (btnApplyCrop) btnApplyCrop.classList.remove('hidden');
        if (btnCancelCrop) btnCancelCrop.classList.remove('hidden');
    },

    /**
     * 应用裁剪
     */
    applyCrop() {
        if (!Transform.cropState.active) return;

        const tempCanvas = document.createElement('canvas');
        Transform.applyCrop(this.originalCanvas, tempCanvas);

        this.originalCanvas.width = tempCanvas.width;
        this.originalCanvas.height = tempCanvas.height;
        this.originalCtx.drawImage(tempCanvas, 0, 0);

        this.mainCanvas.width = tempCanvas.width;
        this.mainCanvas.height = tempCanvas.height;

        this.imageInfo.width = tempCanvas.width;
        this.imageInfo.height = tempCanvas.height;

        Tools.clearAnnotations();

        this.showCropOverlay(false);
        this.render();
        this.updateImageInfo();
        this.saveToHistory('裁剪');
        this.saveState();

        const btnStartCrop = document.getElementById('btnStartCrop');
        const btnApplyCrop = document.getElementById('btnApplyCrop');
        const btnCancelCrop = document.getElementById('btnCancelCrop');

        if (btnStartCrop) btnStartCrop.classList.remove('hidden');
        if (btnApplyCrop) btnApplyCrop.classList.add('hidden');
        if (btnCancelCrop) btnCancelCrop.classList.add('hidden');
    },

    /**
     * 取消裁剪
     */
    cancelCrop() {
        Transform.cancelCrop();
        this.showCropOverlay(false);

        const btnStartCrop = document.getElementById('btnStartCrop');
        const btnApplyCrop = document.getElementById('btnApplyCrop');
        const btnCancelCrop = document.getElementById('btnCancelCrop');

        if (btnStartCrop) btnStartCrop.classList.remove('hidden');
        if (btnApplyCrop) btnApplyCrop.classList.add('hidden');
        if (btnCancelCrop) btnCancelCrop.classList.add('hidden');
    },

    /**
     * 显示/隐藏裁剪遮罩
     */
    showCropOverlay(show, cropState = null) {
        const overlay = document.getElementById('cropOverlay');
        const cropBox = document.getElementById('cropBox');

        if (!overlay || !cropBox) return;

        if (show && cropState) {
            const canvasRect = this.mainCanvas.getBoundingClientRect();
            const containerRect = document.getElementById('canvasContainer').getBoundingClientRect();
            
            const scaleX = canvasRect.width / this.mainCanvas.width;
            const scaleY = canvasRect.height / this.mainCanvas.height;

            const offsetX = canvasRect.left - containerRect.left;
            const offsetY = canvasRect.top - containerRect.top;

            cropBox.style.left = (offsetX + cropState.x * scaleX) + 'px';
            cropBox.style.top = (offsetY + cropState.y * scaleY) + 'px';
            cropBox.style.width = (cropState.width * scaleX) + 'px';
            cropBox.style.height = (cropState.height * scaleY) + 'px';

            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    },

    /**
     * 导出图片
     */
    exportImage() {
        if (!this.hasImage) {
            alert('请先加载图片');
            return;
        }

        Export.openExportModal(this.mainCanvas);
    }
};
