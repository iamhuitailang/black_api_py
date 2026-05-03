/**
 * 变换模块 - 提供裁剪、旋转、翻转、缩放功能
 * 支持自由裁剪和固定比例裁剪
 */

const Transform = {
    /**
     * 当前变换设置
     */
    settings: {
        rotation: 0,
        flipH: false,
        flipV: false,
        scale: 100
    },

    /**
     * 裁剪状态
     */
    cropState: {
        active: false,
        ratio: 'free',
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },

    /**
     * 初始化变换模块
     */
    init() {
        this.reset();
        console.log('[Transform] 变换模块初始化完成');
    },

    /**
     * 重置所有变换参数
     */
    reset() {
        this.settings = {
            rotation: 0,
            flipH: false,
            flipV: false,
            scale: 100
        };
        this.cropState = {
            active: false,
            ratio: 'free',
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.updateUI();
        console.log('[Transform] 变换参数已重置');
    },

    /**
     * 应用变换到图像
     * @param {HTMLCanvasElement} sourceCanvas - 源画布
     * @param {HTMLCanvasElement} targetCanvas - 目标画布
     * @returns {boolean} 是否成功应用
     */
    applyTransform(sourceCanvas, targetCanvas) {
        if (!sourceCanvas || !targetCanvas) {
            console.error('[Transform] 画布参数无效');
            return false;
        }

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');
        
        const rotation = this.settings.rotation % 360;
        const isSwapped = (rotation === 90 || rotation === 270);
        
        const srcWidth = sourceCanvas.width;
        const srcHeight = sourceCanvas.height;
        
        const targetWidth = isSwapped ? srcHeight : srcWidth;
        const targetHeight = isSwapped ? srcWidth : srcHeight;
        
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        targetCtx.save();
        
        targetCtx.translate(targetWidth / 2, targetHeight / 2);
        targetCtx.rotate((rotation * Math.PI) / 180);
        
        const scaleX = this.settings.flipH ? -1 : 1;
        const scaleY = this.settings.flipV ? -1 : 1;
        targetCtx.scale(scaleX, scaleY);
        
        targetCtx.drawImage(
            sourceCanvas,
            -srcWidth / 2,
            -srcHeight / 2
        );
        
        targetCtx.restore();

        console.log('[Transform] 应用变换:', this.settings);
        return true;
    },

    /**
     * 旋转图像
     * @param {number} degrees - 旋转角度 (90 或 -90)
     */
    rotate(degrees) {
        this.settings.rotation = (this.settings.rotation + degrees) % 360;
        if (this.settings.rotation < 0) {
            this.settings.rotation += 360;
        }
        this.updateUI();
        console.log(`[Transform] 旋转 ${degrees}°, 当前角度: ${this.settings.rotation}`);
    },

    /**
     * 水平翻转
     */
    flipHorizontal() {
        this.settings.flipH = !this.settings.flipH;
        this.updateUI();
        console.log('[Transform] 水平翻转:', this.settings.flipH);
    },

    /**
     * 垂直翻转
     */
    flipVertical() {
        this.settings.flipV = !this.settings.flipV;
        this.updateUI();
        console.log('[Transform] 垂直翻转:', this.settings.flipV);
    },

    /**
     * 设置缩放比例
     * @param {number} scale - 缩放百分比 (10-300)
     */
    setScale(scale) {
        this.settings.scale = Math.max(10, Math.min(300, scale));
        this.updateUI();
        console.log('[Transform] 设置缩放:', this.settings.scale + '%');
    },

    /**
     * 获取当前缩放比例
     * @returns {number}
     */
    getScale() {
        return this.settings.scale;
    },

    /**
     * 开始裁剪模式
     * @param {number} imageWidth - 图像宽度
     * @param {number} imageHeight - 图像高度
     */
    startCrop(imageWidth, imageHeight) {
        this.cropState.active = true;
        this.cropState.x = Math.floor(imageWidth * 0.1);
        this.cropState.y = Math.floor(imageHeight * 0.1);
        this.cropState.width = Math.floor(imageWidth * 0.8);
        this.cropState.height = Math.floor(imageHeight * 0.8);
        
        this.adjustCropToRatio(imageWidth, imageHeight);
        
        console.log('[Transform] 开始裁剪模式', this.cropState);
        return this.cropState;
    },

    /**
     * 取消裁剪模式
     */
    cancelCrop() {
        this.cropState.active = false;
        console.log('[Transform] 取消裁剪模式');
    },

    /**
     * 应用裁剪
     * @param {HTMLCanvasElement} sourceCanvas - 源画布
     * @param {HTMLCanvasElement} targetCanvas - 目标画布
     * @returns {boolean} 是否成功
     */
    applyCrop(sourceCanvas, targetCanvas) {
        if (!this.cropState.active) {
            console.error('[Transform] 裁剪模式未激活');
            return false;
        }

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');
        
        const { x, y, width, height } = this.cropState;
        
        if (width <= 0 || height <= 0) {
            console.error('[Transform] 裁剪区域无效');
            return false;
        }

        const imageData = sourceCtx.getImageData(x, y, width, height);
        
        targetCanvas.width = width;
        targetCanvas.height = height;
        targetCtx.putImageData(imageData, 0, 0);
        
        this.cropState.active = false;
        
        console.log(`[Transform] 应用裁剪: x=${x}, y=${y}, width=${width}, height=${height}`);
        return true;
    },

    /**
     * 设置裁剪比例
     * @param {string} ratio - 比例 ('free', '1:1', '4:3', '16:9')
     * @param {number} imageWidth - 图像宽度
     * @param {number} imageHeight - 图像高度
     */
    setCropRatio(ratio, imageWidth, imageHeight) {
        this.cropState.ratio = ratio;
        this.adjustCropToRatio(imageWidth, imageHeight);
        console.log('[Transform] 设置裁剪比例:', ratio);
    },

    /**
     * 根据比例调整裁剪区域
     */
    adjustCropToRatio(imageWidth, imageHeight) {
        const { ratio } = this.cropState;
        
        if (ratio === 'free') {
            return;
        }

        let ratioW, ratioH;
        switch (ratio) {
            case '1:1':
                ratioW = 1; ratioH = 1;
                break;
            case '4:3':
                ratioW = 4; ratioH = 3;
                break;
            case '16:9':
                ratioW = 16; ratioH = 9;
                break;
            default:
                return;
        }

        const targetRatio = ratioW / ratioH;
        const currentRatio = imageWidth / imageHeight;

        let cropWidth, cropHeight;
        
        if (currentRatio > targetRatio) {
            cropHeight = Math.floor(imageHeight * 0.8);
            cropWidth = Math.floor(cropHeight * targetRatio);
        } else {
            cropWidth = Math.floor(imageWidth * 0.8);
            cropHeight = Math.floor(cropWidth / targetRatio);
        }

        this.cropState.x = Math.floor((imageWidth - cropWidth) / 2);
        this.cropState.y = Math.floor((imageHeight - cropHeight) / 2);
        this.cropState.width = cropWidth;
        this.cropState.height = cropHeight;
    },

    /**
     * 更新裁剪区域
     * @param {Object} newState - 新的裁剪状态
     * @param {number} imageWidth - 图像宽度
     * @param {number} imageHeight - 图像高度
     */
    updateCropState(newState, imageWidth, imageHeight) {
        const { ratio } = this.cropState;
        
        if (ratio === 'free') {
            this.cropState = { ...this.cropState, ...newState };
        } else {
            this.cropState.x = newState.x;
            this.cropState.y = newState.y;
            
            if (newState.width !== undefined) {
                let ratioW, ratioH;
                switch (ratio) {
                    case '1:1': ratioW = 1; ratioH = 1; break;
                    case '4:3': ratioW = 4; ratioH = 3; break;
                    case '16:9': ratioW = 16; ratioH = 9; break;
                    default: return;
                }
                
                this.cropState.width = newState.width;
                this.cropState.height = Math.floor(newState.width * (ratioH / ratioW));
            }
        }

        this.cropState.x = Math.max(0, Math.min(imageWidth - 10, this.cropState.x));
        this.cropState.y = Math.max(0, Math.min(imageHeight - 10, this.cropState.y));
        this.cropState.width = Math.max(20, Math.min(imageWidth - this.cropState.x, this.cropState.width));
        this.cropState.height = Math.max(20, Math.min(imageHeight - this.cropState.y, this.cropState.height));

        console.log('[Transform] 更新裁剪区域:', this.cropState);
    },

    /**
     * 获取当前设置
     * @returns {Object}
     */
    getSettings() {
        return { ...this.settings };
    },

    /**
     * 恢复设置
     * @param {Object} settings
     */
    restoreSettings(settings) {
        if (settings) {
            this.settings = { ...this.settings, ...settings };
            this.updateUI();
            console.log('[Transform] 恢复设置:', this.settings);
        }
    },

    /**
     * 检查是否有变换被应用
     * @returns {boolean}
     */
    hasTransforms() {
        return this.settings.rotation !== 0 ||
               this.settings.flipH ||
               this.settings.flipV ||
               this.settings.scale !== 100;
    },

    /**
     * 更新UI显示
     */
    updateUI() {
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');

        if (scaleSlider) scaleSlider.value = this.settings.scale;
        if (scaleValue) scaleValue.textContent = this.settings.scale + '%';
    }
};

Transform.init();
