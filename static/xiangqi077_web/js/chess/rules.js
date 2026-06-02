const _P = window.XiangqiPieces;

function isInBoard(row, col) {
  return row >= 0 && row < 10 && col >= 0 && col < 9;
}

function isInPalace(side, row, col) {
  if (col < 3 || col > 5) return false;
  if (side === 'red') return row >= 7 && row <= 9;
  return row >= 0 && row <= 2;
}

function isOnOwnSide(side, row) {
  if (side === 'red') return row >= 5;
  return row <= 4;
}

function hasCrossedRiver(side, row) {
  if (side === 'red') return row <= 4;
  return row >= 5;
}

function getKnightMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [
    [-2, -1, -1, 0], [-2, 1, -1, 0],
    [2, -1, 1, 0], [2, 1, 1, 0],
    [-1, -2, 0, -1], [1, -2, 0, -1],
    [-1, 2, 0, 1], [1, 2, 0, 1]
  ];
  for (const [dr, dc, br, bc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    const blockR = row + br;
    const blockC = col + bc;
    if (!isInBoard(nr, nc)) continue;
    if (board[blockR][blockC]) continue;
    const target = board[nr][nc];
    if (!target || target.side !== piece.side) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  return moves;
}

function getRookMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    let nr = row + dr;
    let nc = col + dc;
    while (isInBoard(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from: { row, col }, to: { row: nr, col: nc } });
      } else {
        if (target.side !== piece.side) {
          moves.push({ from: { row, col }, to: { row: nr, col: nc } });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

function getCannonMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    let nr = row + dr;
    let nc = col + dc;
    let jumped = false;
    while (isInBoard(nr, nc)) {
      const target = board[nr][nc];
      if (!jumped) {
        if (!target) {
          moves.push({ from: { row, col }, to: { row: nr, col: nc } });
        } else {
          jumped = true;
        }
      } else {
        if (target) {
          if (target.side !== piece.side) {
            moves.push({ from: { row, col }, to: { row: nr, col: nc } });
          }
          break;
        }
      }
      nr += dr;
      nc += dc;
    }
  }
  return moves;
}

function getPawnMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const forward = piece.side === 'red' ? -1 : 1;
  const directions = [[forward, 0]];
  if (hasCrossedRiver(piece.side, row)) {
    directions.push([0, -1], [0, 1]);
  }
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (!isInBoard(nr, nc)) continue;
    const target = board[nr][nc];
    if (!target || target.side !== piece.side) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  return moves;
}

function getKingMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (!isInPalace(piece.side, nr, nc)) continue;
    const target = board[nr][nc];
    if (!target || target.side !== piece.side) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  return moves;
}

function getAdvisorMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (!isInPalace(piece.side, nr, nc)) continue;
    const target = board[nr][nc];
    if (!target || target.side !== piece.side) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  return moves;
}

function getElephantMoves(board, row, col) {
  const moves = [];
  const piece = board[row][col];
  if (!piece) return moves;
  const directions = [
    [-2, -2, -1, -1], [-2, 2, -1, 1],
    [2, -2, 1, -1], [2, 2, 1, 1]
  ];
  for (const [dr, dc, br, bc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (!isOnOwnSide(piece.side, nr)) continue;
    if (!isInBoard(nr, nc)) continue;
    if (board[row + br][col + bc]) continue;
    const target = board[nr][nc];
    if (!target || target.side !== piece.side) {
      moves.push({ from: { row, col }, to: { row: nr, col: nc } });
    }
  }
  return moves;
}

function findKing(board, side) {
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.type === 'king' && p.side === side) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function kingsFacing(board) {
  const redKing = findKing(board, 'red');
  const blackKing = findKing(board, 'black');
  if (!redKing || !blackKing) return false;
  if (redKing.col !== blackKing.col) return false;
  const col = redKing.col;
  const minRow = Math.min(redKing.row, blackKing.row);
  const maxRow = Math.max(redKing.row, blackKing.row);
  for (let r = minRow + 1; r < maxRow; r++) {
    if (board[r][col]) return false;
  }
  return true;
}

function getPieceMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  switch (piece.type) {
    case 'king': return getKingMoves(board, row, col);
    case 'advisor': return getAdvisorMoves(board, row, col);
    case 'elephant': return getElephantMoves(board, row, col);
    case 'knight': return getKnightMoves(board, row, col);
    case 'rook': return getRookMoves(board, row, col);
    case 'cannon': return getCannonMoves(board, row, col);
    case 'pawn': return getPawnMoves(board, row, col);
    default: return [];
  }
}

function getAllMoves(board, side) {
  const moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const pieceMoves = getPieceMoves(board, r, c);
        moves.push(...pieceMoves);
      }
    }
  }
  return moves;
}

function makeMove(board, move) {
  const newBoard = _P.cloneBoard(board);
  newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
  newBoard[move.from.row][move.from.col] = null;
  return newBoard;
}

function isInCheck(board, side) {
  const opposite = side === 'red' ? 'black' : 'red';
  if (kingsFacing(board)) return true;
  const king = findKing(board, side);
  if (!king) return true;
  const moves = getAllMoves(board, opposite);
  for (const move of moves) {
    if (move.to.row === king.row && move.to.col === king.col) {
      return true;
    }
  }
  return false;
}

function getValidMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = getPieceMoves(board, row, col);
  return moves.filter(move => {
    const newBoard = makeMove(board, move);
    return !isInCheck(newBoard, piece.side) && !kingsFacing(newBoard);
  });
}

function getAllValidMoves(board, side) {
  const moves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p && p.side === side) {
        const pieceMoves = getValidMoves(board, r, c);
        moves.push(...pieceMoves);
      }
    }
  }
  return moves;
}

function isCheckmate(board, side) {
  if (!isInCheck(board, side)) return false;
  return getAllValidMoves(board, side).length === 0;
}

function isStalemate(board, side) {
  if (isInCheck(board, side)) return false;
  return getAllValidMoves(board, side).length === 0;
}

function evaluateBoard(board, side) {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (p) {
        const value = _P.getPositionValue(p, r, c);
        score += p.side === side ? value : -value;
      }
    }
  }
  return score;
}

function colToLetter(col) {
  return String.fromCharCode(97 + col);
}

function posToString(row, col) {
  return colToLetter(col) + (10 - row);
}

function formatMove(move, board) {
  const piece = board[move.from.row][move.from.col];
  if (!piece) return '';
  const name = _P.PIECE_NAMES[piece.side][piece.type];
  const from = posToString(move.from.row, move.from.col);
  const to = posToString(move.to.row, move.to.col);
  return `${name} ${from}→${to}`;
}

window.XiangqiRules = {
  isInBoard, isInPalace, isOnOwnSide, hasCrossedRiver, kingsFacing,
  getPieceMoves, getAllMoves, makeMove, isInCheck, getValidMoves,
  getAllValidMoves, isCheckmate, isStalemate, evaluateBoard,
  formatMove, posToString, findKing
};
