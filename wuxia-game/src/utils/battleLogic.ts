import type { Player, Enemy, Skill, Buff, Equipment } from '../types'
import { getSkill } from '../data/skills'

export function getTotalAttack(player: Player): number {
  let attack = player.baseAttack
  player.equipment.forEach(equip => {
    if (equip.attackBonus) attack += equip.attackBonus
  })
  return attack
}

export function getTotalMaxHp(player: Player): number {
  let hp = player.maxHp
  player.equipment.forEach(equip => {
    if (equip.hpBonus) hp += equip.hpBonus
  })
  return hp
}

export function getTotalMaxQi(player: Player): number {
  let qi = player.maxQi
  player.equipment.forEach(equip => {
    if (equip.qiBonus) qi += equip.qiBonus
  })
  return qi
}

export function getPlayerShieldReflect(player: Player): number {
  const shieldBuff = player.buffs.find(b => b.id === 'taiji-shield')
  return shieldBuff?.effect.reflectPercent || 0
}

export function processBuffsAtTurnStart(target: Player | Enemy): { damage: number; logs: string[] } {
  let totalDamage = 0
  const logs: string[] = []

  const buffs = target.buffs
  if (buffs) {
    const poisonBuff = buffs.find(b => b.id === 'poison')
    if (poisonBuff && poisonBuff.effect.poisonDamage) {
      const dmg = poisonBuff.effect.poisonDamage
      totalDamage += dmg
      logs.push(`受到 ${dmg} 点毒伤！`)
    }
  }

  return { damage: totalDamage, logs }
}

export function decrementBuffDurations(target: Player | Enemy): string[] {
  const logs: string[] = []
  if (target.buffs) {
    target.buffs = target.buffs.filter(buff => {
      buff.duration--
      if (buff.duration <= 0) {
        logs.push(`${buff.name}效果消失。`)
        return false
      }
      return true
    })
  }
  return logs
}

export interface AttackResult {
  damage: number
  reflectDamage: number
  logs: string[]
  newBuffs: Buff[]
  selfDamage: number
  healAmount: number
}

export function playerNormalAttack(player: Player, enemy: Enemy): AttackResult {
  const result: AttackResult = {
    damage: 0,
    reflectDamage: 0,
    logs: [],
    newBuffs: [],
    selfDamage: 0,
    healAmount: 0
  }

  const baseAttack = getTotalAttack(player)
  const variance = 0.9 + Math.random() * 0.2
  result.damage = Math.floor(baseAttack * variance)
  result.logs.push(`你发起普通攻击，对 ${enemy.name} 造成 ${result.damage} 点伤害！`)

  return result
}

export function playerUseSkill(player: Player, enemy: Enemy, skillId: string): AttackResult | null {
  const skill = getSkill(skillId)
  if (!skill) return null
  if (player.qi < skill.qiCost) return null

  const result: AttackResult = {
    damage: 0,
    reflectDamage: 0,
    logs: [],
    newBuffs: [],
    selfDamage: skill.selfDamage || 0,
    healAmount: skill.heal || 0
  }

  if (skill.damage > 0) {
    const variance = 0.9 + Math.random() * 0.2
    result.damage = Math.floor(skill.damage * variance)
    result.logs.push(`你施展【${skill.name}】，对 ${enemy.name} 造成 ${result.damage} 点伤害！`)
  }

  if (skill.heal) {
    result.logs.push(`你运转内力，回复了 ${skill.heal} 点生命！`)
  }

  if (skill.selfDamage) {
    result.logs.push(`招式刚猛反噬，你受到 ${skill.selfDamage} 点反伤！`)
  }

  if (skill.poisonDamage && skill.poisonDuration) {
    result.newBuffs.push({
      id: 'poison',
      name: '千丝毒',
      type: 'debuff',
      duration: skill.poisonDuration,
      effect: { poisonDamage: skill.poisonDamage }
    })
    result.logs.push(`${enemy.name} 中毒了！接下来 ${skill.poisonDuration} 回合每回合受到 ${skill.poisonDamage} 点毒伤！`)
  }

  if (skill.reflectPercent && skill.shieldDuration) {
    result.newBuffs.push({
      id: 'taiji-shield',
      name: '太极护盾',
      type: 'buff',
      duration: skill.shieldDuration,
      effect: { reflectPercent: skill.reflectPercent }
    })
    result.logs.push(`你获得了太极护盾，接下来 ${skill.shieldDuration} 回合反弹 ${skill.reflectPercent}% 伤害！`)
  }

  return result
}

export function enemyAttack(enemy: Enemy, player: Player): AttackResult {
  const result: AttackResult = {
    damage: 0,
    reflectDamage: 0,
    logs: [],
    newBuffs: [],
    selfDamage: 0,
    healAmount: 0
  }

  const hpPercent = player.hp / getTotalMaxHp(player)
  let useSkill = false

  switch (enemy.aiType) {
    case 'aggressive':
      useSkill = hpPercent < 0.3 ? Math.random() < 0.8 : Math.random() < 0.5
      break
    case 'defensive':
      useSkill = hpPercent > 0.7 ? Math.random() < 0.3 : Math.random() < 0.5
      break
    case 'balanced':
    default:
      useSkill = hpPercent < 0.3 ? Math.random() < 0.7 : hpPercent > 0.7 ? Math.random() < 0.4 : Math.random() < 0.5
      break
  }

  if (useSkill) {
    const variance = 0.85 + Math.random() * 0.3
    result.damage = Math.floor(enemy.skillDamage * variance)
    result.logs.push(`${enemy.name} 施展杀招，对你造成 ${result.damage} 点伤害！`)
  } else {
    const variance = 0.9 + Math.random() * 0.2
    result.damage = Math.floor(enemy.attack * variance)
    result.logs.push(`${enemy.name} 发起普通攻击，对你造成 ${result.damage} 点伤害！`)
  }

  const reflect = getPlayerShieldReflect(player)
  if (reflect > 0) {
    result.reflectDamage = Math.floor(result.damage * reflect / 100)
    result.logs.push(`太极护盾反弹！${enemy.name} 受到 ${result.reflectDamage} 点反弹伤害！`)
  }

  return result
}

export function recoverQi(player: Player, amount: number = 8): number {
  const maxQi = getTotalMaxQi(player)
  const recovered = Math.min(amount, maxQi - player.qi)
  return recovered
}

export function addEquipment(player: Player, equipment: Equipment) {
  const existingIndex = player.equipment.findIndex(e => e.type === equipment.type)
  if (existingIndex >= 0) {
    player.equipment[existingIndex] = equipment
  } else {
    player.equipment.push(equipment)
  }
}
