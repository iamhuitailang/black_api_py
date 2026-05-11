var Utils = (function() {
    'use strict';

    function $(selector) {
        return document.querySelector(selector);
    }

    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    function createElement(tag, className, innerHTML) {
        var el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    }

    function addClass(element, className) {
        if (element && !element.classList.contains(className)) {
            element.classList.add(className);
        }
    }

    function removeClass(element, className) {
        if (element && element.classList.contains(className)) {
            element.classList.remove(className);
        }
    }

    function hasClass(element, className) {
        return element && element.classList.contains(className);
    }

    function toggleClass(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    }

    function removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }

    function getElementPosition(element) {
        var rect = element.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        };
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

    function now() {
        return Date.now();
    }

    function random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function deepMerge(target, source) {
        var result = JSON.parse(JSON.stringify(target));
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function showToast(message, type) {
        var toast = Utils.createElement('div', 'toast toast-' + type, message);
        document.body.appendChild(toast);
        setTimeout(function() {
            Utils.addClass(toast, 'show');
        }, 10);
        setTimeout(function() {
            Utils.removeClass(toast, 'show');
            setTimeout(function() {
                Utils.removeElement(toast);
            }, 300);
        }, 3000);
    }

    return {
        $: $,
        $$: $$,
        createElement: createElement,
        addClass: addClass,
        removeClass: removeClass,
        hasClass: hasClass,
        toggleClass: toggleClass,
        removeElement: removeElement,
        getElementPosition: getElementPosition,
        debounce: debounce,
        now: now,
        random: random,
        randomChoice: randomChoice,
        uuid: uuid,
        deepMerge: deepMerge,
        clamp: clamp,
        showToast: showToast
    };
})();
