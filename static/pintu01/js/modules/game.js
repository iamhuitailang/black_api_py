class PuzzleGame {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.emptyPosition = { row: 0, col: 0 };
        this.moves = 0;
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;
        this.isPlaying = false;
        this.isWon = false;
        this.hintMode = false;
        this.theme = 'cat';
        this.imageSource = null;
        this.isShuffled = false;
        this.listeners = {
            move: [],
            win: [],
            timer: [],
            reset: []
        };
    }

    init(size = 4, theme = 'cat') {
        this.size = size;
        this.theme = theme;
        this.moves = 0;
        this.elapsedTime = 0;
        this.isWon = false;
        this.hintMode = false;
        this.isShuffled = false;
        
        this.initializeGrid();
        this.stopTimer();
        this.isPlaying = false;
    }

    initializeGrid() {
        const total = this.size * this.size;
        this.grid = [];
        
        for (let i = 0; i < total; i++) {
            this.grid.push(i);
        }
        
        this.emptyPosition = {
            row: this.size - 1,
            col: this.size - 1
        };
    }

    shuffle() {
        let inversions;
        do {
            this.knuthShuffle();
            inversions = this.countInversions();
        } while (!this.isSolvable(inversions));
        
        const emptyIndex = this.grid.indexOf(this.size * this.size - 1);
        this.emptyPosition = {
            row: Math.floor(emptyIndex / this.size),
            col: emptyIndex % this.size
        };
        
        this.moves = 0;
        this.elapsedTime = 0;
        this.isWon = false;
        this.isShuffled = true;
        this.isPlaying = true;
        this.startTimer();
        this.notify('reset');
    }

    knuthShuffle() {
        const n = this.grid.length;
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.grid[i], this.grid[j]] = [this.grid[j], this.grid[i]];
        }
    }

    countInversions() {
        let inversions = 0;
        const emptyValue = this.size * this.size - 1;
        
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === emptyValue) continue;
            
            for (let j = i + 1; j < this.grid.length; j++) {
                if (this.grid[j] !== emptyValue && this.grid[i] > this.grid[j]) {
                    inversions++;
                }
            }
        }
        
        return inversions;
    }

    isSolvable(inversions) {
        if (this.size % 2 === 1) {
            return inversions % 2 === 0;
        } else {
            const emptyRowFromBottom = this.size - this.emptyPosition.row;
            return (inversions + emptyRowFromBottom) % 2 === 1;
        }
    }

    canMove(row, col) {
        const { row: emptyRow, col: emptyCol } = this.emptyPosition;
        
        return (
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow)
        );
    }

    moveTile(row, col) {
        if (this.isWon || !this.isPlaying) return false;
        
        if (!this.canMove(row, col)) {
            return false;
        }
        
        const tileIndex = row * this.size + col;
        const emptyIndex = this.emptyPosition.row * this.size + this.emptyPosition.col;
        
        [this.grid[tileIndex], this.grid[emptyIndex]] = [this.grid[emptyIndex], this.grid[tileIndex]];
        
        this.emptyPosition = { row, col };
        this.moves++;
        
        this.notify('move', { moves: this.moves });
        
        if (this.checkWin()) {
            this.handleWin();
        }
        
        return true;
    }

    checkWin() {
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] !== i) {
                return false;
            }
        }
        return true;
    }

    handleWin() {
        this.isWon = true;
        this.stopTimer();
        this.isPlaying = false;
        
        this.notify('win', {
            moves: this.moves,
            time: this.elapsedTime
        });
    }

    startTimer() {
        this.stopTimer();
        this.startTime = Date.now() - this.elapsedTime * 1000;
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            this.notify('timer', { time: this.elapsedTime });
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    reset() {
        this.stopTimer();
        this.moves = 0;
        this.elapsedTime = 0;
        this.isWon = false;
        this.isPlaying = false;
        this.hintMode = false;
        this.isShuffled = false;
        
        this.initializeGrid();
        this.notify('reset');
    }

    toggleHint() {
        this.hintMode = !this.hintMode;
        return this.hintMode;
    }

    getTileAt(row, col) {
        return this.grid[row * this.size + col];
    }

    getPosition(tileValue) {
        const index = this.grid.indexOf(tileValue);
        return {
            row: Math.floor(index / this.size),
            col: index % this.size
        };
    }

    isCorrectPosition(row, col) {
        const index = row * this.size + col;
        return this.grid[index] === index;
    }

    isInCorrectRow(row, col) {
        const value = this.grid[row * this.size + col];
        const correctRow = Math.floor(value / this.size);
        return row === correctRow;
    }

    isInCorrectCol(row, col) {
        const value = this.grid[row * this.size + col];
        const correctCol = value % this.size;
        return col === correctCol;
    }

    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    notify(event, data = {}) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    getState() {
        return {
            size: this.size,
            grid: [...this.grid],
            emptyPosition: { ...this.emptyPosition },
            moves: this.moves,
            elapsedTime: this.elapsedTime,
            isPlaying: this.isPlaying,
            isWon: this.isWon,
            hintMode: this.hintMode,
            theme: this.theme,
            imageSource: this.imageSource,
            isShuffled: this.isShuffled
        };
    }

    loadState(state) {
        if (!state) return false;
        
        this.size = state.size !== undefined ? state.size : 4;
        this.grid = state.grid ? [...state.grid] : [];
        this.emptyPosition = state.emptyPosition ? { ...state.emptyPosition } : { row: 0, col: 0 };
        this.moves = state.moves !== undefined ? state.moves : 0;
        this.elapsedTime = state.elapsedTime !== undefined ? state.elapsedTime : 0;
        this.isPlaying = state.isPlaying !== undefined ? state.isPlaying : false;
        this.isWon = state.isWon !== undefined ? state.isWon : false;
        this.hintMode = state.hintMode !== undefined ? state.hintMode : false;
        this.theme = state.theme !== undefined ? state.theme : 'cat';
        this.imageSource = state.imageSource !== undefined ? state.imageSource : null;
        this.isShuffled = state.isShuffled !== undefined ? state.isShuffled : false;
        
        this.stopTimer();
        
        if (this.isPlaying && !this.isWon) {
            this.startTimer();
        }
        
        return true;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

export const puzzleGame = new PuzzleGame();
export default puzzleGame;
