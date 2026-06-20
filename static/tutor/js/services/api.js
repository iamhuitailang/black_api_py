const API_BASE_URL = '/api';

const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-message">${message}</div>
            <button class="toast-close">&times;</button>
        `;
        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => toast.remove());

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

const Modal = {
    show(contentHtml, options = {}) {
        const {
            title = '',
            width = 'normal',
            footerHtml = '',
            onClose = null
        } = options;

        let existing = document.getElementById('app-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'app-modal';
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = `modal ${width === 'large' ? 'modal-lg' : ''}`;

        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">${contentHtml}</div>
            ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.classList.add('show'));

        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (onClose) onClose();
            }, 200);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        return { close: closeModal, element: modal };
    },

    close() {
        const overlay = document.getElementById('app-modal');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 200);
        }
    }
};

const FormCache = {
    PREFIX: 'form_cache_',

    save(formId, data) {
        try {
            const key = this.PREFIX + formId;
            Storage.set(key, {
                data: data,
                timestamp: Date.now()
            });
        } catch (e) {
            console.warn('表单缓存保存失败:', e);
        }
    },

    load(formId) {
        try {
            const key = this.PREFIX + formId;
            const cached = Storage.get(key);
            if (cached && cached.data) {
                const age = Date.now() - (cached.timestamp || 0);
                if (age < 30 * 60 * 1000) {
                    return cached.data;
                } else {
                    this.clear(formId);
                }
            }
        } catch (e) {
            console.warn('表单缓存加载失败:', e);
        }
        return null;
    },

    clear(formId) {
        try {
            const key = this.PREFIX + formId;
            Storage.remove(key);
        } catch (e) {
            console.warn('表单缓存清除失败:', e);
        }
    },

    collectFormData(form) {
        const formData = new FormData(form);
        const data = {};

        form.querySelectorAll('input, select, textarea').forEach(el => {
            const name = el.name;
            if (!name) return;

            if (el.type === 'checkbox') {
                if (!data[name]) {
                    data[name] = formData.getAll(name);
                }
            } else {
                data[name] = formData.get(name);
            }
        });

        return data;
    },

    restoreFormData(form, data) {
        if (!data) return;

        Object.keys(data).forEach(name => {
            const value = data[name];
            const elements = form.querySelectorAll(`[name="${name}"]`);

            elements.forEach(el => {
                if (el.type === 'checkbox') {
                    if (Array.isArray(value)) {
                        el.checked = value.includes(el.value);
                    } else {
                        el.checked = value === el.value || value === 'on';
                    }
                    const item = el.closest('.checkbox-item');
                    if (item) {
                        item.classList.toggle('active', el.checked);
                    }
                } else if (el.type === 'radio') {
                    el.checked = value === el.value;
                } else if (el.tagName === 'SELECT' || el.type !== 'file') {
                    if (value !== undefined && value !== null) {
                        el.value = value;
                    }
                }
            });
        });
    },

    bindAutoSave(formId, form) {
        const saveHandler = () => {
            const data = this.collectFormData(form);
            this.save(formId, data);
        };

        form.addEventListener('input', saveHandler);
        form.addEventListener('change', saveHandler);
        form.addEventListener('click', (e) => {
            if (e.target.closest('.checkbox-item')) {
                setTimeout(saveHandler, 10);
            }
        });

        return () => {
            form.removeEventListener('input', saveHandler);
            form.removeEventListener('change', saveHandler);
        };
    },

    setup(formId, form, initialData = null, autoSave = true) {
        let cachedData = this.load(formId);
        const data = cachedData || initialData;

        if (data) {
            this.restoreFormData(form, data);
        }

        let unbind = null;
        if (autoSave) {
            unbind = this.bindAutoSave(formId, form);
        }

        return {
            hasCached: !!cachedData,
            clear: () => this.clear(formId),
            save: (customData) => {
                const d = customData || this.collectFormData(form);
                this.save(formId, d);
            },
            unbind: () => {
                if (unbind) unbind();
            }
        };
    }
};

const ApiService = {
    async request(url, options = {}) {
        const token = Storage.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.data && config.method !== 'GET') {
            config.body = JSON.stringify(options.data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, config);
            const result = await response.json();

            if (response.status === 401 || (result.code === 1 && result.message && result.message.includes('token'))) {
                Storage.removeToken();
                Storage.removeUser();
                if (window.Router) {
                    window.Router.navigate('login');
                }
                Toast.error('登录已过期，请重新登录');
                throw new Error('登录已过期');
            }

            return result;
        } catch (error) {
            console.error('API请求错误:', error);
            if (!error.message.includes('登录已过期')) {
                Toast.error('网络请求失败');
            }
            throw error;
        }
    },

    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    async post(url, data = {}, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'POST', data });
    },

    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    async delete(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'DELETE' });
    }
};
