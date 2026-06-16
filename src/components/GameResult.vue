
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CHARACTERS } from '../data/characters'

interface Props {
  winnerId: string
  p1Score: number
  p2Score: number
  p1Selected: string
  p2Selected: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'restart'): void
  (e: 'back'): void
}>()

const winnerChar = computed(() => CHARACTERS[props.winnerId])
const p1Char = computed(() => CHARACTERS[props.p1Selected])
const p2Char = computed(() => CHARACTERS[props.p2Selected])

const showContent = ref(false)
const confetti = ref<Array<{ x: number; y: number; color: string; size: number; vx: number; vy: number; rot: number; vr: number }>>([])

function spawnConfetti() {
  const colors = ['#ff2d55', '#00d4ff', '#ffd700', '#44ff44', '#bb55ff']
  for (let i = 0; i < 80; i++) {
    confetti.value.push({
      x: 50 + Math.random() * 50,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 15
    })
  }
}

let animId: number | null = null
function animateConfetti() {
  for (const c of confetti.value) {
    c.x += c.vx
    c.y += c.vy
    c.vy += 0.03
    c.rot += c.vr
  }
  confetti.value = confetti.value.filter(c => c.y < 110)
  if (confetti.value.length > 0) {
    animId = requestAnimationFrame(animateConfetti)
  }
}

onMounted(() => {
  setTimeout(() => { showContent.value = true }, 150)
  setTimeout(spawnConfetti, 400)
  setTimeout(() => { animateConfetti() }, 420)
})
</script>

<template>
  <div class="result-wrap">
    <div class="confetti-layer">
      <div
        v-for="(c, idx) in confetti"
        :key="idx"
        class="confetti-piece"
        :style="{
          left: c.x + '%',
          top: c.y + '%',
          width: c.size + 'px',
          height: c.size + 'px',
          background: c.color,
          transform: `rotate(${c.rot}deg)`
        }"
      ></div>
    </div>

    <div class="result-card" :class="{ show: showContent }" :style="{ '--win-color': winnerChar.color }">
      <div class="k-o-text">K.O.</div>

      <div class="winner-label">获胜者</div>
      <div class="winner-name" :style="{ color: winnerChar.color }">
        {{ winnerChar.name }}
      </div>

      <svg viewBox="0 0 120 160" class="winner-stickman">
        <circle cx="60" cy="28" r="16" fill="none" :stroke="winnerChar.color" stroke-width="5"/>
        <circle cx="65" cy="26" r="3" :fill="winnerChar.color"/>
        <path d="M 52 34 Q 60 40 68 34" fill="none" :stroke="winnerChar.color" stroke-width="3" stroke-linecap="round"/>
        <line x1="60" y1="44" x2="60" y2="100" :stroke="winnerChar.color" stroke-width="5" stroke-linecap="round"/>
        <line x1="60" y1="58" x2="30" y2="80" :stroke="winnerChar.color" stroke-width="5" stroke-linecap="round"/>
        <line x1="60" y1="58" x2="92" y2="42" :stroke="winnerChar.color" stroke-width="5" stroke-linecap="round"/>
        <circle cx="92" cy="42" r="8" fill="none" stroke="#ffd700" stroke-width="3"/>
        <line x1="60" y1="100" x2="40" y2="148" :stroke="winnerChar.color" stroke-width="5" stroke-linecap="round"/>
        <line x1="60" y1="100" x2="84" y2="148" :stroke="winnerChar.color" stroke-width="5" stroke-linecap="round"/>
      </svg>

      <div class="score-board">
        <div class="score-side" :style="{ color: p1Char.color }">
          <div class="side-name">P1 · {{ p1Char.name }}</div>
          <div class="side-score">{{ p1Score }}</div>
        </div>
        <div class="score-divider">:</div>
        <div class="score-side" :style="{ color: p2Char.color }">
          <div class="side-name">P2 · {{ p2Char.name }}</div>
          <div class="side-score">{{ p2Score }}</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-again" @click="emit('restart')">
          再来一局 · REMATCH
        </button>
        <button class="btn btn-back" @click="emit('back')">
          返回角色选择
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-wrap {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at center, rgba(0,0,0,0.3), rgba(0,0,0,0.9)),
    linear-gradient(180deg, #1a0f2a, #0a0612);
  position: relative;
  overflow: hidden;
}

.confetti-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  border-radius: 2px;
  box-shadow: 0 0 6px currentColor;
}

.result-card {
  position: relative;
  z-index: 1;
  width: 520px;
  max-width: 95%;
  padding: 40px 36px 34px;
  border-radius: 14px;
  background:
    linear-gradient(160deg, rgba(30,20,50,0.95), rgba(10,8,24,0.98));
  border: 3px solid var(--win-color);
  box-shadow:
    0 0 0 2px #0a0e27,
    0 0 60px color-mix(in srgb, var(--win-color) 40%, transparent),
    inset 0 0 40px rgba(0,0,0,0.6);
  text-align: center;
  opacity: 0;
  transform: scale(0.85) translateY(30px);
  transition: opacity 0.45s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.result-card.show {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.k-o-text {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 64px;
  background: linear-gradient(180deg, #ff2d55 0%, #ffd700 50%, #ff2d55 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(255,215,0,0.5));
  letter-spacing: 8px;
  margin-bottom: 6px;
  animation: ko-flash 0.8s ease-in-out;
}

@keyframes ko-flash {
  0% { transform: scale(2); opacity: 0; }
  60% { transform: scale(0.95); opacity: 1; }
  100% { transform: scale(1); }
}

.winner-label {
  font-family: VT323, monospace;
  font-size: 22px;
  color: #888;
  letter-spacing: 4px;
  margin-bottom: 4px;
}

.winner-name {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 28px;
  letter-spacing: 4px;
  margin-bottom: 16px;
  text-shadow: 0 0 18px currentColor;
  animation: winner-glow 1.6s ease-in-out infinite;
}

@keyframes winner-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.winner-stickman {
  width: 140px;
  height: 180px;
  margin: 0 auto 18px;
  animation: victory-pose 1.2s ease-in-out infinite alternate;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--win-color) 60%, transparent));
}

@keyframes victory-pose {
  0% { transform: translateY(0) rotate(-1.5deg); }
  100% { transform: translateY(-8px) rotate(1.5deg); }
}

.score-board {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 14px 20px;
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  border: 1px solid #222;
  margin-bottom: 22px;
}

.score-side {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 110px;
}

.side-name {
  font-family: VT323, monospace;
  font-size: 16px;
  letter-spacing: 1px;
  opacity: 0.85;
}

.side-score {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 36px;
  text-shadow: 0 0 12px currentColor;
}

.score-divider {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 30px;
  color: #666;
}

.result-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
}

.btn {
  padding: 13px 22px;
  font-family: VT323, monospace;
  font-size: 18px;
  letter-spacing: 1px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-again {
  background: linear-gradient(180deg, var(--win-color), color-mix(in srgb, var(--win-color) 65%, #000));
  color: #fff;
  border: 2px solid var(--win-color);
  filter: brightness(1.1);
  box-shadow: 0 4px 0 color-mix(in srgb, var(--win-color) 50%, #000);
}
.btn-again:hover {
  transform: translateY(1px);
  box-shadow: 0 3px 0 color-mix(in srgb, var(--win-color) 50%, #000);
  filter: brightness(1.2);
}
.btn-again:active {
  transform: translateY(4px);
  box-shadow: 0 0 0 color-mix(in srgb, var(--win-color) 50%, #000);
}

.btn-back {
  background: #1a1d33;
  color: #ccc;
  border: 2px solid #333;
}
.btn-back:hover {
  border-color: #888;
  color: #fff;
  transform: translateY(-1px);
}
</style>
