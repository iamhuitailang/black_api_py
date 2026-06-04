import { ref, onMounted, onUnmounted } from 'vue';

export interface GameLoopCallbacks {
  onUpdate?: (deltaTime: number, elapsedTime: number) => void;
  onRender?: (alpha: number) => void;
  onFixedUpdate?: (fixedDeltaTime: number) => void;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface GameLoopOptions {
  fixedFps?: number;
  maxFrameTime?: number;
  autoStart?: boolean;
  useRAF?: boolean;
}

const DEFAULT_OPTIONS: Required<GameLoopOptions> = {
  fixedFps: 60,
  maxFrameTime: 250,
  autoStart: false,
  useRAF: true
};

export function useGameLoop(callbacks: GameLoopCallbacks = {}, options: GameLoopOptions = {}) {
  const config: Required<GameLoopOptions> = { ...DEFAULT_OPTIONS, ...options };

  const isRunning = ref(false);
  const isPaused = ref(false);
  const fps = ref(0);
  const frameCount = ref(0);
  const elapsedTime = ref(0);
  const deltaTime = ref(0);

  let animationFrameId: number | null = null;
  let timeoutId: number | null = null;
  let lastTime = 0;
  let accumulator = 0;
  let fpsAccumulator = 0;
  let fpsFrameCount = 0;
  const fixedDeltaTime = 1000 / config.fixedFps;

  function getTime(): number {
    return performance.now();
  }

  function frame(currentTime: number): void {
    if (!isRunning.value) {
      return;
    }

    let frameDeltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (frameDeltaTime > config.maxFrameTime) {
      frameDeltaTime = config.maxFrameTime;
    }

    deltaTime.value = frameDeltaTime;
    elapsedTime.value += frameDeltaTime;

    fpsAccumulator += frameDeltaTime;
    fpsFrameCount++;
    if (fpsAccumulator >= 1000) {
      fps.value = fpsFrameCount;
      fpsAccumulator = 0;
      fpsFrameCount = 0;
    }

    if (!isPaused.value) {
      accumulator += frameDeltaTime;

      while (accumulator >= fixedDeltaTime) {
        if (callbacks.onFixedUpdate) {
          callbacks.onFixedUpdate(fixedDeltaTime / 1000);
        }
        accumulator -= fixedDeltaTime;
      }

      if (callbacks.onUpdate) {
        callbacks.onUpdate(frameDeltaTime / 1000, elapsedTime.value / 1000);
      }

      if (callbacks.onRender) {
        const alpha = accumulator / fixedDeltaTime;
        callbacks.onRender(alpha);
      }
    }

    frameCount.value++;

    if (config.useRAF) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      timeoutId = window.setTimeout(() => frame(getTime()), 1000 / 60);
    }
  }

  function start(): void {
    if (isRunning.value) {
      return;
    }

    isRunning.value = true;
    isPaused.value = false;
    lastTime = getTime();
    accumulator = 0;
    fpsAccumulator = 0;
    fpsFrameCount = 0;
    frameCount.value = 0;

    if (callbacks.onStart) {
      callbacks.onStart();
    }

    if (config.useRAF) {
      animationFrameId = requestAnimationFrame(frame);
    } else {
      timeoutId = window.setTimeout(() => frame(getTime()), 1000 / 60);
    }
  }

  function stop(): void {
    if (!isRunning.value) {
      return;
    }

    isRunning.value = false;
    isPaused.value = false;

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (callbacks.onStop) {
      callbacks.onStop();
    }
  }

  function pause(): void {
    if (!isRunning.value || isPaused.value) {
      return;
    }

    isPaused.value = true;

    if (callbacks.onPause) {
      callbacks.onPause();
    }
  }

  function resume(): void {
    if (!isRunning.value || !isPaused.value) {
      return;
    }

    isPaused.value = false;
    lastTime = getTime();

    if (callbacks.onResume) {
      callbacks.onResume();
    }
  }

  function togglePause(): void {
    if (isPaused.value) {
      resume();
    } else {
      pause();
    }
  }

  function reset(): void {
    stop();
    frameCount.value = 0;
    elapsedTime.value = 0;
    deltaTime.value = 0;
    fps.value = 0;
    accumulator = 0;
    fpsAccumulator = 0;
    fpsFrameCount = 0;
  }

  onMounted(() => {
    if (config.autoStart) {
      start();
    }
  });

  onUnmounted(() => {
    stop();
  });

  return {
    isRunning,
    isPaused,
    fps,
    frameCount,
    elapsedTime,
    deltaTime,
    start,
    stop,
    pause,
    resume,
    togglePause,
    reset
  };
}
