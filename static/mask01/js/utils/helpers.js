(function(global) {
    'use strict';
    
    const Helpers = {
        generateId: function() {
            return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },
        
        showToast: function(message, duration) {
            duration = duration || 2000;
            const toast = document.getElementById('toast');
            if (!toast) return;
            
            toast.textContent = message;
            toast.style.display = 'block';
            
            clearTimeout(toast._timeout);
            toast._timeout = setTimeout(function() {
                toast.style.display = 'none';
            }, duration);
        },
        
        hexToRgba: function(hex, alpha) {
            alpha = alpha || 1;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
        
        isValidHex: function(hex) {
            return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
        },
        
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = function() {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        downloadFile: function(content, filename, type) {
            const blob = new Blob([content], { type: type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    
    global.Helpers = Helpers;
})(window);