<template>
  <div class="starmap-page">
    <div class="starmap-canvas-wrap">
      <canvas ref="canvasRef" class="starfield-canvas"></canvas>
      <svg class="planet-layer" :viewBox="`0 0 ${svgW} ${svgH}`" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" :stop-color="accentColor" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#000" stop-opacity="0" />
          </radialGradient>
          <filter id="planetShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="2" dy="2" result="offsetblur"/>
            <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <g v-if="currentPlanetId && targetPlanetId" class="travel-path">
          <path
            :d="travelPathD"
            fill="none"
            stroke="#4fd1c5"
            stroke-width="2"
            stroke-dasharray="8 6"
            opacity="0.6"
            class="path-anim"
          />
        </g>
        <g v-for="planet in planets" :key="planet.id">
          <LowPolyPlanet
            :cx="planet.pos_x * svgW / 100"
            :cy="planet.pos_y * svgH / 100"
            :size="planet.size"
            :color="planet.polygon_color"
            :is-current="planet.id === currentPlanetId"
            :is-target="planet.id === targetPlanetId"
            :name="planet.name"
            :faction="planet.faction"
            :danger="planet.danger_level"
            @click.native="selectPlanet(planet)"
          />
        </g>
      </svg>
    </div>

    <div class="top-hud">
      <div class="hud-left">
        <div class="hud-title">
          <span class="hud-icon">✦</span>
          <span>星图导航</span>
        </div>
        <div class="hud-location">
          <span class="loc-label">当前位置</span>
          <span class="loc-value" :style="{color: factionColor(currentPlanet?.faction)}">
            {{ currentPlanet?.name || '未知星域' }}
          </span>
        </div>
      </div>
      <div class="hud-center">
        <div class="hud-stat">
          <span class="stat-label">星币</span>
          <span class="credits stat-val">{{ credits }}</span>
        </div>
        <div class="hud-stat">
          <span class="stat-label">军方声望</span>
          <span class="stat-val rep-mil">{{ player?.reputation_military || 0 }}</span>
        </div>
        <div class="hud-stat">
          <span class="stat-label">海盗声望</span>
          <span class="stat-val rep-pir">{{ player?.reputation_pirate || 0 }}</span>
        </div>
      </div>
      <div class="hud-right">
        <button class="btn btn-sm" @click="openStation" v-if="currentPlanet">
          进入空间站 ⌂
        </button>
        <button class="btn btn-sm btn-danger" @click="backToSaves">
          存档菜单
        </button>
      </div>
    </div>

    <div class="ship-hud">
      <div class="ship-name">{{ ship?.name || '破船号' }}</div>
      <div class="ship-bars">
        <div class="bar-wrap">
          <div class="bar-label">
            <span class="bar-icon shield-icon">◈</span>
            <span>护盾</span>
            <span class="bar-num">{{ ship?.current_shield || 0 }} / {{ ship?.total_max_shield || 0 }}</span>
          </div>
          <div class="bar bar-shield">
            <div class="bar-fill" :style="{width: shieldPercent + '%'}"></div>
          </div>
        </div>
        <div class="bar-wrap">
          <div class="bar-label">
            <span class="bar-icon hull-icon">◆</span>
            <span>船体</span>
            <span class="bar-num">{{ ship?.current_hull || 0 }} / {{ ship?.total_max_hull || 0 }}</span>
          </div>
          <div class="bar bar-hull">
            <div class="bar-fill" :style="{width: hullPercent + '%'}"></div>
          </div>
        </div>
      </div>
      <div class="ship-stats-mini">
        <span title="攻击">⚔ {{ ship?.total_attack || 0 }}</span>
        <span title="防御">🛡 {{ ship?.total_defense || 0 }}</span>
        <span title="闪避">✧ {{ ship?.total_evasion || 0 }}%</span>
        <span title="护盾恢复">↻ {{ ship?.total_shield_regen || 0 }}</span>
      </div>
    </div>

    <Transition name="slide-right">
      <div v-if="selectedPlanet" class="planet-info-panel panel">
        <div class="panel-title">
          <h3>◆ 星球信息</h3>
          <button class="close-btn" @click="selectedPlanet = null">×</button>
        </div>
        <div class="panel-body">
          <div class="planet-info-header">
            <div class="planet-color-dot" :style="{background: selectedPlanet.polygon_color}"></div>
            <div>
              <div class="planet-name">{{ selectedPlanet.name }}</div>
              <span class="tag" :class="`tag-faction-${selectedPlanet.faction === 'corporate' ? 'corporate' : selectedPlanet.faction}`">
                {{ factionName(selectedPlanet.faction) }}
              </span>
            </div>
          </div>
          <p class="planet-desc">{{ selectedPlanet.description }}</p>
          <div class="planet-info-stats">
            <div class="info-row">
              <span class="info-label">危险等级</span>
              <span class="danger-stars">
                <span v-for="i in 5" :key="i" :class="{active: i <= selectedPlanet.danger_level}">★</span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">商店</span>
              <span :class="selectedPlanet.has_shop ? 'yes' : 'no'">{{ selectedPlanet.has_shop ? '● 有' : '○ 无' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">任务板</span>
              <span :class="selectedPlanet.has_mission_board ? 'yes' : 'no'">{{ selectedPlanet.has_mission_board ? '● 有' : '○ 无' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">维修</span>
              <span :class="selectedPlanet.has_repair ? 'yes' : 'no'">{{ selectedPlanet.has_repair ? '● 有' : '○ 无' }}</span>
            </div>
          </div>
          <div class="planet-actions">
            <button
              class="btn btn-primary btn-lg btn-block"
              :disabled="selectedPlanet.id === currentPlanetId || traveling"
              @click="travelToPlanet"
            >
              <template v-if="selectedPlanet.id === currentPlanetId">
                当前所在位置
              </template>
              <template v-else-if="traveling">
                跃迁中...
              </template>
              <template v-else>
                ⚡ 跃迁至此 (约 ₵ {{ travelCost }})
              </template>
            </button>
            <button
              v-if="selectedPlanet.id === currentPlanetId"
              class="btn btn-gold btn-block"
              @click="openStation"
            >
              进入空间站 ⌂
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast-fade">
      <div v-if="toast" class="toast" :class="toast.type === 'error' ? 'toast-error' : ''">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'
import LowPolyPlanet from '../components/LowPolyPlanet.vue'

const router = useRouter()
const store = useGameStore()

const canvasRef = ref(null)
const planets = ref([])
const selectedPlanet = ref(null)
const targetPlanetId = ref(null)
const traveling = ref(false)
const svgW = 1000
const svgH = 600
const accentColor = '#4fd1c5'

let animFrame = null
let stars = []
let mouseX = 0.5
let mouseY = 0.5

const toast = computed(() => store.toast)
const player = computed(() => store.player)
const ship = computed(() => store.ship)
const credits = computed(() => store.credits)
const currentPlanetId = computed(() => player.value?.current_planet_id)
const currentPlanet = computed(() =>
  planets.value.find(p => p.id === currentPlanetId.value)
)

const shieldPercent = computed(() => {
  const s = ship.value
  if (!s) return 0
  return Math.max(0, Math.min(100, (s.current_shield / s.total_max_shield) * 100))
})
const hullPercent = computed(() => {
  const s = ship.value
  if (!s) return 0
  return Math.max(0, Math.min(100, (s.current_hull / s.total_max_hull) * 100))
})

const travelPathD = computed(() => {
  if (!currentPlanet.value || !targetPlanet.value) return ''
  const x1 = currentPlanet.value.pos_x * svgW / 100
  const y1 = currentPlanet.value.pos_y * svgH / 100
  const x2 = targetPlanet.value.pos_x * svgW / 100
  const y2 = targetPlanet.value.pos_y * svgH / 100
  const mx = (x1 + x2) / 2 + (y2 - y1) * 0.15
  const my = (y1 + y2) / 2 - (x2 - x1) * 0.15
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`
})

const targetPlanet = computed(() =>
  planets.value.find(p => p.id === targetPlanetId.value)
)

const travelCost = computed(() => {
  if (!currentPlanet.value || !selectedPlanet.value) return 0
  const dx = selectedPlanet.value.pos_x - currentPlanet.value.pos_x
  const dy = selectedPlanet.value.pos_y - currentPlanet.value.pos_y
  return Math.floor(Math.sqrt(dx * dx + dy * dy) * 2)
})

function factionColor(f) {
  const m = { military: '#63b3ed', pirate: '#fc8181', corporate: '#b794f4', neutral: '#a0aec0', ruin: '#9f7aea' }
  return m[f] || '#a0aec0'
}
function factionName(f) {
  const m = { military: '联邦军方', pirate: '海盗联盟', corporate: '星际企业', neutral: '中立区', ruin: '遗迹区' }
  return m[f] || '未知'
}

function initStarfield() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  const LAYERS = [
    { count: 500, speed: 0.02, size: [0.3, 0.7], alpha: [0.2, 0.4] },
    { count: 700, speed: 0.06, size: [0.5, 1.1], alpha: [0.4, 0.7] },
    { count: 350, speed: 0.12, size: [0.9, 1.8], alpha: [0.7, 1.0] },
  ]
  const COLORS = ['#ffffff', '#a0d8ff', '#ffd580', '#ff9a9a', '#b794f4']

  stars = LAYERS.flatMap(layer =>
    Array.from({ length: layer.count }, () => ({
      x: Math.random(),
      y: Math.random(),
      ox: Math.random(),
      oy: Math.random(),
      r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
      baseAlpha: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: layer.speed,
    }))
  )

  function drawNebula(W, H) {
    const nebs = [
      { cx: W * 0.15 + Math.sin(mouseX * 0.5) * 40, cy: H * 0.2, r: 500, c: 'rgba(79, 209, 197, 0.05)' },
      { cx: W * 0.85, cy: H * 0.75 + Math.cos(mouseY * 0.5) * 40, r: 600, c: 'rgba(183, 148, 244, 0.05)' },
      { cx: W * 0.5, cy: H * 0.5, r: 400, c: 'rgba(99, 179, 237, 0.03)' },
    ]
    nebs.forEach(g => {
      const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r)
      grad.addColorStop(0, g.c)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    })
  }

  let t = 0
  function animate() {
    const W = canvas.width
    const H = canvas.height
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, W, H)
    drawNebula(W, H)
    t += 0.016

    stars.forEach(s => {
      const parallax = s.speed * 8
      const gx = (s.x + (mouseX - 0.5) * -parallax + 1) % 1
      const gy = (s.y + (mouseY - 0.5) * -parallax + 1) % 1
      const px = gx * W
      const py = gy * H

      const twinkle = 0.7 + 0.3 * Math.sin(t * s.twinkleSpeed + s.twinklePhase)
      const alpha = s.baseAlpha * twinkle

      ctx.beginPath()
      ctx.arc(px, py, s.r, 0, Math.PI * 2)
      ctx.fillStyle = s.color
      ctx.globalAlpha = alpha
      ctx.fill()

      if (s.r > 1.2) {
        ctx.beginPath()
        ctx.arc(px, py, s.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = s.color
        ctx.globalAlpha = alpha * 0.1
        ctx.fill()
      }
    })

    ctx.globalAlpha = 1
    animFrame = requestAnimationFrame(animate)
  }
  animate()

  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', onMouseMove)
}

function onMouseMove(e) {
  mouseX = e.clientX / window.innerWidth
  mouseY = e.clientY / window.innerHeight
}

function selectPlanet(planet) {
  selectedPlanet.value = planet
  if (planet.id !== currentPlanetId.value) {
    targetPlanetId.value = planet.id
  } else {
    targetPlanetId.value = null
  }
}

async function travelToPlanet() {
  if (!selectedPlanet.value) return
  if (selectedPlanet.value.id === currentPlanetId.value) return
  traveling.value = true
  const ok = await store.travelTo(selectedPlanet.value.id)
  traveling.value = false
  if (ok) {
    targetPlanetId.value = null
  }
}

function openStation() {
  router.push('/station')
}

function backToSaves() {
  store.logout()
  router.push('/')
}

onMounted(async () => {
  if (!store.saveId) {
    const sid = localStorage.getItem('current_save_id')
    if (!sid) { router.push('/'); return }
    store.saveId = Number(sid)
  }
  await store.refreshState()
  planets.value = await store.loadPlanets()
  initStarfield()
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>

<style scoped>
.starmap-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-deep);
}

.starmap-canvas-wrap {
  position: absolute;
  inset: 0;
}
.starfield-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.planet-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.planet-layer :deep(.planet-node) {
  pointer-events: auto;
  cursor: pointer;
}

.path-anim {
  stroke-dashoffset: 0;
  animation: dashmove 1.5s linear infinite;
}
@keyframes dashmove {
  to { stroke-dashoffset: -28; }
}

.top-hud {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 20px;
}
.hud-left, .hud-center, .hud-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.hud-center { justify-content: center; }
.hud-right { justify-content: flex-end; }

.hud-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  font-family: var(--font-title);
  font-size: 14px;
  color: var(--accent-cyan);
  letter-spacing: 0.1em;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.hud-icon { color: var(--accent-gold); }

.hud-location {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.loc-label {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-family: var(--font-title);
}
.loc-value {
  font-family: var(--font-title);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.hud-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 18px;
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-subtle);
  min-width: 100px;
}
.stat-label {
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-family: var(--font-title);
}
.stat-val {
  font-weight: 700;
  font-size: 15px;
  margin-top: 2px;
}
.rep-mil { color: var(--accent-blue); }
.rep-pir { color: #fc8181; }

.ship-hud {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  width: 360px;
  padding: 16px 20px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
}
.ship-name {
  font-family: var(--font-title);
  font-size: 15px;
  color: var(--text-bright);
  margin-bottom: 12px;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ship-name::before {
  content: '▣';
  color: var(--accent-cyan);
  font-size: 12px;
}
.ship-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.bar-wrap { display: flex; flex-direction: column; gap: 4px; }
.bar-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}
.bar-label span { display: flex; align-items: center; gap: 6px; }
.bar-num { font-weight: 600; font-size: 11px; color: var(--text-primary); }
.shield-icon { color: var(--accent-blue); }
.hull-icon { color: var(--accent-orange); }

.ship-stats-mini {
  display: flex;
  gap: 14px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
}

.planet-info-panel {
  position: absolute;
  top: 100px;
  right: 20px;
  width: 340px;
  z-index: 10;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  font-size: 22px;
  line-height: 1;
  padding: 0 6px;
}
.close-btn:hover { color: var(--accent-red); }

.planet-info-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.planet-color-dot {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
  box-shadow: 0 0 20px currentColor;
}
.planet-name {
  font-family: var(--font-title);
  font-size: 19px;
  font-weight: 700;
  color: var(--text-bright);
  margin-bottom: 4px;
  letter-spacing: 0.05em;
}

.planet-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.7;
  padding: 12px;
  background: var(--bg-deep);
  border-radius: 4px;
  border-left: 2px solid var(--accent-cyan-dim);
  margin-bottom: 16px;
}

.planet-info-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-glass-light);
  font-size: 12px;
}
.info-label {
  color: var(--text-dim);
  font-family: var(--font-title);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.danger-stars { color: var(--text-dim); letter-spacing: 3px; }
.danger-stars .active { color: var(--accent-gold); }
.info-row .yes { color: var(--accent-green); font-weight: 700; }
.info-row .no { color: var(--text-dim); }

.planet-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn-block { width: 100%; }
.btn-sm { padding: 8px 14px; font-size: 11px; }

.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from, .slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@media (max-width: 960px) {
  .top-hud { grid-template-columns: 1fr; row-gap: 10px; }
  .hud-right { justify-content: center; }
  .planet-info-panel { top: auto; bottom: 140px; right: 20px; left: 20px; width: auto; }
  .ship-hud { width: calc(100vw - 40px); }
}
</style>
