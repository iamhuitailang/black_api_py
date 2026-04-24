var Utils = (function() {
    'use strict';

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    function getGridDistance(g1, g2) {
        return Math.abs(g1.row - g2.row) + Math.abs(g1.col - g2.col);
    }

    function inRange(value, min, max) {
        return value >= min && value <= max;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    function delay(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms);
        });
    }

    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    function throttle(func, limit) {
        var inThrottle;
        return function() {
            var context = this;
            var args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
        };
    }

    function $(selector, context) {
        context = context || document;
        return context.querySelector(selector);
    }

    function $$(selector, context) {
        context = context || document;
        return Array.from(context.querySelectorAll(selector));
    }

    function createElement(tag, className, innerHTML) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }

    function removeElement(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    function addClass(el, className) {
        if (el && el.classList) {
            el.classList.add(className);
        }
    }

    function removeClass(el, className) {
        if (el && el.classList) {
            el.classList.remove(className);
        }
    }

    function hasClass(el, className) {
        return el && el.classList && el.classList.contains(className);
    }

    function toggleClass(el, className) {
        if (el && el.classList) {
            el.classList.toggle(className);
        }
    }

    function getElementPosition(el) {
        var rect = el.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
    }

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 2000;
        
        var toast = createElement('div', 'toast toast-' + type, message);
        toast.style.cssText = 'position: fixed; top: 100px; left: 50%; transform: translateX(-50%); padding: 15px 30px; border-radius: 10px; font-weight: bold; z-index: 9999; animation: fadeIn 0.3s ease;';
        
        var colors = {
            success: 'background: linear-gradient(135deg, #55efc4, #00b894); color: white;',
            error: 'background: linear-gradient(135deg, #ff7675, #d63031); color: white;',
            warning: 'background: linear-gradient(135deg, #fdcb6e, #f39c12); color: white;',
            info: 'background: linear-gradient(135deg, #74b9ff, #0984e3); color: white;'
        };
        
        toast.style.cssText += colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(function() {
                removeElement(toast);
            }, 300);
        }, duration);
    }

    function deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(function(item) {
                return deepClone(item);
            });
        }
        var cloned = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }

    function mergeObjects(target, source) {
        var result = deepClone(target);
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = mergeObjects(result[key] || {}, source[key]);
                } else {
                    result[key] = deepClone(source[key]);
                }
            }
        }
        return result;
    }

    function now() {
        return Date.now();
    }

    function timestamp() {
        return Math.floor(Date.now() / 1000);
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    return {
        random: random,
        randomFloat: randomFloat,
        randomChoice: randomChoice,
        getDistance: getDistance,
        getGridDistance: getGridDistance,
        inRange: inRange,
        clamp: clamp,
        formatNumber: formatNumber,
        delay: delay,
        debounce: debounce,
        throttle: throttle,
        $: $,
        $$: $$,
        createElement: createElement,
        removeElement: removeElement,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        toggleClass: toggleClass,
        getElementPosition: getElementPosition,
        showToast: showToast,
        deepClone: deepClone,
        mergeObjects: mergeObjects,
        now: now,
        timestamp: timestamp,
        uuid: uuid
    };
})();
