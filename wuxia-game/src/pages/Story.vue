<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Swords, Trophy, Home, Heart, Zap } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useBattleStore } from '@/stores/battle'
import { STORY_NODES, getStoryNode, ENDINGS } from '@/data/story'
import { getSect } from '@/data/sects'
import HealthBar from '@/components/HealthBar.vue'
import QiBar from '@/components/QiBar.vue'

const router = useRouter()
const gameStore = useGameStore()
const battleStore = useBattleStore()

const currentNode = computed(() => getStoryNode(gameStore.currentStoryNodeId))
const player = computed(() => gameStore.player)
const sect = computed(() => player.value ? getSect(player.value.sect) : null)

const displayedText = ref('')
const isTyping = ref(false)
const typingSpeed = 40

const pendingBattleId = ref<string | null>(null)
const pendingNextNodeId = ref<string | null>(null)

onMounted(() => {
  if (!gameStore.playerExists) {
    router.push('/select-sect')
    return
  }
  if (currentNode.value) {
    startTyping(currentNode.value.dialogue)
  }
})

watch(
  () => gameStore.currentStoryNodeId,
  () => {
    if (currentNode.value) {
      startTyping(currentNode.value.dialogue)
    }
  }
)

function startTyping(text: string) {
  displayedText.value = ''
  isTyping.value = true
  let i = 0
  const interval = setInterval(() => {
    if (i < text.length) {
      displayedText.value += text[i]
      i++
    } else {
      clearInterval(interval)
      isTyping.value = false
    }
  }, typingSpeed)
}

function skipTyping() {
  if (currentNode.value) {
    displayedText.value = currentNode.value.dialogue
    isTyping.value = false
  }
}

function selectChoice(choiceId: string, nextNodeId: string) {
  gameStore.advanceStory(nextNodeId, choiceId)
}

function goNext() {
  if (isTyping.value) {
    skipTyping()
    return
  }
  if (!currentNode.value) return

  if (currentNode.value.isEnding) {
    const endingKey = gameStore.getBranchKey()
    router.push(`/ending?key=${endingKey}`)
    return
  }

  if (currentNode.value.nextBattleId) {
    pendingBattleId.value = currentNode.value.nextBattleId
    pendingNextNodeId.value = currentNode.value.nextNodeId || null
    startBattle()
    return
  }

  if (currentNode.value.nextNodeId) {
    gameStore.advanceStory(currentNode.value.nextNodeId)
  }
}

function startBattle() {
  if (!pendingBattleId.value || !player.value) return
  gameStore.setCurrentBattle(pendingBattleId.value, pendingNextNodeId.value || undefined)
  battleStore.startBattle(player.value, pendingBattleId.value, 'story')
  router.push('/battle')
}

function returnToMenu() {
  router.push('/')
}

function goArena() {
  router.push('/arena')
}

const chapterName = computed(() => {
  const c = currentNode.value?.chapter || 1
  const names: Record<number, string> = { 1: '初入江湖', 2: '风云际会', 3: '华山论剑' }
  return names[c] || ''
})
</script>

<template>
  <div class="w-full h-full flex flex-col relative" @click="isTyping && skipTyping()">
    <div class="flex items-center justify-between p-4 border-b border-ink-800 bg-ink-900/80 backdrop-blur-sm z-20">
      <div class="flex items-center gap-4">
        <button
          class="flex items-center gap-2 text-ink-300 hover:text-gold transition-colors"
          @click.stop="returnToMenu"
        >
          <Home :size="18" />
          <span class="font-song text-sm">主菜单</span>
        </button>
        <div class="text-gold font-wuxia tracking-widest text-lg">
          第{{ currentNode?.chapter }}章 · {{ chapterName }}
        </div>
      </div>

      <div v-if="player" class="flex items-center gap-6">
        <div class="flex items-center gap-3 w-56">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            :style="{ backgroundColor: sect?.color + '40', border: '1px solid ' + sect?.color }"
          >
            {{ sect?.icon }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-ink-100 font-song text-sm truncate">{{ player.name }}</span>
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

        <button
          class="flex items-center gap-2 text-ink-300 hover:text-gold transition-colors"
          @click.stop="goArena"
        >
          <Trophy :size="18" />
          <span class="font-song text-sm">比武场</span>
        </button>
      </div>
    </div>

    <div class="flex-1 relative flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0">
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cinnabar/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle, #d4a574 1px, transparent 1px); background-size: 32px 32px;"></div>
      </div>

      <div v-if="currentNode" class="relative z-10 text-center px-8 max-w-3xl animate-fade-in">
        <div class="text-6xl md:text-8xl mb-8 opacity-80 animate-float">
          {{ sect?.icon }}
        </div>
        <div class="text-gold/60 text-sm tracking-widest font-wuxia mb-3">
          {{ currentNode.chapter === 1 ? '第 一 章' : currentNode.chapter === 2 ? '第 二 章' : '第 三 章' }}
        </div>
      </div>
    </div>

    <div class="dialogue-box p-5 md:p-6 relative z-20">
      <div v-if="currentNode" class="mb-3 flex items-center gap-3">
        <span
          class="px-3 py-1 text-sm font-wuxia tracking-wider rounded"
          :class="currentNode.speaker === '旁白' ? 'bg-ink-700 text-ink-200' : 'bg-gold/20 text-gold border border-gold/40'"
        >
          {{ currentNode.speaker }}
        </span>
      </div>

      <div class="min-h-[80px] mb-4">
        <p class="text-ink-100 font-song text-base md:text-lg leading-loose whitespace-pre-wrap">
          {{ displayedText }}
          <span v-if="isTyping" class="inline-block w-2 h-5 bg-gold ml-1 animate-pulse"></span>
        </p>
      </div>

      <div v-if="!isTyping && currentNode?.choices?.length" class="space-y-2 mb-4">
        <button
          v-for="(choice, idx) in currentNode.choices"
          :key="choice.id"
          class="choice-btn w-full animate-slide-up"
          :style="{ animationDelay: idx * 0.08 + 's' }"
          @click.stop="selectChoice(choice.id, choice.nextNodeId)"
        >
          {{ choice.text }}
        </button>
      </div>

      <div v-if="!isTyping && !currentNode?.choices?.length" class="flex justify-end">
        <button
          class="wuxia-btn text-sm py-2"
          @click.stop="goNext"
        >
          <span v-if="currentNode?.nextBattleId" class="flex items-center gap-2">
            <Swords :size="16" />
            迎 战
          </span>
          <span v-else-if="currentNode?.isEnding">结 局</span>
          <span v-else>继 续 →</span>
        </button>
      </div>

      <div v-if="isTyping" class="absolute bottom-4 right-6 text-ink-500 text-xs font-song animate-pulse">
        点击任意处跳过
      </div>
    </div>
  </div>
</template>
