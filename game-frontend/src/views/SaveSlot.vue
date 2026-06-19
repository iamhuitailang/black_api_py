<template>
  <div class="save-page">
    <div class="starfield-bg">
      <canvas ref="canvasRef"></canvas>
    </div>

    <div class="hero-section">
      <h1 class="game-title">
        <span class="title-main">银河边缘</span>
        <span class="title-sub">BOUNTY HUNTER · 赏金猎人</span>
      </h1>
      <p class="tagline">漂泊在黑暗深空 · 唯有星辰与金币是朋友</p>
    </div>

    <div class="content-wrapper">
      <div class="panel create-panel">
        <div class="panel-title">
          <h3>◆ 创建新航程</h3>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label>猎人代号</label>
            <input
              v-model="playerName"
              type="text"
              class="input-field"
              placeholder="输入你的名字..."
              maxlength="12"
              @keyup.enter="handleCreate"
            />
          </div>
          <button
            class="btn btn-primary btn-lg btn-block"
            :disabled="!playerName.trim() || loading"
            @click="handleCreate"
          >
            {{ loading ? '初始化中...' : '启航 · 破船号' }}
          </button>
          <p class="tip-text">初始装备：破旧激光炮、生锈装甲、老推进器 · 启动资金 ₵ 1000</p>
        </div>
      </div>

      <div class="panel saves-panel">
        <div class="panel-title">
          <h3>◆ 已有航程档案</h3>
          <span class="save-count">{{ saves.length }} 份存档</span>
        </div>
        <div class="panel-body saves-body">
          <div v-if="loadingSaves" class="empty-state">
            <div class="empty-state-icon">⚙</div>
            <p>载入中...</p>
          </div>
          <div v-else-if="saves.length === 0" class="empty-state">
            <div class="empty-state-icon">✦</div>
            <p>暂无存档记录</p>
            <p class="sub-tip">创建你的第一段深空传说吧</p>
          </div>
          <div v-else class="save-list">
            <div
              v-for="save in saves"
              :key="save.id"
              class="save-card"
              @click="handleLoad(save)"
            >
              <div class="save-card-header">
                <div class="save-avatar">
                  <span v-if="save.reputation_pirate <= save.reputation_military">⚔</span>
                  <span v-else>☠</span>
                </div>
                <div class="save-info">
                  <div class="save-name">{{ save.player_name }}</div>
                  <div class="save-id">档案 #{{ String(save.id).padStart(4, '0') }}</div>
                </div>
                <button
                  class="btn btn-danger btn-sm"
                  @click.stop="handleDelete(save.id)"
                >删除</button>
              </div>
              <div class="save-stats">
                <div class="mini-stat">
                  <span class="mini-label">星币</span>
                  <span class="credits">{{ save.credits }}</span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">军方</span>
                  <span class="rep-mil" :class="{neg: save.reputation_military < 0}">
                    {{ save.reputation_military > 0 ? '+' : '' }}{{ save.reputation_military }}
                  </span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">海盗</span>
                  <span class="rep-pir" :class="{neg: save.reputation_pirate < 0}">
                    {{ save.reputation_pirate > 0 ? '+' : '' }}{{ save.reputation_pirate }}
                  </span>
                </div>
                <div class="mini-stat">
                  <span class="mini-label">任务</span>
                  <span class="stat-val">{{ save.completed_missions }}/{{ save.total_missions }}</span>
                </div>
              </div>
              <div class="save-footer">
                <span class="save-time">更新于 {{ formatTime(save.updated_at) }}</span>
                <span class="load-hint">点击载入 →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="toast-fade">
      <div v-if="toast" class="toast" :class="toast.type === 'error' ? 'toast-error' : ''">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/game'

const router = useRouter()
const store = useGameStore()

const canvasRef = ref(null)
const playerName = ref('漂泊者')
const saves = ref([])
const loading = ref(false)
const loadingSaves = ref(true)

const toast = computed(() => store.toast)

let animFrame = null

function drawStarfield() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width = window.innerWidth
  const H = canvas.height = window.innerHeight

  const LAYERS = [
    { count: 400, speed: 0.05, size: [0.3, 0.8], alpha: [0.2, 0.5] },
    { count: 600, speed: 0.1, size: [0.5, 1.2], alpha: [0.4, 0.7] },
    { count: 300, speed: 0.2, size: [0.8, 1.8], alpha: [0.7, 1.0] },
  ]
  const COLORS = ['#ffffff', '#a0d8ff', '#ffd580', '#ff9a9a']

  const stars = LAYERS.flatMap(layer =>
    Array.from({ length: layer.count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
      baseAlpha: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinklePhase: Math.random() * Math.PI * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: layer.speed,
    }))
  )

  function drawNebula() {
    const gradients = [
      { cx: W * 0.2, cy: H * 0.3, r: 400, color: 'rgba(79, 209, 197, 0.04)' },
      { cx: W * 0.8, cy: H * 0.7, r: 500, color: 'rgba(183, 148, 244, 0.04)' },
      { cx: W * 0.6, cy: H * 0.4, r: 350, color: 'rgba(99, 179, 237, 0.03)' },
    ]
    gradients.forEach(g => {
      const grad = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, g.r)
      grad.addColorStop(0, g.color)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    })
  }

  let t = 0
  function animate() {
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, W, H)

    drawNebula()
    t += 0.016

    stars.forEach(s => {
      s.x += s.speed
      if (s.x > W) s.x = 0

      const twinkle = 0.7 + 0.3 * Math.sin(t * s.twinkleSpeed + s.twinklePhase)
      const alpha = s.baseAlpha * twinkle

      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = s.color
      ctx.globalAlpha = alpha
      ctx.fill()

      if (s.r > 1) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = s.color
        ctx.globalAlpha = alpha * 0.15
        ctx.fill()
      }
    })

    ctx.globalAlpha = 1
    animFrame = requestAnimationFrame(animate)
  }

  animate()
}

function handleResize() {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
  }
}

async function loadSaves() {
  loadingSaves.value = true
  saves.value = await store.loadSaves()
  loadingSaves.value = false
}

async function handleCreate() {
  const name = playerName.value.trim()
  if (!name) return
  loading.value = true
  const ok = await store.createNewGame(name)
  loading.value = false
  if (ok) router.push('/starmap')
}

function handleLoad(save) {
  store.selectSave(save.id)
  router.push('/starmap')
}

async function handleDelete(id) {
  if (!confirm('确认删除该航程档案？此操作不可撤销。')) return
  const ok = await store.deleteSave(id)
  if (ok) await loadSaves()
}

function formatTime(iso) {
  if (!iso) return '未知'
  const d = new Date(iso)
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(() => {
  const sid = localStorage.getItem('current_save_id')
  if (sid) store.saveId = Number(sid)
  drawStarfield()
  window.addEventListener('resize', handleResize)
  loadSaves()
})

onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.save-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}
.starfield-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
}
.starfield-bg canvas {
  display: block;
}

.hero-section {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 80px 20px 50px;
}

.game-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.title-main {
  font-family: var(--font-title);
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 900;
  letter-spacing: 0.15em;
  background: linear-gradient(135deg, #4fd1c5 0%, #63b3ed 50%, #b794f4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 80px rgba(79, 209, 197, 0.3);
  animation: title-glow 3s ease-in-out infinite;
}
@keyframes title-glow {
  0%, 100% { filter: drop-shadow(0 0 30px rgba(79,209,197,0.3)); }
  50% { filter: drop-shadow(0 0 50px rgba(99,179,237,0.5)); }
}
.title-sub {
  font-family: var(--font-title);
  font-size: clamp(12px, 1.8vw, 18px);
  color: var(--text-dim);
  letter-spacing: 0.5em;
  font-weight: 500;
}
.tagline {
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 14px;
  letter-spacing: 0.1em;
  font-style: italic;
  opacity: 0.8;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px 80px;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 30px;
}

.create-panel, .saves-panel {
  height: fit-content;
}

.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-family: var(--font-title);
  font-size: 12px;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.input-field {
  width: 100%;
  padding: 14px 16px;
  font-family: var(--font-body);
  font-size: 15px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  color: var(--text-bright);
  outline: none;
  transition: all 0.2s ease;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.input-field:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 3px rgba(79, 209, 197, 0.1);
}
.btn-block {
  width: 100%;
}
.tip-text {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-deep);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-dim);
  line-height: 1.6;
  border-left: 2px solid var(--accent-cyan-dim);
}

.save-count {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--text-dim);
}

.saves-body {
  max-height: 500px;
  overflow-y: auto;
}

.save-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.save-card {
  padding: 18px;
  background: var(--bg-deep);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.save-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--accent-cyan);
  transform: scaleY(0);
  transition: transform 0.2s ease;
}
.save-card:hover {
  border-color: var(--border-glow);
  background: var(--bg-secondary);
  transform: translateX(4px);
}
.save-card:hover::before {
  transform: scaleY(1);
}

.save-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.save-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-glow);
  font-size: 22px;
  flex-shrink: 0;
}

.save-info {
  flex: 1;
  min-width: 0;
}
.save-name {
  font-family: var(--font-title);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-bright);
  margin-bottom: 2px;
}
.save-id {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.05em;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 11px;
}

.save-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
  padding: 10px;
  background: var(--bg-glass-light);
  border-radius: 4px;
}
.mini-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.mini-label {
  font-size: 9px;
  color: var(--text-dim);
  font-family: var(--font-title);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.stat-val {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.rep-mil { color: var(--faction-military); font-weight: 700; font-size: 13px; }
.rep-mil.neg { color: var(--accent-red); }
.rep-pir { color: #fc8181; font-weight: 700; font-size: 13px; }
.rep-pir.neg { color: var(--faction-military); }

.save-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
}
.save-time {
  font-size: 11px;
  color: var(--text-dim);
}
.load-hint {
  font-family: var(--font-title);
  font-size: 11px;
  color: var(--accent-cyan);
  letter-spacing: 0.1em;
}

.sub-tip {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

@media (max-width: 960px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
