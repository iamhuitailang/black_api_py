const STORAGE_KEY = 'hamster_snowball_game_data'
const DATA_VERSION = 1

export interface GameSaveData {
  version: number
  player: PlayerData
}

export interface PlayerData {
  id: string
  nickname: string
  avatar: string
  level: number
  exp: number
  coins: number
  diamonds: number
  stats: PlayerStats
  unlocked: UnlockedData
  equipped: EquippedData
  achievements: Record<string, boolean>
  claimedAchievements: Record<string, boolean>
  lastLoginDate: string
}

export interface PlayerStats {
  totalGames: number
  wins: number
  maxSnowballSize: number
  totalCoinsEarned: number
}

export interface UnlockedData {
  hamsterSkins: string[]
  snowballEffects: string[]
  decorations: string[]
  maps: string[]
  items: Record<string, number>
}

export interface EquippedData {
  hamsterSkin: string
  snowballEffect: string
  decorations: string[]
}

export function getDefaultPlayerData(): PlayerData {
  return {
    id: generateId(),
    nickname: '小仓鼠玩家',
    avatar: '🐹',
    level: 1,
    exp: 0,
    coins: 1000,
    diamonds: 50,
    stats: {
      totalGames: 0,
      wins: 0,
      maxSnowballSize: 0,
      totalCoinsEarned: 1000
    },
    unlocked: {
      hamsterSkins: ['default'],
      snowballEffects: ['default'],
      decorations: [],
      maps: ['ice_world'],
      items: {
        speed_boots: 3,
        shield: 2,
        slow_slime: 2
      }
    },
    equipped: {
      hamsterSkin: 'default',
      snowballEffect: 'default',
      decorations: []
    },
    achievements: {},
    claimedAchievements: {},
    lastLoginDate: new Date().toDateString()
  }
}

export function loadGameData(): GameSaveData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data) as GameSaveData
      if (parsed.version === DATA_VERSION) {
        return parsed
      }
      return migrateData(parsed)
    }
    return null
  } catch (e) {
    console.error('Failed to load game data:', e)
    return null
  }
}

export function saveGameData(data: GameSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save game data:', e)
  }
}

export function createNewGameData(): GameSaveData {
  return {
    version: DATA_VERSION,
    player: getDefaultPlayerData()
  }
}

function migrateData(oldData: any): GameSaveData | null {
  console.log('Migrating game data from version', oldData.version)
  return null
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getExpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

export function getLevelFromExp(exp: number): { level: number; currentExp: number; expForNextLevel: number } {
  let level = 1
  let totalExp = 0
  
  while (true) {
    const expForNext = getExpForLevel(level)
    if (exp < totalExp + expForNext) {
      return {
        level,
        currentExp: exp - totalExp,
        expForNextLevel: expForNext
      }
    }
    totalExp += expForNext
    level++
  }
}
