(function() {
    'use strict';

    window.Utils = {
        formatNumber: function(num) {
            if (num >= 10000) {
                return (num / 10000).toFixed(1) + '万';
            }
            return num.toString();
        },

        formatTime: function(seconds) {
            if (seconds < 60) {
                return seconds + '秒';
            }
            if (seconds < 3600) {
                var minutes = Math.floor(seconds / 60);
                var secs = seconds % 60;
                return minutes + '分' + (secs > 0 ? secs + '秒' : '');
            }
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);
            return hours + '小时' + (minutes > 0 ? minutes + '分' : '');
        },

        formatDate: function(dateStr) {
            var date = new Date(dateStr);
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            return year + '-' + month + '-' + day;
        },

        showToast: function(message, duration) {
            var container = document.getElementById('toast-container');
            if (!container) return;

            var toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(function() {
                toast.style.opacity = '0';
                toast.style.transform = 'translate(-50%, -50%) scale(0.8)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration || 2000);
        },

        showLoading: function() {
            var mask = document.getElementById('loading-mask');
            if (mask) {
                mask.classList.remove('hidden');
            }
        },

        hideLoading: function() {
            var mask = document.getElementById('loading-mask');
            if (mask) {
                mask.classList.add('hidden');
            }
        },

        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },

        throttle: function(func, limit) {
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
        },

        getTrainEmoji: function(trainType) {
            var emojis = {
                '蒸汽机车': '🚂',
                '内燃机车': '🚄',
                '电力机车': '🚅',
                '磁悬浮': '🚝'
            };
            return emojis[trainType] || '🚂';
        },

        getGoodsEmoji: function(goodsType) {
            var emojis = {
                '木材': '🪵',
                '铁矿': '⛏️',
                '粮食': '🌾',
                '机械零件': '⚙️',
                '钻石': '💎'
            };
            return emojis[goodsType] || '📦';
        },

        getCityEmoji: function(cityName) {
            var emojis = {
                '起点镇': '🏘️',
                '铁矿镇': '⛏️',
                '粮仓市': '🌾',
                '工业城': '⚙️',
                '钻石港': '💎'
            };
            return emojis[cityName] || '🏙️';
        },

        getStatusText: function(status) {
            var texts = {
                'idle': '空闲',
                'moving': '行驶中',
                'maintenance': '维护中'
            };
            return texts[status] || status;
        },

        getStatusBadgeClass: function(status) {
            var classes = {
                'idle': 'badge-cyan',
                'moving': 'badge-pink',
                'maintenance': 'badge-orange'
            };
            return classes[status] || 'badge-locked';
        }
    };
})();
