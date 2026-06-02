const _GP = window.XiangqiPieces;
const _GR = window.XiangqiRules;

const GamePage = {
  template: `
    <div class="game-page">
      <div class="game-board-area">
        <div class="back-btn" @click="backToHall">
          <span>← 返回大厅</span>
        </div>
        <canvas ref="boardCanvas" @click="onBoardClick"></canvas>
      </div>
      <div class="game-panel">
        <div class="panel-section game-info">
          <div class="player-info" :class="{ active: currentSide === 'black' }">
            <span class="player-side black">黑方</span>
            <span class="player-name">{{ blackName }}</span>
          </div>
          <div class="turn-indicator">{{ turnText }}</div>
          <div class="player-info" :class="{ active: currentSide === 'red' }">
            <span class="player-side red">红方</span>
            <span class="player-name">{{ redName }}</span>
          </div>
        </div>

        <div class="panel-section game-status" v-if="gameStatus">
          <div class="status-text" :class="statusClass">{{ gameStatus }}</div>
        </div>

        <div class="panel-section game-actions" v-if="isPlaying && !isSpectator">
          <button class="btn btn-sm" @click="handleUndo" :disabled="undoRequested || undoPending || !isMyTurn" style="margin-right: 8px;">悔棋</button>
          <button class="btn btn-sm" @click="handleDraw" :disabled="drawPending || !isMyTurn" style="margin-right: 8px;">求和</button>
          <button class="btn btn-sm btn-danger" @click="handleResign" :disabled="!isMyTurn">认输</button>
        </div>
        <div class="panel-section undo-request" v-if="undoPending">
          <div class="request-text">对方请求悔棋</div>
          <button class="btn btn-sm btn-primary" @click="acceptUndo" style="margin-right: 8px;">同意</button>
          <button class="btn btn-sm" @click="rejectUndo">拒绝</button>
        </div>
        <div class="panel-section draw-request" v-if="drawPending">
          <div class="request-text">对方请求求和</div>
          <button class="btn btn-sm btn-primary" @click="acceptDraw" style="margin-right: 8px;">同意</button>
          <button class="btn btn-sm" @click="rejectDraw">拒绝</button>
        </div>

        <div class="panel-section move-history">
          <h4>走棋记录</h4>
          <div class="move-list" ref="moveList">
            <div class="move-item" v-for="(m, i) in moves" :key="i">
              <span class="move-num">{{ i + 1 }}.</span>
              <span class="move-text">{{ m.text || formatMoveText(m) }}</span>
            </div>
            <div class="move-item empty" v-if="moves.length === 0">暂无走棋记录</div>
          </div>
        </div>

        <div class="panel-section game-chat">
          <h4>聊天</h4>
          <div class="chat-messages" ref="chatBox">
            <div class="chat-msg" v-for="msg in chatMessages" :key="msg.id">
              <span class="chat-name">{{ msg.nickname || msg.username }}:</span>
              <span class="chat-text">{{ msg.content }}</span>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" v-model="chatInput" placeholder="输入消息..." @keyup.enter="sendChat" />
            <button class="btn btn-sm" @click="sendChat" :disabled="sendingChat">发送</button>
          </div>
        </div>
      </div>

      <div class="game-result-modal" v-if="showResult">
        <div class="modal-overlay" @click="backToHall"></div>
        <div class="modal-content">
          <h3>{{ resultText }}</h3>
          <p>{{ resultDetail }}</p>
          <button class="btn btn-primary" @click="backToHall">返回大厅</button>
        </div>
      </div>
    </div>
  `,
  setup() {
    const boardCanvas = Vue.ref(null);
    const moveList = Vue.ref(null);
    const chatBox = Vue.ref(null);

    const gameId = Vue.ref('');
    const gameData = Vue.ref(null);
    const board = Vue.ref([]);
    const currentSide = Vue.ref('red');
    const moves = Vue.ref([]);
    const chatMessages = Vue.ref([]);
    const chatInput = Vue.ref('');
    const gameStatus = Vue.ref('');
    const statusClass = Vue.ref('');
    const showResult = Vue.ref(false);
    const resultText = Vue.ref('');
    const resultDetail = Vue.ref('');
    const undoRequested = Vue.ref(false);
    const undoPending = Vue.ref(false);
    const drawPending = Vue.ref(false);
    const isPlaying = Vue.ref(true);
    const blackName = Vue.ref('AI');
    const redName = Vue.ref('我');
    const sendingChat = Vue.ref(false);
    const isSpectator = Vue.ref(false);

    const user = Vue.ref(XiangqiAuth.getUser());
    let chessBoard = null;
    let chessAI = null;
    let mySide = 'red';
    let aiLevel = 1;
    let isPve = true;
    let pollTimer = null;

    const isMyTurn = Vue.computed(() => {
      if (!isPlaying.value || isSpectator.value) return false;
      return currentSide.value === mySide;
    });

    const turnText = Vue.computed(() => {
      if (gameStatus.value) return gameStatus.value;
      if (isSpectator.value) return currentSide.value === 'red' ? '红方走棋' : '黑方走棋';
      if (currentSide.value === mySide) return '轮到你了';
      return '对方思考中...';
    });

    function formatMoveText(m) {
      if (m.text) return m.text;
      const pieceName = _GP.PIECE_NAMES[m.player || 'red'][m.piece];
      return `${pieceName} ${m.from_pos}→${m.to_pos}`;
    }

    function backToHall() {
      if (pollTimer) clearInterval(pollTimer);
      window.location.hash = '#/hall';
    }

    async function init() {
      const hash = window.location.hash;
      const match = hash.match(/[?&]id=([^&]+)/);
      if (match) gameId.value = match[1];

      const savedState = localStorage.getItem('xiangqi_game_' + gameId.value);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          board.value = state.board;
          currentSide.value = state.currentSide;
          moves.value = state.moves || [];
          mySide = state.mySide || 'red';
        } catch (e) {}
      }

      if (gameId.value) {
        await loadGameData();
      } else {
        board.value = _GP.createInitialBoard();
        currentSide.value = 'red';
      }

      Vue.nextTick(() => {
        initChessBoard();
      });
    }

    async function loadGameData() {
      try {
        const res = await XiangqiApi.getGame(gameId.value);
        if (res.code === 0 && res.data) {
          gameData.value = res.data;
          isPve = res.data.game_type === 0;
          aiLevel = res.data.ai_level || 1;

          if (isPve) {
            const uid = user.value?.id;
            if (res.data.red_player_id === uid) {
              mySide = 'red';
              redName.value = user.value?.nickname || '我';
              blackName.value = 'AI (Lv.' + aiLevel + ')';
            } else {
              mySide = 'black';
              blackName.value = user.value?.nickname || '我';
              redName.value = 'AI (Lv.' + aiLevel + ')';
            }
            chessAI = new ChessAI(aiLevel);
          } else {
            const uid = user.value?.id;
            if (res.data.red_player_id === uid) {
              mySide = 'red';
              redName.value = user.value?.nickname || '我';
              blackName.value = '棋手' + (res.data.black_player_id || '');
            } else if (res.data.black_player_id === uid) {
              mySide = 'black';
              blackName.value = user.value?.nickname || '我';
              redName.value = '棋手' + (res.data.red_player_id || '');
            } else {
              isSpectator.value = true;
              redName.value = '棋手' + (res.data.red_player_id || '');
              blackName.value = '棋手' + (res.data.black_player_id || '');
            }
          }

          if (res.data.status === 2) {
            isPlaying.value = false;
            showGameResult(res.data.result);
          }

          const stateRes = await XiangqiApi.getGameState(gameId.value);
          if (stateRes.code === 0 && stateRes.data) {
            if (stateRes.data.undo_requested) {
              const requester = stateRes.data.undo_requester;
              undoPending.value = requester !== mySide;
              undoRequested.value = requester === mySide;
            }
            if (stateRes.data.draw_requested) {
              const requester = stateRes.data.draw_requester;
              drawPending.value = requester !== mySide;
            }
          }

          await loadMoves();
          await loadChatMessages();

          if (!isPve && !isSpectator.value) {
            pollTimer = setInterval(pollGameState, 2000);
          }

          if (board.value.length === 0) {
            board.value = _GP.createInitialBoard();
          }
        }
      } catch (e) {
        console.error('loadGameData error:', e);
        if (board.value.length === 0) {
          board.value = _GP.createInitialBoard();
        }
      }
    }

    function initChessBoard() {
      if (!boardCanvas.value) return;
      chessBoard = new ChessBoard(boardCanvas.value, {
        cellSize: 60,
        margin: 30,
        board: board.value,
        currentSide: currentSide.value,
        viewSide: mySide,
        interactive: !isSpectator.value,
        onMove: handleBoardMove
      });
    }

    async function loadMoves() {
      try {
        const res = await XiangqiApi.getGameMoves(gameId.value);
        if (res.code === 0) {
          moves.value = res.data || [];
        }
      } catch (e) {}
    }

    async function loadChatMessages() {
      try {
        const res = await XiangqiApi.getGameMessages(gameId.value);
        if (res.code === 0) {
          chatMessages.value = res.data || [];
          if (chatBox.value) {
            setTimeout(() => chatBox.value.scrollTop = chatBox.value.scrollHeight, 100);
          }
        }
      } catch (e) {}
    }

    async function pollGameState() {
      if (!gameId.value) return;
      try {
        const res = await XiangqiApi.getGameState(gameId.value);
        if (res.code === 0 && res.data) {
          if (res.data.current_turn !== currentSide.value && res.data.move_count > moves.value.length) {
            currentSide.value = res.data.current_turn;
            if (chessBoard) {
              chessBoard.setCurrentSide(currentSide.value);
            }
            await loadMoves();
          }
          if (res.data.undo_requested && !undoPending.value && !undoRequested.value) {
            undoPending.value = res.data.undo_requester !== mySide;
            undoRequested.value = res.data.undo_requester === mySide;
          }
          if (res.data.draw_requested && !drawPending.value) {
            drawPending.value = res.data.draw_requester !== mySide;
          }
        }
        const gameRes = await XiangqiApi.getGame(gameId.value);
        if (gameRes.code === 0 && gameRes.data && gameRes.data.status === 2) {
          isPlaying.value = false;
          showGameResult(gameRes.data.result);
        }
      } catch (e) {}
    }

    function handleBoardMove(move) {
      if (!isMyTurn.value || !isPlaying.value) return;
      const piece = board.value[move.from.row][move.from.col];
      if (!piece) return;

      const validMoves = _GR.getValidMoves(board.value, move.from.row, move.from.col);
      const isValid = validMoves.some(m => m.to.row === move.to.row && m.to.col === move.to.col);
      if (!isValid) return;

      chessBoard.animateMove(move, async () => {
        const capturedPiece = board.value[move.to.row][move.to.col];
        const pieceCopy = { ...piece };
        board.value = _GR.makeMove(board.value, move);
        currentSide.value = currentSide.value === 'red' ? 'black' : 'red';

        const moveRecord = {
          move_number: moves.value.length + 1,
          player: piece.side,
          piece: piece.type,
          from_pos: _GR.posToString(move.from.row, move.from.col),
          to_pos: _GR.posToString(move.to.row, move.to.col),
          text: formatMoveText({ player: piece.side, piece: piece.type, from_pos: _GR.posToString(move.from.row, move.from.col), to_pos: _GR.posToString(move.to.row, move.to.col) })
        };
        moves.value.push(moveRecord);

        if (chessBoard) {
          chessBoard.setBoard(board.value);
          chessBoard.setCurrentSide(currentSide.value);
          chessBoard.setLastMove(move.from, move.to);
        }

        saveGameState();

        if (_GR.isCheckmate(board.value, currentSide.value)) {
          isPlaying.value = false;
          const winner = piece.side;
          let result = winner === 'red' ? 1 : 2;
          showGameResult(result);
          if (gameId.value) {
            await XiangqiApi.finishGame(gameId.value, result);
          }
          return;
        }

        if (gameId.value) {
          try {
            const fen = _GP.boardToFen(board.value, currentSide.value);
            const res = await XiangqiApi.makeMove(gameId.value, {
              piece: piece.type,
              from_pos: _GR.posToString(move.from.row, move.from.col),
              to_pos: _GR.posToString(move.to.row, move.to.col),
              fen_after: fen
            });
          } catch (e) {
            console.error('makeMove error:', e);
          }
        }

        if (isPve && isPlaying.value && currentSide.value !== mySide) {
          setTimeout(makeAIMove, 500);
        }

        scrollMoveList();
      });
    }

    async function makeAIMove() {
      if (!chessAI || !isPlaying.value) return;
      const bestMove = chessAI.findBestMove(board.value, currentSide.value);
      if (bestMove) {
        const piece = board.value[bestMove.from.row][bestMove.from.col];
        if (piece) {
          chessBoard.animateMove(bestMove, async () => {
            const pieceCopy = { ...piece };
            board.value = _GR.makeMove(board.value, bestMove);
            currentSide.value = currentSide.value === 'red' ? 'black' : 'red';

            const moveRecord = {
              move_number: moves.value.length + 1,
              player: piece.side,
              piece: piece.type,
              from_pos: _GR.posToString(bestMove.from.row, bestMove.from.col),
              to_pos: _GR.posToString(bestMove.to.row, bestMove.to.col),
              text: formatMoveText({ player: piece.side, piece: piece.type, from_pos: _GR.posToString(bestMove.from.row, bestMove.from.col), to_pos: _GR.posToString(bestMove.to.row, bestMove.to.col) })
            };
            moves.value.push(moveRecord);

            if (chessBoard) {
              chessBoard.setBoard(board.value);
              chessBoard.setCurrentSide(currentSide.value);
              chessBoard.setLastMove(bestMove.from, bestMove.to);
            }

            saveGameState();

            if (_GR.isCheckmate(board.value, currentSide.value)) {
              isPlaying.value = false;
              const winner = piece.side;
              let result = winner === 'red' ? 1 : 2;
              showGameResult(result);
              if (gameId.value) {
                await XiangqiApi.finishGame(gameId.value, result);
              }
              return;
            }

            if (gameId.value) {
              try {
                const fen = _GP.boardToFen(board.value, currentSide.value);
                await XiangqiApi.makeMove(gameId.value, {
                  piece: piece.type,
                  from_pos: _GR.posToString(bestMove.from.row, bestMove.from.col),
                  to_pos: _GR.posToString(bestMove.to.row, bestMove.to.col),
                  fen_after: fen
                });
              } catch (e) {}
            }

            scrollMoveList();
          });
        }
      }
    }

    function saveGameState() {
      const state = {
        board: board.value,
        currentSide: currentSide.value,
        moves: moves.value,
        mySide: mySide,
        lastSaved: Date.now()
      };
      localStorage.setItem('xiangqi_game_' + (gameId.value || 'temp'), JSON.stringify(state));
    }

    function showGameResult(result) {
      showResult.value = true;
      if (result === 1) {
        resultText.value = '红方胜利！';
        resultDetail.value = mySide === 'red' ? '恭喜你获胜了！' : '很遗憾，你输了。';
        statusClass.value = 'win';
        gameStatus.value = '红方胜';
      } else if (result === 2) {
        resultText.value = '黑方胜利！';
        resultDetail.value = mySide === 'black' ? '恭喜你获胜了！' : '很遗憾，你输了。';
        statusClass.value = 'lose';
        gameStatus.value = '黑方胜';
      } else if (result === 3) {
        resultText.value = '和棋！';
        resultDetail.value = '双方握手言和。';
        statusClass.value = 'draw';
        gameStatus.value = '和棋';
      }
    }

    async function handleUndo() {
      if (!gameId.value) {
        if (moves.value.length >= 2) {
          moves.value.pop();
          moves.value.pop();
          board.value = _GP.createInitialBoard();
          moves.value.forEach(m => {
            const from = parsePos(m.from_pos);
            const to = parsePos(m.to_pos);
            board.value = _GR.makeMove(board.value, { from, to });
          });
          currentSide.value = moves.value.length % 2 === 0 ? 'red' : 'black';
          if (chessBoard) {
            chessBoard.setBoard(board.value);
            chessBoard.setCurrentSide(currentSide.value);
          }
          saveGameState();
        }
        return;
      }
      try {
        const res = await XiangqiApi.requestUndo(gameId.value);
        if (res.code === 0) {
          undoRequested.value = true;
          alert('悔棋请求已发送，等待对方同意');
        } else {
          alert(res.msg || '请求失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function acceptUndo() {
      if (!gameId.value) return;
      try {
        const res = await XiangqiApi.acceptUndo(gameId.value);
        if (res.code === 0) {
          undoPending.value = false;
          if (moves.value.length > 0) {
            moves.value.pop();
            moves.value.pop();
            board.value = _GP.createInitialBoard();
            moves.value.forEach(m => {
              const from = parsePos(m.from_pos);
              const to = parsePos(m.to_pos);
              board.value = _GR.makeMove(board.value, { from, to });
            });
            currentSide.value = moves.value.length % 2 === 0 ? 'red' : 'black';
            if (chessBoard) {
              chessBoard.setBoard(board.value);
              chessBoard.setCurrentSide(currentSide.value);
            }
            saveGameState();
          }
        } else {
          alert(res.msg || '操作失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function rejectUndo() {
      if (!gameId.value) {
        undoPending.value = false;
        return;
      }
      try {
        const res = await XiangqiApi.rejectUndo(gameId.value);
        if (res.code === 0) {
          undoPending.value = false;
        } else {
          alert(res.msg || '操作失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function handleDraw() {
      if (!gameId.value) {
        isPlaying.value = false;
        showGameResult(3);
        return;
      }
      try {
        const res = await XiangqiApi.requestDraw(gameId.value);
        if (res.code === 0) {
          alert('求和请求已发送，等待对方同意');
        } else {
          alert(res.msg || '请求失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function acceptDraw() {
      if (!gameId.value) {
        isPlaying.value = false;
        showGameResult(3);
        return;
      }
      try {
        const res = await XiangqiApi.acceptDraw(gameId.value);
        if (res.code === 0) {
          drawPending.value = false;
          isPlaying.value = false;
          showGameResult(3);
        } else {
          alert(res.msg || '操作失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function rejectDraw() {
      if (!gameId.value) {
        drawPending.value = false;
        return;
      }
      try {
        const res = await XiangqiApi.rejectDraw(gameId.value);
        if (res.code === 0) {
          drawPending.value = false;
        } else {
          alert(res.msg || '操作失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function handleResign() {
      if (!confirm('确定要认输吗？')) return;
      if (!gameId.value) {
        isPlaying.value = false;
        const result = mySide === 'red' ? 2 : 1;
        showGameResult(result);
        return;
      }
      try {
        const res = await XiangqiApi.resign(gameId.value);
        if (res.code === 0) {
          isPlaying.value = false;
          const result = mySide === 'red' ? 2 : 1;
          showGameResult(result);
        } else {
          alert(res.msg || '操作失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function sendChat() {
      if (!chatInput.value.trim()) return;
      sendingChat.value = true;
      try {
        const res = await XiangqiApi.sendMessage({
          game_id: gameId.value || undefined,
          content: chatInput.value.trim()
        });
        if (res.code === 0) {
          chatInput.value = '';
          loadChatMessages();
        } else {
          alert(res.msg || '发送失败');
        }
      } catch (e) {
        console.error('sendChat error:', e);
      }
      sendingChat.value = false;
    }

    function parsePos(posStr) {
      const col = posStr.charCodeAt(0) - 97;
      const row = 10 - parseInt(posStr.slice(1));
      return { row, col };
    }

    function scrollMoveList() {
      if (moveList.value) {
        setTimeout(() => {
          moveList.value.scrollTop = moveList.value.scrollHeight;
        }, 50);
      }
    }

    function onBoardClick(e) {
    }

    Vue.onMounted(() => {
      init();
    });

    Vue.onUnmounted(() => {
      if (pollTimer) clearInterval(pollTimer);
    });

    return {
      boardCanvas, moveList, chatBox,
      gameId, gameData, board, currentSide, moves, chatMessages, chatInput,
      gameStatus, statusClass, showResult, resultText, resultDetail,
      undoRequested, undoPending, drawPending, isPlaying,
      blackName, redName, sendingChat, isSpectator, user,
      isMyTurn, turnText, formatMoveText,
      backToHall, handleUndo, acceptUndo, rejectUndo,
      handleDraw, acceptDraw, rejectDraw, handleResign,
      sendChat, onBoardClick
    };
  }
};

window.GamePage = GamePage;
