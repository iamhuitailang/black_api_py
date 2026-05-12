class Candy extends PhysicsBody {
    constructor(x, y) {
        super(x, y, CONFIG.CANDY_RADIUS);
        this.colorIndex = Math.floor(Math.random() * CONFIG.COLORS.CANDY.length);
        this.color = CONFIG.COLORS.CANDY[this.colorIndex];
        this.collectedStars = 0;
        this.inBubble = false;
        this.inSpiderweb = false;
        this.hasBalloon = false;
        this.released = false;
        this.releaseVelocity = null;
    }

    applyGravity() {
        if (!this.inBubble) {
            this.applyForce(new Vector(0, CONFIG.GRAVITY));
        }
    }

    applyBubbleEffect() {
        if (this.inBubble) {
            this.applyForce(new Vector(0, -CONFIG.GRAVITY * 0.8));
            this.velocity = this.velocity.mul(0.98);
        }
    }

    applySpiderwebEffect() {
        if (this.inSpiderweb) {
            this.velocity = this.velocity.mul(CONFIG.SPIDERWEB_DAMPING);
        }
    }

    applyBalloonEffect() {
        if (this.hasBalloon) {
            this.applyForce(new Vector(0, CONFIG.BALLOON_LIFT));
        }
    }

    update(width, height) {
        this.applyGravity();
        this.applyBubbleEffect();
        this.applySpiderwebEffect();
        this.applyBalloonEffect();
        super.update();
        CollisionDetector.checkBoundary(this, width, height);
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            vx: this.velocity.x,
            vy: this.velocity.y,
            colorIndex: this.colorIndex,
            collectedStars: this.collectedStars,
            inBubble: this.inBubble,
            inSpiderweb: this.inSpiderweb,
            hasBalloon: this.hasBalloon,
            released: this.released
        };
    }

    static deserialize(data) {
        const candy = new Candy(data.x, data.y);
        candy.velocity = new Vector(data.vx, data.vy);
        candy.colorIndex = data.colorIndex;
        candy.color = CONFIG.COLORS.CANDY[data.colorIndex];
        candy.collectedStars = data.collectedStars || 0;
        candy.inBubble = data.inBubble || false;
        candy.inSpiderweb = data.inSpiderweb || false;
        candy.hasBalloon = data.hasBalloon || false;
        candy.released = data.released || false;
        return candy;
    }
}

class Monster {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.MONSTER_RADIUS;
        this.mouthOpen = false;
        this.eyeOffset = 0;
    }

    update(candyPosition) {
        const dx = candyPosition.x - this.position.x;
        this.eyeOffset = Math.max(-8, Math.min(8, dx * 0.05));
        
        const dist = this.position.distance(candyPosition);
        this.mouthOpen = dist < this.radius * 1.5;
    }

    canEat(candy) {
        const dist = this.position.distance(candy.position);
        return dist < this.radius + candy.radius * 0.5;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y
        };
    }

    static deserialize(data) {
        return new Monster(data.x, data.y);
    }
}

class Star {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.STAR_RADIUS;
        this.collected = false;
        this.rotation = 0;
        this.pulseScale = 1;
    }

    update() {
        this.rotation += 0.02;
        this.pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    }

    checkCollision(candy) {
        if (this.collected) return false;
        const dist = this.position.distance(candy.position);
        if (dist < this.radius + candy.radius) {
            this.collected = true;
            candy.collectedStars++;
            return true;
        }
        return false;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            collected: this.collected
        };
    }

    static deserialize(data) {
        const star = new Star(data.x, data.y);
        star.collected = data.collected || false;
        return star;
    }
}

class Bubble {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.BUBBLE_RADIUS;
        this.active = true;
        this.wobble = 0;
    }

    update() {
        this.wobble += 0.05;
    }

    checkCollision(candy) {
        if (!this.active) return false;
        const dist = this.position.distance(candy.position);
        if (dist < this.radius) {
            candy.inBubble = true;
            this.active = false;
            return true;
        }
        return false;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            active: this.active
        };
    }

    static deserialize(data) {
        const bubble = new Bubble(data.x, data.y);
        bubble.active = data.active !== false;
        return bubble;
    }
}

class Magnet {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.MAGNET_RADIUS;
        this.active = true;
        this.rotation = 0;
    }

    update() {
        this.rotation += 0.03;
    }

    applyForce(candy) {
        if (!this.active) return;
        const dist = this.position.distance(candy.position);
        if (dist < this.radius * 2 && dist > 0) {
            const force = this.position.sub(candy.position).normalize().mul(CONFIG.MAGNET_STRENGTH);
            candy.applyForce(force);
        }
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            active: this.active
        };
    }

    static deserialize(data) {
        const magnet = new Magnet(data.x, data.y);
        magnet.active = data.active !== false;
        return magnet;
    }
}

class Spiderweb {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.SPIDERWEB_RADIUS;
        this.active = true;
    }

    update() {}

    checkCollision(candy) {
        if (!this.active) return false;
        const dist = this.position.distance(candy.position);
        if (dist < this.radius) {
            candy.inSpiderweb = true;
            return true;
        }
        candy.inSpiderweb = false;
        return false;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            active: this.active
        };
    }

    static deserialize(data) {
        const spiderweb = new Spiderweb(data.x, data.y);
        spiderweb.active = data.active !== false;
        return spiderweb;
    }
}

class Balloon {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = CONFIG.BALLOON_RADIUS;
        this.active = true;
        this.swayOffset = 0;
    }

    update() {
        this.swayOffset += 0.03;
    }

    checkCollision(candy) {
        if (!this.active) return false;
        const dist = this.position.distance(candy.position);
        if (dist < this.radius + candy.radius) {
            candy.hasBalloon = true;
            this.active = false;
            return true;
        }
        return false;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y,
            active: this.active
        };
    }

    static deserialize(data) {
        const balloon = new Balloon(data.x, data.y);
        balloon.active = data.active !== false;
        return balloon;
    }
}

class AnchorPoint {
    constructor(x, y) {
        this.position = new Vector(x, y);
        this.radius = 12;
    }

    serialize() {
        return {
            x: this.position.x,
            y: this.position.y
        };
    }

    static deserialize(data) {
        return new AnchorPoint(data.x, data.y);
    }
}