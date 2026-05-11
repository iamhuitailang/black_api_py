const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const CARD_WIDTH = 100;
const CARD_HEIGHT = 145;
const CARD_CORNER_RADIUS = 10;

const TABLE_GREEN = '#0d6b3d';
const TABLE_DARK_GREEN = '#0a502e';

function createRenderer(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = CANVAS_WIDTH * 2;
    canvas.height = CANVAS_HEIGHT * 2;
    canvas.style.width = CANVAS_WIDTH + 'px';
    canvas.style.height = CANVAS_HEIGHT + 'px';
    
    ctx.scale(2, 2);

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
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

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
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♠♥', CARD_WIDTH / 2, CARD_HEIGHT / 2 - 10);
        ctx.fillText('♦♣', CARD_WIDTH / 2, CARD_HEIGHT / 2 + 15);
    }

    function drawCardFront(card) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1.5;
        roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_CORNER_RADIUS);
        ctx.stroke();

        const color = card.color;
        const rank = card.rank;
        const symbol = card.suitSymbol;

        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(rank, 8, 6);

        ctx.font = 'bold 16px Arial';
        ctx.fillText(symbol, 8, 26);

        ctx.save();
        ctx.translate(CARD_WIDTH, CARD_HEIGHT);
        ctx.rotate(Math.PI);

        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(rank, 8, 6);

        ctx.font = 'bold 16px Arial';
        ctx.fillText(symbol, 8, 26);

        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = 'bold 48px Arial';
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

        const spacing = 28;
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
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 85, 28, 170, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillText('庄家', CANVAS_WIDTH / 2, 48);

        if (dealerValue !== null) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            roundRect(CANVAS_WIDTH / 2 + 110, 28, 65, 40, 8);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(dealerValue.toString(), CANVAS_WIDTH / 2 + 142, 48);
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 85, CANVAS_HEIGHT - 68, 170, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillText('玩家', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 48);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 + 110, CANVAS_HEIGHT - 68, 65, 40, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(playerValue.toString(), CANVAS_WIDTH / 2 + 142, CANVAS_HEIGHT - 48);
    }

    function drawBetInfo(betAmount) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        roundRect(CANVAS_WIDTH / 2 - 110, CANVAS_HEIGHT / 2 - 22, 220, 44, 8);
        ctx.fill();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`下注: ${betAmount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    function drawWelcome() {
        drawTableBackground();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('21点', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = '26px Arial';
        ctx.fillText('Blackjack', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.fillStyle = '#aaa';
        ctx.font = '18px Arial';
        ctx.fillText('点击"开始游戏"按钮开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    function drawNoChips() {
        drawTableBackground();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('筹码不足！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('你已经输光了所有筹码', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

        ctx.fillStyle = '#aaa';
        ctx.font = '16px Arial';
        ctx.fillText('点击"重新开始"按钮重置游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }

    function render(gameState) {
        if (gameState.chips <= 0 && gameState.state === 'idle') {
            drawNoChips();
            return;
        }

        drawTableBackground();

        const playerHand = gameState.playerHand;
        const dealerHand = gameState.dealerHand;

        const playerValue = playerHand.cards.length > 0 ? 
            (gameState.state === 'dealer_turn' || gameState.state === 'settlement' ? 
                calculateHandValue(playerHand) : calculateHandValue(playerHand)) : 0;

        const dealerValue = dealerHand.cards.length > 0 ? 
            (gameState.state === 'dealer_turn' || gameState.state === 'settlement' ? 
                calculateHandValue(dealerHand) : getVisibleValue(dealerHand)) : null;

        const dealerY = 120;
        const playerY = CANVAS_HEIGHT - 140;

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
        drawNoChips,
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
