import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Enemy, BattleLogEntry, Buff } from '../types'
import { cloneEnemy } from '../data/enemies'
import { getSkill } from '../data/skills'
import {
  playerNormalAttack,
  playerUseSkill,
  enemyAttack,
  recoverQi,
  processBuffsAtTurnStart,
  decrementBuffDurations,
  getTotalMaxHp,
  getTotalMaxQi
} from '../utils/battleLogic'
import { playSkillSound, playHitSound, playHealSound, playVictorySound, playDefeatSound } from '../utils/audioSynth'

export type BattlePhase = 'idle' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat'
export type BattleMode = 'story' | 'arena'

export const useBattleStore = defineStore('battle', () => {
  const player = ref<Player | null>(null)
  const enemy = ref<Enemy | null>(null)
  const phase = ref<BattlePhase>('idle')
  const turn = ref<number>(1)
  const mode = ref<BattleMode>('story')
  const logs = ref<BattleLogEntry[]>([])
  const logIdCounter = ref<number>(0)
  const isProcessing = ref<boolean>(false)

  const battleActive = computed(() => phase.value !== 'idle')
  const isPlayerTurn = computed(() => phase.value === 'player-turn')

  function addLog(text: string, type: BattleLogEntry['type'] = 'system') {
    logIdCounter.value++
    logs.value.push({ id: logIdCounter.value, text, type })
    if (logs.value.length > 50) {
      logs.value = logs.value.slice(-50)
    }
  }

  function startBattle(playerData: Player, enemyId: string, battleMode: BattleMode = 'story') {
    const enemyData = cloneEnemy(enemyId)
    if (!enemyData) return false

    player.value = JSON.parse(JSON.stringify(playerData))
    player.value.buffs = []
    enemy.value = enemyData
    phase.value = 'player-turn'
    turn.value = 1
    mode.value = battleMode
    logs.value = []
    addLog(`战斗开始！你遭遇了 ${enemyData.name}！`, 'system')
    addLog(`第 ${turn.value} 回合 —— 你的行动`, 'system')
    return true
  }

  function doPlayerNormalAttack() {
    if (!player.value || !enemy.value || phase.value !== 'player-turn' || isProcessing.value) return
    isProcessing.value = true

    const result = playerNormalAttack(player.value, enemy.value)
    enemy.value.hp = Math.max(0, enemy.value.hp - result.damage)
    result.logs.forEach(log => addLog(log, 'player'))
    playHitSound()

    setTimeout(() => {
      checkBattleEnd()
    }, 600)
  }

  function doPlayerSkill(skillId: string) {
    if (!player.value || !enemy.value || phase.value !== 'player-turn' || isProcessing.value) return
    const skill = getSkill(skillId)
    if (!skill) return
    if (player.value.qi < skill.qiCost) {
      addLog(`真气不足，无法施展【${skill.name}】！`, 'system')
      return
    }
    isProcessing.value = true

    player.value.qi -= skill.qiCost
    const result = playerUseSkill(player.value, enemy.value, skillId)
    if (!result) {
      isProcessing.value = false
      return
    }

    if (result.damage > 0) {
      enemy.value.hp = Math.max(0, enemy.value.hp - result.damage)
    }
    if (result.selfDamage > 0) {
      const maxHp = getTotalMaxHp(player.value)
      player.value.hp = Math.max(0, player.value.hp - result.selfDamage)
      if (player.value.hp > maxHp) player.value.hp = maxHp
    }
    if (result.healAmount > 0) {
      const maxHp = getTotalMaxHp(player.value)
      player.value.hp = Math.min(maxHp, player.value.hp + result.healAmount)
      playHealSound()
    }
    if (result.newBuffs.length > 0) {
      result.newBuffs.forEach(buff => {
        if (buff.type === 'debuff') {
          if (!enemy.value!.buffs) enemy.value!.buffs = []
          enemy.value!.buffs.push(buff)
        } else {
          player.value!.buffs.push(buff)
        }
      })
    }

    result.logs.forEach(log => {
      if (log.includes('回复')) addLog(log, 'heal')
      else addLog(log, 'player')
    })
    playSkillSound(skill.soundType)

    setTimeout(() => {
      checkBattleEnd()
    }, 800)
  }

  function doPlayerDefend() {
    if (!player.value || phase.value !== 'player-turn' || isProcessing.value) return
    isProcessing.value = true
    const qiRecovered = recoverQi(player.value, 15)
    player.value.qi += qiRecovered
    addLog(`你闭目调息，回复了 ${qiRecovered} 点真气。`, 'heal')
    playHealSound()

    setTimeout(() => {
      checkBattleEnd()
    }, 600)
  }

  function checkBattleEnd() {
    if (!player.value || !enemy.value) return

    if (enemy.value.hp <= 0) {
      phase.value = 'victory'
      addLog(`${enemy.value.name} 被你击败了！`, 'system')
      playVictorySound()
      isProcessing.value = false
      return
    }
    if (player.value.hp <= 0) {
      phase.value = 'defeat'
      addLog(`你力战不敌，倒在了 ${enemy.value.name} 的手下……`, 'system')
      playDefeatSound()
      isProcessing.value = false
      return
    }

    enemyTurn()
  }

  function enemyTurn() {
    if (!player.value || !enemy.value) return
    phase.value = 'enemy-turn'

    setTimeout(() => {
      const enemyResult = enemyAttack(enemy.value!, player.value!)
      player.value!.hp = Math.max(0, player.value!.hp - enemyResult.damage)
      if (enemyResult.reflectDamage > 0) {
        enemy.value!.hp = Math.max(0, enemy.value!.hp - enemyResult.reflectDamage)
      }
      enemyResult.logs.forEach(log => {
        if (log.includes('反弹')) addLog(log, 'damage')
        else if (log.includes('回复')) addLog(log, 'heal')
        else addLog(log, 'enemy')
      })
      if (enemyResult.damage > 0 || enemyResult.reflectDamage > 0) {
        playHitSound()
      }

      setTimeout(() => {
        if (enemy.value!.hp <= 0) {
          phase.value = 'victory'
          addLog(`${enemy.value!.name} 被你击败了！`, 'system')
          playVictorySound()
          isProcessing.value = false
          return
        }
        if (player.value!.hp <= 0) {
          phase.value = 'defeat'
          addLog(`你力战不敌，倒在了 ${enemy.value!.name} 的手下……`, 'system')
          playDefeatSound()
          isProcessing.value = false
          return
        }
        nextTurn()
      }, 600)
    }, 800)
  }

  function nextTurn() {
    if (!player.value || !enemy.value) return
    turn.value++

    const playerBuffs = decrementBuffDurations(player.value)
    playerBuffs.forEach(log => addLog(log, 'system'))

    const { damage: enemyDotDmg, logs: enemyDotLogs } = processBuffsAtTurnStart(enemy.value!)
    if (enemyDotDmg > 0) {
      enemy.value.hp = Math.max(0, enemy.value.hp - enemyDotDmg)
      enemyDotLogs.forEach(log => addLog(`${enemy.value!.name}${log}`, 'damage'))
    }
    const enemyBuffs = decrementBuffDurations(enemy.value!)
    enemyBuffs.forEach(log => addLog(log, 'system'))

    if (enemy.value.hp <= 0) {
      phase.value = 'victory'
      addLog(`${enemy.value.name} 因伤势过重倒下了！`, 'system')
      playVictorySound()
      isProcessing.value = false
      return
    }

    const qiRecovered = recoverQi(player.value)
    if (qiRecovered > 0) {
      player.value.qi += qiRecovered
    }

    phase.value = 'player-turn'
    isProcessing.value = false
    addLog(`第 ${turn.value} 回合 —— 你的行动`, 'system')
  }

  function endBattle() {
    player.value = null
    enemy.value = null
    phase.value = 'idle'
    turn.value = 1
    logs.value = []
    isProcessing.value = false
  }

  return {
    player,
    enemy,
    phase,
    turn,
    mode,
    logs,
    battleActive,
    isPlayerTurn,
    isProcessing,
    addLog,
    startBattle,
    doPlayerNormalAttack,
    doPlayerSkill,
    doPlayerDefend,
    enemyTurn,
    endBattle
  }
}, {
  persist: {
    key: 'wuxia-battle-save',
    storage: localStorage,
    paths: ['player', 'enemy', 'phase', 'turn', 'mode', 'logs', 'logIdCounter']
  }
})
