<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { SECTS } from '@/data/sects'
import { getSkillsBySect } from '@/data/skills'
import type { SectId } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

const selectedSect = ref<SectId | null>(null)
const playerName = ref('少侠')

function selectSect(id: SectId) {
  selectedSect.value = id
}

function confirmSelection() {
  if (!selectedSect.value) return
  gameStore.createNewPlayer(selectedSect.value, playerName.value || '少侠')
  router.push('/story')
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="w-full h-full flex flex-col p-6 md:p-10 overflow-hidden">
    <button
      class="self-start flex items-center gap-2 text-ink-300 hover:text-gold transition-colors mb-4"
      @click="goBack"
    >
      <ArrowLeft :size="18" />
      <span class="font-song text-sm">返 回</span>
    </button>

    <div class="text-center mb-6 animate-fade-in">
      <h2 class="text-3xl font-wuxia text-gold text-shadow-gold tracking-[0.3em] mb-2">择 派 而 修</h2>
      <p class="text-ink-400 text-sm font-song">选择你的门派，踏上江湖之路</p>
    </div>

    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pb-4">
      <div
        v-for="sect in SECTS"
        :key="sect.id"
        class="sect-card rounded-lg p-5 animate-slide-up"
        :class="{
          'ring-2 ring-offset-2 ring-offset-ink-900': selectedSect === sect.id,
        }"
        :style="{ '--ring-color': sect.color, borderColor: selectedSect === sect.id ? sect.color : undefined }"
        @click="selectSect(sect.id)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="text-5xl" style="filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.4))">
            {{ sect.icon }}
          </div>
          <div
            v-if="selectedSect === sect.id"
            class="w-7 h-7 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: sect.color }"
          >
            <Check :size="16" class="text-white" />
          </div>
        </div>

        <h3 class="text-2xl font-wuxia mb-2" :style="{ color: sect.color }">
          {{ sect.name }}
        </h3>

        <p class="text-ink-300 text-sm font-song leading-relaxed mb-4">
          {{ sect.description }}
        </p>

        <div class="space-y-2 border-t border-ink-700 pt-3">
          <div class="flex justify-between text-xs">
            <span class="text-ink-400">基础攻击</span>
            <span class="text-cinnabar font-mono">{{ sect.baseAttack }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-ink-400">最大生命</span>
            <span class="text-jade font-mono">{{ sect.maxHp }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-ink-400">真气上限</span>
            <span class="text-amethyst font-mono">{{ sect.maxQi }}</span>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-ink-700">
          <div class="text-xs text-gold mb-2 font-song">门 派 绝 学</div>
          <div v-for="skill in getSkillsBySect(sect.id)" :key="skill.id" class="text-xs">
            <div class="flex justify-between mb-1">
              <span class="text-ink-100 font-song">{{ skill.name }}</span>
              <span class="text-amethyst">气 {{ skill.qiCost }}</span>
            </div>
            <p class="text-ink-400 leading-snug">{{ skill.effect }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-ink-800 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="text-ink-400 font-song text-sm">姓 名：</span>
        <input
          v-model="playerName"
          type="text"
          maxlength="10"
          class="bg-ink-800 border border-ink-600 focus:border-gold outline-none px-3 py-2 rounded text-ink-100 font-song text-sm w-40 transition-colors"
          placeholder="请输入名号"
        />
      </div>
      <button
        class="wuxia-btn wuxia-btn-primary w-full md:w-auto"
        :disabled="!selectedSect"
        @click="confirmSelection"
      >
        踏 入 江 湖
      </button>
    </div>
  </div>
</template>
