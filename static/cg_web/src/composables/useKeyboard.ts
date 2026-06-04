import { ref, onMounted, onUnmounted } from 'vue';
import type { KeyboardState } from '@/types/game';
import { KEY_BINDINGS } from '@/utils/constants';

export interface KeyPressEvent {
  code: string;
  key: string;
  timestamp: number;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface UseKeyboardOptions {
  autoUpdateStore?: boolean;
  preventDefaults?: boolean;
  enabled?: boolean;
}

const DEFAULT_KEYBOARD_STATE: KeyboardState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  attack: false,
  pause: false
};

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const { autoUpdateStore = false, preventDefaults = true, enabled = true } = options;

  const keys = ref<KeyboardState>({ ...DEFAULT_KEYBOARD_STATE });
  const isEnabled = ref(enabled);
  const lastKeyPress = ref<KeyPressEvent | null>(null);

  const pressedKeys = new Set<string>();
  const justPressedKeys = new Set<string>();
  const justReleasedKeys = new Set<string>();

  function isKeyPressed(action: keyof KeyboardState): boolean {
    return keys.value[action];
  }

  function wasJustPressed(action: keyof KeyboardState): boolean {
    const bindings = KEY_BINDINGS[action];
    return bindings.some(code => justPressedKeys.has(code));
  }

  function wasJustReleased(action: keyof KeyboardState): boolean {
    const bindings = KEY_BINDINGS[action];
    return bindings.some(code => justReleasedKeys.has(code));
  }

  function getActionForKeyCode(code: string): keyof KeyboardState | null {
    for (const [action, codes] of Object.entries(KEY_BINDINGS)) {
      if (codes.includes(code)) {
        return action as keyof KeyboardState;
      }
    }
    return null;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (!isEnabled.value) {
      return;
    }

    const action = getActionForKeyCode(event.code);
    if (action) {
      if (preventDefaults) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (!pressedKeys.has(event.code)) {
        justPressedKeys.add(event.code);
      }

      pressedKeys.add(event.code);
      keys.value[action] = true;

      lastKeyPress.value = {
        code: event.code,
        key: event.key,
        timestamp: Date.now(),
        preventDefault: () => event.preventDefault(),
        stopPropagation: () => event.stopPropagation()
      };

      if (autoUpdateStore) {
        import('@/stores/gameStore').then(({ useGameStore }) => {
          const gameStore = useGameStore();
          gameStore.updateKeys({ [action]: true });
        }).catch(() => {});
      }
    }
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (!isEnabled.value) {
      return;
    }

    const action = getActionForKeyCode(event.code);
    if (action) {
      if (preventDefaults) {
        event.preventDefault();
        event.stopPropagation();
      }

      pressedKeys.delete(event.code);
      justReleasedKeys.add(event.code);
      keys.value[action] = false;

      if (autoUpdateStore) {
        import('@/stores/gameStore').then(({ useGameStore }) => {
          const gameStore = useGameStore();
          gameStore.updateKeys({ [action]: false });
        }).catch(() => {});
      }
    }
  }

  function handleBlur(): void {
    pressedKeys.clear();
    justPressedKeys.clear();
    justReleasedKeys.clear();
    keys.value = { ...DEFAULT_KEYBOARD_STATE };

    if (autoUpdateStore) {
      import('@/stores/gameStore').then(({ useGameStore }) => {
        const gameStore = useGameStore();
        gameStore.resetKeys();
      }).catch(() => {});
    }
  }

  function endFrame(): void {
    justPressedKeys.clear();
    justReleasedKeys.clear();
  }

  function reset(): void {
    pressedKeys.clear();
    justPressedKeys.clear();
    justReleasedKeys.clear();
    keys.value = { ...DEFAULT_KEYBOARD_STATE };
    lastKeyPress.value = null;
  }

  function enable(): void {
    isEnabled.value = true;
  }

  function disable(): void {
    isEnabled.value = false;
    reset();
  }

  function getMovementDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (keys.value.left) x -= 1;
    if (keys.value.right) x += 1;
    if (keys.value.up) y -= 1;
    if (keys.value.down) y += 1;

    return { x, y };
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    reset();
  });

  return {
    keys,
    isEnabled,
    lastKeyPress,
    isKeyPressed,
    wasJustPressed,
    wasJustReleased,
    getActionForKeyCode,
    endFrame,
    reset,
    enable,
    disable,
    getMovementDirection
  };
}
