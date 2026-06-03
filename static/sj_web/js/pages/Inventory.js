const InventoryPage = {
    name: 'InventoryPage',
    template: `
        <div class="page inventory-page">
            <h2 class="page-title">🎒 背包</h2>

            <div class="inventory-section" v-if="character">
                <h3>角色属性</h3>
                <div class="char-stats-grid">
                    <div class="stat-item"><span class="stat-label">⚔ 攻击</span><span class="stat-value">{{ character.attack }}</span></div>
                    <div class="stat-item"><span class="stat-label">🛡 防御</span><span class="stat-value">{{ character.defense }}</span></div>
                    <div class="stat-item"><span class="stat-label">💨 速度</span><span class="stat-value">{{ character.speed }}</span></div>
                    <div class="stat-item"><span class="stat-label">🍀 幸运</span><span class="stat-value">{{ character.luck }}</span></div>
                    <div class="stat-item"><span class="stat-label">💰 金币</span><span class="stat-value">{{ character.gold }}</span></div>
                    <div class="stat-item"><span class="stat-label">⏱ 时间能量</span><span class="stat-value">{{ character.time_energy }}</span></div>
                </div>
            </div>

            <div class="inventory-section">
                <h3>已装备</h3>
                <div class="equipped-grid" v-if="equippedItems.length > 0">
                    <div v-for="item in equippedItems" :key="item.id" :class="['item-card', 'rarity-' + item.rarity]">
                        <div class="item-name">{{ item.item_name }}</div>
                        <div class="item-type">{{ typeLabels[item.item_type] }}</div>
                        <div class="item-bonuses">
                            <span v-if="item.attack_bonus">⚔+{{ item.attack_bonus }}</span>
                            <span v-if="item.defense_bonus">🛡+{{ item.defense_bonus }}</span>
                            <span v-if="item.hp_bonus">❤+{{ item.hp_bonus }}</span>
                            <span v-if="item.mp_bonus">💎+{{ item.mp_bonus }}</span>
                        </div>
                        <button class="btn btn-sm btn-ghost" @click="unequip(item.id)">卸下</button>
                    </div>
                </div>
                <div class="empty-hint" v-else>暂无装备</div>
            </div>

            <div class="inventory-section">
                <h3>背包物品</h3>
                <div class="items-grid" v-if="unequippedItems.length > 0">
                    <div v-for="item in unequippedItems" :key="item.id" :class="['item-card', 'rarity-' + item.rarity]">
                        <div class="item-name">{{ item.item_name }}</div>
                        <div class="item-rarity">{{ item.rarity_name }}</div>
                        <div class="item-bonuses">
                            <span v-if="item.attack_bonus">⚔+{{ item.attack_bonus }}</span>
                            <span v-if="item.defense_bonus">🛡+{{ item.defense_bonus }}</span>
                            <span v-if="item.hp_bonus">❤+{{ item.hp_bonus }}</span>
                            <span v-if="item.mp_bonus">💎+{{ item.mp_bonus }}</span>
                        </div>
                        <div class="item-actions">
                            <button v-if="item.item_type !== 'consumable'" class="btn btn-sm btn-primary" @click="equip(item.id)">装备</button>
                            <button v-if="item.item_type === 'consumable'" class="btn btn-sm btn-success" @click="useItem(item.id)">使用</button>
                            <button class="btn btn-sm btn-danger" @click="removeItem(item.id)">丢弃</button>
                        </div>
                    </div>
                </div>
                <div class="empty-hint" v-else>背包空空如也</div>
            </div>

            <button class="btn btn-ghost btn-block" @click="goBack" style="margin-top:16px">返回</button>
        </div>
    `,
    setup() {
        const character = Vue.computed(() => SjStore.character)
        const items = Vue.ref([])
        const equippedItems = Vue.computed(() => items.value.filter(i => i.equipped === 1))
        const unequippedItems = Vue.computed(() => items.value.filter(i => i.equipped !== 1))

        const typeLabels = {
            weapon: '武器', armor: '防具', accessory: '饰品', consumable: '消耗品', material: '材料'
        }

        const loadItems = async () => {
            if (!SjStore.characterId) return
            const result = await SjApi.inventory.getList(SjStore.characterId)
            if (result.code === 0) {
                items.value = result.data
            }
        }

        Vue.onMounted(() => loadItems())

        const equip = async (inventoryId) => {
            const result = await SjApi.inventory.equip(inventoryId, SjStore.characterId)
            if (result.code === 0) {
                SjStore.setCharacter(result.data.character)
                await loadItems()
                SjStore.showToast('装备成功', 'success')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const unequip = async (inventoryId) => {
            const result = await SjApi.inventory.unequip(inventoryId, SjStore.characterId)
            if (result.code === 0) {
                SjStore.setCharacter(result.data.character)
                await loadItems()
                SjStore.showToast('卸下装备', 'success')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const useItem = async (inventoryId) => {
            const result = await SjApi.inventory.use(inventoryId, SjStore.characterId)
            if (result.code === 0) {
                SjStore.setCharacter(result.data.character)
                await loadItems()
                SjStore.showToast(`使用了${result.data.item_name}`, 'success')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const removeItem = async (inventoryId) => {
            if (!confirm('确定丢弃此物品？')) return
            const result = await SjApi.inventory.remove(inventoryId, SjStore.characterId)
            if (result.code === 0) {
                await loadItems()
                SjStore.showToast('物品已丢弃', 'success')
            } else {
                SjStore.showToast(result.msg, 'error')
            }
        }

        const goBack = () => SjRouter.navigate('tower')

        return {
            character, items, equippedItems, unequippedItems, typeLabels,
            equip, unequip, useItem, removeItem, goBack
        }
    }
}
