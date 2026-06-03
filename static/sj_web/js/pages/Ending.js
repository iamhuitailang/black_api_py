const EndingPage = {
    name: 'EndingPage',
    template: `
        <div class="page ending-page">
            <div class="ending-card" v-if="endingData">
                <div class="ending-icon">{{ endingIcons[endingData.ending_type] || '🏆' }}</div>
                <h2 class="ending-title">{{ endingData.ending_name }}</h2>
                <p class="ending-desc">{{ endingDescs[endingData.ending_type] || '' }}</p>
                <div class="ending-stats" v-if="endingData.character">
                    <p>角色: {{ endingData.character.name }}</p>
                    <p>等级: Lv.{{ endingData.character.level }}</p>
                    <p>职业: {{ endingData.character.class_name }}</p>
                    <p>到达层数: {{ endingData.character.current_floor }}</p>
                </div>
                <div class="ending-actions">
                    <button class="btn btn-primary" @click="goHome">返回首页</button>
                    <button class="btn btn-secondary" @click="newGame">开始新冒险</button>
                </div>
            </div>
            <div class="ending-loading" v-else>
                <p>加载结局中...</p>
            </div>
        </div>
    `,
    setup() {
        const endingData = Vue.ref(null)

        const endingIcons = {
            warrior: '⚔',
            mage: '🔮',
            thief: '🗡',
            time_master: '⏳',
            fall: '🌑'
        }

        const endingDescs = {
            warrior: '你以不屈的意志和强大的力量征服了时间之塔。时间水晶在你手中化为最坚固的盾，守护着所有冒险者的未来。',
            mage: '你以无上的智慧解开了时间之塔的所有谜题。时间水晶的力量被你完美地驾驭，成为了时间魔法的主人。',
            thief: '你以超凡的速度穿越了时间的缝隙。在所有冒险者中，只有你看到了时间水晶最真实的模样。',
            time_master: '你完全掌握了时间水晶的力量！暂停、加速、回溯——时间在你手中如同玩具。你成为了传说中最伟大的时间之主！',
            fall: '时间之力太过强大，你的心智被扭曲。你成为了时间之塔新的守卫者，永远地困在了时间的循环中...'
        }

        Vue.onMounted(async () => {
            if (SjStore.characterId) {
                const result = await SjApi.game.getEnding(SjStore.characterId)
                if (result.code === 0) {
                    endingData.value = result.data
                } else {
                    SjStore.showToast(result.msg, 'error')
                }
            }
        })

        const goHome = () => SjRouter.navigate('home')
        const newGame = () => {
            SjStore.clearGame()
            SjRouter.navigate('characterCreate')
        }

        return { endingData, endingIcons, endingDescs, goHome, newGame }
    }
}
