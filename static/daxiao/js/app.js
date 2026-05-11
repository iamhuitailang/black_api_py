import { createGameState, placeBet, dealInitialCards, checkInitialBlackjack,
         playerHit, playerStand, playerDouble, shouldDealerHit, dealerHit,
         determineResult, settleBet, getResultMessage, resetGame, resetAll,
         calculateHandValue, GAME_STATES, startNewRound, canPlaceBet,
         RESULTS } from './game.js';
import { createRenderer } from './renderer.js';
import { createAnimationManager, createCardDealAnimation } from './animation.js';
import { createUI } from './ui.js';
import { loadGameState, applySavedState, saveGameState, clearGameState, setupAutoSave } from './storage.js';

function initGame() {
    const canvas = document.getElementById('game-canvas');
    const renderer = createRenderer(canvas);
    const animManager = createAnimationManager(renderer);
    
    const gameState = createGameState();
    
    const savedState = loadGameState();
    let previousState = null;
    let shouldResumeDealerTurn = false;
    
    if (savedState) {
        applySavedState(gameState, savedState);
        
        if (gameState.state === GAME_STATES.PAUSED) {
            previousState = savedState.previousState || GAME_STATES.IDLE;
        }
        
        if (gameState.state === GAME_STATES.DEALER_TURN) {
            shouldResumeDealerTurn = true;
        }
    }

    const ui = createUI(gameState, {
        onStart: handleStart,
        onHit: handleHit,
        onStand: handleStand,
        onDouble: handleDouble,
        onNewGame: handleNewGame,
        onPause: handlePause,
        onResume: handleResume,
        onRestart: handleRestart,
        onQuit: handleQuit
    });

    function render() {
        if (animManager.isActive()) {
            animManager.updateAndRender(gameState);
        } else {
            if (gameState.state === GAME_STATES.IDLE && gameState.playerHand.cards.length === 0) {
                renderer.drawWelcome();
            } else {
                renderer.render(gameState);
            }
        }
        requestAnimationFrame(render);
    }

    function addDealAnimations() {
        const canvas = renderer.getCanvas();
        const deckX = canvas.width - 100;
        const deckY = 50;
        const centerX = canvas.width / 2;

        const playerY = canvas.height - 130;
        const dealerY = 110;

        const playerCards = gameState.playerHand.cards;
        const dealerCards = gameState.dealerHand.cards;

        const playerSpacing = 25;
        const dealerSpacing = 25;

        const playerTotalWidth = (playerCards.length - 1) * playerSpacing;
        const playerStartX = centerX - playerTotalWidth / 2;

        const dealerTotalWidth = (dealerCards.length - 1) * dealerSpacing;
        const dealerStartX = centerX - dealerTotalWidth / 2;

        const delays = [0, 300, 150, 450];
        let delayIndex = 0;

        setTimeout(() => {
            const targetX = dealerStartX;
            const targetY = dealerY;
            const anim = createCardDealAnimation(
                dealerCards[0], deckX, deckY, targetX, targetY, false
            );
            animManager.addAnimation(anim);
        }, delays[delayIndex++]);

        setTimeout(() => {
            const targetX = playerStartX;
            const targetY = playerY;
            const anim = createCardDealAnimation(
                playerCards[0], deckX, deckY, targetX, targetY, false
            );
            animManager.addAnimation(anim);
        }, delays[delayIndex++]);

        setTimeout(() => {
            const targetX = dealerStartX + dealerSpacing;
            const targetY = dealerY;
            const anim = createCardDealAnimation(
                dealerCards[1], deckX, deckY, targetX, targetY, true
            );
            animManager.addAnimation(anim);
        }, delays[delayIndex++]);

        setTimeout(() => {
            const targetX = playerStartX + playerSpacing;
            const targetY = playerY;
            const anim = createCardDealAnimation(
                playerCards[1], deckX, deckY, targetX, targetY, false
            );
            animManager.addAnimation(anim);
        }, delays[delayIndex++]);
    }

    function addHitAnimation(isPlayer = true) {
        const canvas = renderer.getCanvas();
        const deckX = canvas.width - 100;
        const deckY = 50;
        const centerX = canvas.width / 2;

        const hand = isPlayer ? gameState.playerHand : gameState.dealerHand;
        const cards = hand.cards;
        const lastCard = cards[cards.length - 1];

        const spacing = 25;
        const totalWidth = (cards.length - 1) * spacing;
        const startX = centerX - totalWidth / 2;
        const targetX = startX + (cards.length - 1) * spacing;
        const targetY = isPlayer ? canvas.height - 130 : 110;

        const anim = createCardDealAnimation(
            lastCard, deckX, deckY, targetX, targetY, false
        );
        animManager.addAnimation(anim);
    }

    async function handleStart(betAmount) {
        if (!canPlaceBet(gameState, betAmount)) {
            ui.showStatusMessage('筹码不足！', 1500);
            return;
        }

        startNewRound(gameState);
        placeBet(gameState, betAmount);
        dealInitialCards(gameState);
        addDealAnimations();
        ui.updateAll(gameState);
        saveGameState(gameState);

        await animManager.waitForAnimations(2000);

        const hasBlackjack = checkInitialBlackjack(gameState);
        
        if (hasBlackjack) {
            settleBet(gameState);
            saveGameState(gameState);
            
            const message = getResultMessage(gameState.result);
            ui.showStatusMessage(message, 0);
            ui.updateAll(gameState);
        } else {
            ui.updateAll(gameState);
        }
    }

    function handleHit() {
        const previousCardCount = gameState.playerHand.cards.length;
        playerHit(gameState);
        
        if (gameState.playerHand.cards.length > previousCardCount) {
            addHitAnimation(true);
        }
        
        saveGameState(gameState);
        ui.updateAll(gameState);

        if (gameState.state === GAME_STATES.SETTLEMENT) {
            settleBet(gameState);
            saveGameState(gameState);
            
            const message = getResultMessage(gameState.result);
            ui.showStatusMessage(message, 0);
            ui.updateAll(gameState);
        }
    }

    async function handleStand() {
        playerStand(gameState);
        saveGameState(gameState);
        ui.updateAll(gameState);

        await runDealerTurn();
    }

    async function handleDouble() {
        if (gameState.chips < gameState.bet) {
            ui.showStatusMessage('筹码不足，无法双倍下注！', 1500);
            return;
        }

        const previousCardCount = gameState.playerHand.cards.length;
        playerDouble(gameState);
        
        if (gameState.playerHand.cards.length > previousCardCount) {
            addHitAnimation(true);
        }
        
        saveGameState(gameState);
        ui.updateAll(gameState);

        if (gameState.state === GAME_STATES.SETTLEMENT) {
            settleBet(gameState);
            saveGameState(gameState);
            
            const message = getResultMessage(gameState.result);
            ui.showStatusMessage(message, 0);
            ui.updateAll(gameState);
        } else if (gameState.state === GAME_STATES.DEALER_TURN) {
            await runDealerTurn();
        }
    }

    async function runDealerTurn() {
        while (gameState.state === GAME_STATES.DEALER_TURN && shouldDealerHit(gameState)) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const previousCardCount = gameState.dealerHand.cards.length;
            dealerHit(gameState);
            
            if (gameState.dealerHand.cards.length > previousCardCount) {
                addHitAnimation(false);
                await animManager.waitForAnimations(1000);
            }
            
            saveGameState(gameState);
            ui.updateAll(gameState);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        determineResult(gameState);
        settleBet(gameState);
        saveGameState(gameState);

        const message = getResultMessage(gameState.result);
        ui.showStatusMessage(message, 0);
        ui.updateAll(gameState);
    }

    function handleNewGame() {
        resetGame(gameState);
        animManager.clearAll();
        ui.hideStatusMessage();
        ui.updateAll(gameState);
        ui.setBetInputMax(gameState.chips);
        saveGameState(gameState);
    }

    function handlePause() {
        if (gameState.state === GAME_STATES.IDLE) return;
        if (gameState.state === GAME_STATES.SETTLEMENT) return;
        if (gameState.state === GAME_STATES.PAUSED) return;

        previousState = gameState.state;
        gameState.state = GAME_STATES.PAUSED;
        
        saveGameState(gameState, { previousState });
        
        ui.showPauseModal();
    }

    function handleResume() {
        gameState.state = previousState;
        ui.hidePauseModal();
        ui.updateAll(gameState);
        saveGameState(gameState);
        
        if (shouldResumeDealerTurn && gameState.state === GAME_STATES.DEALER_TURN) {
            shouldResumeDealerTurn = false;
            runDealerTurn();
        }
    }

    function handleRestart() {
        const chipsBefore = gameState.chips;
        const statsBefore = { ...gameState.stats };
        
        resetAll(gameState);
        animManager.clearAll();
        ui.hidePauseModal();
        ui.hideStatusMessage();
        
        gameState.chips = chipsBefore;
        gameState.stats = statsBefore;
        
        ui.updateAll(gameState);
        ui.setBetInputMax(gameState.chips);
        saveGameState(gameState);
    }

    function handleQuit() {
        ui.hideQuitModal();
        saveGameState(gameState);
        resetGame(gameState);
        animManager.clearAll();
        ui.hideStatusMessage();
        ui.updateAll(gameState);
        ui.setBetInputMax(gameState.chips);
    }

    function initializeFromSavedState() {
        if (!savedState) return;

        ui.updateAll(gameState);
        ui.setBetInputMax(gameState.chips);

        if (gameState.state === GAME_STATES.PAUSED) {
            ui.showPauseModal();
        } else if (gameState.state === GAME_STATES.SETTLEMENT && gameState.result) {
            const message = getResultMessage(gameState.result);
            ui.showStatusMessage(message, 0);
        }
        
        if (shouldResumeDealerTurn) {
            ui.showStatusMessage('游戏已恢复', 2000);
            setTimeout(() => {
                ui.hideStatusMessage();
            }, 2000);
        }
    }

    ui.bindEvents();
    initializeFromSavedState();
    setupAutoSave(gameState);
    render();
}

document.addEventListener('DOMContentLoaded', initGame);
