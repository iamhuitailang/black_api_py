import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  loadGameData, 
  saveGameData, 
  createNewGameData, 
  getLevelFromExp,
  getExpForLevel,
  type PlayerData,
  type GameSaveData
} from '@/utils/storage'
import { HAMSTER_SKINS, SNOWBALL_EFFECTS, DECORATIONS, ITEMS, MAPS, ACHIEVEMENTS } from '@/data/gameData'

export const usePlayerStore = defineStore('player', () => {
  const player = ref<PlayerData>(getDefaultPlayer())
  const isLoaded = ref(false)

  function getDefaultPlayer(): PlayerData {
    const saved = loadGameData()
    if (saved) {
      return saved.player
    }
    return createNewGameData().player
  }

  function loadPlayer() {
    const saved = loadGameData()
    if (saved) {
      player.value = saved.player
    }
    isLoaded.value = true
    checkMapUnlocks()
  }

  function savePlayer() {
    const data: GameSaveData = {
      version: 1,
      player: player.value
    }
    saveGameData(data)
  }

  const levelInfo = computed(() => {
    return getLevelFromExp(player.value.exp)
  })

  const winRate = computed(() => {
    if (player.value.stats.totalGames === 0) return 0
    return Math.round((player.value.stats.wins / player.value.stats.totalGames) * 100)
  })

  const currentHamsterSkin = computed(() => {
    return HAMSTER_SKINS.find(s => s.id === player.value.equipped.hamsterSkin) || HAMSTER_SKINS[0]
  })

  const currentSnowballEffect = computed(() => {
    return SNOWBALL_EFFECTS.find(e => e.id === player.value.equipped.snowballEffect) || SNOWBALL_EFFECTS[0]
  })

  function addCoins(amount: number) {
    player.value.coins += amount
    player.value.stats.totalCoinsEarned += amount
    checkAchievements()
    savePlayer()
  }

  function spendCoins(amount: number): boolean {
    if (player.value.coins >= amount) {
      player.value.coins -= amount
      savePlayer()
      return true
    }
    return false
  }

  function addDiamonds(amount: number) {
    player.value.diamonds += amount
    savePlayer()
  }

  function spendDiamonds(amount: number): boolean {
    if (player.value.diamonds >= amount) {
      player.value.diamonds -= amount
      savePlayer()
      return true
    }
    return false
  }

  function addExp(amount: number) {
    player.value.exp += amount
    checkAchievements()
    checkMapUnlocks()
    savePlayer()
  }

  function equipHamsterSkin(skinId: string) {
    if (player.value.unlocked.hamsterSkins.includes(skinId)) {
      player.value.equipped.hamsterSkin = skinId
      savePlayer()
      return true
    }
    return false
  }

  function equipSnowballEffect(effectId: string) {
    if (player.value.unlocked.snowballEffects.includes(effectId)) {
      player.value.equipped.snowballEffect = effectId
      savePlayer()
      return true
    }
    return false
  }

  function unlockHamsterSkin(skinId: string): boolean {
    const skin = HAMSTER_SKINS.find(s => s.id === skinId)
    if (!skin || player.value.unlocked.hamsterSkins.includes(skinId)) return false
    
    let success = false
    if (skin.currency === 'coins') {
      success = spendCoins(skin.price)
    } else {
      success = spendDiamonds(skin.price)
    }
    
    if (success) {
      player.value.unlocked.hamsterSkins.push(skinId)
      savePlayer()
      return true
    }
    return false
  }

  function unlockSnowballEffect(effectId: string): boolean {
    const effect = SNOWBALL_EFFECTS.find(e => e.id === effectId)
    if (!effect || player.value.unlocked.snowballEffects.includes(effectId)) return false
    
    let success = false
    if (effect.currency === 'coins') {
      success = spendCoins(effect.price)
    } else {
      success = spendDiamonds(effect.price)
    }
    
    if (success) {
      player.value.unlocked.snowballEffects.push(effectId)
      savePlayer()
      return true
    }
    return false
  }

  function unlockDecoration(decorationId: string): boolean {
    const deco = DECORATIONS.find(d => d.id === decorationId)
    if (!deco || player.value.unlocked.decorations.includes(decorationId)) return false
    
    let success = false
    if (deco.currency === 'coins') {
      success = spendCoins(deco.price)
    } else {
      success = spendDiamonds(deco.price)
    }
    
    if (success) {
      player.value.unlocked.decorations.push(decorationId)
      savePlayer()
      return true
    }
    return false
  }

  function buyItem(itemId: string, quantity: number = 1): boolean {
    const item = ITEMS.find(i => i.id === itemId)
    if (!item) return false
    
    const totalPrice = item.price * quantity
    let success = false
    
    if (item.currency === 'coins') {
      success = spendCoins(totalPrice)
    } else {
      success = spendDiamonds(totalPrice)
    }
    
    if (success) {
      player.value.unlocked.items[itemId] = (player.value.unlocked.items[itemId] || 0) + quantity
      savePlayer()
      return true
    }
    return false
  }

  function useItem(itemId: string): boolean {
    const count = player.value.unlocked.items[itemId] || 0
    if (count > 0) {
      player.value.unlocked.items[itemId] = count - 1
      savePlayer()
      return true
    }
    return false
  }

  function addItem(itemId: string, quantity: number = 1) {
    player.value.unlocked.items[itemId] = (player.value.unlocked.items[itemId] || 0) + quantity
    savePlayer()
  }

  function updateStats(win: boolean, maxSnowball: number, coinsEarned: number) {
    player.value.stats.totalGames++
    if (win) {
      player.value.stats.wins++
    }
    if (maxSnowball > player.value.stats.maxSnowballSize) {
      player.value.stats.maxSnowballSize = maxSnowball
    }
    checkAchievements()
    savePlayer()
  }

  function checkMapUnlocks() {
    const level = levelInfo.value.level
    MAPS.forEach(map => {
      if (level >= map.unlockLevel && !player.value.unlocked.maps.includes(map.id)) {
        player.value.unlocked.maps.push(map.id)
      }
    })
  }

  function checkAchievements() {
    const stats = player.value.stats
    const level = levelInfo.value.level
    
    ACHIEVEMENTS.forEach(achievement => {
      if (player.value.achievements[achievement.id]) return
      
      let unlocked = false
      switch (achievement.condition.type) {
        case 'win_count':
          unlocked = stats.wins >= achievement.condition.value
          break
        case 'total_games':
          unlocked = stats.totalGames >= achievement.condition.value
          break
        case 'max_snowball':
          unlocked = stats.maxSnowballSize >= achievement.condition.value
          break
        case 'total_coins':
          unlocked = stats.totalCoinsEarned >= achievement.condition.value
          break
        case 'level':
          unlocked = level >= achievement.condition.value
          break
      }
      
      if (unlocked) {
        player.value.achievements[achievement.id] = true
      }
    })
  }

  function claimAchievement(achievementId: string): boolean {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement || !player.value.achievements[achievementId]) return false
    if (player.value.claimedAchievements[achievementId]) return false
    
    player.value.claimedAchievements[achievementId] = true
    
    if (achievement.reward.type === 'coins') {
      player.value.coins += achievement.reward.amount
    } else if (achievement.reward.type === 'diamonds') {
      player.value.diamonds += achievement.reward.amount
    }
    
    savePlayer()
    return true
  }

  function updateNickname(nickname: string) {
    player.value.nickname = nickname
    savePlayer()
  }

  return {
    player,
    isLoaded,
    levelInfo,
    winRate,
    currentHamsterSkin,
    currentSnowballEffect,
    loadPlayer,
    savePlayer,
    addCoins,
    spendCoins,
    addDiamonds,
    spendDiamonds,
    addExp,
    equipHamsterSkin,
    equipSnowballEffect,
    unlockHamsterSkin,
    unlockSnowballEffect,
    unlockDecoration,
    buyItem,
    useItem,
    addItem,
    updateStats,
    checkAchievements,
    claimAchievement,
    updateNickname
  }
})
