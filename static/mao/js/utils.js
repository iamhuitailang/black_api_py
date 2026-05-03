var Utils = (function() {
    'use strict';

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomChoice(array) {
        if (!array || array.length === 0) {
            return undefined;
        }
        return array[Math.floor(Math.random() * array.length)];
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function getDistance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function checkCollision(circle1, circle2) {
        var dist = getDistance(circle1.x, circle1.y, circle2.x, circle2.y);
        return dist < (circle1.radius + circle2.radius);
    }

    function normalizeDirection(dx, dy) {
        var length = Math.sqrt(dx * dx + dy * dy);
        if (length === 0) {
            return { x: 0, y: 0 };
        }
        return {
            x: dx / length,
            y: dy / length
        };
    }

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function createElement(tagName, className, innerHTML) {
        var el = document.createElement(tagName);
        if (className) {
            el.className = className;
        }
        if (innerHTML) {
            el.innerHTML = innerHTML;
        }
        return el;
    }

    function addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    }

    function removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    }

    function hasClass(element, className) {
        if (!element || !className) {
            return false;
        }
        return element.classList.contains(className);
    }

    function toggleClass(element, className) {
        if (!element || !className) {
            return;
        }
        element.classList.toggle(className);
    }

    function removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    function getElementPosition(element) {
        if (!element) {
            return { left: 0, top: 0 };
        }
        var rect = element.getBoundingClientRect();
        return {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
        };
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

    function formatTime(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function showToast(message, type, duration) {
        type = type || 'info';
        duration = duration || 3000;

        var toast = document.getElementById('toast-container');
        if (!toast) {
            toast = createElement('div', 'toast-container');
            toast.id = 'toast-container';
            document.body.appendChild(toast);
        }

        var toastItem = createElement('div', 'toast toast-' + type, message);
        toast.appendChild(toastItem);

        setTimeout(function() {
            toastItem.style.opacity = '0';
            toastItem.style.transform = 'translateX(100%)';
            setTimeout(function() {
                removeElement(toastItem);
            }, 300);
        }, duration);
    }

    return {
        random: random,
        randomFloat: randomFloat,
        randomChoice: randomChoice,
        clamp: clamp,
        getDistance: getDistance,
        checkCollision: checkCollision,
        normalizeDirection: normalizeDirection,
        $: $,
        $$: $$,
        createElement: createElement,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        toggleClass: toggleClass,
        removeElement: removeElement,
        getElementPosition: getElementPosition,
        now: now,
        debounce: debounce,
        formatTime: formatTime,
        uuid: uuid,
        showToast: showToast
    };
})();
