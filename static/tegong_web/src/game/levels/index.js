import { createBambooLevel } from './bamboo.js'
import { createCastleLevel } from './castle.js'
import { createSwampLevel } from './swamp.js'
import { createSnowLevel } from './snow.js'

export const LEVELS = {
  1: createBambooLevel,
  2: createCastleLevel,
  3: createSwampLevel,
  4: createSnowLevel
}

export const LEVEL_INFO = [
  { id: 1, name: '竹林密踪', theme: 'bamboo', description: '翠绿竹林中，利用竹叶隐藏身形' },
  { id: 2, name: '古堡潜入', theme: 'castle', description: '守卫森严的古堡，危机四伏' },
  { id: 3, name: '毒沼迷途', theme: 'swamp', description: '毒气弥漫的沼泽，步步惊心' },
  { id: 4, name: '雪山危机', theme: 'snow', description: '暴风雪中的雪山，冰面险途' }
]

export function getLevel(levelId) {
  const creator = LEVELS[levelId]
  if (creator) {
    return creator()
  }
  return null
}

export function getLevelInfo(levelId) {
  return LEVEL_INFO.find(l => l.id === levelId)
}
