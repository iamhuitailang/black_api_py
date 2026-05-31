const Toast = {
    show(message, duration = 2000) {
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    success(message) { this.show(message); },
    error(message) { this.show(message); },
    info(message) { this.show(message); }
};

const Loading = {
    show() {
        let mask = document.getElementById('loadingMask');
        if (mask) return;
        mask = document.createElement('div');
        mask.id = 'loadingMask';
        mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;z-index:9999;';
        mask.innerHTML = '<div style="color:white;font-size:18px;">加载中...</div>';
        document.body.appendChild(mask);
    },

    hide() {
        const mask = document.getElementById('loadingMask');
        if (mask) mask.remove();
    }
};

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN');
}

function getStatusText(status) {
    const map = { playing: '进行中', finished: '已完成', cancelled: '已取消' };
    return map[status] || status;
}
