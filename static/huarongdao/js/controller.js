export class Controller {
    constructor(game, renderer, onStateChange) {
        this.game = game;
        this.renderer = renderer;
        this.onStateChange = onStateChange;
        this.isDragging = false;
        this.dragStartPos = null;
        this.dragThreshold = 10;
        this.draggedPieceId = null;
    }

    setupEventListeners(canvas) {
        canvas.addEventListener('click', this.handleClick.bind(this));
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleClick(e) {
        if (!this.game.isPlaying()) return;

        const pos = this.renderer.getBoardPosition(e.clientX, e.clientY);
        if (!pos) return;

        const piece = this.game.getPieceAt(pos.x, pos.y);
        if (piece && piece.movable) {
            this.game.selectPiece(piece.id);
            this.onStateChange();
        }
    }

    handleMouseDown(e) {
        if (!this.game.isPlaying()) return;

        const pos = this.renderer.getBoardPosition(e.clientX, e.clientY);
        if (!pos) return;

        const piece = this.game.getPieceAt(pos.x, pos.y);
        if (piece && piece.movable) {
            this.isDragging = true;
            this.dragStartPos = { x: e.clientX, y: e.clientY, boardX: pos.x, boardY: pos.y };
            this.draggedPieceId = piece.id;
            this.game.selectPiece(piece.id);
            this.onStateChange();
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.dragStartPos) return;

        const dx = e.clientX - this.dragStartPos.x;
        const dy = e.clientY - this.dragStartPos.y;

        if (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold) {
            let direction = null;

            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'right' : 'left';
            } else {
                direction = dy > 0 ? 'down' : 'up';
            }

            if (this.game.moveSelectedPiece(direction)) {
                this.dragStartPos = { x: e.clientX, y: e.clientY };
                this.onStateChange();
            }
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.dragStartPos = null;
        this.draggedPieceId = null;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }

    handleKeyDown(e) {
        if (!this.game.isPlaying()) return;

        const keyMap = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right',
            w: 'up',
            W: 'up',
            s: 'down',
            S: 'down',
            a: 'left',
            A: 'left',
            d: 'right',
            D: 'right'
        };

        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            if (this.game.moveSelectedPiece(direction)) {
                this.onStateChange();
            }
        }

        if (e.key === 'z' || e.key === 'Z') {
            if (this.game.undo()) {
                this.onStateChange();
            }
        }
    }

    handleDirectionButton(direction) {
        if (!this.game.isPlaying()) return;

        if (this.game.moveSelectedPiece(direction)) {
            this.onStateChange();
        }
    }
}
