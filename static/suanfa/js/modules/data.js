/**
 * 数据模块 - 负责数组生成、存储和状态管理
 * Data Module - Responsible for array generation, storage, and state management
 */

const STORAGE_KEY = 'sorting_visualizer_state';

const DEFAULT_STATE = {
    array: [],
    arraySize: 30,
    currentAlgorithm: 'bubble',
    speed: 50,
    comparisons: 0,
    swaps: 0,
    isRunning: false,
    isPaused: false,
    isSorted: false,
    highlighting: {
        comparing: [],
        sorted: [],
        pivot: [],
        swapping: []
    }
};

export const DataModule = {
    state: { ...DEFAULT_STATE },

    init() {
        this.loadState();
        if (this.state.array.length === 0 || this.state.array.length !== this.state.arraySize) {
            this.generateRandomArray();
        }
        return this.state;
    },

    generateRandomArray(size = this.state.arraySize) {
        const minValue = 10;
        const maxValue = 350;
        const array = [];

        for (let i = 0; i < size; i++) {
            const value = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            array.push(value);
        }

        this.state.array = array;
        this.state.arraySize = size;
        this.state.comparisons = 0;
        this.state.swaps = 0;
        this.state.isSorted = false;
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.resetHighlighting();
        this.saveState();

        return array;
    },

    getArray() {
        return [...this.state.array];
    },

    setArray(array) {
        this.state.array = [...array];
        this.saveState();
    },

    getArraySize() {
        return this.state.arraySize;
    },

    setArraySize(size) {
        if (size >= 10 && size <= 50) {
            this.state.arraySize = size;
            this.generateRandomArray(size);
        }
    },

    getAlgorithm() {
        return this.state.currentAlgorithm;
    },

    setAlgorithm(algorithm) {
        this.state.currentAlgorithm = algorithm;
        this.saveState();
    },

    getSpeed() {
        return this.state.speed;
    },

    setSpeed(speed) {
        if (speed >= 1 && speed <= 100) {
            this.state.speed = speed;
            this.saveState();
        }
    },

    getComparisons() {
        return this.state.comparisons;
    },

    incrementComparisons() {
        this.state.comparisons++;
        this.saveState();
    },

    getSwaps() {
        return this.state.swaps;
    },

    incrementSwaps() {
        this.state.swaps++;
        this.saveState();
    },

    resetStats() {
        this.state.comparisons = 0;
        this.state.swaps = 0;
        this.saveState();
    },

    isRunning() {
        return this.state.isRunning;
    },

    setRunning(running) {
        this.state.isRunning = running;
        this.saveState();
    },

    isPaused() {
        return this.state.isPaused;
    },

    setPaused(paused) {
        this.state.isPaused = paused;
        this.saveState();
    },

    isSorted() {
        return this.state.isSorted;
    },

    setSorted(sorted) {
        this.state.isSorted = sorted;
        this.saveState();
    },

    getHighlighting() {
        return { ...this.state.highlighting };
    },

    setHighlighting(highlighting) {
        this.state.highlighting = { ...highlighting };
        this.saveState();
    },

    setComparing(indices) {
        this.state.highlighting.comparing = [...indices];
    },

    setSortedIndices(indices) {
        this.state.highlighting.sorted = [...indices];
    },

    setPivot(indices) {
        this.state.highlighting.pivot = [...indices];
    },

    setSwapping(indices) {
        this.state.highlighting.swapping = [...indices];
    },

    resetHighlighting() {
        this.state.highlighting = {
            comparing: [],
            sorted: [],
            pivot: [],
            swapping: []
        };
    },

    swap(i, j) {
        const temp = this.state.array[i];
        this.state.array[i] = this.state.array[j];
        this.state.array[j] = temp;
        this.incrementSwaps();
    },

    compare(i, j) {
        this.incrementComparisons();
        return this.state.array[i] - this.state.array[j];
    },

    checkSorted() {
        for (let i = 0; i < this.state.array.length - 1; i++) {
            if (this.state.array[i] > this.state.array[i + 1]) {
                return false;
            }
        }
        return true;
    },

    getDelay() {
        const minDelay = 1;
        const maxDelay = 500;
        const speed = this.state.speed;
        return Math.round(maxDelay - ((speed - 1) / 99) * (maxDelay - minDelay));
    },

    saveState() {
        try {
            const stateToSave = {
                array: this.state.array,
                arraySize: this.state.arraySize,
                currentAlgorithm: this.state.currentAlgorithm,
                speed: this.state.speed,
                comparisons: this.state.comparisons,
                swaps: this.state.swaps,
                isRunning: this.state.isRunning,
                isPaused: this.state.isPaused,
                isSorted: this.state.isSorted,
                highlighting: {
                    comparing: [...this.state.highlighting.comparing],
                    sorted: [...this.state.highlighting.sorted],
                    pivot: [...this.state.highlighting.pivot],
                    swapping: [...this.state.highlighting.swapping]
                }
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Error saving state to localStorage:', error);
        }
    },

    loadState() {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                
                const wasRunning = parsedState.isRunning;
                
                this.state = {
                    ...DEFAULT_STATE,
                    ...parsedState,
                    highlighting: parsedState.highlighting ? {
                        comparing: parsedState.highlighting.comparing || [],
                        sorted: parsedState.highlighting.sorted || [],
                        pivot: parsedState.highlighting.pivot || [],
                        swapping: parsedState.highlighting.swapping || []
                    } : {
                        comparing: [],
                        sorted: [],
                        pivot: [],
                        swapping: []
                    }
                };
                
                if (wasRunning) {
                    this.state.isRunning = false;
                    this.state.isPaused = true;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error loading state from localStorage:', error);
        }
        return false;
    },

    clearState() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            this.state = { ...DEFAULT_STATE };
            this.generateRandomArray();
        } catch (error) {
            console.error('Error clearing state:', error);
        }
    },

    getState() {
        return { ...this.state };
    },

    reset() {
        this.state.comparisons = 0;
        this.state.swaps = 0;
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isSorted = false;
        this.resetHighlighting();
        this.saveState();
    }
};

export default DataModule;