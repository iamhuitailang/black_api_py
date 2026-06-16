<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Sword, Shield, Sparkles, Heart } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useBattleStore } from '@/stores/battle'
import { getSect } from '@/data/sects'
import { getSkill } from '@/data/skills'
import { ARENA_REWARDS, getEquipment } from '@/data/equipment'
import HealthBar from '@/components/HealthBar.vue'
import QiBar from '@/components/QiBar.vue'
import BattleLog from '@/components/BattleLog.vue'

const router = useRouter()
const gameStore = useGameStore()
const battleStore = useBattleStore()

const battle = computed(() => battleStore)
const player = computed(() => battleStore.player)
const enemy = computed(() => battleStore.enemy)
const playerSect = computed(() => player.value ? getSect(player.value.sect) : null)

const playerSkills = computed(() => {
  if (!player.value) return []
  return player.value.skills.map(id => getSkill(id)).filter(Boolean)
})

onMounted(() => {
  if (!battleStore.battleActive) {
    router.back()
    return
  }
  battleStore.isProcessing = false
  if (battleStore.phase === 'enemy-turn') {
    battleStore.addLog('游戏从断点恢复，继续战斗...', 'system')
    setTimeout(() => {
      battleStore.enemyTurn()
    }, 500)
  }
})

watch(
  () => battleStore.phase,
  (phase) => {
    if (phase === 'victory') {
      handleVictory()
    } else if (phase === 'defeat') {
      handleDefeat()
    }
  }
)

function handleVictory() {
  if (!player.value || !battleStore.player) return

  if (battleStore.mode === 'story') {
    const battlePlayer = battleStore.player
    const healHp = Math.floor(battlePlayer.maxHp * 0.5)
    const newHp = Math.min(battlePlayer.maxHp, battlePlayer.hp + healHp)
    gameStore.updatePlayer({
      hp: newHp,
      qi: battlePlayer.maxQi,
      buffs: []
    })
    if (gameStore.currentBattleNextNodeId) {
      gameStore.advanceStory(gameStore.currentBattleNextNodeId)
    }
    gameStore.clearCurrentBattle()
  } else if (battleStore.mode === 'arena') {
    gameStore.arena.winStreak++
    if (gameStore.arena.winStreak > gameStore.arena.maxWinStreak) {
      gameStore.arena.maxWinStreak = gameStore.arena.winStreak
    }
    const reward = ARENA_REWARDS[String(gameStore.arena.winStreak)]
    if (reward) {
      const equip = getEquipment(reward.equipmentId)
      if (equip) {
        gameStore.addEquipment(equip)
        gameStore.arena.rewards.push(equip)
        gameStore.arena.medal = reward.medal
      }
    }
    const battlePlayer = battleStore.player
    gameStore.updatePlayer({
      hp: battlePlayer.hp,
      qi: battlePlayer.qi,
      buffs: []
    })
  }
}

function handleDefeat() {
  if (battleStore.mode === 'arena') {
    gameStore.arena.winStreak = 0
  }
}

function doAttack() {
  battleStore.doPlayerNormalAttack()
}

function doSkill(skillId: string) {
  battleStore.doPlayerSkill(skillId)
}

function doDefend() {
  battleStore.doPlayerDefend()
}

function continueAfterBattle() {
  battleStore.endBattle()
  if (battleStore.mode === 'story') {
    router.push('/story')
  } else {
    router.push('/arena')
  }
}

function retryBattle() {
  const mode = battleStore.mode
  if (mode === 'story') {
    const enemyId = gameStore.currentBattleEnemyId
    if (!enemyId || !gameStore.player) return
    gameStore.healPlayerFull()
    battleStore.endBattle()
    battleStore.startBattle(gameStore.player, enemyId, 'story')
  } else {
    gameStore.healPlayerFull()
    battleStore.endBattle()
    router.push('/arena')
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col p-4 md:p-6 gap-4 overflow-hidden">
    <div class="text-center">
      <div class="inline-block px-6 py-1 bg-ink-800 rounded-full border border-ink-600">
        <span class="text-gold font-wuxia tracking-[0.3em] text-lg">
          {{ battle.mode === 'story' ? '江 湖 决 斗' : '比 武 较 技' }}
        </span>
        <span class="ml-4 text-ink-400 text-sm font-song">回合 {{ battle.turn }}</span>
      </div>
    </div>

    <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
      <div class="lg:col-span-2 flex flex-col gap-4 min-h-0">
        <div class="grid grid-cols-2 gap-4 md:gap-8">
          <div
            class="ink-paper rounded-lg p-4 relative animate-slide-up"
            :class="{ 'animate-shake': battle.phase === 'enemy-turn' }"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                v-if="playerSect"
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                :style="{ backgroundColor: playerSect.color + '30', border: '2px solid ' + playerSect.color }"
              >
                {{ playerSect.icon }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-jade-light font-wuxia text-lg">{{ player?.name }}</span>
                  <span v-if="playerSect" class="text-xs px-1.5 py-0.5 rounded" :style="{ backgroundColor: playerSect.color + '30', color: playerSect.color }">
                    {{ playerSect.name }}
                  </span>
                </div>
                <div v-if="player" class="space-y-1.5">
                  <HealthBar :current="player.hp" :max="player.maxHp" show-text />
                  <QiBar :current="player.qi" :max="player.maxQi" show-text />
                </div>
              </div>
            </div>
            <div v-if="player?.buffs?.length" class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="buff in player.buffs"
                :key="buff.id"
                class="text-xs px-2 py-0.5 rounded"
                :class="buff.type === 'buff' ? 'bg-jade/20 text-jade-light border border-jade/40' : 'bg-cinnabar/20 text-cinnabar border border-cinnabar/40'"
              >
                {{ buff.name }}·{{ buff.duration }}
              </span>
            </div>
            <div class="absolute bottom-2 right-3 text-3xl opacity-20">
              {{ battle.phase === 'player-turn' ? '⚔️' : '' }}
            </div>
          </div>

          <div
            class="ink-paper rounded-lg p-4 relative animate-slide-up"
            :style="{ animationDelay: '0.1s' }"
            :class="{ 'animate-shake': battle.phase === 'player-turn' && !battle.isProcessing && battle.logs.length > 0 }"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-cinnabar/20 border-2 border-cinnabar"
              >
                👹
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-cinnabar-light font-wuxia text-lg mb-1">{{ enemy?.name }}</div>
                <div v-if="enemy" class="space-y-1.5">
                  <HealthBar :current="enemy.hp" :max="enemy.maxHp" show-text />
                  <div class="flex items-center gap-2 text-xs">
                    <span class="text-ink-400">攻击</span>
                    <span class="text-cinnabar font-mono">{{ enemy.attack }}</span>
                    <span class="text-ink-500">|</span>
                    <span class="text-ink-400">
                      {{ enemy.aiType === 'aggressive' ? '激进' : enemy.aiType === 'defensive' ? '防守' : '平衡' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute bottom-2 right-3 text-3xl opacity-20">
              {{ battle.phase === 'enemy-turn' ? '⚔️' : '' }}
            </div>
          </div>
        </div>

        <div class="ink-paper rounded-lg p-4 flex-1 min-h-0 flex flex-col">
          <div class="text-gold font-wuxia text-sm mb-2 flex items-center gap-2">
            <Sparkles :size="14" />
            战 斗 日 志
          </div>
          <div class="flex-1 min-h-0">
            <BattleLog :logs="battle.logs" />
          </div>
        </div>
      </div>

      <div class="ink-paper rounded-lg p-4 flex flex-col min-h-0">
        <div class="text-gold font-wuxia text-sm mb-4 tracking-wider">
          {{ battle.phase === 'player-turn' ? '你 的 行 动' : battle.phase === 'enemy-turn' ? '敌 方 行 动 中 ……' : '战 斗 结 果' }}
        </div>

        <div v-if="battle.phase === 'player-turn'" class="space-y-3 flex-1">
          <button
            class="wuxia-btn w-full flex items-center justify-center gap-3 text-sm"
            :disabled="battle.isProcessing"
            @click="doAttack"
          >
            <Sword :size="16" />
            普 通 攻 击
          </button>

          <div class="space-y-2">
            <button
              v-for="skill in playerSkills"
              :key="skill!.id"
              class="wuxia-btn w-full flex flex-col items-center gap-1 text-sm py-3"
              :class="{ 'opacity-60': player && player.qi < skill!.qiCost }"
              :disabled="battle.isProcessing || (player ? player.qi < skill!.qiCost : true)"
              @click="doSkill(skill!.id)"
            >
              <div class="flex items-center gap-2">
                <Sparkles :size="14" />
                <span>{{ skill!.name }}</span>
                <span class="text-xs text-amethyst ml-1">[气 {{ skill!.qiCost }}]</span>
              </div>
              <span class="text-[11px] text-ink-300 font-song tracking-normal leading-tight">{{ skill!.effect }}</span>
            </button>
          </div>

          <button
            class="wuxia-btn w-full flex items-center justify-center gap-3 text-sm"
            :disabled="battle.isProcessing"
            @click="doDefend"
          >
            <Shield :size="16" />
            运 气 调 息 <span class="text-xs text-jade">(+15气)</span>
          </button>
        </div>

        <div v-else-if="battle.phase === 'enemy-turn'" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="text-4xl mb-4 animate-bounce">⚔️</div>
            <div class="text-cinnabar font-song animate-pulse">敌方正在出招……</div>
          </div>
        </div>

        <div v-else-if="battle.phase === 'victory'" class="flex-1 flex flex-col items-center justify-center text-center">
          <div class="text-6xl mb-4 animate-float">🏆</div>
          <div class="text-gold font-wuxia text-2xl text-shadow-gold mb-2 tracking-widest">大 获 全 胜</div>
          <div class="text-ink-300 text-sm font-song mb-4">
            击败了 {{ enemy?.name }}！
          </div>
          <div v-if="battle.mode === 'arena'" class="text-xs text-jade mb-4">
            当前连胜：{{ gameStore.arena.winStreak }} 场
          </div>
          <button class="wuxia-btn wuxia-btn-primary w-full" @click="continueAfterBattle">
            继 续 前 行
          </button>
        </div>

        <div v-else-if="battle.phase === 'defeat'" class="flex-1 flex flex-col items-center justify-center text-center">
          <div class="text-6xl mb-4">💀</div>
          <div class="text-cinnabar font-wuxia text-2xl text-shadow-red mb-2 tracking-widest">不 敌 败 北</div>
          <div class="text-ink-400 text-sm font-song mb-4">
            你被 {{ enemy?.name }} 击败了……
          </div>
          <div class="space-y-3 w-full">
            <button class="wuxia-btn wuxia-btn-primary w-full" @click="retryBattle">
              <Heart :size="16" class="inline mr-2" />
              再 战 一 场
            </button>
            <button class="wuxia-btn w-full text-sm" @click="continueAfterBattle">
              返 回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
