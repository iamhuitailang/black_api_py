<template>
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-4 left-4 flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-red-500 text-xl">❤️</span>
        <div class="w-48 h-5 bg-gray-800 rounded-full overflow-hidden border border-red-900">
          <div class="health-bar h-full transition-all duration-300"
               :style="{ width: `${healthPercent}%` }">
          </div>
        </div>
        <span class="text-white text-sm">{{ Math.round(health) }}/{{ maxHealth }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="text-blue-500 text-xl">⚡</span>
        <div class="w-48 h-5 bg-gray-800 rounded-full overflow-hidden border border-blue-900">
          <div class="energy-bar h-full transition-all duration-300"
               :style="{ width: `${energyPercent}%` }">
          </div>
        </div>
        <span class="text-white text-sm">{{ Math.round(energy) }}/{{ maxEnergy }}</span>
      </div>
    </div>

    <div class="absolute top-4 right-4 panel-border px-4 py-2">
      <span class="font-wuxia text-yellow-500 text-xl">{{ levelName }}</span>
    </div>

    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
      <div v-for="skill in skills" :key="skill.id" 
           class="skill-slot"
           :class="{ 'on-cooldown': getSkillCooldown(skill.id) > 0 }">
        <span class="text-2xl">{{ skill.icon }}</span>
        <div v-if="getSkillCooldown(skill.id) > 0" 
             class="cooldown-overlay"
             :style="{ height: `${getSkillCooldown(skill.id) * 100}%` }">
        </div>
        <span class="absolute -bottom-5 text-xs text-yellow-500">{{ skill.key }}</span>
      </div>
    </div>

    <div class="absolute bottom-4 left-4 text-white/60 text-sm">
      <div>WASD 移动 | J 攻击 | K 技能 | L 潜行 | ESC 暂停</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  health: { type: Number, default: 100 },
  maxHealth: { type: Number, default: 100 },
  energy: { type: Number, default: 100 },
  maxEnergy: { type: Number, default: 100 },
  levelName: { type: String, default: '' },
  skills: { type: Array, default: () => [] },
  getSkillCooldown: { type: Function, default: () => 0 }
})

const healthPercent = computed(() => (props.health / props.maxHealth) * 100)
const energyPercent = computed(() => (props.energy / props.maxEnergy) * 100)
</script>
