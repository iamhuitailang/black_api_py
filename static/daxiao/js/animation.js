const ANIMATION_DURATION = 400;
const FLIP_DURATION = 300;
const CHIP_DURATION = 250;

function easeOutQuad(t) {
    return t * (2 - t);
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function createCardDealAnimation(card, fromX, fromY, toX, toY, isFaceDown = false) {
    return {
        type: 'deal',
        card,
        fromX,
        fromY,
        toX,
        toY,
        isFaceDown,
        progress: 0,
        duration: ANIMATION_DURATION,
        complete: false
    };
}

function createCardFlipAnimation(card, x, y) {
    return {
        type: 'flip',
        card,
        x,
        y,
        progress: 0,
        duration: FLIP_DURATION,
        complete: false
    };
}

function createChipAnimation(fromX, fromY, toX, toY, amount, isWin = true) {
    return {
        type: 'chip',
        fromX,
        fromY,
        toX,
        toY,
        amount,
        isWin,
        progress: 0,
        duration: CHIP_DURATION,
        complete: false
    };
}

function createAnimationManager(renderer) {
    const animations = [];
    let isAnimating = false;
    let animationFrameId = null;
    let lastTime = 0;

    function addAnimation(animation) {
        animations.push(animation);
        if (!isAnimating) {
            startAnimationLoop();
        }
    }

    function startAnimationLoop() {
        isAnimating = true;
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(update);
    }

    function stopAnimationLoop() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function update(currentTime) {
        if (!isAnimating) return;

        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        let hasActiveAnimations = false;

        for (const animation of animations) {
            if (animation.complete) continue;

            animation.progress += deltaTime / animation.duration;
            
            if (animation.progress >= 1) {
                animation.progress = 1;
                animation.complete = true;
            } else {
                hasActiveAnimations = true;
            }
        }

        const activeAnimations = animations.filter(a => !a.complete);
        if (activeAnimations.length === 0) {
            stopAnimationLoop();
        } else {
            animationFrameId = requestAnimationFrame(update);
        }
    }

    function updateAndRender(gameState) {
        const ctx = renderer.getContext();
        const canvas = renderer.getCanvas();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderer.drawTableBackground();

        const playerHand = gameState.playerHand;
        const dealerHand = gameState.dealerHand;

        const dealerY = 110;
        const playerY = canvas.height - 130;
        const centerX = canvas.width / 2;

        const playerSpacing = 25;
        const dealerSpacing = 25;

        const playerTotalWidth = (playerHand.cards.length - 1) * playerSpacing;
        const playerStartX = centerX - playerTotalWidth / 2;

        const dealerTotalWidth = (dealerHand.cards.length - 1) * dealerSpacing;
        const dealerStartX = centerX - dealerTotalWidth / 2;

        for (let i = 0; i < dealerHand.cards.length; i++) {
            const card = dealerHand.cards[i];
            const isFaceDown = dealerHand.isFaceDown[i];
            const targetX = dealerStartX + i * dealerSpacing;
            const targetY = dealerY;

            const dealAnimation = animations.find(a => 
                a.type === 'deal' && 
                a.card === card && 
                !a.complete
            );

            if (dealAnimation) {
                const t = easeOutQuad(dealAnimation.progress);
                const x = dealAnimation.fromX + (targetX - dealAnimation.fromX) * t;
                const y = dealAnimation.fromY + (targetY - dealAnimation.fromY) * t;

                ctx.save();
                ctx.translate(x, y);
                renderer.drawCard(-40, -57.5, card, isFaceDown);
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(targetX, targetY);
                const rotation = (i - (dealerHand.cards.length - 1) / 2) * 0.05;
                ctx.rotate(rotation);
                renderer.drawCard(-40, -57.5, card, isFaceDown);
                ctx.restore();
            }
        }

        for (let i = 0; i < playerHand.cards.length; i++) {
            const card = playerHand.cards[i];
            const isFaceDown = playerHand.isFaceDown[i];
            const targetX = playerStartX + i * playerSpacing;
            const targetY = playerY;

            const dealAnimation = animations.find(a => 
                a.type === 'deal' && 
                a.card === card && 
                !a.complete
            );

            if (dealAnimation) {
                const t = easeOutQuad(dealAnimation.progress);
                const x = dealAnimation.fromX + (targetX - dealAnimation.fromX) * t;
                const y = dealAnimation.fromY + (targetY - dealAnimation.fromY) * t;

                ctx.save();
                ctx.translate(x, y);
                renderer.drawCard(-40, -57.5, card, isFaceDown);
                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(targetX, targetY);
                const rotation = (i - (playerHand.cards.length - 1) / 2) * 0.05;
                ctx.rotate(rotation);
                renderer.drawCard(-40, -57.5, card, isFaceDown);
                ctx.restore();
            }
        }

        const chipAnimations = animations.filter(a => a.type === 'chip' && !a.complete);
        for (const anim of chipAnimations) {
            const t = easeOutQuad(anim.progress);
            const x = anim.fromX + (anim.toX - anim.fromX) * t;
            const y = anim.fromY + (anim.toY - anim.fromY) * t;

            ctx.fillStyle = anim.isWin ? '#4ade80' : '#f87171';
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(anim.amount > 0 ? '+' + anim.amount : anim.amount.toString(), x, y);
        }

        if (gameState.state !== 'idle' && playerHand.cards.length > 0) {
            const playerValue = calculateHandValue(playerHand);
            const dealerValue = gameState.state === 'dealer_turn' || gameState.state === 'settlement' ? 
                calculateHandValue(dealerHand) : getVisibleValue(dealerHand);
            
            renderer.drawLabels(playerValue, dealerValue, gameState.state === 'dealer_turn');
        }

        if (gameState.state === 'dealing' || 
            gameState.state === 'player_turn' || 
            gameState.state === 'dealer_turn') {
            renderer.drawBetInfo(gameState.bet);
        }
    }

    function calculateHandValue(hand) {
        let value = 0;
        let aceCount = 0;

        for (let i = 0; i < hand.cards.length; i++) {
            if (hand.isFaceDown[i]) continue;
            
            const card = hand.cards[i];
            const cardValue = getCardValue(card.rank);
            value += cardValue;
            
            if (card.rank === 'A') {
                aceCount++;
            }
        }

        while (value > 21 && aceCount > 0) {
            value -= 10;
            aceCount--;
        }

        return value;
    }

    function getCardValue(rank) {
        if (rank === 'A') return 11;
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        return parseInt(rank);
    }

    function getVisibleValue(hand) {
        let value = 0;
        let visible = false;
        
        for (let i = 0; i < hand.cards.length; i++) {
            if (!hand.isFaceDown[i]) {
                const cardValue = getCardValue(hand.cards[i].rank);
                if (hand.cards[i].rank === 'A') {
                    if (value + 11 <= 21) {
                        value += 11;
                    } else {
                        value += 1;
                    }
                } else {
                    value += cardValue;
                }
                visible = true;
            }
        }
        
        return visible ? value : null;
    }

    function waitForAnimations(timeout = 2000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            function check() {
                const allComplete = animations.every(a => a.complete);
                const elapsed = Date.now() - startTime;
                
                if (allComplete || elapsed > timeout) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            }
            
            check();
        });
    }

    function clearAll() {
        animations.length = 0;
        stopAnimationLoop();
    }

    function isActive() {
        return animations.some(a => !a.complete);
    }

    return {
        addAnimation,
        updateAndRender,
        waitForAnimations,
        clearAll,
        isActive,
        createCardDealAnimation,
        createCardFlipAnimation,
        createChipAnimation
    };
}

export {
    createAnimationManager,
    createCardDealAnimation,
    createCardFlipAnimation,
    createChipAnimation,
    ANIMATION_DURATION,
    FLIP_DURATION,
    CHIP_DURATION,
    easeOutQuad,
    easeInOutQuad
};
