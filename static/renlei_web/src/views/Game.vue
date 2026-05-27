<template>
  <div class="game-container">
    <div class="game-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">← 退出</button>
        <span class="level-name">{{ currentLevel?.name }}</span>
      </div>
      <div class="header-center">
        <span class="timer">⏱️ {{ formatTime(elapsedTime) }}</span>
      </div>
      <div class="header-right">
        <button @click="resetLevel" class="reset-btn">🔄 重置 (R)</button>
      </div>
    </div>

    <div class="game-area">
      <canvas ref="gameCanvas" class="game-canvas" width="1200" height="600"></canvas>
    </div>

    <div class="game-controls">
      <div class="control-group">
        <span class="control-label">移动</span>
        <div class="control-keys">
          <span class="key">←</span>
          <span class="key">→</span>
        </div>
      </div>
      <div class="control-group">
        <span class="control-label">跳跃/起身</span>
        <span class="key">↑</span>
      </div>
      <div class="control-group">
        <span class="control-label">俯身</span>
        <span class="key">↓</span>
      </div>
      <div class="control-group">
        <span class="control-label">左手抓取</span>
        <span class="key">Q</span>
      </div>
      <div class="control-group">
        <span class="control-label">右手抓取</span>
        <span class="key">E</span>
      </div>
    </div>

    <div v-if="showVictory" class="modal-overlay">
      <div class="modal victory-modal">
        <h2>🎉 恭喜通关！</h2>
        <p>用时: {{ formatTime(elapsedTime) }}</p>
        <div class="modal-buttons">
          <button @click="nextLevel" class="btn btn-primary" v-if="hasNextLevel">下一关</button>
          <button @click="replayLevel" class="btn btn-warning">重玩</button>
          <button @click="goBack" class="btn btn-success">返回主页</button>
        </div>
      </div>
    </div>

    <div v-if="showGameOver" class="modal-overlay">
      <div class="modal gameover-modal">
        <h2>💥 挑战失败</h2>
        <p>不要气馁，再试一次！</p>
        <div class="modal-buttons">
          <button @click="resetLevel" class="btn btn-primary">重试</button>
          <button @click="goBack" class="btn btn-warning">返回主页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import { useGameStore } from '../store/game'
import Matter from 'matter-js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const gameStore = useGameStore()

const gameCanvas = ref(null)
const currentLevel = ref(null)
const currentCharacter = ref(null)
const elapsedTime = ref(0)
const showVictory = ref(false)
const showGameOver = ref(false)
const hasNextLevel = ref(false)

let engine = null
let render = null
let runner = null
let player = null
let gameLoop = null
let keys = {}
let isGrabbingLeft = false
let isGrabbingRight = false
let grabbedObjectLeft = null
let grabbedObjectRight = null

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const initGame = async () => {
  const levelId = parseInt(route.params.levelId)
  await userStore.getLevels()
  await userStore.getCharacters()
  
  currentLevel.value = userStore.levels.find(l => l.id === levelId)
  currentCharacter.value = userStore.characters.find(
    c => c.id === userStore.userInfo?.current_character_id
  ) || userStore.characters[0]
  
  const nextLevelIndex = userStore.levels.findIndex(l => l.id === levelId) + 1
  hasNextLevel.value = nextLevelIndex < userStore.levels.length
  
  await userStore.incrementAttempts(levelId)
  await gameStore.createSession(levelId, currentCharacter.value.id)
  
  initPhysics()
  startTimer()
}

const initPhysics = () => {
  const canvas = gameCanvas.value
  const ctx = canvas.getContext('2d')
  
  const Engine = Matter.Engine
  const Render = Matter.Render
  const Runner = Matter.Runner
  const Bodies = Matter.Bodies
  const Composite = Matter.Composite
  const Constraint = Matter.Constraint
  const Events = Matter.Events
  const Body = Matter.Body
  
  engine = Engine.create({
    gravity: { x: 0, y: 1 }
  })
  
  render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: 1200,
      height: 600,
      wireframes: false,
      background: 'transparent'
    }
  })
  
  const ground = Bodies.rectangle(600, 580, 1200, 40, {
    isStatic: true,
    render: { fillStyle: '#8B4513' }
  })
  
  const leftWall = Bodies.rectangle(0, 300, 40, 600, {
    isStatic: true,
    render: { fillStyle: 'transparent' }
  })
  
  const rightWall = Bodies.rectangle(1200, 300, 40, 600, {
    isStatic: true,
    render: { fillStyle: 'transparent' }
  })
  
  player = createPlayer(
    currentLevel.value?.start_position?.x || 100,
    currentLevel.value?.start_position?.y || 400
  )
  
  const goal = Bodies.rectangle(
    currentLevel.value?.end_position?.x || 1100,
    currentLevel.value?.end_position?.y || 400,
    60, 80,
    {
      isStatic: true,
      isSensor: true,
      render: { fillStyle: '#FFD700' },
      label: 'goal'
    }
  )
  
  Composite.add(engine.world, [ground, leftWall, rightWall, goal, ...player.bodies])
  player.constraints.forEach(c => Composite.add(engine.world, c))
  
  createLevelObstacles(currentLevel.value, Composite, Bodies)
  
  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((pair) => {
      if (pair.bodyA.label === 'goal' || pair.bodyB.label === 'goal') {
        const playerBody = pair.bodyA.label === 'goal' ? pair.bodyB : pair.bodyA
        if (playerBody.label && playerBody.label.startsWith('player_')) {
          handleVictory()
        }
      }
    })
  })
  
  Render.run(render)
  runner = Runner.create()
  Runner.run(runner, engine)
  
  const customRender = () => {
    drawBackground(ctx, currentLevel.value?.level_type)
    drawPlayer(ctx, player, currentCharacter.value)
    drawGoal(ctx, currentLevel.value?.end_position)
    requestAnimationFrame(customRender)
  }
  customRender()
}

const createPlayer = (x, y) => {
  const Bodies = Matter.Bodies
  const Constraint = Matter.Constraint
  const Body = Matter.Body
  
  const head = Bodies.circle(x, y - 50, 20, {
    label: 'player_head',
    restitution: 0.5,
    friction: 0.1,
    render: { fillStyle: 'transparent' }
  })
  
  const body = Bodies.rectangle(x, y, 30, 45, {
    label: 'player_body',
    restitution: 0.3,
    friction: 0.1,
    render: { fillStyle: 'transparent' }
  })
  
  const leftArm = Bodies.rectangle(x - 25, y - 5, 10, 35, {
    label: 'player_leftArm',
    restitution: 0.3,
    friction: 0.5,
    render: { fillStyle: 'transparent' }
  })
  
  const rightArm = Bodies.rectangle(x + 25, y - 5, 10, 35, {
    label: 'player_rightArm',
    restitution: 0.3,
    friction: 0.5,
    render: { fillStyle: 'transparent' }
  })
  
  const leftLeg = Bodies.rectangle(x - 10, y + 35, 10, 30, {
    label: 'player_leftLeg',
    restitution: 0.3,
    friction: 0.3,
    render: { fillStyle: 'transparent' }
  })
  
  const rightLeg = Bodies.rectangle(x + 10, y + 35, 10, 30, {
    label: 'player_rightLeg',
    restitution: 0.3,
    friction: 0.3,
    render: { fillStyle: 'transparent' }
  })
  
  const headBody = Constraint.create({
    bodyA: head,
    bodyB: body,
    pointA: { x: 0, y: 20 },
    pointB: { x: 0, y: -20 },
    stiffness: 0.4,
    length: 5
  })
  
  const leftArmBody = Constraint.create({
    bodyA: body,
    bodyB: leftArm,
    pointA: { x: -15, y: -15 },
    pointB: { x: 0, y: -15 },
    stiffness: 0.3,
    length: 5
  })
  
  const rightArmBody = Constraint.create({
    bodyA: body,
    bodyB: rightArm,
    pointA: { x: 15, y: -15 },
    pointB: { x: 0, y: -15 },
    stiffness: 0.3,
    length: 5
  })
  
  const leftLegBody = Constraint.create({
    bodyA: body,
    bodyB: leftLeg,
    pointA: { x: -10, y: 20 },
    pointB: { x: 0, y: -15 },
    stiffness: 0.3,
    length: 5
  })
  
  const rightLegBody = Constraint.create({
    bodyA: body,
    bodyB: rightLeg,
    pointA: { x: 10, y: 20 },
    pointB: { x: 0, y: -15 },
    stiffness: 0.3,
    length: 5
  })
  
  return {
    bodies: [head, body, leftArm, rightArm, leftLeg, rightLeg],
    constraints: [headBody, leftArmBody, rightArmBody, leftLegBody, rightLegBody],
    head, body, leftArm, rightArm, leftLeg, rightLeg
  }
}

const createLevelObstacles = (level, Composite, Bodies) => {
  if (!level?.obstacles) return
  
  level.obstacles.forEach(obs => {
    let obstacle = null
    
    switch (obs.type) {
      case 'balloon':
        obstacle = Bodies.circle(obs.x, obs.y, obs.radius, {
          isStatic: true,
          restitution: 1.5,
          render: { fillStyle: '#FF6B6B' },
          label: 'balloon'
        })
        break
      case 'bridge':
        obstacle = Bodies.rectangle(obs.x, obs.y, obs.width, obs.height, {
          isStatic: false,
          restitution: 0.2,
          render: { fillStyle: '#8B4513' },
          label: 'bridge'
        })
        break
      case 'trampoline':
        obstacle = Bodies.rectangle(obs.x, obs.y, obs.width, obs.height, {
          isStatic: true,
          restitution: 2,
          render: { fillStyle: '#FF69B4' },
          label: 'trampoline'
        })
        break
      case 'rope':
        obstacle = Bodies.rectangle(obs.x, obs.y, obs.width, obs.height, {
          isStatic: true,
          friction: 0.1,
          render: { fillStyle: '#333' },
          label: 'rope'
        })
        break
    }
    
    if (obstacle) {
      Composite.add(engine.world, obstacle)
    }
  })
}

const drawBackground = (ctx, levelType) => {
  const gradients = {
    balloon: ['#ff9a9e', '#fecfef'],
    bridge: ['#a8edea', '#fed6e3'],
    trampoline: ['#ffecd2', '#fcb69f'],
    tightrope: ['#667eea', '#764ba2']
  }
  
  const colors = gradients[levelType] || ['#87CEEB', '#98D8C8']
  const gradient = ctx.createLinearGradient(0, 0, 0, 600)
  gradient.addColorStop(0, colors[0])
  gradient.addColorStop(1, colors[1])
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 600)
}

const drawPlayer = (ctx, player, character) => {
  const color = character?.body_color || '#FFB6C1'
  const headColor = character?.head_color || '#FFE4E1'
  
  const drawPart = (body, fillColor, isCircle = false) => {
    ctx.save()
    ctx.translate(body.position.x, body.position.y)
    ctx.rotate(body.angle)
    ctx.fillStyle = fillColor
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2
    
    if (isCircle) {
      ctx.beginPath()
      ctx.arc(0, 0, body.circleRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.fillRect(-body.vertices[0].x, -body.vertices[0].y, 
                   body.vertices[1].x - body.vertices[0].x,
                   body.vertices[2].y - body.vertices[1].y)
      ctx.strokeRect(-body.vertices[0].x, -body.vertices[0].y, 
                     body.vertices[1].x - body.vertices[0].x,
                     body.vertices[2].y - body.vertices[1].y)
    }
    ctx.restore()
  }
  
  drawPart(player.leftLeg, color)
  drawPart(player.rightLeg, color)
  drawPart(player.body, color)
  drawPart(player.leftArm, color)
  drawPart(player.rightArm, color)
  drawPart(player.head, headColor, true)
  
  ctx.save()
  ctx.translate(player.head.position.x, player.head.position.y)
  ctx.rotate(player.head.angle)
  ctx.fillStyle = '#333'
  ctx.beginPath()
  ctx.arc(-6, -3, 3, 0, Math.PI * 2)
  ctx.arc(6, -3, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const drawGoal = (ctx, position) => {
  if (!position) return
  ctx.save()
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(position.x - 30, position.y - 40, 60, 80)
  ctx.fillStyle = '#FF4500'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('🏁', position.x, position.y + 8)
  ctx.restore()
}

const handleKeyDown = (e) => {
  keys[e.key] = true
  
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const force = e.key === 'ArrowLeft' ? -0.05 : 0.05
    Matter.Body.applyForce(player.body, player.body.position, { x: force, y: 0 })
  }
  
  if (e.key === 'ArrowUp') {
    Matter.Body.applyForce(player.body, player.body.position, { x: 0, y: -0.15 })
  }
  
  if (e.key === 'ArrowDown') {
    Matter.Body.applyForce(player.body, player.body.position, { x: 0, y: 0.05 })
  }
  
  if (e.key === 'q' || e.key === 'Q') {
    isGrabbingLeft = true
  }
  
  if (e.key === 'e' || e.key === 'E') {
    isGrabbingRight = true
  }
  
  if (e.key === 'r' || e.key === 'R') {
    resetLevel()
  }
}

const handleKeyUp = (e) => {
  keys[e.key] = false
  
  if (e.key === 'q' || e.key === 'Q') {
    isGrabbingLeft = false
  }
  
  if (e.key === 'e' || e.key === 'E') {
    isGrabbingRight = false
  }
}

const startTimer = () => {
  elapsedTime.value = 0
  gameLoop = setInterval(() => {
    elapsedTime.value += 0.1
    if (player && player.body.position.y > 650) {
      handleGameOver()
    }
  }, 100)
}

const handleVictory = async () => {
  clearInterval(gameLoop)
  showVictory.value = true
  gameStore.setPlaying(false)
  
  await userStore.completeLevel(parseInt(route.params.levelId), elapsedTime.value)
  await gameStore.endSession()
}

const handleGameOver = () => {
  clearInterval(gameLoop)
  showGameOver.value = true
  gameStore.setPlaying(false)
}

const resetLevel = () => {
  showGameOver.value = false
  showVictory.value = false
  
  if (engine) {
    Matter.Engine.clear(engine)
    Matter.Render.stop(render)
    Matter.Runner.stop(runner)
  }
  
  initPhysics()
  startTimer()
  gameStore.setPlaying(true)
}

const replayLevel = () => {
  showVictory.value = false
  resetLevel()
}

const nextLevel = () => {
  showVictory.value = false
  const currentIndex = userStore.levels.findIndex(l => l.id === parseInt(route.params.levelId))
  if (currentIndex < userStore.levels.length - 1) {
    const nextLevelId = userStore.levels[currentIndex + 1].id
    router.push(`/game/${nextLevelId}`)
  }
}

const goBack = async () => {
  clearInterval(gameLoop)
  if (engine) {
    Matter.Engine.clear(engine)
    Matter.Render.stop(render)
    Matter.Runner.stop(runner)
  }
  await gameStore.endSession()
  router.push('/home')
}

onMounted(async () => {
  await initGame()
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  clearInterval(gameLoop)
  if (engine) {
    Matter.Engine.clear(engine)
    Matter.Render.stop(render)
    Matter.Runner.stop(runner)
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.game-container {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-header {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: white;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn, .reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover, .reset-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.level-name {
  font-size: 20px;
  font-weight: 600;
}

.timer {
  font-size: 24px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 20px;
  border-radius: 20px;
}

.game-area {
  position: relative;
}

.game-canvas {
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 24px;
  background: rgba(255, 255, 255, 0.1);
  padding: 16px 32px;
  border-radius: 12px;
  color: white;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  opacity: 0.9;
}

.control-keys {
  display: flex;
  gap: 4px;
}

.key {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-family: monospace;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  min-width: 400px;
}

.modal h2 {
  font-size: 32px;
  margin-bottom: 16px;
}

.modal p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.victory-modal h2 {
  color: #FFD700;
}

.gameover-modal h2 {
  color: #f5576c;
}

@media (max-width: 1200px) {
  .game-canvas {
    width: 100%;
    height: auto;
  }
  
  .game-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
