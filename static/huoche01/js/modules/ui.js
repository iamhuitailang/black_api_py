/**
 * UI控制模块
 * 处理用户界面交互
 */

class UI {
    /**
     * 构造函数
     */
    constructor() {
        // DOM元素
        this.elements = {
            canvas: null,
            startBtn: null,
            pauseBtn: null,
            restartBtn: null,
            nextLevelBtn: null,
            currentLevel: null,
            gameStatus: null,
            gameModal: null,
            modalTitle: null,
            modalMessage: null,
            modalRestartBtn: null,
            modalNextBtn: null
        };
        
        // 回调函数
        this.callbacks = {
            onStart: null,
            onPause: null,
            onResume: null,
            onRestart: null,
            onNextLevel: null,
            onCanvasClick: null
        };
    }

    /**
     * 初始化UI
     */
    init() {
        // 获取DOM元素
        this.elements.canvas = document.getElementById('game-canvas');
        this.elements.startBtn = document.getElementById('start-btn');
        this.elements.pauseBtn = document.getElementById('pause-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
        this.elements.nextLevelBtn = document.getElementById('next-level-btn');
        this.elements.currentLevel = document.getElementById('current-level');
        this.elements.gameStatus = document.getElementById('game-status');
        this.elements.gameModal = document.getElementById('game-modal');
        this.elements.modalTitle = document.getElementById('modal-title');
        this.elements.modalMessage = document.getElementById('modal-message');
        this.elements.modalRestartBtn = document.getElementById('modal-restart-btn');
        this.elements.modalNextBtn = document.getElementById('modal-next-btn');
        
        // 绑定事件
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 开始按钮
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                if (this.callbacks.onStart) {
                    this.callbacks.onStart();
                }
            });
        }
        
        // 暂停按钮
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                if (this.callbacks.onPause) {
                    this.callbacks.onPause();
                }
            });
        }
        
        // 重新开始按钮
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                if (this.callbacks.onRestart) {
                    this.callbacks.onRestart();
                }
            });
        }
        
        // 下一关按钮
        if (this.elements.nextLevelBtn) {
            this.elements.nextLevelBtn.addEventListener('click', () => {
                if (this.callbacks.onNextLevel) {
                    this.callbacks.onNextLevel();
                }
            });
        }
        
        // 画布点击事件
        if (this.elements.canvas) {
            this.elements.canvas.addEventListener('click', (e) => {
                if (this.callbacks.onCanvasClick) {
                    const rect = this.elements.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.callbacks.onCanvasClick(x, y);
                }
            });
        }
        
        // 模态框按钮
        if (this.elements.modalRestartBtn) {
            this.elements.modalRestartBtn.addEventListener('click', () => {
                this.hideModal();
                if (this.callbacks.onRestart) {
                    this.callbacks.onRestart();
                }
            });
        }
        
        if (this.elements.modalNextBtn) {
            this.elements.modalNextBtn.addEventListener('click', () => {
                this.hideModal();
                if (this.callbacks.onNextLevel) {
                    this.callbacks.onNextLevel();
                }
            });
        }
    }

    /**
     * 设置关卡显示
     * @param {number} level - 关卡号
     */
    setCurrentLevel(level) {
        if (this.elements.currentLevel) {
            this.elements.currentLevel.textContent = level;
        }
    }

    /**
     * 设置游戏状态显示
     * @param {string} status - 状态文本
     */
    setGameStatus(status) {
        if (this.elements.gameStatus) {
            this.elements.gameStatus.textContent = status;
        }
    }

    /**
     * 更新按钮状态
     * @param {string} gameState - 游戏状态
     */
    updateButtonStates(gameState) {
        if (!this.elements.startBtn || !this.elements.pauseBtn) {
            return;
        }
        
        switch (gameState) {
            case 'idle':
                this.elements.startBtn.disabled = false;
                this.elements.startBtn.textContent = '🎮 开始游戏';
                this.elements.pauseBtn.disabled = true;
                this.elements.pauseBtn.textContent = '⏸️ 暂停';
                break;
                
            case 'playing':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.pauseBtn.textContent = '⏸️ 暂停';
                break;
                
            case 'paused':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.pauseBtn.textContent = '▶️ 继续';
                break;
                
            case 'gameOver':
            case 'victory':
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = true;
                break;
        }
    }

    /**
     * 显示下一关按钮
     * @param {boolean} show - 是否显示
     */
    showNextLevelButton(show = true) {
        if (this.elements.nextLevelBtn) {
            this.elements.nextLevelBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    /**
     * 显示模态框
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {boolean} showNextButton - 是否显示下一关按钮
     */
    showModal(title, message, showNextButton = false) {
        if (!this.elements.gameModal) {
            return;
        }
        
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = title;
        }
        
        if (this.elements.modalMessage) {
            this.elements.modalMessage.textContent = message;
        }
        
        if (this.elements.modalNextBtn) {
            this.elements.modalNextBtn.style.display = showNextButton ? 'inline-block' : 'none';
        }
        
        this.elements.gameModal.style.display = 'flex';
    }

    /**
     * 隐藏模态框
     */
    hideModal() {
        if (this.elements.gameModal) {
            this.elements.gameModal.style.display = 'none';
        }
    }

    /**
     * 显示游戏结束模态框
     * @param {string} message - 消息
     */
    showGameOverModal(message) {
        this.showModal('游戏结束', message, false);
    }

    /**
     * 显示胜利模态框
     * @param {Object} info - 胜利信息
     * @param {boolean} isLastLevel - 是否是最后一关
     */
    showVictoryModal(info, isLastLevel = false) {
        let message = '恭喜！所有火车已安全到达站台！\n';
        
        if (info && info.time !== undefined) {
            message += `用时: ${info.time.toFixed(1)} 秒\n`;
        }
        
        if (isLastLevel) {
            message += '\n🎉 你完成了所有关卡！';
            this.showModal('恭喜通关！', message, false);
        } else {
            message += '\n点击"下一关"继续挑战！';
            this.showModal('关卡完成！', message, true);
        }
    }

    /**
     * 设置画布尺寸
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    setCanvasSize(width, height) {
        if (this.elements.canvas) {
            this.elements.canvas.width = width;
            this.elements.canvas.height = height;
        }
    }

    /**
     * 获取画布元素
     * @returns {HTMLCanvasElement|null}
     */
    getCanvas() {
        return this.elements.canvas;
    }

    /**
     * 设置回调函数
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    setCallback(event, callback) {
        if (this.callbacks.hasOwnProperty(event)) {
            this.callbacks[event] = callback;
        }
    }

    /**
     * 震动效果
     */
    shakeScreen() {
        if (this.elements.canvas) {
            this.elements.canvas.classList.add('shake');
            setTimeout(() => {
                this.elements.canvas.classList.remove('shake');
            }, 500);
        }
    }

    /**
     * 闪烁效果
     * @param {HTMLElement} element - 元素
     */
    pulseElement(element) {
        if (element) {
            element.classList.add('pulse');
            setTimeout(() => {
                element.classList.remove('pulse');
            }, 1000);
        }
    }
}

export default UI;
