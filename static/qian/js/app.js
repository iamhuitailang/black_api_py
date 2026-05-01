const App = {
    canvas: null,
    state: 'initial',
    currentFortune: null,
    mousePos: { x: 0, y: 0 },
    buttonHovered: false,
    
    states: {
        INITIAL: 'initial',
        SHOWING_DAILY: 'showing_daily',
        SHAKING: 'shaking',
        STICK_FLYING: 'stick_flying',
        PAPER_UNFOLDING: 'paper_unfolding',
        SHOWING_RESULT: 'showing_result'
    },

    init() {
        this.canvas = document.getElementById('fortuneCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        Renderer.init(this.canvas);
        Animation.start();
        
        this.setupEventListeners();
        this.loadDailyFortune();
        this.loop();
    },

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    },

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        this.updateButtonHover();
    },

    handleTouchMove(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
        this.updateButtonHover();
    },

    handleClick(e) {
        if (this.buttonHovered && !Animation.isAnimating()) {
            this.startDraw();
        }
    },

    handleTouchEnd(e) {
        if (this.buttonHovered && !Animation.isAnimating()) {
            this.startDraw();
        }
    },

    updateButtonHover() {
        const buttonX = (Renderer.width - 180) / 2;
        const buttonY = Renderer.height - 100;
        const buttonWidth = 180;
        const buttonHeight = 50;
        
        this.buttonHovered = 
            this.mousePos.x >= buttonX &&
            this.mousePos.x <= buttonX + buttonWidth &&
            this.mousePos.y >= buttonY &&
            this.mousePos.y <= buttonY + buttonHeight;
    },

    loadDailyFortune() {
        this.currentFortune = Lottery.getOrCreateDailyFortune();
        this.state = this.states.SHOWING_DAILY;
    },

    startDraw() {
        if (Animation.isAnimating()) return;
        
        const centerX = Renderer.width / 2;
        const centerY = Renderer.height / 2;
        
        this.state = this.states.SHAKING;
        
        const shakeAnim = Animation.createShakeAnimation(1500);
        shakeAnim.onComplete = () => {
            this.startStickFly();
        };
        Animation.addAnimation(shakeAnim);
    },

    startStickFly() {
        this.state = this.states.STICK_FLYING;
        
        const centerX = Renderer.width / 2;
        const startY = Renderer.height / 2 + 50;
        const endY = Renderer.height / 2 - 50;
        
        this.currentFortune = Lottery.drawManualFortune();
        
        Animation.createParticles(centerX, startY - 150, 40, this.currentFortune.level.colors);
        
        const flyAnim = Animation.createStickFlyAnimation(centerX, startY - 150, centerX, endY, 800);
        flyAnim.onComplete = () => {
            this.startPaperUnfold();
        };
        Animation.addAnimation(flyAnim);
    },

    startPaperUnfold() {
        this.state = this.states.PAPER_UNFOLDING;
        
        const unfoldAnim = Animation.createPaperUnfoldAnimation(1200);
        unfoldAnim.onComplete = () => {
            this.state = this.states.SHOWING_RESULT;
        };
        Animation.addAnimation(unfoldAnim);
    },

    loop() {
        this.render();
        requestAnimationFrame(() => this.loop());
    },

    render() {
        Renderer.clear();
        Renderer.drawBackground();
        Renderer.drawTitle();
        
        const centerX = Renderer.width / 2;
        const centerY = Renderer.height / 2;
        
        const boxY = centerY + 100;
        
        const shakeAnim = Animation.getAnimationByType('shake');
        if (shakeAnim) {
            const shakeState = Animation.getShakeState(shakeAnim);
            Renderer.drawLotteryBox(centerX, boxY, shakeState.rotation, shakeState.offset);
        } else {
            Renderer.drawLotteryBox(centerX, boxY, 0, { x: 0, y: 0 });
        }
        
        const stickFlyAnim = Animation.getAnimationByType('stickFly');
        if (stickFlyAnim) {
            const stickState = Animation.getStickFlyState(stickFlyAnim);
            Renderer.drawFortuneStick(
                stickState.x, 
                stickState.y, 
                stickState.rotation, 
                stickState.scale, 
                stickState.opacity,
                this.currentFortune
            );
        }
        
        const paperUnfoldAnim = Animation.getAnimationByType('paperUnfold');
        if (paperUnfoldAnim) {
            const paperState = Animation.getPaperUnfoldState(paperUnfoldAnim);
            Renderer.drawFortunePaper(
                centerX,
                centerY,
                paperState.scale,
                paperState.opacity,
                this.currentFortune,
                paperState.unfoldProgress
            );
        }
        
        if (this.state === this.states.SHOWING_DAILY || this.state === this.states.SHOWING_RESULT) {
            if (this.currentFortune) {
                Renderer.drawFortunePaper(
                    centerX,
                    centerY,
                    1,
                    1,
                    this.currentFortune,
                    1
                );
            }
        }
        
        if (this.currentFortune && !Animation.isAnimating()) {
            const level = this.currentFortune.level;
            Renderer.drawLightEffect(
                centerX,
                centerY - 50,
                200,
                level.colors[0] + '40',
                0.5
            );
        }
        
        const particles = Animation.getParticles();
        if (particles.length > 0) {
            Renderer.drawParticles(particles);
        }
        
        if (!Animation.isAnimating()) {
            const buttonX = (Renderer.width - 180) / 2;
            const buttonY = Renderer.height - 100;
            
            const saved = Storage.loadFortune();
            const isManual = saved && saved.isManual;
            
            let buttonText = '抽 一 签';
            if (isManual && this.state === this.states.SHOWING_RESULT) {
                buttonText = '再 抽 一 签';
            }
            
            Renderer.drawButton(
                buttonX,
                buttonY,
                180,
                50,
                buttonText,
                this.buttonHovered,
                false
            );
        }
        
        this.renderStateHint();
    },

    renderStateHint() {
        const ctx = Renderer.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '14px serif';
        
        let hint = '';
        
        switch (this.state) {
            case this.states.SHAKING:
                hint = '正在摇晃签筒...';
                ctx.fillStyle = '#FFD700';
                break;
            case this.states.STICK_FLYING:
                hint = '签飞出...';
                ctx.fillStyle = '#FFA500';
                break;
            case this.states.PAPER_UNFOLDING:
                hint = '签纸展开...';
                ctx.fillStyle = '#90EE90';
                break;
            default:
                break;
        }
        
        if (hint) {
            ctx.fillText(hint, Renderer.width / 2, Renderer.height - 130);
        }
        
        ctx.restore();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
