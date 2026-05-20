import { PIECE_CONFIG, BOARD_CONFIG } from './data.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = BOARD_CONFIG.cellSize;
        this.padding = 20;
        this.boardWidth = BOARD_CONFIG.cols * this.cellSize;
        this.boardHeight = BOARD_CONFIG.rows * this.cellSize;
    }

    render(game) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        this.drawExitArea();
        this.drawGrid();

        for (const piece of game.pieces) {
            this.drawPiece(piece, piece.id === game.selectedPieceId);
        }
    }

    drawBackground() {
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(
            this.padding,
            this.padding,
            this.boardWidth,
            this.boardHeight
        );

        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(
            this.padding,
            this.padding,
            this.boardWidth,
            this.boardHeight
        );
    }

    drawExitArea() {
        const exitX = this.padding + BOARD_CONFIG.exitX * this.cellSize;
        const exitY = this.padding + BOARD_CONFIG.exitY * this.cellSize;
        const exitWidth = BOARD_CONFIG.exitWidth * this.cellSize;
        const exitHeight = BOARD_CONFIG.exitHeight * this.cellSize;

        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
        this.ctx.fillRect(exitX, exitY, exitWidth, exitHeight);

        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(exitX, exitY, exitWidth, exitHeight);
        this.ctx.setLineDash([]);
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= BOARD_CONFIG.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding + x * this.cellSize, this.padding);
            this.ctx.lineTo(this.padding + x * this.cellSize, this.padding + this.boardHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y <= BOARD_CONFIG.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, this.padding + y * this.cellSize);
            this.ctx.lineTo(this.padding + this.boardWidth, this.padding + y * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawPiece(piece, isSelected) {
        const config = PIECE_CONFIG[piece.type];
        const x = this.padding + piece.x * this.cellSize;
        const y = this.padding + piece.y * this.cellSize;
        const width = piece.width * this.cellSize - 4;
        const height = piece.height * this.cellSize - 4;

        this.ctx.save();

        const radius = 8;
        this.ctx.beginPath();
        this.ctx.roundRect(x + 2, y + 2, width, height, radius);

        const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, this.lightenColor(config.color, 20));
        gradient.addColorStop(1, this.darkenColor(config.color, 20));
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        if (isSelected) {
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            this.ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
            this.ctx.shadowBlur = 15;
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = this.darkenColor(config.color, 30);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = config.textColor;
        this.ctx.font = `bold ${Math.min(width, height) * 0.4}px sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const symbol = piece.symbol || config.symbol;
        this.ctx.fillText(symbol, x + width / 2 + 2, y + height / 2 + 2);

        this.ctx.restore();
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    getBoardPosition(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX - this.padding;
        const y = (clientY - rect.top) * scaleY - this.padding;

        if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) {
            return null;
        }

        return {
            x: Math.floor(x / this.cellSize),
            y: Math.floor(y / this.cellSize)
        };
    }
}
