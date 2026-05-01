const Utils = (function() {
    'use strict';

    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return { success: true, message: '复制成功' };
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    return { success: true, message: '复制成功' };
                } catch (err) {
                    document.body.removeChild(textArea);
                    return { success: false, message: '复制失败，请手动复制' };
                }
            }
        } catch (err) {
            console.error('复制到剪贴板失败:', err);
            return { success: false, message: '复制失败，请手动复制' };
        }
    }

    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const colors = {
            info: '#1a1a1a',
            success: '#2E8B57',
            error: '#B22222',
            warning: '#D4AF37'
        };

        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background-color: ${colors[type] || colors.info};
            color: white;
            border-radius: 4px;
            font-family: "STKaiti", "KaiTi", "KaiTi_GB2312", serif;
            font-size: 16px;
            letter-spacing: 2px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: toastIn 0.3s ease-out;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    function showSuccess(message) {
        showToast(message, 'success');
    }

    function showError(message) {
        showToast(message, 'error');
    }

    function showInfo(message) {
        showToast(message, 'info');
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function getFormattedDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}_${hour}${minute}`;
    }

    function generateFilename(keywords) {
        const safeKeywords = keywords.replace(/[\\/:*?"<>|]/g, '_');
        const dateStr = getFormattedDate();
        return `藏头诗_${safeKeywords}_${dateStr}.png`;
    }

    function addStyles() {
        if (document.getElementById('utils-styles')) return;

        const style = document.createElement('style');
        style.id = 'utils-styles';
        style.textContent = `
            @keyframes toastIn {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes toastOut {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        addStyles();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        copyToClipboard,
        showToast,
        showSuccess,
        showError,
        showInfo,
        debounce,
        throttle,
        getFormattedDate,
        generateFilename
    };
})();
