const BackgroundCanvas = {
    canvas: null,
    ctx: null,
    paws: [],
    bones: [],
    animationId: null,

    init() {
        this.canvas = document.getElementById('bgCanvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.initElements();
        this.animate();

        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    initElements() {
        const pawCount = 15;
        const boneCount = 8;

        for (let i = 0; i < pawCount; i++) {
            this.paws.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 20 + Math.random() * 30,
                rotation: Math.random() * Math.PI * 2,
                opacity: 0.1 + Math.random() * 0.15,
                speed: 0.2 + Math.random() * 0.3,
                direction: Math.random() * Math.PI * 2
            });
        }

        for (let i = 0; i < boneCount; i++) {
            this.bones.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 15 + Math.random() * 25,
                rotation: Math.random() * Math.PI * 2,
                opacity: 0.08 + Math.random() * 0.1,
                speed: 0.15 + Math.random() * 0.25,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                direction: Math.random() * Math.PI * 2
            });
        }
    },

    drawPaw(x, y, size, rotation, opacity) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFB366';

        const padSize = size * 0.35;
        const toeSize = size * 0.18;
        
        ctx.beginPath();
        ctx.ellipse(0, padSize * 0.3, padSize, padSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        const toePositions = [
            { x: -padSize * 0.8, y: -padSize * 0.3 },
            { x: -padSize * 0.3, y: -padSize * 0.6 },
            { x: padSize * 0.3, y: -padSize * 0.6 },
            { x: padSize * 0.8, y: -padSize * 0.3 }
        ];

        toePositions.forEach(pos => {
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, toeSize * 0.7, toeSize, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    },

    drawBone(x, y, size, rotation, opacity) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#F5F5DC';
        ctx.strokeStyle = '#E0C9A6';
        ctx.lineWidth = 2;

        const boneLength = size;
        const boneWidth = size * 0.3;
        const endSize = size * 0.4;

        ctx.beginPath();
        ctx.roundRect(-boneLength / 2, -boneWidth / 2, boneLength, boneWidth, boneWidth / 2);
        ctx.fill();
        ctx.stroke();

        const ends = [-boneLength / 2, boneLength / 2];
        ends.forEach(endX => {
            ctx.beginPath();
            ctx.arc(endX, -boneWidth * 0.4, endSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(endX, boneWidth * 0.4, endSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.restore();
    },

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.paws.forEach(paw => {
            paw.x += Math.cos(paw.direction) * paw.speed;
            paw.y += Math.sin(paw.direction) * paw.speed;
            paw.rotation += 0.005;

            if (paw.x < -paw.size) paw.x = this.canvas.width + paw.size;
            if (paw.x > this.canvas.width + paw.size) paw.x = -paw.size;
            if (paw.y < -paw.size) paw.y = this.canvas.height + paw.size;
            if (paw.y > this.canvas.height + paw.size) paw.y = -paw.size;

            this.drawPaw(paw.x, paw.y, paw.size, paw.rotation, paw.opacity);
        });

        this.bones.forEach(bone => {
            bone.x += Math.cos(bone.direction) * bone.speed;
            bone.y += Math.sin(bone.direction) * bone.speed;
            bone.rotation += bone.rotationSpeed;

            if (bone.x < -bone.size) bone.x = this.canvas.width + bone.size;
            if (bone.x > this.canvas.width + bone.size) bone.x = -bone.size;
            if (bone.y < -bone.size) bone.y = this.canvas.height + bone.size;
            if (bone.y > this.canvas.height + bone.size) bone.y = -bone.size;

            this.drawBone(bone.x, bone.y, bone.size, bone.rotation, bone.opacity);
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    },

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
};