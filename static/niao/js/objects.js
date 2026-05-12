class Bird extends PhysicsBody {
    constructor(x, y, type = 'RED') {
        const config = CONFIG.BIRD_TYPES[type];
        super(x, y, config.radius, config.mass);
        this.type = type;
        this.config = config;
        this.color = config.color;
        this.damage = config.damage;
        this.skillUsed = false;
        this.isLaunched = false;
        this.splitBirds = [];
    }

    launch(velocity) {
        this.velocity = velocity;
        this.isLaunched = true;
    }

    useSkill() {
        if (this.skillUsed || !this.isLaunched) return null;
        this.skillUsed = true;

        switch (this.config.skill) {
            case 'speed':
                this.velocity = this.velocity.mul(2.5);
                this.damage *= 2;
                return 'speed';
            case 'split':
                return this.split();
            case 'explode':
                return this.explode();
            case 'egg':
                return this.dropEgg();
            default:
                return null;
        }
    }

    split() {
        const birds = [];
        const angles = [-0.3, 0, 0.3];
        const speed = this.velocity.length();

        for (const angle of angles) {
            const bird = new Bird(this.position.x, this.position.y, 'BLUE');
            const vel = this.velocity.normalize();
            const rotated = new Vector(
                vel.x * Math.cos(angle) - vel.y * Math.sin(angle),
                vel.x * Math.sin(angle) + vel.y * Math.cos(angle)
            );
            bird.velocity = rotated.mul(speed * 0.8);
            bird.isLaunched = true;
            bird.skillUsed = true;
            birds.push(bird);
        }

        this.splitBirds = birds;
        this.isAlive = false;
        return 'split';
    }

    explode() {
        this.explosionRadius = 80;
        this.isAlive = false;
        return 'explode';
    }

    dropEgg() {
        const egg = new ExplosionEgg(this.position.x, this.position.y);
        this.egg = egg;
        return 'egg';
    }

    update() {
        super.update();
        
        if (this.position.y > CONFIG.CANVAS_HEIGHT + 100 ||
            this.position.x < -100 ||
            this.position.x > CONFIG.CANVAS_WIDTH + 100) {
            this.isAlive = false;
        }
    }
}

class ExplosionEgg extends PhysicsBody {
    constructor(x, y) {
        super(x, y, 15, 1);
        this.velocity = new Vector(0, 5);
        this.color = '#FFFFFF';
        this.isAlive = true;
        this.explosionRadius = 60;
    }

    update() {
        super.update();
        if (this.position.y >= CONFIG.CANVAS_HEIGHT - 65) {
            this.isAlive = false;
            this.shouldExplode = true;
        }
    }
}

class Pig extends PhysicsBody {
    constructor(x, y, type = 'BASIC') {
        const config = CONFIG.PIG_TYPES[type];
        super(x, y, config.radius, 0.5);
        this.type = type;
        this.config = config;
        this.color = config.color;
        this.health = config.health;
        this.maxHealth = config.health;
        this.score = config.score;
        this.isStatic = false;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.isAlive = false;
            return this.score;
        }
        return 0;
    }
}

class Block extends PhysicsBody {
    constructor(x, y, width, height, type = 'WOOD') {
        const config = CONFIG.MATERIAL_TYPES[type];
        super(x + width / 2, y + height / 2, Math.min(width, height) / 2, 2);
        this.type = type;
        this.config = config;
        this.width = width;
        this.height = height;
        this.color = config.color;
        this.health = config.health;
        this.maxHealth = config.health;
        this.damageMultiplier = config.damageMultiplier;
        this.isStatic = true;
    }

    takeDamage(damage) {
        const actualDamage = damage * this.damageMultiplier;
        this.health -= actualDamage;
        if (this.health <= 0) {
            this.isAlive = false;
            return 100;
        }
        return 0;
    }

    checkCollisionWithCircle(circle) {
        const closestX = Math.max(
            this.position.x - this.width / 2,
            Math.min(circle.position.x, this.position.x + this.width / 2)
        );
        const closestY = Math.max(
            this.position.y - this.height / 2,
            Math.min(circle.position.y, this.position.y + this.height / 2)
        );

        const distanceX = circle.position.x - closestX;
        const distanceY = circle.position.y - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        return distance < circle.radius;
    }
}

class Slingshot {
    constructor() {
        this.x = CONFIG.SLINGSHOT_X;
        this.y = CONFIG.SLINGSHOT_Y;
        this.pullX = this.x;
        this.pullY = this.y;
        this.isPulling = false;
        this.currentBird = null;
    }

    startPull(x, y) {
        this.isPulling = true;
        this.updatePull(x, y);
    }

    updatePull(x, y) {
        if (!this.isPulling) return;

        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > CONFIG.MAX_PULL_DISTANCE) {
            const ratio = CONFIG.MAX_PULL_DISTANCE / distance;
            this.pullX = this.x + dx * ratio;
            this.pullY = this.y + dy * ratio;
        } else {
            this.pullX = x;
            this.pullY = y;
        }
    }

    release() {
        if (!this.isPulling) return null;

        const dx = this.x - this.pullX;
        const dy = this.y - this.pullY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let velocity = null;
        if (distance > 5) {
            const power = (distance / CONFIG.MAX_PULL_DISTANCE) * CONFIG.MAX_SPEED;
            velocity = new Vector(dx, dy).normalize().mul(power);
        }
        
        this.isPulling = false;
        this.pullX = this.x;
        this.pullY = this.y;

        return velocity;
    }

    getPullDistance() {
        const dx = this.pullX - this.x;
        const dy = this.pullY - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    reset() {
        this.isPulling = false;
        this.pullX = this.x;
        this.pullY = this.y;
        this.currentBird = null;
    }
}

class Particle {
    constructor(x, y, color) {
        this.position = new Vector(x, y);
        this.velocity = new Vector(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10
        );
        this.color = color;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 5;
    }

    update() {
        this.position = this.position.add(this.velocity);
        this.velocity.y += 0.2;
        this.life -= this.decay;
    }

    isAlive() {
        return this.life > 0;
    }
}
