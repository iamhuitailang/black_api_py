const TimeAbilityPage = {
    name: 'TimeAbilityPage',
    template: `
        <div class="page time-ability-page">
            <h2 class="page-title">⏱ 时间能力</h2>
            <div class="time-energy-bar" v-if="character">
                <span>时间能量</span>
                <div class="te-bar">
                    <div class="te-fill" :style="{ width: tePercent + '%' }"></div>
                </div>
                <span>{{ character.time_energy }} / {{ character.time_energy_max }}</span>
            </div>

            <div class="abilities-list">
                <div v-for="ability in abilities" :key="ability.id"
                     :class="['ability-card', { locked: !ability.unlocked }]">
                    <div class="ability-header">
                        <span class="ability-name">{{ ability.name }}</span>
                        <span v-if="ability.unlocked" class="ability-badge unlocked">已解锁</span>
                        <span v-else class="ability-badge locked">第{{ ability.unlock_floor }}层解锁</span>
                    </div>
                    <p class="ability-desc">{{ ability.description }}</p>
                    <div class="ability-meta" v-if="ability.unlocked">
                        <span>💎 消耗: {{ ability.mp_cost }} MP</span>
                        <span>⏳ 冷却: {{ ability.cooldown }} 回合</span>
                        <span>📊 等级: {{ ability.level }}</span>
                    </div>
                </div>
            </div>

            <button class="btn btn-ghost btn-block" @click="goBack" style="margin-top:16px">返回</button>
        </div>
    `,
    setup() {
        const character = Vue.computed(() => SjStore.character)
        const abilities = Vue.ref([])

        const tePercent = Vue.computed(() => {
            if (!character.value) return 0
            return (character.value.time_energy / character.value.time_energy_max) * 100
        })

        Vue.onMounted(async () => {
            if (!SjStore.characterId) return
            const result = await SjApi.character.getTimeAbilities(SjStore.characterId)
            if (result.code === 0) {
                abilities.value = result.data
            }
        })

        const goBack = () => SjRouter.navigate('tower')

        return { character, abilities, tePercent, goBack }
    }
}
