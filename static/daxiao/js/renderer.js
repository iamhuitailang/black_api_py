const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 720;

const CARD_WIDTH = 120;
const CARD_HEIGHT = 170;
const CARD_CORNER_RADIUS = 8;

const TABLE_GREEN = '#0d6b3d';
const TABLE_DARK_GREEN = '#0a502e';

function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let animations = [];

    function drawTableBackground() {
        const gradient = ctx.createRadialGradient(
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
            CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2
        );
        gradient.addColorStop(0, TABLE_GREEN);
        gradient.addColorStop(1, TABLE_DARK_GREEN);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30);

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 8;
        ctx.strokeRect(25, 25, CANVAS_WIDTH - 50, CANVAS_HEIGHT - 50);

        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * CANVAS_WIDTH;
            const y = Math.random() * CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawCard(x, y, card, faceDown = false, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        if (faceDown) {
            drawCardBack();
        } else {
            drawCardFront(card);
        }

        ctx.restore();
    }

    function drawCardBack() {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
        gradient.addColorStop(0, '#1e3a5f');
        gradient.addColorStop(0.5, '#2d5a87');
        gradient.addColorStop(1, '#1e3a5f');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        roundRect(5, 5, CARD_WIDTH - 10, CARD_HEIGHT - 10, CARD_CORNER_RADIUS - 3);
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.globalAlpha = 0.3;
        for (let i = 15; i < CARD_WIDTH - 15; i += 12) {
            for (let j = 15; j < CARD_HEIGHT - 15; j += 12) {
                ctx.fillRect(i, j, 3, 3);
            }
        }
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♠♥', CARD_WIDTH / 2, CARD_HEIGHT / 2 - 8);
        ctx.fillText('♦♣', CARD_WIDTH / 2, CARD_HEIGHT / 2 + 12);
    }

    function drawCardFront(card) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.stroke();

        const color = card.color;
        const rank = card.rank;
        const symbol = card.suitSymbol;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.fillStyle = color;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(rank, 10, 8);

        ctx.font = 'bold 20px Arial';
        ctx.fillText(symbol, 10, 32);

        ctx.save();
        ctx.translate(CARD_WIDTH, CARD_HEIGHT);
        ctx.rotate(Math.PI);

        ctx.fillStyle = color;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(rank, 10, 8);

        ctx.font = 'bold 20px Arial';
        ctx.fillText(symbol, 10, 32);

        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, CARD_WIDTH / 2, CARD_HEIGHT / 2);
    }

    function roundRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function drawHand(hand, startX, startY, spreadAngle = 0.1, isDealer = false) {
        const cards = hand.cards;
        const isFaceDown = hand.isFaceDown;
        const numCards = cards.length;

        if (numCards === 0) return;

        const spacing = 25;
        const totalWidth = (numCards - 1) * spacing;
        const startOffsetX = startX - totalWidth / 2;

        for (let i = 0; i < numCards; i++) {
            const x = startOffsetX + i * spacing;
            const y = startY;
            const rotation = (i - (numCards - 1) / 2) * spreadAngle;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);

            drawCard(
                -CARD_WIDTH / 2,
                -CARD_HEIGHT / 2,
                cards[i],
                isFaceDown[i]
            );

            ctx.restore();
        }
    }

    function drawLabels(playerValue, dealerValue, isDealerTurn) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 90, 35, 180, 45, 8);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillText('庄家', CANVAS_WIDTH / 2, 57);

        if (dealerValue !== null) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            roundRect(CANVAS_WIDTH / 2 + 110, 35, 70, 45, 8);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(dealerValue.toString(), CANVAS_WIDTH / 2 + 135, 57);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 90, CANVAS_HEIGHT - 80, 180, 45, 8);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillText('玩家', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 57);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 + 110, CANVAS_HEIGHT - 80, 70, 45, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(playerValue.toString(), CANVAS_WIDTH / 2 + 135, CANVAS_HEIGHT - 57);
    }

    function drawBetInfo(betAmount) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 110, CANVAS_HEIGHT / 2 - 25, 220, 50, 8);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`下注: ${betAmount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    function drawWelcome() {
        drawTableBackground();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('21点', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Blackjack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText('点击"开始游戏"按钮开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    function render(gameState) {
        drawTableBackground();

        const playerHand = gameState.playerHand;
        const dealerHand = gameState.dealerHand;

        const playerValue = playerHand.cards.length > 0 ? 
            (gameState.state === 'dealer_turn' || gameState.state === 'settlement' ? 
                calculateHandValue(playerHand) : calculateHandValue(playerHand)) : 0;

        const dealerValue = dealerHand.cards.length > 0 ? 
            (gameState.state === 'dealer_turn' || gameState.state === 'settlement' ? 
                calculateHandValue(dealerHand) : getVisibleValue(dealerHand)) : null;

        const dealerY = 110;
        const playerY = CANVAS_HEIGHT - 130;

        drawHand(dealerHand, CANVAS_WIDTH / 2, dealerY, 0.05, true);
        drawHand(playerHand, CANVAS_WIDTH / 2, playerY, 0.05, false);

        if (gameState.state !== 'idle' && playerHand.cards.length > 0) {
            drawLabels(playerValue, dealerValue, gameState.state === 'dealer_turn');
        }

        if (gameState.state === 'dealing' || 
            gameState.state === 'player_turn' || 
            gameState.state === 'dealer_turn') {
            drawBetInfo(gameState.bet);
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

    function clear() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function resize(width, height) {
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }

    function getCanvas() {
        return canvas;
    }

    function getContext() {
        return ctx;
    }

    return {
        drawTableBackground,
        drawCard,
        drawHand,
        drawLabels,
        drawBetInfo,
        drawWelcome,
        render,
        clear,
        resize,
        getCanvas,
        getContext
    };
}

export {
    createRenderer,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    CARD_WIDTH,
    CARD_HEIGHT
};
