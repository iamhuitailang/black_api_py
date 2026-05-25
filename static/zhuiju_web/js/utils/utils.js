const Utils = {
    escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    },

    formatDuration(minutes) {
        minutes = parseInt(minutes) || 0;
        if (minutes < 60) return `${minutes}分钟`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
    },

    formatDate(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        } catch (e) { return ''; }
    },

    stars(n) {
        n = parseInt(n) || 0;
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="rating-star ${i <= n ? 'active' : ''}" data-value="${i}">★</span>`;
        }
        return html;
    },

    renderStars(container, value, onChange) {
        container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.className = `rating-star ${i <= value ? 'active' : ''}`;
            s.textContent = '★';
            s.dataset.value = i;
            s.addEventListener('click', () => {
                if (typeof onChange === 'function') onChange(i);
            });
            s.addEventListener('mouseenter', () => {
                container.querySelectorAll('.rating-star').forEach((el, idx) => {
                    el.classList.toggle('active', idx < i);
                });
            });
            s.addEventListener('mouseleave', () => {
                container.querySelectorAll('.rating-star').forEach((el, idx) => {
                    el.classList.toggle('active', idx < value);
                });
            });
            container.appendChild(s);
        }
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = message;
        container.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transition = 'opacity 0.3s';
            setTimeout(() => t.remove(), 300);
        }, 2000);
    },

    showModal(contentHtml, { title = '' } = {}) {
        const container = document.getElementById('modal-container');
        if (!container) return;
        container.innerHTML = `
            <div class="modal-overlay" id="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">${Utils.escapeHtml(title)}</div>
                        <button class="modal-close" id="modal-close">✕</button>
                    </div>
                    <div id="modal-body">${contentHtml}</div>
                </div>
            </div>
        `;
        const close = () => { container.innerHTML = ''; };
        document.getElementById('modal-close').addEventListener('click', close);
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') close();
        });
        return { close, body: document.getElementById('modal-body') };
    },

    closeModal() {
        const container = document.getElementById('modal-container');
        if (container) container.innerHTML = '';
    },

    downloadFile(filename, content, type = 'application/json') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    statusLabel(status) {
        const map = { want: '想看', watching: '正在追', finished: '已看完', dropped: '弃剧' };
        return map[status] || status;
    },

    statusBadgeClass(status) {
        return `badge-${status}`;
    }
};
