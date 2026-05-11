import { getCardValue } from './deck.js';

function createHand() {
    return {
        cards: [],
        isFaceDown: []
    };
}

function addCard(hand, card, faceDown = false) {
    hand.cards.push(card);
    hand.isFaceDown.push(faceDown);
}

function flipCard(hand, index) {
    if (index >= 0 && index < hand.isFaceDown.length) {
        hand.isFaceDown[index] = false;
    }
}

function flipAllCards(hand) {
    hand.isFaceDown = hand.isFaceDown.map(() => false);
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

function isBlackjack(hand) {
    if (hand.cards.length !== 2) return false;
    
    const hasAce = hand.cards.some(card => card.rank === 'A');
    const hasTen = hand.cards.some(card => {
        return ['10', 'J', 'Q', 'K'].includes(card.rank);
    });
    
    return hasAce && hasTen;
}

function isBust(hand) {
    return calculateHandValue(hand) > 21;
}

function canDouble(hand) {
    return hand.cards.length === 2;
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

export {
    createHand,
    addCard,
    flipCard,
    flipAllCards,
    calculateHandValue,
    isBlackjack,
    isBust,
    canDouble,
    getVisibleValue
};
