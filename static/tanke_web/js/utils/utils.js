const Utils = {
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    createElement(tag, className = '', innerHTML = '') {
        const el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (innerHTML) {
            el.innerHTML = innerHTML;
        }
        return el;
    },

    addClass(el, className) {
        if (el && className) {
            el.classList.add(className);
        }
    },

    removeClass(el, className) {
        if (el && className) {
            el.classList.remove(className);
        }
    },

    hasClass(el, className) {
        return el && el.classList && el.classList.contains(className);
    },

    toggleClass(el, className) {
        if (el && className) {
            el.classList.toggle(className);
        }
    },

    removeElement(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    },

    updateElement(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    },

    now() {
        return performance.now ? performance.now() : Date.now();
    },

    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomChoice(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    rectIntersect(r1, r2) {
        return !(r1.x + r1.width < r2.x ||
                 r2.x + r2.width < r1.x ||
                 r1.y + r1.height < r2.y ||
                 r2.y + r2.height < r1.y);
    },

    circleIntersect(c1, c2) {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < c1.radius + c2.radius;
    },

    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },

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

    getElementPosition(el) {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    },

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    padZero(num, length = 2) {
        return num.toString().padStart(length, '0');
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    showToast(message, duration = 2000) {
        const toast = Utils.$('#message-toast');
        const toastText = Utils.$('#toast-text');
        if (!toast || !toastText) return;

        toastText.textContent = message;
        toast.style.display = 'block';

        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    },

    createBackgroundParticles() {
        const container = Utils.$('#bg-particles');
        if (!container) return;

        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = this.createElement('div', 'bg-particle');
            particle.style.left = this.randomFloat(0, 100) + '%';
            particle.style.top = this.randomFloat(0, 100) + '%';
            particle.style.animationDelay = this.randomFloat(0, 8) + 's';
            particle.style.animationDuration = this.randomFloat(6, 12) + 's';
            container.appendChild(particle);
        }
    },

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

window.Utils = Utils;
