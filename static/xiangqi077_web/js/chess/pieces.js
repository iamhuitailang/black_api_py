const PIECES = {
  KING: 'king',
  ADVISOR: 'advisor',
  ELEPHANT: 'elephant',
  KNIGHT: 'knight',
  ROOK: 'rook',
  CANNON: 'cannon',
  PAWN: 'pawn'
};

const PIECE_NAMES = {
  red: { king: '帅', advisor: '仕', elephant: '相', rook: '車', knight: '馬', cannon: '炮', pawn: '兵' },
  black: { king: '将', advisor: '士', elephant: '象', rook: '車', knight: '馬', cannon: '炮', pawn: '卒' }
};

const PIECE_VALUES = {
  king: 10000,
  rook: 900,
  cannon: 450,
  knight: 400,
  advisor: 200,
  elephant: 200,
  pawn: 100
};

const INITIAL_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w';

const RED_PIECE_POSITION_VALUES = {
  king: [
    [0, 0, 0, 10, 10, 10, 0, 0, 0],
    [0, 0, 0, 10, 10, 10, 0, 0, 0],
    [0, 0, 0, 10, 10, 10, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 10, 10, 10, 0, 0, 0],
    [0, 0, 0, 20, 20, 20, 0, 0, 0],
    [0, 0, 0, 30, 40, 30, 0, 0, 0]
  ],
  advisor: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 5, 0, 5, 0, 0, 0],
    [0, 0, 0, 0, 10, 0, 0, 0, 0],
    [0, 0, 0, 5, 0, 5, 0, 0, 0]
  ],
  elephant: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 20, 0, 0, 0, 20, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [10, 0, 0, 0, 20, 0, 0, 0, 10],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 20, 0, 30, 0, 20, 0, 0]
  ],
  knight: [
    [2, 2, 2, 8, 2, 8, 2, 2, 2],
    [2, 4, 6, 5, 4, 5, 6, 4, 2],
    [2, 6, 10, 10, 8, 10, 10, 6, 2],
    [5, 8, 12, 15, 12, 15, 12, 8, 5],
    [4, 10, 14, 18, 16, 18, 14, 10, 4],
    [6, 12, 18, 20, 20, 20, 18, 12, 6],
    [8, 16, 22, 24, 24, 24, 22, 16, 8],
    [10, 20, 25, 26, 28, 26, 25, 20, 10],
    [12, 24, 28, 30, 32, 30, 28, 24, 12],
    [14, 28, 32, 35, 40, 35, 32, 28, 14]
  ],
  rook: [
    [14, 14, 12, 18, 16, 18, 12, 14, 14],
    [16, 20, 18, 24, 26, 24, 18, 20, 16],
    [12, 12, 12, 18, 18, 18, 12, 12, 12],
    [18, 24, 18, 24, 24, 24, 18, 24, 18],
    [16, 22, 16, 22, 22, 22, 16, 22, 16],
    [12, 18, 12, 18, 18, 18, 12, 18, 12],
    [12, 16, 12, 18, 18, 18, 12, 16, 12],
    [12, 18, 14, 20, 20, 20, 14, 18, 12],
    [12, 16, 12, 18, 18, 18, 12, 16, 12],
    [14, 18, 16, 20, 20, 20, 16, 18, 14]
  ],
  cannon: [
    [6, 4, 0, -10, -12, -10, 0, 4, 6],
    [2, 2, 0, -4, -14, -4, 0, 2, 2],
    [2, 2, 0, -10, -8, -10, 0, 2, 2],
    [0, 0, -2, 4, 10, 4, -2, 0, 0],
    [0, 0, 0, 2, 8, 2, 0, 0, 0],
    [-2, 0, 4, 2, 6, 2, 4, 0, -2],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [4, 0, 8, 6, 10, 6, 8, 0, 4],
    [0, 2, 4, 6, 6, 6, 4, 2, 0],
    [0, 0, 2, 6, 6, 6, 2, 0, 0]
  ],
  pawn: [
    [0, 3, 6, 9, 12, 9, 6, 3, 0],
    [18, 36, 56, 80, 120, 80, 56, 36, 18],
    [14, 26, 42, 60, 80, 60, 42, 26, 14],
    [10, 20, 30, 34, 40, 34, 30, 20, 10],
    [6, 12, 18, 18, 20, 18, 18, 12, 6],
    [2, 4, 6, 8, 10, 8, 6, 4, 2],
    [0, 0, 0, 2, 4, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ]
};

function getPositionValue(piece, row, col) {
  const side = piece.side;
  const type = piece.type;
  if (type === 'pawn' && ((side === 'red' && row <= 4) || (side === 'black' && row >= 5))) {
    return PIECE_VALUES.pawn * 2;
  }
  const table = RED_PIECE_POSITION_VALUES[type];
  if (!table) return PIECE_VALUES[type] || 0;
  const lookupRow = side === 'red' ? row : 9 - row;
  const lookupCol = side === 'red' ? col : 8 - col;
  return PIECE_VALUES[type] + (table[lookupRow] ? table[lookupRow][lookupCol] || 0 : 0);
}

function createInitialBoard() {
  const b = [];
  for (let r = 0; r < 10; r++) {
    b[r] = [];
    for (let c = 0; c < 9; c++) b[r][c] = null;
  }
  const backRow = ['rook', 'knight', 'elephant', 'advisor', 'king', 'advisor', 'elephant', 'knight', 'rook'];
  for (let c = 0; c < 9; c++) {
    b[0][c] = { type: backRow[c], side: 'black' };
    b[9][c] = { type: backRow[c], side: 'red' };
  }
  b[2][1] = { type: 'cannon', side: 'black' };
  b[2][7] = { type: 'cannon', side: 'black' };
  b[7][1] = { type: 'cannon', side: 'red' };
  b[7][7] = { type: 'cannon', side: 'red' };
  for (let c = 0; c < 9; c += 2) {
    b[3][c] = { type: 'pawn', side: 'black' };
    b[6][c] = { type: 'pawn', side: 'red' };
  }
  return b;
}

function cloneBoard(board) {
  const b = [];
  for (let r = 0; r < 10; r++) {
    b[r] = [];
    for (let c = 0; c < 9; c++) {
      b[r][c] = board[r][c] ? { ...board[r][c] } : null;
    }
  }
  return b;
}

function boardToFen(board, currentSide) {
  let fen = '';
  for (let r = 0; r < 10; r++) {
    let empty = 0;
    for (let c = 0; c < 9; c++) {
      const p = board[r][c];
      if (!p) {
        empty++;
      } else {
        if (empty > 0) {
          fen += empty;
          empty = 0;
        }
        const name = PIECE_NAMES[p.side][p.type];
        fen += p.side === 'red' ? name : name.toLowerCase();
      }
    }
    if (empty > 0) fen += empty;
    if (r < 9) fen += '/';
  }
  fen += ' ' + (currentSide === 'red' ? 'w' : 'b');
  return fen;
}

function fenToBoard(fen) {
  const [boardStr, turn] = fen.split(' ');
  const board = [];
  for (let r = 0; r < 10; r++) {
    board[r] = [];
    for (let c = 0; c < 9; c++) board[r][c] = null;
  }
  const rows = boardStr.split('/');
  for (let r = 0; r < 10 && r < rows.length; r++) {
    let c = 0;
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '9') {
        c += parseInt(ch);
      } else {
        let type = null, side = null;
        if (ch === '帅') { type = 'king'; side = 'red'; }
        else if (ch === '将') { type = 'king'; side = 'black'; }
        else if (ch === '仕') { type = 'advisor'; side = 'red'; }
        else if (ch === '士') { type = 'advisor'; side = 'black'; }
        else if (ch === '相') { type = 'elephant'; side = 'red'; }
        else if (ch === '象') { type = 'elephant'; side = 'black'; }
        else if (ch === '馬') { type = 'knight'; side = 'red'; }
        else if (ch === '马') { type = 'knight'; side = 'black'; }
        else if (ch === '車') { type = 'rook'; side = 'red'; }
        else if (ch === '车') { type = 'rook'; side = 'black'; }
        else if (ch === '炮') { type = 'cannon'; side = 'red'; }
        else if (ch === '砲') { type = 'cannon'; side = 'black'; }
        else if (ch === '兵') { type = 'pawn'; side = 'red'; }
        else if (ch === '卒') { type = 'pawn'; side = 'black'; }
        else {
          side = ch === ch.toUpperCase() ? 'red' : 'black';
          const lower = ch.toLowerCase();
          const pieceMap = { k: 'king', a: 'advisor', b: 'elephant', e: 'elephant', n: 'knight', r: 'rook', c: 'cannon', p: 'pawn' };
          type = pieceMap[lower];
        }
        if (type && c < 9) {
          board[r][c] = { type, side };
        }
        c++;
      }
    }
  }
  return { board, currentSide: turn === 'w' ? 'red' : 'black' };
}

window.XiangqiPieces = { PIECES, PIECE_NAMES, PIECE_VALUES, INITIAL_FEN, createInitialBoard, cloneBoard, boardToFen, fenToBoard, getPositionValue };
