var pageComponents = {
    'login': window.LoginPage,
    'hr-courses': window.HrCoursesPage,
    'hr-leaves': window.HrLeavesPage,
    'hr-quiz': window.HrQuizPage,
    'hr-statistics': window.HrStatisticsPage,
    'emp-courses': window.EmpCoursesPage,
    'emp-checkin': window.EmpCheckInPage,
    'emp-quiz': window.EmpQuizPage,
    'profile': window.ProfilePage
};

function normalizeRoute(route) {
    if (!route || route === 'login' || route === 'logout') return 'login';
    var validHR = ['hr-courses', 'hr-leaves', 'hr-quiz', 'hr-statistics'];
    var validEmp = ['emp-courses', 'emp-checkin', 'emp-quiz', 'profile'];
    var user = GlobalStore.currentUser;
    if (!user) return 'login';
    var isHR = user.role === 'hr' || user.role === 'admin';
    if (isHR) {
        if (validHR.indexOf(route) === -1) return 'hr-courses';
        return route;
    } else {
        if (validEmp.indexOf(route) === -1) return 'emp-courses';
        return route;
    }
}

var RootApp = {
    setup: function() {
        var currentComponent = VueApi.computed(function() {
            var normalized = normalizeRoute(GlobalStore.currentRoute);
            if (normalized !== GlobalStore.currentRoute) {
                GlobalStore.setRoute(normalized);
            }
            return pageComponents[normalized] || pageComponents['login'];
        });

        VueApi.watch(function() { return GlobalStore.currentUser; }, function(user, oldVal) {
            var route = GlobalStore.currentRoute;
            var normalized = normalizeRoute(route);
            if (normalized !== route) {
                GlobalStore.setRoute(normalized);
            }
            if (user && !oldVal) {
                setTimeout(loadNotifications, 300);
            }
        }, { immediate: true });

        VueApi.onMounted(function() {
            if (GlobalStore.currentUser) {
                setTimeout(loadNotifications, 500);
            }
        });

        return {
            currentRoute: VueApi.computed(function() { return GlobalStore.currentRoute; }),
            currentComponent: currentComponent,
            GlobalStore: GlobalStore
        };
    },
    template: '<div id="app-root">\n        <component :is="currentComponent" :key="currentRoute" />\n    </div>'
};

function startApp() {
    try {
        var app = VueApi.createApp(RootApp);
        Object.keys(window.LayoutWrapper ? {} : {});
        app.component('LayoutWrapper', window.LayoutWrapper);
        app.component('StatusBadge', window.StatusBadge);
        app.component('EmptyState', window.EmptyState);
        app.component('LoadingSpinner', window.LoadingSpinner);
        app.component('ModalWrap', window.ModalWrap);
        app.component('ConfirmDialog', window.ConfirmDialog);
        app.mount('#app');
    } catch (e) {
        console.error('Failed to start app:', e);
        alert('系统启动失败，请刷新页面：' + e.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
