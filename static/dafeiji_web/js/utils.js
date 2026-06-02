var Utils = {
  formatScore: function(score) {
    if (score === null || score === undefined) return '0';
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatTime: function(seconds) {
    if (!seconds && seconds !== 0) return '00:00';
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  },

  formatDate: function(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    var year = d.getFullYear();
    var month = (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
    var day = (d.getDate() < 10 ? '0' : '') + d.getDate();
    var hours = (d.getHours() < 10 ? '0' : '') + d.getHours();
    var minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  },

  showToast: function(message, type) {
    type = type || 'info';
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  },

  debounce: function(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  },

  throttle: function(fn, delay) {
    var lastTime = 0;
    return function() {
      var context = this;
      var args = arguments;
      var now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        fn.apply(context, args);
      }
    };
  }
};
