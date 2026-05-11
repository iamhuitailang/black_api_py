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

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function now() {
        return Date.now();
    }

    function $(selector, context) {
        context = context || document;
        return context.querySelector(selector);
    }

    function $$(selector, context) {
        context = context || document;
        return Array.from(context.querySelectorAll(selector));
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

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 2000;
        
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        toast.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-weight: 600; z-index: 9999; animation: fadeIn 0.3s ease; font-size: 14px;';
        
        var colors = {
            success: 'background: linear-gradient(135deg, #55efc4, #00b894); color: white;',
            error: 'background: linear-gradient(135deg, #ff7675, #d63031); color: white;',
            warning: 'background: linear-gradient(135deg, #fdcb6e, #f39c12); color: white;',
            info: 'background: linear-gradient(135deg, #74b9ff, #0984e3); color: white;'
        };
        
        toast.style.cssText += colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
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

    function getCanvasCoords(event, canvas) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        
        var clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
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

    return {
        random: random,
        randomFloat: randomFloat,
        randomChoice: randomChoice,
        getDistance: getDistance,
        clamp: clamp,
        now: now,
        $: $,
        $$: $$,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        showToast: showToast,
        deepClone: deepClone,
        getCanvasCoords: getCanvasCoords,
        normalizeAngle: normalizeAngle,
        debounce: debounce
    };
})();
