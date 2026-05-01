/**
 * 浏览器通知模块
 * 负责过期提醒的浏览器通知
 */

const NotificationManager = {
    /**
     * 检查并请求通知权限
     * @returns {Promise<boolean>} 是否有权限
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('浏览器不支持通知');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        
        return false;
    },
    
    /**
     * 发送通知
     * @param {string} title - 标题
     * @param {Object} options - 通知选项
     * @returns {Notification|null} 通知对象
     */
    sendNotification(title, options = {}) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return null;
        }
        
        const defaultOptions = {
            icon: '🧊',
            body: '',
            tag: 'fridge-reminder'
        };
        
        return new Notification(title, { ...defaultOptions, ...options });
    },
    
    /**
     * 检查并通知今日过期食材
     */
    async checkAndNotifyExpiringToday() {
        const expiryStats = Storage.getExpiryStats();
        const expiringToday = expiryStats.expiringToday;
        
        if (expiringToday.length === 0) {
            return;
        }
        
        // 请求权限
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
            return;
        }
        
        // 发送通知
        const title = `🧊 冰箱小助手提醒`;
        let body = '';
        
        if (expiringToday.length === 1) {
            body = `"${expiringToday[0].name}" 今天就要过期了！`;
        } else {
            body = `有 ${expiringToday.length} 种食材今天过期：${expiringToday.map(i => i.name).join('、')}`;
        }
        
        this.sendNotification(title, {
            body,
            icon: '🔔'
        });
    },
    
    /**
     * 显示弹窗提示
     * @param {string} message - 提示消息
     * @param {string} type - 提示类型 'success' | 'warning' | 'error' | 'info'
     */
    showToast(message, type = 'info') {
        // 创建toast元素
        const existingToast = document.getElementById('toast-message');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.id = 'toast-message';
        
        // 根据类型设置样式
        const colors = {
            success: '#6BBF59',
            warning: '#FFD93D',
            error: '#FF6B6B',
            info: '#6BBF59'
        };
        
        const bgColors = {
            success: '#E8F5E9',
            warning: '#FFF3CD',
            error: '#FFE5E5',
            info: '#E8F5E9'
        };
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${bgColors[type]};
            border: 2px solid ${colors[type]};
            color: ${colors[type]};
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideDown 0.3s ease-out;
        `;
        
        // 添加图标
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        toast.textContent = `${icons[type]} ${message}`;
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    },
    
    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @returns {Promise<boolean>} 用户选择
     */
    showConfirm(message) {
        return new Promise((resolve) => {
            // 创建遮罩
            const overlay = document.createElement('div');
            overlay.id = 'confirm-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            
            // 创建对话框
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: #FFFFFF;
                padding: 30px;
                border-radius: 20px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            `;
            
            dialog.innerHTML = `
                <p style="font-size: 16px; color: #4A4A4A; margin-bottom: 25px;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="confirm-cancel" style="
                        padding: 10px 30px;
                        border: none;
                        border-radius: 20px;
                        font-size: 14px;
                        cursor: pointer;
                        background: #E8E8E8;
                        color: #4A4A4A;
                    ">取消</button>
                    <button id="confirm-ok" style="
                        padding: 10px 30px;
                        border: none;
                        border-radius: 20px;
                        font-size: 14px;
                        cursor: pointer;
                        background: #FF6B6B;
                        color: #FFFFFF;
                    ">确定</button>
                </div>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // 绑定事件
            const cancelBtn = document.getElementById('confirm-cancel');
            const okBtn = document.getElementById('confirm-ok');
            
            const cleanup = () => {
                overlay.remove();
            };
            
            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            okBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            // 点击遮罩取消
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 导出模块
window.NotificationManager = NotificationManager;
