const API_BASE = '/api';

const Http = {
    getHeaders(includeToken = true) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (includeToken) {
            const token = Storage.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return headers;
    },

    async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            if (data.code === 401) {
                Storage.clear();
                if (window.JournalApp && typeof window.JournalApp.redirectToLogin === 'function') {
                    window.JournalApp.redirectToLogin();
                } else {
                    window.location.hash = '#/login';
                }
                return data;
            }
            return data;
        } catch (err) {
            console.error('Request error:', err);
            return {
                code: 500,
                message: '网络请求失败: ' + (err.message || 'Unknown error'),
                data: null
            };
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${API_BASE}${url}?${queryString}` : `${API_BASE}${url}`;
        return this.request(fullUrl, {
            method: 'GET',
            headers: this.getHeaders()
        });
    },

    async post(url, body = {}) {
        return this.request(`${API_BASE}${url}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body)
        });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${API_BASE}${url}?${queryString}` : `${API_BASE}${url}`;
        return this.request(fullUrl, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
    },

    async upload(url, file, onProgress = null) {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}${url}`);

            const token = Storage.getToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    }
                });
            }

            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.code === 401) {
                        Storage.clear();
                        window.location.hash = '#/login';
                    }
                    resolve(data);
                } catch (err) {
                    resolve({
                        code: 500,
                        message: '响应解析失败',
                        data: null
                    });
                }
            };

            xhr.onerror = () => {
                resolve({
                    code: 500,
                    message: '上传失败，请检查网络',
                    data: null
                });
            };

            xhr.send(formData);
        });
    }
};

const Toast = {
    show(message, type = 'info', desc = '', duration = 3000) {
        const container = document.getElementById('toast-container') || (() => {
            const el = document.createElement('div');
            el.id = 'toast-container';
            el.className = 'toast-container';
            document.body.appendChild(el);
            return el;
        })();

        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'i'}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
            </div>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.2s ease reverse';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },
    success(message, desc = '') { this.show(message, 'success', desc); },
    error(message, desc = '') { this.show(message, 'error', desc); },
    warning(message, desc = '') { this.show(message, 'warning', desc); },
    info(message, desc = '') { this.show(message, 'info', desc); }
};

const Helpers = {
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${min}`;
    },
    formatDateShort(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    },
    getAvatar(name) {
        if (!name) return '?';
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase();
    },
    getFileExtension(filename) {
        if (!filename) return '';
        const idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx + 1).toUpperCase() : '';
    },
    getFileIcon(filename) {
        const ext = this.getFileExtension(filename).toLowerCase();
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            txt: '📃',
            tex: '📋',
            zip: '🗜️'
        };
        return icons[ext] || '📎';
    },
    formatFileSize(bytes) {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    debounce(fn, delay = 300) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};

const ManuscriptStatus = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    REVIEW_COMPLETED: 'review_completed',
    ACCEPTED: 'accepted',
    REVISION_REQUIRED: 'revision_required',
    REJECTED: 'rejected',
    PUBLISHED: 'published'
};

const STATUS_MAP = {
    draft: { label: '草稿', class: 'status-draft' },
    submitted: { label: '已提交', class: 'status-submitted' },
    under_review: { label: '审稿中', class: 'status-reviewing' },
    review_completed: { label: '审稿完成', class: 'status-review-done' },
    accepted: { label: '已录用', class: 'status-accepted' },
    revision_required: { label: '需修改', class: 'status-revision' },
    rejected: { label: '已退稿', class: 'status-rejected' },
    published: { label: '已发表', class: 'status-published' }
};
