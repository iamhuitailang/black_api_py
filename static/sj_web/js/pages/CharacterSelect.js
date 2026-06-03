const CharacterSelectPage = {
    name: 'CharacterSelectPage',
    template: `
        <div class="page char-select-page">
            <h2 class="page-title">选择角色</h2>
            <div class="char-list" v-if="characters.length > 0">
                <div v-for="char in characters" :key="char.id"
                     :class="['char-select-card', { active: selectedId === char.id }]"
                     @click="selectedId = char.id">
                    <div class="char-select-header">
                        <span class="char-select-name">{{ char.name }}</span>
                        <span :class="['char-class-badge', 'class-' + char.class_type]">{{ char.class_name }}</span>
                    </div>
                    <div class="char-select-body">
                        <div class="char-select-level">Lv.{{ char.level }}</div>
                        <div class="char-select-stats">
                            <span>❤ {{ char.hp }}/{{ char.max_hp }}</span>
                            <span>💎 {{ char.mp }}/{{ char.max_mp }}</span>
                            <span>⚔ {{ char.attack }}</span>
                            <span>🛡 {{ char.defense }}</span>
                        </div>
                        <div class="char-select-floor">第 {{ char.current_floor }} 层 · 💰 {{ char.gold }}</div>
                        <div class="char-dead-badge" v-if="char.status === 1">💀 已阵亡</div>
                    </div>
                </div>
            </div>
            <div class="empty-state" v-else>
                <p>还没有角色</p>
                <button class="btn btn-primary" @click="goCreate">创建角色</button>
            </div>
            <div class="char-select-actions" v-if="selectedId">
                <button class="btn btn-primary btn-block" @click="handleSelect">选择角色</button>
                <button class="btn btn-danger btn-block" @click="handleDelete" style="margin-top:8px">删除角色</button>
            </div>
            <button class="btn btn-ghost btn-block" @click="goBack" style="margin-top:16px">返回</button>
        </div>
    `,
    setup() {
        const characters = Vue.ref([])
        const selectedId = Vue.ref(null)
        const loading = Vue.ref(false)

        Vue.onMounted(async () => {
            const result = await SjApi.character.getList()
            if (result.code === 0) {
                characters.value = result.data
                if (result.data.length > 0 && !selectedId.value) {
                    selectedId.value = result.data[0].id
                }
            }
        })

        const handleSelect = async () => {
            if (!selectedId.value) return
            const result = await SjApi.character.getDetail(selectedId.value)
            if (result.code === 0) {
                SjStore.setCharacterId(selectedId.value)
                SjStore.setCharacter(result.data)
                SjRouter.navigate('tower')
            }
        }

        const handleDelete = async () => {
            if (!selectedId.value) return
            if (!confirm('确定要删除这个角色吗？')) return
            const result = await SjApi.character.delete(selectedId.value)
            if (result.code === 0) {
                SjStore.showToast('角色已删除', 'success')
                if (SjStore.characterId == selectedId.value) {
                    SjStore.setCharacterId('')
                    SjStore.setCharacter(null)
                }
                selectedId.value = null
                const listResult = await SjApi.character.getList()
                if (listResult.code === 0) {
                    characters.value = listResult.data
                }
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goBack = () => SjRouter.navigate('home')
        const goCreate = () => SjRouter.navigate('characterCreate')

        return { characters, selectedId, loading, handleSelect, handleDelete, goBack, goCreate }
    }
}
