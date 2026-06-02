const _AP = window.XiangqiPieces;
const _AR = window.XiangqiRules;

class ChessAI {
  constructor(level = 1) {
    this.level = Math.max(1, Math.min(5, level));
    this.searchDepth = this.level;
    this.maxTime = 500 + (this.level - 1) * 500;
    this.nodeCount = 0;
    this.startTime = 0;
  }

  setLevel(level) {
    this.level = Math.max(1, Math.min(5, level));
    this.searchDepth = this.level;
    this.maxTime = 500 + (this.level - 1) * 500;
  }

  findBestMove(board, side) {
    this.nodeCount = 0;
    this.startTime = Date.now();
    const moves = _AR.getAllValidMoves(board, side);
    if (moves.length === 0) return null;
    if (moves.length === 1) return moves[0];
    let bestMove = moves[0];
    let bestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;
    const shuffledMoves = this.orderMoves(board, moves);
    for (const move of shuffledMoves) {
      const newBoard = _AR.makeMove(board, move);
      const score = this.minimax(newBoard, this.searchDepth - 1, alpha, beta, false, side);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      if (Date.now() - this.startTime > this.maxTime) break;
    }
    return bestMove;
  }

  orderMoves(board, moves) {
    const scoredMoves = moves.map(move => {
      let score = 0;
      const target = board[move.to.row][move.to.col];
      if (target) {
        score += 10000;
      }
      return { move, score };
    });
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.map(sm => sm.move);
  }

  minimax(board, depth, alpha, beta, maximizingPlayer, side) {
    this.nodeCount++;
    if (this.nodeCount % 1000 === 0 && Date.now() - this.startTime > this.maxTime) {
      return maximizingPlayer ? alpha : beta;
    }
    if (depth === 0) return _AR.evaluateBoard(board, side);
    const currentSide = maximizingPlayer ? side : (side === 'red' ? 'black' : 'red');
    const moves = _AR.getAllValidMoves(board, currentSide);
    if (moves.length === 0) {
      if (isCheckmate(board, currentSide)) {
        return maximizingPlayer ? -99999 - depth : 99999 + depth;
      }
      return 0;
    }
    const orderedMoves = this.orderMoves(board, moves);
    if (maximizingPlayer) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
        const newBoard = _AR.makeMove(board, move);
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, false, side);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of orderedMoves) {
        const newBoard = _AR.makeMove(board, move);
        const evalScore = this.minimax(newBoard, depth - 1, alpha, beta, true, side);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}

window.ChessAI = ChessAI;
