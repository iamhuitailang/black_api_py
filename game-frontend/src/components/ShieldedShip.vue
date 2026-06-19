<template>
  <div class="shielded-ship" :class="{
    'is-player': isPlayer,
    'is-dead': isDead,
  }">
    <div class="ship-wrap">
      <svg viewBox="0 0 240 180" class="ship-svg" :class="{flipped: !isPlayer}">
        <defs>
          <radialGradient :id="`shipGrad-${uid}`" cx="50%" cy="50%" r="50%">
            <stop offset="0%" :stop-color="isPlayer ? '#4fd1c5' : '#e53e3e'" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </radialGradient>
          <linearGradient :id="`hull-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#5a6878"/>
            <stop offset="50%" stop-color="#3a4554"/>
            <stop offset="100%" stop-color="#1e2430"/>
          </linearGradient>
          <linearGradient :id="`hull2-${uid}`" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#4a5568"/>
            <stop offset="100%" stop-color="#2d3748"/>
          </linearGradient>
          <linearGradient :id="`cockpit-${uid}`" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#63b3ed" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#2b6cb0" stop-opacity="0.7"/>
          </linearGradient>
          <filter :id="`softGlow-${uid}`">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter :id="`strongGlow-${uid}`">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <ellipse cx="120" cy="90" rx="105" ry="75" :fill="`url(#shipGrad-${uid})`"/>

        <g :transform="shipTransform">
          <polygon
            v-if="shipType === 'flagship'"
            points="180,90 130,50 50,65 20,90 50,115 130,130"
            :fill="`url(#hull-${uid})`"
            :stroke="hullStroke"
            stroke-width="1.2"
            stroke-opacity="0.7"
          />
          <polygon
            v-else-if="shipType === 'gunship'"
            points="175,90 130,55 45,70 25,90 45,110 130,125"
            :fill="`url(#hull2-${uid})`"
            :stroke="hullStroke"
            stroke-width="1"
            stroke-opacity="0.7"
          />
          <polygon
            v-else-if="shipType === 'fighter' || shipType === 'scout'"
            points="178,90 135,60 55,72 30,90 55,108 135,120"
            :fill="`url(#hull-${uid})`"
            :stroke="hullStroke"
            stroke-width="1"
            stroke-opacity="0.6"
          />
          <polygon
            v-else-if="shipType === 'drone'"
            points="160,90 140,65 70,70 50,90 70,110 140,115"
            fill="#718096"
            :stroke="hullStroke"
            stroke-width="1"
          />
          <polygon
            v-else-if="shipType === 'bio'"
            points="175,90 145,58 80,62 35,90 80,118 145,122"
            fill="#38a169"
            stroke="#68d391"
            stroke-width="1.5"
            stroke-opacity="0.5"
          />
          <polygon
            v-else
            points="170,90 128,58 55,70 30,90 55,110 128,122"
            :fill="`url(#hull-${uid})`"
            :stroke="hullStroke"
            stroke-width="1"
            stroke-opacity="0.7"
          />

          <polygon
            v-if="shipType !== 'drone' && shipType !== 'bio'"
            points="130,60 152,82 130,86 112,72"
            :fill="`url(#cockpit-${uid})`"
            stroke="rgba(255,255,255,0.3)"
            stroke-width="0.5"
          />
          <polygon
            v-if="shipType !== 'drone' && shipType !== 'bio'"
            points="55,72 80,62 80,100 55,108"
            :fill="`url(#hull2-${uid})`"
            stroke="rgba(255,255,255,0.08)"
            stroke-width="0.5"
          />

          <polygon
            v-if="shipType !== 'scout' && shipType !== 'drone'"
            points="170,90 185,85 185,95"
            fill="#4fd1c5"
            opacity="0.8"
            class="engine-glow"
          />
          <polygon
            v-if="shipType === 'flagship' || shipType === 'gunship'"
            points="165,70 180,68 180,73"
            fill="#4fd1c5"
            opacity="0.7"
            class="engine-glow"
          />
          <polygon
            v-if="shipType === 'flagship' || shipType === 'gunship'"
            points="165,110 180,107 180,112"
            fill="#4fd1c5"
            opacity="0.7"
            class="engine-glow"
          />

          <circle
            v-if="damageLevel >= 2"
            cx="100" cy="88" r="3"
            fill="#ff6b6b"
            opacity="0.8"
            class="smoke-dot"
          />
          <circle
            v-if="damageLevel >= 3"
            cx="80" cy="95" r="2.5"
            fill="#ffa94d"
            opacity="0.8"
            class="smoke-dot"
          />
          <circle
            v-if="damageLevel >= 4"
            cx="120" cy="75" r="2"
            fill="#ff6b6b"
            opacity="0.9"
            class="smoke-dot"
          />
          <polygon
            v-if="damageLevel >= 3"
            points="140,95 130,92 138,100"
            fill="none"
            stroke="#1a202c"
            stroke-width="1.5"
            opacity="0.7"
          />
        </g>
      </svg>

      <div class="shield-layer" :class="{low: shieldPercent < 35, critical: shieldPercent < 15}" :style="shieldLayerStyle">
        <svg viewBox="0 0 240 180" class="shield-svg">
          <defs>
            <radialGradient :id="`shieldGrad-${uid}`" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stop-color="#63b3ed" :stop-opacity="0" />
              <stop offset="85%" stop-color="#4fd1c5" :stop-opacity="shieldOpacity * 0.3" />
              <stop offset="100%" stop-color="#63b3ed" :stop-opacity="shieldOpacity * 0.6" />
            </radialGradient>
            <filter :id="`shieldGlow-${uid}`">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <ellipse
            cx="120" cy="90" rx="108" ry="78"
            :fill="`url(#shieldGrad-${uid})`"
            :stroke="shieldColor"
            stroke-width="2"
            :stroke-opacity="shieldOpacity * 0.9"
            :filter="`url(#shieldGlow-${uid})`"
            v-show="shieldPercent > 5"
            class="shield-ellipse"
          />

          <g v-show="shieldPercent > 5 && crackCount > 0" class="cracks-group">
            <path
              v-for="(crack, i) in cracks"
              :key="i"
              :d="crack.path"
              fill="none"
              stroke="white"
              :stroke-width="crack.width"
              :stroke-opacity="crack.opacity"
              stroke-linecap="round"
              class="crack"
            />
            <circle
              v-for="(sp, i) in sparkles"
              :key="'sp'+i"
              :cx="sp.x"
              :cy="sp.y"
              :r="sp.r"
              fill="white"
              :opacity="sp.opacity"
              class="sparkle"
            />
          </g>
        </svg>
      </div>

      <div class="hp-bars">
        <div class="hp-row shield-row">
          <div class="hp-label"><span class="hp-icon shield-ico">◈</span>护盾</div>
          <div class="hp-bar bar-shield">
            <div class="hp-fill" :style="{width: shieldPercent + '%'}"></div>
            <div class="hp-seg">
              <span v-for="i in 4" :key="i"></span>
            </div>
          </div>
          <div class="hp-val">{{ Math.round(currentShield) }}/{{ maxShield }}</div>
        </div>
        <div class="hp-row hull-row">
          <div class="hp-label"><span class="hp-icon hull-ico">◆</span>船体</div>
          <div class="hp-bar bar-hull">
            <div class="hp-fill" :style="{width: hullPercent + '%'}"></div>
            <div class="hp-seg">
              <span v-for="i in 4" :key="i"></span>
            </div>
          </div>
          <div class="hp-val">{{ Math.round(currentHull) }}/{{ maxHull }}</div>
        </div>
      </div>

      <div v-if="label" class="ship-name-plate" :class="{dead: isDead}">
        <span v-if="difficulty" class="diff-dots">
          <span v-for="i in 5" :key="i" :class="{active: i <= difficulty}">●</span>
        </span>
        <span class="name-text">{{ label }}</span>
        <span v-if="isDead" class="dead-text">已摧毁</span>
      </div>

      <div v-if="hasBuffs || hasDebuffs" class="status-icons">
        <div v-if="hasBuffs" class="status-icon buff" title="增益效果">
          ↑
          <span class="status-turns">{{ buffTurns }}</span>
        </div>
        <div v-if="hasDebuffs" class="status-icon debuff" title="减益效果">
          ↓
          <span class="status-turns">{{ debuffTurns }}</span>
        </div>
        <div v-if="extraDebuffs?.stunned > 0" class="status-icon stun" title="瘫痪">
          ⚡
          <span class="status-turns">{{ extraDebuffs.stunned }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  maxHull: { type: Number, default: 100 },
  currentHull: { type: Number, default: 100 },
  maxShield: { type: Number, default: 50 },
  currentShield: { type: Number, default: 50 },
  isPlayer: { type: Boolean, default: true },
  label: { type: String, default: '' },
  shipType: { type: String, default: 'scavenger' },
  difficulty: { type: Number, default: 0 },
  isDead: { type: Boolean, default: false },
  extraBuffs: { type: Object, default: () => ({}) },
  extraDebuffs: { type: Object, default: () => ({}) },
})

const uid = Math.random().toString(36).slice(2, 9)

const shieldPercent = computed(() => {
  if (!props.maxShield) return 0
  return Math.max(0, Math.min(100, (props.currentShield / props.maxShield) * 100))
})
const hullPercent = computed(() => {
  if (!props.maxHull) return 0
  return Math.max(0, Math.min(100, (props.currentHull / props.maxHull) * 100))
})
const damageLevel = computed(() => {
  const hp = hullPercent.value
  if (hp < 15) return 5
  if (hp < 30) return 4
  if (hp < 50) return 3
  if (hp < 70) return 2
  return 1
})

const shieldColor = computed(() => {
  if (shieldPercent.value < 15) return '#ff6b6b'
  if (shieldPercent.value < 35) return '#ffa94d'
  return '#63b3ed'
})
const shieldOpacity = computed(() => {
  const p = shieldPercent.value
  if (p < 5) return 0
  return 0.25 + (p / 100) * 0.65
})
const shieldLayerStyle = computed(() => {
  const p = shieldPercent.value
  return {
    opacity: p < 5 ? 0 : 1,
    animationDuration: p < 20 ? '0.4s' : '1.8s',
  }
})

const crackCount = computed(() => {
  const p = shieldPercent.value
  if (p >= 80) return 0
  if (p >= 60) return 1
  if (p >= 40) return 3
  if (p >= 20) return 5
  return 7
})

function generateCrackPoints(count) {
  const result = []
  const cx = 120, cy = 90, rx = 108, ry = 78
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const sx = cx + Math.cos(angle) * rx * (0.85 + Math.random() * 0.15)
    const sy = cy + Math.sin(angle) * ry * (0.85 + Math.random() * 0.15)
    let x = sx
    let y = sy
    let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`
    const segments = 2 + Math.floor(Math.random() * 3)
    const dirX = cx - sx
    const dirY = cy - sy
    for (let j = 0; j < segments; j++) {
      const t = (j + 1) / (segments + 1)
      const baseX = sx + dirX * t * 0.7
      const baseY = sy + dirY * t * 0.7
      x = baseX + (Math.random() - 0.5) * 18
      y = baseY + (Math.random() - 0.5) * 12
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
      if (Math.random() < 0.5) {
        const branchAngle = angle + (Math.random() - 0.5) * 1.5
        const bx = x + Math.cos(branchAngle) * (8 + Math.random() * 10)
        const by = y + Math.sin(branchAngle) * (6 + Math.random() * 8)
        d += ` M ${x.toFixed(1)} ${y.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`
      }
    }
    result.push({
      path: d,
      width: 0.8 + Math.random() * 1.2,
      opacity: 0.35 + Math.random() * 0.55,
    })
  }
  return result
}
const _cracksRef = ref({})
const cracks = computed(() => {
  const key = `${crackCount.value}_${shieldPercent.value < 20}`
  if (!_cracksRef.value[key]) {
    _cracksRef.value[key] = generateCrackPoints(crackCount.value)
  }
  return _cracksRef.value[key]
})

const sparkles = computed(() => {
  if (shieldPercent.value >= 35) return []
  const count = Math.ceil((35 - shieldPercent.value) / 6)
  const arr = []
  const cx = 120, cy = 90
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = 80 + Math.random() * 20
    arr.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.72,
      r: 0.6 + Math.random() * 1.4,
      opacity: 0.4 + Math.random() * 0.6,
    })
  }
  return arr
})

const shipTransform = computed(() => props.isPlayer ? '' : '')

const hullStroke = computed(() =>
  props.isPlayer ? '#4fd1c5' : '#fc8181'
)

const hasBuffs = computed(() => {
  const b = props.extraBuffs || {}
  return b.attack > 0 || b.defense > 0 || b.evasion > 0
})
const hasDebuffs = computed(() => {
  const d = props.extraDebuffs || {}
  return d.defense > 0
})
const buffTurns = computed(() => props.extraBuffs?.turns_remaining || 0)
const debuffTurns = computed(() => props.extraDebuffs?.turns_remaining || 0)
</script>

<style scoped>
.shielded-ship {
  position: relative;
  width: 100%;
}
.ship-wrap {
  position: relative;
  width: 100%;
}
.ship-svg {
  width: 100%;
  height: auto;
  display: block;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 6px 18px rgba(0,0,0,0.6));
  transition: transform 0.3s ease;
}
.ship-svg.flipped {
  transform: scaleX(-1);
}
.is-player .ship-svg { filter: drop-shadow(0 6px 18px rgba(79, 209, 197, 0.25)); }
.is-dead {
  opacity: 0.4;
  filter: grayscale(0.8);
}
.engine-glow {
  transform-origin: right center;
  animation: enginePulse 0.8s ease-in-out infinite;
}
@keyframes enginePulse {
  0%, 100% { opacity: 0.7; transform: scaleX(1); }
  50% { opacity: 1; transform: scaleX(1.15); }
}
.smoke-dot {
  animation: smoke 2s ease-out infinite;
  transform-origin: center;
}
@keyframes smoke {
  0% { opacity: 0; transform: translate(0,0) scale(0.5); }
  50% { opacity: 0.9; transform: translate(-3px,-2px) scale(1); }
  100% { opacity: 0; transform: translate(-8px,-6px) scale(1.5); }
}

.shield-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  animation: shieldPulse 1.8s ease-in-out infinite;
  transform-origin: center;
}
.shield-layer.low {
  animation: shieldShake 0.4s ease-in-out infinite;
}
.shield-layer.critical {
  animation: shieldCritical 0.2s ease-in-out infinite;
}
@keyframes shieldPulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.015); filter: brightness(1.15); }
}
@keyframes shieldShake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-1px, 1px); }
  50% { transform: translate(1px, -1px); }
  75% { transform: translate(-1px, -1px); }
}
@keyframes shieldCritical {
  0%, 100% { opacity: 0.9; transform: scale(1) translate(0,0); }
  25% { opacity: 0.7; transform: scale(1.01) translate(-1px,0); }
  50% { opacity: 1; transform: scale(1.02) translate(1px,1px); }
  75% { opacity: 0.75; transform: scale(1.01) translate(0,-1px); }
}
.shield-svg {
  width: 100%;
  height: 100%;
}
.shield-ellipse {
  animation: shieldSpin 12s linear infinite;
  transform-origin: center;
}
@keyframes shieldSpin {
  0% { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -400; }
}
.crack {
  animation: crackFlicker 1.6s ease-in-out infinite;
  mix-blend-mode: screen;
}
@keyframes crackFlicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.sparkle {
  animation: sparkleAnim 1.2s ease-in-out infinite;
}
@keyframes sparkleAnim {
  0%, 100% { opacity: 0; transform: scale(0.4); }
  50% { opacity: 1; transform: scale(1.4); }
}

.hp-bars {
  position: relative;
  z-index: 4;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 6px;
}
.hp-row {
  display: grid;
  grid-template-columns: 60px 1fr 74px;
  gap: 8px;
  align-items: center;
}
.hp-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px;
  font-family: var(--font-title);
  letter-spacing: 0.08em;
  color: var(--text-dim);
  font-weight: 600;
}
.hp-icon { font-size: 11px; }
.shield-ico { color: var(--accent-blue); }
.hull-ico { color: var(--accent-orange); }
.hp-bar {
  position: relative;
  height: 12px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.hp-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.hp-fill::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.25), transparent);
}
.bar-shield .hp-fill {
  background: linear-gradient(90deg, #2b6cb0, #4fd1c5);
  box-shadow: inset 0 0 6px rgba(99, 179, 237, 0.5);
}
.bar-hull .hp-fill {
  background: linear-gradient(90deg, #c05621, #f6ad55);
  box-shadow: inset 0 0 6px rgba(237, 137, 54, 0.5);
}
.hp-seg {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  pointer-events: none;
}
.hp-seg span {
  border-right: 1px solid rgba(0,0,0,0.3);
}
.hp-seg span:last-child { border-right: none; }
.hp-val {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-body);
  color: var(--text-primary);
  text-align: right;
}

.ship-name-plate {
  margin-top: 10px;
  padding: 6px 14px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-primary);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.is-player .ship-name-plate {
  border-color: rgba(79, 209, 197, 0.3);
}
.ship-name-plate.dead {
  background: rgba(229, 62, 62, 0.1);
  border-color: rgba(229, 62, 62, 0.4);
}
.diff-dots {
  font-size: 7px;
  letter-spacing: 1px;
  color: var(--text-dim);
}
.diff-dots .active { color: var(--accent-gold); }
.dead-text {
  color: var(--accent-red);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.15em;
  animation: pulse-glow 1.2s infinite;
}

.status-icons {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.status-icon {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  border-radius: 4px;
  clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
}
.status-icon.buff {
  background: rgba(104, 211, 145, 0.2);
  border: 1px solid var(--accent-green);
  color: var(--accent-green);
}
.status-icon.debuff {
  background: rgba(229, 62, 62, 0.2);
  border: 1px solid var(--accent-red);
  color: var(--accent-red);
}
.status-icon.stun {
  background: rgba(183, 148, 244, 0.25);
  border: 1px solid var(--accent-purple);
  color: var(--accent-purple);
  animation: pulse-glow 1s infinite;
}
.status-turns {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 9px;
  font-family: var(--font-title);
  font-weight: 800;
  background: var(--bg-deep);
  padding: 0 3px;
  border-radius: 2px;
}
</style>
