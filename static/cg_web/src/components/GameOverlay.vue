<template>
  <Transition name="overlay">
    <div
      v-if="show"
      class="game-overlay"
      :class="[`game-overlay--${type}`, { 'game-overlay--blur': blur }]"
    >
      <div class="game-overlay__scanlines" />
      <div class="game-overlay__content">
        <Transition name="bounce">
          <div v-if="show" class="game-overlay__panel">
            <div class="game-overlay__icon">
              <span v-if="type === 'paused'">⏸</span>
              <span v-else-if="type === 'gameover'">💀</span>
              <span v-else-if="type === 'victory'">🏆</span>
              <span v-else-if="type === 'loading'">⏳</span>
              <span v-else>{{ icon }}</span>
            </div>
            <h2 class="game-overlay__title">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="game-overlay__subtitle">
              {{ subtitle }}
            </p>
            <div v-if="$slots.default" class="game-overlay__body">
              <slot />
            </div>
            <div v-if="stats" class="game-overlay__stats">
              <div
                v-for="(stat, key) in stats"
                :key="key"
                class="game-overlay__stat"
              >
                <span class="game-overlay__stat-label">{{ stat.label }}</span>
                <span class="game-overlay__stat-value">{{ stat.value }}</span>
              </div>
            </div>
            <div v-if="actions.length > 0" class="game-overlay__actions">
              <PixelButton
                v-for="(action, index) in actions"
                :key="index"
                :variant="action.variant || 'primary'"
                :size="action.size || 'md'"
                :block="true"
                @click="handleAction(action)"
              >
                {{ action.label }}
              </PixelButton>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PixelButton from './PixelButton.vue'
import type { GameStatus } from '@/types/game'

interface OverlayAction {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  action?: () => void
}

interface OverlayStat {
  label: string
  value: string | number
}

interface Props {
  show: boolean
  type?: GameStatus | 'custom'
  title?: string
  subtitle?: string
  icon?: string
  blur?: boolean
  actions?: OverlayAction[]
  stats?: Record<string, OverlayStat>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'paused',
  blur: false,
  actions: () => [],
})

const emit = defineEmits<{
  action: [action: OverlayAction]
}>()

const defaultTitles: Record<string, string> = {
  paused: '游戏暂停',
  gameover: '游戏结束',
  victory: '胜利！',
  loading: '加载中...',
  menu: '主菜单',
  playing: '',
  boss: 'BOSS战！',
}

const defaultSubtitles: Record<string, string> = {
  paused: '按 ESC 继续游戏',
  gameover: '不要放弃，再试一次！',
  victory: '恭喜你完成了这一关！',
  loading: '正在准备游戏...',
  boss: '准备迎接挑战！',
}

const title = computed(() => props.title || defaultTitles[props.type] || '')
const subtitle = computed(() => props.subtitle || defaultSubtitles[props.type] || '')

function handleAction(action: OverlayAction) {
  if (action.action) {
    action.action()
  }
  emit('action', action)
}
</script>

<style scoped>
.game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Press Start 2P', monospace;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.game-overlay--blur {
  backdrop-filter: blur(4px);
}

.game-overlay--paused {
  background: rgba(0, 0, 0, 0.8);
}

.game-overlay--gameover {
  background: rgba(42, 13, 13, 0.9);
}

.game-overlay--victory {
  background: rgba(13, 42, 13, 0.9);
}

.game-overlay--loading {
  background: rgba(10, 10, 20, 0.95);
}

.game-overlay--boss {
  background: rgba(42, 13, 42, 0.9);
}

.game-overlay__scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  animation: scanline-move 8s linear infinite;
}

@keyframes scanline-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 4px;
  }
}

.game-overlay__content {
  position: relative;
  z-index: 1;
  max-width: 90%;
}

.game-overlay__panel {
  background: #1a1a2e;
  border: 4px solid #4a90d9;
  padding: 40px;
  text-align: center;
  box-shadow:
    8px 8px 0 0 #0f0f1a,
    inset -4px -4px 0 0 #2a2a40,
    inset 4px 4px 0 0 #3d3d5c;
  min-width: 320px;
  max-width: 480px;
}

.game-overlay--gameover .game-overlay__panel {
  border-color: #dc2626;
  box-shadow:
    8px 8px 0 0 #140606,
    inset -4px -4px 0 0 #2a0d0d,
    inset 4px 4px 0 0 #5a1a00;
}

.game-overlay--victory .game-overlay__panel {
  border-color: #16a34a;
  box-shadow:
    8px 8px 0 0 #06140c,
    inset -4px -4px 0 0 #0d2818,
    inset 4px 4px 0 0 #1a3d28;
}

.game-overlay--boss .game-overlay__panel {
  border-color: #9333ea;
  box-shadow:
    8px 8px 0 0 #0d0614,
    inset -4px -4px 0 0 #1a0d2a,
    inset 4px 4px 0 0 #3d1a5a;
}

.game-overlay__icon {
  font-size: 64px;
  margin-bottom: 20px;
  animation: icon-bounce 1s ease-in-out infinite;
}

@keyframes icon-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.game-overlay__title {
  font-size: 24px;
  color: #fff;
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow:
    4px 4px 0 #000,
    -2px -2px 0 rgba(255, 255, 255, 0.1);
}

.game-overlay--gameover .game-overlay__title {
  color: #ef4444;
}

.game-overlay--victory .game-overlay__title {
  color: #22c55e;
}

.game-overlay--boss .game-overlay__title {
  color: #a855f7;
}

.game-overlay__subtitle {
  font-size: 10px;
  color: #9ca3af;
  margin: 0 0 24px 0;
  line-height: 1.8;
}

.game-overlay__body {
  margin-bottom: 24px;
}

.game-overlay__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #0f0f1a;
  border: 2px solid #3d3d5c;
}

.game-overlay__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-overlay__stat-label {
  font-size: 8px;
  color: #6b7280;
  text-transform: uppercase;
}

.game-overlay__stat-value {
  font-size: 14px;
  color: #ffd700;
}

.game-overlay__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: all 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.bounce-enter-active {
  animation: bounce-in 0.5s ease;
}

.bounce-leave-active {
  animation: bounce-out 0.3s ease;
}

@keyframes bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}
</style>
