const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    isInViewport(element, offset = 0) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
            rect.bottom >= -offset
        );
    },

    getScrollPercentage() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    },

    smoothScrollTo(target, duration = 500) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const ease = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    },

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    formatDate(date, format = 'YYYY-MM-DD') {
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

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },

    isAndroid() {
        return /Android/i.test(navigator.userAgent);
    },

    getDeviceInfo() {
        return {
            isMobile: this.isMobile(),
            isIOS: this.isIOS(),
            isAndroid: this.isAndroid(),
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
    },

    storage: {
        set(key, value, isSession = false) {
            const storage = isSession ? sessionStorage : localStorage;
            try {
                storage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        get(key, defaultValue = null, isSession = false) {
            const storage = isSession ? sessionStorage : localStorage;
            try {
                const item = storage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove(key, isSession = false) {
            const storage = isSession ? sessionStorage : localStorage;
            try {
                storage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        clear(isSession = false) {
            const storage = isSession ? sessionStorage : localStorage;
            try {
                storage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },

    cookie: {
        set(name, value, days = 7) {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        },

        get(name) {
            const nameEQ = name + '=';
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },

        remove(name) {
            this.set(name, '', -1);
        }
    },

    async fetchAPI(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch API error:', error);
            throw error;
        }
    },

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await this.delay(delay);
                return this.retry(fn, retries - 1, delay);
            }
            throw error;
        }
    },

    classNames(...classes) {
        return classes.filter(Boolean).join(' ');
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    truncate(str, length = 50, ellipsis = '...') {
        if (str.length <= length) return str;
        return str.slice(0, length - ellipsis.length) + ellipsis;
    },

    slugify(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    unescapeHTML(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent;
    },

    isEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    isPhone(phone) {
        const regex = /^1[3-9]\d{9}$/;
        return regex.test(phone);
    },

    isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    copyToClipboard(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(reject);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                }
                document.body.removeChild(textArea);
            }
        });
    },

    share(data) {
        return new Promise((resolve, reject) => {
            if (navigator.share) {
                navigator.share(data)
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('Web Share API not supported'));
            }
        });
    },

    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.assign(element.dataset, value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    },

    getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    setQueryParam(name, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(name, value);
        window.history.pushState({}, '', url);
    },

    removeQueryParam(name) {
        const url = new URL(window.location.href);
        url.searchParams.delete(name);
        window.history.pushState({}, '', url);
    },

    getElementOffset(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    },

    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';

        if (ua.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
            browserVersion = ua.match(/Firefox\/(\d+\.?\d*)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edg') > -1) {
            browserName = 'Edge';
            browserVersion = ua.match(/Edg\/(\d+\.?\d*)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
            browserVersion = ua.match(/Chrome\/(\d+\.?\d*)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1) {
            browserName = 'Safari';
            browserVersion = ua.match(/Version\/(\d+\.?\d*)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
            browserName = 'Opera';
            browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.?\d*)/)?.[1] || 'Unknown';
        }

        return {
            name: browserName,
            version: browserVersion,
            userAgent: ua
        };
    },

    addClass(element, className) {
        if (element && className) {
            if (element.classList) {
                element.classList.add(className);
            } else {
                element.className += ' ' + className;
            }
        }
    },

    removeClass(element, className) {
        if (element && className) {
            if (element.classList) {
                element.classList.remove(className);
            } else {
                element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
            }
        }
    },

    toggleClass(element, className) {
        if (element && className) {
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
        }
    },

    hasClass(element, className) {
        if (!element || !className) return false;
        
        if (element.classList) {
            return element.classList.contains(className);
        }
        
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(element.className);
    },

    findParent(element, selector) {
        let parent = element.parentElement;
        while (parent) {
            if (parent.matches(selector)) {
                return parent;
            }
            parent = parent.parentElement;
        }
        return null;
    },

    findSiblings(element) {
        const siblings = [];
        let sibling = element.parentNode.firstChild;
        
        while (sibling) {
            if (sibling.nodeType === 1 && sibling !== element) {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling;
        }
        
        return siblings;
    },

    insertAfter(newElement, referenceElement) {
        referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    },

    removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    emptyElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
};

window.Utils = Utils;
