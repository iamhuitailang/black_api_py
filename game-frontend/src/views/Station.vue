<template>
  <div class="station-page">
    <div class="station-bg">
      <canvas ref="bgCanvasRef"></canvas>
    </div>

    <div class="station-header">
      <div class="header-left">
        <button class="btn btn-sm" @click="backToMap">← 返回星图</button>
        <div class="header-title">
          <span class="st-icon">⌂</span>
          <div>
            <h2>{{ planet?.name || '空间站' }}</h2>
            <div class="sub-info">
              <span class="tag" :class="`tag-faction-${planet?.faction === 'corporate' ? 'corporate' : (planet?.faction || 'neutral')}`">
                {{ factionName }}
              </span>
              <span class="danger-text">
                <span v-for="i in 5" :key="i" :class="{active: i <= (planet?.danger_level || 1)}">★</span>
                危险等级
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="header-center">
        <div class="stat-chip">
          <span class="chip-label">星币</span>
          <span class="credits chip-val">{{ credits }}</span>
        </div>
        <div class="stat-chip military">
          <span class="chip-label">军方</span>
          <span class="chip-val">{{ player?.reputation_military || 0 }}</span>
        </div>
        <div class="stat-chip pirate">
          <span class="chip-label">海盗</span>
          <span class="chip-val">{{ player?.reputation_pirate || 0 }}</span>
        </div>
        <div v-if="player?.bounty_pirate > 0" class="stat-chip bounty">
          <span class="chip-label">⚠ 海盗悬赏</span>
          <span class="chip-val">₵ {{ player.bounty_pirate }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-gold btn-sm" @click="startCombatRandom" :disabled="inCombat">
          ⚔ 随机遭遇战
        </button>
      </div>
    </div>

    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{active: activeTab === tab.key, disabled: !tabAvailable(tab.key)}"
        @click="tabAvailable(tab.key) && (activeTab = tab.key)"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.name }}</span>
      </button>
    </div>

    <div class="tab-content-wrap">
      <Transition name="fade-tab" mode="out-in">
        <div v-if="activeTab === 'missions'" key="missions" class="tab-panel missions-tab">
          <div v-if="activeMission" class="panel active-mission-panel">
            <div class="panel-title">
              <h3>◆ 当前任务</h3>
              <span class="tag tag-rarity-rare">进行中</span>
            </div>
            <div class="panel-body">
              <div class="mission-card active-card">
                <div class="mission-header">
                  <div>
                    <h4 class="mission-name">{{ activeMission.name }}</h4>
                    <span class="tag" :class="`tag-faction-${activeMission.faction === 'corporate' ? 'corporate' : activeMission.faction}`">
                      {{ missionFactionName(activeMission.faction) }}
                    </span>
                    <span class="difficulty">
                      <span v-for="i in 5" :key="i" :class="{active: i <= activeMission.difficulty}">★</span>
                    </span>
                  </div>
                  <button class="btn btn-danger btn-sm" @click="abandonMission">放弃任务</button>
                </div>
                <p class="mission-desc">{{ activeMission.description }}</p>
                <div class="mission-progress">
                  <div class="progress-label">
                    <span>进度</span>
                    <span>{{ activeMission.current_enemy_index }} / {{ activeMission.enemy_count }} 波次</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{width: (activeMission.current_enemy_index / activeMission.enemy_count * 100) + '%'}"></div>
                  </div>
                </div>
                <div class="mission-rewards">
                  <div class="reward"><span class="reward-label">星币</span><span class="credits">{{ activeMission.reward_credits }}</span></div>
                  <div class="reward" v-if="activeMission.reputation_military"><span class="reward-label">军方声望</span><span class="positive">+{{ activeMission.reputation_military }}</span></div>
                  <div class="reward" v-if="activeMission.reputation_pirate"><span class="reward-label">海盗声望</span><span :class="activeMission.reputation_pirate > 0 ? 'positive' : 'negative'">{{ activeMission.reputation_pirate > 0 ? '+' : '' }}{{ activeMission.reputation_pirate }}</span></div>
                </div>
                <button class="btn btn-primary btn-lg btn-block" @click="startMissionCombat" :disabled="inCombat">
                  {{ activeMission.current_enemy_index >= activeMission.enemy_count ? '✦ 领取任务奖励' : '⚔ 开始下一波战斗' }}
                </button>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-title">
              <h3>◆ 任务发布板</h3>
              <span class="mission-count">{{ availableMissions.length }} 个可接任务</span>
            </div>
            <div class="panel-body">
              <div v-if="availableMissions.length === 0" class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>当前没有可接的任务</p>
              </div>
              <div v-else class="mission-grid">
                <div
                  v-for="mission in availableMissions"
                  :key="mission.id"
                  class="mission-card"
                  :class="`faction-${mission.faction}`"
                >
                  <div class="mission-top">
                    <h4 class="mission-name">{{ mission.name }}</h4>
                    <div class="mission-type">{{ missionTypeName(mission.mission_type) }}</div>
                  </div>
                  <div class="mission-meta">
                    <span class="tag" :class="`tag-faction-${mission.faction === 'corporate' ? 'corporate' : mission.faction}`">
                      {{ missionFactionName(mission.faction) }}
                    </span>
                    <span class="difficulty" :title="`难度等级 ${mission.difficulty}`">
                      <span v-for="i in 5" :key="i" :class="{active: i <= mission.difficulty}">★</span>
                    </span>
                    <span class="enemies-count">×{{ mission.enemy_count }} 波敌</span>
                  </div>
                  <p class="mission-desc">{{ mission.description }}</p>
                  <div class="mission-rewards">
                    <div class="reward"><span class="reward-label">星币</span><span class="credits">{{ mission.reward_credits }}</span></div>
                    <div v-if="mission.reputation_military" class="reward">
                      <span class="reward-label">军方</span>
                      <span :class="mission.reputation_military > 0 ? 'positive' : 'negative'">{{ mission.reputation_military > 0 ? '+' : '' }}{{ mission.reputation_military }}</span>
                    </div>
                    <div v-if="mission.reputation_pirate" class="reward">
                      <span class="reward-label">海盗</span>
                      <span :class="mission.reputation_pirate > 0 ? 'positive' : 'negative'">{{ mission.reputation_pirate > 0 ? '+' : '' }}{{ mission.reputation_pirate }}</span>
                    </div>
                  </div>
                  <button
                    class="btn btn-primary btn-block"
                    :disabled="!!activeMission"
                    @click="acceptMission(mission.id)"
                  >
                    {{ activeMission ? '已有进行中任务' : '✓ 接取任务' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'shop'" key="shop" class="tab-panel shop-tab">
          <div class="shop-sidebar">
            <div class="panel">
              <div class="panel-title"><h3>◆ 分类</h3></div>
              <div class="panel-body">
                <div
                  v-for="cat in shopCategories"
                  :key="cat.key"
                  class="cat-item"
                  :class="{active: shopCat === cat.key}"
                  @click="shopCat = cat.key"
                >
                  <span class="cat-icon">{{ cat.icon }}</span>
                  <span>{{ cat.name }}</span>
                  <span class="cat-count">{{ getCatCount(cat.key) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="shop-main">
            <div class="panel">
              <div class="panel-title">
                <h3>◆ {{ shopCatTitle }}</h3>
                <span class="shop-hint">{{ shopHint }}</span>
              </div>
              <div class="panel-body">
                <div class="shop-grid">
                  <div
                    v-for="item in shopItems"
                    :key="item.id"
                    class="shop-card"
                    :class="`rarity-${item.rarity}`"
                  >
                    <div class="shop-card-top">
                      <div class="item-icon" :class="`slot-${item.slot_type || item.item_type}`">{{ itemIcon(item) }}</div>
                      <div class="item-info-top">
                        <h5 class="item-name">{{ item.name }}</h5>
                        <span class="tag" :class="`tag-rarity-${item.rarity}`">{{ rarityName(item.rarity) }}</span>
                      </div>
                    </div>
                    <p class="item-desc">{{ item.description }}</p>
                    <div class="item-stats">
                      <div v-if="item.attack_bonus" class="istat"><span>攻击</span><span class="positive">+{{ item.attack_bonus }}</span></div>
                      <div v-if="item.defense_bonus" class="istat"><span>防御</span><span class="positive">+{{ item.defense_bonus }}</span></div>
                      <div v-if="item.shield_bonus" class="istat"><span>护盾容量</span><span class="positive">+{{ item.shield_bonus }}</span></div>
                      <div v-if="item.hull_bonus" class="istat"><span>船体容量</span><span class="positive">+{{ item.hull_bonus }}</span></div>
                      <div v-if="item.shield_regen_bonus" class="istat"><span>护盾恢复</span><span class="positive">+{{ item.shield_regen_bonus }}</span></div>
                      <div v-if="item.evasion_bonus" class="istat"><span>闪避</span><span class="positive">+{{ item.evasion_bonus }}%</span></div>
                      <div v-if="item.heal_hull" class="istat"><span>修复船体</span><span class="positive">+{{ item.heal_hull }}</span></div>
                      <div v-if="item.heal_shield" class="istat"><span>充能护盾</span><span class="positive">+{{ item.heal_shield }}</span></div>
                      <div v-if="item.damage_bonus" class="istat"><span>临时攻击</span><span class="positive">+{{ item.damage_bonus }}</span></div>
                    </div>
                    <div v-if="item.special_effect" class="item-spec">
                      <span class="spec-label">◆</span> {{ item.special_effect }}
                    </div>
                    <div class="item-footer">
                      <span class="item-price">价格 <span class="credits">{{ item.shop_price || item.price }}</span></span>
                      <button
                        class="btn btn-gold btn-sm"
                        :disabled="credits < (item.shop_price || item.price)"
                        @click="buyItem(item)"
                      >
                        购买
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'repair'" key="repair" class="tab-panel repair-tab">
          <div class="panel repair-panel">
            <div class="panel-title"><h3>◆ 船坞维修</h3></div>
            <div class="panel-body">
              <div class="repair-preview">
                <div class="repair-ship-art">
                  <svg viewBox="0 0 200 120" class="ship-svg">
                    <defs>
                      <linearGradient id="shipG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#4a5568"/>
                        <stop offset="100%" stop-color="#2d3748"/>
                      </linearGradient>
                    </defs>
                    <polygon points="160,60 100,30 30,45 20,60 30,75 100,90" fill="url(#shipG)" stroke="#4fd1c5" stroke-width="1" stroke-opacity="0.5"/>
                    <polygon points="100,30 130,52 100,58 80,42" fill="#1a2540" stroke="#63b3ed" stroke-width="0.8"/>
                    <polygon points="30,45 60,38 65,55 30,55" fill="#2d3748" opacity="0.8"/>
                    <polygon points="30,65 60,65 65,82 30,75" fill="#2d3748" opacity="0.8"/>
                    <circle cx="85" cy="60" r="6" fill="#e53e3e" opacity="0.6" class="damage-dot"/>
                    <circle cx="120" cy="52" r="4" fill="#e53e3e" opacity="0.4" class="damage-dot"/>
                    <circle cx="50" cy="70" r="5" fill="#e53e3e" opacity="0.5" class="damage-dot"/>
                    <polygon points="160,60 170,58 170,62" fill="#4fd1c5" opacity="0.7"/>
                  </svg>
                </div>
                <div class="repair-stats">
                  <div class="repair-bar-wrap">
                    <div class="bar-label">
                      <span>🛡 护盾</span>
                      <span>{{ ship?.current_shield || 0 }} / {{ ship?.total_max_shield || 0 }}</span>
                    </div>
                    <div class="bar bar-shield bar-hp">
                      <div class="bar-fill" :style="{width: shieldPercent + '%'}"></div>
                    </div>
                    <div class="repair-val">缺失 <span class="credits">{{ shieldMissing }}</span> · 充能 <span class="cost">₵ {{ shieldCost }}</span></div>
                  </div>
                  <div class="repair-bar-wrap">
                    <div class="bar-label">
                      <span>◆ 船体</span>
                      <span>{{ ship?.current_hull || 0 }} / {{ ship?.total_max_hull || 0 }}</span>
                    </div>
                    <div class="bar bar-hull bar-hp">
                      <div class="bar-fill" :style="{width: hullPercent + '%'}"></div>
                    </div>
                    <div class="repair-val">损伤 <span class="negative">{{ hullDamage }}</span> · 修复 <span class="cost">₵ {{ hullCost }}</span></div>
                  </div>
                  <div class="total-repair">
                    <div class="total-label">总计维修费用</div>
                    <div class="total-cost">
                      <span class="credits big">{{ totalRepairCost }}</span>
                      <span v-if="totalRepairCost === 0" class="status-ok">✓ 状态完好</span>
                    </div>
                  </div>
                  <button
                    class="btn btn-primary btn-lg btn-block"
                    :disabled="totalRepairCost === 0 || credits < totalRepairCost"
                    @click="doRepair"
                  >
                    {{ totalRepairCost === 0 ? '无需维修' : (credits < totalRepairCost ? '星币不足' : '🔧 开始维修') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'equipment'" key="equipment" class="tab-panel equipment-tab">
          <div class="equip-layout">
            <div class="equip-slots panel">
              <div class="panel-title"><h3>◆ 飞船装备槽</h3></div>
              <div class="panel-body">
                <div class="ship-slot-grid">
                  <div
                    v-for="slot in slotDefs"
                    :key="slot.key"
                    class="ship-slot"
                    :class="{empty: !getEquippedItem(slot.key)}"
                  >
                    <div class="slot-icon">{{ slot.icon }}</div>
                    <div class="slot-label">{{ slot.name }}</div>
                    <div class="slot-item" v-if="getEquippedItem(slot.key)">
                      <div class="si-name" :class="`text-rarity-${getEquippedItem(slot.key).rarity}`">
                        {{ getEquippedItem(slot.key).name }}
                      </div>
                      <button class="btn btn-sm" @click="unequipItem(getEquippedItem(slot.key).inventory_id)">卸下</button>
                    </div>
                    <div v-else class="slot-empty">空</div>
                  </div>
                </div>

                <div class="ship-total-stats panel-sub">
                  <h5>飞船总属性</h5>
                  <div class="grid-stats">
                    <div class="stat-item"><span class="stat-label">总攻击</span><span class="stat-value">{{ ship?.total_attack || 0 }}</span></div>
                    <div class="stat-item"><span class="stat-label">总防御</span><span class="stat-value">{{ ship?.total_defense || 0 }}</span></div>
                    <div class="stat-item"><span class="stat-label">护盾上限</span><span class="stat-value">{{ ship?.total_max_shield || 0 }}</span></div>
                    <div class="stat-item"><span class="stat-label">船体上限</span><span class="stat-value">{{ ship?.total_max_hull || 0 }}</span></div>
                    <div class="stat-item"><span class="stat-label">护盾恢复</span><span class="stat-value">{{ ship?.total_shield_regen || 0 }}</span></div>
                    <div class="stat-item"><span class="stat-label">闪避率</span><span class="stat-value">{{ ship?.total_evasion || 0 }}%</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="inventory-list panel">
              <div class="panel-title">
                <h3>◆ 背包 ({{ inventoryEquipment.length }} 件装备 + {{ inventoryItems.length }} 件道具)</h3>
              </div>
              <div class="panel-body inv-body">
                <div v-if="inventoryEquipment.length === 0 && inventoryItems.length === 0" class="empty-state">
                  <div class="empty-state-icon">📦</div>
                  <p>背包是空的，去商店看看吧</p>
                </div>
                <div v-else>
                  <h5 v-if="inventoryEquipment.length" class="inv-section-title">装备</h5>
                  <div v-if="inventoryEquipment.length" class="inv-grid">
                    <div
                      v-for="inv in inventoryEquipment"
                      :key="'eq'+inv.id"
                      class="inv-card"
                      :class="`rarity-${inv.rarity}`"
                    >
                      <div class="inv-card-top">
                        <span class="inv-icon" :class="`slot-${inv.slot_type}`">{{ slotIcon(inv.slot_type) }}</span>
                        <div class="inv-info">
                          <div class="inv-name" :class="`text-rarity-${inv.rarity}`">{{ inv.name }}</div>
                          <div class="inv-meta">{{ slotName(inv.slot_type) }} · T{{ inv.tier }}</div>
                        </div>
                      </div>
                      <div class="inv-stats">
                        <span v-if="inv.attack_bonus" class="positive small">攻+{{ inv.attack_bonus }}</span>
                        <span v-if="inv.defense_bonus" class="positive small">防+{{ inv.defense_bonus }}</span>
                        <span v-if="inv.shield_bonus" class="positive small">盾+{{ inv.shield_bonus }}</span>
                        <span v-if="inv.hull_bonus" class="positive small">体+{{ inv.hull_bonus }}</span>
                      </div>
                      <div class="inv-actions">
                        <span class="qty">×{{ inv.quantity }}</span>
                        <div class="btn-group">
                          <button
                            v-if="!inv.is_equipped"
                            class="btn btn-primary btn-sm"
                            @click="equipItem(inv.inventory_id)"
                          >装备</button>
                          <span v-else class="equip-tag">已装备</span>
                          <button
                            v-if="!inv.is_equipped"
                            class="btn btn-danger btn-sm"
                            @click="sellInventory(inv.inventory_id, inv.quantity)"
                          >卖</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h5 v-if="inventoryItems.length" class="inv-section-title">道具</h5>
                  <div v-if="inventoryItems.length" class="inv-grid">
                    <div
                      v-for="inv in inventoryItems"
                      :key="'it'+inv.id"
                      class="inv-card item-card"
                      :class="`rarity-${inv.rarity}`"
                    >
                      <div class="inv-card-top">
                        <span class="inv-icon" :class="`slot-${inv.cat_type}`">{{ catIcon(inv.cat_type) }}</span>
                        <div class="inv-info">
                          <div class="inv-name" :class="`text-rarity-${inv.rarity}`">{{ inv.name }}</div>
                          <div class="inv-meta">{{ catName(inv.cat_type) }}</div>
                        </div>
                      </div>
                      <div class="inv-stats">
                        <span v-if="inv.heal_hull" class="positive small">船体+{{ inv.heal_hull }}</span>
                        <span v-if="inv.heal_shield" class="positive small">护盾+{{ inv.heal_shield }}</span>
                        <span v-if="inv.damage_bonus" class="positive small">攻击+{{ inv.damage_bonus }}</span>
                      </div>
                      <div class="inv-actions">
                        <span class="qty">×{{ inv.quantity }}</span>
                        <div class="btn-group">
                          <button
                            class="btn btn-danger btn-sm"
                            @click="sellInventory(inv.inventory_id, inv.quantity)"
                          >全部出售</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <Transition name="toast-fade">
      <div v-if="toast" class="toast" :class="toast.type === 'error' ? 'toast-error' : ''">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { api } from '../api'

const router = useRouter()
const store = useGameStore()

const bgCanvasRef = ref(null)
const activeTab = ref('missions')
const shopCat = ref('weapon')
const availableMissions = ref([])
const shopInventory = ref({ equipment: [], items: [] })
const inCombat = ref(false)

const tabs = [
  { key: 'missions', name: '任务板', icon: '📋', check: 'has_mission_board' },
  { key: 'shop', name: '商店', icon: '🛒', check: 'has_shop' },
  { key: 'repair', name: '维修站', icon: '🔧', check: 'has_repair' },
  { key: 'equipment', name: '装备', icon: '⚙', check: null },
]

const shopCategories = [
  { key: 'weapon', name: '武器系统', icon: '⚔' },
  { key: 'shield', name: '护盾发生器', icon: '🛡' },
  { key: 'hull', name: '船体装甲', icon: '🔩' },
  { key: 'engine', name: '推进引擎', icon: '🚀' },
  { key: 'consumable', name: '修复补给', icon: '💊' },
  { key: 'battle', name: '战斗道具', icon: '💥' },
]
const slotDefs = [
  { key: 'weapon', name: '主武器', icon: '⚔' },
  { key: 'shield', name: '护盾发生器', icon: '🛡' },
  { key: 'hull', name: '船体装甲', icon: '🔩' },
  { key: 'engine', name: '推进引擎', icon: '🚀' },
]

const toast = computed(() => store.toast)
const player = computed(() => store.player)
const ship = computed(() => store.ship)
const credits = computed(() => store.credits)
const planet = computed(() => store.currentPlanet)
const activeMission = computed(() => store.activeMission)
const inventoryEquipment = computed(() => store.equipment || [])
const inventoryItems = computed(() => store.items || [])

const shieldPercent = computed(() => {
  const s = ship.value; if (!s) return 0
  return Math.max(0, Math.min(100, s.current_shield / s.total_max_shield * 100))
})
const hullPercent = computed(() => {
  const s = ship.value; if (!s) return 0
  return Math.max(0, Math.min(100, s.current_hull / s.total_max_hull * 100))
})
const shieldMissing = computed(() => Math.max(0, (ship.value?.total_max_shield || 0) - (ship.value?.current_shield || 0)))
const hullDamage = computed(() => Math.max(0, (ship.value?.total_max_hull || 0) - (ship.value?.current_hull || 0)))
const shieldCost = computed(() => shieldMissing.value * 1)
const hullCost = computed(() => hullDamage.value * 3)
const totalRepairCost = computed(() => shieldCost.value + hullCost.value)

const factionName = computed(() => {
  const f = planet.value?.faction; const m = { military: '联邦军方管制区', pirate: '海盗控制区', corporate: '企业殖民地', neutral: '中立自由区', ruin: '未知遗迹' }
  return m[f] || '未知区域'
})

const shopCatTitle = computed(() => shopCategories.find(c => c.key === shopCat.value)?.name || '')
const shopHint = computed(() => {
  const f = planet.value?.faction
  const hints = { military: '军方产品: 武器装甲9折', pirate: '海盗特惠: 武器85折，稀有装备9折', corporate: '企业原产: 引擎9折' }
  return hints[f] || ''
})
const shopItems = computed(() => {
  const key = shopCat.value
  if (['consumable', 'battle'].includes(key)) return shopInventory.value.items?.filter(i => i.item_type === key) || []
  return shopInventory.value.equipment?.filter(e => e.slot_type === key) || []
})

function getCatCount(key) {
  if (['consumable', 'battle'].includes(key)) return (shopInventory.value.items?.filter(i => i.item_type === key) || []).length
  return (shopInventory.value.equipment?.filter(e => e.slot_type === key) || []).length
}

function tabAvailable(key) {
  const t = tabs.find(x => x.key === key)
  if (!t || !t.check) return true
  return !!planet.value?.[t.check]
}

function missionTypeName(t) {
  const m = { combat: '战斗', escort: '护送', recovery: '回收', smuggle: '走私', pirate: '劫掠', boss: 'BOSS狩猎' }
  return m[t] || t
}
function missionFactionName(f) {
  const m = { military: '军方发布', pirate: '海盗委托', corporate: '企业任务', neutral: '中立委托' }
  return m[f] || f
}
function rarityName(r) {
  const m = { common: '普通', uncommon: '优良', rare: '稀有' }
  return m[r] || r
}
function slotName(s) {
  const m = { weapon: '武器', shield: '护盾', hull: '装甲', engine: '引擎' }
  return m[s] || s
}
function slotIcon(s) {
  const m = { weapon: '⚔', shield: '🛡', hull: '🔩', engine: '🚀', consumable: '💊', battle: '💥' }
  return m[s] || '◇'
}
function catIcon(c) { return slotIcon(c) }
function catName(c) {
  const m = { consumable: '消耗品', battle: '战斗道具' }
  return m[c] || c
}
function itemIcon(item) {
  const s = item.slot_type || item.item_type
  return slotIcon(s)
}

function getEquippedItem(slotKey) {
  return inventoryEquipment.value.find(e => e.slot_type === slotKey && e.is_equipped)
}

function acceptMission(tplId) {
  api.acceptMission(store.saveId, tplId).then(async res => {
    if (res.code === 0) {
      store.showToast('任务已接取！')
      await loadMissions()
      await store.refreshState()
    } else store.showToast(res.message, 'error')
  })
}

function abandonMission() {
  if (!confirm('确定放弃当前任务？将扣除声望。')) return
  api.abandonMission(store.saveId).then(async res => {
    if (res.code === 0) {
      store.showToast('已放弃任务')
      await loadMissions()
      await store.refreshState()
    } else store.showToast(res.message, 'error')
  })
}

function loadMissions() {
  return api.getMissions(store.saveId).then(res => {
    if (res.code === 0) availableMissions.value = res.data.available_missions || []
  })
}
function loadShop() {
  return api.getShop(store.saveId).then(res => {
    if (res.code === 0) shopInventory.value = { equipment: res.data.equipment || [], items: res.data.items || [] }
  })
}

function buyItem(item) {
  const isEq = !!item.slot_type
  const fn = isEq ? api.buyEquipment(store.saveId, item.id) : api.buyItem(store.saveId, item.id, 1)
  fn.then(async res => {
    if (res.code === 0) {
      store.showToast(`已购买: ${item.name}`)
      shopInventory.value = { equipment: res.data.equipment || [], items: res.data.items || [] }
      await store.refreshState()
    } else store.showToast(res.message, 'error')
  })
}

function sellInventory(invId, qty) {
  if (!confirm(`以半价出售这件物品?`)) return
  api.sellItem(store.saveId, invId, qty).then(async res => {
    if (res.code === 0) {
      store.showToast('出售成功')
      shopInventory.value = { equipment: res.data.equipment || [], items: res.data.items || [] }
      await store.refreshState()
    } else store.showToast(res.message, 'error')
  })
}

async function equipItem(invId) {
  await store.equipItem(invId)
}
async function unequipItem(invId) {
  await store.unequipItem(invId)
}
async function doRepair() {
  await store.repairShip()
}

function startMissionCombat() {
  const mission = activeMission.value
  if (!mission) return
  if (mission.current_enemy_index >= mission.enemy_count) {
    completeActiveMission()
    return
  }
  inCombat.value = true
  api.getMissionEnemies(store.saveId).then(res => {
    if (res.code === 0) {
      store.setCombatState({ pending: true, missionId: mission.id, enemyIds: res.data.enemy_ids })
      router.push('/combat')
    } else store.showToast(res.message, 'error')
    inCombat.value = false
  })
}

function completeActiveMission() {
  api.completeMission(store.saveId).then(async res => {
    if (res.code === 0) {
      store.showToast(`✦ 任务完成！获得 ${res.data.reward_credits} 星币`)
      await store.refreshState()
      await loadMissions()
    } else store.showToast(res.message, 'error')
  })
}

function startCombatRandom() {
  const diff = planet.value?.danger_level || 1
  inCombat.value = true
  api.initCombat({ save_id: store.saveId, difficulty: diff }).then(res => {
    if (res.code === 0) {
      store.setCombatState(res.data)
      router.push('/combat')
    } else store.showToast(res.message, 'error')
    inCombat.value = false
  })
}

function backToMap() { router.push('/starmap') }

let bgAnim = null
function initBg() {
  const c = bgCanvasRef.value; if (!c) return
  const ctx = c.getContext('2d')
  function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)
  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random(), y: Math.random(), r: 0.3 + Math.random() * 1.2,
    a: 0.2 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2
  }))
  let t = 0
  function draw() {
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, c.width, c.height)
    const grad = ctx.createRadialGradient(c.width*0.5, c.height*0.3, 50, c.width*0.5, c.height*0.3, 700)
    grad.addColorStop(0, 'rgba(79, 209, 197, 0.06)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, c.width, c.height)
    t += 0.02
    stars.forEach(s => {
      const twinkle = 0.7 + 0.3 * Math.sin(t + s.phase)
      ctx.beginPath()
      ctx.arc(s.x * c.width, s.y * c.height, s.r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.globalAlpha = s.a * twinkle
      ctx.fill()
    })
    ctx.globalAlpha = 1
    bgAnim = requestAnimationFrame(draw)
  }
  draw()
}

onMounted(async () => {
  if (!store.saveId) {
    const sid = localStorage.getItem('current_save_id')
    if (!sid) { router.push('/'); return }
    store.saveId = Number(sid)
  }
  await store.refreshState()
  await loadMissions()
  await loadShop()
  initBg()

  if (store.combatState?.pending && store.combatState?.missionId) {
    const pending = store.combatState
    store.clearCombat()
    inCombat.value = true
    const initRes = await api.initCombat({
      save_id: store.saveId,
      enemy_ids: pending.enemyIds,
      mission_id: pending.missionId,
    })
    if (initRes.code === 0) {
      store.setCombatState(initRes.data)
      router.push('/combat')
    }
    inCombat.value = false
  }
})
onUnmounted(() => {
  if (bgAnim) cancelAnimationFrame(bgAnim)
})
</script>

<style scoped>
.station-page {
  min-height: 100vh;
  position: relative;
  background: var(--bg-deep);
  color: var(--text-primary);
}
.station-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}
.station-bg canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.station-header {
  position: relative;
  z-index: 5;
  padding: 20px 30px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 20px;
  background: linear-gradient(180deg, var(--bg-glass), transparent);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--border-subtle);
}
.header-left { display: flex; align-items: center; gap: 20px; }
.header-center { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.header-right { display: flex; justify-content: flex-end; gap: 12px; }
.header-title { display: flex; align-items: center; gap: 14px; }
.st-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-glow);
  font-size: 22px;
  color: var(--accent-cyan);
  box-shadow: var(--shadow-glow-cyan);
}
.header-title h2 { font-size: 20px; letter-spacing: 0.08em; margin-bottom: 3px; }
.sub-info { display: flex; align-items: center; gap: 10px; }
.danger-text { font-size: 11px; color: var(--text-dim); letter-spacing: 0.08em; }
.danger-text .active { color: var(--accent-gold); }

.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  padding: 6px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  min-width: 88px;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.stat-chip.military { border-color: rgba(99, 179, 237, 0.3); }
.stat-chip.military .chip-val { color: var(--accent-blue); }
.stat-chip.pirate { border-color: rgba(252, 129, 129, 0.3); }
.stat-chip.pirate .chip-val { color: #fc8181; }
.stat-chip.bounty { border-color: rgba(229, 62, 62, 0.4); animation: pulse-glow 2s infinite; color: var(--accent-red); }
.stat-chip.bounty .chip-val { color: var(--accent-red); }
.chip-label { font-size: 9px; color: var(--text-dim); letter-spacing: 0.15em; text-transform: uppercase; font-family: var(--font-title); }
.chip-val { font-weight: 700; font-size: 14px; margin-top: 2px; }

.tabs-bar {
  position: relative; z-index: 5;
  display: flex; gap: 2px; justify-content: center;
  padding: 10px 30px 0;
}
.tab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 26px;
  background: var(--bg-glass-light);
  border: 1px solid var(--border-subtle);
  border-bottom: none;
  font-family: var(--font-title);
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 0px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 0px));
  position: relative;
}
.tab-btn:hover:not(.disabled) { color: var(--accent-cyan); border-color: var(--border-glow); }
.tab-btn.active {
  background: var(--bg-glass);
  color: var(--accent-cyan);
  border-color: var(--border-glow);
  border-bottom: 1px solid var(--bg-glass);
  z-index: 2;
  margin-bottom: -1px;
}
.tab-btn.disabled { opacity: 0.4; cursor: not-allowed; }
.tab-icon { font-size: 16px; }

.tab-content-wrap {
  position: relative;
  z-index: 4;
  padding: 0 30px 40px;
}
.tab-panel { min-height: calc(100vh - 200px); }

.missions-tab { display: flex; flex-direction: column; gap: 20px; }
.active-mission-panel .active-card { border-color: var(--accent-gold); background: rgba(214, 158, 46, 0.05); }
.mission-count, .mission-count { font-size: 12px; color: var(--text-dim); }
.mission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.mission-card {
  padding: 18px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mission-card:hover:not(.active-card) { border-color: var(--border-glow); transform: translateY(-2px); }
.mission-card.faction-military { border-left: 3px solid var(--accent-blue); }
.mission-card.faction-pirate { border-left: 3px solid var(--accent-red); }
.mission-card.faction-corporate { border-left: 3px solid var(--accent-purple); }
.mission-card.faction-neutral { border-left: 3px solid var(--text-dim); }
.mission-top { display: flex; justify-content: space-between; align-items: flex-start; }
.mission-name { font-family: var(--font-title); font-size: 15px; color: var(--text-bright); letter-spacing: 0.05em; font-weight: 700; }
.mission-type { font-size: 10px; color: var(--text-dim); letter-spacing: 0.1em; padding: 3px 8px; background: var(--bg-tertiary); border-radius: 2px; }
.mission-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.difficulty { color: var(--text-dim); letter-spacing: 3px; }
.difficulty .active { color: var(--accent-gold); }
.enemies-count { font-size: 11px; color: var(--text-secondary); }
.mission-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.7; padding: 10px; background: var(--bg-secondary); border-radius: 4px; }
.mission-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 8px; }
.mission-progress { margin: 10px 0; }
.progress-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-dim); margin-bottom: 5px; font-family: var(--font-title); letter-spacing: 0.08em; }
.progress-bar { height: 10px; background: var(--bg-deep); border: 1px solid var(--border-subtle); overflow: hidden; border-radius: 2px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-gold), var(--accent-orange)); transition: width 0.3s ease; box-shadow: 0 0 10px rgba(214,158,46,0.3); }
.mission-rewards {
  display: flex; gap: 14px; flex-wrap: wrap;
  padding: 10px; background: var(--bg-secondary); border-radius: 4px;
}
.reward { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
.reward-label { color: var(--text-dim); font-weight: 400; font-family: var(--font-title); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
.positive { color: var(--accent-green); }
.negative { color: var(--accent-red); }

.shop-tab { display: grid; grid-template-columns: 220px 1fr; gap: 20px; }
.shop-sidebar .cat-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
  transition: all 0.15s ease;
  font-size: 13px;
}
.shop-sidebar .cat-item:hover { background: var(--bg-secondary); color: var(--text-bright); }
.shop-sidebar .cat-item.active { background: var(--bg-tertiary); color: var(--accent-cyan); border-left: 3px solid var(--accent-cyan); }
.cat-icon { font-size: 16px; width: 22px; text-align: center; }
.cat-count { margin-left: auto; padding: 2px 8px; background: var(--bg-deep); font-size: 11px; color: var(--text-dim); border-radius: 10px; }
.shop-hint { font-size: 11px; color: var(--accent-cyan); font-style: italic; }
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}
.shop-card {
  padding: 16px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  display: flex; flex-direction: column; gap: 10px;
  transition: all 0.2s ease;
}
.shop-card:hover { transform: translateY(-2px); border-color: var(--border-glow); }
.shop-card.rarity-uncommon { border-top: 2px solid var(--accent-green); }
.shop-card.rarity-rare { border-top: 2px solid var(--accent-purple); box-shadow: 0 0 20px rgba(183,148,244,0.1); }
.shop-card-top { display: flex; gap: 12px; align-items: center; }
.item-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.item-icon.slot-weapon { color: var(--accent-red); }
.item-icon.slot-shield { color: var(--accent-blue); }
.item-icon.slot-hull { color: var(--accent-orange); }
.item-icon.slot-engine { color: var(--accent-purple); }
.item-icon.slot-consumable { color: var(--accent-green); }
.item-icon.slot-battle { color: var(--accent-gold); }
.item-info-top { flex: 1; min-width: 0; }
.item-name { font-family: var(--font-title); font-size: 14px; color: var(--text-bright); font-weight: 600; margin-bottom: 3px; }
.item-desc { font-size: 11px; color: var(--text-dim); line-height: 1.6; min-height: 32px; }
.item-stats { display: flex; gap: 12px; flex-wrap: wrap; padding: 8px; background: var(--bg-secondary); border-radius: 4px; }
.istat { display: flex; gap: 6px; font-size: 11px; }
.istat span:first-child { color: var(--text-dim); }
.item-spec {
  font-size: 11px;
  padding: 8px;
  background: rgba(183, 148, 244, 0.08);
  border-left: 2px solid var(--accent-purple);
  color: var(--accent-purple);
  border-radius: 2px;
  line-height: 1.5;
}
.spec-label { margin-right: 4px; color: var(--accent-purple); }
.item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--border-subtle); }
.item-price { font-size: 12px; color: var(--text-secondary); }

.repair-panel { max-width: 900px; margin: 0 auto; }
.repair-preview { display: grid; grid-template-columns: 280px 1fr; gap: 30px; align-items: center; }
.ship-svg { width: 100%; height: auto; filter: drop-shadow(0 10px 30px rgba(79, 209, 197, 0.15)); }
.damage-dot { animation: pulse-glow 1.8s infinite; color: var(--accent-red); }
.repair-stats { display: flex; flex-direction: column; gap: 18px; }
.repair-bar-wrap { display: flex; flex-direction: column; gap: 6px; }
.bar-label { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
.bar-hp { height: 14px; }
.repair-val { font-size: 11px; color: var(--text-dim); display: flex; justify-content: space-between; }
.cost { color: var(--accent-gold); font-weight: 700; }
.total-repair {
  margin-top: 6px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-glow);
  text-align: center;
}
.total-label { font-family: var(--font-title); font-size: 12px; color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 6px; }
.total-cost { display: flex; align-items: center; justify-content: center; gap: 10px; }
.total-cost .credits.big { font-size: 28px; font-weight: 900; font-family: var(--font-title); }
.status-ok { color: var(--accent-green); font-weight: 700; font-family: var(--font-title); letter-spacing: 0.08em; }

.equip-layout { display: grid; grid-template-columns: 360px 1fr; gap: 20px; }
.ship-slot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.ship-slot {
  padding: 14px;
  background: var(--bg-deep);
  border: 1px dashed var(--border-subtle);
  min-height: 110px;
  display: flex; flex-direction: column; gap: 6px;
  transition: all 0.2s ease;
}
.ship-slot:hover { border-color: var(--border-glow); }
.ship-slot.empty { background: repeating-linear-gradient(45deg, var(--bg-deep), var(--bg-deep) 8px, var(--bg-secondary) 8px, var(--bg-secondary) 16px); }
.slot-icon { font-size: 20px; color: var(--accent-cyan); }
.slot-label { font-family: var(--font-title); font-size: 11px; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; }
.slot-item { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
.si-name { font-size: 13px; font-weight: 600; }
.slot-empty { font-size: 14px; color: var(--text-dim); opacity: 0.4; margin: auto; font-weight: 700; }

.panel-sub { padding-top: 16px; border-top: 1px solid var(--border-subtle); margin-top: 8px; }
.panel-sub h5, .inv-section-title { font-family: var(--font-title); font-size: 12px; color: var(--accent-cyan); letter-spacing: 0.1em; margin-bottom: 12px; }
.inv-section-title { margin-top: 20px; margin-bottom: 10px; padding-top: 10px; border-top: 1px dashed var(--border-subtle); }
.inv-section-title:first-child { margin-top: 0; padding-top: 0; border-top: none; }

.inv-body { max-height: 68vh; overflow-y: auto; }
.inv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.inv-card {
  padding: 12px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  display: flex; flex-direction: column; gap: 10px;
}
.inv-card.rarity-uncommon { border-left: 3px solid var(--accent-green); }
.inv-card.rarity-rare { border-left: 3px solid var(--accent-purple); }
.inv-card-top { display: flex; gap: 10px; align-items: center; }
.inv-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  font-size: 18px; flex-shrink: 0;
}
.inv-icon.slot-weapon { color: var(--accent-red); }
.inv-icon.slot-shield { color: var(--accent-blue); }
.inv-icon.slot-hull { color: var(--accent-orange); }
.inv-icon.slot-engine { color: var(--accent-purple); }
.inv-icon.slot-consumable { color: var(--accent-green); }
.inv-icon.slot-battle { color: var(--accent-gold); }
.inv-name { font-size: 13px; font-weight: 600; }
.inv-meta { font-size: 10px; color: var(--text-dim); margin-top: 2px; letter-spacing: 0.05em; }
.inv-stats { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; }
.small { font-size: 11px; }
.inv-actions { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px; border-top: 1px dashed var(--border-subtle); }
.qty { font-size: 12px; font-weight: 700; color: var(--accent-gold); }
.btn-group { display: flex; gap: 6px; align-items: center; }
.equip-tag { font-size: 11px; color: var(--accent-cyan); font-weight: 700; font-family: var(--font-title); letter-spacing: 0.05em; }

.text-rarity-common { color: var(--text-primary); }
.text-rarity-uncommon { color: var(--accent-green); }
.text-rarity-rare { color: var(--accent-purple); }

.fade-tab-enter-active, .fade-tab-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-tab-enter-from, .fade-tab-leave-to { opacity: 0; transform: translateY(8px); }

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, -20px); }

@media (max-width: 960px) {
  .station-header { grid-template-columns: 1fr; }
  .shop-tab { grid-template-columns: 1fr; }
  .equip-layout { grid-template-columns: 1fr; }
  .repair-preview { grid-template-columns: 1fr; }
  .tabs-bar { overflow-x: auto; justify-content: flex-start; }
}
</style>
