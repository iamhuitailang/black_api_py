const SpectatorPage = {
  template: `
    <div class="spectator-page">
      <h2>观战大厅</h2>
      <div class="spectator-list" v-if="!watchingGame">
        <div class="spectator-item" v-for="g in games" :key="g.id" @click="watchGame(g.id)">
          <div class="game-info-row">
            <span class="player red">{{ g.red_player_name || '红方' }}</span>
            <span class="vs">VS</span>
            <span class="player black">{{ g.black_player_name || '黑方' }}</span>
          </div>
          <div class="game-meta">
            <span class="game-type">{{ g.game_type === 'pve' ? '人机' : '在线' }}</span>
            <span class="spectator-count">👁 {{ g.spectator_count || 0 }}</span>
          </div>
          <button class="btn btn-sm btn-primary">观战</button>
        </div>
        <div class="empty-list" v-if="games.length === 0">暂无进行中的对局</div>
      </div>

      <div class="spectator-view" v-if="watchingGame">
        <div class="spectator-header">
          <button class="btn btn-sm" @click="leaveSpectate">← 退出观战</button>
          <span>{{ watchRedName }} VS {{ watchBlackName }}</span>
          <span class="spectator-count">👁 {{ spectatorCount }}</span>
        </div>
        <div class="spectator-board">
          <canvas ref="boardCanvas" :width="canvasSize" :height="canvasSize"></canvas>
        </div>
        <div class="spectator-chat">
          <div class="chat-messages" ref="chatBox">
            <div class="chat-msg" v-for="msg in chatMessages" :key="msg.id">
              <span class="chat-name">{{ msg.username }}:</span>
              <span class="chat-text">{{ msg.content }}</span>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" v-model="chatInput" placeholder="输入消息..." @keyup.enter="sendChat" />
            <button class="btn btn-sm" @click="sendChat">发送</button>
          </div>
        </div>
      </div>
    </div>
  `,
  setup() {
    const games = Vue.ref([]);
    const watchingGame = Vue.ref(false);
    const watchGameId = Vue.ref('');
    const watchRedName = Vue.ref('');
    const watchBlackName = Vue.ref('');
    const spectatorCount = Vue.ref(0);
    const board = Vue.ref([]);
    const chatMessages = Vue.ref([]);
    const chatInput = Vue.ref('');
    const boardCanvas = Vue.ref(null);
    const chatBox = Vue.ref(null);
    const canvasSize = Vue.ref(540);
    let pollTimer = null;

    const CELL = 60;
    const MARGIN = 30;

    async function loadGames() {
      try {
        const res = await XiangqiApi.getSpectatorGames();
        if (res.code === 0) games.value = res.data || [];
      } catch (e) { /* ignore */ }
    }

    async function watchGame(gid) {
      try {
        const res = await XiangqiApi.joinSpectate(gid);
        if (res.code === 0) {
          watchGameId.value = gid;
          watchingGame.value = true;
          loadWatchState();
          startPolling();
        } else {
          alert(res.msg || '加入观战失败');
        }
      } catch (e) {
        alert('网络错误');
      }
    }

    async function loadWatchState() {
      try {
        const res = await XiangqiApi.getGameState(watchGameId.value);
        if (res.code === 0 && res.data) {
          if (res.data.board) board.value = res.data.board;
          watchRedName.value = res.data.red_player_name || '红方';
          watchBlackName.value = res.data.black_player_name || '黑方';
          drawBoard();
          if (res.data.status === 'finished' || res.data.status === 'draw') {
            stopPolling();
          }
        }
      } catch (e) { /* ignore */ }

      try {
        const res2 = await XiangqiApi.getSpectators(watchGameId.value);
        if (res2.code === 0) spectatorCount.value = (res2.data || []).length;
      } catch (e) { /* ignore */ }

      try {
        const res3 = await XiangqiApi.getGameMessages(watchGameId.value);
        if (res3.code === 0) chatMessages.value = res3.data || [];
      } catch (e) { /* ignore */ }
    }

    async function leaveSpectate() {
      try {
        await XiangqiApi.leaveSpectate(watchGameId.value);
      } catch (e) { /* ignore */ }
      watchingGame.value = false;
      watchGameId.value = '';
      stopPolling();
      loadGames();
    }

    function startPolling() {
      stopPolling();
      pollTimer = setInterval(loadWatchState, 3000);
    }

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function drawBoard() {
      const canvas = boardCanvas.value;
      if (!canvas || !board.value.length) return;
      const ctx = canvas.getContext('2d');
      const size = canvasSize.value;

      ctx.fillStyle = '#f0d5a0';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 1;

      for (let r = 0; r < 10; r++) {
        ctx.beginPath();
        ctx.moveTo(MARGIN, MARGIN + r * CELL);
        ctx.lineTo(MARGIN + 8 * CELL, MARGIN + r * CELL);
        ctx.stroke();
      }
      for (let c = 0; c < 9; c++) {
        if (c === 0 || c === 8) {
          ctx.beginPath();
          ctx.moveTo(MARGIN + c * CELL, MARGIN);
          ctx.lineTo(MARGIN + c * CELL, MARGIN + 9 * CELL);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(MARGIN + c * CELL, MARGIN);
          ctx.lineTo(MARGIN + c * CELL, MARGIN + 4 * CELL);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(MARGIN + c * CELL, MARGIN + 5 * CELL);
          ctx.lineTo(MARGIN + c * CELL, MARGIN + 9 * CELL);
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.moveTo(MARGIN + 3 * CELL, MARGIN);
      ctx.lineTo(MARGIN + 5 * CELL, MARGIN + 2 * CELL);
      ctx.moveTo(MARGIN + 5 * CELL, MARGIN);
      ctx.lineTo(MARGIN + 3 * CELL, MARGIN + 2 * CELL);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(MARGIN + 3 * CELL, MARGIN + 7 * CELL);
      ctx.lineTo(MARGIN + 5 * CELL, MARGIN + 9 * CELL);
      ctx.moveTo(MARGIN + 5 * CELL, MARGIN + 7 * CELL);
      ctx.lineTo(MARGIN + 3 * CELL, MARGIN + 9 * CELL);
      ctx.stroke();

      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
          const piece = board.value[r] && board.value[r][c];
          if (piece) {
            const x = MARGIN + c * CELL;
            const y = MARGIN + r * CELL;
            const radius = CELL * 0.42;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = piece.side === 'red' ? '#fff5e6' : '#f0f0f0';
            ctx.fill();
            ctx.strokeStyle = piece.side === 'red' ? '#c00' : '#222';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
            ctx.strokeStyle = piece.side === 'red' ? '#c00' : '#222';
            ctx.lineWidth = 1;
            ctx.stroke();
            const charMap = {
              red: { king: '帅', advisor: '仕', elephant: '相', rook: '車', knight: '馬', cannon: '炮', pawn: '兵' },
              black: { king: '将', advisor: '士', elephant: '象', rook: '車', knight: '馬', cannon: '炮', pawn: '卒' }
            };
            const char = charMap[piece.side][piece.type];
            ctx.fillStyle = piece.side === 'red' ? '#c00' : '#222';
            ctx.font = 'bold ' + (CELL * 0.45) + 'px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char, x, y + 1);
          }
        }
      }
    }

    async function sendChat() {
      if (!chatInput.value.trim()) return;
      try {
        await XiangqiApi.sendMessage(watchGameId.value, { content: chatInput.value });
        chatInput.value = '';
        loadWatchState();
      } catch (e) { /* ignore */ }
    }

    Vue.onMounted(() => {
      loadGames();
    });

    Vue.onUnmounted(() => {
      stopPolling();
    });

    return {
      games, watchingGame, watchGameId, watchRedName, watchBlackName,
      spectatorCount, board, chatMessages, chatInput, boardCanvas, chatBox, canvasSize,
      loadGames, watchGame, leaveSpectate, sendChat
    };
  }
};

window.SpectatorPage = SpectatorPage;
