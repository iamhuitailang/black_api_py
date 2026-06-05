<template>
  <div class="game-wrapper">
    <canvas ref="gameCanvas" class="game-canvas"></canvas>
    <div class="game-ui">
      <div class="ui-top">
        <div class="health-bar">
          <span class="label">❤️ 生命</span>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: (player.health / player.maxHealth * 100) + '%' }"></div>
          </div>
          <span class="value">{{ player.health }}/{{ player.maxHealth }}</span>
        </div>
        <div class="level-info">
          <span class="level-name">{{ levelConfig.name }}</span>
          <span class="progress">进度: {{ levelProgress }}%</span>
        </div>
        <div class="score-display">
          <span>💰 {{ coins }}</span>
          <span>🎯 {{ score }}</span>
        </div>
      </div>
      <div class="ui-bottom">
        <div class="weapon-info">
          <span class="weapon-icon">{{ currentWeaponIcon }}</span>
          <span class="weapon-name">{{ currentWeaponName }}</span>
          <span v-if="player.currentWeapon !== 'ak47'" class="ammo">弹药: {{ player.weapons[player.currentWeapon]?.ammo || 0 }}</span>
        </div>
        <div class="grenade-info">
          <span>💣 x {{ player.grenades }}</span>
        </div>
        <div class="vehicle-info" v-if="player.inVehicle">
          <span>🚗 {{ player.vehicleType === 'tank' ? '坦克' : '摩托车' }}</span>
          <span class="vehicle-hp">HP: {{ player.vehicleHealth }}</span>
        </div>
      </div>
      <div class="boss-health" v-if="bossActive">
        <span class="boss-name">{{ bossName }}</span>
        <div class="boss-bar-container">
          <div class="boss-bar-fill" :style="{ width: (bossHealth / bossMaxHealth * 100) + '%' }"></div>
        </div>
      </div>
    </div>
    <div class="pause-menu" v-if="paused">
      <h2>⏸️ 游戏暂停</h2>
      <button class="btn btn-primary" @click="paused = false">继续游戏</button>
      <button class="btn btn-secondary" @click="$emit('menu')">返回主菜单</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  level: { type: Number, required: true },
  playerData: { type: Object, required: true }
})

const emit = defineEmits(['gameOver', 'levelComplete', 'updateCoins'])

const gameCanvas = ref(null)
const paused = ref(false)
const score = ref(0)
const coins = ref(0)
const levelProgress = ref(0)
const bossActive = ref(false)
const bossName = ref('')
const bossHealth = ref(0)
const bossMaxHealth = ref(0)

const levelConfigs = {
  1: {
    name: '🏜️ 第一关：沙漠突袭',
    bgColor1: '#c2956e',
    bgColor2: '#e8d4b8',
    groundColor: '#8b7355',
    enemyTypes: ['soldier', 'sniper'],
    enemyCount: 15,
    bossType: 'tank_boss',
    bossName: '沙漠装甲车',
    bossHealth: 500
  },
  2: {
    name: '⚓ 第二关：港口风暴',
    bgColor1: '#1e3a5f',
    bgColor2: '#3d5a80',
    groundColor: '#2f4f4f',
    enemyTypes: ['soldier', 'sniper', 'grenadier'],
    enemyCount: 20,
    bossType: 'ship_boss',
    bossName: '重型战舰',
    bossHealth: 800
  },
  3: {
    name: '⛏️ 第三关：矿洞危机',
    bgColor1: '#2c1810',
    bgColor2: '#4a3728',
    groundColor: '#1a0f0a',
    enemyTypes: ['soldier', 'sniper', 'grenadier', 'robot'],
    enemyCount: 25,
    bossType: 'drill_boss',
    bossName: '巨型钻头机',
    bossHealth: 1200
  },
  4: {
    name: '🚀 第四关：太空决战',
    bgColor1: '#0a0a20',
    bgColor2: '#1a1a40',
    groundColor: '#151530',
    enemyTypes: ['soldier', 'sniper', 'grenadier', 'robot', 'alien'],
    enemyCount: 30,
    bossType: 'ufo_boss',
    bossName: '外星母舰',
    bossHealth: 2000
  }
}

const levelConfig = computed(() => levelConfigs[props.level])

const player = reactive({
  x: 100,
  y: 400,
  vx: 0,
  vy: 0,
  width: 40,
  height: 60,
  health: 100,
  maxHealth: 100,
  currentWeapon: 'ak47',
  weapons: {
    ak47: { name: 'AK47', damage: 25, fireRate: 150, ammo: 999 },
    shotgun: { name: '散弹枪', damage: 60, fireRate: 500, ammo: 30 }
  },
  grenades: 3,
  facingRight: true,
  onGround: false,
  aimingUp: false,
  aimingDown: false,
  inVehicle: false,
  vehicleType: null,
  vehicleHealth: 0,
  lastShot: 0,
  invincible: false,
  invincibleTimer: 0
})

const currentWeaponIcon = computed(() => {
  return player.currentWeapon === 'ak47' ? '🔫' : '💥'
})

const currentWeaponName = computed(() => {
  return player.weapons[player.currentWeapon]?.name || 'AK47'
})

let ctx = null
let animationId = null
let keys = {}
let bullets = []
let enemyBullets = []
let enemies = []
let vehicles = []
let items = []
let grenades = []
let explosions = []
let cameraX = 0
let levelLength = 2500
let groundY = 500
let enemiesSpawned = 0
let boss = null
let gameTime = 0
let gameStateKey = 'hejin_game_state'

function initGame() {
  const canvas = gameCanvas.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  ctx = canvas.getContext('2d')
  groundY = canvas.height - 100

  player.health = props.playerData.health
  player.maxHealth = props.playerData.maxHealth
  player.currentWeapon = props.playerData.currentWeapon
  player.grenades = props.playerData.inventory.grenades
  
  if (props.playerData.inventory.shotgun) {
    player.weapons.shotgun.ammo = 30
  }

  const savedState = loadGameState()
  if (savedState && savedState.level === props.level) {
    restoreGameState(savedState)
  } else {
    resetLevel()
  }
  gameLoop()
}

function saveGameState() {
  const enemiesData = enemies.map(e => ({
    x: e.x,
    type: e.type,
    health: e.health
  }))
  
  const state = {
    level: props.level,
    playerX: player.x,
    playerHealth: player.health,
    score: score.value,
    coins: coins.value,
    enemiesSpawned,
    enemies: enemiesData,
    bossDefeated: !boss && enemiesSpawned >= levelConfig.value.enemyCount,
    currentWeapon: player.currentWeapon,
    grenades: player.grenades,
    shotgunAmmo: player.weapons.shotgun.ammo,
    timestamp: Date.now()
  }
  localStorage.setItem(gameStateKey, JSON.stringify(state))
}

function loadGameState() {
  try {
    const saved = localStorage.getItem(gameStateKey)
    if (saved) {
      const state = JSON.parse(saved)
      if (Date.now() - state.timestamp < 3600000) {
        return state
      }
    }
  } catch (e) {
    console.error('Failed to load game state:', e)
  }
  return null
}

function restoreGameState(state) {
  console.log('Restoring game state:', state)
  
  player.x = state.playerX
  player.health = state.playerHealth
  player.maxHealth = props.playerData.maxHealth
  score.value = state.score
  coins.value = state.coins
  enemiesSpawned = state.enemiesSpawned
  player.currentWeapon = state.currentWeapon || 'ak47'
  player.grenades = state.grenades || 3
  player.weapons.shotgun.ammo = state.shotgunAmmo || 30
  
  player.y = groundY - player.height
  player.vx = 0
  player.vy = 0
  player.onGround = true
  player.inVehicle = false
  
  bullets = []
  enemyBullets = []
  enemies = []
  vehicles = []
  items = []
  grenades = []
  explosions = []
  boss = null
  bossActive.value = false
  cameraX = Math.max(0, player.x - 300)
  levelProgress.value = Math.floor((player.x / levelLength) * 100)
  gameTime = 0

  if (state.enemies && state.enemies.length > 0) {
    for (const e of state.enemies) {
      const enemy = createEnemy(e.type, e.x)
      enemy.health = e.health
      enemies.push(enemy)
    }
  }

  if (props.level === 1 && player.x < 600) {
    vehicles.push({
      x: 500,
      y: groundY - 60,
      width: 100,
      height: 60,
      type: 'tank',
      health: 200,
      maxHealth: 200
    })
  } else if (props.level === 2 && player.x < 500) {
    vehicles.push({
      x: 400,
      y: groundY - 40,
      width: 80,
      height: 40,
      type: 'motorcycle',
      health: 100,
      maxHealth: 100
    })
  }

  if (state.bossDefeated) {
    enemiesSpawned = levelConfig.value.enemyCount
  }
  
  console.log('Restore complete - health:', player.health, 'position:', player.x, 'enemies:', enemies.length)
}

function resetLevel() {
  localStorage.removeItem(gameStateKey)
  
  player.x = 100
  player.y = groundY - player.height
  player.vx = 0
  player.vy = 0
  player.onGround = true
  player.inVehicle = false
  
  bullets = []
  enemyBullets = []
  enemies = []
  vehicles = []
  items = []
  grenades = []
  explosions = []
  boss = null
  bossActive.value = false
  cameraX = 0
  enemiesSpawned = 0
  levelProgress.value = 0
  gameTime = 0

  if (props.level === 1) {
    vehicles.push({
      x: 500,
      y: groundY - 60,
      width: 100,
      height: 60,
      type: 'tank',
      health: 200,
      maxHealth: 200
    })
  } else if (props.level === 2) {
    vehicles.push({
      x: 400,
      y: groundY - 40,
      width: 80,
      height: 40,
      type: 'motorcycle',
      health: 100,
      maxHealth: 100
    })
  }
}

function gameLoop() {
  if (paused.value) {
    animationId = requestAnimationFrame(gameLoop)
    return
  }

  gameTime++
  update()
  render()

  if (gameTime % 60 === 0) {
    saveGameState()
  }

  if (player.health <= 0) {
    localStorage.removeItem(gameStateKey)
    emit('gameOver', score.value)
    return
  }

  animationId = requestAnimationFrame(gameLoop)
}

function update() {
  handleInput()
  updatePlayer()
  updateBullets()
  updateEnemies()
  updateGrenades()
  updateExplosions()
  spawnEnemies()
  checkCollisions()
  updateCamera()
  checkLevelComplete()
}

function handleInput() {
  if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
    player.vx = player.inVehicle ? -8 : -5
    player.facingRight = false
  } else if (keys['d'] || keys['D'] || keys['ArrowRight']) {
    player.vx = player.inVehicle ? 8 : 5
    player.facingRight = true
  } else {
    player.vx = 0
  }

  if (keys['w'] || keys['W'] || keys['ArrowUp']) {
    player.aimingUp = true
    player.aimingDown = false
  } else if (keys['s'] || keys['S'] || keys['ArrowDown']) {
    player.aimingDown = true
    player.aimingUp = false
  } else {
    player.aimingUp = false
    player.aimingDown = false
  }

  if ((keys[' '] || keys['Space']) && player.onGround && !player.inVehicle) {
    player.vy = -15
    player.onGround = false
  }

  if (keys['j'] || keys['J']) {
    shoot()
  }

  if (keys['k'] || keys['K']) {
    throwGrenade()
    keys['k'] = false
    keys['K'] = false
  }

  if (keys['q'] || keys['Q']) {
    switchWeapon()
    keys['q'] = false
    keys['Q'] = false
  }

  if (keys['e'] || keys['E']) {
    toggleVehicle()
    keys['e'] = false
    keys['E'] = false
  }
}

function shoot() {
  const now = Date.now()
  const weapon = player.weapons[player.currentWeapon]
  
  if (now - player.lastShot < weapon.fireRate) return
  if (weapon.ammo <= 0) return
  
  player.lastShot = now
  if (player.currentWeapon !== 'ak47') {
    weapon.ammo--
  }

  let bulletAngle = 0
  if (player.aimingUp) bulletAngle = -Math.PI / 2
  else if (player.aimingDown) bulletAngle = Math.PI / 2
  else if (!player.facingRight) bulletAngle = Math.PI

  const bulletSpeed = 15
  
  if (player.currentWeapon === 'shotgun') {
    for (let i = -2; i <= 2; i++) {
      const spread = i * 0.1
      bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: Math.cos(bulletAngle + spread) * bulletSpeed,
        vy: Math.sin(bulletAngle + spread) * bulletSpeed,
        damage: weapon.damage / 3,
        fromPlayer: true
      })
    }
  } else {
    bullets.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      vx: Math.cos(bulletAngle) * bulletSpeed,
      vy: Math.sin(bulletAngle) * bulletSpeed,
      damage: weapon.damage,
      fromPlayer: true
    })
  }
}

function throwGrenade() {
  if (player.grenades <= 0) return
  player.grenades--

  const direction = player.facingRight ? 1 : -1
  grenades.push({
    x: player.x + player.width / 2,
    y: player.y,
    vx: direction * 8,
    vy: -10,
    timer: 60,
    damage: 100
  })
}

function switchWeapon() {
  if (player.currentWeapon === 'ak47' && props.playerData.inventory.shotgun) {
    player.currentWeapon = 'shotgun'
  } else {
    player.currentWeapon = 'ak47'
  }
}

function toggleVehicle() {
  if (player.inVehicle) {
    player.inVehicle = false
    player.y = groundY - player.height
    player.vehicleType = null
  } else {
    for (let v of vehicles) {
      if (Math.abs(player.x - v.x) < 80 && Math.abs(player.y - (v.y + v.height - player.height)) < 50) {
        player.inVehicle = true
        player.vehicleType = v.type
        player.vehicleHealth = v.health
        player.x = v.x
        return
      }
    }
  }
}

function updatePlayer() {
  if (!player.inVehicle) {
    player.vy += 0.6
  }
  
  player.x += player.vx
  player.y += player.vy

  if (player.inVehicle) {
    for (let v of vehicles) {
      if (player.vehicleType === v.type) {
        v.x = player.x
        v.health = player.vehicleHealth
      }
    }
  }

  const groundLevel = player.inVehicle ? groundY - (player.vehicleType === 'tank' ? 60 : 40) : groundY - player.height
  if (player.y >= groundLevel) {
    player.y = groundLevel
    player.vy = 0
    player.onGround = true
  }

  if (player.x < cameraX + 50) player.x = cameraX + 50
  if (player.x > levelLength - 50) player.x = levelLength - 50

  if (player.invincible) {
    player.invincibleTimer--
    if (player.invincibleTimer <= 0) {
      player.invincible = false
    }
  }
}

function updateBullets() {
  bullets = bullets.filter(b => {
    b.x += b.vx
    b.y += b.vy
    return b.x > cameraX - 100 && b.x < cameraX + 1500 && b.y > 0 && b.y < 800
  })

  enemyBullets = enemyBullets.filter(b => {
    b.x += b.vx
    b.y += b.vy
    return b.x > cameraX - 100 && b.x < cameraX + 1500 && b.y > 0 && b.y < 800
  })
}

function updateEnemies() {
  for (let enemy of enemies) {
    const dx = player.x - enemy.x
    const dist = Math.abs(dx)

    if (dist < 600) {
      if (dist > 100) {
        enemy.x += enemy.speed * (dx > 0 ? 1 : -1)
      }

      if (Date.now() - enemy.lastShot > enemy.fireRate) {
        enemy.lastShot = Date.now()
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
        enemyBullets.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          damage: enemy.damage
        })
      }
    }
  }

  if (boss) {
    updateBoss()
  }
}

function updateBoss() {
  boss.phase = boss.phase || 0
  boss.attackTimer = (boss.attackTimer || 0) + 1

  if (boss.type === 'tank_boss') {
    boss.x += Math.sin(gameTime * 0.02) * 2
  } else if (boss.type === 'ship_boss') {
    boss.y = groundY - 150 + Math.sin(gameTime * 0.03) * 30
  } else if (boss.type === 'drill_boss') {
    boss.x += Math.sin(gameTime * 0.015) * 3
    if (boss.attackTimer % 60 === 0) {
      for (let i = 0; i < 5; i++) {
        enemyBullets.push({
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height,
          vx: (Math.random() - 0.5) * 6,
          vy: 8,
          damage: 15
        })
      }
    }
  } else if (boss.type === 'ufo_boss') {
    boss.x = player.x + Math.sin(gameTime * 0.02) * 200
    boss.y = 100 + Math.sin(gameTime * 0.03) * 50
    if (boss.attackTimer % 20 === 0) {
      const angle = Math.atan2(player.y - boss.y, player.x - boss.x)
      enemyBullets.push({
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        damage: 20
      })
    }
  }

  if (boss.attackTimer % (40 / props.level) === 0) {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x)
    enemyBullets.push({
      x: boss.x + boss.width / 2,
      y: boss.y + boss.height / 2,
      vx: Math.cos(angle) * 7,
      vy: Math.sin(angle) * 7,
      damage: boss.damage
    })
  }

  bossHealth.value = boss.health
}

function updateGrenades() {
  grenades = grenades.filter(g => {
    g.vy += 0.4
    g.x += g.vx
    g.y += g.vy
    g.timer--

    if (g.y >= groundY - 10) {
      g.y = groundY - 10
      g.vy = 0
      g.vx *= 0.8
    }

    if (g.timer <= 0) {
      createExplosion(g.x, g.y, g.damage)
      return false
    }
    return true
  })
}

function createExplosion(x, y, damage) {
  explosions.push({ x, y, radius: 0, maxRadius: 80, alpha: 1 })
  
  for (let enemy of enemies) {
    const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2)
    if (dist < 100) {
      enemy.health -= damage * (1 - dist / 100)
    }
  }
  
  if (boss) {
    const dist = Math.sqrt((boss.x - x) ** 2 + (boss.y - y) ** 2)
    if (dist < 150) {
      boss.health -= damage * (1 - dist / 150)
    }
  }
}

function updateExplosions() {
  explosions = explosions.filter(e => {
    e.radius += 5
    e.alpha -= 0.05
    return e.alpha > 0
  })
}

function spawnEnemies() {
  const spawnX = cameraX + 800
  const config = levelConfig.value

  if (enemiesSpawned < config.enemyCount && spawnX < levelLength - 200) {
    if (gameTime % 60 === 0) {
      const type = config.enemyTypes[Math.floor(Math.random() * config.enemyTypes.length)]
      enemies.push(createEnemy(type, spawnX))
      enemiesSpawned++
      console.log('Enemy spawned:', enemiesSpawned, '/', config.enemyCount)
    }
  }

  if (player.x > levelLength - 500 && !boss && enemiesSpawned >= config.enemyCount && enemies.length === 0) {
    console.log('Spawning boss!')
    spawnBoss()
  }
}

function createEnemy(type, x) {
  const baseStats = {
    soldier: { width: 35, height: 55, health: 50, damage: 10, speed: 1.5, fireRate: 1000, color: '#8b0000', points: 100 },
    sniper: { width: 35, height: 55, health: 30, damage: 20, speed: 0.5, fireRate: 2000, color: '#4a0080', points: 150 },
    grenadier: { width: 40, height: 60, health: 80, damage: 25, speed: 1, fireRate: 2500, color: '#006400', points: 200 },
    robot: { width: 45, height: 65, health: 120, damage: 15, speed: 2, fireRate: 800, color: '#696969', points: 250 },
    alien: { width: 40, height: 60, health: 100, damage: 18, speed: 2.5, fireRate: 600, color: '#00ff00', points: 300 }
  }

  const stats = baseStats[type]
  const levelMultiplier = 1 + (props.level - 1) * 0.3

  return {
    type,
    x,
    y: groundY - stats.height,
    width: stats.width,
    height: stats.height,
    health: stats.health * levelMultiplier,
    maxHealth: stats.health * levelMultiplier,
    damage: stats.damage * levelMultiplier,
    speed: stats.speed,
    fireRate: stats.fireRate / levelMultiplier,
    color: stats.color,
    points: stats.points * props.level,
    lastShot: 0,
    hitFlash: 0
  }
}

function spawnBoss() {
  const config = levelConfig.value
  bossActive.value = true
  bossName.value = config.bossName
  bossMaxHealth.value = config.bossHealth
  bossHealth.value = config.bossHealth

  boss = {
    type: config.bossType,
    x: levelLength - 300,
    y: groundY - 120,
    width: 150,
    height: 100,
    health: config.bossHealth,
    maxHealth: config.bossHealth,
    damage: 15 + props.level * 5,
    attackTimer: 0,
    phase: 0
  }
}

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]
    for (let enemy of enemies) {
      if (b.x > enemy.x && b.x < enemy.x + enemy.width &&
          b.y > enemy.y && b.y < enemy.y + enemy.height) {
        enemy.health -= b.damage
        enemy.hitFlash = 10
        bullets.splice(i, 1)
        break
      }
    }
    
    if (boss && bullets[i]) {
      const b = bullets[i]
      if (b.x > boss.x && b.x < boss.x + boss.width &&
          b.y > boss.y && b.y < boss.y + boss.height) {
        boss.health -= b.damage
        bullets.splice(i, 1)
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].health <= 0) {
      score.value += enemies[i].points
      coins.value += Math.floor(enemies[i].points / 10)
      emit('updateCoins', Math.floor(enemies[i].points / 10))
      createExplosion(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height / 2, 0)
      enemies.splice(i, 1)
    }
  }

  if (boss && boss.health <= 0) {
    score.value += 1000 * props.level
    coins.value += 100 * props.level
    emit('updateCoins', 100 * props.level)
    createExplosion(boss.x + boss.width / 2, boss.y + boss.height / 2, 0)
    boss = null
    bossActive.value = false
  }

  if (!player.invincible) {
    for (let b of enemyBullets) {
      const targetX = player.inVehicle ? player.x + 30 : player.x + player.width / 2
      const targetY = player.inVehicle ? player.y + 20 : player.y + player.height / 2
      const targetWidth = player.inVehicle ? 60 : player.width
      const targetHeight = player.inVehicle ? 40 : player.height

      if (b.x > player.x && b.x < player.x + targetWidth &&
          b.y > player.y && b.y < player.y + targetHeight) {
        if (player.inVehicle) {
          player.vehicleHealth -= b.damage
          if (player.vehicleHealth <= 0) {
            player.inVehicle = false
            player.y = groundY - player.height
          }
        } else {
          player.health -= b.damage
        }
        player.invincible = true
        player.invincibleTimer = 30
        b.damage = 0
      }
    }
    enemyBullets = enemyBullets.filter(b => b.damage > 0)
  }
}

function updateCamera() {
  const targetX = player.x - 300
  cameraX += (targetX - cameraX) * 0.1
  if (cameraX < 0) cameraX = 0
  if (cameraX > levelLength - 1200) cameraX = levelLength - 1200

  levelProgress.value = Math.floor((player.x / levelLength) * 100)
}

function checkLevelComplete() {
  const config = levelConfig.value
  const canComplete = player.x > levelLength - 150 && !boss && enemiesSpawned >= config.enemyCount && enemies.length === 0
  
  if (gameTime % 60 === 0) {
    console.log('Level complete check:', {
      playerX: player.x,
      needX: levelLength - 150,
      hasBoss: !!boss,
      enemiesSpawned,
      enemyCount: config.enemyCount,
      enemiesAlive: enemies.length,
      canComplete
    })
  }
  
  if (canComplete) {
    console.log('LEVEL COMPLETE!')
    localStorage.removeItem(gameStateKey)
    emit('levelComplete', score.value)
  }
}

function render() {
  const canvas = gameCanvas.value
  const config = levelConfig.value

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, config.bgColor1)
  gradient.addColorStop(1, config.bgColor2)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  drawBackground()

  ctx.fillStyle = config.groundColor
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY)

  ctx.save()
  ctx.translate(-cameraX, 0)

  for (let v of vehicles) {
    drawVehicle(v)
  }

  drawPlayer()

  for (let enemy of enemies) {
    drawEnemy(enemy)
  }

  if (boss) {
    drawBoss()
  }

  ctx.fillStyle = '#ffcc00'
  for (let b of bullets) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#ff4444'
  for (let b of enemyBullets) {
    ctx.beginPath()
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#2d5016'
  for (let g of grenades) {
    ctx.beginPath()
    ctx.arc(g.x, g.y, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let e of explosions) {
    ctx.globalAlpha = e.alpha
    ctx.fillStyle = '#ff6600'
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  ctx.restore()
}

function drawBackground() {
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  for (let i = 0; i < 20; i++) {
    const x = ((i * 200 - cameraX * 0.3) % 2000 + 2000) % 2000 - 200
    ctx.beginPath()
    ctx.moveTo(x, groundY)
    ctx.lineTo(x + 100, groundY - 150 - Math.sin(i) * 50)
    ctx.lineTo(x + 200, groundY)
    ctx.fill()
  }
}

function drawPlayer() {
  if (player.invincible && Math.floor(gameTime / 5) % 2 === 0) {
    ctx.globalAlpha = 0.5
  }

  if (player.inVehicle) {
    drawPlayerInVehicle()
  } else {
    drawPlayerCharacter()
  }

  ctx.globalAlpha = 1
}

function drawPlayerCharacter() {
  const x = player.x
  const y = player.y

  ctx.save()
  if (!player.facingRight) {
    ctx.translate(x + player.width, y)
    ctx.scale(-1, 1)
    ctx.translate(-x, -y)
  }

  ctx.fillStyle = '#2d5016'
  ctx.fillRect(x + 10, y + 20, 20, 30)

  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(x + 20, y + 12, 12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#228b22'
  ctx.beginPath()
  ctx.arc(x + 20, y + 8, 10, Math.PI, 0)
  ctx.fill()
  ctx.fillRect(x + 8, y + 8, 24, 5)

  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.moveTo(x + 28, y + 2)
  ctx.lineTo(x + 38, y + 6)
  ctx.lineTo(x + 28, y + 10)
  ctx.fill()

  ctx.fillStyle = '#1a3a0a'
  ctx.fillRect(x + 12, y + 50, 6, 10)
  ctx.fillRect(x + 22, y + 50, 6, 10)

  ctx.fillStyle = '#333'
  let gunAngle = 0
  if (player.aimingUp) gunAngle = -Math.PI / 3
  else if (player.aimingDown) gunAngle = Math.PI / 3
  
  ctx.save()
  ctx.translate(x + 25, y + 30)
  ctx.rotate(gunAngle)
  ctx.fillRect(0, -3, 25, 6)
  ctx.fillStyle = '#555'
  ctx.fillRect(20, -4, 8, 8)
  ctx.restore()

  ctx.restore()
}

function drawPlayerInVehicle() {
  const x = player.x
  const y = player.y

  if (player.vehicleType === 'tank') {
    ctx.fillStyle = '#2d5016'
    ctx.fillRect(x, y + 20, 100, 40)
    ctx.fillStyle = '#1a3a0a'
    ctx.fillRect(x, y + 50, 100, 10)
    
    ctx.fillStyle = '#333'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(x + 15 + i * 18, y + 55, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#1a3a0a'
    ctx.beginPath()
    ctx.arc(x + 50, y + 20, 25, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#333'
    ctx.fillRect(x + 70, y + 15, 40, 10)

    ctx.fillStyle = '#deb887'
    ctx.beginPath()
    ctx.arc(x + 50, y + 5, 8, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = '#cc0000'
    ctx.fillRect(x + 10, y + 20, 60, 15)
    
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(x + 20, y + 35, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 60, y + 35, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff0000'
    ctx.beginPath()
    ctx.arc(x + 65, y + 15, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#deb887'
    ctx.beginPath()
    ctx.arc(x + 40, y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2d5016'
    ctx.fillRect(x + 35, y + 10, 10, 15)
  }
}

function drawVehicle(v) {
  if (player.inVehicle && player.vehicleType === v.type) return
  
  if (v.type === 'tank') {
    ctx.fillStyle = '#2d5016'
    ctx.fillRect(v.x, v.y + 20, 100, 40)
    ctx.fillStyle = '#1a3a0a'
    ctx.fillRect(v.x, v.y + 50, 100, 10)
    ctx.fillStyle = '#333'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(v.x + 15 + i * 18, v.y + 55, 8, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#1a3a0a'
    ctx.beginPath()
    ctx.arc(v.x + 50, v.y + 20, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#333'
    ctx.fillRect(v.x + 70, v.y + 15, 30, 10)
  } else {
    ctx.fillStyle = '#cc0000'
    ctx.fillRect(v.x + 10, v.y + 20, 60, 15)
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(v.x + 20, v.y + 35, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(v.x + 60, v.y + 35, 12, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#fff'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('按E进入', v.x + (v.width / 2), v.y - 10)
}

function drawEnemy(enemy) {
  if (enemy.hitFlash > 0) {
    ctx.fillStyle = '#fff'
    enemy.hitFlash--
  } else {
    ctx.fillStyle = enemy.color
  }

  ctx.fillRect(enemy.x, enemy.y + 15, enemy.width, enemy.height - 15)
  
  ctx.fillStyle = '#deb887'
  ctx.beginPath()
  ctx.arc(enemy.x + enemy.width / 2, enemy.y + 12, 10, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#333'
  ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, 8)

  ctx.fillStyle = '#333'
  ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 25, 15, 5)

  const healthPercent = enemy.health / enemy.maxHealth
  ctx.fillStyle = '#333'
  ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5)
  ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000'
  ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercent, 5)
}

function drawBoss() {
  const b = boss
  
  if (b.type === 'tank_boss') {
    ctx.fillStyle = '#4a4a4a'
    ctx.fillRect(b.x, b.y + 40, b.width, 60)
    ctx.fillStyle = '#333'
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.arc(b.x + 15 + i * 24, b.y + 95, 12, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#5a5a5a'
    ctx.fillRect(b.x + 20, b.y + 10, 110, 40)
    ctx.fillStyle = '#333'
    ctx.fillRect(b.x + 120, b.y + 20, 50, 15)
  } else if (b.type === 'ship_boss') {
    ctx.fillStyle = '#4a5568'
    ctx.beginPath()
    ctx.moveTo(b.x, b.y + 80)
    ctx.lineTo(b.x + 30, b.y + 20)
    ctx.lineTo(b.x + b.width - 30, b.y + 20)
    ctx.lineTo(b.x + b.width, b.y + 80)
    ctx.fill()
    ctx.fillStyle = '#2d3748'
    ctx.fillRect(b.x + 50, b.y - 20, 50, 60)
    ctx.fillStyle = '#e53e3e'
    ctx.fillRect(b.x + 60, b.y - 40, 30, 25)
  } else if (b.type === 'drill_boss') {
    ctx.fillStyle = '#718096'
    ctx.fillRect(b.x + 20, b.y + 30, 110, 70)
    ctx.fillStyle = '#e53e3e'
    ctx.beginPath()
    ctx.moveTo(b.x, b.y + 65)
    ctx.lineTo(b.x + 30, b.y + 40)
    ctx.lineTo(b.x + 30, b.y + 90)
    ctx.fill()
    ctx.fillStyle = '#f6e05e'
    ctx.beginPath()
    ctx.arc(b.x + 75, b.y + 50, 20, 0, Math.PI * 2)
    ctx.fill()
  } else if (b.type === 'ufo_boss') {
    ctx.fillStyle = '#9f7aea'
    ctx.beginPath()
    ctx.ellipse(b.x + b.width / 2, b.y + 50, b.width / 2, 25, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#b794f4'
    ctx.beginPath()
    ctx.ellipse(b.x + b.width / 2, b.y + 35, 40, 30, 0, Math.PI, 0)
    ctx.fill()
    ctx.fillStyle = '#48bb78'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.arc(b.x + 25 + i * 25, b.y + 60, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const healthPercent = b.health / b.maxHealth
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(b.x, b.y - 25, b.width, 10)
  ctx.fillStyle = '#ff4444'
  ctx.fillRect(b.x, b.y - 25, b.width * healthPercent, 10)
}

function handleKeyDown(e) {
  keys[e.key] = true
  if (e.key === 'Escape') {
    paused.value = !paused.value
  }
}

function handleKeyUp(e) {
  keys[e.key] = false
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  initGame()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

watch(() => props.level, () => {
  resetLevel()
})
</script>

<style scoped>
.game-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.ui-top {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.health-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 15px;
  border-radius: 10px;
}

.health-bar .label {
  color: #ff6b6b;
  font-weight: bold;
}

.bar-container {
  width: 150px;
  height: 15px;
  background: #333;
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b6b 0%, #ee5a5a 100%);
  transition: width 0.3s ease;
}

.health-bar .value {
  color: #fff;
  font-weight: bold;
  min-width: 60px;
}

.level-info {
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 10px;
  text-align: center;
}

.level-name {
  display: block;
  color: #fdcb6e;
  font-weight: bold;
  font-size: 16px;
}

.progress {
  display: block;
  color: #81ecec;
  font-size: 12px;
  margin-top: 4px;
}

.score-display {
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 15px;
  border-radius: 10px;
  text-align: right;
}

.score-display span {
  color: #fdcb6e;
  font-weight: bold;
  font-size: 16px;
}

.ui-bottom {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.weapon-info, .grenade-info, .vehicle-info {
  background: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.weapon-icon {
  font-size: 24px;
}

.weapon-name {
  color: #fff;
  font-weight: bold;
}

.ammo {
  color: #fdcb6e;
}

.grenade-info span {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 16px;
}

.vehicle-info span {
  color: #81ecec;
  font-weight: bold;
}

.vehicle-hp {
  color: #fdcb6e !important;
}

.boss-health {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 25px;
  border-radius: 10px;
  text-align: center;
  min-width: 400px;
}

.boss-name {
  display: block;
  color: #ff4444;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 8px;
}

.boss-bar-container {
  width: 100%;
  height: 20px;
  background: #333;
  border-radius: 10px;
  overflow: hidden;
}

.boss-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444 0%, #cc0000 100%);
  transition: width 0.2s ease;
}

.pause-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  padding: 40px 60px;
  border-radius: 20px;
  text-align: center;
  pointer-events: auto;
}

.pause-menu h2 {
  color: #fdcb6e;
  margin-bottom: 30px;
  font-size: 32px;
}

.pause-menu .btn {
  display: block;
  width: 100%;
  margin: 10px 0;
}
</style>
