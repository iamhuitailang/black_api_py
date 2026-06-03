const HomePage = {
    name: 'HomePage',
    template: `
        <div class="page home-page">
            <div class="home-hero">
                <div class="hero-icon">⏳</div>
                <h1 class="hero-title">时间之塔</h1>
                <p class="hero-desc">传说中有一座时间之塔，塔顶有一块时间水晶，拥有控制时间的力量。<br>无数冒险者前往挑战，但都失败了。<br>你决定踏上征程，挑战这座神秘的塔。</p>
            </div>
            <div class="home-actions">
                <button class="btn btn-primary btn-lg" @click="goCharacterSelect">
                    ⚔ 继续冒险
                </button>
                <button class="btn btn-secondary btn-lg" @click="goCharacterCreate">
                    ✨ 创建新角色
                </button>
                <button class="btn btn-outline btn-lg" @click="goSaveLoad">
                    💾 存档管理
                </button>
            </div>
            <div class="home-character" v-if="character">
                <div class="char-card" @click="goTower">
                    <div class="char-card-header">
                        <span class="char-name">{{ character.name }}</span>
                        <span :class="['char-class', 'class-' + character.class_type]">{{ character.class_name }}</span>
                    </div>
                    <div class="char-card-body">
                        <div class="char-level">Lv.{{ character.level }}</div>
                        <stat-bar :current="character.hp" :max="character.max_hp" color="#ef4444" label="HP" />
                        <stat-bar :current="character.mp" :max="character.max_mp" color="#3b82f6" label="MP" />
                        <stat-bar :current="character.time_energy" :max="character.time_energy_max" color="#a855f7" label="时间能量" />
                    </div>
                    <div class="char-card-footer">
                        <span>第 {{ character.current_floor }} 层</span>
                        <span>💰 {{ character.gold }}</span>
                    </div>
                    <div class="char-dead" v-if="character.status === 1">💀 已阵亡</div>
                </div>
            </div>
        </div>
    `,
    components: { StatBar },
    setup() {
        const character = Vue.computed(() => SjStore.character)

        const goCharacterSelect = () => SjRouter.navigate('characterSelect')
        const goCharacterCreate = () => SjRouter.navigate('characterCreate')
        const goSaveLoad = () => SjRouter.navigate('saveLoad')
        const goTower = () => SjRouter.navigate('tower')

        Vue.onMounted(async () => {
            if (SjStore.characterId) {
                const result = await SjApi.character.getDetail(SjStore.characterId)
                if (result.code === 0) {
                    SjStore.setCharacter(result.data)
                }
            }
        })

        return { character, goCharacterSelect, goCharacterCreate, goSaveLoad, goTower }
    }
}
