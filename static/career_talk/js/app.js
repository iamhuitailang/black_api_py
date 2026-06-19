(function() {
    const createApp = Vue.createApp;
    const ref = Vue.ref;
    const computed = Vue.computed;
    const watch = Vue.watch;
    const onMounted = Vue.onMounted;

    const App = {
        components: {
            TalkList,
            TalkDetail,
            CheckinPage,
            FeedbackPage,
            AdminPage
        },
        setup() {
            const currentPage = ref('list');
            const selectedTalkId = ref(null);
            const pageHistory = ref([]);

            const navTabs = [
                { path: 'list', name: '宣讲会列表' },
                { path: 'checkin', name: '签到' },
                { path: 'feedback', name: '反馈' },
                { path: 'admin', name: '管理后台' }
            ];

            const navigateTo = (path) => {
                if (path !== currentPage.value) {
                    pageHistory.value.push(currentPage.value);
                }
                currentPage.value = path;
                selectedTalkId.value = null;
                window.location.hash = path;
            };

            const viewDetail = (id) => {
                pageHistory.value.push(currentPage.value);
                selectedTalkId.value = id;
                currentPage.value = 'detail';
            };

            const goBack = () => {
                if (pageHistory.value.length > 0) {
                    const prevPage = pageHistory.value.pop();
                    currentPage.value = prevPage;
                    selectedTalkId.value = null;
                } else {
                    currentPage.value = 'list';
                }
            };

            const initFromHash = () => {
                const hash = window.location.hash.slice(1);
                if (hash && ['list', 'checkin', 'feedback', 'admin'].includes(hash)) {
                    currentPage.value = hash;
                }
            };

            onMounted(() => {
                initFromHash();
                window.addEventListener('hashchange', initFromHash);
            });

            return {
                currentPage,
                selectedTalkId,
                navTabs,
                navigateTo,
                viewDetail,
                goBack
            };
        },
        template: `
            <header class="header">
                <div class="container">
                    <h1>🎓 校园宣讲会管理系统</h1>
                    <nav class="nav-tabs">
                        <div 
                            v-for="tab in navTabs" 
                            :key="tab.path"
                            class="nav-tab" 
                            :class="{ active: currentPage === tab.path }"
                            @click="navigateTo(tab.path)"
                        >
                            {{ tab.name }}
                        </div>
                    </nav>
                </div>
            </header>

            <main class="container">
                <talk-list v-if="currentPage === 'list'" @view-detail="viewDetail"></talk-list>
                <talk-detail 
                    v-else-if="currentPage === 'detail'" 
                    :talk-id="selectedTalkId" 
                    @back="goBack"
                ></talk-detail>
                <checkin-page v-else-if="currentPage === 'checkin'"></checkin-page>
                <feedback-page 
                    v-else-if="currentPage === 'feedback'" 
                    :talk-id="selectedTalkId"
                    @back="goBack"
                ></feedback-page>
                <admin-page v-else-if="currentPage === 'admin'"></admin-page>
            </main>

            <div id="toastContainer" class="toast-container"></div>
        `
    };

    const app = createApp(App);
    app.mount('#app');
})();
