const GameHeader = {
    name: 'GameHeader',
    template: `
        <header class="game-header" v-if="user">
            <div class="header-left">
                <span class="header-title" @click="goHome">⏳ 时间之塔</span>
            </div>
            <div class="header-center" v-if="character">
                <span class="char-info">{{ character.name }} · Lv.{{ character.level }}</span>
                <span class="floor-info">第{{ character.current_floor }}层</span>
            </div>
            <div class="header-right">
                <span class="user-name">{{ user.nickname || user.username }}</span>
                <button class="btn btn-sm btn-ghost" @click="handleLogout">退出</button>
            </div>
        </header>
    `,
    setup() {
        const user = Vue.computed(() => SjStore.user)
        const character = Vue.computed(() => SjStore.character)

        const goHome = () => SjRouter.navigate('home')
        const handleLogout = async () => {
            await SjAuth.logout()
            SjStore.clearAll()
            SjRouter.navigate('login')
        }

        return { user, character, goHome, handleLogout }
    }
}
