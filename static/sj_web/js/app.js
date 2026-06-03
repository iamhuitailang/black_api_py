const { createApp, ref, computed, reactive, onMounted, watch, nextTick, h } = Vue

const App = {
    components: {
        Toast,
        GameHeader,
        LoginPage,
        RegisterPage,
        HomePage,
        CharacterCreatePage,
        CharacterSelectPage,
        TowerPage,
        BattlePage,
        EventPage,
        InventoryPage,
        TimeAbilityPage,
        SaveLoadPage,
        EndingPage,
        StatBar
    },
    setup() {
        const currentPage = ref(null)
        const showHeader = computed(() => {
            const route = SjRouter.getCurrentRoute()
            return !['login', 'register'].includes(route)
        })

        const pageMap = {
            login: LoginPage,
            register: RegisterPage,
            home: HomePage,
            characterCreate: CharacterCreatePage,
            characterSelect: CharacterSelectPage,
            tower: TowerPage,
            battle: BattlePage,
            event: EventPage,
            inventory: InventoryPage,
            timeAbility: TimeAbilityPage,
            saveLoad: SaveLoadPage,
            ending: EndingPage
        }

        const navigateTo = (route) => {
            const page = pageMap[route]
            if (page) {
                currentPage.value = page
            } else {
                currentPage.value = LoginPage
            }
        }

        const checkAuthAndRoute = async () => {
            if (SjAuth.isLoggedIn()) {
                const valid = await SjAuth.checkAuth()
                if (valid) {
                    const user = SjAuth.getUser()
                    SjStore.setUser(user)

                    if (SjStore.characterId) {
                        const result = await SjApi.character.getDetail(SjStore.characterId)
                        if (result.code === 0) {
                            SjStore.setCharacter(result.data)
                        } else {
                            SjStore.setCharacterId('')
                        }
                    }

                    let route = SjRouter.getCurrentRoute()
                    if (['battle', 'event'].includes(route)) {
                        SjRouter.navigate('tower')
                        return
                    }
                    if (['login', 'register'].includes(route)) {
                        SjRouter.navigate('home')
                    } else {
                        navigateTo(route)
                    }
                } else {
                    SjRouter.navigate('login')
                }
            } else {
                const route = SjRouter.getCurrentRoute()
                if (['login', 'register'].includes(route)) {
                    navigateTo(route)
                } else {
                    SjRouter.navigate('login')
                }
            }
        }

        SjRouter.init((route) => {
            if (!SjAuth.isLoggedIn() && !['login', 'register'].includes(route)) {
                return
            }
            navigateTo(route)
        })

        onMounted(() => {
            checkAuthAndRoute()
        })

        return { currentPage, showHeader }
    },
    render() {
        if (!this.currentPage) {
            return h('div', { class: 'loading-page' }, '加载中...')
        }
        return h('div', { id: 'game-app' }, [
            h(Toast),
            this.showHeader ? h(GameHeader) : null,
            h('main', { class: 'game-main' }, [
                h(this.currentPage)
            ])
        ])
    }
}

const app = createApp(App)
app.mount('#app')
