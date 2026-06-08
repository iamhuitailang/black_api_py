export interface User {
  id: number
  username: string
  role: 'user' | 'admin'
  status?: number
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PinballConfig {
  id: number
  name: string
  type: GadgetType
  config_json: string
  position_json: string
  score: number
  sort_order: number
  is_active: number
  created_at: string
  updated_at: string
}

export type GadgetType = 'bumper' | 'accelerator' | 'rotator' | 'portal_in' | 'portal_out' | 'multiplier' | 'splitter'

export interface GameState {
  score: number
  combo: number
  ballsLeft: number
  highestCombo: number
  stateJson: string
}

export interface ScoreRecord {
  id: number
  user_id: number
  username: string
  score: number
  highest_combo: number
  level_id: number
  level_name: string
  balls_used: number
  created_at: string
}

export interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  type: string
  sort_order: number
  is_unlocked?: boolean
  progress?: string
  unlocked_at?: string
}

export type ComboMultipliers = [1, 2, 3, 5, 10]
