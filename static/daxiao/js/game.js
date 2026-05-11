import { createDeck, shuffleDeck, dealCard } from './deck.js';
import { 
    createHand, 
    addCard, 
    flipAllCards, 
    calculateHandValue, 
    isBlackjack, 
    isBust,
    getVisibleValue
} from './hand.js';

const GAME_STATES = {
    IDLE: 'idle',
    BETTING: 'betting',
    DEALING: 'dealing',
    PLAYER_TURN: 'player_turn',
    DEALER_TURN: 'dealer_turn',
    SETTLEMENT: 'settlement',
    PAUSED: 'paused'
};

const RESULTS = {
    PLAYER_BLACKJACK: 'player_blackjack',
    PLAYER_WIN: 'player_win',
    PLAYER_BUST: 'player_bust',
    DEALER_BUST: 'dealer_bust',
    DEALER_WIN: 'dealer_win',
    PUSH: 'push'
};

function createGameState() {
    return {
        deck: [],
        playerHand: createHand(),
        dealerHand: createHand(),
        state: GAME_STATES.IDLE,
        bet: 100,
        chips: 1000,
        result: null,
        stats: {
            wins: 0,
            losses: 0,
            pushes: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalProfit: 0,
            currentScore: 0,
            highScore: 0
        }
    };
}

function initializeDeck(gameState) {
    gameState.deck = shuffleDeck(createDeck());
}

function startNewRound(gameState) {
    gameState.playerHand = createHand();
    gameState.dealerHand = createHand();
    gameState.result = null;
    initializeDeck(gameState);
}

function canPlaceBet(gameState, betAmount) {
    return betAmount > 0 && betAmount <= gameState.chips;
}

function placeBet(gameState, betAmount) {
    if (!canPlaceBet(gameState, betAmount)) {
        return false;
    }
    gameState.bet = betAmount;
    gameState.chips -= betAmount;
    gameState.state = GAME_STATES.DEALING;
    return true;
}

function dealInitialCards(gameState) {
    addCard(gameState.playerHand, dealCard(gameState.deck), false);
    addCard(gameState.dealerHand, dealCard(gameState.deck), false);
    addCard(gameState.playerHand, dealCard(gameState.deck), false);
    addCard(gameState.dealerHand, dealCard(gameState.deck), true);
}

function checkInitialBlackjack(gameState) {
    const playerBJ = isBlackjack(gameState.playerHand);
    const dealerBJ = isBlackjack(gameState.dealerHand);

    if (playerBJ && dealerBJ) {
        flipAllCards(gameState.dealerHand);
        gameState.result = RESULTS.PUSH;
        gameState.state = GAME_STATES.SETTLEMENT;
        return true;
    }

    if (playerBJ) {
        flipAllCards(gameState.dealerHand);
        gameState.result = RESULTS.PLAYER_BLACKJACK;
        gameState.state = GAME_STATES.SETTLEMENT;
        return true;
    }

    if (dealerBJ) {
        flipAllCards(gameState.dealerHand);
        gameState.result = RESULTS.DEALER_WIN;
        gameState.state = GAME_STATES.SETTLEMENT;
        return true;
    }

    gameState.state = GAME_STATES.PLAYER_TURN;
    return false;
}

function playerHit(gameState) {
    if (gameState.state !== GAME_STATES.PLAYER_TURN) return false;

    const card = dealCard(gameState.deck);
    if (card) {
        addCard(gameState.playerHand, card, false);
    }

    if (isBust(gameState.playerHand)) {
        gameState.result = RESULTS.PLAYER_BUST;
        gameState.state = GAME_STATES.SETTLEMENT;
    }

    return true;
}

function playerStand(gameState) {
    if (gameState.state !== GAME_STATES.PLAYER_TURN) return false;
    gameState.state = GAME_STATES.DEALER_TURN;
    flipAllCards(gameState.dealerHand);
    return true;
}

function playerDouble(gameState) {
    if (gameState.state !== GAME_STATES.PLAYER_TURN) return false;
    if (gameState.playerHand.cards.length !== 2) return false;
    if (gameState.chips < gameState.bet) return false;

    gameState.chips -= gameState.bet;
    gameState.bet *= 2;

    const card = dealCard(gameState.deck);
    if (card) {
        addCard(gameState.playerHand, card, false);
    }

    if (isBust(gameState.playerHand)) {
        gameState.result = RESULTS.PLAYER_BUST;
        gameState.state = GAME_STATES.SETTLEMENT;
    } else {
        gameState.state = GAME_STATES.DEALER_TURN;
        flipAllCards(gameState.dealerHand);
    }

    return true;
}

function shouldDealerHit(gameState) {
    const dealerValue = calculateHandValue(gameState.dealerHand);
    return dealerValue < 17;
}

function dealerHit(gameState) {
    if (gameState.state !== GAME_STATES.DEALER_TURN) return false;

    const card = dealCard(gameState.deck);
    if (card) {
        addCard(gameState.dealerHand, card, false);
    }

    return true;
}

function determineResult(gameState) {
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);

    if (isBust(gameState.dealerHand)) {
        gameState.result = RESULTS.DEALER_BUST;
    } else if (playerValue > dealerValue) {
        gameState.result = RESULTS.PLAYER_WIN;
    } else if (playerValue < dealerValue) {
        gameState.result = RESULTS.DEALER_WIN;
    } else {
        gameState.result = RESULTS.PUSH;
    }

    gameState.state = GAME_STATES.SETTLEMENT;
}

function settleBet(gameState) {
    const stats = gameState.stats;

    switch (gameState.result) {
        case RESULTS.PLAYER_BLACKJACK:
            const bjPayout = Math.floor(gameState.bet * 1.5);
            gameState.chips += gameState.bet + bjPayout;
            stats.wins++;
            stats.currentStreak++;
            stats.currentScore += 2;
            stats.totalProfit += bjPayout;
            break;

        case RESULTS.PLAYER_WIN:
        case RESULTS.DEALER_BUST:
            gameState.chips += gameState.bet * 2;
            stats.wins++;
            stats.currentStreak++;
            stats.currentScore += 1;
            stats.totalProfit += gameState.bet;
            break;

        case RESULTS.PUSH:
            gameState.chips += gameState.bet;
            stats.pushes++;
            stats.totalProfit += 0;
            break;

        case RESULTS.PLAYER_BUST:
        case RESULTS.DEALER_WIN:
            stats.losses++;
            stats.currentStreak = 0;
            stats.totalProfit -= gameState.bet;
            break;
    }

    if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
    }

    if (stats.currentScore > stats.highScore) {
        stats.highScore = stats.currentScore;
    }
}

function getResultMessage(result) {
    const messages = {
        [RESULTS.PLAYER_BLACKJACK]: 'Blackjack！直接获胜！',
        [RESULTS.PLAYER_WIN]: '你赢了！',
        [RESULTS.DEALER_BUST]: '庄家爆牌！你赢了',
        [RESULTS.PLAYER_BUST]: '爆牌！你输了',
        [RESULTS.DEALER_WIN]: '你输了',
        [RESULTS.PUSH]: '平局（Push）'
    };
    return messages[result] || '';
}

function resetGame(gameState) {
    gameState.playerHand = createHand();
    gameState.dealerHand = createHand();
    gameState.result = null;
    gameState.state = GAME_STATES.IDLE;
}

function resetAll(gameState) {
    const newState = createGameState();
    Object.assign(gameState, newState);
}

export {
    GAME_STATES,
    RESULTS,
    createGameState,
    initializeDeck,
    startNewRound,
    canPlaceBet,
    placeBet,
    dealInitialCards,
    checkInitialBlackjack,
    playerHit,
    playerStand,
    playerDouble,
    shouldDealerHit,
    dealerHit,
    determineResult,
    settleBet,
    getResultMessage,
    resetGame,
    resetAll,
    calculateHandValue,
    getVisibleValue
};
