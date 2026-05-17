class AIController {
    constructor(options = {}) {
        this.skill = options.skill || Config.AI.baseSkill;
        this.skillVariance = options.skillVariance || Config.AI.skillVariance;
        this.reactionTime = options.reactionTime || Config.AI.reactionTime;

        this.lastStrokeTime = 0;
        this.strokeInterval = this.calculateStrokeInterval();
        this.nextDecisionTime = 0;
        this.currentRhythm = 1;
        this.rhythmPhase = 0;
    }

    calculateStrokeInterval() {
        const baseInterval = 0.45;
        const variance = (1 - this.skill) * 0.2;
        return baseInterval + Math.random() * variance;
    }

    decide(dt, player) {
        const now = performance.now() / 1000;
        const decision = {
            stroke: false,
            breathe: false,
            turn: false,
            rhythm: this.currentRhythm
        };

        if (player.isTurning || player.isChoking || player.isBreathing) {
            return decision;
        }

        if (now >= this.lastStrokeTime + this.strokeInterval) {
            decision.stroke = true;
            this.lastStrokeTime = now;
            this.strokeInterval = this.calculateStrokeInterval();
            this.updateRhythm(player);
            decision.rhythm = this.currentRhythm;
        }

        if (player.strokeConfig.needsBreath) {
            if (player.oxygen < 25 + Math.random() * 20) {
                decision.breathe = true;
            }
        }

        if (this.shouldSprint(player)) {
            decision.rhythm = Math.min(1.3, this.currentRhythm * 1.2);
        }

        if (this.shouldConserveStamina(player)) {
            decision.rhythm = Math.max(0.7, this.currentRhythm * 0.8);
        }

        return decision;
    }

    updateRhythm(player) {
        this.rhythmPhase += 0.1;
        const baseRhythm = 0.8 + this.skill * 0.3;
        const variance = Math.sin(this.rhythmPhase) * 0.2 * (1 - this.skill);
        this.currentRhythm = Math.max(0.7, Math.min(1.3, baseRhythm + variance));
    }

    shouldSprint(player) {
        const remainingLaps = Config.GAME.TOTAL_LAPS - player.lap + 1;
        const raceProgress = player.getProgress();

        if (raceProgress > 0.7 && player.stamina > 30) {
            return true;
        }

        if (remainingLaps <= 1 && player.stamina > 50) {
            return true;
        }

        return false;
    }

    shouldConserveStamina(player) {
        if (player.stamina < 20) {
            return true;
        }

        if (player.lap === 1 && player.stamina < 40) {
            return true;
        }

        return false;
    }

    getTurnTaps(turnTime) {
        const minTaps = Math.ceil(Config.TURN.requiredTaps * 0.7);
        const maxTaps = Config.TURN.requiredTaps;
        const skillFactor = 0.7 + this.skill * 0.3;
        const targetTaps = Math.round(minTaps + (maxTaps - minTaps) * skillFactor);
        return Math.min(targetTaps, Config.TURN.requiredTaps);
    }
}

const AIFactory = {
    createOpponents(count, playerLane) {
        const opponents = [];
        const usedNames = new Set();
        const usedLanes = new Set([playerLane]);

        for (let i = 0; i < count; i++) {
            let lane;
            do {
                lane = Math.floor(Math.random() * Config.GAME.LANES);
            } while (usedLanes.has(lane));
            usedLanes.add(lane);

            let name;
            do {
                name = Config.AI.names[Math.floor(Math.random() * Config.AI.names.length)];
            } while (usedNames.has(name));
            usedNames.add(name);

            const skill = Config.AI.baseSkill + (Math.random() - 0.5) * Config.AI.skillVariance * 2;

            const strokes = Object.keys(Config.STROKES);
            const stroke = strokes[Math.floor(Math.random() * strokes.length)];

            const opponent = new Player({
                lane,
                name,
                isAI: true,
                color: Config.COLORS.ai[i % Config.COLORS.ai.length],
                stroke
            });

            opponent.aiController = new AIController({
                skill: Math.max(0.5, Math.min(0.95, skill))
            });

            opponents.push(opponent);
        }

        return opponents;
    },

    createTrainingDummy(lane) {
        const dummy = new Player({
            lane,
            name: '训练员',
            isAI: true,
            color: '#888888',
            stroke: 'freestyle'
        });

        dummy.aiController = new AIController({
            skill: 0.6,
            skillVariance: 0.1
        });

        return dummy;
    }
};
