const SCORE_CALCULATOR = {
  calculateAudioScore(audioParams, equipment, genre) {
    let score = 50

    const idealVolume = this.getIdealVolume(genre)
    const volumeDiff = Math.abs(audioParams.volume - idealVolume)
    score -= Math.min(volumeDiff / 5, 15)

    const idealBass = this.getIdealBass(genre)
    const bassDiff = Math.abs(audioParams.bass - idealBass)
    score -= Math.min(bassDiff / 2, 10)

    const idealTreble = this.getIdealTreble(genre)
    const trebleDiff = Math.abs(audioParams.treble - idealTreble)
    score -= Math.min(trebleDiff / 2, 10)

    const idealReverb = this.getIdealReverb(genre)
    const reverbDiff = Math.abs(audioParams.reverb - idealReverb)
    score -= Math.min(reverbDiff / 10, 10)

    const equipmentBonus = this.calculateEquipmentBonus(equipment, 'audio')
    score += equipmentBonus

    return Math.max(0, Math.min(100, score))
  },

  calculateLightScore(lightParams, equipment, scene, genre) {
    let score = 50

    if (this.isLightMatchScene(scene, lightParams)) {
      score += 20
    }

    if (this.isLightMatchGenre(genre, lightParams)) {
      score += 15
    }

    const equipmentBonus = this.calculateEquipmentBonus(equipment, 'lighting')
    score += equipmentBonus

    const brightnessDiff = Math.abs(lightParams.brightness - 75)
    score -= Math.min(brightnessDiff / 10, 10)

    return Math.max(0, Math.min(100, score))
  },

  calculateLayoutScore(placedEquipment, stageLayout) {
    let score = 60

    const zones = stageLayout.zones
    const frontCount = this.countInZone(placedEquipment, zones.front)
    const backCount = this.countInZone(placedEquipment, zones.back)

    if (frontCount >= 1 && frontCount <= 4) {
      score += 10
    } else if (frontCount === 0 || frontCount > 6) {
      score -= 10
    }

    if (backCount >= 2) {
      score += 10
    }

    const hasSpeakers = this.hasEquipmentType(placedEquipment, 'audio')
    const hasLights = this.hasEquipmentType(placedEquipment, 'lighting')

    if (hasSpeakers && hasLights) {
      score += 15
    }

    const overlap = this.detectOverlap(placedEquipment)
    score -= overlap * 5

    return Math.max(0, Math.min(100, score))
  },

  calculateOverallScore(audioScore, lightScore, layoutScore, comboBonus = 0) {
    const weights = {
      audio: 0.35,
      light: 0.35,
      layout: 0.30
    }

    let total = audioScore * weights.audio + 
                lightScore * weights.light + 
                layoutScore * weights.layout

    total += comboBonus

    return Math.round(Math.max(0, Math.min(100, total)))
  },

  getPerformanceGrade(score) {
    if (score >= 90) return { grade: 'S', color: '#ffd700', text: '完美演出！' }
    if (score >= 80) return { grade: 'A', color: '#ff8c00', text: '非常棒！' }
    if (score >= 70) return { grade: 'B', color: '#4169e1', text: '不错哦！' }
    if (score >= 60) return { grade: 'C', color: '#32cd32', text: '继续加油！' }
    return { grade: 'D', color: '#808080', text: '需要改进' }
  },

  getIdealVolume(genre) {
    const map = {
      rock: 90, edm: 95, dj: 92, rap: 85,
      pop: 80, folk: 70, ballad: 65, classical: 60
    }
    return map[genre] || 75
  },

  getIdealBass(genre) {
    const map = {
      rock: 8, edm: 10, dj: 9, rap: 6,
      pop: 4, folk: 0, ballad: -2, classical: -4
    }
    return map[genre] || 0
  },

  getIdealTreble(genre) {
    const map = {
      classical: 6, folk: 4, ballad: 3, pop: 2,
      rap: 4, rock: 3, edm: 2, dj: 1
    }
    return map[genre] || 2
  },

  getIdealReverb(genre) {
    const map = {
      classical: 60, folk: 40, ballad: 50, pop: 30,
      rap: 20, rock: 40, edm: 25, dj: 35
    }
    return map[genre] || 30
  },

  isLightMatchScene(scene, params) {
    if (!scene) return false
    switch (scene.lightPattern) {
      case 'strobe':
        return params.pattern === 2 || params.pattern === 4
      case 'follow':
        return params.pattern === 0 || params.pattern === 1
      case 'diffuse':
        return params.pattern === 0 || params.pattern === 3
      case 'beam':
        return params.pattern === 3 || params.pattern === 4
      default:
        return true
    }
  },

  isLightMatchGenre(genre, params) {
    const genreHues = {
      rock: [0, 30], edm: [270, 330], dj: [300, 360],
      rap: [200, 240], pop: [330, 360], folk: [30, 60],
      ballad: [280, 320], classical: [60, 90]
    }
    const range = genreHues[genre]
    if (!range) return true
    return params.hue >= range[0] && params.hue <= range[1]
  },

  calculateEquipmentBonus(equipment, type) {
    let bonus = 0
    equipment.forEach(eq => {
      if (eq.type === type) {
        const quality = eq.quality || 70
        bonus += (quality - 70) / 20
        if (eq.level >= 2) bonus += 3
        if (eq.level >= 3) bonus += 5
        if (eq.level >= 4) bonus += 8
      }
    })
    return Math.min(bonus, 20)
  },

  countInZone(equipment, zone) {
    return equipment.filter(eq => {
      return eq.x >= zone.x && eq.x <= zone.x + zone.w &&
             eq.y >= zone.y && eq.y <= zone.y + zone.h
    }).length
  },

  hasEquipmentType(equipment, type) {
    return equipment.some(eq => eq.type === type)
  },

  detectOverlap(equipment) {
    let overlaps = 0
    for (let i = 0; i < equipment.length; i++) {
      for (let j = i + 1; j < equipment.length; j++) {
        const a = equipment[i]
        const b = equipment[j]
        const dx = Math.abs(a.x - b.x)
        const dy = Math.abs(a.y - b.y)
        if (dx < 10 && dy < 10) {
          overlaps++
        }
      }
    }
    return overlaps
  },

  checkUnlockConditions(score, equipment) {
    const unlocks = []
    const allEquipment = this.getAllEquipment()

    allEquipment.forEach(eq => {
      if (!eq.unlocked && !STORAGE.isEquipmentUnlocked(eq.id)) {
        if (score >= (eq.unlockScore || 9999)) {
          unlocks.push(eq)
        }
      }
    })

    return unlocks
  },

  getAllEquipment() {
    const all = []
    Object.values(window.GAME_DATA.EQUIPMENT_CATEGORIES).forEach(cat => {
      cat.items.forEach(item => {
        all.push({ ...item, category: cat.name })
      })
    })
    return all
  }
}

window.SCORE_CALCULATOR = SCORE_CALCULATOR
