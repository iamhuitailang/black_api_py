
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { GAME_CONFIG } from '../data/characters'
import type { PlayerState } from '../composables/useCharacter'
import type { Particle } from '../composables/useGameEngine'
import HUD from './HUD.vue'
import { drawBackground, drawStickman, drawParticles, drawEffects, applyShake } from '../utils/renderer'

interface Props {
  p1: PlayerState
  p2: PlayerState
  round: number
  p1Score: number
  p2Score: number
  timer: number
  particles: Particle[]
  screenShake: number
  flashColor: string | null
  flashAlpha: number
  isIdle: boolean
}

const props = defineProps<Props>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderId: number | null = null

const W = GAME_CONFIG.CANVAS_WIDTH
const H = GAME_CONFIG.CANVAS_HEIGHT

function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.save()
  ctx.clearRect(0, 0, W, H)
  applyShake(ctx, props.screenShake)

  drawBackground(ctx, W, H)
  drawStickman(ctx, props.p1, 1, props.isIdle)
  drawStickman(ctx, props.p2, 2, props.isIdle)
  drawParticles(ctx, props.particles)

  ctx.restore()

  drawEffects(ctx, W, H, props.flashColor, props.flashAlpha, props.screenShake)

  renderId = requestAnimationFrame(render)
}

onMounted(() => {
  renderId = requestAnimationFrame(render)
})

onUnmounted(() => {
  if (renderId !== null) cancelAnimationFrame(renderId)
})

watch(() => props.isIdle, (val) => {
  if (val) {
    console.log('进入待机动画')
  }
})
</script>

<template>
  <div class="battle-wrap">
    <HUD
      :p1="p1"
      :p2="p2"
      :round="round"
      :p1-score="p1Score"
      :p2-score="p2Score"
      :timer="timer"
    />
    <div class="canvas-holder" :class="{ 'idle-mode': isIdle }">
      <canvas ref="canvasRef" :width="W" :height="H" class="game-canvas"></canvas>
      <div v-if="isIdle" class="idle-overlay">
        <div class="idle-zzz">
          <span>Z</span><span>z</span><span>z</span>
        </div>
        <div class="idle-tip">待机中 · 按任意键唤醒</div>
      </div>
    </div>
    <div class="controls-tip">
      <div class="tip p1-tip">
        <b>P1</b>
        <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</span>
        <span><kbd>J</kbd> 攻击</span>
        <span><kbd>K</kbd> 必杀</span>
        <span class="block-tip">按住 <kbd>{{ p1.facing === 1 ? 'A' : 'D' }}</kbd> 防御</span>
      </div>
      <div class="tip p2-tip">
        <span class="block-tip">按住 <kbd>{{ p2.facing === 1 ? '←' : '→' }}</kbd> 防御</span>
        <span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 移动</span>
        <span><kbd>1</kbd> 攻击</span>
        <span><kbd>2</kbd> 必杀</span>
        <b>P2</b>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-wrap {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #05060f;
  padding: 10px;
  box-sizing: border-box;
  gap: 6px;
}

.canvas-holder {
  position: relative;
  width: 960px;
  max-width: 100%;
  aspect-ratio: 960 / 540;
  border: 3px solid #222;
  border-radius: 6px;
  overflow: hidden;
  box-shadow:
    0 0 0 2px #0a0e27,
    0 0 40px rgba(0,212,255,0.1),
    0 0 60px rgba(255,45,85,0.08);
}

.canvas-holder.idle-mode {
  animation: idle-breathe 4s ease-in-out infinite;
}

@keyframes idle-breathe {
  0%, 100% { box-shadow: 0 0 0 2px #0a0e27, 0 0 20px rgba(100,100,120,0.1); }
  50% { box-shadow: 0 0 0 2px #0a0e27, 0 0 40px rgba(150,150,200,0.15); }
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.idle-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 30px;
  background: linear-gradient(180deg, rgba(0,0,0,0.3), transparent 40%);
}

.idle-zzz {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  font-family: 'Press Start 2P', VT323, monospace;
  color: #aabbff;
  text-shadow: 0 0 12px rgba(150,180,255,0.7);
}

.idle-zzz span:nth-child(1) {
  font-size: 28px;
  animation: float-z 2.2s ease-in-out infinite;
}
.idle-zzz span:nth-child(2) {
  font-size: 18px;
  animation: float-z 2.2s ease-in-out infinite 0.3s;
}
.idle-zzz span:nth-child(3) {
  font-size: 13px;
  animation: float-z 2.2s ease-in-out infinite 0.6s;
}

@keyframes float-z {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
  50% { transform: translateY(-20px) translateX(10px); opacity: 1; }
}

.idle-tip {
  margin-top: 12px;
  font-family: VT323, monospace;
  font-size: 18px;
  color: #8899cc;
  letter-spacing: 2px;
  animation: pulse-tip 1.8s ease-in-out infinite;
}

@keyframes pulse-tip {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.controls-tip {
  width: 960px;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 8px 4px;
  box-sizing: border-box;
}

.tip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: VT323, monospace;
  font-size: 15px;
  color: #aaa;
  background: rgba(0,0,0,0.3);
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid #1a1f33;
}

.p1-tip b { color: #ff2d55; font-size: 17px; }
.p2-tip { justify-content: flex-end; }
.p2-tip b { color: #00d4ff; font-size: 17px; }

.tip kbd {
  background: #1a1d33;
  border: 1px solid #333;
  border-bottom-width: 2px;
  border-radius: 3px;
  padding: 1px 6px;
  font-size: 13px;
  color: #fff;
  font-family: monospace;
}

.block-tip {
  color: #66aaff;
  opacity: 0.8;
}
</style>
