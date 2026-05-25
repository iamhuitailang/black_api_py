var PinTuanStorage = (function() {
  var PREFIX = 'pintuan_';

  function get(key) {
    try {
      var data = localStorage.getItem(PREFIX + key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  }

  function clear() {
    try {
      var keys = Object.keys(localStorage);
      keys.forEach(function(key) {
        if (key.indexOf(PREFIX) === 0) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }

  return {
    get: get,
    set: set,
    remove: remove,
    clear: clear
  };
})();

var PinTuanUtils = (function() {
  function formatTime(timestamp) {
    var now = Date.now();
    var diff = timestamp - now;

    if (diff <= 0) {
      return { expired: true, hours: 0, minutes: 0, seconds: 0 };
    }

    var hours = Math.floor(diff / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      expired: false,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }

  function formatTimeString(timestamp) {
    var time = formatTime(timestamp);
    if (time.expired) {
      return '已结束';
    }
    return padZero(time.hours) + ':' + padZero(time.minutes) + ':' + padZero(time.seconds);
  }

  function padZero(num) {
    return num < 10 ? '0' + num : '' + num;
  }

  function formatDate(timestamp) {
    var date = new Date(timestamp);
    return date.getFullYear() + '-' +
           padZero(date.getMonth() + 1) + '-' +
           padZero(date.getDate()) + ' ' +
           padZero(date.getHours()) + ':' +
           padZero(date.getMinutes());
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return Promise.resolve();
    } catch (e) {
      document.body.removeChild(textarea);
      return Promise.reject(e);
    }
  }

  function generateShareLink(groupId) {
    var baseUrl = window.location.origin + window.location.pathname;
    return baseUrl + '?group=' + groupId;
  }

  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function showToast(message, duration) {
    var toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, duration || 2000);
  }

  return {
    formatTime: formatTime,
    formatTimeString: formatTimeString,
    formatDate: formatDate,
    copyToClipboard: copyToClipboard,
    generateShareLink: generateShareLink,
    getUrlParam: getUrlParam,
    showToast: showToast,
    padZero: padZero
  };
})();
