/**
 * 存储模块 - 负责编辑器状态的本地存储和恢复
 * 使用 localStorage 进行持久化存储
 * 支持页面刷新后恢复所有编辑状态
 */

const Storage = {
    /**
     * 存储键名常量
     */
    STORAGE_KEYS: {
        EDITOR_STATE: 'image_editor_state',
        ORIGINAL_IMAGE: 'image_editor_original',
        CURRENT_IMAGE: 'image_editor_current',
        ANNOTATIONS: 'image_editor_annotations',
        SETTINGS: 'image_editor_settings',
        HISTORY: 'image_editor_history'
    },

    /**
     * 初始化存储模块
     */
    init() {
        console.log('[Storage] 存储模块初始化完成');
    },

    /**
     * 保存完整的编辑器状态
     * @param {Object} state - 编辑器状态对象
     */
    saveState(state) {
        try {
            const stateToSave = {
                timestamp: Date.now(),
                hasImage: state.hasImage || false,
                imageName: state.imageName || '',
                imageSize: state.imageSize || 0,
                imageWidth: state.imageWidth || 0,
                imageHeight: state.imageHeight || 0,
                settings: {
                    brightness: state.settings?.brightness ?? 0,
                    contrast: state.settings?.contrast ?? 0,
                    saturation: state.settings?.saturation ?? 0,
                    sharpness: state.settings?.sharpness ?? 0,
                    scale: state.settings?.scale ?? 100,
                    rotation: state.settings?.rotation ?? 0,
                    flipH: state.settings?.flipH ?? false,
                    flipV: state.settings?.flipV ?? false,
                    filter: state.settings?.filter ?? 'none'
                }
            };

            localStorage.setItem(
                this.STORAGE_KEYS.EDITOR_STATE,
                JSON.stringify(stateToSave)
            );

            if (state.originalImageData) {
                localStorage.setItem(
                    this.STORAGE_KEYS.ORIGINAL_IMAGE,
                    state.originalImageData
                );
            }

            if (state.currentImageData) {
                localStorage.setItem(
                    this.STORAGE_KEYS.CURRENT_IMAGE,
                    state.currentImageData
                );
            }

            if (state.annotations && state.annotations.length > 0) {
                localStorage.setItem(
                    this.STORAGE_KEYS.ANNOTATIONS,
                    JSON.stringify(state.annotations)
                );
            } else {
                localStorage.removeItem(this.STORAGE_KEYS.ANNOTATIONS);
            }

            console.log('[Storage] 状态已保存');
            return true;
        } catch (error) {
            console.error('[Storage] 保存状态失败:', error);
            return false;
        }
    },

    /**
     * 加载保存的编辑器状态
     * @returns {Object|null} 恢复的状态对象，如果没有保存则返回 null
     */
    loadState() {
        try {
            const stateString = localStorage.getItem(this.STORAGE_KEYS.EDITOR_STATE);
            if (!stateString) {
                console.log('[Storage] 没有找到保存的状态');
                return null;
            }

            const savedState = JSON.parse(stateString);
            
            const originalImage = localStorage.getItem(this.STORAGE_KEYS.ORIGINAL_IMAGE);
            const currentImage = localStorage.getItem(this.STORAGE_KEYS.CURRENT_IMAGE);
            
            if (!originalImage) {
                console.log('[Storage] 原始图片数据丢失，清除状态');
                this.clearAll();
                return null;
            }

            const annotationsString = localStorage.getItem(this.STORAGE_KEYS.ANNOTATIONS);
            const annotations = annotationsString ? JSON.parse(annotationsString) : [];

            const restoredState = {
                ...savedState,
                originalImageData: originalImage,
                currentImageData: currentImage,
                annotations: annotations
            };

            console.log('[Storage] 状态已恢复:', restoredState);
            return restoredState;
        } catch (error) {
            console.error('[Storage] 恢复状态失败:', error);
            this.clearAll();
            return null;
        }
    },

    /**
     * 保存历史记录
     * @param {Array} historyStack - 历史记录数组
     * @param {number} currentIndex - 当前索引
     */
    saveHistory(historyStack, currentIndex) {
        try {
            const historyData = {
                stack: historyStack.slice(Math.max(0, historyStack.length - 20)),
                currentIndex: Math.min(currentIndex, 19)
            };
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(historyData));
        } catch (error) {
            console.error('[Storage] 保存历史记录失败:', error);
        }
    },

    /**
     * 加载历史记录
     * @returns {Object|null} 历史记录对象
     */
    loadHistory() {
        try {
            const historyString = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
            return historyString ? JSON.parse(historyString) : null;
        } catch (error) {
            console.error('[Storage] 加载历史记录失败:', error);
            return null;
        }
    },

    /**
     * 保存标注数据
     * @param {Array} annotations - 标注数组
     */
    saveAnnotations(annotations) {
        try {
            if (annotations && annotations.length > 0) {
                localStorage.setItem(
                    this.STORAGE_KEYS.ANNOTATIONS,
                    JSON.stringify(annotations)
                );
            } else {
                localStorage.removeItem(this.STORAGE_KEYS.ANNOTATIONS);
            }
        } catch (error) {
            console.error('[Storage] 保存标注失败:', error);
        }
    },

    /**
     * 保存图片数据（base64格式）
     * @param {string} key - 存储键名
     * @param {string} dataUrl - base64图片数据
     */
    saveImageData(key, dataUrl) {
        try {
            localStorage.setItem(key, dataUrl);
        } catch (error) {
            console.error('[Storage] 保存图片数据失败:', error);
        }
    },

    /**
     * 读取图片数据
     * @param {string} key - 存储键名
     * @returns {string|null} base64图片数据
     */
    loadImageData(key) {
        return localStorage.getItem(key);
    },

    /**
     * 清除所有存储数据
     */
    clearAll() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('[Storage] 所有存储数据已清除');
        } catch (error) {
            console.error('[Storage] 清除数据失败:', error);
        }
    },

    /**
     * 检查是否有保存的状态
     * @returns {boolean}
     */
    hasSavedState() {
        return localStorage.getItem(this.STORAGE_KEYS.EDITOR_STATE) !== null &&
               localStorage.getItem(this.STORAGE_KEYS.ORIGINAL_IMAGE) !== null;
    },

    /**
     * 估算存储大小
     * @returns {Object} 各部分大小（字节）
     */
    getStorageSize() {
        const sizes = {};
        let total = 0;

        Object.values(this.STORAGE_KEYS).forEach(key => {
            const data = localStorage.getItem(key);
            const size = data ? new Blob([data]).size : 0;
            sizes[key] = size;
            total += size;
        });

        sizes.total = total;
        return sizes;
    }
};

Storage.init();
