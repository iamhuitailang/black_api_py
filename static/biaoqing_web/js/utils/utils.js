const Utils = {
    formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return '刚刚';
        }
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        }
        if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        }
        if (diff < 604800000) {
            return Math.floor(diff / 86400000) + '天前';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        if (year === now.getFullYear()) {
            return `${month}-${day}`;
        }
        return `${year}-${month}-${day}`;
    },

    formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + 'w';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return String(num);
    },

    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(reject);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (e) {
                    reject(e);
                }
                document.body.removeChild(textarea);
            }
        });
    },

    downloadImage(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'emoji';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getAvatarEmoji(name) {
        const emojis = ['😀', '😎', '🤩', '😊', '🥰', '😋', '🤗', '😇', '🤓', '😺'];
        const index = name ? name.charCodeAt(0) % emojis.length : 0;
        return emojis[index];
    },

    debounce(fn, delay = 300) {
        let timer = null;
        return function (...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    },

    throttle(fn, delay = 300) {
        let lastTime = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    },

    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validateUsername(username) {
        const re = /^[a-zA-Z0-9_]{3,20}$/;
        return re.test(username);
    },

    validatePassword(password) {
        return password && password.length >= 6;
    },

    showToast(message, type = 'success') {
        if (window.ElMessage) {
            window.ElMessage[type](message);
        } else if (window.ElementPlus && window.ElementPlus.ElMessage) {
            window.ElementPlus.ElMessage[type](message);
        } else {
            alert(message);
        }
    },

    showLoading(text = '加载中...') {
        if (window.ElLoading) {
            return window.ElLoading.service({
                lock: true,
                text: text,
                background: 'rgba(0, 0, 0, 0.7)'
            });
        } else if (window.ElementPlus && window.ElementPlus.ElLoading) {
            return window.ElementPlus.ElLoading.service({
                lock: true,
                text: text,
                background: 'rgba(0, 0, 0, 0.7)'
            });
        }
        return null;
    },

    showConfirm(message, title = '提示') {
        return new Promise((resolve, reject) => {
            if (window.ElMessageBox) {
                window.ElMessageBox.confirm(message, title, {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(resolve).catch(reject);
            } else if (window.ElementPlus && window.ElementPlus.ElMessageBox) {
                window.ElementPlus.ElMessageBox.confirm(message, title, {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(resolve).catch(reject);
            } else {
                if (confirm(message)) {
                    resolve();
                } else {
                    reject();
                }
            }
        });
    }
};
