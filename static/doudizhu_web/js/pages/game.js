const GamePage = {
    gameState: null,
    selectedCards: [],

    render() {
        if (!AuthService.requireAuth()) return;

        const gameData = sessionStorage.getItem('current_game');
        if (!gameData) {
            window.location.hash = '#/home';
            return;
        }

        this.gameState = JSON.parse(gameData);

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="game-container">
                <header class="game-header">
                    <button id="backBtn" class="btn btn-outline btn-small">← 返回</button>
                    <div class="game-info">
                        <span id="gameStatus">叫地主阶段</span>
                        <span id="landlordInfo">地主: 待定</span>
                    </div>
                    <button id="cardCounterBtn" class="btn btn-outline btn-small">📋 记牌器</button>
                </header>

                <div class="game-table">
                    <div class="player-area player-top">
                        <div class="player-info">
                            <div class="player-avatar">🤖</div>
                            <div class="player-name">AI 上家</div>
                            <div class="player-cards-count" id="ai1CardCount">17张</div>
                        </div>
                        <div class="played-cards" id="ai1Played"></div>
                    </div>

                    <div class="player-area player-left">
                        <div class="player-info">
                            <div class="player-avatar">🤖</div>
                            <div class="player-name">AI 下家</div>
                            <div class="player-cards-count" id="ai2CardCount">17张</div>
                        </div>
                        <div class="played-cards" id="ai2Played"></div>
                    </div>

                    <div class="center-area">
                        <div class="landlord-cards" id="landlordCards">
                            <div class="card-back">🂠</div>
                            <div class="card-back">🂠</div>
                            <div class="card-back">🂠</div>
                        </div>
                        <div class="bid-area" id="bidArea">
                            <div class="bid-info" id="bidInfo">请选择叫分</div>
                            <div class="bid-buttons">
                                <button class="btn btn-bid" data-score="1">1分</button>
                                <button class="btn btn-bid" data-score="2">2分</button>
                                <button class="btn btn-bid" data-score="3">3分</button>
                                <button class="btn btn-outline" id="passBidBtn">不叫</button>
                            </div>
                        </div>
                        <div class="current-turn" id="currentTurn">轮到你了</div>
                    </div>

                    <div class="player-area player-bottom">
                        <div class="played-cards" id="playerPlayed"></div>
                        <div class="player-info">
                            <div class="player-avatar">👤</div>
                            <div class="player-name">你</div>
                            <div class="player-cards-count" id="playerCardCount">17张</div>
                        </div>
                    </div>
                </div>

                <div class="hand-cards" id="handCards">
                </div>

                <div class="action-buttons" id="actionButtons">
                    <button class="btn btn-outline" id="playPassBtn">不出</button>
                    <button class="btn btn-primary" id="playBtn">出牌</button>
                    <button class="btn btn-warning" id="hintBtn">提示</button>
                </div>

                <div class="card-counter-modal" id="cardCounterModal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>📋 记牌器</h3>
                            <button class="btn btn-close" id="closeCounterBtn">×</button>
                        </div>
                        <div class="modal-body" id="counterContent">
                        </div>
                    </div>
                </div>

                <div class="game-over-modal" id="gameOverModal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="gameOverTitle">游戏结束</h3>
                        </div>
                        <div class="modal-body">
                            <div id="gameOverResult"></div>
                            <div id="gameOverStats"></div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="playAgainBtn">再来一局</button>
                            <button class="btn btn-outline" id="backToHomeBtn">返回大厅</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.refreshGameState();
    },

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            if (confirm('确定要退出游戏吗？')) {
                sessionStorage.removeItem('current_game');
                window.location.hash = '#/home';
            }
        });

        document.querySelectorAll('.btn-bid').forEach(btn => {
            btn.addEventListener('click', async () => {
                const score = parseInt(btn.dataset.score);
                await this.playerBid(score);
            });
        });

        document.getElementById('passBidBtn').addEventListener('click', async () => {
            await this.playerPassBid();
        });

        document.getElementById('playBtn').addEventListener('click', async () => {
            await this.playCards();
        });

        document.getElementById('playPassBtn').addEventListener('click', async () => {
            await this.playPass();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('cardCounterBtn').addEventListener('click', () => {
            this.showCardCounter();
        });

        document.getElementById('closeCounterBtn').addEventListener('click', () => {
            document.getElementById('cardCounterModal').style.display = 'none';
        });

        document.getElementById('playAgainBtn').addEventListener('click', async () => {
            document.getElementById('gameOverModal').style.display = 'none';
            await this.startNewGame();
        });

        document.getElementById('backToHomeBtn').addEventListener('click', () => {
            sessionStorage.removeItem('current_game');
            window.location.hash = '#/home';
        });
    },

    async refreshGameState() {
        const result = await Api.get('/game/state/get', { game_id: this.gameState.game_id });
        if (result.code === 0 && result.data) {
            this.gameState = result.data;
            sessionStorage.setItem('current_game', JSON.stringify(result.data));
            this.updateUI();
        }
    },

    updateUI() {
        const state = this.gameState;

        const status = this.calculateStatus(state);
        document.getElementById('gameStatus').textContent = this.getStatusText(status);

        if (state.landlord !== null && state.landlord !== undefined) {
            const landlordText = state.landlord === 0 ? '你' : state.landlord === 1 ? 'AI上家' : 'AI下家';
            document.getElementById('landlordInfo').textContent = `地主: ${landlordText}`;
        }

        if (status === 'playing' && state.bottom_cards && state.bottom_cards.length > 0) {
            const landlordCardsDiv = document.getElementById('landlordCards');
            landlordCardsDiv.innerHTML = state.bottom_cards.map(card =>
                `<div class="card card-small ${this.getCardColor(card.suit)}">${card.display_name}</div>`
            ).join('');
        }

        if (status === 'bidding') {
            document.getElementById('bidArea').style.display = 'block';
            document.getElementById('actionButtons').style.display = 'none';
            document.getElementById('landlordInfo').textContent = '地主: 待定';
        } else {
            document.getElementById('bidArea').style.display = 'none';
            document.getElementById('actionButtons').style.display = 'flex';
        }

        this.renderHandCards(state.player_cards);
        this.updateCardCounts(state);
        this.updatePlayedCards(state);
        this.updateCurrentTurn(state);

        if (status === 'finished') {
            this.showGameOver();
        } else if (status === 'playing' && state.current_turn !== 0) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    },

    calculateStatus(state) {
        if (state.game_over) return 'finished';
        if (state.landlord === null || state.landlord === undefined) return 'bidding';
        return 'playing';
    },

    getStatusText(status) {
        const map = {
            'waiting': '等待开始',
            'bidding': '叫地主阶段',
            'playing': '游戏进行中',
            'finished': '游戏结束'
        };
        return map[status] || status;
    },

    getCardColor(suit) {
        if (suit === '♥' || suit === '♦') return 'card-red';
        return 'card-black';
    },

    renderHandCards(cards) {
        const container = document.getElementById('handCards');
        if (!cards) return;

        const sortedCards = [...cards].sort((a, b) => b.value - a.value);
        container.innerHTML = sortedCards.map(card => {
            const selected = this.selectedCards.includes(card.id);
            return `
                <div class="card ${this.getCardColor(card.suit)} ${selected ? 'card-selected' : ''}"
                     data-card-id="${card.id}"
                     onclick="GamePage.toggleCard('${card.id}')">
                    ${card.display_name}
                </div>
            `;
        }).join('');

        document.getElementById('playerCardCount').textContent = `${cards.length}张`;
    },

    toggleCard(cardId) {
        const index = this.selectedCards.indexOf(cardId);
        if (index > -1) {
            this.selectedCards.splice(index, 1);
        } else {
            this.selectedCards.push(cardId);
        }
        this.renderHandCards(this.gameState.player_cards);
    },

    updateCardCounts(state) {
        if (state.ai1_card_count !== undefined) {
            document.getElementById('ai1CardCount').textContent = `${state.ai1_card_count}张`;
        }
        if (state.ai2_card_count !== undefined) {
            document.getElementById('ai2CardCount').textContent = `${state.ai2_card_count}张`;
        }
    },

    updatePlayedCards(state) {
        if (state.last_played_cards && state.last_played_cards.length > 0 && state.last_player !== undefined) {
            const cards = state.last_played_cards;
            if (state.last_player === 0) {
                document.getElementById('playerPlayed').innerHTML = this.renderPlayedCards(cards);
            } else if (state.last_player === 1) {
                document.getElementById('ai1Played').innerHTML = this.renderPlayedCards(cards);
            } else if (state.last_player === 2) {
                document.getElementById('ai2Played').innerHTML = this.renderPlayedCards(cards);
            }
        }
    },

    renderPlayedCards(cards) {
        if (!cards || cards.length === 0) return '<div class="pass-text">不出</div>';
        return cards.map(card =>
            `<div class="card card-small ${this.getCardColor(card.suit)}">${card.display_name}</div>`
        ).join('');
    },

    updateCurrentTurn(state) {
        const turnMap = { 0: '轮到你了', 1: 'AI上家思考中...', 2: 'AI下家思考中...' };
        document.getElementById('currentTurn').textContent = turnMap[state.current_turn] || '';
    },

    async playerBid(score) {
        const result = await Api.post('/game/bid', {
            game_id: this.gameState.game_id,
            bid_score: score
        });

        if (result.code === 0) {
            Toast.success(`叫${score}分`);
            await this.aiBid();
        } else {
            Toast.error(result.msg || '叫分失败');
        }
    },

    async playerPassBid() {
        const result = await Api.post('/game/pass/bid', {
            game_id: this.gameState.game_id
        });

        if (result.code === 0) {
            Toast.info('不叫');
            await this.aiBid();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async aiBid() {
        await this.refreshGameState();
        const status = this.calculateStatus(this.gameState);
        if (status === 'bidding' && this.gameState.current_turn !== 0) {
            const result = await Api.post('/game/ai/bid', {
                game_id: this.gameState.game_id,
                ai_difficulty: this.gameState.ai_difficulty || 1
            });

            if (result.code === 0) {
                await new Promise(resolve => setTimeout(resolve, 800));
                await this.refreshGameState();
            }
        }
    },

    async playCards() {
        if (this.selectedCards.length === 0) {
            Toast.warning('请选择要出的牌');
            return;
        }

        const result = await Api.post('/game/play', {
            game_id: this.gameState.game_id,
            card_ids: this.selectedCards
        });

        if (result.code === 0) {
            this.selectedCards = [];
            await this.refreshGameState();
        } else {
            Toast.error(result.msg || '出牌失败');
        }
    },

    async playPass() {
        const result = await Api.post('/game/play', {
            game_id: this.gameState.game_id,
            card_ids: []
        });

        if (result.code === 0) {
            Toast.info('不出');
            this.selectedCards = [];
            await this.refreshGameState();
        } else {
            Toast.error(result.msg || '操作失败');
        }
    },

    async aiTurn() {
        const status = this.calculateStatus(this.gameState);
        if (status !== 'playing' || this.gameState.current_turn === 0) return;

        const result = await Api.post('/game/ai/play', {
            game_id: this.gameState.game_id,
            ai_difficulty: this.gameState.ai_difficulty || 1
        });

        if (result.code === 0) {
            await new Promise(resolve => setTimeout(resolve, 800));
            await this.refreshGameState();
        }
    },

    showHint() {
        Toast.info('提示功能开发中');
    },

    async showCardCounter() {
        const result = await Api.get('/game/played/cards/get', {
            game_id: this.gameState.game_id
        });

        if (result.code === 0 && result.data) {
            const content = document.getElementById('counterContent');
            const played = result.data.played_cards || [];

            content.innerHTML = `
                <div class="counter-section">
                    <h4>已出牌 (${played.length}张)</h4>
                    <div class="counter-cards">
                        ${played.map(c => `<span class="counter-card ${this.getCardColor(c.suit)}">${c.display_name}</span>`).join('')}
                    </div>
                </div>
                <div class="counter-section">
                    <h4>出牌历史</h4>
                    <div class="counter-history">
                        ${(result.data.history || []).map(h => `
                            <div class="history-item">
                                <span>${h.player === 0 ? '你' : h.player === 1 ? 'AI上家' : 'AI下家'}: </span>
                                <span>${h.action === 'pass' ? '不出' : h.cards.map(c => c.display_name).join(' ')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            document.getElementById('cardCounterModal').style.display = 'flex';
        }
    },

    showGameOver() {
        const state = this.gameState;
        const isWin = state.is_player_win === true;

        document.getElementById('gameOverTitle').textContent = isWin ? '🎉 恭喜获胜！' : '😔 很遗憾，输了';
        document.getElementById('gameOverResult').innerHTML = `
            <div class="result-big">${isWin ? '胜利' : '失败'}</div>
            <div class="result-score">得分: ${state.score || 0}</div>
        `;

        document.getElementById('gameOverStats').innerHTML = `
            <div class="stats-row">
                <span>金币变动</span>
                <span class="${state.coins_change >= 0 ? 'text-green' : 'text-red'}">${state.coins_change >= 0 ? '+' : ''}${state.coins_change || 0}</span>
            </div>
            <div class="stats-row">
                <span>炸弹数</span>
                <span>${state.bomb_count || 0}</span>
            </div>
            <div class="stats-row">
                <span>倍数</span>
                <span>${state.current_multiplier || 1}倍</span>
            </div>
        `;

        document.getElementById('gameOverModal').style.display = 'flex';
    },

    async startNewGame() {
        const ai_difficulty = this.gameState.ai_difficulty || 1;
        const result = await Api.post(`/game/create?ai_difficulty=${ai_difficulty}`);

        if (result.code === 0 && result.data) {
            this.selectedCards = [];
            this.gameState = result.data;
            sessionStorage.setItem('current_game', JSON.stringify(result.data));
            this.render();
        } else {
            Toast.error(result.msg || '创建游戏失败');
        }
    }
};
