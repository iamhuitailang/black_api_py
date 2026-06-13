if (!window.VueApi) {
    window.VueApi = {
        createApp: Vue.createApp,
        ref: Vue.ref,
        reactive: Vue.reactive,
        computed: Vue.computed,
        watch: Vue.watch,
        onMounted: Vue.onMounted,
        defineComponent: Vue.defineComponent,
        h: Vue.h,
        provide: Vue.provide,
        inject: Vue.inject
    };
}
var VueApi = window.VueApi;

const Utils = {
    formatDate(datetimeStr) {
        if (!datetimeStr) return '-';
        try {
            const dt = new Date(datetimeStr);
            return dt.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return datetimeStr;
        }
    },

    formatDateOnly(datetimeStr) {
        if (!datetimeStr) return '-';
        try {
            const dt = new Date(datetimeStr);
            return dt.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) {
            return datetimeStr;
        }
    },

    getDay(datetimeStr) {
        if (!datetimeStr) return '?';
        try {
            const dt = new Date(datetimeStr);
            return dt.getDate();
        } catch (e) {
            return '?';
        }
    },

    getMonth(datetimeStr) {
        if (!datetimeStr) return '?';
        try {
            const dt = new Date(datetimeStr);
            const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            return months[dt.getMonth()];
        } catch (e) {
            return '?';
        }
    },

    getStatusText(status) {
        const map = {
            'pending': '待确认',
            'confirmed': '已确认',
            'checked_in': '已签到',
            'completed': '已完成',
            'leave': '请假中'
        };
        return map[status] || status;
    },

    getStatusClass(status) {
        return 'status-' + status;
    },

    getLeaveStatusText(status) {
        const map = {
            'pending': '待审批',
            'approved': '已批准',
            'rejected': '已拒绝'
        };
        return map[status] || status;
    },

    getCurrentUser() {
        try {
            const user = localStorage.getItem('training_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        localStorage.setItem('training_user', JSON.stringify(user));
    },

    clearCurrentUser() {
        localStorage.removeItem('training_user');
    },

    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container') || (() => {
            const el = document.createElement('div');
            el.className = 'toast-container';
            document.body.appendChild(el);
            return el;
        })();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

window.Utils = Utils;
