/**
 * 关卡数据导出模块
 * 统一导出所有关卡数据和类型
 */

import { forestLevel } from './forest'
import { canyonLevel } from './canyon'
import { castleLevel } from './castle'
import type { LevelData } from './forest'

export type { LevelData }
export { forestLevel, canyonLevel, castleLevel }

/**
 * 所有关卡列表
 */
export const levels: LevelData[] = [forestLevel, canyonLevel, castleLevel]

/**
 * 根据关卡ID获取关卡数据
 * @param id 关卡ID
 * @returns 关卡数据，如果未找到返回undefined
 */
export function getLevelById(id: number): LevelData | undefined {
  return levels.find(level => level.id === id)
}

/**
 * 获取总关卡数
 * @returns 关卡总数
 */
export function getTotalLevels(): number {
  return levels.length
}
