
import { ref, onMounted, onUnmounted } from 'vue'

export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  attack: boolean
  special: boolean
}

export function useInput() {
  const p1Input = ref<InputState>({
    up: false, down: false, left: false, right: false, attack: false, special: false
  })
  const p2Input = ref<InputState>({
    up: false, down: false, left: false, right: false, attack: false, special: false
  })

  const lastInputTime = ref(Date.now())

  function handleKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase()
    let handled = true

    switch (key) {
      case 'w':
        p1Input.value.up = true
        break
      case 's':
        p1Input.value.down = true
        break
      case 'a':
        p1Input.value.left = true
        break
      case 'd':
        p1Input.value.right = true
        break
      case 'j':
        p1Input.value.attack = true
        break
      case 'k':
        p1Input.value.special = true
        break
      case 'arrowup':
        p2Input.value.up = true
        break
      case 'arrowdown':
        p2Input.value.down = true
        break
      case 'arrowleft':
        p2Input.value.left = true
        break
      case 'arrowright':
        p2Input.value.right = true
        break
      case '1':
        p2Input.value.attack = true
        break
      case '2':
        p2Input.value.special = true
        break
      default:
        handled = false
    }

    if (handled) {
      e.preventDefault()
      lastInputTime.value = Date.now()
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase()
    let handled = true

    switch (key) {
      case 'w':
        p1Input.value.up = false
        break
      case 's':
        p1Input.value.down = false
        break
      case 'a':
        p1Input.value.left = false
        break
      case 'd':
        p1Input.value.right = false
        break
      case 'j':
        p1Input.value.attack = false
        break
      case 'k':
        p1Input.value.special = false
        break
      case 'arrowup':
        p2Input.value.up = false
        break
      case 'arrowdown':
        p2Input.value.down = false
        break
      case 'arrowleft':
        p2Input.value.left = false
        break
      case 'arrowright':
        p2Input.value.right = false
        break
      case '1':
        p2Input.value.attack = false
        break
      case '2':
        p2Input.value.special = false
        break
      default:
        handled = false
    }

    if (handled) {
      e.preventDefault()
      lastInputTime.value = Date.now()
    }
  }

  function resetInput() {
    p1Input.value = { up: false, down: false, left: false, right: false, attack: false, special: false }
    p2Input.value = { up: false, down: false, left: false, right: false, attack: false, special: false }
  }

  function consumeP1Attack() {
    const val = p1Input.value.attack
    p1Input.value.attack = false
    return val
  }

  function consumeP1Special() {
    const val = p1Input.value.special
    p1Input.value.special = false
    return val
  }

  function consumeP2Attack() {
    const val = p2Input.value.attack
    p2Input.value.attack = false
    return val
  }

  function consumeP2Special() {
    const val = p2Input.value.special
    p2Input.value.special = false
    return val
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return {
    p1Input,
    p2Input,
    lastInputTime,
    resetInput,
    consumeP1Attack,
    consumeP1Special,
    consumeP2Attack,
    consumeP2Special
  }
}
