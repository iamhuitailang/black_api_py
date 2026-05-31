const Utils = {
    formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    formatPrice(price) {
        return '¥' + Number(price).toFixed(2);
    },

    getStatusText(status) {
        const statusMap = {
            0: '待派单',
            1: '已派单',
            2: '进行中',
            3: '已完成',
            4: '已取消',
            'pending': '待派单',
            'assigned': '已派单',
            'confirmed': '进行中',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return statusMap[status] || status;
    },

    getStatusClass(status) {
        const classMap = {
            0: 'status-warning',
            1: 'status-info',
            2: 'status-primary',
            3: 'status-success',
            4: 'status-danger',
            'pending': 'status-warning',
            'assigned': 'status-info',
            'confirmed': 'status-primary',
            'completed': 'status-success',
            'cancelled': 'status-danger'
        };
        return classMap[status] || '';
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    },

    confirm(message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <div class="confirm-message">${message}</div>
                    <div class="confirm-buttons">
                        <button class="btn btn-cancel">取消</button>
                        <button class="btn btn-confirm">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const cancelBtn = modal.querySelector('.btn-cancel');
            const confirmBtn = modal.querySelector('.btn-confirm');

            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
        });
    },

    generateStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
        }
        return stars;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
