const QuestionGenerator = {
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    generateAddition(difficultyConfig) {
        let a, b;
        const max = difficultyConfig.maxNumber;

        if (!difficultyConfig.hasCarry) {
            a = this.randomInt(0, Math.min(9, max));
            b = this.randomInt(0, Math.min(9 - a, max));
        } else {
            a = this.randomInt(0, max);
            b = this.randomInt(0, max);
        }

        return {
            num1: a,
            num2: b,
            operator: '+',
            answer: a + b,
            display: `${a} + ${b} = ?`
        };
    },

    generateSubtraction(difficultyConfig) {
        let a, b;
        const max = difficultyConfig.maxNumber;

        if (!difficultyConfig.hasNegative) {
            if (!difficultyConfig.hasCarry) {
                a = this.randomInt(0, Math.min(9, max));
                b = this.randomInt(0, a);
            } else {
                a = this.randomInt(0, max);
                b = this.randomInt(0, a);
            }
        } else {
            a = this.randomInt(0, max);
            b = this.randomInt(0, max);
        }

        return {
            num1: a,
            num2: b,
            operator: '-',
            answer: a - b,
            display: `${a} - ${b} = ?`
        };
    },

    generateMultiplication(difficultyConfig) {
        const max = Math.min(12, Math.floor(Math.sqrt(difficultyConfig.maxNumber)));
        const a = this.randomInt(0, max);
        const b = this.randomInt(0, max);

        return {
            num1: a,
            num2: b,
            operator: '×',
            answer: a * b,
            display: `${a} × ${b} = ?`
        };
    },

    generateDivision(difficultyConfig) {
        let a, b, answer;
        const max = Math.min(12, Math.floor(Math.sqrt(difficultyConfig.maxNumber)));
        
        b = this.randomInt(1, max);
        answer = this.randomInt(0, max);
        a = b * answer + this.randomInt(0, b - 1);

        return {
            num1: a,
            num2: b,
            operator: '÷',
            answer: answer,
            remainder: a % b,
            display: `${a} ÷ ${b} = ?`,
            hasRemainder: a % b !== 0
        };
    },

    generate(difficulty) {
        const config = CONFIG.DIFFICULTIES[difficulty];
        const operators = config.operators;
        const operator = operators[this.randomInt(0, operators.length - 1)];

        switch (operator) {
            case '+':
                return this.generateAddition(config);
            case '-':
                return this.generateSubtraction(config);
            case '×':
                return this.generateMultiplication(config);
            case '÷':
                return this.generateDivision(config);
            default:
                return this.generateAddition(config);
        }
    },

    checkAnswer(question, userAnswer) {
        const userNum = parseInt(userAnswer, 10);
        
        if (isNaN(userNum)) {
            return false;
        }

        return userNum === question.answer;
    }
};