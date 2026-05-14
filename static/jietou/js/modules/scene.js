import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, SCENES } from './constants.js';

export class SceneRenderer {
    constructor(sceneType = 'dojo') {
        this.sceneType = sceneType;
        this.scene = SCENES[sceneType] || SCENES.dojo;
    }

    setScene(sceneType) {
        this.sceneType = sceneType;
        this.scene = SCENES[sceneType] || SCENES.dojo;
    }

    draw(ctx) {
        this.drawBackground(ctx);
        this.drawGround(ctx);
    }

    drawBackground(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        
        switch (this.sceneType) {
            case 'dojo':
                gradient.addColorStop(0, '#8B6914');
                gradient.addColorStop(1, '#5D4E37');
                break;
            case 'street':
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(0.5, '#16213e');
                gradient.addColorStop(1, '#0f3460');
                break;
            case 'ring':
                gradient.addColorStop(0, '#0a0a15');
                gradient.addColorStop(1, '#1a1a2e');
                break;
            case 'bamboo':
                gradient.addColorStop(0, '#0a1a0a');
                gradient.addColorStop(0.5, '#0d2a0d');
                gradient.addColorStop(1, '#1a3a1a');
                break;
            case 'volcano':
                gradient.addColorStop(0, '#1a0a00');
                gradient.addColorStop(0.5, '#2a1000');
                gradient.addColorStop(1, '#3a1a0a');
                break;
            default:
                gradient.addColorStop(0, '#4a4a4a');
                gradient.addColorStop(1, '#2a2a2a');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    drawGround(ctx) {
        ctx.fillStyle = this.scene.groundColor;
        ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y + 10);
        ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 10);
        ctx.stroke();
    }
}
