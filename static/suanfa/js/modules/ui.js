/**
 * UI交互模块 - 负责处理用户交互事件和UI状态更新
 * UI Interaction Module - Responsible for handling user interaction events and UI state updates
 */

export const UIModule = {
    dataModule: null,
    animationModule: null,
    rendererModule: null,
    algorithmsModule: null,

    elements: {},

    init(dataModule, animationModule, rendererModule, algorithmsModule) {
        this.dataModule = dataModule;
        this.animationModule = animationModule;
        this.rendererModule = rendererModule;
        this.algorithmsModule = algorithmsModule;

        this.cacheElements();
        this.bindEvents();
        this.initUIState();
    },

    cacheElements() {
        this.elements = {
            canvas: document.getElementById('sortCanvas'),
            arraySize: document.getElementById('arraySize'),
            arraySizeValue: document.getElementById('arraySizeValue'),
            randomizeBtn: document.getElementById('randomizeBtn'),
            algorithmRadios: document.querySelectorAll('input[name="algorithm"]'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            speedRange: document.getElementById('speedRange'),
            speedValue: document.getElementById('speedValue'),
            comparisons: document.getElementById('comparisons'),
            swaps: document.getElementById('swaps'),
            currentStatus: document.getElementById('currentStatus'),
            statusText: document.getElementById('statusText')
        };
    },

    bindEvents() {
        this.elements.arraySize.addEventListener('input', (e) => {
            this.handleArraySizeChange(parseInt(e.target.value));
        });

        this.elements.randomizeBtn.addEventListener('click', () => {
            this.handleRandomize();
        });

        this.elements.algorithmRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleAlgorithmChange(e.target.value);
            });
        });

        this.elements.startBtn.addEventListener('click', () => {
            this.handleStart();
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            this.handlePauseResume();
        });

        this.elements.resetBtn.addEventListener('click', () => {
            this.handleReset();
        });

        this.elements.speedRange.addEventListener('input', (e) => {
            this.handleSpeedChange(parseInt(e.target.value));
        });

        this.animationModule.setCallbacks({
            onStart: () => this.onAnimationStart(),
            onPause: () => this.onAnimationPause(),
            onResume: () => this.onAnimationResume(),
            onComplete: () => this.onAnimationComplete(),
            onStep: (step) => this.onAnimationStep(step),
            onReset: () => this.onAnimationReset()
        });
    },

    initUIState() {
        const state = this.dataModule.getState();

        this.elements.arraySize.value = state.arraySize;
        this.elements.arraySizeValue.textContent = state.arraySize;

        const selectedRadio = document.querySelector(`input[name="algorithm"][value="${state.currentAlgorithm}"]`);
        if (selectedRadio) {
            selectedRadio.checked = true;
        }

        this.elements.speedRange.value = state.speed;
        this.elements.speedValue.textContent = this.animationModule.getSpeedLabel(state.speed);

        this.updateStats();

        const array = this.dataModule.getArray();
        const highlighting = this.dataModule.getHighlighting();
        this.rendererModule.render(array, highlighting);

        if (state.isPaused && !state.isSorted) {
            this.updateStatus('paused');
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            this.elements.pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> 继续';
            this.elements.randomizeBtn.disabled = true;
            this.elements.arraySize.disabled = true;
            this.elements.algorithmRadios.forEach(radio => {
                radio.disabled = true;
            });
        } else if (state.isSorted) {
            this.updateStatus('sorted');
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = true;
        } else {
            this.updateStatus('ready');
        }
    },

    handleArraySizeChange(size) {
        if (this.animationModule.isAnimating()) {
            return;
        }

        this.elements.arraySizeValue.textContent = size;
        this.dataModule.setArraySize(size);
        
        this.updateStats();
        this.updateStatus('ready');
        
        const array = this.dataModule.getArray();
        this.rendererModule.render(array, this.dataModule.getHighlighting());
    },

    handleRandomize() {
        if (this.animationModule.isAnimating()) {
            return;
        }

        const size = parseInt(this.elements.arraySize.value);
        this.dataModule.generateRandomArray(size);
        
        this.updateStats();
        this.updateStatus('ready');
        
        const array = this.dataModule.getArray();
        this.rendererModule.render(array, this.dataModule.getHighlighting());
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
    },

    handleAlgorithmChange(algorithm) {
        if (this.animationModule.isAnimating()) {
            const currentAlgorithm = this.dataModule.getAlgorithm();
            const selectedRadio = document.querySelector(`input[name="algorithm"][value="${currentAlgorithm}"]`);
            if (selectedRadio) {
                selectedRadio.checked = true;
            }
            return;
        }

        this.dataModule.setAlgorithm(algorithm);
    },

    handleStart() {
        if (this.animationModule.isAnimating() && !this.animationModule.isAnimationPaused()) {
            return;
        }

        const algorithm = this.dataModule.getAlgorithm();
        const success = this.animationModule.start(algorithm);
        
        if (success) {
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            this.elements.randomizeBtn.disabled = true;
            this.elements.arraySize.disabled = true;
            this.elements.algorithmRadios.forEach(radio => {
                radio.disabled = true;
            });
        }
    },

    handlePauseResume() {
        if (!this.animationModule.isAnimating()) {
            return;
        }

        if (this.animationModule.isAnimationPaused()) {
            this.animationModule.resume();
        } else {
            this.animationModule.pause();
        }
    },

    handleReset() {
        this.animationModule.reset();
        
        this.elements.startBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
        this.elements.randomizeBtn.disabled = false;
        this.elements.arraySize.disabled = false;
        this.elements.algorithmRadios.forEach(radio => {
            radio.disabled = false;
        });
        
        this.updateStats();
        this.updateStatus('ready');
    },

    handleSpeedChange(speed) {
        this.animationModule.setSpeed(speed);
        this.elements.speedValue.textContent = this.animationModule.getSpeedLabel(speed);
    },

    onAnimationStart() {
        this.updateStatus('running');
        this.elements.pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
    },

    onAnimationPause() {
        this.updateStatus('paused');
        this.elements.pauseBtn.innerHTML = '<span class="btn-icon">▶️</span> 继续';
    },

    onAnimationResume() {
        this.updateStatus('running');
        this.elements.pauseBtn.innerHTML = '<span class="btn-icon">⏸️</span> 暂停';
    },

    onAnimationComplete() {
        this.updateStatus('sorted');
        
        this.elements.startBtn.disabled = true;
        this.elements.pauseBtn.disabled = true;
        this.elements.randomizeBtn.disabled = false;
        this.elements.arraySize.disabled = false;
        this.elements.algorithmRadios.forEach(radio => {
            radio.disabled = false;
        });
    },

    onAnimationStep(step) {
        this.updateStats();
    },

    onAnimationReset() {
        this.updateStats();
        this.updateStatus('ready');
    },

    updateStats() {
        const comparisons = this.dataModule.getComparisons();
        const swaps = this.dataModule.getSwaps();

        this.elements.comparisons.textContent = comparisons.toLocaleString();
        this.elements.swaps.textContent = swaps.toLocaleString();
    },

    updateStatus(status) {
        const statusElement = this.elements.currentStatus;
        const statusTextElement = this.elements.statusText;

        statusElement.className = 'stat-value';

        let statusText = '';
        switch (status) {
            case 'ready':
                statusElement.classList.add('status-ready');
                statusText = '准备就绪';
                break;
            case 'running':
                statusElement.classList.add('status-running');
                statusText = '排序中...';
                break;
            case 'paused':
                statusElement.classList.add('status-paused');
                statusText = '已暂停';
                break;
            case 'sorted':
                statusElement.classList.add('status-sorted');
                statusText = '已完成';
                break;
            default:
                statusElement.classList.add('status-ready');
                statusText = '准备就绪';
        }

        statusElement.textContent = statusText;
        if (statusTextElement) {
            statusTextElement.textContent = statusText;
        }
    },

    refresh() {
        const array = this.dataModule.getArray();
        const highlighting = this.dataModule.getHighlighting();
        this.rendererModule.render(array, highlighting);
        this.updateStats();
    },

    setControlsEnabled(enabled) {
        this.elements.startBtn.disabled = !enabled;
        this.elements.randomizeBtn.disabled = !enabled;
        this.elements.arraySize.disabled = !enabled;
        this.elements.algorithmRadios.forEach(radio => {
            radio.disabled = !enabled;
        });
    },

    getState() {
        return {
            arraySize: parseInt(this.elements.arraySize.value),
            algorithm: document.querySelector('input[name="algorithm"]:checked')?.value,
            speed: parseInt(this.elements.speedRange.value)
        };
    }
};

export default UIModule;