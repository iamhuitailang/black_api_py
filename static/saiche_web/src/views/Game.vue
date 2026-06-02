<template>
  <div class="min-h-screen p-4">
    <div v-if="!gameStarted && !gameEnded" class="max-w-4xl mx-auto">
      <div class="card p-8 text-center">
        <h2 class="text-3xl font-bold mb-4">{{ track?.name || '赛道' }}</h2>
        <p class="text-white/60 mb-8">{{ track?.description }}</p>
        
        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="text-center">
            <div class="text-2xl">🏎️</div>
            <div class="text-sm text-white/60 mt-1">当前赛车</div>
            <div class="font-bold">{{ activeCar?.car_name || '新手赛车' }}</div>
          </div>
          <div class="text-center">
            <div class="text-2xl">🔄</div>
            <div class="text-sm text-white/60 mt-1">圈数</div>
            <div class="font-bold">{{ track?.laps || 3 }}圈</div>
          </div>
          <div class="text-center">
            <div class="text-2xl">💰</div>
            <div class="text-sm text-white/60 mt-1">获胜奖励</div>
            <div class="font-bold text-yellow-400">{{ track?.reward_coins || 100 }}</div>
          </div>
        </div>

        <button @click="startGame" class="btn-primary text-xl px-12 py-4">
          🚀 开始比赛
        </button>
      </div>
    </div>

    <div v-if="gameStarted && !gameEnded" class="relative">
      <div class="absolute top-4 left-4 z-10 card px-4 py-2">
        <div class="text-sm text-white/60">第 {{ currentLap }}/{{ totalLaps }} 圈</div>
        <div class="text-2xl font-bold font-mono">{{ formatTime(elapsedTime) }}</div>
      </div>

      <div class="absolute top-4 right-4 z-10 card px-4 py-2">
        <div class="text-sm text-white/60">当前道具</div>
        <div class="text-2xl text-center">{{ currentItem?.icon || '🎁' }}</div>
        <div class="text-xs text-center mt-1">{{ currentItem?.name || '无' }}</div>
      </div>

      <div class="flex justify-center">
        <canvas ref="gameCanvas" width="800" height="600" class="border-4 border-white/20 rounded-2xl"></canvas>
      </div>

      <div class="mt-4 text-center">
        <div class="card inline-block px-6 py-3">
          <div class="text-sm text-white/60 mb-2">操作说明</div>
          <div class="flex gap-6 text-sm">
            <span><kbd class="px-2 py-1 bg-white/10 rounded">↑</kbd> 加速</span>
            <span><kbd class="px-2 py-1 bg-white/10 rounded">←</kbd> 左转</span>
            <span><kbd class="px-2 py-1 bg-white/10 rounded">→</kbd> 右转</span>
            <span><kbd class="px-2 py-1 bg-white/10 rounded">↓</kbd> 刹车</span>
            <span><kbd class="px-2 py-1 bg-white/10 rounded">空格</kbd> 使用道具</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="gameEnded" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="card p-8 text-center max-w-md">
        <div class="text-6xl mb-4">{{ isWinner ? '🏆' : '🎮' }}</div>
        <h2 class="text-3xl font-bold mb-2">{{ isWinner ? '恭喜获胜！' : '比赛完成' }}</h2>
        <p class="text-white/60 mb-6">用时: {{ formatTime(finishTime) }}</p>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-white/5 p-4 rounded-xl">
            <div class="text-2xl font-bold text-yellow-400">+{{ reward?.reward_coins || 0 }}</div>
            <div class="text-sm text-white/60">金币</div>
          </div>
          <div class="bg-white/5 p-4 rounded-xl">
            <div class="text-2xl font-bold text-blue-400">+{{ reward?.reward_exp || 0 }}</div>
            <div class="text-sm text-white/60">经验</div>
          </div>
        </div>

        <div v-if="reward?.new_achievements?.length > 0" class="mb-6">
          <div class="text-sm text-white/60 mb-2">🎉 解锁新成就</div>
          <div v-for="item in reward.new_achievements" :key="item.achievement.id"
               class="flex items-center justify-between bg-yellow-500/20 p-2 rounded-lg mb-2">
            <span>{{ item.achievement.icon }} {{ item.achievement.name }}</span>
            <span class="text-yellow-400">+{{ item.reward_coins }}💰</span>
          </div>
        </div>

        <div class="flex gap-4">
          <button @click="restartGame" class="btn-secondary flex-1">
            再来一局
          </button>
          <router-link to="/tracks" class="btn-primary flex-1 text-center">
            返回赛道
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const gameCanvas = ref(null)
const track = ref(null)
const activeCar = ref(null)
const gameStarted = ref(false)
const gameEnded = ref(false)
const isWinner = ref(false)
const currentLap = ref(1)
const totalLaps = ref(3)
const elapsedTime = ref(0)
const finishTime = ref(0)
const reward = ref(null)
const currentItem = ref(null)

let gameLoop = null
let timerInterval = null
let ctx = null
let car = { x: 400, y: 300, angle: 0, speed: 0 }
let keys = {}

onMounted(async () => {
  await loadTrack()
  await loadActiveCar()
  setupKeyboard()
})

onUnmounted(() => {
  cleanupGame()
})

async function loadTrack() {
  const trackId = route.params.trackId
  const response = await api.get(`/saiche/track/detail/get?track_id=${trackId}`)
  if (response.code === 0) {
    track.value = response.data
    totalLaps.value = track.value.laps || 3
  }
}

async function loadActiveCar() {
  const response = await api.get('/saiche/car/active/get')
  if (response.code === 0) {
    activeCar.value = response.data
  }
}

function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true
    if (e.key === ' ' && currentItem.value) {
      useItem()
    }
  })
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false
  })
}

function startGame() {
  gameStarted.value = true
  ctx = gameCanvas.value.getContext('2d')
  car = { x: 400, y: 300, angle: 0, speed: 0 }
  currentLap.value = 1
  elapsedTime.value = 0
  gameEnded.value = false

  getRandomItem()

  timerInterval = setInterval(() => {
    elapsedTime.value += 0.1
  }, 100)

  gameLoop = setInterval(updateGame, 16)
}

function updateGame() {
  const speedMultiplier = (activeCar.value?.current_speed || 100) / 100

  if (keys['ArrowUp']) {
    car.speed = Math.min(car.speed + 0.3 * speedMultiplier, 8)
  } else if (keys['ArrowDown']) {
    car.speed = Math.max(car.speed - 0.5, -2)
  } else {
    car.speed *= 0.95
  }

  if (keys['ArrowLeft'] && Math.abs(car.speed) > 0.1) {
    car.angle -= 0.05 * (car.speed > 0 ? 1 : -1)
  }
  if (keys['ArrowRight'] && Math.abs(car.speed) > 0.1) {
    car.angle += 0.05 * (car.speed > 0 ? 1 : -1)
  }

  car.x += Math.cos(car.angle) * car.speed
  car.y += Math.sin(car.angle) * car.speed

  car.x = Math.max(30, Math.min(770, car.x))
  car.y = Math.max(30, Math.min(570, car.y))

  const distToCenter = Math.sqrt((car.x - 400) ** 2 + (car.y - 300) ** 2)
  if (distToCenter > 200 && distToCenter < 250 && car.speed > 5) {
    if (currentLap.value < totalLaps.value) {
      currentLap.value++
    } else {
      endGame()
    }
  }

  drawGame()
}

function drawGame() {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 800, 600)

  ctx.strokeStyle = '#4a5568'
  ctx.lineWidth = 60
  ctx.beginPath()
  ctx.arc(400, 300, 225, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#718096'
  ctx.lineWidth = 2
  ctx.setLineDash([20, 20])
  ctx.beginPath()
  ctx.arc(400, 300, 225, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(400, 75)
  ctx.lineTo(400, 105)
  ctx.stroke()

  ctx.save()
  ctx.translate(car.x, car.y)
  ctx.rotate(car.angle)

  ctx.fillStyle = '#ff6b00'
  ctx.beginPath()
  ctx.moveTo(20, 0)
  ctx.lineTo(-15, -12)
  ctx.lineTo(-10, 0)
  ctx.lineTo(-15, 12)
  ctx.closePath()
  ctx.fill()

  if (car.speed > 3) {
    ctx.fillStyle = 'rgba(255, 200, 0, 0.6)'
    ctx.beginPath()
    ctx.moveTo(-10, 0)
    ctx.lineTo(-25 - Math.random() * 10, -5)
    ctx.lineTo(-25 - Math.random() * 10, 5)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()
}

async function getRandomItem() {
  const response = await api.get('/saiche/item/random/get')
  if (response.code === 0) {
    currentItem.value = response.data
  }
}

function useItem() {
  if (!currentItem.value) return
  
  if (currentItem.value.type === 'speed') {
    car.speed += 5
  }
  
  currentItem.value = null
  
  setTimeout(() => {
    getRandomItem()
  }, 3000)
}

async function endGame() {
  cleanupGame()
  gameEnded.value = true
  finishTime.value = elapsedTime.value
  isWinner.value = true

  const response = await api.post('/saiche/race/finish', {
    track_id: track.value.id,
    car_id: activeCar.value?.car_id || 1,
    finish_time: finishTime.value,
    best_lap: finishTime.value / totalLaps.value,
    rank: 1
  })

  if (response.code === 0) {
    reward.value = response.data
    await userStore.updateUser()
  }
}

function restartGame() {
  gameEnded.value = false
  reward.value = null
  startGame()
}

function cleanupGame() {
  if (gameLoop) clearInterval(gameLoop)
  if (timerInterval) clearInterval(timerInterval)
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`
}
</script>
