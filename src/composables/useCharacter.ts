
import { reactive } from 'vue'
import { CHARACTERS, GAME_CONFIG } from '../data/characters'
import type { CharacterConfig } from '../data/characters'

export type CharacterState = 'idle' | 'walk' | 'attack' | 'hurt' | 'knockdown' | 'special' | 'charge'

export interface PlayerState {
  characterId: string
  hp: number
  maxHp: number
  energy: number
  x: number
  y: number
  facing: 1 | -1
  state: CharacterState
  stateTimer: number
  attackFrame: number
  attackCooldown: number
  hurtTimer: number
  knockdownTimer: number
  chargeTimer: number
  specialHits: number
  specialHitTimer: number
  idleAnimFrame: number
  isBlocking: boolean
  hitDealt: boolean
}

export function createPlayerState(characterId: string, x: number, facing: 1 | -1): PlayerState {
  const char = CHARACTERS[characterId]
  return reactive<PlayerState>({
    characterId,
    hp: char.hp,
    maxHp: char.hp,
    energy: 0,
    x,
    y: 0,
    facing,
    state: 'idle',
    stateTimer: 0,
    attackFrame: 0,
    attackCooldown: 0,
    hurtTimer: 0,
    knockdownTimer: 0,
    chargeTimer: 0,
    specialHits: 0,
    specialHitTimer: 0,
    idleAnimFrame: 0,
    isBlocking: false,
    hitDealt: false
  })
}

export function getCharacter(id: string): CharacterConfig {
  return CHARACTERS[id]
}

export function isControlLocked(p: PlayerState): boolean {
  return p.state === 'attack' || p.state === 'hurt' ||
         p.state === 'knockdown' || p.state === 'special' ||
         p.state === 'charge' || p.attackCooldown > 0
}

export function canMove(p: PlayerState): boolean {
  return !isControlLocked(p) && p.knockdownTimer <= 0
}

export function canAttack(p: PlayerState): boolean {
  return p.state === 'idle' || p.state === 'walk' &&
         p.attackCooldown <= 0 &&
         p.knockdownTimer <= 0
}

export function canUseSpecial(p: PlayerState): boolean {
  return p.energy >= 100 && !isControlLocked(p) && p.knockdownTimer <= 0
}

export function isDefending(p: PlayerState, backKey: boolean): boolean {
  if (isControlLocked(p)) return false
  return backKey && (p.state === 'idle' || p.state === 'walk')
}
