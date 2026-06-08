import Matter from 'matter-js'

export interface GadgetConfig {
  id: number
  name: string
  type: string
  config: Record<string, any>
  position: { x: number; y: number; angle?: number }
  score: number
}

export interface BallState {
  id: string
  position: { x: number; y: number }
  velocity: { x: number; y: number }
  angle: number
  angularVelocity: number
}

export interface GameEngineState {
  balls: BallState[]
  score: number
  combo: number
  ballsLeft: number
  highestCombo: number
  isPlaying: boolean
  springPower: number
  isCharging: boolean
  activeEffects: {
    multiplier: boolean
    multiplierEndTime: number
    splitter: boolean
    splitterEndTime: number
  }
  triggeredGadgetTypes: string[]
  launchCount: number
}

export interface EngineCallbacks {
  onScore: (score: number, gadgetType: string, x: number, y: number) => void
  onCombo: (combo: number, multiplier: number) => void
  onBallLost: () => void
  onGameOver: () => void
  onMultiplier: (duration: number) => void
  onSplitter: (duration: number) => void
}
