/**
 * 动画系统模块
 * 负责管理所有动画效果
 */

const Animation = {
    // 动画对象数组
    animations: [],
    
    // 是否正在运行动画循环
    isRunning: false,
    
    // 最后一帧的时间
    lastTime: 0,

    /**
     * 初始化动画系统
     */
    init() {
        this.animations = [];
        this.isRunning = false;
        this.lastTime = 0;
    },

    /**
     * 开始动画循环
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
    },

    /**
     * 停止动画循环
     */
    stop() {
        this.isRunning = false;
    },

    /**
     * 动画循环
     */
    loop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);

        requestAnimationFrame(() => this.loop());
    },

    /**
     * 更新所有动画
     * @param {number} deltaTime 帧间隔时间（毫秒）
     */
    update(deltaTime) {
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i];
            
            if (anim.paused) continue;

            anim.elapsed += deltaTime;
            const progress = Math.min(1, anim.elapsed / anim.duration);
            
            const easedProgress = anim.easing(progress);
            
            if (typeof anim.onUpdate === 'function') {
                anim.onUpdate(easedProgress, progress);
            }

            if (progress >= 1) {
                if (typeof anim.onComplete === 'function') {
                    anim.onComplete();
                }
                
                if (anim.loop) {
                    anim.elapsed = 0;
                    if (typeof anim.onLoop === 'function') {
                        anim.onLoop();
                    }
                } else {
                    this.animations.splice(i, 1);
                }
            }
        }
    },

    /**
     * 创建动画
     * @param {Object} options 动画选项
     * @returns {Object} 动画对象
     */
    create(options) {
        const anim = {
            id: Utils.generateId(),
            duration: options.duration || 500,
            elapsed: 0,
            easing: options.easing || Utils.easeOutQuart,
            onUpdate: options.onUpdate,
            onComplete: options.onComplete,
            onLoop: options.onLoop,
            loop: options.loop || false,
            paused: false
        };

        this.animations.push(anim);
        
        if (!this.isRunning) {
            this.start();
        }

        return anim;
    },

    /**
     * 暂停动画
     * @param {Object} anim 动画对象
     */
    pause(anim) {
        if (anim) {
            anim.paused = true;
        }
    },

    /**
     * 恢复动画
     * @param {Object} anim 动画对象
     */
    resume(anim) {
        if (anim) {
            anim.paused = false;
        }
    },

    /**
     * 取消动画
     * @param {Object} anim 动画对象
     */
    cancel(anim) {
        const index = this.animations.indexOf(anim);
        if (index !== -1) {
            this.animations.splice(index, 1);
        }
    },

    /**
     * 取消所有动画
     */
    cancelAll() {
        this.animations = [];
    },

    // ==================== 预定义动画效果 ====================

    /**
     * 元素放大动画（拖拽开始效果
     * @param {Object} element 元素对象（包含scale, opacity, shadow等属性）
     * @param {Function} onUpdate 更新回调
     * @returns {Object} 动画对象
     */
    dragStart(element, onUpdate) {
        return this.create({
            duration: 200,
            easing: Utils.easeOutQuart,
            onUpdate: (progress) => {
                element.scale = Utils.lerp(1, 1.05, progress);
                element.opacity = Utils.lerp(1, 0.9, progress);
                element.shadowBlur = Utils.lerp(0, 20, progress);
                element.shadowOffsetY = Utils.lerp(0, 8, progress);
                if (onUpdate) onUpdate();
            }
        });
    },

    /**
     * 元素归位动画（拖拽结束效果）
     * @param {Object} element 元素对象
     * @param {Object} targetPosition 目标位置 {x, y}
     * @param {Function} onUpdate 更新回调
     * @param {Function} onComplete 完成回调
     * @returns {Object} 动画对象
     */
    dragEnd(element, targetPosition, onUpdate, onComplete) {
        const startX = element.x;
        const startY = element.y;
        
        return this.create({
            duration: 400,
            easing: Utils.easeOutElastic,
            onUpdate: (progress) => {
                element.x = Utils.lerp(startX, targetPosition.x, progress);
                element.y = Utils.lerp(startY, targetPosition.y, progress);
                element.scale = Utils.lerp(element.scale, 1, progress);
                element.opacity = Utils.lerp(element.opacity, 1, progress);
                element.shadowBlur = Utils.lerp(element.shadowBlur, 0, progress);
                element.shadowOffsetY = Utils.lerp(element.shadowOffsetY, 0, progress);
                if (onUpdate) onUpdate();
            },
            onComplete: onComplete
        });
    },

    /**
     * 平滑位置过渡（其他项让位动画）
     * @param {Object} element 元素对象
     * @param {Object} targetPosition 目标位置 {x, y}
     * @param {Function} onUpdate 更新回调
     * @returns {Object} 动画对象
     */
    smoothMove(element, targetPosition, onUpdate) {
        const startX = element.x;
        const startY = element.y;
        
        return this.create({
            duration: 300,
            easing: Utils.easeOutQuart,
            onUpdate: (progress) => {
                element.x = Utils.lerp(startX, targetPosition.x, progress);
                element.y = Utils.lerp(startY, targetPosition.y, progress);
                if (onUpdate) onUpdate();
            }
        });
    },

    /**
     * 卡片飞入动画（跨列移动效果）
     * @param {Object} element 元素对象
     * @param {Object} targetPosition 目标位置 {x, y}
     * @param {Function} onUpdate 更新回调
     * @param {Function} onComplete 完成回调
     * @returns {Object} 动画对象
     */
    flyIn(element, targetPosition, onUpdate, onComplete) {
        const startX = element.x;
        const startY = element.y;
        const startScale = element.scale || 1;
        
        return this.create({
            duration: 500,
            easing: Utils.easeOutElastic,
            onUpdate: (progress, rawProgress) => {
                const easeProgress = Utils.easeOutQuart(rawProgress);
                
                element.x = Utils.lerp(startX, targetPosition.x, easeProgress);
                element.y = Utils.lerp(startY, targetPosition.y, easeProgress);
                
                const scaleProgress = Math.sin(progress * Math.PI);
                element.scale = startScale + scaleProgress * 0.1;
                
                if (onUpdate) onUpdate();
            },
            onComplete: onComplete
        });
    },

    /**
     * 展开/折叠动画
     * @param {Object} element 元素对象
     * @param {number} targetHeight 目标高度
     * @param {boolean} isExpanding 是否展开
     * @param {Function} onUpdate 更新回调
     * @returns {Object} 动画对象
     */
    expandCollapse(element, targetHeight, isExpanding, onUpdate) {
        const startHeight = element.height;
        
        return this.create({
            duration: 300,
            easing: Utils.easeOutQuart,
            onUpdate: (progress) => {
                if (isExpanding) {
                    element.height = Utils.lerp(startHeight, targetHeight, progress);
                } else {
                    element.height = Utils.lerp(startHeight, targetHeight, progress);
                }
                if (onUpdate) onUpdate();
            }
        });
    },

    /**
     * 高亮闪烁动画
     * @param {Object} element 元素对象
     * @param {string} highlightColor 高亮颜色
     * @param {Function} onUpdate 更新回调
     * @returns {Object} 动画对象
     */
    highlight(element, highlightColor, onUpdate) {
        const originalColor = element.backgroundColor;
        
        return this.create({
            duration: 600,
            loop: false,
            easing: (t) => {
                return Math.sin(t * Math.PI);
            },
            onUpdate: (progress) => {
                element.highlightIntensity = progress;
                if (onUpdate) onUpdate();
            },
            onComplete: () => {
                element.highlightIntensity = 0;
                if (onUpdate) onUpdate();
            }
        });
    },

    /**
     * 添加项目动画（从无到有）
     * @param {Object} element 元素对象
     * @param {Function} onUpdate 更新回调
     * @returns {Object} 动画对象
     */
    addItem(element, onUpdate) {
        return this.create({
            duration: 300,
            easing: Utils.easeOutQuart,
            onUpdate: (progress) => {
                element.scale = Utils.lerp(0.5, 1, progress);
                element.opacity = Utils.lerp(0, 1, progress);
                if (onUpdate) onUpdate();
            }
        });
    },

    /**
     * 删除项目动画（从有到无）
     * @param {Object} element 元素对象
     * @param {Function} onUpdate 更新回调
     * @param {Function} onComplete 完成回调
     * @returns {Object} 动画对象
     */
    removeItem(element, onUpdate, onComplete) {
        return this.create({
            duration: 250,
            easing: Utils.easeOutQuart,
            onUpdate: (progress) => {
                element.scale = Utils.lerp(1, 0.5, progress);
                element.opacity = Utils.lerp(1, 0, progress);
                if (onUpdate) onUpdate();
            },
            onComplete: onComplete
        });
    }
};

// 将动画系统暴露到全局
window.Animation = Animation;
