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

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFrom(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    uniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    formatPrice(price) {
        return '¥' + Number(price).toFixed(0);
    },

    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(el.style, value);
            } else {
                el.setAttribute(key, value);
            }
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                el.appendChild(child);
            }
        });
        return el;
    },

    $(selector, parent = document) {
        return parent.querySelector(selector);
    },

    $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    arrayIntersect(arr1, arr2) {
        return arr1.filter(value => arr2.includes(value));
    },

    arrayUnion(arr1, arr2) {
        return [...new Set([...arr1, ...arr2])];
    },

    arrayDifference(arr1, arr2) {
        return arr1.filter(value => !arr2.includes(value));
    },

    hasIntersection(arr1, arr2) {
        if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return false;
        return arr1.some(item => arr2.includes(item));
    },

    isInPriceRange(price, min, max) {
        const p = Number(price);
        if (max === Infinity) {
            return p >= min;
        }
        return p >= min && p <= max;
    }
};

window.Utils = Utils;
