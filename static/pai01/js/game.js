class Game {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.state = CONSTANTS.GAME_STATE.MENU;
        this.cards = [];
        this.gridSize = 4;
        this.gameMode = CONSTANTS.GAME_MODE.SINGLE;
        this.timeLimit = 30;
        this.enableSpecialCards = true;
        
        this.currentPlayer = 0;
        this.players = [
            { score: 0, pairs: 0, timeBonus: 1 },
            { score: 0, pairs: 0, timeBonus: 1 }
        ];
        
        this.flippedCards = [];
        this.moves = 0;
        this.elapsedSeconds = 0;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.winner = null;
        this.isProcessing = false;
        
        this.peekMode = false;
        this.peekCardId = null;
        this.freezeNextPlayer = false;
        
        this.previewCountdown = 0;
        this.previewTimer = null;
    }
    
    init(config) {
        this.gridSize = config.gridSize;
        this.gameMode = config.gameMode;
        this.timeLimit = config.timeLimit;
        this.enableSpecialCards = config.enableSpecialCards;
        
        this.currentPlayer = 0;
        this.players = [
            { score: 0, pairs: 0, timeBonus: 1 },
            { score: 0, pairs: 0, timeBonus: 1 }
        ];
        this.flippedCards = [];
        this.moves = 0;
        this.elapsedSeconds = 0;
        this.timeLeft = this.timeLimit;
        this.winner = null;
        this.isProcessing = false;
        this.peekMode = false;
        this.peekCardId = null;
        this.freezeNextPlayer = false;
        
        this.generateCards();
        this.startPreview();
    }
    
    startPreview() {
        this.state = CONSTANTS.GAME_STATE.PREVIEW;
        this.previewCountdown = Math.ceil(CONSTANTS.PREVIEW.DURATION / 1000);
        
        this.cards.forEach(card => {
            card.state = CONSTANTS.CARD_STATE.FACE_UP;
        });
        
        let remaining = CONSTANTS.PREVIEW.DURATION;
        
        const updateCountdown = () => {
            this.previewCountdown = Math.ceil(remaining / 1000);
        };
        
        updateCountdown();
        
        this.previewTimer = setInterval(() => {
            remaining -= CONSTANTS.PREVIEW.COUNTDOWN_INTERVAL;
            updateCountdown();
            
            if (remaining <= 0) {
                this.endPreview();
            }
        }, CONSTANTS.PREVIEW.COUNTDOWN_INTERVAL);
    }
    
    endPreview() {
        if (this.previewTimer) {
            clearInterval(this.previewTimer);
            this.previewTimer = null;
        }
        
        this.cards.forEach(card => {
            if (!card.isMatched()) {
                card.state = CONSTANTS.CARD_STATE.FACE_DOWN;
            }
        });
        
        this.state = CONSTANTS.GAME_STATE.PLAYING;
        this.startTimer();
    }
    
    generateCards() {
        const totalCards = this.gridSize * this.gridSize;
        const pairsCount = totalCards / 2;
        
        let cardPairs = Utils.generateCardPairs(pairsCount);
        
        if (this.enableSpecialCards) {
            const specialCount = Math.min(4, Math.floor(pairsCount / 3));
            cardPairs = Utils.addSpecialCards(cardPairs, specialCount);
        }
        
        let cardId = 0;
        this.cards = [];
        
        cardPairs.forEach(pair => {
            for (let i = 0; i < 2; i++) {
                const card = new Card(
                    cardId++,
                    pair.id,
                    pair.color,
                    pair.shape,
                    pair.specialType
                );
                this.cards.push(card);
            }
        });
        
        this.cards = Utils.shuffle(this.cards);
        
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].row = Math.floor(i / this.gridSize);
            this.cards[i].col = i % this.gridSize;
        }
    }
    
    startTimer() {
        this.stopTimer();
        
        const updateTime = () => {
            if (this.state === CONSTANTS.GAME_STATE.PLAYING) {
                this.elapsedSeconds++;
                if (this.hasTimeLimit()) {
                    const bonus = this.players[this.currentPlayer].timeBonus;
                    this.timeLeft -= 1 / bonus;
                    if (this.timeLeft <= 0) {
                        this.timeLeft = 0;
                        this.handleTimeUp();
                    }
                }
            }
        };
        
        this.timerInterval = setInterval(updateTime, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    hasTimeLimit() {
        return this.timeLimit > 0;
    }
    
    handleTimeUp() {
        AudioManager.playGameOverSound();
        
        if (this.isDoubleMode()) {
            this.endTurn();
        } else {
            this.gameOver(false);
        }
    }
    
    isDoubleMode() {
        return this.gameMode === CONSTANTS.GAME_MODE.DOUBLE;
    }
    
    getCardById(id) {
        return this.cards.find(card => card.id === id);
    }
    
    getCardByPosition(row, col) {
        return this.cards.find(card => card.row === row && card.col === col);
    }
    
    canFlipCard(card) {
        if (this.state === CONSTANTS.GAME_STATE.PREVIEW) return false;
        if (this.isProcessing || this.peekMode) return false;
        if (!card || !card.canFlip()) return false;
        if (this.flippedCards.length >= 2) return false;
        if (this.flippedCards.includes(card)) return false;
        return true;
    }
    
    flipCard(card) {
        if (!this.canFlipCard(card)) return false;
        
        card.flip();
        this.flippedCards.push(card);
        AudioManager.playFlipSound();
        
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.isProcessing = true;
            this.checkMatch();
        }
        
        return true;
    }
    
    async checkMatch() {
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.pairId === card2.pairId;
        
        if (isMatch) {
            await Utils.delay(CONSTANTS.ANIMATION.MATCH_DELAY);
            this.handleMatch(card1, card2);
        } else {
            await Utils.delay(CONSTANTS.ANIMATION.NO_MATCH_DELAY);
            this.handleNoMatch(card1, card2);
        }
        
        this.flippedCards = [];
        this.isProcessing = false;
    }
    
    handleMatch(card1, card2) {
        AudioManager.playMatchSound();
        
        card1.match(this.currentPlayer);
        card2.match(this.currentPlayer);
        
        const player = this.players[this.currentPlayer];
        player.pairs++;
        player.score += 10;
        
        this.handleSpecialCardEffect(card1, card2);
        
        if (this.checkWin()) {
            this.gameOver(true);
        }
    }
    
    handleSpecialCardEffect(card1, card2) {
        const specialType = card1.specialType;
        if (!specialType) return;
        
        AudioManager.playSpecialCardSound(specialType);
        
        switch (specialType) {
            case CONSTANTS.CARD_TYPE.SHUFFLE:
                this.shuffleUnmatchedCards();
                break;
                
            case CONSTANTS.CARD_TYPE.PEEK:
                this.enterPeekMode();
                break;
                
            case CONSTANTS.CARD_TYPE.FREEZE:
                if (this.isDoubleMode() && this.hasTimeLimit()) {
                    this.freezeNextPlayer = true;
                }
                break;
                
            case CONSTANTS.CARD_TYPE.TRAP:
                this.endTurn();
                break;
        }
    }
    
    shuffleUnmatchedCards() {
        const unmatchedCards = this.cards.filter(card => !card.isMatched());
        if (unmatchedCards.length <= 2) return;
        
        const positions = unmatchedCards.map(card => ({ row: card.row, col: card.col }));
        const shuffledPositions = Utils.shuffle(positions);
        
        unmatchedCards.forEach((card, index) => {
            card.row = shuffledPositions[index].row;
            card.col = shuffledPositions[index].col;
        });
    }
    
    enterPeekMode() {
        this.peekMode = true;
        this.state = CONSTANTS.GAME_STATE.PEEKING;
    }
    
    exitPeekMode() {
        this.peekMode = false;
        this.peekCardId = null;
        this.state = CONSTANTS.GAME_STATE.PLAYING;
    }
    
    peekCard(card) {
        if (!this.peekMode || card.isMatched() || card.isFaceUp()) return false;
        this.peekCardId = card.id;
        return true;
    }
    
    handleNoMatch(card1, card2) {
        AudioManager.playNoMatchSound();
        
        card1.flipBack();
        card2.flipBack();
        
        if (this.isDoubleMode()) {
            this.endTurn();
        }
    }
    
    endTurn() {
        if (!this.isDoubleMode()) return;
        
        const nextPlayer = (this.currentPlayer + 1) % 2;
        
        if (this.freezeNextPlayer && this.hasTimeLimit()) {
            this.players[nextPlayer].timeBonus = 0.5;
            this.freezeNextPlayer = false;
        } else {
            this.players[nextPlayer].timeBonus = 1;
        }
        
        this.currentPlayer = nextPlayer;
        this.timeLeft = this.timeLimit;
    }
    
    checkWin() {
        return this.cards.every(card => card.isMatched());
    }
    
    gameOver(playerWon) {
        this.stopTimer();
        this.state = CONSTANTS.GAME_STATE.GAME_OVER;
        
        if (playerWon) {
            AudioManager.playWinSound();
            
            if (this.isDoubleMode()) {
                const player1Pairs = this.players[0].pairs;
                const player2Pairs = this.players[1].pairs;
                
                if (player1Pairs > player2Pairs) {
                    this.winner = 0;
                } else if (player2Pairs > player1Pairs) {
                    this.winner = 1;
                } else {
                    this.winner = -1;
                }
            } else {
                this.winner = 0;
            }
        } else {
            this.winner = -2;
        }
        
        Storage.clearGame();
    }
    
    pause() {
        if (this.state === CONSTANTS.GAME_STATE.PLAYING) {
            this.state = CONSTANTS.GAME_STATE.PAUSED;
        }
    }
    
    resume() {
        if (this.state === CONSTANTS.GAME_STATE.PAUSED) {
            this.state = CONSTANTS.GAME_STATE.PLAYING;
        }
    }
    
    toJSON() {
        return {
            state: this.state,
            gridSize: this.gridSize,
            gameMode: this.gameMode,
            timeLimit: this.timeLimit,
            enableSpecialCards: this.enableSpecialCards,
            currentPlayer: this.currentPlayer,
            players: this.players,
            cards: this.cards.map(card => card.toJSON()),
            flippedCards: this.flippedCards.map(card => card.id),
            moves: this.moves,
            elapsedSeconds: this.elapsedSeconds,
            timeLeft: this.timeLeft,
            winner: this.winner,
            peekMode: this.peekMode,
            peekCardId: this.peekCardId,
            freezeNextPlayer: this.freezeNextPlayer
        };
    }
    
    static fromJSON(json) {
        const game = new Game();
        game.state = json.state;
        game.gridSize = json.gridSize;
        game.gameMode = json.gameMode;
        game.timeLimit = json.timeLimit;
        game.enableSpecialCards = json.enableSpecialCards;
        game.currentPlayer = json.currentPlayer;
        game.players = json.players;
        game.cards = json.cards.map(cardJson => Card.fromJSON(cardJson));
        game.flippedCards = json.flippedCards.map(id => game.getCardById(id)).filter(c => c);
        game.moves = json.moves;
        game.elapsedSeconds = json.elapsedSeconds;
        game.timeLeft = json.timeLeft;
        game.winner = json.winner;
        game.peekMode = json.peekMode || false;
        game.peekCardId = json.peekCardId || null;
        game.freezeNextPlayer = json.freezeNextPlayer || false;
        return game;
    }
    
    save() {
        Storage.saveGame(this.toJSON());
    }
    
    static load() {
        const data = Storage.loadGame();
        if (!data) return null;
        return Game.fromJSON(data);
    }
}
