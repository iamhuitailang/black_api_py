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

var Utils = {
    showToast: function(msg, type) {
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'toast-simple toast-' + type;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 2500);
    },

    formatDate: function(str) {
        if (!str) return '';
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return str;
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    },

    formatDateTime: function(str) {
        if (!str) return '';
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return str;
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        var wd = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
        return (d.getFullYear()) + '-' + m + '-' + day + ' ' + wd + ' ' + hh + ':' + mm;
    },

    getMonth: function(str) {
        if (!str) return '';
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return '';
        var m = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        return m[d.getMonth()];
    },

    getDay: function(str) {
        if (!str) return '';
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return '';
        return String(d.getDate());
    },

    getWeekday: function(str) {
        if (!str) return '';
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return '';
        return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    },

    isUpcoming: function(str) {
        if (!str) return false;
        var d = new Date(str.replace(' ', 'T'));
        if (isNaN(d.getTime())) return false;
        var diff = d.getTime() - Date.now();
        return diff > 0 && diff < 7 * 24 * 3600 * 1000;
    }
};

window.Utils = Utils;
window.formatDate = Utils.formatDate;
window.formatDateTime = Utils.formatDateTime;
window.formatMonth = Utils.getMonth;
window.formatDay = Utils.getDay;
window.formatWeekday = Utils.getWeekday;
window.isUpcoming = Utils.isUpcoming;
