/**
 * 图像调节模块 - 提供亮度、对比度、饱和度、清晰度调节
 * 支持滑块实时调节和重置功能
 */

const Adjust = {
    /**
     * 当前调节参数
     */
    settings: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpness: 0
    },

    /**
     * 原始图像数据缓存（用于应用调节）
     * @type {ImageData|null}
     */
    originalImageData: null,

    /**
     * 初始化调节模块
     */
    init() {
        this.reset();
        console.log('[Adjust] 图像调节模块初始化完成');
    },

    /**
     * 重置所有调节参数
     */
    reset() {
        this.settings = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };
        this.updateUI();
        console.log('[Adjust] 调节参数已重置');
    },

    /**
     * 设置原始图像数据
     * @param {ImageData} imageData
     */
    setOriginalImageData(imageData) {
        this.originalImageData = imageData;
    },

    /**
     * 应用所有调节到图像
     * @param {HTMLCanvasElement} sourceCanvas - 源画布
     * @param {HTMLCanvasElement} targetCanvas - 目标画布
     * @returns {boolean} 是否成功应用
     */
    applyAdjustments(sourceCanvas, targetCanvas) {
        if (!sourceCanvas || !targetCanvas) {
            console.error('[Adjust] 画布参数无效');
            return false;
        }

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');
        
        targetCanvas.width = sourceCanvas.width;
        targetCanvas.height = sourceCanvas.height;

        const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = imageData.data;
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;

        if (this.settings.brightness !== 0) {
            this.applyBrightness(data, this.settings.brightness);
        }

        if (this.settings.contrast !== 0) {
            this.applyContrast(data, this.settings.contrast);
        }

        if (this.settings.saturation !== 0) {
            this.applySaturation(data, this.settings.saturation);
        }

        if (this.settings.sharpness !== 0) {
            this.applySharpness(imageData, width, height, this.settings.sharpness);
        }

        targetCtx.putImageData(imageData, 0, 0);
        return true;
    },

    /**
     * 应用亮度调节
     * @param {Uint8ClampedArray} data - 像素数据
     * @param {number} value - 亮度值 (-100 到 100)
     */
    applyBrightness(data, value) {
        const factor = (value / 100) * 255;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(data[i] + factor);
            data[i + 1] = this.clamp(data[i + 1] + factor);
            data[i + 2] = this.clamp(data[i + 2] + factor);
        }
    },

    /**
     * 应用对比度调节
     * @param {Uint8ClampedArray} data - 像素数据
     * @param {number} value - 对比度值 (-100 到 100)
     */
    applyContrast(data, value) {
        const factor = (259 * (value + 255)) / (255 * (259 - value));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = this.clamp(factor * (data[i] - 128) + 128);
            data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128);
            data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128);
        }
    },

    /**
     * 应用饱和度调节
     * @param {Uint8ClampedArray} data - 像素数据
     * @param {number} value - 饱和度值 (-100 到 100)
     */
    applySaturation(data, value) {
        const factor = 1 + (value / 100);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            data[i] = this.clamp(gray + factor * (r - gray));
            data[i + 1] = this.clamp(gray + factor * (g - gray));
            data[i + 2] = this.clamp(gray + factor * (b - gray));
        }
    },

    /**
     * 应用清晰度（锐化/模糊）调节
     * @param {ImageData} imageData - 图像数据
     * @param {number} width - 图像宽度
     * @param {number} height - 图像高度
     * @param {number} value - 清晰度值 (-50 到 50)
     */
    applySharpness(imageData, width, height, value) {
        const data = imageData.data;
        const originalData = new Uint8ClampedArray(data);
        
        if (value > 0) {
            this.applySharpen(data, originalData, width, height, value);
        } else if (value < 0) {
            this.applyBlur(data, originalData, width, height, Math.abs(value));
        }
    },

    /**
     * 应用锐化
     */
    applySharpen(data, originalData, width, height, value) {
        const intensity = value / 50;
        const kernel = [
            0, -intensity, 0,
            -intensity, 1 + 4 * intensity, -intensity,
            0, -intensity, 0
        ];
        
        this.applyConvolution(data, originalData, width, height, kernel);
    },

    /**
     * 应用模糊
     */
    applyBlur(data, originalData, width, height, value) {
        const radius = Math.min(Math.ceil(value / 10), 5);
        const kernelSize = radius * 2 + 1;
        const kernel = [];
        const weight = 1 / (kernelSize * kernelSize);
        
        for (let i = 0; i < kernelSize * kernelSize; i++) {
            kernel.push(weight);
        }
        
        this.applyConvolution(data, originalData, width, height, kernel, radius);
    },

    /**
     * 应用卷积核
     */
    applyConvolution(data, originalData, width, height, kernel, radius = 1) {
        const kernelSize = Math.sqrt(kernel.length);
        const halfKernel = Math.floor(kernelSize / 2);
        
        for (let y = halfKernel; y < height - halfKernel; y++) {
            for (let x = halfKernel; x < width - halfKernel; x++) {
                let sumR = 0, sumG = 0, sumB = 0;
                
                for (let ky = 0; ky < kernelSize; ky++) {
                    for (let kx = 0; kx < kernelSize; kx++) {
                        const weight = kernel[ky * kernelSize + kx];
                        const pixelX = x + kx - halfKernel;
                        const pixelY = y + ky - halfKernel;
                        const idx = (pixelY * width + pixelX) * 4;
                        
                        sumR += originalData[idx] * weight;
                        sumG += originalData[idx + 1] * weight;
                        sumB += originalData[idx + 2] * weight;
                    }
                }
                
                const idx = (y * width + x) * 4;
                data[idx] = this.clamp(sumR);
                data[idx + 1] = this.clamp(sumG);
                data[idx + 2] = this.clamp(sumB);
            }
        }
    },

    /**
     * 限制值在 0-255 之间
     * @param {number} value
     * @returns {number}
     */
    clamp(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    },

    /**
     * 设置调节参数
     * @param {string} type - 调节类型 (brightness, contrast, saturation, sharpness)
     * @param {number} value - 参数值
     */
    setValue(type, value) {
        if (this.settings.hasOwnProperty(type)) {
            this.settings[type] = value;
            console.log(`[Adjust] 设置 ${type}: ${value}`);
        }
    },

    /**
     * 获取调节参数
     * @param {string} type
     * @returns {number}
     */
    getValue(type) {
        return this.settings[type] || 0;
    },

    /**
     * 获取所有设置
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
            console.log('[Adjust] 恢复设置:', this.settings);
        }
    },

    /**
     * 检查是否有调节参数被修改
     * @returns {boolean}
     */
    hasAdjustments() {
        return this.settings.brightness !== 0 ||
               this.settings.contrast !== 0 ||
               this.settings.saturation !== 0 ||
               this.settings.sharpness !== 0;
    },

    /**
     * 更新UI显示
     */
    updateUI() {
        const brightnessSlider = document.getElementById('brightnessSlider');
        const brightnessValue = document.getElementById('brightnessValue');
        const contrastSlider = document.getElementById('contrastSlider');
        const contrastValue = document.getElementById('contrastValue');
        const saturationSlider = document.getElementById('saturationSlider');
        const saturationValue = document.getElementById('saturationValue');
        const sharpnessSlider = document.getElementById('sharpnessSlider');
        const sharpnessValue = document.getElementById('sharpnessValue');

        if (brightnessSlider) brightnessSlider.value = this.settings.brightness;
        if (brightnessValue) brightnessValue.textContent = this.settings.brightness;
        
        if (contrastSlider) contrastSlider.value = this.settings.contrast;
        if (contrastValue) contrastValue.textContent = this.settings.contrast;
        
        if (saturationSlider) saturationSlider.value = this.settings.saturation;
        if (saturationValue) saturationValue.textContent = this.settings.saturation;
        
        if (sharpnessSlider) sharpnessSlider.value = this.settings.sharpness;
        if (sharpnessValue) sharpnessValue.textContent = this.settings.sharpness;
    }
};

Adjust.init();
