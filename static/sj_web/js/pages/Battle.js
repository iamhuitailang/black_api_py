const BattlePage = {
    name: 'BattlePage',
    template: `
        <div class="page battle-page">
            <div class="battle-scene" v-if="enemy">
                <div class="battle-enemy">
                    <div class="enemy-icon" :class="{ 'enemy-boss': floor && floor.is_boss }">
                        {{ floor && floor.is_boss ? '👹' : '👾' }}
                    </div>
                    <div class="enemy-name">{{ enemy.name }}</div>
                    <stat-bar :current="battleHp" :max="enemyMaxHp" color="#ef4444" />
                    <div class="enemy-hp-text">{{ battleHp }} / {{ enemyMaxHp }}</div>
                </div>

                <div class="battle-vs">⚔</div>

                <div class="battle-player" v-if="character">
                    <div class="player-icon">🧙</div>
                    <div class="player-battle-name">{{ character.name }}</div>
                    <stat-bar :current="character.hp" :max="character.max_hp" color="#ef4444" label="HP" />
                    <stat-bar :current="character.mp" :max="character.max_mp" color="#3b82f6" label="MP" />
                </div>
            </div>

            <div class="battle-log" ref="logContainer">
                <div v-for="(log, index) in battleLogs" :key="index" class="log-item"
                     :class="{ 'log-damage': log.includes('伤害'), 'log-heal': log.includes('恢复'), 'log-ability': log.includes('⏱') || log.includes('⏩') || log.includes('⏪') }">
                    {{ log }}
                </div>
            </div>

            <div class="battle-actions" v-if="!battleEnded">
                <div class="skill-row">
                    <button v-for="skill in skillsList" :key="skill"
                            class="btn btn-skill" @click="useSkill(skill)"
                            :disabled="loading">
                        {{ skill }}
                    </button>
                </div>
                <div class="time-ability-row" v-if="timeAbilities.length > 0">
                    <button v-for="ability in timeAbilities" :key="ability.ability_name"
                            class="btn btn-time" @click="useTimeAbility(ability.ability_name)"
                            :disabled="loading || !ability.unlocked">
                        {{ ability.name }}
                    </button>
                </div>
                <div class="action-row">
                    <button class="btn btn-attack" @click="doAction('attack')" :disabled="loading">⚔ 攻击</button>
                    <button class="btn btn-defend" @click="doAction('defend')" :disabled="loading">🛡 防御</button>
                    <button class="btn btn-flee" @click="doAction('flee')" :disabled="loading">🏃 逃跑</button>
                </div>
            </div>

            <div class="battle-result" v-if="battleEnded">
                <div :class="['result-card', battleResult]">
                    <div class="result-icon">{{ battleResult === 'victory' ? '🎉' : '💀' }}</div>
                    <h3>{{ battleResult === 'victory' ? '战斗胜利！' : '战斗失败...' }}</h3>
                    <div v-if="battleResult === 'victory'" class="result-rewards">
                        <p>✨ 获得 {{ expGain }} 经验</p>
                        <p>💰 获得 {{ goldGain }} 金币</p>
                        <div v-if="drops.length > 0" class="result-drops">
                            <p>📦 掉落物品：</p>
                            <div v-for="drop in drops" :key="drop.item_id" :class="['drop-item', 'rarity-' + drop.rarity]">
                                {{ drop.item_name }}
                            </div>
                        </div>
                        <p v-if="levelUp" class="level-up">🎊 升级了！</p>
                    </div>
                    <div v-if="battleResult === 'defeat'" class="result-defeat">
                        <p>你被击败了...</p>
                        <p>可以花费金币复活</p>
                    </div>
                    <button class="btn btn-primary" @click="goBack">返回</button>
                </div>
            </div>
        </div>
    `,
    components: { StatBar },
    setup() {
        const character = Vue.computed(() => SjStore.character)
        const floor = Vue.computed(() => SjStore.currentFloor)
        const enemy = Vue.computed(() => {
            if (!floor.value) return null
            return floor.value.enemy_data || null
        })
        const skillsList = Vue.computed(() => {
            if (!character.value) return []
            return character.value.skills || []
        })
        const battleLogs = Vue.ref([])
        const battleHp = Vue.ref(0)
        const enemyMaxHp = Vue.ref(0)
        const battleEnded = Vue.ref(false)
        const battleResult = Vue.ref('')
        const loading = Vue.ref(false)
        const expGain = Vue.ref(0)
        const goldGain = Vue.ref(0)
        const drops = Vue.ref([])
        const levelUp = Vue.ref(false)
        const timeAbilities = Vue.ref([])
        const logContainer = Vue.ref(null)

        Vue.onMounted(async () => {
            if (enemy.value) {
                battleHp.value = enemy.value.hp || 50
                enemyMaxHp.value = enemy.value.hp || 50
            }
            if (SjStore.characterId) {
                const result = await SjApi.character.getTimeAbilities(SjStore.characterId)
                if (result.code === 0) {
                    timeAbilities.value = result.data.filter(a => a.unlocked)
                }
            }
        })

        Vue.watch(battleLogs, () => {
            Vue.nextTick(() => {
                if (logContainer.value) {
                    logContainer.value.scrollTop = logContainer.value.scrollHeight
                }
            })
        })

        const doAction = async (action) => {
            if (!SjStore.characterId) return
            loading.value = true
            const result = await SjApi.game.battleAction(SjStore.characterId, action)
            loading.value = false
            handleBattleResult(result)
        }

        const useSkill = async (skillName) => {
            if (!SjStore.characterId) return
            loading.value = true
            const result = await SjApi.game.battleAction(SjStore.characterId, 'attack', skillName)
            loading.value = false
            handleBattleResult(result)
        }

        const useTimeAbility = async (abilityName) => {
            if (!SjStore.characterId) return
            loading.value = true
            const result = await SjApi.game.battleAction(SjStore.characterId, 'attack', '', abilityName)
            loading.value = false
            handleBattleResult(result)
        }

        const handleBattleResult = (result) => {
            if (result.code !== 0) {
                SjStore.showToast(result.msg, 'error')
                return
            }

            const data = result.data

            if (data.log && data.log.length > 0) {
                battleLogs.value.push(...data.log)
            }

            if (data.enemy_hp !== undefined) {
                battleHp.value = Math.max(0, data.enemy_hp)
            }

            if (data.character) {
                SjStore.setCharacter(data.character)
            }

            if (data.result === 'victory') {
                battleEnded.value = true
                battleResult.value = 'victory'
                expGain.value = data.exp_gain || 0
                goldGain.value = data.gold_gain || 0
                drops.value = data.drops || []
                levelUp.value = data.level_up || false

                if (drops.value.length > 0) {
                    drops.value.forEach(async (drop) => {
                        await SjApi.inventory.add(SjStore.characterId, drop)
                    })
                }
            } else if (data.result === 'defeat') {
                battleEnded.value = true
                battleResult.value = 'defeat'
                if (data.character) {
                    SjStore.setCharacter(data.character)
                }
            } else if (data.result === 'fled') {
                SjStore.showToast('逃跑成功', 'info')
                if (data.character) {
                    SjStore.setCharacter(data.character)
                }
                SjRouter.navigate('tower')
            }
        }

        const goBack = () => {
            SjRouter.navigate('tower')
        }

        return {
            character, floor, enemy, skillsList, battleLogs, battleHp, enemyMaxHp,
            battleEnded, battleResult, loading, expGain, goldGain,
            drops, levelUp, timeAbilities, logContainer,
            doAction, useSkill, useTimeAbility, goBack
        }
    }
}
