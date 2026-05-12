class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isDragging = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        if (!this.game.canShoot) return;
        if (!this.game.slingshot.currentBird) return;
        
        const coords = this.getCanvasCoordinates(e);
        const bird = this.game.slingshot.currentBird;
        
        const dx = coords.x - bird.position.x;
        const dy = coords.y - bird.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
            this.isDragging = true;
            this.game.slingshot.isPulling = true;
            this.game.slingshot.pullX = coords.x;
            this.game.slingshot.pullY = coords.y;
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        if (!this.game.slingshot.currentBird) return;
        
        const coords = this.getCanvasCoordinates(e);
        
        const dx = coords.x - this.game.slingshot.x;
        const dy = coords.y - this.game.slingshot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > CONFIG.MAX_PULL_DISTANCE) {
            const ratio = CONFIG.MAX_PULL_DISTANCE / distance;
            this.game.slingshot.pullX = this.game.slingshot.x + dx * ratio;
            this.game.slingshot.pullY = this.game.slingshot.y + dy * ratio;
        } else {
            this.game.slingshot.pullX = coords.x;
            this.game.slingshot.pullY = coords.y;
        }
        
        this.game.slingshot.currentBird.position.x = this.game.slingshot.pullX;
        this.game.slingshot.currentBird.position.y = this.game.slingshot.pullY;
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        if (!this.game.slingshot.currentBird) return;
        
        this.isDragging = false;
        
        const dx = this.game.slingshot.x - this.game.slingshot.pullX;
        const dy = this.game.slingshot.y - this.game.slingshot.pullY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const power = Math.min((distance / CONFIG.MAX_PULL_DISTANCE) * CONFIG.MAX_SPEED, CONFIG.MAX_SPEED);
            const velocity = new Vector(dx, dy).normalize().mul(power);
            
            this.game.shootBird(velocity);
        } else {
            this.game.slingshot.currentBird.position.x = this.game.slingshot.x;
            this.game.slingshot.currentBird.position.y = this.game.slingshot.y - 20;
        }
        
        this.game.slingshot.isPulling = false;
        this.game.slingshot.pullX = this.game.slingshot.x;
        this.game.slingshot.pullY = this.game.slingshot.y;
    }

    handleClick(e) {
        if (this.game.isPaused) return;
        
        const flyingBird = this.game.getFlyingBird();
        if (flyingBird && !flyingBird.skillUsed) {
            const skillResult = flyingBird.useSkill();
            
            if (skillResult === 'split' && flyingBird.splitBirds && flyingBird.splitBirds.length > 0) {
                for (const splitBird of flyingBird.splitBirds) {
                    this.game.birds.push(splitBird);
                    this.game.physics.addBody(splitBird);
                }
            }
            
            if (skillResult === 'egg' && flyingBird.egg) {
                this.game.eggs.push(flyingBird.egg);
                this.game.physics.addBody(flyingBird.egg);
            }
            
            if (skillResult === 'explode') {
                this.game.createExplosion(flyingBird.position.x, flyingBird.position.y, flyingBird.explosionRadius);
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.handleMouseDown(e);
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.handleMouseMove(e);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }
}
