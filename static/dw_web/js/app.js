const { createApp, ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

const DwUI = reactive({
    toast: { show: false, message: '', type: 'info' },
    modal: { show: false, title: '', body: '', onConfirm: null },
    _toastTimer: null,
    showToast(message, type = 'info') {
        this.toast.show = true;
        this.toast.message = message;
        this.toast.type = type;
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => { this.toast.show = false; }, 2500);
    },
    showModal(title, body, onConfirm) {
        this.modal.show = true;
        this.modal.title = title;
        this.modal.body = body;
        this.modal.onConfirm = onConfirm || null;
    },
    closeModal() {
        this.modal.show = false;
        this.modal.title = '';
        this.modal.body = '';
        this.modal.onConfirm = null;
    }
});

window.DwUI = DwUI;

const dwApp = createApp({
    setup() {
        const isLoggedIn = ref(DwAuth.isLoggedIn());
        const currentUser = ref(DwAuth.getUser());
        const zooCoins = ref(0);
        const showUserMenu = ref(false);
        const currentComponent = ref(null);
        const currentProps = ref({});
        const currentTab = ref('dashboard');
        let visitorTimer = null;
        let breedTimer = null;
        let diseaseTimer = null;
        let dashboardTimer = null;

        const userEmoji = computed(() => {
            if (!currentUser.value) return '👤';
            return '😊';
        });

        const tabMap = {
            dashboard: 'dashboard',
            animals: 'animals',
            'animal-shop': 'animals',
            'animal-detail': 'animals',
            habitats: 'habitats',
            'habitat-detail': 'habitats',
            visitors: 'visitors',
            breeding: 'breeding',
            disease: 'disease',
            rare: 'rare'
        };

        function navigate(route) {
            DwRouter.navigate(route);
        }

        function handleRouteChange(route, params) {
            showUserMenu.value = false;
            currentTab.value = tabMap[route] || route;

            const routeComponentMap = {
                login: LoginPage,
                register: RegisterPage,
                dashboard: DashboardPage,
                animals: AnimalListPage,
                'animal-shop': AnimalShopPage,
                'animal-detail': AnimalDetailPage,
                habitats: HabitatListPage,
                'habitat-detail': HabitatDetailPage,
                visitors: VisitorPage,
                breeding: BreedingPage,
                disease: DiseasePage,
                rare: RareCollectionPage
            };

            const component = routeComponentMap[route];
            if (component) {
                currentComponent.value = component;
                currentProps.value = { ...params };
            } else {
                if (isLoggedIn.value) {
                    DwRouter.navigate('dashboard');
                } else {
                    DwRouter.navigate('login');
                }
            }
        }

        function logout() {
            showUserMenu.value = false;
            DwAuth.logout();
            isLoggedIn.value = false;
            currentUser.value = null;
            clearTimers();
            DwRouter.navigate('login');
        }

        function formatNumber(n) {
            return DwUtils.formatNumber(n);
        }

        async function refreshZooInfo() {
            try {
                const result = await DwApi.zoo.getInfo();
                if (result.code === 0 && result.data) {
                    zooCoins.value = result.data.coins || 0;
                }
            } catch (e) { /* ignore */ }
        }

        function startTimers() {
            clearTimers();
            visitorTimer = setInterval(async () => {
                try { await DwApi.visitor.generate(); } catch (e) { /* ignore */ }
            }, 30000);

            breedTimer = setInterval(async () => {
                try { await DwApi.breed.check(); } catch (e) { /* ignore */ }
            }, 15000);

            diseaseTimer = setInterval(async () => {
                try { await DwApi.disease.randomCheck(); } catch (e) { /* ignore */ }
            }, 60000);

            dashboardTimer = setInterval(() => {
                refreshZooInfo();
            }, 30000);
        }

        function clearTimers() {
            if (visitorTimer) clearInterval(visitorTimer);
            if (breedTimer) clearInterval(breedTimer);
            if (diseaseTimer) clearInterval(diseaseTimer);
            if (dashboardTimer) clearInterval(dashboardTimer);
        }

        DwAuth.onAuthChange((loggedIn) => {
            isLoggedIn.value = loggedIn;
            currentUser.value = DwAuth.getUser();
            if (loggedIn) {
                startTimers();
                refreshZooInfo();
            } else {
                clearTimers();
            }
        });

        onMounted(() => {
            DwRouter.init(handleRouteChange);
            if (isLoggedIn.value) {
                startTimers();
                refreshZooInfo();
            }
        });

        onUnmounted(() => {
            clearTimers();
        });

        return {
            isLoggedIn,
            currentUser,
            zooCoins,
            showUserMenu,
            currentComponent,
            currentProps,
            currentTab,
            toast: computed(() => DwUI.toast),
            modal: computed(() => DwUI.modal),
            userEmoji,
            closeModal: () => DwUI.closeModal(),
            navigate,
            logout,
            formatNumber
        };
    }
});

window.dwApp = dwApp;
dwApp.mount('#app');
