const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

const SUIT_COLORS = {
    hearts: '#dc2626',
    diamonds: '#dc2626',
    clubs: '#1f2937',
    spades: '#1f2937'
};

function createCard(suit, rank) {
    return {
        suit,
        rank,
        suitSymbol: SUIT_SYMBOLS[suit],
        color: SUIT_COLORS[suit]
    };
}

function getCardValue(rank) {
    if (rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
}

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push(createCard(suit, rank));
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function dealCard(deck) {
    if (deck.length === 0) {
        return null;
    }
    return deck.pop();
}

export {
    SUITS,
    RANKS,
    SUIT_SYMBOLS,
    SUIT_COLORS,
    createCard,
    getCardValue,
    createDeck,
    shuffleDeck,
    dealCard
};
