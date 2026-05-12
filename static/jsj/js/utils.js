class Utils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    static weightedChoice(choices, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < choices.length; i++) {
            random -= weights[i];
            if (random <= 0) return choices[i];
        }
        
        return choices[choices.length - 1];
    }

    static circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    }

    static rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    static degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    static radToDeg(rad) {
        return rad * (180 / Math.PI);
    }

    static getRandomSpawnPosition(canvasWidth, canvasHeight, margin = 50) {
        const side = Math.floor(Math.random() * 4);
        let x, y;

        switch (side) {
            case 0:
                x = this.random(-margin, canvasWidth + margin);
                y = -margin;
                break;
            case 1:
                x = canvasWidth + margin;
                y = this.random(-margin, canvasHeight + margin);
                break;
            case 2:
                x = this.random(-margin, canvasWidth + margin);
                y = canvasHeight + margin;
                break;
            case 3:
                x = -margin;
                y = this.random(-margin, canvasHeight + margin);
                break;
        }

        return { x, y };
    }

    static shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
