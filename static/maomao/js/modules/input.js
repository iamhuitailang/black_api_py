export class InputHandler {
    constructor() {
        this.keys = {};
        this.keySequence = [];
        this.sequenceTimeout = null;
        this.SEQUENCE_WINDOW = 500;

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.addToSequence(e.key);
            e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    addToSequence(key) {
        const now = Date.now();
        this.keySequence.push({ key, time: now });

        this.keySequence = this.keySequence.filter(k => now - k.time < this.SEQUENCE_WINDOW);

        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        this.sequenceTimeout = setTimeout(() => {
            this.keySequence = [];
        }, this.SEQUENCE_WINDOW);
    }

    checkSpecialMove() {
        if (this.keySequence.length < 3) return false;

        const recentKeys = this.keySequence.slice(-3);
        const keys = recentKeys.map(k => k.key);

        const specialPattern1 = ['ArrowDown', 'ArrowRight', 'j'];
        const specialPattern2 = ['ArrowDown', 'ArrowRight', 'J'];
        const specialPattern3 = ['ArrowDown', 'ArrowLeft', 'j'];
        const specialPattern4 = ['ArrowDown', 'ArrowLeft', 'J'];

        const isMatch = (pattern) => {
            return pattern.every((k, i) => keys[i] === k);
        };

        return isMatch(specialPattern1) || isMatch(specialPattern2) ||
               isMatch(specialPattern3) || isMatch(specialPattern4);
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }

    getAttackKey() {
        if (this.keys['j'] || this.keys['J']) return 'light_paw';
        if (this.keys['k'] || this.keys['K']) return 'heavy_paw';
        if (this.keys['u'] || this.keys['U']) return 'light_tail';
        if (this.keys['i'] || this.keys['I']) return 'heavy_tail';
        return null;
    }
}
