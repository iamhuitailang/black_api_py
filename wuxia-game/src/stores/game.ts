import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, SectId, ArenaRecord, Equipment } from '../types'
import { SECTS, getSect } from '../data/sects'
import { getSkillsBySect } from '../data/skills'
import { INITIAL_STORY_NODE } from '../data/story'

export const useGameStore = defineStore('game', () => {
  const player = ref<Player | null>(null)
  const currentStoryNodeId = ref<string>(INITIAL_STORY_NODE)
  const currentChapter = ref<1 | 2 | 3>(1)
  const branchChoices = ref<string[]>([])
  const arena = ref<ArenaRecord>({
    winStreak: 0,
    maxWinStreak: 0,
    medal: 'none',
    rewards: []
  })
  const hasSave = ref<boolean>(false)
  const currentBattleEnemyId = ref<string | null>(null)
  const currentBattleNextNodeId = ref<string | null>(null)
  const unlockedEndings = ref<string[]>([])
  const chapterBranches = ref<[number, number, number]>([1, 1, 1])

  function migrateOldChapterBranches() {
    const raw = localStorage.getItem('wuxia-game-save')
    if (!raw) return
    try {
      const data = JSON.parse(raw)
      if (data.chapterBranches && !Array.isArray(data.chapterBranches)) {
        const old = data.chapterBranches
        data.chapterBranches = [old['1'] || old[1] || 1, old['2'] || old[2] || 1, old['3'] || old[3] || 1]
        localStorage.setItem('wuxia-game-save', JSON.stringify(data))
        console.log('[migrate] chapterBranches converted from object to array:', data.chapterBranches)
      }
    } catch (e) {
      console.error('[migrate] failed:', e)
    }
  }

  migrateOldChapterBranches()

  const playerExists = computed(() => player.value !== null)

  function createNewPlayer(sectId: SectId, name: string = '少侠') {
    const sect = getSect(sectId)
    if (!sect) return
    const skills = getSkillsBySect(sectId).map(s => s.id)

    player.value = {
      name,
      sect: sectId,
      hp: sect.maxHp,
      maxHp: sect.maxHp,
      qi: sect.maxQi,
      maxQi: sect.maxQi,
      baseAttack: sect.baseAttack,
      skills,
      equipment: [],
      buffs: []
    }
    currentStoryNodeId.value = INITIAL_STORY_NODE
    currentChapter.value = 1
    branchChoices.value = []
    chapterBranches.value = [1, 1, 1]
    hasSave.value = true
  }

  function updatePlayer(updates: Partial<Player>) {
    if (!player.value) return
    player.value = { ...player.value, ...updates }
  }

  function healPlayerFull() {
    if (!player.value) return
    const sect = getSect(player.value.sect)
    if (!sect) return
    let maxHp = sect.maxHp
    let maxQi = sect.maxQi
    player.value.equipment.forEach(e => {
      if (e.hpBonus) maxHp += e.hpBonus
      if (e.qiBonus) maxQi += e.qiBonus
    })
    player.value.hp = maxHp
    player.value.maxHp = maxHp
    player.value.qi = maxQi
    player.value.maxQi = maxQi
    player.value.buffs = []
  }

  function advanceStory(nextNodeId: string, choiceId?: string) {
    console.log('[advanceStory]', { nextNodeId, choiceId, prevBranches: JSON.stringify(chapterBranches.value) })
    currentStoryNodeId.value = nextNodeId
    if (choiceId) {
      branchChoices.value.push(choiceId)
    }

    const b = Array.isArray(chapterBranches.value) ? [...chapterBranches.value] : [1, 1, 1]

    if (nextNodeId === 'c2-start-1') { b[0] = 1; console.log('[branch] ch1=1') }
    else if (nextNodeId === 'c2-start-2') { b[0] = 2; console.log('[branch] ch1=2') }
    else if (nextNodeId === 'c2-start-3') { b[0] = 3; console.log('[branch] ch1=3') }

    if (nextNodeId === 'c3-start-a') { b[1] = 1; console.log('[branch] ch2=1') }
    else if (nextNodeId === 'c3-start-b') { b[1] = 2; console.log('[branch] ch2=2') }
    else if (nextNodeId === 'c3-start-c') { b[1] = 3; console.log('[branch] ch2=3') }

    if (nextNodeId === 'ending-a') { b[2] = 1; console.log('[branch] ch3=1') }
    else if (nextNodeId === 'ending-b') { b[2] = 2; console.log('[branch] ch3=2') }
    else if (nextNodeId === 'ending-c') { b[2] = 3; console.log('[branch] ch3=3') }

    chapterBranches.value = [b[0], b[1], b[2]]
    console.log('[advanceStory] after:', JSON.stringify(chapterBranches.value))
  }

  function setChapter(chapter: 1 | 2 | 3) {
    currentChapter.value = chapter
  }

  function addEquipment(equip: Equipment) {
    if (!player.value) return
    const existing = player.value.equipment.findIndex(e => e.type === equip.type)
    if (existing >= 0) {
      const oldEquip = player.value.equipment[existing]
      if (oldEquip.hpBonus) player.value.maxHp -= oldEquip.hpBonus
      if (oldEquip.qiBonus) player.value.maxQi -= oldEquip.qiBonus
      if (oldEquip.attackBonus) player.value.baseAttack -= oldEquip.attackBonus
      player.value.equipment[existing] = equip
    } else {
      player.value.equipment.push(equip)
    }
    if (equip.hpBonus) player.value.maxHp += equip.hpBonus
    if (equip.qiBonus) player.value.maxQi += equip.qiBonus
    if (equip.attackBonus) player.value.baseAttack += equip.attackBonus
    if (player.value.hp > player.value.maxHp) player.value.hp = player.value.maxHp
    if (player.value.qi > player.value.maxQi) player.value.qi = player.value.maxQi
  }

  function setCurrentBattle(enemyId: string, nextNodeId?: string) {
    currentBattleEnemyId.value = enemyId
    currentBattleNextNodeId.value = nextNodeId || null
  }

  function clearCurrentBattle() {
    currentBattleEnemyId.value = null
    currentBattleNextNodeId.value = null
  }

  function unlockEnding(branchKey: string) {
    console.log('[unlockEnding]', { branchKey, current: [...unlockedEndings.value] })
    if (!unlockedEndings.value.includes(branchKey)) {
      unlockedEndings.value.push(branchKey)
      console.log('[unlockEnding] added!', unlockedEndings.value)
    } else {
      console.log('[unlockEnding] already exists, skip')
    }
  }

  function resetAll() {
    player.value = null
    currentStoryNodeId.value = INITIAL_STORY_NODE
    currentChapter.value = 1
    branchChoices.value = []
    arena.value = {
      winStreak: 0,
      maxWinStreak: 0,
      medal: 'none',
      rewards: []
    }
    hasSave.value = false
    currentBattleEnemyId.value = null
    currentBattleNextNodeId.value = null
    chapterBranches.value = [1, 1, 1]
  }

  function getBranchKey(): string {
    const b = chapterBranches.value
    let ch1: number, ch2: number, ch3: number
    if (Array.isArray(b)) {
      ch1 = b[0] ?? 1
      ch2 = b[1] ?? 1
      ch3 = b[2] ?? 1
    } else if (typeof b === 'object' && b !== null) {
      ch1 = b[0] ?? b['1'] ?? b[1] ?? 1
      ch2 = b[1] ?? b['2'] ?? b[2] ?? 1
      ch3 = b[2] ?? b['3'] ?? b[3] ?? 1
    } else {
      ch1 = ch2 = ch3 = 1
    }
    const key = `${ch1}-${ch2}-${ch3}`
    console.log('[getBranchKey]', { raw: JSON.stringify(b), result: key })
    return key
  }

  return {
    player,
    currentStoryNodeId,
    currentChapter,
    branchChoices,
    arena,
    hasSave,
    currentBattleEnemyId,
    currentBattleNextNodeId,
    unlockedEndings,
    chapterBranches,
    playerExists,
    createNewPlayer,
    updatePlayer,
    healPlayerFull,
    advanceStory,
    setChapter,
    addEquipment,
    setCurrentBattle,
    clearCurrentBattle,
    unlockEnding,
    resetAll,
    getBranchKey
  }
}, {
  persist: {
    key: 'wuxia-game-save',
    storage: localStorage,
    debug: true,
    paths: ['player', 'currentStoryNodeId', 'currentChapter', 'branchChoices', 'arena', 'hasSave', 'currentBattleEnemyId', 'currentBattleNextNodeId', 'unlockedEndings', 'chapterBranches']
  }
})
