<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Trophy, Swords, Heart, Package, Medal } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useBattleStore } from '@/stores/battle'
import { getSect } from '@/data/sects'
import { ARENA_OPPONENTS, getEnemy } from '@/data/enemies'
import { ARENA_REWARDS, getEquipment } from '@/data/equipment'
import HealthBar from '@/components/HealthBar.vue'
import QiBar from '@/components/QiBar.vue'

const router = useRouter()
const gameStore = useGameStore()
const battleStore = useBattleStore()

const player = computed(() => gameStore.player)
const sect = computed(() => player.value ? getSect(player.value.sect) : null)
const arena = computed(() => gameStore.arena)

const currentOpponent = computed(() => {
  const streak = arena.value.winStreak
  const idx = Math.min(streak, ARENA_OPPONENTS.length - 1)
  const enemyId = ARENA_OPPONENTS[idx]
  return getEnemy(enemyId)
})

const nextReward = computed(() => {
  const thresholds = [5, 10, 20]
  for (const t of thresholds) {
    if (arena.value.winStreak < t) {
      const reward = ARENA_REWARDS[String(t)]
      if (reward) {
        return { threshold: t, equipment: getEquipment(reward.equipmentId), medal: reward.medal }
      }
    }
  }
  return null
})

const medalClass = computed(() => {
  switch (arena.value.medal) {
    case 'gold': return 'medal-gold'
    case 'silver': return 'medal-silver'
    case 'bronze': return 'medal-bronze'
    default: return 'text-ink-500'
  }
})

const medalName = computed(() => {
  switch (arena.value.medal) {
    case 'gold': return '武林至尊 · 金牌'
    case 'silver': return '一代宗师 · 银牌'
    case 'bronze': return '江湖名宿 · 铜牌'
    default: return '暂无奖牌'
  }
})

onMounted(() => {
  if (!gameStore.playerExists) {
    router.push('/select-sect')
  }
})

function startChallenge() {
  if (!player.value || !currentOpponent.value) return
  battleStore.startBattle(player.value, currentOpponent.value.id, 'arena')
  router.push('/battle')
}

function healAll() {
  gameStore.healPlayerFull()
}

function goBack() {
  if (gameStore.playerExists && gameStore.currentStoryNodeId !== 'start') {
    router.push('/story')
  } else {
    router.push('/')
  }
}

function qualityClass(q: string): string {
  return `quality-${q} border rounded p-3`
}
</script>

<template>
  <div class="w-full h-full flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
    <div class="flex items-center justify-between">
      <button
        class="flex items-center gap-2 text-ink-300 hover:text-gold transition-colors"
        @click="goBack"
      >
        <ArrowLeft :size="18" />
        <span class="font-song text-sm">返 回</span>
      </button>
      <div class="text-center">
        <h2 class="text-3xl font-wuxia text-gold text-shadow-gold tracking-[0.3em]">比 武 场</h2>
      </div>
      <div class="w-20"></div>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden">
      <div class="flex flex-col gap-4 min-h-0">
        <div v-if="player" class="ink-paper rounded-lg p-4 animate-slide-up">
          <div class="text-gold font-wuxia text-sm mb-3 flex items-center gap-2">
            <Trophy :size="16" />
            我 的 战 绩
          </div>

          <div class="flex items-center gap-3 mb-4">
            <div
              v-if="sect"
              class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              :style="{ backgroundColor: sect.color + '30', border: '2px solid ' + sect.color }"
            >
              {{ sect.icon }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-ink-100 font-song">{{ player.name }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded" :style="{ backgroundColor: sect?.color + '30', color: sect?.color }">
                  {{ sect?.name }}
                </span>
              </div>
              <div class="space-y-1">
                <HealthBar :current="player.hp" :max="player.maxHp" show-text />
                <QiBar :current="player.qi" :max="player.maxQi" show-text />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="bg-ink-800 rounded p-3 text-center">
              <div class="text-2xl font-mono text-cinnabar font-wuxia">{{ arena.winStreak }}</div>
              <div class="text-xs text-ink-400 font-song">当前连胜</div>
            </div>
            <div class="bg-ink-800 rounded p-3 text-center">
              <div class="text-2xl font-mono text-gold font-wuxia">{{ arena.maxWinStreak }}</div>
              <div class="text-xs text-ink-400 font-song">最高连胜</div>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2 bg-ink-800 rounded p-3">
            <Medal :size="24" :class="medalClass" />
            <div class="flex-1">
              <div class="text-sm" :class="medalClass">{{ medalName }}</div>
              <div v-if="nextReward" class="text-xs text-ink-400">
                距离下一奖励：连胜 {{ nextReward.threshold }} 场
              </div>
              <div v-else class="text-xs text-jade">
                已获得全部奖牌奖励！
              </div>
            </div>
          </div>

          <button
            class="wuxia-btn w-full mt-4 text-sm py-2 flex items-center justify-center gap-2"
            :disabled="player.hp >= player.maxHp && player.qi >= player.maxQi"
            @click="healAll"
          >
            <Heart :size="16" />
            休 养 生 息（满血满气）
          </button>
        </div>

        <div class="ink-paper rounded-lg p-4 flex-1 min-h-0 overflow-y-auto animate-slide-up" style="animation-delay: 0.1s">
          <div class="text-gold font-wuxia text-sm mb-3 flex items-center gap-2">
            <Package :size="16" />
            已 获 装 备
          </div>
          <div v-if="arena.rewards.length === 0" class="text-ink-500 text-sm text-center py-8 font-song">
            尚未获得任何装备<br>开始挑战获取神兵利器吧！
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="equip in arena.rewards"
              :key="equip.id"
              :class="qualityClass(equip.quality)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-song font-bold">{{ equip.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="equip.quality === 'gold' ? 'bg-yellow-600/30 text-yellow-400' : equip.quality === 'silver' ? 'bg-gray-400/30 text-gray-300' : 'bg-orange-600/30 text-orange-400'"
                >
                  {{ equip.quality === 'gold' ? '金' : equip.quality === 'silver' ? '银' : '铜' }}
                </span>
              </div>
              <p class="text-xs text-ink-400 font-song leading-relaxed mb-1">{{ equip.description }}</p>
              <div class="flex gap-3 text-xs">
                <span v-if="equip.attackBonus" class="text-cinnabar">攻击 +{{ equip.attackBonus }}</span>
                <span v-if="equip.hpBonus" class="text-jade">生命 +{{ equip.hpBonus }}</span>
                <span v-if="equip.qiBonus" class="text-amethyst">真气 +{{ equip.qiBonus }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 flex flex-col gap-4 min-h-0">
        <div v-if="nextReward" class="ink-paper rounded-lg p-4 animate-slide-up" style="animation-delay: 0.15s">
          <div class="text-gold font-wuxia text-sm mb-3 flex items-center gap-2">
            <Trophy :size="16" />
            下 一 阶 段 奖 励 · 连胜 {{ nextReward.threshold }} 场
          </div>
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
              :class="qualityClass(nextReward.equipment.quality)"
            >
              {{ nextReward.equipment.type === 'weapon' ? '⚔️' : nextReward.equipment.type === 'armor' ? '🛡️' : '💍' }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-lg font-song font-bold">{{ nextReward.equipment.name }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded"
                  :class="nextReward.medal === 'gold' ? 'bg-yellow-600/30 text-yellow-400' : nextReward.medal === 'silver' ? 'bg-gray-400/30 text-gray-300' : 'bg-orange-600/30 text-orange-400'"
                >
                  {{ nextReward.medal === 'gold' ? '金牌品质' : nextReward.medal === 'silver' ? '银牌品质' : '铜牌品质' }}
                </span>
              </div>
              <p class="text-xs text-ink-400 font-song">{{ nextReward.equipment.description }}</p>
              <div class="flex gap-3 text-xs mt-1">
                <span v-if="nextReward.equipment.attackBonus" class="text-cinnabar">攻击 +{{ nextReward.equipment.attackBonus }}</span>
                <span v-if="nextReward.equipment.hpBonus" class="text-jade">生命 +{{ nextReward.equipment.hpBonus }}</span>
                <span v-if="nextReward.equipment.qiBonus" class="text-amethyst">真气 +{{ nextReward.equipment.qiBonus }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ink-paper rounded-lg p-6 flex-1 flex flex-col items-center justify-center min-h-0 animate-slide-up" style="animation-delay: 0.2s">
          <div class="text-center mb-6">
            <div class="text-xs text-ink-400 tracking-widest mb-2 font-wuxia">当 前 对 手</div>
            <div class="text-6xl mb-4 animate-float">👹</div>
            <div v-if="currentOpponent" class="text-cinnabar-light font-wuxia text-2xl text-shadow-red tracking-widest mb-2">
              {{ currentOpponent.name }}
            </div>
            <p v-if="currentOpponent" class="text-ink-400 text-sm font-song max-w-md">
              {{ currentOpponent.description }}
            </p>
          </div>

          <div v-if="currentOpponent" class="w-full max-w-sm space-y-2 mb-8">
            <div class="flex justify-between text-xs">
              <span class="text-ink-400">生命</span>
              <span class="text-ink-200 font-mono">{{ currentOpponent.maxHp }}</span>
            </div>
            <div class="bar-bg h-3 rounded-sm overflow-hidden">
              <div class="hp-bar h-full w-full"></div>
            </div>
            <div class="flex justify-between text-xs mt-2">
              <span class="text-ink-400">攻击</span>
              <span class="text-cinnabar font-mono">{{ currentOpponent.attack }}</span>
              <span class="text-ink-400 ml-4">战斗风格</span>
              <span class="text-gold font-song">
                {{ currentOpponent.aiType === 'aggressive' ? '激进' : currentOpponent.aiType === 'defensive' ? '防守' : '平衡' }}
              </span>
            </div>
          </div>

          <button
            class="wuxia-btn wuxia-btn-primary text-lg py-4 px-12 flex items-center gap-3"
            :disabled="!player || !currentOpponent"
            @click="startChallenge"
          >
            <Swords :size="22" />
            开 始 挑 战
          </button>

          <div class="mt-6 text-center">
            <p class="text-xs text-ink-500 font-song">
              连胜 5 场 → 铜牌装备 &nbsp;|&nbsp; 连胜 10 场 → 银牌装备 &nbsp;|&nbsp; 连胜 20 场 → 金牌装备
            </p>
            <p class="text-xs text-ink-600 font-song mt-1">
              失败则连胜清零，已获得的奖牌和装备永久保留
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
