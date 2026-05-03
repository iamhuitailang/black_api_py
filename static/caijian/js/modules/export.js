/**
 * 导出模块 - 提供图片导出功能
 * 支持 PNG（带透明背景）和 JPG（白色背景）格式
 */

const Export = {
    /**
     * 当前导出设置
     */
    settings: {
        format: 'png',
        quality: 0.9
    },

    /**
     * 初始化导出模块
     */
    init() {
        console.log('[Export] 导出模块初始化完成');
    },

    /**
     * 设置导出格式
     * @param {string} format - 'png' 或 'jpeg'
     */
    setFormat(format) {
        if (format === 'png' || format === 'jpeg') {
            this.settings.format = format;
            console.log('[Export] 设置导出格式:', format);
        }
    },

    /**
     * 设置导出质量（仅适用于JPEG）
     * @param {number} quality - 0.1 到 1.0
     */
    setQuality(quality) {
        this.settings.quality = Math.max(0.1, Math.min(1.0, quality));
        console.log('[Export] 设置导出质量:', this.settings.quality);
    },

    /**
     * 从画布创建导出图像
     * @param {HTMLCanvasElement} canvas - 源画布
     * @returns {string} base64 数据URL
     */
    createExportImage(canvas) {
        if (!canvas) {
            console.error('[Export] 画布无效');
            return null;
        }

        const { format, quality } = this.settings;
        
        if (format === 'png') {
            return canvas.toDataURL('image/png');
        } else {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvas, 0, 0);
            
            return tempCanvas.toDataURL('image/jpeg', quality);
        }
    },

    /**
     * 下载图片
     * @param {HTMLCanvasElement} canvas - 源画布
     * @param {string} filename - 文件名（不含扩展名）
     */
    downloadImage(canvas, filename = 'image') {
        const dataUrl = this.createExportImage(canvas);
        if (!dataUrl) return false;

        const link = document.createElement('a');
        const ext = this.settings.format === 'png' ? 'png' : 'jpg';
        link.download = `${filename}.${ext}`;
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`[Export] 下载图片: ${filename}.${ext}`);
        return true;
    },

    /**
     * 获取预览图像
     * @param {HTMLCanvasElement} canvas - 源画布
     * @param {number} maxWidth - 最大宽度
     * @returns {string} base64 数据URL
     */
    getPreviewImage(canvas, maxWidth = 400) {
        if (!canvas) return null;

        const tempCanvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / canvas.width);
        
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
        
        const tempCtx = tempCanvas.getContext('2d');
        
        if (this.settings.format === 'jpeg') {
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        return tempCanvas.toDataURL('image/png');
    },

    /**
     * 打开导出模态框
     * @param {HTMLCanvasElement} canvas - 源画布
     */
    openExportModal(canvas) {
        const modal = document.getElementById('exportModal');
        const previewImg = document.getElementById('exportPreview');
        const qualityGroup = document.getElementById('qualityGroup');
        
        if (modal) {
            modal.classList.add('show');
        }
        
        this.updateFormatUI();
        this.updateQualityUI();
        
        if (previewImg && canvas) {
            previewImg.src = this.getPreviewImage(canvas);
        }
        
        if (qualityGroup) {
            qualityGroup.style.display = this.settings.format === 'jpeg' ? 'block' : 'none';
        }
    },

    /**
     * 关闭导出模态框
     */
    closeExportModal() {
        const modal = document.getElementById('exportModal');
        if (modal) {
            modal.classList.remove('show');
        }
    },

    /**
     * 更新格式选择UI
     */
    updateFormatUI() {
        document.querySelectorAll('input[name="format"]').forEach(input => {
            input.checked = input.value === this.settings.format;
            const label = input.closest('.format-option');
            if (label) {
                label.classList.toggle('active', input.value === this.settings.format);
            }
        });
    },

    /**
     * 更新质量选择UI
     */
    updateQualityUI() {
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        
        if (qualitySlider) {
            qualitySlider.value = Math.round(this.settings.quality * 100);
        }
        if (qualityValue) {
            qualityValue.textContent = Math.round(this.settings.quality * 100) + '%';
        }
    },

    /**
     * 执行导出
     * @param {HTMLCanvasElement} canvas - 源画布
     * @param {string} filename - 文件名
     */
    executeExport(canvas, filename) {
        const result = this.downloadImage(canvas, filename);
        if (result) {
            this.closeExportModal();
        }
        return result;
    }
};

Export.init();
