<template>
  <div class="combat-page">
    <div class="combat-bg">
      <canvas ref="bgCanvasRef"></canvas>
    </div>

    <div class="combat-top-hud">
      <div class="turn-info">
        <div class="turn-label">回合</div>
        <div class="turn-num">{{ combatState?.turn || 1 }}</div>
      </div>
      <div class="phase-info" :class="combatState?.phase">
        <span v-if="combatState?.phase === 'player'">◆ 你的回合</span>
        <span v-else>◇ 敌方回合</span>
      </div>
      <button class="btn btn-sm btn-danger" @click="confirmFlee" :disabled="busy">
        ✕ 脱离战斗
      </button>
    </div>

    <div class="battlefield">
      <div class="ship-side player-side" :class="{'shake': playerShake}">
        <div class="ship-display">
          <ShieldedShip
            :max-hull="combatState?.player?.max_hull || 1"
            :current-hull="combatState?.player?.current_hull || 0"
            :max-shield="combatState?.player?.max_shield || 1"
            :current-shield="combatState?.player?.current_shield || 0"
            :is-player="true"
            :label="combatState?.player?.ship_name || '破船号'"
            :extra-buffs="playerBuffs"
            :extra-debuffs="playerDebuffs"
          />
        </div>
        <div class="ship-stats-panel">
          <div class="stat-chip">
            <span class="label">攻击</span>
            <span class="val">{{ totalPlayerAttack }}</span>
          </div>
          <div class="stat-chip">
            <span class="label">防御</span>
            <span class="val">{{ totalPlayerDefense }}</span>
          </div>
          <div class="stat-chip">
            <span class="label">闪避</span>
            <span class="val">{{ playerEvasion }}%</span>
          </div>
        </div>
      </div>

      <div class="battle-center">
        <div class="vs-label">⚡</div>
      </div>

      <div class="ship-side enemies-side">
        <div class="enemies-list">
          <div
            v-for="(enemy, idx) in combatState?.enemies || []"
            :key="idx"
            class="enemy-card"
            :class="{
              'is-target': idx === currentEnemyIdx && !enemy.is_dead,
              'is-dead': enemy.is_dead,
              'shake': shakingEnemies[idx]
            }"
            @click="!enemy.is_dead && (currentEnemyIdx = idx)"
          >
            <ShieldedShip
              :max-hull="enemy.max_hull"
              :current-hull="enemy.current_hull"
              :max-shield="enemy.max_shield"
              :current-shield="enemy.current_shield"
              :is-player="false"
              :label="enemy.name"
              :ship-type="enemy.ship_type"
              :extra-buffs="enemy.buffs"
              :extra-debuffs="enemy.debuffs"
              :difficulty="enemy.difficulty"
              :is-dead="enemy.is_dead"
            />
            <div class="enemy-bottom">
              <div class="enemy-stats">
                <span title="攻击">⚔{{ enemy.attack }}</span>
                <span title="防御">🛡{{ enemy.defense }}</span>
              </div>
              <div class="target-badge" v-if="idx === currentEnemyIdx && !enemy.is_dead">◉ 目标</div>
              <div class="dead-badge" v-if="enemy.is_dead">✕ 已摧毁</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-area panel">
      <div class="action-tabs">
        <button
          v-for="tab in actionTabs"
          :key="tab.key"
          class="action-tab-btn"
          :class="{active: actionTab === tab.key}"
          @click="actionTab = tab.key"
          :disabled="!isPlayerTurn"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
        </button>
      </div>

      <div class="action-content">
        <div v-if="actionTab === 'attack'" class="action-panel attack-panel">
          <div class="info-hint">选择目标敌舰，然后发动常规攻击</div>
          <div class="target-selector">
            <div
              v-for="(enemy, idx) in aliveEnemies"
              :key="enemy._idx"
              class="target-option"
              :class="{active: currentEnemyIdx === enemy._idx}"
              @click="currentEnemyIdx = enemy._idx"
            >
              <div class="target-icon">🎯</div>
              <div class="target-info">
                <div class="target-name">{{ enemy.name }}</div>
                <div class="target-hp">护盾 {{ enemy.current_shield }}/{{ enemy.max_shield }} · 船体 {{ enemy.current_hull }}/{{ enemy.max_hull }}</div>
              </div>
              <div v-if="currentEnemyIdx === enemy._idx" class="check-mark">✓</div>
            </div>
          </div>
          <button
            class="btn btn-danger btn-lg btn-block action-btn"
            :disabled="!isPlayerTurn || busy"
            @click="doAttack"
          >
            ⚔ 发动攻击
          </button>
        </div>

        <div v-else-if="actionTab === 'defend'" class="action-panel defend-panel">
          <div class="defend-desc">
            <div class="big-icon">🛡</div>
            <h3>进入防御姿态</h3>
            <p>本回合防御力翻倍，大幅减少受到的伤害</p>
            <div class="effect-info">
              <div class="eff">+{{ playerDef }} 防御 (翻倍)</div>
            </div>
          </div>
          <button
            class="btn btn-blue btn-lg btn-block action-btn"
            :disabled="!isPlayerTurn || busy"
            @click="doDefend"
          >
            🛡 全舰防御
          </button>
        </div>

        <div v-else-if="actionTab === 'skill'" class="action-panel skill-panel">
          <div v-if="availableSkills.length === 0" class="empty-state small">
            <div class="empty-state-icon">✨</div>
            <p>没有可用技能</p>
          </div>
          <div v-else class="skill-list">
            <div
              v-for="skill in availableSkills"
              :key="skill.id"
              class="skill-card"
              :class="{oncd: getSkillCd(skill.id) > 0}"
              @click="useSkill(skill)"
            >
              <div class="skill-top">
                <div class="skill-icon" :class="skill.skill_type">
                  {{ skillIcon(skill.skill_type) }}
                </div>
                <div class="skill-info">
                  <div class="skill-name">{{ skill.name }}</div>
                  <div class="skill-meta">
                    <span class="type-tag" :class="skill.skill_type">{{ skillTypeName(skill.skill_type) }}</span>
                    <span class="cd-tag" v-if="getSkillCd(skill.id) > 0">⏱ 冷却: {{ getSkillCd(skill.id) }}</span>
                    <span class="cd-tag ready" v-else>✓ 就绪</span>
                  </div>
                </div>
              </div>
              <p class="skill-desc">{{ skill.description }}</p>
              <div class="skill-effects">
                <span v-if="skill.damage_multiplier > 1" class="eff">伤害 ×{{ skill.damage_multiplier }}</span>
                <span v-if="skill.flat_damage" class="eff">附加 {{ skill.flat_damage }} 伤害</span>
                <span v-if="skill.heal_shield" class="eff">恢复护盾 +{{ skill.heal_shield }}</span>
                <span v-if="skill.heal_hull" class="eff">修复船体 +{{ skill.heal_hull }}</span>
                <span v-if="skill.defense_buff" class="eff">防御 +{{ skill.defense_buff }}</span>
                <span v-if="skill.evasion_buff" class="eff">闪避 +{{ skill.evasion_buff }}%</span>
                <span v-if="skill.stun_chance" class="eff">{{ skill.stun_chance }}% 瘫痪</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="actionTab === 'item'" class="action-panel item-panel">
          <div v-if="availableItems.length === 0" class="empty-state small">
            <div class="empty-state-icon">💊</div>
            <p>背包中没有可用道具</p>
          </div>
          <div v-else class="item-list">
            <div
              v-for="item in availableItems"
              :key="item.inventory_id"
              class="item-card"
              @click="useItem(item)"
            >
              <div class="item-top">
                <div class="item-icon">{{ itemIconType(item) }}</div>
                <div class="item-info-m">
                  <div class="item-name-m">{{ item.name }}</div>
                  <div class="item-qty">×{{ item.quantity }}</div>
                </div>
              </div>
              <p class="item-desc-m">{{ item.description }}</p>
              <div class="item-effects-m">
                <span v-if="item.heal_hull" class="eff">船体 +{{ item.heal_hull }}</span>
                <span v-if="item.heal_shield" class="eff">护盾 +{{ item.heal_shield }}</span>
                <span v-if="item.damage_bonus" class="eff">临时攻击 +{{ item.damage_bonus }}</span>
                <span v-if="item.defense_bonus" class="eff">临时防御 +{{ item.defense_bonus }}</span>
                <span v-if="item.special_effect" class="eff special">{{ item.special_effect }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="log-panel panel">
      <div class="panel-title small">
        <h3>◆ 战斗日志</h3>
        <span class="turn-tag">T{{ combatState?.turn || 1 }}</span>
      </div>
      <div class="panel-body log-body" ref="logBodyRef">
        <div
          v-for="(line, idx) in combatState?.log || []"
          :key="idx"
          class="log-line"
          :class="logLineClass(line)"
        >
          <span class="log-bullet">›</span>
          <span>{{ line }}</span>
        </div>
      </div>
    </div>

    <Transition name="modal-fade">
      <div v-if="showResult" class="result-overlay" @click.self="closeResult">
        <div class="result-modal panel" :class="combatState?.victory ? 'victory' : 'defeat'">
          <div class="result-header">
            <div class="result-icon">{{ combatState?.victory ? '🏆' : '💥' }}</div>
            <h2 class="result-title">{{ combatState?.victory ? '战斗胜利' : '战斗失败' }}</h2>
            <p class="result-sub">
              {{ combatState?.victory ? '所有敌舰已被摧毁！' : '飞船严重受损，紧急撤离！' }}
            </p>
          </div>
          <div v-if="combatState?.victory && combatState?.rewards" class="result-rewards">
            <div class="reward-row">
              <span class="r-label">获得星币</span>
              <span class="credits r-val big">{{ combatState.rewards.credits }}</span>
            </div>
            <div class="reward-row" v-if="combatState.rewards.exp">
              <span class="r-label">经验值</span>
              <span class="r-val positive big">+{{ combatState.rewards.exp }}</span>
            </div>
          </div>
          <div class="result-actions">
            <button class="btn btn-primary btn-lg btn-block" @click="finishCombat">
              {{ combatState?.victory ? '✦ 领取战利品' : '返回空间站' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast-fade">
      <div v-if="toast" class="toast" :class="toast.type === 'error' ? 'toast-error' : ''">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import { api } from '../api'

const ShieldedShip = defineAsyncComponent(() => import('../components/ShieldedShip.vue'))

const router = useRouter()
const store = useGameStore()

const bgCanvasRef = ref(null)
const logBodyRef = ref(null)
const combatState = ref(null)
const actionTab = ref('attack')
const currentEnemyIdx = ref(0)
const busy = ref(false)
const showResult = ref(false)
const playerShake = ref(false)
const shakingEnemies = ref({})

const actionTabs = [
  { key: 'attack', name: '攻击', icon: '⚔' },
  { key: 'defend', name: '防御', icon: '🛡' },
  { key: 'skill', name: '技能', icon: '✨' },
  { key: 'item', name: '道具', icon: '💊' },
]

const toast = computed(() => store.toast)
const isPlayerTurn = computed(() => combatState.value?.phase === 'player' && !combatState.value?.is_over)
const aliveEnemies = computed(() =>
  (combatState.value?.enemies || [])
    .map((e, i) => ({ ...e, _idx: i }))
    .filter(e => !e.is_dead)
)
const availableSkills = computed(() => combatState.value?.skills || [])
const availableItems = computed(() => (combatState.value?.items || []).filter(i => i.quantity > 0))

const totalPlayerAttack = computed(() => {
  const p = combatState.value?.player; if (!p) return 0
  return p.attack + (p.buffs?.attack || 0)
})
const totalPlayerDefense = computed(() => {
  const p = combatState.value?.player; if (!p) return 0
  return p.defense + (p.buffs?.defense || 0) - (p.debuffs?.defense || 0)
})
const playerDef = computed(() => combatState.value?.player?.defense || 0)
const playerEvasion = computed(() => {
  const p = combatState.value?.player; if (!p) return 0
  return p.evasion + (p.buffs?.evasion || 0)
})
const playerBuffs = computed(() => combatState.value?.player?.buffs)
const playerDebuffs = computed(() => combatState.value?.player?.debuffs)

function getSkillCd(id) {
  return combatState.value?.player?.skill_cooldowns?.[id] || 0
}
function skillIcon(t) {
  const m = { attack: '⚡', defense: '🛡', heal: '💚', control: '⚡' }
  return m[t] || '✨'
}
function skillTypeName(t) {
  const m = { attack: '攻击型', defense: '防御型', heal: '恢复型', control: '控制型' }
  return m[t] || t
}
function itemIconType(item) {
  if (item.heal_hull > 0) return '🔧'
  if (item.heal_shield > 0) return '🔋'
  if (item.damage_bonus > 0) return '💥'
  if (item.defense_bonus > 0) return '🛡'
  return '📦'
}
function logLineClass(line) {
  if (line.includes('回合')) return 'turn-header'
  if (line.includes('摧毁') || line.includes('失败')) return 'critical'
  if (line.includes('胜利') || line.includes('获得')) return 'good'
  if (line.includes('瘫痪') || line.includes('削弱')) return 'debuff'
  if (line.includes('恢复') || line.includes('修复') || line.includes('提升')) return 'heal'
  return ''
}

async function submitAction(action, extra = {}) {
  if (!isPlayerTurn.value || busy.value) return
  busy.value = true
  const res = await api.combatAction({
    state: combatState.value,
    action,
    target_index: currentEnemyIdx.value,
    ...extra,
  })
  busy.value = false
  if (res.code !== 0) {
    store.showToast(res.message, 'error')
    return
  }
  applyState(res.data)
}

function applyState(state) {
  const oldEnemies = combatState.value?.enemies || []
  combatState.value = state
  const newEnemies = state.enemies || []
  newEnemies.forEach((e, i) => {
    if (oldEnemies[i] && oldEnemies[i].current_hull > (e.current_hull || 0)) {
      triggerEnemyShake(i)
    }
  })
  const oldPlayer = combatState.value ? null : null
  if (state.player && combatState.value) {
    // check player damage detected by comparing to previous state snapshot
  }
  nextTick(() => {
    const lb = logBodyRef.value
    if (lb) lb.scrollTop = lb.scrollHeight
  })
  if (state.is_over) {
    setTimeout(() => { showResult.value = true }, 600)
  } else {
    ensureAliveTarget()
  }
}

function ensureAliveTarget() {
  const enemies = combatState.value?.enemies || []
  if (enemies[currentEnemyIdx.value]?.is_dead) {
    const idx = enemies.findIndex(e => !e.is_dead)
    if (idx >= 0) currentEnemyIdx.value = idx
  }
}

function triggerEnemyShake(idx) {
  shakingEnemies.value[idx] = true
  setTimeout(() => {
    shakingEnemies.value = { ...shakingEnemies.value, [idx]: false }
  }, 400)
}

function doAttack() { submitAction('attack') }
function doDefend() { submitAction('defend') }
function useSkill(skill) {
  if (getSkillCd(skill.id) > 0) { store.showToast('技能冷却中', 'error'); return }
  submitAction('skill', { skill_id: skill.id })
}
function useItem(item) {
  if (item.quantity <= 0) { store.showToast('道具不足', 'error'); return }
  submitAction('item', { item_inventory_id: item.inventory_id })
}

async function confirmFlee() {
  if (!confirm('尝试紧急跃迁脱离战斗？将损失任务进度（如有）！')) return
  showResult.value = true
  combatState.value = { ...combatState.value, victory: false, is_over: true, rewards: null }
  await api.failMission(store.saveId)
}

async function finishCombat() {
  showResult.value = false
  if (combatState.value?.mission_id) {
    const defeatCount = (combatState.value?.enemies || []).filter(e => e.is_dead).length
    if (combatState.value.victory && defeatCount > 0) {
      await api.advanceMission(store.saveId, defeatCount)
    } else if (!combatState.value.victory) {
      await api.failMission(store.saveId)
    }
    const missionEnemies = await api.getMissionEnemies(store.saveId)
    await store.refreshState()
    if (combatState.value.victory && missionEnemies.code === 0 &&
        typeof missionEnemies.data?.new_index === 'number' &&
        store.activeMission &&
        missionEnemies.data.new_index >= store.activeMission.enemy_count) {
      const complete = await api.completeMission(store.saveId)
      if (complete.code === 0) {
        store.showToast(`✦ 任务完成！+${complete.data.reward_credits} 星币`)
      }
    }
  } else {
    await store.refreshState()
  }
  store.clearCombat()
  router.push('/station')
}

let bgAnim = null
function initBg() {
  const c = bgCanvasRef.value; if (!c) return
  const ctx = c.getContext('2d')
  function resize() { c.width = window.innerWidth; c.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)
  const stars = Array.from({ length: 350 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height,
    r: 0.3 + Math.random() * 1.5,
    a: 0.2 + Math.random() * 0.7,
    vy: 0.1 + Math.random() * 0.4,
    phase: Math.random() * Math.PI * 2,
  }))
  let t = 0
  function draw() {
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, c.width, c.height)
    const grad1 = ctx.createLinearGradient(0, 0, 0, c.height)
    grad1.addColorStop(0, 'rgba(79,209,197,0.03)')
    grad1.addColorStop(0.5, 'rgba(183,148,244,0.04)')
    grad1.addColorStop(1, 'rgba(229,62,62,0.03)')
    ctx.fillStyle = grad1
    ctx.fillRect(0, 0, c.width, c.height)
    t += 0.03
    stars.forEach(s => {
      s.y += s.vy
      if (s.y > c.height) { s.y = 0; s.x = Math.random() * c.width }
      const twinkle = 0.6 + 0.4 * Math.sin(t + s.phase)
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
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
  initBg()

  if (store.combatState && !store.combatState.pending) {
    combatState.value = store.combatState
    ensureAliveTarget()
  } else {
    router.push('/station')
    return
  }
})

onUnmounted(() => {
  if (bgAnim) cancelAnimationFrame(bgAnim)
  if (combatState.value && !combatState.value.is_over) {
    store.setCombatState(combatState.value)
  }
})
</script>

<style scoped>
.combat-page {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-deep);
}
.combat-bg {
  position: fixed; inset: 0; z-index: 0;
}
.combat-bg canvas { width: 100%; height: 100%; display: block; }

.combat-top-hud {
  position: relative; z-index: 10;
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(180deg, var(--bg-glass), transparent);
}
.turn-info {
  display: flex; flex-direction: column; align-items: flex-start;
  padding: 8px 18px;
  background: var(--bg-glass); backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.turn-label { font-size: 9px; color: var(--text-dim); letter-spacing: 0.2em; text-transform: uppercase; font-family: var(--font-title); }
.turn-num { font-family: var(--font-title); font-size: 28px; font-weight: 900; color: var(--accent-cyan); line-height: 1; }

.phase-info {
  justify-self: center;
  padding: 10px 26px;
  font-family: var(--font-title);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.15em;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.phase-info.player {
  background: rgba(79, 209, 197, 0.15);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  box-shadow: 0 0 30px rgba(79, 209, 197, 0.2);
  animation: pulse-glow 2s infinite;
}
.phase-info.enemy {
  background: rgba(229, 62, 62, 0.15);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  box-shadow: 0 0 30px rgba(229, 62, 62, 0.2);
}

.battlefield {
  position: relative; z-index: 5;
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  gap: 20px;
  padding: 10px 30px 20px;
  min-height: 360px;
  align-items: start;
}
.ship-side { display: flex; flex-direction: column; gap: 14px; }
.player-side { align-items: flex-start; }
.enemies-side { align-items: flex-end; }

.ship-display {
  max-width: 420px;
  width: 100%;
}
.ship-stats-panel {
  display: flex; gap: 10px;
  padding: 10px 16px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
}
.stat-chip {
  display: flex; flex-direction: column; align-items: center;
  min-width: 68px; padding: 4px 10px;
}
.stat-chip .label { font-size: 9px; color: var(--text-dim); letter-spacing: 0.15em; text-transform: uppercase; font-family: var(--font-title); }
.stat-chip .val { font-weight: 700; font-size: 15px; color: var(--accent-cyan); margin-top: 2px; }

.battle-center { display: flex; align-items: center; justify-content: center; height: 100%; }
.vs-label {
  font-size: 42px;
  opacity: 0.3;
  filter: drop-shadow(0 0 10px var(--accent-gold));
  animation: pulse-glow 1.5s infinite;
  color: var(--accent-gold);
}

.enemies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 480px;
}
.enemy-card {
  position: relative;
  padding: 12px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}
.enemy-card:hover:not(.is-dead) { border-color: rgba(229, 62, 62, 0.4); transform: translateX(-4px); }
.enemy-card.is-target:not(.is-dead) {
  border-color: var(--accent-red);
  box-shadow: 0 0 25px rgba(229, 62, 62, 0.25), inset 0 0 20px rgba(229, 62, 62, 0.05);
}
.enemy-card.is-target::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
  background: var(--accent-red);
  animation: pulse-glow 1s infinite;
}
.enemy-card.is-dead { opacity: 0.35; filter: grayscale(0.8); cursor: default; }
.enemy-bottom {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
}
.enemy-stats { display: flex; gap: 12px; font-size: 11px; color: var(--text-secondary); font-weight: 600; }
.target-badge {
  font-size: 10px;
  padding: 3px 10px;
  background: rgba(229, 62, 62, 0.15);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
  font-family: var(--font-title);
  letter-spacing: 0.08em;
  font-weight: 700;
}
.dead-badge {
  font-size: 10px;
  padding: 3px 10px;
  background: rgba(113, 128, 150, 0.15);
  color: var(--text-dim);
  font-family: var(--font-title);
  letter-spacing: 0.08em;
}

.shake { animation: shake 0.4s ease; }

.action-area {
  position: relative; z-index: 8;
  margin: 0 30px 20px;
  padding: 0;
  overflow: hidden;
}
.action-tabs {
  display: flex;
  padding: 0;
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-secondary);
}
.action-tab-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 18px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-dim);
  transition: all 0.2s ease;
}
.action-tab-btn:hover:not(:disabled) { color: var(--text-primary); background: var(--bg-tertiary); }
.action-tab-btn.active {
  color: var(--accent-cyan);
  border-bottom-color: var(--accent-cyan);
  background: var(--bg-glass-light);
}
.action-tab-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tab-icon { font-size: 18px; }

.action-content { padding: 20px; min-height: 190px; }
.info-hint {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: var(--bg-deep);
  border-left: 3px solid var(--accent-cyan);
  font-size: 12px;
  color: var(--text-secondary);
}

.target-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}
.target-option {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}
.target-option:hover { border-color: var(--accent-red); }
.target-option.active {
  border-color: var(--accent-red);
  background: rgba(229, 62, 62, 0.08);
  box-shadow: 0 0 15px rgba(229, 62, 62, 0.15);
}
.target-icon { font-size: 22px; }
.target-name { font-size: 13px; font-weight: 700; color: var(--text-bright); margin-bottom: 3px; }
.target-hp { font-size: 10px; color: var(--text-dim); }
.check-mark { color: var(--accent-green); font-weight: 900; font-size: 18px; }

.action-btn { margin-top: 4px; }

.defend-desc {
  text-align: center; padding: 10px 20px 20px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.defend-desc .big-icon { font-size: 54px; filter: drop-shadow(0 0 20px var(--accent-blue)); }
.defend-desc h3 { font-size: 18px; color: var(--accent-blue); letter-spacing: 0.1em; }
.defend-desc p { color: var(--text-secondary); font-size: 13px; }
.effect-info { display: flex; gap: 18px; margin: 6px 0; }
.effect-info .eff {
  padding: 6px 16px;
  background: var(--bg-deep);
  border: 1px solid rgba(99, 179, 237, 0.3);
  color: var(--accent-blue);
  font-weight: 700;
  font-size: 13px;
  font-family: var(--font-title);
}

.skill-list, .item-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.skill-card, .item-card {
  padding: 14px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex; flex-direction: column; gap: 10px;
}
.skill-card:hover, .item-card:hover { border-color: var(--border-glow); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
.skill-card.oncd { opacity: 0.5; cursor: not-allowed; filter: grayscale(0.3); }
.skill-top, .item-top { display: flex; gap: 12px; align-items: center; }
.skill-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  font-size: 22px;
  flex-shrink: 0;
}
.skill-icon.attack { color: var(--accent-red); }
.skill-icon.defense { color: var(--accent-blue); }
.skill-icon.heal { color: var(--accent-green); }
.skill-icon.control { color: var(--accent-purple); }
.skill-info, .item-info-m { flex: 1; min-width: 0; }
.skill-name, .item-name-m { font-family: var(--font-title); font-size: 14px; font-weight: 700; color: var(--text-bright); margin-bottom: 3px; }
.skill-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.type-tag {
  font-size: 9px;
  padding: 2px 8px;
  background: var(--bg-secondary);
  letter-spacing: 0.1em;
  font-family: var(--font-title);
  color: var(--text-dim);
}
.type-tag.attack { color: var(--accent-red); background: rgba(229,62,62,0.1); }
.type-tag.defense { color: var(--accent-blue); background: rgba(99,179,237,0.1); }
.type-tag.heal { color: var(--accent-green); background: rgba(104,211,145,0.1); }
.type-tag.control { color: var(--accent-purple); background: rgba(183,148,244,0.1); }
.cd-tag {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-title);
  letter-spacing: 0.08em;
  color: var(--accent-red);
}
.cd-tag.ready { color: var(--accent-green); }

.skill-desc, .item-desc-m {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border-radius: 2px;
}
.skill-effects, .item-effects-m {
  display: flex; gap: 8px; flex-wrap: wrap;
  margin-top: auto;
}
.skill-effects .eff, .item-effects-m .eff {
  font-size: 10px;
  padding: 3px 8px;
  background: var(--bg-secondary);
  color: var(--accent-cyan);
  font-weight: 600;
  border: 1px solid var(--border-subtle);
}
.item-effects-m .eff.special {
  color: var(--accent-purple);
  border-color: rgba(183,148,244,0.3);
}
.item-icon {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  font-size: 18px; flex-shrink: 0;
}
.item-qty { font-size: 12px; color: var(--accent-gold); font-weight: 700; }

.log-panel {
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 9;
  width: 280px;
  max-height: 380px;
  display: flex;
  flex-direction: column;
}
.panel-title.small {
  padding: 10px 16px;
}
.panel-title.small h3 { font-size: 12px; }
.turn-tag {
  font-size: 11px;
  color: var(--accent-cyan);
  font-family: var(--font-title);
  font-weight: 700;
  letter-spacing: 0.1em;
}
.log-body {
  overflow-y: auto;
  flex: 1;
  padding: 12px 16px;
  max-height: 300px;
}
.log-line {
  font-size: 11px;
  line-height: 1.7;
  padding: 3px 0;
  color: var(--text-secondary);
  display: flex;
  gap: 6px;
  align-items: flex-start;
  border-bottom: 1px dashed rgba(160, 174, 192, 0.05);
}
.log-bullet { color: var(--text-dim); flex-shrink: 0; }
.log-line.turn-header {
  font-family: var(--font-title);
  font-weight: 700;
  color: var(--accent-gold);
  margin: 8px 0 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}
.log-line.critical { color: var(--accent-red); font-weight: 700; }
.log-line.good { color: var(--accent-green); font-weight: 600; }
.log-line.heal { color: var(--accent-cyan); }
.log-line.debuff { color: var(--accent-purple); }

.empty-state.small { padding: 40px 20px; }
.empty-state.small .empty-state-icon { font-size: 32px; margin-bottom: 8px; }

.result-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(5, 8, 16, 0.85);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
}
.result-modal {
  width: 90%;
  max-width: 420px;
  padding: 0;
  overflow: hidden;
  animation: modal-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.result-modal.victory { box-shadow: 0 0 80px rgba(214, 158, 46, 0.3); border-color: var(--accent-gold); }
.result-modal.defeat { box-shadow: 0 0 80px rgba(229, 62, 62, 0.3); border-color: var(--accent-red); }
.result-header {
  text-align: center;
  padding: 36px 30px 24px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  background: linear-gradient(180deg, var(--bg-tertiary), transparent);
}
.result-icon { font-size: 64px; margin-bottom: 8px; }
.result-modal.victory .result-icon { animation: pulse-glow 1.5s infinite; }
.result-title {
  font-family: var(--font-title);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.15em;
}
.result-modal.victory .result-title { color: var(--accent-gold); text-shadow: 0 0 30px rgba(214, 158, 46, 0.4); }
.result-modal.defeat .result-title { color: var(--accent-red); }
.result-sub { color: var(--text-secondary); font-size: 13px; }

.result-rewards {
  padding: 20px 30px;
  background: var(--bg-deep);
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  display: flex; flex-direction: column; gap: 12px;
}
.reward-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px;
  background: var(--bg-secondary);
}
.r-label { font-family: var(--font-title); font-size: 12px; color: var(--text-dim); letter-spacing: 0.1em; }
.r-val { font-weight: 700; font-size: 15px; }
.r-val.big { font-size: 22px; font-family: var(--font-title); }

.result-actions {
  padding: 20px 30px 30px;
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: all 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .result-modal,
.modal-fade-leave-to .result-modal {
  transform: scale(0.8);
  opacity: 0;
}
@keyframes modal-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all 0.3s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translate(-50%, -20px); }

@media (max-width: 1100px) {
  .log-panel {
    position: relative;
    right: auto; top: auto; transform: none;
    width: calc(100% - 60px);
    margin: 0 30px 20px;
    max-height: 220px;
  }
  .log-body { max-height: 150px; }
}
@media (max-width: 800px) {
  .battlefield { grid-template-columns: 1fr; }
  .battle-center { display: none; }
  .enemies-side { align-items: flex-start; }
}
</style>
