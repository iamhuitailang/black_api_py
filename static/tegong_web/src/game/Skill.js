export const SKILLS = {
  shadow_strike: {
    id: 'shadow_strike',
    name: '暗影突袭',
    description: '快速冲向敌人并造成高额伤害',
    energyCost: 20,
    damage: 50,
    cooldown: 3000,
    range: 150,
    icon: '⚔️'
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: '烟雾弹',
    description: '释放烟雾，短暂隐身并脱离战斗',
    energyCost: 30,
    damage: 0,
    cooldown: 8000,
    duration: 3000,
    icon: '💨'
  },
  throwing_knife: {
    id: 'throwing_knife',
    name: '飞刀',
    description: '投掷飞刀远程攻击敌人',
    energyCost: 15,
    damage: 30,
    cooldown: 2000,
    range: 400,
    icon: '🗡️'
  },
  healing_breath: {
    id: 'healing_breath',
    name: '疗伤功法',
    description: '运功恢复生命值',
    energyCost: 40,
    damage: 0,
    cooldown: 10000,
    healAmount: 40,
    icon: '💚'
  },
  dragon_fury: {
    id: 'dragon_fury',
    name: '龙怒',
    description: '释放龙形真气，对周围敌人造成大量伤害',
    energyCost: 50,
    damage: 80,
    cooldown: 15000,
    range: 200,
    icon: '🐉'
  }
}

export class SkillSystem {
  constructor(learnedSkills = []) {
    this.skills = {}
    this.activeEffects = []
    
    learnedSkills.forEach(skillId => {
      if (SKILLS[skillId]) {
        this.skills[skillId] = {
          ...SKILLS[skillId],
          currentCooldown: 0
        }
      }
    })
  }

  learnSkill(skillId) {
    if (SKILLS[skillId] && !this.skills[skillId]) {
      this.skills[skillId] = {
        ...SKILLS[skillId],
        currentCooldown: 0
      }
      return true
    }
    return false
  }

  canUseSkill(skillId, currentEnergy) {
    const skill = this.skills[skillId]
    return skill && skill.currentCooldown <= 0 && currentEnergy >= skill.energyCost
  }

  useSkill(skillId, player, enemies) {
    const skill = this.skills[skillId]
    if (!skill || skill.currentCooldown > 0) return null

    skill.currentCooldown = skill.cooldown

    const result = {
      skillId,
      damage: skill.damage,
      energyCost: skill.energyCost,
      effects: []
    }

    switch (skillId) {
      case 'shadow_strike':
        result.effects.push({ type: 'dash', range: skill.range })
        break
      case 'smoke_bomb':
        result.effects.push({ type: 'invisible', duration: skill.duration })
        break
      case 'throwing_knife':
        result.effects.push({ type: 'projectile', range: skill.range })
        break
      case 'healing_breath':
        result.effects.push({ type: 'heal', amount: skill.healAmount })
        break
      case 'dragon_fury':
        result.effects.push({ type: 'aoe', range: skill.range })
        break
    }

    return result
  }

  update(deltaTime) {
    Object.values(this.skills).forEach(skill => {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown = Math.max(0, skill.currentCooldown - deltaTime)
      }
    })

    this.activeEffects = this.activeEffects.filter(effect => {
      effect.remaining -= deltaTime
      return effect.remaining > 0
    })
  }

  getSkillCooldownPercent(skillId) {
    const skill = this.skills[skillId]
    if (!skill) return 0
    return skill.currentCooldown / skill.cooldown
  }

  getLearnedSkills() {
    return Object.values(this.skills)
  }
}
