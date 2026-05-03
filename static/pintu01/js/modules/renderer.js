class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.previewCanvas = null;
        this.previewCtx = null;
        this.game = null;
        this.imageManager = null;
        this.canvasSize = 400;
        this.tileSize = 0;
        this.padding = 4;
        this.borderRadius = 8;
        this.colors = {
            background: '#FFF5F7',
            tileBackground: '#FFFFFF',
            tileBorder: '#FFB6C1',
            tileShadow: 'rgba(255, 107, 157, 0.15)',
            emptyBackground: '#F0E6E8',
            correctPosition: 'rgba(125, 206, 130, 0.3)',
            correctRow: 'rgba(255, 217, 61, 0.2)',
            correctCol: 'rgba(177, 156, 217, 0.2)',
            text: '#5D4E6D'
        };
    }

    init(canvasId, previewCanvasId, game, imageManager) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById(previewCanvasId);
        this.previewCtx = this.previewCanvas.getContext('2d');
        this.game = game;
        this.imageManager = imageManager;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        
        if (row >= 0 && row < this.game.size && col >= 0 && col < this.game.size) {
            this.game.moveTile(row, col);
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        
        if (row >= 0 && row < this.game.size && col >= 0 && col < this.game.size) {
            if (this.game.canMove(row, col)) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    render() {
        if (!this.game || !this.ctx) return;
        
        this.tileSize = this.canvasSize / this.game.size;
        
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        
        const currentImage = this.imageManager.getCurrentImage();
        
        for (let row = 0; row < this.game.size; row++) {
            for (let col = 0; col < this.game.size; col++) {
                const tileValue = this.game.getTileAt(row, col);
                const x = col * this.tileSize;
                const y = row * this.tileSize;
                
                if (tileValue === this.game.size * this.game.size - 1) {
                    this.drawEmptyTile(x, y);
                } else {
                    this.drawTile(x, y, row, col, tileValue, currentImage);
                }
            }
        }
    }

    drawTile(x, y, row, col, tileValue, image) {
        const tileX = x + this.padding / 2;
        const tileY = y + this.padding / 2;
        const tileW = this.tileSize - this.padding;
        const tileH = this.tileSize - this.padding;
        
        if (this.game.hintMode) {
            this.drawHintHighlight(tileX, tileY, tileW, tileH, row, col);
        }
        
        this.ctx.save();
        this.roundRect(tileX, tileY, tileW, tileH, this.borderRadius);
        this.ctx.clip();
        
        if (image && image.loaded) {
            const sourceTileSize = image.width / this.game.size;
            const sourceRow = Math.floor(tileValue / this.game.size);
            const sourceCol = tileValue % this.game.size;
            
            this.ctx.drawImage(
                image.element,
                sourceCol * sourceTileSize,
                sourceRow * sourceTileSize,
                sourceTileSize,
                sourceTileSize,
                tileX,
                tileY,
                tileW,
                tileH
            );
        } else {
            this.drawPlaceholderTile(tileX, tileY, tileW, tileH, tileValue);
        }
        
        this.ctx.restore();
        
        this.drawTileBorder(tileX, tileY, tileW, tileH);
        
        if (!image || !image.loaded) {
            this.drawTileNumber(tileX, tileY, tileW, tileH, tileValue);
        }
    }

    drawPlaceholderTile(x, y, w, h, value) {
        const hue = (value * 360) / (this.game.size * this.game.size);
        const gradient = this.ctx.createLinearGradient(x, y, x + w, y + h);
        gradient.addColorStop(0, `hsla(${hue}, 70%, 75%, 0.9)`);
        gradient.addColorStop(1, `hsla(${(hue + 30) % 360}, 70%, 65%, 0.9)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, w, h);
    }

    drawHintHighlight(x, y, w, h, row, col) {
        if (this.game.isCorrectPosition(row, col)) {
            this.ctx.fillStyle = this.colors.correctPosition;
            this.roundRect(x, y, w, h, this.borderRadius);
            this.ctx.fill();
        } else if (this.game.isInCorrectRow(row, col)) {
            this.ctx.fillStyle = this.colors.correctRow;
            this.roundRect(x, y, w, h, this.borderRadius);
            this.ctx.fill();
        } else if (this.game.isInCorrectCol(row, col)) {
            this.ctx.fillStyle = this.colors.correctCol;
            this.roundRect(x, y, w, h, this.borderRadius);
            this.ctx.fill();
        }
    }

    drawTileBorder(x, y, w, h) {
        this.ctx.save();
        this.roundRect(x, y, w, h, this.borderRadius);
        this.ctx.strokeStyle = this.colors.tileBorder;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawTileNumber(x, y, w, h, value) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = `bold ${Math.min(w, h) * 0.4}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText((value + 1).toString(), x + w / 2, y + h / 2);
    }

    drawEmptyTile(x, y) {
        const tileX = x + this.padding / 2;
        const tileY = y + this.padding / 2;
        const tileW = this.tileSize - this.padding;
        const tileH = this.tileSize - this.padding;
        
        this.ctx.fillStyle = this.colors.emptyBackground;
        this.roundRect(tileX, tileY, tileW, tileH, this.borderRadius);
        this.ctx.fill();
        
        this.ctx.strokeStyle = this.colors.tileBorder;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.roundRect(tileX, tileY, tileW, tileH, this.borderRadius);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    roundRect(x, y, w, h, radius) {
        const r = Math.min(radius, w / 2, h / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }

    renderPreview() {
        if (!this.previewCtx) return;
        
        const currentImage = this.imageManager.getCurrentImage();
        
        this.previewCtx.fillStyle = this.colors.background;
        this.previewCtx.fillRect(0, 0, 150, 150);
        
        if (currentImage && currentImage.loaded) {
            const scale = Math.min(150 / currentImage.width, 150 / currentImage.height);
            const w = currentImage.width * scale;
            const h = currentImage.height * scale;
            const x = (150 - w) / 2;
            const y = (150 - h) / 2;
            
            this.previewCtx.save();
            this.previewRoundedRect(0, 0, 150, 150, 12);
            this.previewCtx.clip();
            this.previewCtx.drawImage(currentImage.element, x, y, w, h);
            this.previewCtx.restore();
        } else {
            this.previewCtx.font = '48px Arial';
            this.previewCtx.textAlign = 'center';
            this.previewCtx.textBaseline = 'middle';
            this.previewCtx.fillStyle = this.colors.text;
            this.previewCtx.fillText('🖼️', 75, 75);
        }
    }

    previewRoundedRect(x, y, w, h, radius) {
        const r = Math.min(radius, w / 2, h / 2);
        this.previewCtx.beginPath();
        this.previewCtx.moveTo(x + r, y);
        this.previewCtx.arcTo(x + w, y, x + w, y + h, r);
        this.previewCtx.arcTo(x + w, y + h, x, y + h, r);
        this.previewCtx.arcTo(x, y + h, x, y, r);
        this.previewCtx.arcTo(x, y, x + w, y, r);
        this.previewCtx.closePath();
    }

    clear() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        }
    }

    setCanvasSize(size) {
        this.canvasSize = size;
        if (this.canvas) {
            this.canvas.width = size;
            this.canvas.height = size;
        }
    }
}

export const renderer = new Renderer();
export default renderer;
