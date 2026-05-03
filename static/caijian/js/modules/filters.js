/**
 * 滤镜效果模块 - 提供各种图像滤镜效果
 * 包括：复古、黑白、怀旧、锐化、柔光、暖色、冷色等
 */

const Filters = {
    /**
     * 当前应用的滤镜
     * @type {string}
     */
    currentFilter: 'none',

    /**
     * 滤镜配置
     */
    filters: {
        none: {
            name: '原图',
            description: '不应用任何滤镜'
        },
        grayscale: {
            name: '黑白',
            description: '转换为灰度图像',
            cssFilter: 'grayscale(100%)'
        },
        sepia: {
            name: '怀旧',
            description: '应用怀旧效果',
            cssFilter: 'sepia(80%)'
        },
        vintage: {
            name: '复古',
            description: '应用复古效果'
        },
        sharpen: {
            name: '锐化',
            description: '增强图像锐度'
        },
        soft: {
            name: '柔光',
            description: '应用柔光效果'
        },
        warm: {
            name: '暖色',
            description: '增加暖色调'
        },
        cool: {
            name: '冷色',
            description: '增加冷色调'
        }
    },

    /**
     * 初始化滤镜模块
     */
    init() {
        this.currentFilter = 'none';
        console.log('[Filters] 滤镜模块初始化完成');
    },

    /**
     * 应用滤镜到图像
     * @param {HTMLCanvasElement} sourceCanvas - 源画布
     * @param {HTMLCanvasElement} targetCanvas - 目标画布
     * @param {string} filterName - 滤镜名称
     * @returns {boolean} 是否成功应用
     */
    applyFilter(sourceCanvas, targetCanvas, filterName) {
        if (!sourceCanvas || !targetCanvas) {
            console.error('[Filters] 画布参数无效');
            return false;
        }

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');
        
        targetCanvas.width = sourceCanvas.width;
        targetCanvas.height = sourceCanvas.height;

        const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const data = imageData.data;

        switch (filterName) {
            case 'grayscale':
                this.applyGrayscale(data);
                break;
            case 'sepia':
                this.applySepia(data);
                break;
            case 'vintage':
                this.applyVintage(data);
                break;
            case 'sharpen':
                this.applySharpen(imageData, sourceCanvas.width, sourceCanvas.height);
                break;
            case 'soft':
                this.applySoft(imageData, sourceCanvas.width, sourceCanvas.height);
                break;
            case 'warm':
                this.applyWarm(data);
                break;
            case 'cool':
                this.applyCool(data);
                break;
            case 'none':
            default:
                break;
        }

        targetCtx.putImageData(imageData, 0, 0);
        this.currentFilter = filterName;
        
        console.log(`[Filters] 应用滤镜: ${filterName}`);
        return true;
    },

    /**
     * 黑白滤镜
     */
    applyGrayscale(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    },

    /**
     * 怀旧滤镜（深褐色）
     */
    applySepia(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
    },

    /**
     * 复古滤镜
     */
    applyVintage(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, r * 0.9 + 40);
            data[i + 1] = Math.min(255, g * 0.8 + 20);
            data[i + 2] = Math.min(255, b * 0.6);
            
            const avg = (r + g + b) / 3;
            if (avg < 128) {
                data[i] = Math.max(0, data[i] - 10);
                data[i + 1] = Math.max(0, data[i + 1] - 5);
            }
        }
    },

    /**
     * 锐化滤镜
     */
    applySharpen(imageData, width, height) {
        const data = imageData.data;
        const originalData = new Uint8ClampedArray(data);
        
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        
        const kernelSize = 3;
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
                data[idx] = Math.max(0, Math.min(255, sumR));
                data[idx + 1] = Math.max(0, Math.min(255, sumG));
                data[idx + 2] = Math.max(0, Math.min(255, sumB));
            }
        }
    },

    /**
     * 柔光滤镜
     */
    applySoft(imageData, width, height) {
        const data = imageData.data;
        const originalData = new Uint8ClampedArray(data);
        
        const blurRadius = 1;
        
        for (let y = blurRadius; y < height - blurRadius; y++) {
            for (let x = blurRadius; x < width - blurRadius; x++) {
                let sumR = 0, sumG = 0, sumB = 0, count = 0;
                
                for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                    for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        sumR += originalData[idx];
                        sumG += originalData[idx + 1];
                        sumB += originalData[idx + 2];
                        count++;
                    }
                }
                
                const idx = (y * width + x) * 4;
                const avgR = sumR / count;
                const avgG = sumG / count;
                const avgB = sumB / count;
                
                data[idx] = this.applySoftLight(data[idx], avgR);
                data[idx + 1] = this.applySoftLight(data[idx + 1], avgG);
                data[idx + 2] = this.applySoftLight(data[idx + 2], avgB);
            }
        }
    },

    /**
     * 柔光混合模式
     */
    applySoftLight(base, blend) {
        base = base / 255;
        blend = blend / 255;
        
        let result;
        if (blend < 0.5) {
            result = 2 * base * blend + base * base * (1 - 2 * blend);
        } else {
            result = 2 * base * (1 - blend) + Math.sqrt(base) * (2 * blend - 1);
        }
        
        return Math.round(result * 255);
    },

    /**
     * 暖色滤镜
     */
    applyWarm(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + 30);
            data[i + 1] = Math.min(255, data[i + 1] + 10);
            data[i + 2] = Math.max(0, data[i + 2] - 20);
        }
    },

    /**
     * 冷色滤镜
     */
    applyCool(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.max(0, data[i] - 20);
            data[i + 1] = Math.min(255, data[i + 1] + 10);
            data[i + 2] = Math.min(255, data[i + 2] + 30);
        }
    },

    /**
     * 获取当前滤镜
     * @returns {string}
     */
    getCurrentFilter() {
        return this.currentFilter;
    },

    /**
     * 重置滤镜
     */
    reset() {
        this.currentFilter = 'none';
        console.log('[Filters] 滤镜已重置');
    },

    /**
     * 获取所有可用滤镜列表
     * @returns {Array}
     */
    getFilterList() {
        return Object.entries(this.filters).map(([key, value]) => ({
            id: key,
            ...value
        }));
    }
};

Filters.init();
