var _v = VueApi;
var ref = _v.ref, reactive = _v.reactive, computed = _v.computed, onMounted = _v.onMounted, watch = _v.watch, provide = _v.provide, inject = _v.inject, defineComponent = _v.defineComponent;

var STORAGE_KEYS = {
    USER: 'training_current_user',
    ROUTE: 'training_current_route',
    NOTIFIED: 'training_notified_courses'
};

var GlobalStore = reactive({
    currentUser: (function() {
        try {
            var s = localStorage.getItem(STORAGE_KEYS.USER);
            return s ? JSON.parse(s) : null;
        } catch(e) { return null; }
    })(),
    currentRoute: (function() {
        try {
            var s = localStorage.getItem(STORAGE_KEYS.ROUTE);
            return s || 'login';
        } catch(e) { return 'login'; }
    })(),
    notificationCount: 0,
    toasts: [],
    addToast: function(type, title, message) {
        var id = Date.now() + Math.random();
        this.toasts.push({ id: id, type: type, title: title, message: message });
        var self = this;
        setTimeout(function() {
            var idx = self.toasts.findIndex(function(t) { return t.id === id; });
            if (idx > -1) self.toasts.splice(idx, 1);
        }, 4500);
    },
    removeToast: function(id) {
        var idx = this.toasts.findIndex(function(t) { return t.id === id; });
        if (idx > -1) this.toasts.splice(idx, 1);
    },
    setUser: function(user) {
        this.currentUser = user;
        if (user) {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.USER);
        }
    },
    setRoute: function(route) {
        this.currentRoute = route;
        localStorage.setItem(STORAGE_KEYS.ROUTE, route);
    },
    logout: function() {
        this.setUser(null);
        this.setRoute('login');
        this.notificationCount = 0;
    },
    role: computed(function() {
        return GlobalStore.currentUser ? GlobalStore.currentUser.role || 'employee' : '';
    }),
    isHR: computed(function() {
        return GlobalStore.role === 'hr' || GlobalStore.role === 'admin';
    }),
    isEmployee: computed(function() {
        return GlobalStore.role === 'employee';
    })
});

watch(function() { return GlobalStore.currentRoute; }, function(newVal) {
    localStorage.setItem(STORAGE_KEYS.ROUTE, newVal);
});

watch(function() { return GlobalStore.currentUser; }, function(newVal) {
    if (newVal) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newVal));
    } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
    }
}, { deep: true });

function requireAuth() {
    if (!GlobalStore.currentUser) {
        GlobalStore.setRoute('login');
        return false;
    }
    return true;
}

function requireRole(role) {
    if (!requireAuth()) return false;
    if (role === 'hr' && !GlobalStore.isHR) {
        GlobalStore.addToast('error', '权限不足', '该模块需要HR权限');
        GlobalStore.setRoute(GlobalStore.isEmployee ? 'emp-courses' : 'login');
        return false;
    }
    if (role === 'employee' && !GlobalStore.isEmployee) {
        GlobalStore.addToast('error', '权限不足', '该模块需要员工权限');
        GlobalStore.setRoute(GlobalStore.isHR ? 'hr-courses' : 'login');
        return false;
    }
    return true;
}

async function loadNotifications() {
    if (!GlobalStore.currentUser || !GlobalStore.isEmployee) {
        GlobalStore.notificationCount = 0;
        return;
    }
    try {
        var res = await Api.getEmployeeCourses(GlobalStore.currentUser.id);
        if (res.code === 0) {
            var pendingList = (res.data || []).filter(function(e) {
                return e.status === 'pending' || e.status === 'notified';
            });
            var oldNotified = {};
            try {
                oldNotified = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFIED) || '{}');
            } catch(e) {}
            var newCourses = [];
            pendingList.forEach(function(e) {
                var key = 'c_' + e.course_id;
                if (!oldNotified[key]) {
                    newCourses.push(e);
                    oldNotified[key] = Date.now();
                }
            });
            localStorage.setItem(STORAGE_KEYS.NOTIFIED, JSON.stringify(oldNotified));
            GlobalStore.notificationCount = pendingList.length;
            if (newCourses.length > 0) {
                var names = newCourses.slice(0, 2).map(function(e) { return '《' + e.title + '》'; }).join('、');
                var extra = newCourses.length > 2 ? '等' + newCourses.length + '门课程' : '';
                setTimeout(function() {
                    GlobalStore.addToast('info', '📢 新的培训通知', '您有新培训待参加：' + names + extra);
                }, 800);
            }
        }
    } catch(e) {}
}

var LayoutWrapper = defineComponent({
    name: 'LayoutWrapper',
    props: ['title', 'activeMenu', 'role'],
    setup: function(props) {
        var menus = computed(function() {
            if (props.role === 'hr') {
                return [
                    { key: 'hr-courses', name: '课程管理', icon: '📅' },
                    { key: 'hr-leaves', name: '请假审批', icon: '📝' },
                    { key: 'hr-quiz', name: '测评管理', icon: '📋' },
                    { key: 'hr-statistics', name: '统计报表', icon: '📊' }
                ];
            }
            return [
                { key: 'emp-courses', name: '我的培训', icon: '📚', badge: GlobalStore.notificationCount },
                { key: 'emp-checkin', name: '培训签到', icon: '✅' },
                { key: 'emp-quiz', name: '课程测评', icon: '📝' },
                { key: 'profile', name: '培训档案', icon: '📁' }
            ];
        });

        function goMenu(key) {
            if (props.role === 'hr') requireRole('hr');
            else requireRole('employee');
            GlobalStore.setRoute(key);
        }

        function doLogout() {
            if (confirm('确定要退出登录吗？')) {
                GlobalStore.logout();
            }
        }

        function goBack() {
            window.history.back();
        }

        return {
            menus: menus,
            currentUser: GlobalStore.currentUser,
            notificationCount: GlobalStore.notificationCount,
            toasts: GlobalStore.toasts,
            goMenu: goMenu,
            doLogout: doLogout,
            goBack: goBack,
            removeToast: GlobalStore.removeToast.bind(GlobalStore)
        };
    },
    template: '<div class="layout">\n        <header class="layout-header">\n            <div class="header-left">\n                <div class="logo">\n                    <span class="logo-icon">🎓</span>\n                    <span class="logo-text">企业培训管理系统</span>\n                </div>\n            </div>\n            <div class="header-right">\n                <div v-if="currentUser && role === \'employee\' && notificationCount > 0" class="notification-bell" @click="goMenu(\'emp-courses\')">\n                    <span>🔔</span>\n                    <span class="badge-dot">{{ notificationCount > 99 ? \'99+\' : notificationCount }}</span>\n                </div>\n                <div v-if="currentUser" class="user-info">\n                    <span class="user-avatar">{{ currentUser.name ? currentUser.name.charAt(0) : \'?\' }}</span>\n                    <span class="user-name">{{ currentUser.name }}</span>\n                    <span class="user-dept">{{ currentUser.department }}</span>\n                    <span class="user-role" :class="currentUser.role">{{ currentUser.role === \'hr\' ? \'HR管理员\' : \'员工\' }}</span>\n                    <button class="logout-btn" @click="doLogout">退出</button>\n                </div>\n            </div>\n        </header>\n        <div class="layout-body">\n            <aside v-if="currentUser" class="layout-sidebar">\n                <div class="menu-list">\n                    <div v-for="m in menus" :key="m.key"\n                         class="menu-item"\n                         :class="{ active: activeMenu === m.key }"\n                         @click="goMenu(m.key)">\n                        <span class="menu-icon">{{ m.icon }}</span>\n                        <span class="menu-name">{{ m.name }}</span>\n                        <span v-if="m.badge && m.badge > 0" class="menu-badge">{{ m.badge > 99 ? \'99+\' : m.badge }}</span>\n                    </div>\n                </div>\n            </aside>\n            <main class="layout-main">\n                <div class="page-header">\n                    <h2 class="page-title">\n                        <span v-if="title" class="title-text">{{ title }}</span>\n                    </h2>\n                </div>\n                <div class="page-content">\n                    <slot></slot>\n                </div>\n            </main>\n        </div>\n        <div class="toast-container">\n            <transition-group name="toast">\n                <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type" @click="removeToast(t.id)">\n                    <div class="toast-icon">\n                        <span v-if="t.type === \'success\'">✅</span>\n                        <span v-else-if="t.type === \'error\'">❌</span>\n                        <span v-else-if="t.type === \'warning\'">⚠️</span>\n                        <span v-else>ℹ️</span>\n                    </div>\n                    <div class="toast-content">\n                        <div class="toast-title">{{ t.title }}</div>\n                        <div v-if="t.message" class="toast-message">{{ t.message }}</div>\n                    </div>\n                    <div class="toast-close">×</div>\n                </div>\n            </transition-group>\n        </div>\n    </div>'
});

var StatusBadge = defineComponent({
    name: 'StatusBadge',
    props: ['status'],
    setup: function(props) {
        var config = computed(function() {
            var s = props.status || '';
            var map = {
                'pending': { text: '待确认', class: 'status-pending', icon: '⏳' },
                'notified': { text: '待参加', class: 'status-notified', icon: '📢' },
                'confirmed': { text: '已确认', class: 'status-confirmed', icon: '✓' },
                'checked_in': { text: '已签到', class: 'status-checkedin', icon: '✅' },
                'completed': { text: '已完成', class: 'status-completed', icon: '🏆' },
                'leave_pending': { text: '请假待批', class: 'status-leavepending', icon: '📝' },
                'leave_approved': { text: '请假批准', class: 'status-leaveok', icon: '✔️' },
                'leave_rejected': { text: '请假驳回', class: 'status-leaveno', icon: '❌' },
                'active': { text: '进行中', class: 'status-active', icon: '🟢' },
                'finished': { text: '已结束', class: 'status-finished', icon: '⚫' },
                'cancelled': { text: '已取消', class: 'status-cancelled', icon: '🚫' }
            };
            return map[s] || { text: s || '-', class: 'status-default', icon: '' };
        });
        return { config: config };
    },
    template: '<span class="status-badge" :class="config.class">\n        <span v-if="config.icon" class="status-icon">{{ config.icon }}</span>\n        {{ config.text }}\n    </span>'
});

var EmptyState = defineComponent({
    name: 'EmptyState',
    props: ['text', 'icon'],
    setup: function(props) {
        return {
            icon: computed(function() { return props.icon || '📭'; }),
            text: computed(function() { return props.text || '暂无数据'; })
        };
    },
    template: '<div class="empty-state">\n        <div class="empty-icon">{{ icon }}</div>\n        <div class="empty-text">{{ text }}</div>\n    </div>'
});

var LoadingSpinner = defineComponent({
    name: 'LoadingSpinner',
    props: ['text'],
    template: '<div class="loading-spinner">\n        <div class="spinner-ring"></div>\n        <div v-if="text" class="spinner-text">{{ text }}</div>\n    </div>'
});

var ModalWrap = defineComponent({
    name: 'ModalWrap',
    props: ['show', 'title', 'width', 'footer'],
    emits: ['close'],
    setup: function(props, ctx) {
        function close() { ctx.emit('close'); }
        return { close: close };
    },
    template: '<teleport to="body">\n        <transition name="modal">\n            <div v-if="show" class="modal-overlay" @click.self="close">\n                <div class="modal-dialog" :style="width ? {maxWidth: width + \'px\'} : {}">\n                    <div class="modal-header">\n                        <span class="modal-title">{{ title || \'提示\' }}</span>\n                        <span class="modal-close" @click="close">×</span>\n                    </div>\n                    <div class="modal-body"><slot></slot></div>\n                    <div v-if="$slots.footer" class="modal-footer"><slot name="footer"></slot></div>\n                </div>\n            </div>\n        </transition>\n    </teleport>'
});

var ConfirmDialog = defineComponent({
    name: 'ConfirmDialog',
    props: ['show', 'title', 'message', 'okText', 'cancelText', 'type'],
    emits: ['ok', 'cancel'],
    setup: function(props, ctx) {
        function ok() { ctx.emit('ok'); }
        function cancel() { ctx.emit('cancel'); }
        return {
            ok: ok, cancel: cancel,
            okText: computed(function() { return props.okText || '确定'; }),
            cancelText: computed(function() { return props.cancelText || '取消'; })
        };
    },
    template: '<ModalWrap :show="show" :title="title" width="420" @close="cancel">\n        <div class="confirm-content">\n            <div class="confirm-icon" :class="type || \'warning\'">\n                <span v-if="type === \'error\'">❌</span>\n                <span v-else-if="type === \'success\'">✅</span>\n                <span v-else>⚠️</span>\n            </div>\n            <div class="confirm-msg">{{ message }}</div>\n        </div>\n        <template #footer>\n            <button class="btn btn-default" @click="cancel">{{ cancelText }}</button>\n            <button class="btn" :class="type === \'error\' ? \'btn-danger\' : \'btn-primary\'" @click="ok">{{ okText }}</button>\n        </template>\n    </ModalWrap>'
});

window.GlobalStore = GlobalStore;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
window.loadNotifications = loadNotifications;
window.STORAGE_KEYS = STORAGE_KEYS;

window.LayoutWrapper = LayoutWrapper;
window.StatusBadge = StatusBadge;
window.EmptyState = EmptyState;
window.LoadingSpinner = LoadingSpinner;
window.ModalWrap = ModalWrap;
window.ConfirmDialog = ConfirmDialog;
