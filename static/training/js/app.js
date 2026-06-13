const pageComponents = {
    'login': LoginPage,
    'hr-courses': HrCoursesPage,
    'hr-leaves': HrLeavesPage,
    'hr-quiz': HrQuizPage,
    'hr-statistics': HrStatisticsPage,
    'emp-courses': EmpCoursesPage,
    'emp-checkin': EmpCheckinPage,
    'emp-quiz': EmpQuizPage,
    'profile': ProfilePage
};

const RootApp = {
    components: { LayoutWrapper },
    setup() {
        const currentUser = VueApi.computed(() => GlobalStore.currentUser);
        const currentPage = VueApi.computed(() => GlobalStore.currentPage);

        const currentComponent = VueApi.computed(() => {
            const page = currentPage.value;
            if (page === 'login' || !currentUser.value) {
                return LoginPage;
            }
            return pageComponents[page] || LoginPage;
        });

        const needsLayout = VueApi.computed(() => {
            return currentPage.value !== 'login' && currentUser.value;
        });

        return {
            currentUser,
            currentPage,
            currentComponent,
            needsLayout
        };
    },
    template: `
        <LayoutWrapper v-if="needsLayout">
            <component :is="currentComponent" />
        </LayoutWrapper>
        <component v-else :is="currentComponent" />
    `
};

VueApi.watch(
    () => GlobalStore.currentPage,
    (newPage) => {
        if (newPage !== 'login' && !GlobalStore.currentUser) {
            GlobalStore.currentPage = 'login';
        }
    },
    { immediate: true }
);

const app = VueApi.createApp(RootApp);
app.component('LayoutWrapper', LayoutWrapper);
app.mount('#app');
