const _BP = window.XiangqiPieces;
const _BR = window.XiangqiRules;

class ChessBoard {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cellSize = options.cellSize || 60;
    this.margin = options.margin || 30;
    this.board = options.board || null;
    this.selectedPiece = null;
    this.validMoves = [];
    this.lastMove = null;
    this.onMove = options.onMove || null;
    this.onSelect = options.onSelect || null;
    this.interactive = options.interactive !== false;
    this.currentSide = options.currentSide || 'red';
    this.viewSide = options.viewSide || 'red';
    this.init();
  }

  init() {
    const width = this.margin * 2 + this.cellSize * 8;
    const height = this.margin * 2 + this.cellSize * 9;
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.interactive) {
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    this.draw();
  }

  setBoard(board) {
    this.board = board;
    this.draw();
  }

  setCurrentSide(side) {
    this.currentSide = side;
    this.draw();
  }

  setViewSide(side) {
    this.viewSide = side;
    this.draw();
  }

  setLastMove(from, to) {
    this.lastMove = { from, to };
    this.draw();
  }

  clearSelection() {
    this.selectedPiece = null;
    this.validMoves = [];
    this.draw();
  }

  getBoardPos(canvasX, canvasY) {
    let col = Math.round((canvasX - this.margin) / this.cellSize);
    let row = Math.round((canvasY - this.margin) / this.cellSize);
    if (this.viewSide === 'black') {
      col = 8 - col;
      row = 9 - row;
    }
    return { row, col };
  }

  getCanvasPos(row, col) {
    let r = row, c = col;
    if (this.viewSide === 'black') {
      c = 8 - c;
      r = 9 - r;
    }
    return {
      x: this.margin + c * this.cellSize,
      y: this.margin + r * this.cellSize
    };
  }

  handleClick(e) {
    if (!this.interactive) return;
    if (!this.board) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pos = this.getBoardPos(x, y);
    if (!_BR.isInBoard(pos.row, pos.col)) return;
    const piece = this.board[pos.row][pos.col];
    if (this.selectedPiece) {
      const move = this.validMoves.find(m => m.to.row === pos.row && m.to.col === pos.col);
      if (move) {
        if (this.onMove) this.onMove(move);
        this.selectedPiece = null;
        this.validMoves = [];
        return;
      }
      if (piece && piece.side === this.currentSide) {
        this.selectedPiece = pos;
        this.validMoves = _BR.getValidMoves(this.board, pos.row, pos.col);
        this.draw();
        if (this.onSelect) this.onSelect(pos);
        return;
      }
      this.selectedPiece = null;
      this.validMoves = [];
      this.draw();
    } else {
      if (piece && piece.side === this.currentSide) {
        this.selectedPiece = pos;
        this.validMoves = _BR.getValidMoves(this.board, pos.row, pos.col);
        this.draw();
        if (this.onSelect) this.onSelect(pos);
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const cellSize = this.cellSize;
    const margin = this.margin;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.fillStyle = '#f4d79e';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#6b3f1d';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 10; r++) {
      ctx.beginPath();
      ctx.moveTo(margin, margin + r * cellSize);
      ctx.lineTo(margin + 8 * cellSize, margin + r * cellSize);
      ctx.stroke();
    }
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) {
        ctx.beginPath();
        ctx.moveTo(margin + c * cellSize, margin);
        ctx.lineTo(margin + c * cellSize, margin + 9 * cellSize);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(margin + c * cellSize, margin);
        ctx.lineTo(margin + c * cellSize, margin + 4 * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(margin + c * cellSize, margin + 5 * cellSize);
        ctx.lineTo(margin + c * cellSize, margin + 9 * cellSize);
        ctx.stroke();
      }
    }
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin + 3 * cellSize, margin);
    ctx.lineTo(margin + 5 * cellSize, margin + 2 * cellSize);
    ctx.moveTo(margin + 5 * cellSize, margin);
    ctx.lineTo(margin + 3 * cellSize, margin + 2 * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(margin + 3 * cellSize, margin + 7 * cellSize);
    ctx.lineTo(margin + 5 * cellSize, margin + 9 * cellSize);
    ctx.moveTo(margin + 5 * cellSize, margin + 7 * cellSize);
    ctx.lineTo(margin + 3 * cellSize, margin + 9 * cellSize);
    ctx.stroke();
    const riverY = margin + 4.5 * cellSize;
    ctx.fillStyle = '#6b3f1d';
    ctx.font = `bold ${cellSize * 0.35}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('楚  河', margin + 2 * cellSize, riverY);
    ctx.fillText('漢  界', margin + 6 * cellSize, riverY);
    if (this.lastMove) {
      const fromPos = this.getCanvasPos(this.lastMove.from.row, this.lastMove.from.col);
      const toPos = this.getCanvasPos(this.lastMove.to.row, this.lastMove.to.col);
      ctx.fillStyle = 'rgba(255, 200, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(fromPos.x, fromPos.y, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toPos.x, toPos.y, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.selectedPiece) {
      const pos = this.getCanvasPos(this.selectedPiece.row, this.selectedPiece.col);
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, cellSize * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const move of this.validMoves) {
      const pos = this.getCanvasPos(move.to.row, move.to.col);
      const target = this.board[move.to.row][move.to.col];
      if (target) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cellSize * 0.42, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (this.board) {
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const piece = this.board[r][c];
          if (piece) this.drawPiece(piece, r, c);
        }
      }
    }
  }

  drawPiece(piece, row, col) {
    const ctx = this.ctx;
    const cellSize = this.cellSize;
    const pos = this.getCanvasPos(row, col);
    const radius = cellSize * 0.4;
    const gradient = ctx.createRadialGradient(pos.x, pos.y, radius * 0.5, pos.x, pos.y, radius);
    if (piece.side === 'red') {
      gradient.addColorStop(0, '#fff4e6');
      gradient.addColorStop(1, '#e8c8a0');
    } else {
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#c8c8c8');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = piece.side === 'red' ? '#8b4513' : '#2c2c2c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = piece.side === 'red' ? '#c0392b' : '#1c1c1c';
    ctx.font = `bold ${cellSize * 0.45}px "KaiTi", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = _BP.PIECE_NAMES[piece.side][piece.type];
    ctx.fillText(name, pos.x, pos.y + 2);
  }

  animateMove(move, callback) {
    const duration = 200;
    const startTime = performance.now();
    const fromPos = this.getCanvasPos(move.from.row, move.from.col);
    const toPos = this.getCanvasPos(move.to.row, move.to.col);
    const piece = this.board[move.from.row][move.from.col];
    if (!piece) {
      if (callback) callback();
      return;
    }
    const originalFrom = this.board[move.from.row][move.from.col];
    const originalTo = this.board[move.to.row][move.to.col];
    this.board[move.from.row][move.from.col] = null;
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentX = fromPos.x + (toPos.x - fromPos.x) * easeProgress;
      const currentY = fromPos.y + (toPos.y - fromPos.y) * easeProgress;
      this.draw();
      this.drawPieceAnimating(piece, currentX, currentY);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.board[move.from.row][move.from.col] = originalFrom;
        this.board[move.to.row][move.to.col] = originalTo;
        if (callback) callback();
      }
    };
    requestAnimationFrame(animate);
  }

  drawPieceAnimating(piece, x, y) {
    const ctx = this.ctx;
    const cellSize = this.cellSize;
    const radius = cellSize * 0.4;
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius);
    if (piece.side === 'red') {
      gradient.addColorStop(0, '#fff4e6');
      gradient.addColorStop(1, '#e8c8a0');
    } else {
      gradient.addColorStop(0, '#f5f5f5');
      gradient.addColorStop(1, '#c8c8c8');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = piece.side === 'red' ? '#8b4513' : '#2c2c2c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = piece.side === 'red' ? '#c0392b' : '#1c1c1c';
    ctx.font = `bold ${cellSize * 0.45}px "KaiTi", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const name = _BP.PIECE_NAMES[piece.side][piece.type];
    ctx.fillText(name, x, y + 2);
  }
}

window.ChessBoard = ChessBoard;
