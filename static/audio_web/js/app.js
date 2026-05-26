const { createApp, computed, onMounted, ref } = Vue;

const App = {
    template: `
        <div class="app-container">
            <div class="app-header">
                <h1 @click="goHome" style="cursor: pointer;">🎵 在线音乐播放器</h1>
                <div class="search-box">
                    <el-input
                        v-model="searchInput"
                        placeholder="搜索歌曲、歌手、专辑..."
                        clearable
                        @keyup.enter="handleSearch"
                        size="default"
                    >
                        <template #prefix>🔍</template>
                        <template #append>
                            <el-button @click="handleSearch">搜索</el-button>
                        </template>
                    </el-input>
                </div>
                <div class="nav-menu">
                    <el-button @click="goHome" :type="currentRoute === 'home' ? 'primary' : ''">音乐库</el-button>
                    <el-button @click="goSearch" :type="currentRoute === 'search' ? 'primary' : ''">搜索</el-button>
                    <el-button @click="goPlaylists" :type="isPlaylistRoute ? 'primary' : ''">歌单</el-button>
                    <el-button @click="goProfile" :type="currentRoute === 'profile' ? 'primary' : ''">个人中心</el-button>
                </div>
            </div>

            <div class="main-content">
                <home-page v-if="currentRoute === 'home'"></home-page>
                <search-page v-if="currentRoute === 'search'"></search-page>
                <playlist-manager-page v-if="currentRoute === 'playlists'"></playlist-manager-page>
                <playlist-page v-if="currentRoute === 'playlist'"></playlist-page>
                <profile-page v-if="currentRoute === 'profile'"></profile-page>
            </div>

            <player-component></player-component>
        </div>
    `,
    components: {
        'home-page': HomePage,
        'search-page': SearchPage,
        'playlist-manager-page': PlaylistManagerPage,
        'playlist-page': PlaylistPage,
        'profile-page': ProfilePage,
        'player-component': PlayerComponent
    },
    setup() {
        const s = AudioStore.state;
        const searchInput = ref('');

        const currentRoute = computed(() => s.currentRoute);
        const isPlaylistRoute = computed(() => 
            s.currentRoute === 'playlists' || s.currentRoute === 'playlist'
        );

        function goHome() { 
            AudioStore.setRoute('home'); 
        }
        function goSearch() { 
            AudioStore.setRoute('search'); 
        }
        function goPlaylists() { 
            AudioStore.setRoute('playlists'); 
        }
        function goProfile() { 
            AudioStore.setRoute('profile'); 
        }
        function handleSearch() {
            if (searchInput.value.trim()) {
                AudioStore.setSearchKeyword(searchInput.value.trim());
                AudioStore.setRoute('search');
            }
        }

        onMounted(() => {
            AudioStore.loadFavoriteIds();
        });

        return {
            searchInput,
            currentRoute,
            isPlaylistRoute,
            goHome,
            goSearch,
            goPlaylists,
            goProfile,
            handleSearch
        };
    }
};

try {
    const app = createApp(App);
    app.use(ElementPlus);

    if (typeof ElementPlusIconsVue !== 'undefined') {
        for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, comp);
        }
    }

    app.mount('#app');
    console.log('App mounted successfully');
} catch (e) {
    console.error('App mount failed:', e);
    document.body.innerHTML = '<div style="padding: 20px; color: red; font-size: 16px;">' +
        '<h2>应用加载失败</h2>' +
        '<p>错误信息: ' + e.message + '</p>' +
        '<p>请刷新页面重试，或检查控制台获取详细信息</p>' +
        '</div>';
}
