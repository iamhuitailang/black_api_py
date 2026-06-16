
import { ref, reactive, computed, watch } from 'vue'
import { CHARACTERS, GAME_CONFIG } from '../data/characters'
import { createPlayerState, getCharacter, canMove, canAttack, canUseSpecial, isDefending, isControlLocked } from './useCharacter'
import type { PlayerState } from './useCharacter'
import { useInput } from './useInput'
import type { InputState } from './useInput'
import { useAudio } from './useAudio'
import { useStorage } from './useStorage'
import type { GameSaveData, PlayerSaveData } from './useStorage'

export type GamePhase = 'select' | 'battle' | 'result'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface GameState {
  phase: GamePhase
  round: number
  p1Score: number
  p2Score: number
  timer: number
  p1: PlayerState
  p2: PlayerState
  winner: string | null
  screenShake: number
  flashColor: string | null
  flashAlpha: number
  particles: Particle[]
  p1Selected: string
  p2Selected: string
}

export const gameState = reactive<GameState>({
  phase: 'select' as GamePhase,
  round: 1,
  p1Score: 0,
  p2Score: 0,
  timer: GAME_CONFIG.ROUND_TIME,
  p1: createPlayerState('longquan', 150, 1),
  p2: createPlayerState('jifeng', 810, -1),
  winner: null as string | null,
  screenShake: 0,
  flashColor: null as string | null,
  flashAlpha: 0,
  particles: [] as Particle[],
  p1Selected: 'longquan',
  p2Selected: 'jifeng'
})

export function useGameEngine() {
  const {
    p1Input, p2Input, lastInputTime, resetInput,
    consumeP1Attack, consumeP1Special, consumeP2Attack, consumeP2Special
  } = useInput()

  const { playPunch, playBlock, playSpecial, playVictory, playStart } = useAudio()
  const { saveGame, loadGame, clearSave, hasValidSave } = useStorage()

  let timerAccum = 0
  let animFrameId: number | null = null
  let saveIntervalId: number | null = null

  const frameCount = ref(0)

  function initRound(keepScores = true) {
    const c1 = CHARACTERS[gameState.p1Selected]
    const c2 = CHARACTERS[gameState.p2Selected]
    gameState.p1 = createPlayerState(gameState.p1Selected, 150, 1)
    gameState.p2 = createPlayerState(gameState.p2Selected, 810, -1)
    gameState.timer = GAME_CONFIG.ROUND_TIME
    gameState.screenShake = 0
    gameState.flashColor = null
    gameState.flashAlpha = 0
    gameState.particles = []
    if (!keepScores) {
      gameState.round = 1
      gameState.p1Score = 0
      gameState.p2Score = 0
    }
    timerAccum = 0
  }

  function startBattle() {
    gameState.phase = 'battle'
    initRound(false)
    gameState.winner = null
    playStart()
    startGameLoop()
  }

  function continueFromSave(save: GameSaveData) {
    gameState.phase = save.phase
    gameState.round = save.round
    gameState.p1Score = save.p1Score
    gameState.p2Score = save.p2Score
    gameState.timer = save.timer
    gameState.p1Selected = save.p1.characterId
    gameState.p2Selected = save.p2.characterId
    gameState.winner = save.winner
    if (save.phase !== 'select') {
      restorePlayer(gameState.p1, save.p1)
      restorePlayer(gameState.p2, save.p2)
    }
    // 恢复倒计时小数部分
    timerAccum = save.timerAccum || 0
    // 时间补偿：根据存档真实经过的时间扣减
    if (save.phase === 'battle' && save.savedAt) {
      const elapsed = (Date.now() - save.savedAt) / 1000
      if (elapsed > 0 && elapsed < GAME_CONFIG.ROUND_TIME) {
        timerAccum += elapsed
        while (timerAccum >= 1 && gameState.timer > 0) {
          timerAccum -= 1
          gameState.timer--
        }
        if (gameState.timer <= 0) {
          gameState.timer = 0
        }
      }
    }
    if (save.phase === 'battle') {
      startGameLoop()
    }
  }

  function restorePlayer(p: PlayerState, data: PlayerSaveData) {
    const c = CHARACTERS[data.characterId]
    p.characterId = data.characterId
    p.hp = data.hp
    p.maxHp = c.hp
    p.energy = data.energy
    p.x = data.x
    p.y = data.y
    p.facing = data.facing as 1 | -1
    p.state = 'idle'
    p.stateTimer = 0
    p.attackFrame = 0
    p.attackCooldown = 0
    p.hurtTimer = 0
    p.knockdownTimer = 0
    p.chargeTimer = 0
    p.specialHits = 0
  }

  function buildPlayerSave(p: PlayerState): PlayerSaveData {
    return {
      characterId: p.characterId,
      hp: p.hp,
      maxHp: p.maxHp,
      energy: p.energy,
      x: p.x,
      y: p.y,
      facing: p.facing
    }
  }

  function autoSave() {
    const data: GameSaveData = {
      phase: gameState.phase,
      round: gameState.round,
      p1Score: gameState.p1Score,
      p2Score: gameState.p2Score,
      timer: gameState.timer,
      timerAccum: timerAccum,
      p1: buildPlayerSave(gameState.p1),
      p2: buildPlayerSave(gameState.p2),
      winner: gameState.winner,
      savedAt: Date.now()
    }
    saveGame(data)
  }

  function startGameLoop() {
    stopGameLoop()
    saveIntervalId = window.setInterval(autoSave, 2000)
    window.addEventListener('beforeunload', autoSave)
    const tick = () => {
      step()
      animFrameId = requestAnimationFrame(tick)
    }
    animFrameId = requestAnimationFrame(tick)
  }

  function stopGameLoop() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    if (saveIntervalId !== null) {
      clearInterval(saveIntervalId)
      saveIntervalId = null
    }
    window.removeEventListener('beforeunload', autoSave)
  }

  function addParticle(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = 2 + Math.random() * 4
      gameState.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 3 + Math.random() * 4
      })
    }
  }

  function step() {
    if (gameState.phase !== 'battle') return
    frameCount.value++

    // 倒计时
    timerAccum += 1 / 60
    if (timerAccum >= 1) {
      timerAccum -= 1
      gameState.timer--
      if (gameState.timer <= 0) {
        gameState.timer = 0
        endRound()
      }
    }

    // ===== Phase 1: 先更新面向 + 双方的移动/防御状态 =====
    autoFace()
    updatePlayerPhase1(gameState.p1, p1Input.value)
    updatePlayerPhase1(gameState.p2, p2Input.value)
    clampPositions()

    // ===== Phase 2: 再处理攻击/必杀输入与伤害判定 =====
    // (此时对手的 isBlocking 已是最新值)
    updatePlayerPhase2(gameState.p1, gameState.p2, p1Input.value,
      consumeP1Attack, consumeP1Special)
    updatePlayerPhase2(gameState.p2, gameState.p1, p2Input.value,
      consumeP2Attack, consumeP2Special)

    // 屏幕震动衰减
    if (gameState.screenShake > 0) gameState.screenShake *= 0.9
    // 闪光衰减
    if (gameState.flashAlpha > 0) gameState.flashAlpha *= 0.9

    // 粒子更新
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const pt = gameState.particles[i]
      pt.x += pt.vx
      pt.y += pt.vy
      pt.vy += 0.2
      pt.life--
      if (pt.life <= 0) gameState.particles.splice(i, 1)
    }

    checkRoundEnd()
  }

  // Phase 1: 更新面向、计时器、防御状态、移动（双方先同步完成）
  function updatePlayerPhase1(p: PlayerState, input: InputState) {
    const char = getCharacter(p.characterId)
    const backKey = p.facing === 1 ? input.left : input.right

    // 防御状态（用最新facing判断）
    p.isBlocking = isDefending(p, backKey)

    // 计时器递减
    if (p.attackCooldown > 0) p.attackCooldown--
    if (p.hurtTimer > 0) p.hurtTimer--
    if (p.knockdownTimer > 0) p.knockdownTimer--
    if (p.stateTimer > 0) p.stateTimer--
    if (p.specialHitTimer > 0) p.specialHitTimer--
    if (p.state === 'charge') p.chargeTimer--

    // 待机动画帧
    p.idleAnimFrame++

    // 击倒/受伤状态恢复
    if (p.knockdownTimer <= 0 && p.state === 'knockdown') {
      p.state = 'idle'
    }
    if (p.hurtTimer <= 0 && p.state === 'hurt') {
      p.state = 'idle'
    }
    if (p.stateTimer <= 0) {
      if (p.state === 'attack') {
        p.state = 'idle'
        p.attackCooldown = GAME_CONFIG.ATTACK_COOLDOWN
      } else if (p.state === 'special') {
        p.state = 'idle'
        p.attackCooldown = 8
      }
    }

    // 移动（可控制且不在防御时）
    let moving = false
    if (canMove(p) && !p.isBlocking) {
      const speed = char.speed
      if (input.left) { p.x -= speed; moving = true }
      if (input.right) { p.x += speed; moving = true }
    }

    // idle/walk 状态切换
    if (p.state === 'idle' || p.state === 'walk') {
      p.state = p.isBlocking ? 'idle' : (moving ? 'walk' : 'idle')
    }
  }

  // Phase 2: 处理攻击/必杀的输入与伤害判定（对手的isBlocking已更新完毕）
  function updatePlayerPhase2(
    p: PlayerState, opponent: PlayerState,
    input: InputState,
    consumeAttack: () => boolean, consumeSpecial: () => boolean
  ) {
    const char = getCharacter(p.characterId)

    // 蓄力必杀到达释放点
    if (p.state === 'charge' && p.chargeTimer <= 0) {
      triggerSpecialEffect(p, opponent)
      return
    }

    // 必杀多段伤害
    if (p.state === 'special') {
      const sp = char.special
      if (p.specialHitTimer <= 0 && p.specialHits < sp.hits - 1) {
        p.specialHits++
        p.specialHitTimer = 10
        applyDamage(p, opponent, sp.damage, true)
      }
      return
    }

    // 普攻攻击判定帧
    if (p.state === 'attack') {
      if (p.attackFrame > 0) {
        p.attackFrame--
        if (p.attackFrame <= 8 && p.attackFrame > 0 && !p.hitDealt) {
          if (inAttackRange(p, opponent)) {
            p.hitDealt = true
            dealAttackDamage(p, opponent)
          }
        }
      }
      return
    }

    // 无法输入时跳过
    if (p.knockdownTimer > 0 || isControlLocked(p)) return

    // 必杀输入
    if (consumeSpecial() && canUseSpecial(p)) {
      const sp = char.special
      p.energy = 0
      playSpecial()
      gameState.screenShake = 12
      gameState.flashColor = '#ffffff'
      gameState.flashAlpha = 0.8
      addParticle(opponent.x, GAME_CONFIG.GROUND_Y - 60, char.color, 20)

      if (sp.chargeTime > 0) {
        p.state = 'charge'
        p.chargeTimer = Math.floor(sp.chargeTime / 16.67)
        p.stateTimer = p.chargeTimer + 30
      } else if (sp.hits > 1) {
        p.state = 'special'
        p.stateTimer = sp.hits * 12
        p.specialHits = 0
        p.specialHitTimer = 8
        applyDamage(p, opponent, sp.damage, true)
      } else {
        triggerSpecialEffect(p, opponent)
      }
      return
    }

    // 普攻输入
    if (consumeAttack() && canAttack(p)) {
      p.state = 'attack'
      p.stateTimer = 18
      p.attackFrame = GAME_CONFIG.ATTACK_FRAMES + 4
      p.hitDealt = false
      playPunch()
    }
  }

  function triggerSpecialEffect(attacker: PlayerState, defender: PlayerState) {
    const sp = getCharacter(attacker.characterId).special
    attacker.state = 'special'
    attacker.stateTimer = 20
    applyDamage(attacker, defender, sp.damage, true)
    if (sp.stunTime > 0 && !defender.isBlocking) {
      defender.state = 'knockdown'
      defender.knockdownTimer = Math.floor(sp.stunTime / 16.67)
    }
  }

  function inAttackRange(p1: PlayerState, p2: PlayerState): boolean {
    const dist = Math.abs(p1.x - p2.x)
    return dist < GAME_CONFIG.ATTACK_RANGE
  }

  function dealAttackDamage(attacker: PlayerState, defender: PlayerState) {
    const atkChar = getCharacter(attacker.characterId)
    const defChar = getCharacter(defender.characterId)
    let dmg = Math.max(1, atkChar.attack - defChar.defense * 0.5)
    if (defender.isBlocking) {
      dmg = Math.floor(dmg * 0.4)
      playBlock()
    } else {
      playPunch()
    }
    dmg = Math.round(dmg)
    defender.hp = Math.max(0, defender.hp - dmg)
    defender.energy = Math.min(100, defender.energy + GAME_CONFIG.ENERGY_ON_HURT)
    attacker.energy = Math.min(100, attacker.energy + GAME_CONFIG.ENERGY_ON_HIT)
    if (!defender.isBlocking) {
      defender.state = 'hurt'
      defender.hurtTimer = GAME_CONFIG.HURT_FRAMES
      defender.stateTimer = GAME_CONFIG.HURT_FRAMES
      // 击退
      const knock = attacker.facing
      defender.x += knock * 12
      gameState.screenShake = 6
    }
    addParticle(defender.x, GAME_CONFIG.GROUND_Y - 60, defender.isBlocking ? '#ffffff' : getCharacter(defender.characterId).color, 6)
  }

  function applyDamage(attacker: PlayerState, defender: PlayerState, dmg: number, isSpecial = false) {
    let finalDmg = dmg
    if (defender.isBlocking) {
      finalDmg = Math.floor(dmg * 0.4)
      playBlock()
    } else if (isSpecial) {
      playSpecial()
    }
    defender.hp = Math.max(0, defender.hp - finalDmg)
    defender.energy = Math.min(100, defender.energy + GAME_CONFIG.ENERGY_ON_HURT)
    attacker.energy = Math.min(100, attacker.energy + GAME_CONFIG.ENERGY_ON_HIT)
    if (!defender.isBlocking) {
      defender.state = 'hurt'
      defender.hurtTimer = GAME_CONFIG.HURT_FRAMES
      defender.stateTimer = GAME_CONFIG.HURT_FRAMES
      const knock = attacker.facing
      defender.x += knock * 15
    } else {
      const knock = attacker.facing
      defender.x += knock * 5
    }
    addParticle(defender.x, GAME_CONFIG.GROUND_Y - 60, defender.isBlocking ? '#ffffff' : getCharacter(defender.characterId).color, isSpecial ? 15 : 10)
  }

  function autoFace() {
    if (gameState.p1.x < gameState.p2.x) {
      gameState.p1.facing = 1
      gameState.p2.facing = -1
    } else {
      gameState.p1.facing = -1
      gameState.p2.facing = 1
    }
  }

  function clampPositions() {
    gameState.p1.x = Math.max(40, Math.min(GAME_CONFIG.CANVAS_WIDTH - 40, gameState.p1.x))
    gameState.p2.x = Math.max(40, Math.min(GAME_CONFIG.CANVAS_WIDTH - 40, gameState.p2.x))
    // 防止重叠
    const minDist = 30
    if (Math.abs(gameState.p1.x - gameState.p2.x) < minDist) {
      if (gameState.p1.x < gameState.p2.x) {
        gameState.p1.x -= 2
        gameState.p2.x += 2
      } else {
        gameState.p1.x += 2
        gameState.p2.x -= 2
      }
    }
  }

  function checkRoundEnd() {
    if (gameState.p1.hp <= 0 || gameState.p2.hp <= 0) {
      endRound()
    }
  }

  function endRound() {
    if (gameState.phase !== 'battle') return

    let roundWinner: number
    if (gameState.p1.hp <= 0 && gameState.p2.hp <= 0) {
      roundWinner = gameState.p1.hp >= gameState.p2.hp ? 1 : 2
    } else if (gameState.p1.hp <= 0) {
      roundWinner = 2
    } else if (gameState.p2.hp <= 0) {
      roundWinner = 1
    } else {
      roundWinner = gameState.p1.hp >= gameState.p2.hp ? 1 : 2
    }

    if (roundWinner === 1) gameState.p1Score++
    else gameState.p2Score++

    playVictory()

    if (gameState.p1Score >= GAME_CONFIG.WIN_ROUNDS || gameState.p2Score >= GAME_CONFIG.WIN_ROUNDS) {
      gameState.winner = roundWinner === 1 ? gameState.p1Selected : gameState.p2Selected
      gameState.phase = 'result'
      stopGameLoop()
      autoSave()
      return
    }

    gameState.round++
    setTimeout(() => {
      initRound(true)
    }, 1500)
  }

  function restart() {
    initRound(false)
    gameState.phase = 'battle'
    gameState.winner = null
    playStart()
    startGameLoop()
  }

  function backToSelect() {
    stopGameLoop()
    clearSave()
    gameState.phase = 'select'
    gameState.winner = null
    resetInput()
  }

  function checkIdleTimeout(): boolean {
    return Date.now() - lastInputTime.value > GAME_CONFIG.IDLE_TIMEOUT
  }

  // 组件卸载时清理
  function cleanup() {
    stopGameLoop()
  }

  return {
    gameState,
    frameCount,
    p1Input,
    p2Input,
    lastInputTime,
    startBattle,
    continueFromSave,
    startGameLoop,
    stopGameLoop,
    restart,
    backToSelect,
    cleanup,
    checkIdleTimeout,
    hasValidSave,
    loadGame,
    autoSave
  }
}
