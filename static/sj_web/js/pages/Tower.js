const TowerPage = {
    name: 'TowerPage',
    template: `
        <div class="page tower-page">
            <div class="tower-info" v-if="character">
                <div class="tower-char-panel">
                    <div class="tower-char-header">
                        <span class="tower-char-name">{{ character.name }}</span>
                        <span :class="['char-class-badge', 'class-' + character.class_type]">{{ character.class_name }}</span>
                        <span class="tower-char-level">Lv.{{ character.level }}</span>
                    </div>
                    <stat-bar :current="character.hp" :max="character.max_hp" color="#ef4444" label="HP" />
                    <stat-bar :current="character.mp" :max="character.max_mp" color="#3b82f6" label="MP" />
                    <stat-bar :current="character.exp" :max="character.exp_next" color="#f59e0b" label="EXP" />
                    <stat-bar :current="character.time_energy" :max="character.time_energy_max" color="#a855f7" label="时间能量" />
                    <div class="tower-char-stats">
                        <span>⚔ {{ character.attack }}</span>
                        <span>🛡 {{ character.defense }}</span>
                        <span>💨 {{ character.speed }}</span>
                        <span>💰 {{ character.gold }}</span>
                    </div>
                </div>
            </div>

            <div class="tower-floor-info" v-if="character">
                <div class="floor-number">第 {{ character.current_floor }} 层</div>
                <div class="floor-progress">
                    <div class="floor-progress-bar">
                        <div class="floor-progress-fill" :style="{ width: floorProgress + '%' }"></div>
                    </div>
                    <span class="floor-progress-text">{{ character.current_floor }} / 25</span>
                </div>
            </div>

            <div class="tower-dead" v-if="character && character.status === 1">
                <div class="dead-icon">💀</div>
                <h3>你已阵亡</h3>
                <p>复活需要 {{ character.level * 20 }} 金币</p>
                <button class="btn btn-primary" @click="handleRevive" :disabled="loading">
                    {{ loading ? '复活中...' : '💫 复活' }}
                </button>
            </div>

            <div class="tower-actions" v-if="character && character.status !== 1">
                <button class="btn btn-primary btn-lg" @click="enterFloor" :disabled="loading">
                    ⬆ 进入下一层
                </button>
                <div class="tower-nav-btns">
                    <button class="btn btn-secondary" @click="goInventory">🎒 背包</button>
                    <button class="btn btn-secondary" @click="goTimeAbility">⏱ 时间能力</button>
                    <button class="btn btn-secondary" @click="goSaveLoad">💾 存档</button>
                    <button class="btn btn-ghost" @click="goHome">🏠 首页</button>
                </div>
            </div>
        </div>
    `,
    components: { StatBar },
    setup() {
        const character = Vue.computed(() => SjStore.character)
        const loading = Vue.ref(false)

        const floorProgress = Vue.computed(() => {
            if (!character.value) return 0
            return (character.value.current_floor / 25) * 100
        })

        const refreshCharacter = async () => {
            if (!SjStore.characterId) return
            const result = await SjApi.character.getDetail(SjStore.characterId)
            if (result.code === 0) {
                SjStore.setCharacter(result.data)
            }
        }

        Vue.onMounted(() => refreshCharacter())

        const enterFloor = async () => {
            if (!SjStore.characterId) {
                SjStore.showToast('请先选择角色', 'error')
                return
            }
            loading.value = true
            const result = await SjApi.game.enterFloor(SjStore.characterId)
            loading.value = false
            if (result.code === 0) {
                SjStore.setCharacter(result.data.character)
                const floor = result.data
                SjStore.setCurrentFloor(floor)

                if (result.data.newly_unlocked_abilities && result.data.newly_unlocked_abilities.length > 0) {
                    result.data.newly_unlocked_abilities.forEach(a => {
                        SjStore.showToast(`解锁时间能力：${a.name}！`, 'success', 4000)
                    })
                }

                if (floor.floor_type === 'normal' || floor.floor_type === 'boss') {
                    SjRouter.navigate('battle')
                } else if (floor.floor_type === 'event') {
                    SjRouter.navigate('event')
                } else if (floor.floor_type === 'rest') {
                    const restResult = await SjApi.game.rest(SjStore.characterId)
                    if (restResult.code === 0) {
                        SjStore.setCharacter(restResult.data)
                        SjStore.showToast('在休息层恢复了力量！', 'success')
                    }
                } else if (floor.floor_type === 'shop') {
                    SjStore.showToast('你来到了商店层，暂时没有可购买的物品', 'info')
                } else if (floor.floor_type === 'treasure') {
                    SjStore.showToast('你发现了宝藏！获得了50金币', 'success')
                    const char = SjStore.character
                    if (char) {
                        char.gold += 50
                        SjStore.setCharacter({ ...char })
                    }
                }
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const handleRevive = async () => {
            loading.value = true
            const result = await SjApi.game.revive(SjStore.characterId)
            loading.value = false
            if (result.code === 0) {
                SjStore.setCharacter(result.data)
                SjStore.showToast('复活成功！', 'success')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goInventory = () => SjRouter.navigate('inventory')
        const goTimeAbility = () => SjRouter.navigate('timeAbility')
        const goSaveLoad = () => SjRouter.navigate('saveLoad')
        const goHome = () => SjRouter.navigate('home')

        return {
            character, loading, floorProgress, enterFloor,
            handleRevive, goInventory, goTimeAbility, goSaveLoad, goHome
        }
    }
}
