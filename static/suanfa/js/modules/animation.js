/**
 * 动画控制模块 - 负责排序动画的执行、暂停、继续和速度控制
 * Animation Controller Module - Responsible for sorting animation execution, pause, resume, and speed control
 */

export const AnimationModule = {
    dataModule: null,
    rendererModule: null,
    algorithmsModule: null,
    
    generator: null,
    animationFrameId: null,
    timeoutId: null,
    isRunning: false,
    isPaused: false,
    
    onStart: null,
    onPause: null,
    onResume: null,
    onComplete: null,
    onStep: null,
    onReset: null,

    init(dataModule, rendererModule, algorithmsModule) {
        this.dataModule = dataModule;
        this.rendererModule = rendererModule;
        this.algorithmsModule = algorithmsModule;
        
        const state = this.dataModule.getState();
        this.isRunning = false;
        this.isPaused = state.isPaused || false;
        this.generator = null;
    },

    setCallbacks(callbacks = {}) {
        this.onStart = callbacks.onStart || null;
        this.onPause = callbacks.onPause || null;
        this.onResume = callbacks.onResume || null;
        this.onComplete = callbacks.onComplete || null;
        this.onStep = callbacks.onStep || null;
        this.onReset = callbacks.onReset || null;
    },

    start(algorithmType = null) {
        if (this.isRunning && !this.isPaused) {
            return false;
        }

        if (this.isPaused && this.isRunning && this.generator) {
            return this.resume();
        }

        const array = this.dataModule.getArray();
        const type = algorithmType || this.dataModule.getAlgorithm();

        if (array.length === 0) {
            return false;
        }

        const isResumingFromRefresh = this.isPaused && !this.isRunning;

        if (!isResumingFromRefresh) {
            this.dataModule.resetStats();
            this.dataModule.resetHighlighting();
        }

        this.dataModule.setRunning(true);
        this.dataModule.setPaused(false);
        this.dataModule.setSorted(false);

        this.isRunning = true;
        this.isPaused = false;

        this.generator = this.algorithmsModule.createGenerator(type, array);

        if (this.onStart) {
            this.onStart();
        }

        this.renderCurrentState(isResumingFromRefresh ? '继续排序...' : '开始排序...');

        this.nextStep();

        return true;
    },

    pause() {
        if (!this.isRunning || this.isPaused) {
            return false;
        }

        this.isPaused = true;
        this.dataModule.setPaused(true);

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.onPause) {
            this.onPause();
        }

        this.renderCurrentState('已暂停');

        return true;
    },

    resume() {
        if (!this.isPaused) {
            return false;
        }

        if (!this.isRunning || !this.generator) {
            return this.start();
        }

        this.isPaused = false;
        this.dataModule.setPaused(false);

        if (this.onResume) {
            this.onResume();
        }

        this.renderCurrentState('继续排序...');

        this.nextStep();

        return true;
    },

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.generator = null;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.dataModule.setRunning(false);
        this.dataModule.setPaused(false);
    },

    reset() {
        this.stop();

        this.dataModule.reset();

        if (this.onReset) {
            this.onReset();
        }

        this.renderCurrentState('准备就绪');

        return true;
    },

    nextStep() {
        if (!this.isRunning || this.isPaused || !this.generator) {
            return;
        }

        try {
            const result = this.generator.next();

            if (result.done) {
                this.complete();
                return;
            }

            const step = result.value;
            this.processStep(step);

        } catch (error) {
            console.error('Animation step error:', error);
            this.complete();
        }
    },

    processStep(step) {
        const highlighting = {
            comparing: step.comparing || [],
            sorted: step.sorted || [],
            pivot: step.pivot || [],
            swapping: step.swapping || []
        };

        if (step.array) {
            this.dataModule.setArray(step.array);
        }

        this.dataModule.setHighlighting(highlighting);

        switch (step.type) {
            case 'compare':
                this.dataModule.incrementComparisons();
                break;
            case 'swap':
                this.dataModule.incrementSwaps();
                break;
            case 'after-swap':
                break;
            case 'sorted':
                break;
            case 'pivot':
                break;
            case 'complete':
                this.dataModule.setSorted(true);
                break;
        }

        if (this.onStep) {
            this.onStep(step);
        }

        this.renderCurrentState(step.message || '');

        const delay = this.dataModule.getDelay();
        
        this.timeoutId = setTimeout(() => {
            this.nextStep();
        }, delay);
    },

    complete() {
        this.isRunning = false;
        this.dataModule.setRunning(false);
        this.dataModule.setSorted(true);

        const fullSortedIndices = Array.from(
            { length: this.dataModule.getArray().length },
            (_, i) => i
        );
        
        this.dataModule.setSortedIndices(fullSortedIndices);
        this.dataModule.resetHighlighting();
        this.dataModule.setSortedIndices(fullSortedIndices);

        if (this.onComplete) {
            this.onComplete();
        }

        this.renderCurrentState('排序完成!');

        this.generator = null;
    },

    renderCurrentState(message = '') {
        const array = this.dataModule.getArray();
        const highlighting = this.dataModule.getHighlighting();

        this.rendererModule.render(array, highlighting);

        if (message) {
            this.rendererModule.updateStatus(message);
        }
    },

    isAnimating() {
        return this.isRunning;
    },

    isAnimationPaused() {
        return this.isPaused;
    },

    setSpeed(speed) {
        this.dataModule.setSpeed(speed);
    },

    getSpeed() {
        return this.dataModule.getSpeed();
    },

    getSpeedLabel(speed) {
        if (speed <= 20) return '极慢';
        if (speed <= 40) return '慢速';
        if (speed <= 60) return '中速';
        if (speed <= 80) return '快速';
        return '极快';
    }
};

export default AnimationModule;