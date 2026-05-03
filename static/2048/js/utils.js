var Utils = (function() {
    'use strict';

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function addClass(element, className) {
        if (element && element.classList) {
            element.classList.add(className);
        }
    }

    function removeClass(element, className) {
        if (element && element.classList) {
            element.classList.remove(className);
        }
    }

    function hasClass(element, className) {
        if (element && element.classList) {
            return element.classList.contains(className);
        }
        return false;
    }

    function createElement(tag, className, innerHTML) {
        var el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (innerHTML) {
            el.innerHTML = innerHTML;
        }
        return el;
    }

    function removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    function random(min, max) {
        if (max === undefined) {
            max = min;
            min = 0;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomChoice(arr) {
        if (!arr || arr.length === 0) {
            return null;
        }
        return arr[random(0, arr.length - 1)];
    }

    function now() {
        return Date.now();
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

    function clone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(function(item) {
                return clone(item);
            });
        }
        var cloned = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = clone(obj[key]);
            }
        }
        return cloned;
    }

    function deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null || typeof a !== typeof b) {
            return false;
        }
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) {
                return false;
            }
            for (var i = 0; i < a.length; i++) {
                if (!deepEqual(a[i], b[i])) {
                    return false;
                }
            }
            return true;
        }
        if (typeof a === 'object' && typeof b === 'object') {
            var keysA = Object.keys(a);
            var keysB = Object.keys(b);
            if (keysA.length !== keysB.length) {
                return false;
            }
            for (var j = 0; j < keysA.length; j++) {
                var key = keysA[j];
                if (!b.hasOwnProperty(key) || !deepEqual(a[key], b[key])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function showToast(message, type) {
        type = type || 'info';
        var toast = createElement('div', 'toast toast-' + type, message);
        toast.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; font-weight: bold; z-index: 9999; animation: fadeIn 0.3s ease;';
        
        switch (type) {
            case 'success':
                toast.style.background = 'linear-gradient(135deg, #00c853 0%, #00e676 100%)';
                toast.style.color = '#fff';
                break;
            case 'error':
                toast.style.background = 'linear-gradient(135deg, #ff5252 0%, #ff1744 100%)';
                toast.style.color = '#fff';
                break;
            case 'warning':
                toast.style.background = 'linear-gradient(135deg, #ffab00 0%, #ffd740 100%)';
                toast.style.color = '#333';
                break;
            default:
                toast.style.background = 'linear-gradient(135deg, #2979ff 0%, #448aff 100%)';
                toast.style.color = '#fff';
        }
        
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(function() {
                removeElement(toast);
            }, 300);
        }, 2000);
    }

    return {
        $: $,
        $$: $$,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        createElement: createElement,
        removeElement: removeElement,
        random: random,
        randomChoice: randomChoice,
        now: now,
        debounce: debounce,
        throttle: throttle,
        clone: clone,
        deepEqual: deepEqual,
        uuid: uuid,
        showToast: showToast
    };
})();
