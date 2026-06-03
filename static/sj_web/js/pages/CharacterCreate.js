const CharacterCreatePage = {
    name: 'CharacterCreatePage',
    template: `
        <div class="page char-create-page">
            <h2 class="page-title">创建角色</h2>
            <div class="form-group">
                <label class="form-label">角色名</label>
                <input type="text" v-model="name" placeholder="输入角色名" class="form-input" />
            </div>
            <div class="form-group">
                <label class="form-label">选择职业</label>
                <div class="class-grid">
                    <div v-for="cls in classes" :key="cls.key"
                         :class="['class-card', { selected: selectedClass === cls.key }]"
                         @click="selectedClass = cls.key">
                        <div class="class-icon">{{ classIcons[cls.key] }}</div>
                        <div class="class-name">{{ cls.name }}</div>
                        <div class="class-desc">{{ cls.desc }}</div>
                        <div class="class-stats">
                            <span>❤ {{ cls.hp }}</span>
                            <span>💎 {{ cls.mp }}</span>
                            <span>⚔ {{ cls.attack }}</span>
                            <span>🛡 {{ cls.defense }}</span>
                            <span>💨 {{ cls.speed }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <button class="btn btn-primary btn-block" @click="handleCreate" :disabled="loading">
                {{ loading ? '创建中...' : '创建角色' }}
            </button>
            <button class="btn btn-ghost btn-block" @click="goBack" style="margin-top:8px">
                返回
            </button>
        </div>
    `,
    setup() {
        const name = Vue.ref('')
        const selectedClass = Vue.ref('warrior')
        const classes = Vue.ref([])
        const loading = Vue.ref(false)

        const classIcons = {
            warrior: '⚔',
            mage: '🔮',
            thief: '🗡'
        }

        Vue.onMounted(async () => {
            const result = await SjApi.character.getClasses()
            if (result.code === 0) {
                classes.value = result.data
            }
        })

        const handleCreate = async () => {
            if (!name.value) {
                SjStore.showToast('请输入角色名', 'error')
                return
            }
            loading.value = true
            const result = await SjApi.character.create(name.value, selectedClass.value)
            loading.value = false
            if (result.code === 0) {
                SjStore.setCharacterId(result.data.id)
                SjStore.setCharacter(result.data)
                SjStore.showToast('角色创建成功！', 'success')
                SjRouter.navigate('tower')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goBack = () => SjRouter.navigate('home')

        return { name, selectedClass, classes, classIcons, loading, handleCreate, goBack }
    }
}
