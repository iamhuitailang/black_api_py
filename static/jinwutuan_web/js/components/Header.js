const HeaderComponent = {
    template: `
        <header class="header">
            <div class="logo" @click="$emit('navigate', 'home')">
                劲乐团
            </div>
            <nav class="nav-links">
                <span class="nav-link" :class="{ active: currentRoute === 'home' }" @click="$emit('navigate', 'home')">
                    🎵 歌曲
                </span>
                <span class="nav-link" :class="{ active: currentRoute === 'leaderboard' }" @click="$emit('navigate', 'leaderboard')">
                    🏆 排行榜
                </span>
                <span class="nav-link" :class="{ active: currentRoute === 'achievements' }" @click="$emit('navigate', 'achievements')">
                    🏅 成就
                </span>
                <span class="nav-link" :class="{ active: currentRoute === 'profile' }" @click="$emit('navigate', 'profile')">
                    👤 个人中心
                </span>
                <span v-if="isAdmin" class="nav-link" :class="{ active: currentRoute === 'admin' }" @click="$emit('navigate', 'admin')">
                    ⚙️ 管理
                </span>
            </nav>
            <div class="user-info">
                <div class="user-details">
                    <div class="user-nickname">{{ user.nickname || user.username }}</div>
                    <div class="user-level">Lv.{{ user.level || 1 }}</div>
                </div>
                <div class="user-avatar">
                    {{ (user.nickname || user.username || 'U').charAt(0).toUpperCase() }}
                </div>
                <button class="btn btn-secondary btn-small" @click="$emit('logout')">
                    退出
                </button>
            </div>
        </header>
    `,
    props: {
        user: {
            type: Object,
            required: true
        },
        isAdmin: {
            type: Boolean,
            default: false
        }
    },
    emits: ['navigate', 'logout'],
    setup(props) {
        const { ref, onMounted, onUnmounted } = Vue;
        
        const currentRoute = ref(Router.getCurrentRoute());
        
        const handleHashChange = () => {
            currentRoute.value = Router.getCurrentRoute();
        };
        
        onMounted(() => {
            window.addEventListener('hashchange', handleHashChange);
        });
        
        onUnmounted(() => {
            window.removeEventListener('hashchange', handleHashChange);
        });
        
        return {
            currentRoute
        };
    }
};
