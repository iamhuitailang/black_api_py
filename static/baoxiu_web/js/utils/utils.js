const Utils = {
    formatDate(dateStr, format = 'YYYY-MM-DD HH:mm') {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds);
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 2000);
    },

    showLoading(container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    },

    showEmpty(container, message = '暂无数据') {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">${message}</div>
            </div>
        `;
    },

    getStatusText(status) {
        const statusMap = {
            0: '待分配',
            1: '已分配',
            2: '维修中',
            3: '已完成',
            4: '已取消'
        };
        return statusMap[status] || '未知';
    },

    getStatusClass(status) {
        const classMap = {
            0: 'status-pending',
            1: 'status-assigned',
            2: 'status-processing',
            3: 'status-completed',
            4: 'status-cancelled'
        };
        return classMap[status] || 'status-pending';
    },

    getUrgencyText(urgency) {
        const urgencyMap = {
            0: '低',
            1: '普通',
            2: '高',
            3: '紧急'
        };
        return urgencyMap[urgency] || '普通';
    },

    getUrgencyClass(urgency) {
        const classMap = {
            0: 'badge-secondary',
            1: 'badge-primary',
            2: 'badge-warning',
            3: 'badge-danger'
        };
        return classMap[urgency] || 'badge-primary';
    },

    getRoleText(role) {
        const roleMap = {
            'student': '学生',
            'repairman': '维修工',
            'admin': '管理员'
        };
        return roleMap[role] || '未知';
    },

    showModal(options) {
        const { title, content, onConfirm, onCancel, confirmText = '确定', cancelText = '取消' } = options;

        const mask = document.createElement('div');
        mask.className = 'modal-mask';

        const modalHtml = `
            <div class="modal-content">
                <div class="modal-title">${title}</div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="modalCancel">${cancelText}</button>
                    <button class="btn btn-primary" id="modalConfirm">${confirmText}</button>
                </div>
            </div>
        `;

        mask.innerHTML = modalHtml;
        document.body.appendChild(mask);

        mask.querySelector('#modalCancel').onclick = () => {
            mask.remove();
            if (onCancel) onCancel();
        };

        mask.querySelector('#modalConfirm').onclick = () => {
            mask.remove();
            if (onConfirm) onConfirm();
        };

        mask.onclick = (e) => {
            if (e.target === mask) {
                mask.remove();
                if (onCancel) onCancel();
            }
        };
    },

    showSelectModal(title, options, onSelect) {
        const optionHtml = options.map((opt, index) => `
            <div class="list-item" data-index="${index}">
                <div class="list-item-content">
                    <div class="list-item-title">${opt.label}</div>
                </div>
            </div>
        `).join('');

        const mask = document.createElement('div');
        mask.className = 'modal-mask';
        mask.innerHTML = `
            <div class="modal-content">
                <div class="modal-title">${title}</div>
                <div>${optionHtml}</div>
            </div>
        `;

        document.body.appendChild(mask);

        mask.querySelectorAll('.list-item').forEach(item => {
            item.onclick = () => {
                const index = parseInt(item.dataset.index);
                mask.remove();
                onSelect(options[index]);
            };
        });

        mask.onclick = (e) => {
            if (e.target === mask) {
                mask.remove();
            }
        };
    }
};
