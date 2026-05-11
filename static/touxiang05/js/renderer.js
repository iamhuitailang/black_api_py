const Renderer = (function() {
    let canvas = null;
    let ctx = null;
    const WIDTH = 32;
    const HEIGHT = 32;

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
    }

    function clear() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
    }

    function setPixel(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }

    function drawBackground(state) {
        switch (state.background) {
            case 'transparent':
                break;
            case 'solid':
                ctx.fillStyle = state.backgroundColor;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                break;
            case 'clouds':
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                drawCloud(4, 4, 8, '#FFFFFF');
                drawCloud(18, 8, 6, '#FFFFFF');
                drawCloud(8, 20, 7, '#FFFFFF');
                break;
            case 'stars':
                ctx.fillStyle = '#1A1A2E';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                drawStar(4, 4, '#FFD700');
                drawStar(12, 8, '#FFFFFF');
                drawStar(20, 4, '#FFD700');
                drawStar(8, 16, '#FFFFFF');
                drawStar(24, 14, '#FFD700');
                drawStar(16, 22, '#FFFFFF');
                break;
            case 'grid':
                ctx.fillStyle = state.backgroundColor;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                ctx.fillStyle = 'rgba(255,255,255,0.1)';
                for (let i = 0; i < WIDTH; i += 4) {
                    for (let j = 0; j < HEIGHT; j += 4) {
                        if ((i + j) % 8 === 0) {
                            ctx.fillRect(i, j, 4, 4);
                        }
                    }
                }
                break;
        }
    }

    function drawCloud(x, y, size, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, 2);
        ctx.fillRect(x + 1, y - 1, size - 2, 1);
        ctx.fillRect(x + 2, y - 2, size - 4, 1);
        ctx.fillRect(x + 1, y + 1, size - 2, 1);
        ctx.fillRect(x + 2, y + 2, size - 4, 1);
    }

    function drawStar(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
        ctx.fillRect(x - 1, y, 1, 1);
        ctx.fillRect(x + 1, y, 1, 1);
        ctx.fillRect(x, y - 1, 1, 1);
        ctx.fillRect(x, y + 1, 1, 1);
    }

    function drawFace(state, options = {}) {
        const isAnimal = ['cat', 'dog', 'bear', 'fox', 'rabbit'].includes(state.face);
        const skinColor = state.skinColor;
        const outlineColor = getDarkerColor(skinColor);

        if (isAnimal) {
            drawAnimalFace(state);
            return;
        }

        switch (state.face) {
            case 'round':
                drawRoundFace(skinColor, outlineColor);
                break;
            case 'square':
                drawSquareFace(skinColor, outlineColor);
                break;
            case 'pointed':
                drawPointedFace(skinColor, outlineColor);
                break;
            case 'blank':
                break;
        }
    }

    function drawRoundFace(color, outline) {
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
        ctx.fillStyle = outline;
        for (let y = 6; y < 26; y++) {
            for (let x = 6; x < 26; x++) {
                const dx = x - 16;
                const dy = y - 16;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist >= 9 && dist < 10) {
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    function drawSquareFace(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(7, 7, 18, 16);
        ctx.fillRect(8, 6, 16, 1);
        ctx.fillRect(8, 23, 16, 1);
        ctx.fillRect(6, 8, 1, 14);
        ctx.fillRect(25, 8, 1, 14);
        
        ctx.fillStyle = outline;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1;
        ctx.strokeRect(6.5, 6.5, 19, 17);
    }

    function drawPointedFace(color, outline) {
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

    function drawAnimalFace(state) {
        const color = state.skinColor;
        const outline = getDarkerColor(color);
        
        switch (state.face) {
            case 'cat':
                drawCatFace(color, outline);
                break;
            case 'dog':
                drawDogFace(color, outline);
                break;
            case 'bear':
                drawBearFace(color, outline);
                break;
            case 'fox':
                drawFoxFace(color, outline);
                break;
            case 'rabbit':
                drawRabbitFace(color, outline);
                break;
        }
    }

    function drawCatFace(color, outline) {
        drawRoundFace(color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(7, 5, 3, 3);
        ctx.fillRect(22, 5, 3, 3);
        ctx.fillStyle = outline;
        ctx.fillRect(7, 4, 3, 1);
        ctx.fillRect(22, 4, 3, 1);
        ctx.fillRect(6, 5, 1, 3);
        ctx.fillRect(25, 5, 1, 3);
    }

    function drawDogFace(color, outline) {
        drawRoundFace(color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(14, 18, 4, 4);
        ctx.fillRect(13, 21, 6, 2);
        ctx.fillStyle = '#4A3728';
        ctx.fillRect(15, 17, 2, 2);
    }

    function drawBearFace(color, outline) {
        drawRoundFace(color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(5, 5, 4, 4);
        ctx.fillRect(23, 5, 4, 4);
        ctx.fillStyle = outline;
        ctx.strokeRect(5, 5, 4, 4);
        ctx.strokeRect(23, 5, 4, 4);
    }

    function drawFoxFace(color, outline) {
        drawPointedFace(color, outline);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(13, 20, 6, 4);
        ctx.fillStyle = '#4A3728';
        ctx.fillRect(15, 18, 2, 2);
        ctx.fillStyle = color;
        ctx.fillRect(7, 5, 3, 3);
        ctx.fillRect(22, 5, 3, 3);
    }

    function drawRabbitFace(color, outline) {
        drawRoundFace(color, outline);
        ctx.fillStyle = color;
        ctx.fillRect(9, 1, 3, 8);
        ctx.fillRect(20, 1, 3, 8);
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(10, 2, 1, 6);
        ctx.fillRect(21, 2, 1, 6);
    }

    function drawHair(state) {
        if (state.hair === 'bald') return;
        
        const color = state.hairColor;
        const outline = getDarkerColor(color);
        
        switch (state.hair) {
            case 'short':
                drawShortHair(color, outline);
                break;
            case 'long':
                drawLongHair(color, outline);
                break;
            case 'ponytail':
                drawPonytail(color, outline);
                break;
            case 'buzz':
                drawBuzzCut(color, outline);
                break;
            case 'twintail':
                drawTwintail(color, outline);
                break;
            case 'mohawk':
                drawMohawk(color, outline);
                break;
            case 'curly':
                drawCurlyHair(color, outline);
                break;
        }
    }

    function drawShortHair(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(6, 6, 20, 5);
        ctx.fillRect(5, 10, 2, 6);
        ctx.fillRect(25, 10, 2, 6);
        ctx.fillStyle = outline;
        ctx.fillRect(6, 5, 20, 1);
        ctx.fillRect(4, 10, 1, 6);
        ctx.fillRect(27, 10, 1, 6);
    }

    function drawLongHair(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(6, 6, 20, 5);
        ctx.fillRect(4, 10, 4, 20);
        ctx.fillRect(24, 10, 4, 20);
        ctx.fillStyle = outline;
        ctx.fillRect(6, 5, 20, 1);
        ctx.fillRect(3, 10, 1, 20);
        ctx.fillRect(28, 10, 1, 20);
    }

    function drawPonytail(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(6, 6, 20, 5);
        ctx.fillRect(5, 10, 3, 8);
        ctx.fillRect(24, 10, 3, 8);
        ctx.fillRect(14, 8, 4, 24);
        ctx.fillStyle = outline;
        ctx.fillRect(6, 5, 20, 1);
    }

    function drawBuzzCut(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(7, 7, 18, 3);
        ctx.fillStyle = outline;
        ctx.fillRect(7, 6, 18, 1);
    }

    function drawTwintail(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(6, 6, 20, 5);
        ctx.fillRect(2, 12, 6, 16);
        ctx.fillRect(24, 12, 6, 16);
        ctx.fillStyle = '#E94560';
        ctx.fillRect(3, 11, 4, 2);
        ctx.fillRect(25, 11, 4, 2);
    }

    function drawMohawk(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(14, 3, 4, 10);
        ctx.fillRect(13, 2, 6, 2);
        ctx.fillRect(15, 1, 2, 1);
    }

    function drawCurlyHair(color, outline) {
        ctx.fillStyle = color;
        ctx.fillRect(6, 6, 20, 4);
        ctx.fillRect(4, 10, 3, 4);
        ctx.fillRect(25, 10, 3, 4);
        ctx.fillRect(3, 14, 4, 3);
        ctx.fillRect(25, 14, 4, 3);
        ctx.fillRect(5, 17, 3, 4);
        ctx.fillRect(24, 17, 3, 4);
    }

    function drawEyes(state, options = {}) {
        const isClosed = options.isClosed || false;
        const eyeColor = '#2C2C2C';
        const whiteColor = '#FFFFFF';
        
        const isAnimal = ['cat', 'dog', 'bear', 'fox', 'rabbit'].includes(state.face);
        
        if (isAnimal) {
            drawAnimalEyes(state, isClosed);
            return;
        }

        if (isClosed) {
            ctx.fillStyle = eyeColor;
            ctx.fillRect(10, 13, 3, 1);
            ctx.fillRect(19, 13, 3, 1);
            return;
        }

        switch (state.eyes) {
            case 'round':
                ctx.fillStyle = whiteColor;
                ctx.fillRect(9, 12, 5, 4);
                ctx.fillRect(18, 12, 5, 4);
                ctx.fillStyle = eyeColor;
                ctx.fillRect(11, 13, 3, 3);
                ctx.fillRect(20, 13, 3, 3);
                ctx.fillStyle = whiteColor;
                ctx.fillRect(12, 13, 1, 1);
                ctx.fillRect(21, 13, 1, 1);
                break;
            case 'bean':
                ctx.fillStyle = eyeColor;
                ctx.fillRect(10, 13, 4, 3);
                ctx.fillRect(18, 13, 4, 3);
                break;
            case 'dead':
                ctx.fillStyle = whiteColor;
                ctx.fillRect(9, 12, 5, 4);
                ctx.fillRect(18, 12, 5, 4);
                ctx.fillStyle = eyeColor;
                ctx.fillRect(11, 14, 3, 1);
                ctx.fillRect(20, 14, 3, 1);
                break;
            case 'star':
                drawStar(11, 13, '#FFD700');
                drawStar(20, 13, '#FFD700');
                break;
            case 'squint':
                ctx.fillStyle = eyeColor;
                ctx.fillRect(9, 14, 6, 1);
                ctx.fillRect(17, 14, 6, 1);
                ctx.fillRect(10, 13, 4, 1);
                ctx.fillRect(18, 13, 4, 1);
                break;
            case 'wink':
                ctx.fillStyle = whiteColor;
                ctx.fillRect(9, 12, 5, 4);
                ctx.fillStyle = eyeColor;
                ctx.fillRect(11, 13, 3, 3);
                ctx.fillRect(18, 13, 5, 1);
                break;
            case 'eyepatch':
                ctx.fillStyle = whiteColor;
                ctx.fillRect(9, 12, 5, 4);
                ctx.fillStyle = eyeColor;
                ctx.fillRect(11, 13, 3, 3);
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(17, 11, 7, 6);
                ctx.fillStyle = '#4A4A4A';
                ctx.fillRect(16, 14, 1, 1);
                ctx.fillRect(24, 14, 1, 1);
                break;
        }
    }

    function drawAnimalEyes(state, isClosed) {
        const eyeColor = '#2C2C2C';
        const whiteColor = '#FFFFFF';
        
        if (isClosed) {
            ctx.fillStyle = eyeColor;
            ctx.fillRect(11, 14, 2, 1);
            ctx.fillRect(19, 14, 2, 1);
            return;
        }

        ctx.fillStyle = whiteColor;
        ctx.fillRect(10, 13, 4, 4);
        ctx.fillRect(18, 13, 4, 4);
        ctx.fillStyle = eyeColor;
        ctx.fillRect(11, 14, 2, 2);
        ctx.fillRect(19, 14, 2, 2);
    }

    function drawEyebrows(state) {
        if (state.eyebrow === 'none') return;
        
        const color = getDarkerColor(state.hairColor);
        
        switch (state.eyebrow) {
            case 'normal':
                ctx.fillStyle = color;
                ctx.fillRect(9, 10, 5, 1);
                ctx.fillRect(18, 10, 5, 1);
                break;
            case 'down':
                ctx.fillStyle = color;
                ctx.fillRect(8, 9, 2, 1);
                ctx.fillRect(10, 10, 3, 1);
                ctx.fillRect(22, 9, 2, 1);
                ctx.fillRect(19, 10, 3, 1);
                break;
            case 'up':
                ctx.fillStyle = color;
                ctx.fillRect(8, 8, 2, 3);
                ctx.fillRect(22, 8, 2, 3);
                break;
            case 'thick':
                ctx.fillStyle = color;
                ctx.fillRect(8, 10, 7, 2);
                ctx.fillRect(17, 10, 7, 2);
                break;
            case 'thin':
                ctx.fillStyle = color;
                ctx.fillRect(9, 10, 5, 1);
                ctx.fillRect(18, 10, 5, 1);
                break;
        }
    }

    function drawMouth(state) {
        const color = '#2C2C2C';
        const lipColor = '#E57373';
        
        switch (state.mouth) {
            case 'smile':
                ctx.fillStyle = color;
                ctx.fillRect(13, 20, 6, 1);
                ctx.fillRect(12, 19, 1, 1);
                ctx.fillRect(19, 19, 1, 1);
                break;
            case 'laugh':
                ctx.fillStyle = lipColor;
                ctx.fillRect(12, 19, 8, 3);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(13, 19, 6, 1);
                ctx.fillStyle = color;
                ctx.fillRect(11, 18, 1, 2);
                ctx.fillRect(20, 18, 1, 2);
                break;
            case 'sad':
                ctx.fillStyle = color;
                ctx.fillRect(13, 19, 6, 1);
                ctx.fillRect(12, 20, 1, 1);
                ctx.fillRect(19, 20, 1, 1);
                break;
            case 'surprised':
                ctx.fillStyle = lipColor;
                ctx.fillRect(14, 19, 4, 3);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(15, 20, 2, 1);
                break;
            case 'neutral':
                ctx.fillStyle = color;
                ctx.fillRect(13, 20, 6, 1);
                break;
            case 'teeth':
                ctx.fillStyle = color;
                ctx.fillRect(12, 19, 8, 1);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(13, 20, 2, 1);
                ctx.fillRect(17, 20, 2, 1);
                break;
            case 'rose':
                ctx.fillStyle = color;
                ctx.fillRect(13, 20, 6, 1);
                ctx.fillStyle = '#E94560';
                ctx.fillRect(19, 18, 4, 3);
                ctx.fillStyle = '#27AE60';
                ctx.fillRect(18, 21, 2, 1);
                ctx.fillRect(17, 22, 1, 2);
                break;
        }
    }

    function drawNose(state) {
        if (state.nose === 'none') return;
        
        const color = getDarkerColor(state.skinColor);
        
        switch (state.nose) {
            case 'small':
                ctx.fillStyle = color;
                ctx.fillRect(15, 17, 2, 1);
                break;
            case 'triangle':
                ctx.fillStyle = color;
                ctx.fillRect(15, 17, 2, 1);
                ctx.fillRect(16, 18, 1, 1);
                break;
        }
    }

    function drawBlush(state) {
        if (state.blush === 'none') return;
        
        const color = 'rgba(255, 182, 193, 0.7)';
        ctx.fillStyle = color;
        
        switch (state.blush) {
            case 'circle':
                ctx.fillRect(7, 17, 3, 2);
                ctx.fillRect(22, 17, 3, 2);
                break;
            case 'slash':
                ctx.fillRect(6, 16, 4, 1);
                ctx.fillRect(7, 17, 3, 1);
                ctx.fillRect(22, 16, 4, 1);
                ctx.fillRect(22, 17, 3, 1);
                break;
        }
    }

    function drawShirt(state) {
        if (state.shirt === 'none') return;
        
        const color = state.shirtColor;
        const outline = getDarkerColor(color);
        const lightColor = getLighterColor(color);
        
        switch (state.shirt) {
            case 'tshirt':
                ctx.fillStyle = color;
                ctx.fillRect(4, 26, 24, 6);
                ctx.fillRect(2, 26, 3, 3);
                ctx.fillRect(27, 26, 3, 3);
                ctx.fillStyle = outline;
                ctx.fillRect(4, 25, 24, 1);
                ctx.fillStyle = lightColor;
                ctx.fillRect(14, 26, 4, 2);
                break;
            case 'armor':
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(4, 26, 24, 6);
                ctx.fillRect(2, 26, 3, 3);
                ctx.fillRect(27, 26, 3, 3);
                ctx.fillStyle = '#BDBDBD';
                ctx.fillRect(12, 26, 8, 6);
                ctx.fillStyle = '#757575';
                ctx.fillRect(14, 27, 4, 4);
                break;
            case 'robe':
                ctx.fillStyle = color;
                ctx.fillRect(6, 26, 20, 6);
                ctx.fillRect(4, 27, 24, 5);
                ctx.fillStyle = outline;
                ctx.fillRect(6, 25, 20, 1);
                ctx.fillStyle = lightColor;
                ctx.fillRect(15, 26, 2, 6);
                break;
            case 'vest':
                ctx.fillStyle = color;
                ctx.fillRect(6, 26, 20, 6);
                ctx.fillStyle = outline;
                ctx.fillRect(6, 25, 20, 1);
                ctx.fillStyle = '#1A1A2E';
                ctx.fillRect(14, 26, 4, 6);
                break;
            case 'hoodie':
                ctx.fillStyle = color;
                ctx.fillRect(4, 24, 24, 8);
                ctx.fillRect(2, 26, 3, 4);
                ctx.fillRect(27, 26, 3, 4);
                ctx.fillStyle = outline;
                ctx.fillRect(4, 23, 24, 1);
                ctx.fillStyle = lightColor;
                ctx.fillRect(12, 24, 8, 3);
                break;
        }
    }

    function drawHeadwear(state) {
        if (state.headwear === 'none') return;
        
        switch (state.headwear) {
            case 'cap':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(6, 5, 20, 3);
                ctx.fillRect(4, 7, 3, 2);
                ctx.fillStyle = '#C0392B';
                ctx.fillRect(6, 4, 20, 1);
                break;
            case 'wizard':
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(12, 2, 8, 4);
                ctx.fillRect(14, 0, 4, 2);
                ctx.fillStyle = '#F1C40F';
                ctx.fillRect(11, 5, 10, 2);
                ctx.fillRect(15, 0, 2, 1);
                break;
            case 'crown':
                ctx.fillStyle = '#F1C40F';
                ctx.fillRect(6, 3, 20, 3);
                ctx.fillRect(7, 1, 2, 2);
                ctx.fillRect(12, 0, 2, 3);
                ctx.fillRect(18, 1, 2, 2);
                ctx.fillRect(23, 1, 2, 2);
                ctx.fillStyle = '#E74C3C';
                ctx.fillRect(12, 2, 2, 2);
                break;
            case 'helmet':
                ctx.fillStyle = '#9E9E9E';
                ctx.fillRect(6, 4, 20, 6);
                ctx.fillRect(8, 3, 16, 1);
                ctx.fillStyle = '#616161';
                ctx.fillRect(10, 6, 12, 2);
                ctx.fillStyle = '#2196F3';
                ctx.fillRect(12, 6, 2, 2);
                ctx.fillRect(18, 6, 2, 2);
                break;
            case 'bow':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(12, 5, 8, 2);
                ctx.fillRect(10, 4, 3, 4);
                ctx.fillRect(19, 4, 3, 4);
                ctx.fillStyle = '#C0392B';
                ctx.fillRect(14, 5, 4, 2);
                break;
            case 'headband':
                ctx.fillStyle = '#E94560';
                ctx.fillRect(5, 9, 22, 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(14, 8, 4, 3);
                break;
            case 'headphone':
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(5, 6, 22, 2);
                ctx.fillRect(3, 8, 4, 6);
                ctx.fillRect(25, 8, 4, 6);
                ctx.fillStyle = '#4A4A4A';
                ctx.fillRect(4, 9, 2, 4);
                ctx.fillRect(26, 9, 2, 4);
                break;
        }
    }

    function drawFaceAccessory(state) {
        if (state.faceAccessory === 'none') return;
        
        switch (state.faceAccessory) {
            case 'round_glasses':
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(11.5, 14, 2.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(20.5, 14, 2.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(14, 14, 6, 1);
                break;
            case 'square_glasses':
                ctx.strokeStyle = '#2C2C2C';
                ctx.lineWidth = 1;
                ctx.strokeRect(8, 11, 6, 6);
                ctx.strokeRect(18, 11, 6, 6);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(14, 13, 4, 1);
                break;
            case 'sunglasses':
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(8, 11, 6, 5);
                ctx.fillRect(18, 11, 6, 5);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(14, 13, 4, 1);
                break;
            case 'mask':
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(10, 16, 12, 4);
                ctx.fillStyle = '#BDC3C7';
                ctx.fillRect(11, 17, 10, 2);
                ctx.fillStyle = '#95A5A6';
                ctx.fillRect(14, 17, 4, 2);
                break;
            case 'scar':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(9, 10, 6, 1);
                ctx.fillRect(12, 11, 2, 3);
                break;
            case 'beard':
                ctx.fillStyle = getDarkerColor(state.hairColor);
                ctx.fillRect(10, 22, 12, 4);
                ctx.fillRect(12, 20, 8, 2);
                break;
            case 'bandaid':
                ctx.fillStyle = '#F5DEB3';
                ctx.fillRect(9, 11, 6, 3);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(11, 12, 2, 1);
                break;
        }
    }

    function render(state, options = {}) {
        clear();
        drawBackground(state);
        drawShirt(state);
        drawFace(state, options);
        drawHair(state);
        drawHeadwear(state);
        drawEyes(state, options);
        drawEyebrows(state);
        drawNose(state);
        drawMouth(state);
        drawBlush(state);
        drawFaceAccessory(state);
    }

    function getDarkerColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`;
    }

    function getLighterColor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
    }

    function toDataURL() {
        return canvas.toDataURL('image/png');
    }

    return {
        init,
        render,
        clear,
        toDataURL,
        WIDTH,
        HEIGHT
    };
})();