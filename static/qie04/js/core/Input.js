export class Input {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        
        this.init();
    }

    init() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleClick(e) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const penguin = this.game.penguin;
        const dx = clickX - penguin.x;
        const dy = clickY - penguin.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            this.game.pushPenguin(dx, dy);
        }
    }

    handleTouchStart(e) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    }

    handleTouchEnd(e) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        e.preventDefault();
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();
        
        const dx = touchEndX - this.touchStartX;
        const dy = touchEndY - this.touchStartY;
        const duration = touchEndTime - this.touchStartTime;
        
        if (duration < 300) {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = touchEndX - rect.left;
                const clickY = touchEndY - rect.top;
                
                const penguin = this.game.penguin;
                const pushDx = clickX - penguin.x;
                const pushDy = clickY - penguin.y;
                
                if (Math.sqrt(pushDx * pushDx + pushDy * pushDy) > 20) {
                    this.game.pushPenguin(pushDx, pushDy);
                }
            } else {
                this.game.pushPenguin(dx, dy);
            }
        }
    }

    handleKeyDown(e) {
        if (!this.game.isPlaying || this.game.isPaused) return;
        
        let dx = 0;
        let dy = 0;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                dy = -1;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                dy = 1;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                dx = -1;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                dx = 1;
                break;
            case 'Escape':
                this.game.togglePause();
                return;
            case '1':
                this.game.useItem('magnet');
                return;
            case '2':
                this.game.useItem('claw');
                return;
            case '3':
                this.game.useItem('shield');
                return;
            case '4':
                this.game.useItem('rocket');
                return;
            default:
                return;
        }
        
        if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            this.game.pushPenguin(dx, dy);
        }
    }
}
