import { PIECE_CONFIG, BOARD_CONFIG, GAME_STATE, LAYOUTS, PIECE_TYPES } from './data.js';

export class Game {
    constructor() {
        this.pieces = [];
        this.selectedPieceId = null;
        this.steps = 0;
        this.elapsedTime = 0;
        this.history = [];
        this.maxHistory = 10;
        this.state = GAME_STATE.IDLE;
        this.currentLayout = 'hengdaolima';
    }

    init(layoutId = 'hengdaolima') {
        this.currentLayout = layoutId;
        const layout = LAYOUTS[layoutId];
        if (!layout) return false;

        this.pieces = layout.pieces.map(p => ({
            ...p,
            width: PIECE_CONFIG[p.type].width,
            height: PIECE_CONFIG[p.type].height,
            movable: PIECE_CONFIG[p.type].movable !== false
        }));

        this.steps = 0;
        this.elapsedTime = 0;
        this.history = [];
        this.selectedPieceId = null;
        this.state = GAME_STATE.IDLE;

        return true;
    }

    start() {
        if (this.state === GAME_STATE.IDLE) {
            this.state = GAME_STATE.PLAYING;
        }
    }

    pause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
        }
    }

    resume() {
        if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
        }
    }

    isPlaying() {
        return this.state === GAME_STATE.PLAYING;
    }

    getPieceAt(x, y) {
        return this.pieces.find(p =>
            x >= p.x && x < p.x + p.width &&
            y >= p.y && y < p.y + p.height
        );
    }

    getPieceById(id) {
        return this.pieces.find(p => p.id === id);
    }

    selectPiece(id) {
        const piece = this.getPieceById(id);
        if (piece && piece.movable) {
            this.selectedPieceId = id;
            return true;
        }
        this.selectedPieceId = null;
        return false;
    }

    getSelectedPiece() {
        return this.selectedPieceId ? this.getPieceById(this.selectedPieceId) : null;
    }

    canMove(piece, dx, dy) {
        if (!piece || !piece.movable) return false;

        const newX = piece.x + dx;
        const newY = piece.y + dy;

        if (newX < 0 || newX + piece.width > BOARD_CONFIG.cols) return false;
        if (newY < 0 || newY + piece.height > BOARD_CONFIG.rows) return false;

        for (const other of this.pieces) {
            if (other.id === piece.id) continue;

            if (this.rectsOverlap(
                newX, newY, piece.width, piece.height,
                other.x, other.y, other.width, other.height
            )) {
                return false;
            }
        }

        return true;
    }

    rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    movePiece(pieceId, dx, dy) {
        if (this.state !== GAME_STATE.PLAYING) return false;

        const piece = this.getPieceById(pieceId);
        if (!piece) return false;

        if (!this.canMove(piece, dx, dy)) return false;

        this.saveHistory();

        piece.x += dx;
        piece.y += dy;
        this.steps++;

        if (this.checkWin()) {
            this.state = GAME_STATE.WON;
        }

        return true;
    }

    moveSelectedPiece(direction) {
        const piece = this.getSelectedPiece();
        if (!piece) return false;

        const dirMap = {
            up: { dx: 0, dy: -1 },
            down: { dx: 0, dy: 1 },
            left: { dx: -1, dy: 0 },
            right: { dx: 1, dy: 0 }
        };

        const dir = dirMap[direction];
        if (!dir) return false;

        return this.movePiece(piece.id, dir.dx, dir.dy);
    }

    checkWin() {
        const caocao = this.pieces.find(p => p.type === PIECE_TYPES.CAOCAO);
        if (!caocao) return false;

        return caocao.x === BOARD_CONFIG.exitX && caocao.y === BOARD_CONFIG.exitY;
    }

    saveHistory() {
        const state = {
            pieces: this.pieces.map(p => ({ ...p })),
            steps: this.steps
        };

        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    undo() {
        if (this.history.length === 0) return false;
        if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.PAUSED) return false;

        const prevState = this.history.pop();
        this.pieces = prevState.pieces;
        this.steps = prevState.steps;
        this.selectedPieceId = null;

        return true;
    }

    canUndo() {
        return this.history.length > 0;
    }

    reset() {
        return this.init(this.currentLayout);
    }

    updateTime(deltaSeconds) {
        if (this.state === GAME_STATE.PLAYING) {
            this.elapsedTime += deltaSeconds;
        }
    }

    getFormattedTime() {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    getState() {
        return {
            pieces: this.pieces.map(p => ({ ...p })),
            selectedPieceId: this.selectedPieceId,
            steps: this.steps,
            elapsedTime: this.elapsedTime,
            history: this.history.map(h => ({
                pieces: h.pieces.map(p => ({ ...p })),
                steps: h.steps
            })),
            state: this.state,
            currentLayout: this.currentLayout
        };
    }

    loadState(savedState) {
        if (!savedState) return false;

        try {
            this.pieces = savedState.pieces;
            this.selectedPieceId = savedState.selectedPieceId;
            this.steps = savedState.steps;
            this.elapsedTime = savedState.elapsedTime;
            this.history = savedState.history;
            this.state = savedState.state;
            this.currentLayout = savedState.currentLayout;
            return true;
        } catch (e) {
            console.error('Failed to load state:', e);
            return false;
        }
    }
}
