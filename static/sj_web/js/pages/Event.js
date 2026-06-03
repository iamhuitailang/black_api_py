const EventPage = {
    name: 'EventPage',
    template: `
        <div class="page event-page">
            <div class="event-card" v-if="event">
                <div class="event-icon">🌀</div>
                <h2 class="event-title">{{ event.name }}</h2>
                <p class="event-desc">{{ event.description }}</p>
                <div class="event-choices">
                    <button v-for="(choice, index) in event.choices" :key="index"
                            class="btn btn-choice" @click="makeChoice(index)"
                            :disabled="loading">
                        {{ choice.text }}
                    </button>
                </div>
            </div>

            <div class="event-result" v-if="resultText">
                <div class="result-icon">📜</div>
                <p class="result-text">{{ resultText }}</p>
                <div class="result-effects" v-if="appliedEffects">
                    <span v-for="(value, key) in appliedEffects" :key="key"
                          :class="['effect-tag', value >= 0 ? 'effect-positive' : 'effect-negative']">
                        {{ effectLabels[key] || key }}: {{ value >= 0 ? '+' : '' }}{{ value }}
                    </span>
                </div>
                <button class="btn btn-primary" @click="goBack" style="margin-top:16px">继续前进</button>
            </div>

            <div class="event-loading" v-if="!event && !resultText">
                <p>正在遭遇随机事件...</p>
            </div>
        </div>
    `,
    setup() {
        const event = Vue.ref(null)
        const resultText = Vue.ref('')
        const appliedEffects = Vue.ref(null)
        const loading = Vue.ref(false)

        const effectLabels = {
            hp: '生命', mp: '魔力', gold: '金币', exp: '经验',
            time_energy: '时间能量', attack: '攻击', defense: '防御'
        }

        Vue.onMounted(async () => {
            const result = await SjApi.game.getEvent()
            if (result.code === 0) {
                event.value = result.data
            }
        })

        const makeChoice = async (choiceIndex) => {
            if (!SjStore.characterId || !event.value) return
            loading.value = true
            const result = await SjApi.game.eventChoice(
                SjStore.characterId,
                event.value.id,
                choiceIndex
            )
            loading.value = false
            if (result.code === 0) {
                resultText.value = result.data.result_text
                appliedEffects.value = result.data.effects
                if (result.data.character) {
                    SjStore.setCharacter(result.data.character)
                }
                event.value = null
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goBack = () => SjRouter.navigate('tower')

        return { event, resultText, appliedEffects, loading, effectLabels, makeChoice, goBack }
    }
}
