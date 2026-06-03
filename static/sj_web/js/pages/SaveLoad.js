const SaveLoadPage = {
    name: 'SaveLoadPage',
    template: `
        <div class="page save-load-page">
            <h2 class="page-title">💾 存档管理</h2>

            <div class="save-actions" v-if="character">
                <button class="btn btn-primary btn-block" @click="handleSave" :disabled="loading">
                    💾 保存当前进度
                </button>
            </div>

            <div class="saves-list" v-if="saves.length > 0">
                <div v-for="save in saves" :key="save.id" class="save-card">
                    <div class="save-header">
                        <span class="save-name">{{ save.save_name || '存档' }}</span>
                        <span class="save-time">{{ formatDate(save.updated_at) }}</span>
                    </div>
                    <div class="save-info">
                        <span>第 {{ save.current_floor }} 层</span>
                        <span>游戏时间: {{ save.play_time }}分钟</span>
                        <span v-if="save.ending_type" class="save-ending">{{ save.ending_name }}</span>
                    </div>
                    <div class="save-actions-row">
                        <button class="btn btn-sm btn-primary" @click="handleLoad(save.id)">读取</button>
                        <button class="btn btn-sm btn-danger" @click="handleDelete(save.id)">删除</button>
                    </div>
                </div>
            </div>
            <div class="empty-hint" v-else>暂无存档</div>

            <button class="btn btn-ghost btn-block" @click="goBack" style="margin-top:16px">返回</button>
        </div>
    `,
    setup() {
        const character = Vue.computed(() => SjStore.character)
        const saves = Vue.ref([])
        const loading = Vue.ref(false)

        const loadSaves = async () => {
            const result = await SjApi.save.getList()
            if (result.code === 0) {
                saves.value = result.data
            }
        }

        Vue.onMounted(() => loadSaves())

        const formatDate = (dateStr) => {
            if (!dateStr) return ''
            const d = new Date(dateStr)
            return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
        }

        const handleSave = async () => {
            if (!SjStore.characterId) return
            loading.value = true
            const charName = character.value?.name || '角色'
            const result = await SjApi.save.create(SjStore.characterId, `${charName}的存档`)
            loading.value = false
            if (result.code === 0) {
                SjStore.showToast('存档成功', 'success')
                await loadSaves()
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const handleLoad = async (saveId) => {
            if (!confirm('读取存档将覆盖当前进度，确定吗？')) return
            const result = await SjApi.save.load(saveId)
            if (result.code === 0) {
                if (result.data.character) {
                    SjStore.setCharacter(result.data.character)
                    SjStore.setCharacterId(result.data.character.id)
                }
                SjStore.showToast('读档成功', 'success')
                SjRouter.navigate('tower')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const handleDelete = async (saveId) => {
            if (!confirm('确定删除此存档？')) return
            const result = await SjApi.save.delete(saveId)
            if (result.code === 0) {
                SjStore.showToast('存档已删除', 'success')
                await loadSaves()
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goBack = () => SjRouter.navigate('tower')

        return { character, saves, loading, formatDate, handleSave, handleLoad, handleDelete, goBack }
    }
}
