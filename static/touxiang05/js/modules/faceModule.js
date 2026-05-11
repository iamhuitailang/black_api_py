const FaceModule = (function() {
    let container = null;
    let onSelect = null;

    function init(onSelectCallback) {
        container = document.getElementById('face-options');
        onSelect = onSelectCallback;
        render();
    }

    function render() {
        if (!container) return;
        container.innerHTML = '';

        PixelData.faceTemplates.forEach(template => {
            const previewCanvas = createPreview(template.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = template.id;
            item.title = `${template.name} - ${template.style}`;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onSelect(template.id);
                updateActive(template.id);
            });
            container.appendChild(item);
        });
    }

    function createPreview(faceId) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        drawPreviewFace(ctx, faceId);
        return canvas;
    }

    function drawPreviewFace(ctx, faceId) {
        const color = '#F5D6BA';
        const outline = '#D4A574';
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, 32, 32);

        switch (faceId) {
            case 'round':
                drawRoundFace(ctx, color, outline);
                break;
            case 'square':
                drawSquareFace(ctx, color, outline);
                break;
            case 'pointed':
                drawPointedFace(ctx, color, outline);
                break;
            case 'cat':
                drawCatFace(ctx, color, outline);
                break;
            case 'dog':
                drawDogFace(ctx, color, outline);
                break;
            case 'bear':
                drawBearFace(ctx, color, outline);
                break;
            case 'fox':
                drawFoxFace(ctx, color, outline);
                break;
            case 'rabbit':
                drawRabbitFace(ctx, color, outline);
                break;
            case 'blank':
                ctx.fillStyle = '#2A2A4E';
                ctx.fillRect(10, 8, 12, 14);
                break;
        }

        ctx.fillStyle = '#2C2C2C';
        ctx.fillRect(11, 14, 2, 2);
        ctx.fillRect(19, 14, 2, 2);
        ctx.fillRect(13, 20, 6, 1);
    }

    function drawRoundFace(ctx, color, outline) {
        ctx.fillStyle = color;
        for (let y = 6; y < 26; y++) {
            for (let x = 6; x < 26; x++) {
                const dx = x - 16;
                const dy = y - 16;
                if (dx * dx + dy * dy < 90) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    function drawSquareFace(ctx, color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(7, 7, 18, 16);
    }

    function drawPointedFace(ctx, color, outline) {
        ctx.fillStyle = color;
        for (let y = 6; y < 18; y++) {
            const width = 20 - (y - 6);
            const startX = 16 - Math.floor(width / 2);
            ctx.fillRect(startX, y, width, 1);
        }
        for (let y = 18; y < 28; y++) {
            const width = 34 - y;
            const startX = 16 - Math.floor(width / 2);
            ctx.fillRect(startX, y, width, 1);
        }
    }

    function drawCatFace(ctx, color, outline) {
        drawRoundFace(ctx, color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(7, 5, 3, 3);
        ctx.fillRect(22, 5, 3, 3);
    }

    function drawDogFace(ctx, color, outline) {
        drawRoundFace(ctx, color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(14, 18, 4, 4);
    }

    function drawBearFace(ctx, color, outline) {
        drawRoundFace(ctx, color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(5, 5, 4, 4);
        ctx.fillRect(23, 5, 4, 4);
    }

    function drawFoxFace(ctx, color, outline) {
        drawPointedFace(ctx, color, outline);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(13, 20, 6, 4);
    }

    function drawRabbitFace(ctx, color, outline) {
        drawRoundFace(ctx, color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(9, 1, 3, 8);
        ctx.fillRect(20, 1, 3, 8);
    }

    function updateActive(activeId) {
        if (!container) return;
        const options = container.querySelectorAll('.option-item');
        options.forEach(opt => {
            if (opt.dataset.id === activeId) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    return {
        init,
        updateActive
    };
})();