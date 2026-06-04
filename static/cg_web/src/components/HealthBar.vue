<template>
  <div :class="['health-bar', `health-bar--${variant}`, `health-bar--${size}`]">
    <div v-if="showLabel" class="health-bar__label">
      <span class="health-bar__name">{{ label }}</span>
      <span class="health-bar__value">{{ current }} / {{ max }}</span>
    </div>
    <div class="health-bar__container">
      <div class="health-bar__background">
        <div
          class="health-bar__fill"
          :style="{ width: `${percentage}%` }"
        >
          <div class="health-bar__fill-inner" />
        </div>
        <div
          v-if="showDamage && previousHealth !== current"
          class="health-bar__damage"
          :style="{ width: `${damagePercentage}%` }"
        />
        <div class="health-bar__segments">
          <div
            v-for="i in segments"
            :key="i"
            class="health-bar__segment"
          />
        </div>
      </div>
    </div>
    <div v-if="showHearts" class="health-bar__hearts">
      <span
        v-for="i in maxHearts"
        :key="i"
        :class="[
          'health-bar__heart',
          {
            'health-bar__heart--full': i <= filledHearts,
            'health-bar__heart--half': i > filledHearts && i <= filledHearts + 0.5,
            'health-bar__heart--empty': i > filledHearts + 0.5,
          },
        ]"
      >
        ♥
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  current: number
  max: number
  label?: string
  variant?: 'player' | 'enemy' | 'boss'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showDamage?: boolean
  showHearts?: boolean
  segments?: number
}

const props = withDefaults(defineProps<Props>(), {
  label: 'HP',
  variant: 'player',
  size: 'md',
  showLabel: true,
  showDamage: true,
  showHearts: false,
  segments: 10,
})

const previousHealth = ref(props.current)
const damagePercentage = ref(0)

const percentage = computed(() => {
  const value = Math.max(0, Math.min(100, (props.current / props.max) * 100))
  return Math.round(value * 10) / 10
})

const maxHearts = computed(() => Math.ceil(props.max / 20))
const filledHearts = computed(() => props.current / 20)

watch(
  () => props.current,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal < oldVal) {
      previousHealth.value = oldVal
      damagePercentage.value = ((oldVal - newVal) / props.max) * 100
      setTimeout(() => {
        damagePercentage.value = 0
      }, 500)
    }
  }
)

onMounted(() => {
  previousHealth.value = props.current
})
</script>

<style scoped>
.health-bar {
  font-family: 'Press Start 2P', monospace;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.health-bar--sm {
  min-width: 120px;
}

.health-bar--md {
  min-width: 200px;
}

.health-bar--lg {
  min-width: 320px;
}

.health-bar__label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 8px;
  color: #fff;
}

.health-bar--sm .health-bar__label {
  font-size: 6px;
}

.health-bar--lg .health-bar__label {
  font-size: 10px;
}

.health-bar__name {
  text-transform: uppercase;
  letter-spacing: 1px;
}

.health-bar__value {
  color: #ffd700;
}

.health-bar__container {
  position: relative;
  padding: 3px;
  background: #0a0a0f;
  border: 3px solid;
  box-shadow: inset 2px 2px 0 0 rgba(0, 0, 0, 0.5);
}

.health-bar--player .health-bar__container {
  border-color: #2d5a3d;
}

.health-bar--enemy .health-bar__container {
  border-color: #8b2500;
}

.health-bar--boss .health-bar__container {
  border-color: #5a2a8a;
}

.health-bar--sm .health-bar__container {
  padding: 2px;
  border-width: 2px;
}

.health-bar--lg .health-bar__container {
  padding: 4px;
  border-width: 4px;
}

.health-bar__background {
  position: relative;
  width: 100%;
  height: 20px;
  background: #1a1a2e;
  overflow: hidden;
}

.health-bar--sm .health-bar__background {
  height: 12px;
}

.health-bar--lg .health-bar__background {
  height: 28px;
}

.health-bar__fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
  z-index: 2;
}

.health-bar__fill-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
}

.health-bar--player .health-bar__fill {
  background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
  box-shadow: inset 0 2px 0 0 rgba(255, 255, 255, 0.4);
}

.health-bar--enemy .health-bar__fill {
  background: linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%);
  box-shadow: inset 0 2px 0 0 rgba(255, 255, 255, 0.4);
}

.health-bar--boss .health-bar__fill {
  background: linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #9333ea 100%);
  box-shadow: inset 0 2px 0 0 rgba(255, 255, 255, 0.4);
}

.health-bar__damage {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background: #fbbf24;
  animation: damage-fade 0.5s ease-out forwards;
  z-index: 1;
}

@keyframes damage-fade {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.health-bar__segments {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  z-index: 3;
  pointer-events: none;
}

.health-bar__segment {
  flex: 1;
  border-right: 2px solid rgba(0, 0, 0, 0.4);
}

.health-bar__segment:last-child {
  border-right: none;
}

.health-bar__hearts {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.health-bar__heart {
  font-size: 16px;
  color: #333;
  transition: all 0.2s ease;
}

.health-bar--sm .health-bar__heart {
  font-size: 12px;
}

.health-bar--lg .health-bar__heart {
  font-size: 20px;
}

.health-bar__heart--half {
  background: linear-gradient(90deg, #ef4444 50%, #333 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.health-bar__heart--full {
  color: #ef4444;
  animation: heart-pulse 1s ease-in-out infinite;
}

@keyframes heart-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
