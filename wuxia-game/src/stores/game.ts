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
  const chapterBranches = ref<Record<1 | 2 | 3, number>>({ 1: 1, 2: 1, 3: 1 })

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
    chapterBranches.value = { 1: 1, 2: 1, 3: 1 }
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
    currentStoryNodeId.value = nextNodeId
    if (choiceId) {
      branchChoices.value.push(choiceId)
    }

    if (nextNodeId === 'c2-start-1') chapterBranches.value[1] = 1
    else if (nextNodeId === 'c2-start-2') chapterBranches.value[1] = 2
    else if (nextNodeId === 'c2-start-3') chapterBranches.value[1] = 3

    if (nextNodeId === 'c3-start-a') chapterBranches.value[2] = 1
    else if (nextNodeId === 'c3-start-b') chapterBranches.value[2] = 2
    else if (nextNodeId === 'c3-start-c') chapterBranches.value[2] = 3

    if (nextNodeId === 'ending-a') chapterBranches.value[3] = 1
    else if (nextNodeId === 'ending-b') chapterBranches.value[3] = 2
    else if (nextNodeId === 'ending-c') chapterBranches.value[3] = 3
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
    if (!unlockedEndings.value.includes(branchKey)) {
      unlockedEndings.value.push(branchKey)
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
    chapterBranches.value = { 1: 1, 2: 1, 3: 1 }
  }

  function getBranchKey(): string {
    return `${chapterBranches.value[1]}-${chapterBranches.value[2]}-${chapterBranches.value[3]}`
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
