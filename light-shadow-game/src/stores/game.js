import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    currentLevel: 1,
    unlockedLevels: [1],
    completedLevels: [],
    highScores: {},
    totalLightParticles: 0,
    soundEnabled: true,
    character: {
      name: '小光狐',
      emoji: '🦊',
      color: '#FF8C42'
    },
    availableCharacters: [
      { id: 'fox', name: '小光狐', emoji: '🦊', color: '#FF8C42', unlocked: true },
      { id: 'rabbit', name: '影月兔', emoji: '🐰', color: '#B8A9C9', unlocked: false },
      { id: 'cat', name: '星眸猫', emoji: '🐱', color: '#5DADE2', unlocked: false }
    ]
  }),

  getters: {
    isLevelUnlocked: (state) => (levelId) => state.unlockedLevels.includes(levelId),
    isLevelCompleted: (state) => (levelId) => state.completedLevels.includes(levelId),
    getScore: (state) => (levelId) => state.highScores[levelId] || 0
  },

  actions: {
    completeLevel(levelId, score, particles) {
      if (!this.completedLevels.includes(levelId)) {
        this.completedLevels.push(levelId)
        const nextLevel = levelId + 1
        if (nextLevel <= 3 && !this.unlockedLevels.includes(nextLevel)) {
          this.unlockedLevels.push(nextLevel)
        }
      }
      if (!this.highScores[levelId] || score > this.highScores[levelId]) {
        this.highScores[levelId] = score
      }
      this.totalLightParticles += particles
      
      if (this.totalLightParticles >= 50) {
        const rabbit = this.availableCharacters.find(c => c.id === 'rabbit')
        if (rabbit) rabbit.unlocked = true
      }
      if (this.totalLightParticles >= 150) {
        const cat = this.availableCharacters.find(c => c.id === 'cat')
        if (cat) cat.unlocked = true
      }
    },

    setCurrentLevel(levelId) {
      this.currentLevel = levelId
    },

    selectCharacter(characterId) {
      const char = this.availableCharacters.find(c => c.id === characterId)
      if (char && char.unlocked) {
        this.character = { name: char.name, emoji: char.emoji, color: char.color }
      }
    },

    toggleSound() {
      this.soundEnabled = !this.soundEnabled
    },

    resetProgress() {
      this.currentLevel = 1
      this.unlockedLevels = [1]
      this.completedLevels = []
      this.highScores = {}
      this.totalLightParticles = 0
      this.availableCharacters.forEach(c => {
        c.unlocked = c.id === 'fox'
      })
      this.character = { name: '小光狐', emoji: '🦊', color: '#FF8C42' }
    }
  }
})
