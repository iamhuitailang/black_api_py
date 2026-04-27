const Utils = {
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle(fn, delay = 300) {
        let lastTime = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(this, args);
            }
        };
    },

    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    formatRelativeTime(date) {
        const now = Date.now();
        const target = new Date(date).getTime();
        const diff = now - target;

        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const week = 7 * day;
        const month = 30 * day;
        const year = 365 * day;

        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else if (diff < week) {
            return Math.floor(diff / day) + '天前';
        } else if (diff < month) {
            return Math.floor(diff / week) + '周前';
        } else if (diff < year) {
            return Math.floor(diff / month) + '个月前';
        } else {
            return Math.floor(diff / year) + '年前';
        }
    },

    formatMoney(amount, decimal = 2) {
        if (amount == null) return '0.00';
        return Number(amount).toFixed(decimal);
    },

    maskPhone(phone) {
        if (!phone) return '';
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },

    isValidPhone(phone) {
        return /^1[3-9]\d{9}$/.test(phone);
    },

    isValidPassword(password) {
        return password && password.length >= 6;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = this.deepClone(obj[key]);
            });
            return copy;
        }
        return obj;
    },

    storage: {
        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                if (value === null) return defaultValue;
                return JSON.parse(value);
            } catch (e) {
                return localStorage.getItem(key) || defaultValue;
            }
        },

        set(key, value) {
            try {
                if (typeof value === 'object') {
                    localStorage.setItem(key, JSON.stringify(value));
                } else {
                    localStorage.setItem(key, value);
                }
            } catch (e) {
                console.error('Storage set error:', e);
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Storage remove error:', e);
            }
        },

        clear() {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('Storage clear error:', e);
            }
        }
    },

    showToast(message, type = 'info', duration = 3000) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
    },

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    truncate(str, length = 100, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },

    getQueryParams(url = window.location.href) {
        const params = {};
        const urlObj = new URL(url);
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    },

    buildQueryString(params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                searchParams.append(key, value);
            }
        });
        return searchParams.toString();
    },

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            textarea.remove();
            return true;
        }
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    },

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    },

    isAndroid() {
        return /Android/.test(navigator.userAgent);
    },

    getSafeAreaInsets() {
        const style = getComputedStyle(document.documentElement);
        return {
            top: parseInt(style.getPropertyValue('--safe-area-top')) || 0,
            bottom: parseInt(style.getPropertyValue('--safe-area-bottom')) || 0
        };
    },

    observeElement(element, options = {}) {
        if (!('IntersectionObserver' in window)) {
            options.onVisible && options.onVisible();
            return null;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    options.onVisible && options.onVisible();
                    if (options.once) {
                        observer.unobserve(element);
                    }
                } else {
                    options.onHidden && options.onHidden();
                }
            });
        }, {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px'
        });

        observer.observe(element);
        return observer;
    },

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.observeElement(img, {
                once: true,
                onVisible: () => {
                    img.src = img.dataset.src;
                    img.classList.add('img-loading');
                    img.onload = () => {
                        img.classList.remove('img-loading');
                        img.classList.add('img-loaded');
                    };
                }
            });
        });
    },

    preventScroll() {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
    },

    allowScroll() {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    },

    addClass(element, className) {
        if (element.classList) {
            element.classList.add(className);
        } else {
            element.className += ' ' + className;
        }
    },

    removeClass(element, className) {
        if (element.classList) {
            element.classList.remove(className);
        } else {
            element.className = element.className.replace(
                new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'),
                ' '
            );
        }
    },

    toggleClass(element, className) {
        if (element.classList) {
            element.classList.toggle(className);
        } else {
            const classes = element.className.split(' ');
            const existingIndex = classes.indexOf(className);
            if (existingIndex >= 0) {
                classes.splice(existingIndex, 1);
            } else {
                classes.push(className);
            }
            element.className = classes.join(' ');
        }
    },

    hasClass(element, className) {
        if (element.classList) {
            return element.classList.contains(className);
        }
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    }
};

window.Utils = Utils;
