export class TimeSystem {
  private static instance: TimeSystem
  MARS_DAY_SECONDS = 88642.663
  totalSeconds = 0
  marsDay = 1
  marsHour = 6
  dayProgress = 0
  sunIntensity = 0.5
  isNight = false
  private lastAutoSave = 0

  static getInstance(): TimeSystem {
    if (!TimeSystem.instance) {
      TimeSystem.instance = new TimeSystem()
    }
    return TimeSystem.instance
  }

  update(deltaTime: number): void {
    this.totalSeconds += deltaTime
    this.lastAutoSave += deltaTime

    const dayProgress = (this.totalSeconds % this.MARS_DAY_SECONDS) / this.MARS_DAY_SECONDS
    this.dayProgress = dayProgress
    this.marsDay = Math.floor(this.totalSeconds / this.MARS_DAY_SECONDS) + 1
    this.marsHour = dayProgress * 24.6597

    this.updateDayNightCycle(dayProgress)
  }

  private updateDayNightCycle(dayProgress: number): void {
    const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2
    this.sunIntensity = Math.max(0, Math.sin(sunAngle))
    this.isNight = dayProgress < 0.25 || dayProgress > 0.75
  }

  getTimeString(): string {
    const hour = Math.floor(this.marsHour)
    const minute = Math.floor((this.marsHour - hour) * 60)
    return `索尔 ${this.marsDay} · ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  getSkyColor(): { r: number; g: number; b: number } {
    if (this.dayProgress < 0.25) {
      return { r: 0.05, g: 0.05, b: 0.15 }
    } else if (this.dayProgress < 0.3) {
      const t = (this.dayProgress - 0.25) / 0.05
      return {
        r: 0.05 + 0.45 * t,
        g: 0.05 + 0.2 * t,
        b: 0.15 + 0.1 * t
      }
    } else if (this.dayProgress < 0.7) {
      return { r: 0.5, g: 0.25, b: 0.25 }
    } else if (this.dayProgress < 0.75) {
      const t = (this.dayProgress - 0.7) / 0.05
      return {
        r: 0.5 - 0.45 * t,
        g: 0.25 - 0.2 * t,
        b: 0.25 - 0.1 * t
      }
    } else {
      return { r: 0.05, g: 0.05, b: 0.15 }
    }
  }

  shouldAutoSave(): boolean {
    if (this.lastAutoSave >= 30) {
      this.lastAutoSave = 0
      return true
    }
    return false
  }

  reset(): void {
    this.totalSeconds = 0
    this.marsDay = 1
    this.marsHour = 6
    this.dayProgress = 0
    this.lastAutoSave = 0
  }

  loadFromSave(data: { totalSeconds: number }): void {
    this.totalSeconds = data.totalSeconds
    this.lastAutoSave = 0
  }

  getSaveData(): { totalSeconds: number } {
    return { totalSeconds: this.totalSeconds }
  }
}

export const timeSystem = TimeSystem.getInstance()
