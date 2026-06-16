
<script setup lang="ts">
import { computed } from 'vue'
import { CHARACTERS, GAME_CONFIG } from '../data/characters'
import type { PlayerState } from '../composables/useCharacter'

interface Props {
  p1: PlayerState
  p2: PlayerState
  round: number
  p1Score: number
  p2Score: number
  timer: number
}

const props = defineProps<Props>()

const p1Char = computed(() => CHARACTERS[props.p1.characterId])
const p2Char = computed(() => CHARACTERS[props.p2.characterId])
const p1HpPct = computed(() => Math.max(0, (props.p1.hp / props.p1.maxHp) * 100))
const p2HpPct = computed(() => Math.max(0, (props.p2.hp / props.p2.maxHp) * 100))

const timerStr = computed(() => {
  const s = Math.max(0, props.timer)
  return s.toString().padStart(2, '0')
})

const timerClass = computed(() => {
  if (props.timer <= 10) return 'timer danger'
  if (props.timer <= 20) return 'timer warn'
  return 'timer'
})
</script>

<template>
  <div class="hud-container">
    <div class="player-slot p1-slot">
      <div class="char-name" :style="{ color: p1Char.color }">
        P1 · {{ p1Char.name }}
      </div>
      <div class="hp-bar-outer">
        <div class="hp-bar-fill p1-hp" :style="{ width: p1HpPct + '%' }"></div>
        <div class="hp-text">{{ Math.ceil(p1.hp) }} / {{ p1.maxHp }}</div>
      </div>
      <div class="energy-bar-outer">
        <div class="energy-bar-fill p1-energy" :style="{ width: p1.energy + '%', boxShadow: p1.energy >= 100 ? '0 0 14px #00d4ff' : 'none' }"></div>
        <div class="energy-label" :class="{ ready: p1.energy >= 100 }">
          {{ p1.energy >= 100 ? '必杀就绪 K' : `气 ${Math.floor(p1.energy)}%` }}
        </div>
      </div>
      <div class="score-dots">
        <span v-for="i in GAME_CONFIG.WIN_ROUNDS" :key="'p1-'+i" class="dot" :class="{ win: i <= p1Score }"></span>
      </div>
    </div>

    <div class="center-info">
      <div class="round-label">ROUND {{ round }}</div>
      <div :class="timerClass">{{ timerStr }}</div>
      <div class="score-vs">{{ p1Score }} : {{ p2Score }}</div>
    </div>

    <div class="player-slot p2-slot">
      <div class="char-name right" :style="{ color: p2Char.color }">
        {{ p2Char.name }} · P2
      </div>
      <div class="hp-bar-outer right">
        <div class="hp-bar-fill p2-hp" :style="{ width: p2HpPct + '%' }"></div>
        <div class="hp-text">{{ Math.ceil(p2.hp) }} / {{ p2.maxHp }}</div>
      </div>
      <div class="energy-bar-outer right">
        <div class="energy-bar-fill p2-energy" :style="{ width: p2.energy + '%', boxShadow: p2.energy >= 100 ? '0 0 14px #ff2d55' : 'none' }"></div>
        <div class="energy-label" :class="{ ready: p2.energy >= 100 }">
          {{ p2.energy >= 100 ? '必杀就绪 2' : `气 ${Math.floor(p2.energy)}%` }}
        </div>
      </div>
      <div class="score-dots right">
        <span v-for="i in GAME_CONFIG.WIN_ROUNDS" :key="'p2-'+i" class="dot" :class="{ win: i <= p2Score }"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hud-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  padding: 14px 20px 8px;
  align-items: start;
}

.player-slot {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.p2-slot {
  align-items: flex-end;
}

.char-name {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 13px;
  letter-spacing: 1px;
  text-shadow: 0 0 10px currentColor;
  padding: 0 4px;
}

.char-name.right {
  text-align: right;
}

.hp-bar-outer {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 26px;
  border: 2px solid #555;
  border-radius: 4px;
  background: #111;
  overflow: hidden;
  box-shadow: inset 0 0 8px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6);
}

.hp-bar-outer.right .hp-bar-fill {
  margin-left: auto;
}

.hp-bar-fill {
  height: 100%;
  transition: width 0.18s linear;
  background: linear-gradient(90deg, #ff2d55 0%, #ff6b8a 50%, #ff2d55 100%);
  box-shadow: 0 0 12px rgba(255,45,85,0.6);
}

.p1-hp {
  background: linear-gradient(90deg, #ff2d55 0%, #ff6b8a 50%, #ff2d55 100%);
}

.p2-hp {
  background: linear-gradient(270deg, #00d4ff 0%, #66e5ff 50%, #00d4ff 100%);
  box-shadow: 0 0 12px rgba(0,212,255,0.6);
}

.hp-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: VT323, monospace;
  font-size: 16px;
  color: #fff;
  text-shadow: 1px 1px 3px #000, -1px -1px 3px #000;
  font-weight: bold;
  letter-spacing: 1px;
}

.energy-bar-outer {
  position: relative;
  width: 100%;
  max-width: 360px;
  height: 18px;
  border: 2px solid #333;
  border-radius: 3px;
  background: #0a0a0a;
  overflow: hidden;
}

.energy-bar-outer.right .energy-bar-fill {
  margin-left: auto;
  background: linear-gradient(270deg, #aa44ff, #ff55aa);
}

.energy-bar-fill {
  height: 100%;
  transition: width 0.15s linear;
  background: linear-gradient(90deg, #00d4ff, #55aaff);
}

.energy-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: VT323, monospace;
  font-size: 13px;
  color: #ccc;
  letter-spacing: 1px;
}

.energy-label.ready {
  color: #fff;
  font-weight: bold;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.score-dots {
  display: flex;
  gap: 6px;
  padding: 2px 4px;
}

.score-dots.right {
  justify-content: flex-end;
}

.dot {
  width: 14px;
  height: 14px;
  border: 2px solid #444;
  border-radius: 50%;
  background: #1a1a1a;
}

.dot.win {
  background: #ffd700;
  border-color: #ffd700;
  box-shadow: 0 0 10px #ffd700;
}

.center-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 4px;
  min-width: 110px;
}

.round-label {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 11px;
  color: #ffd700;
  letter-spacing: 2px;
  text-shadow: 0 0 6px rgba(255,215,0,0.5);
}

.timer {
  font-family: 'Press Start 2P', VT323, monospace;
  font-size: 30px;
  color: #fff;
  text-shadow: 0 0 12px rgba(255,255,255,0.4);
  line-height: 1;
  padding: 2px 8px;
}

.timer.warn {
  color: #ffcc00;
}

.timer.danger {
  color: #ff2d55;
  animation: pulse 0.6s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}

.score-vs {
  font-family: VT323, monospace;
  font-size: 18px;
  color: #fff;
  letter-spacing: 3px;
  opacity: 0.85;
}
</style>
