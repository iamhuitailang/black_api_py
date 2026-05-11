const FeaturesModule = (function() {
    let eyeContainer = null;
    let eyebrowContainer = null;
    let mouthContainer = null;
    let noseContainer = null;
    let blushContainer = null;
    
    let onEyeChange = null;
    let onEyebrowChange = null;
    let onMouthChange = null;
    let onNoseChange = null;
    let onBlushChange = null;

    function init(callbacks) {
        eyeContainer = document.getElementById('eye-options');
        eyebrowContainer = document.getElementById('eyebrow-options');
        mouthContainer = document.getElementById('mouth-options');
        noseContainer = document.getElementById('nose-options');
        blushContainer = document.getElementById('blush-options');
        
        onEyeChange = callbacks.onEyeChange;
        onEyebrowChange = callbacks.onEyebrowChange;
        onMouthChange = callbacks.onMouthChange;
        onNoseChange = callbacks.onNoseChange;
        onBlushChange = callbacks.onBlushChange;
        
        renderEyes();
        renderEyebrows();
        renderMouths();
        renderNoses();
        renderBlushes();
    }

    function renderEyes() {
        if (!eyeContainer) return;
        eyeContainer.innerHTML = '';
        
        PixelData.eyes.forEach(eye => {
            const previewCanvas = createFeaturePreview('eye', eye.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = eye.id;
            item.title = eye.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onEyeChange(eye.id);
                updateActive('eye', eye.id);
            });
            eyeContainer.appendChild(item);
        });
    }

    function renderEyebrows() {
        if (!eyebrowContainer) return;
        eyebrowContainer.innerHTML = '';
        
        PixelData.eyebrows.forEach(brow => {
            const previewCanvas = createFeaturePreview('eyebrow', brow.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = brow.id;
            item.title = brow.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onEyebrowChange(brow.id);
                updateActive('eyebrow', brow.id);
            });
            eyebrowContainer.appendChild(item);
        });
    }

    function renderMouths() {
        if (!mouthContainer) return;
        mouthContainer.innerHTML = '';
        
        PixelData.mouths.forEach(mouth => {
            const previewCanvas = createFeaturePreview('mouth', mouth.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = mouth.id;
            item.title = mouth.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onMouthChange(mouth.id);
                updateActive('mouth', mouth.id);
            });
            mouthContainer.appendChild(item);
        });
    }

    function renderNoses() {
        if (!noseContainer) return;
        noseContainer.innerHTML = '';
        
        PixelData.noses.forEach(nose => {
            const previewCanvas = createFeaturePreview('nose', nose.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = nose.id;
            item.title = nose.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onNoseChange(nose.id);
                updateActive('nose', nose.id);
            });
            noseContainer.appendChild(item);
        });
    }

    function renderBlushes() {
        if (!blushContainer) return;
        blushContainer.innerHTML = '';
        
        PixelData.blushes.forEach(blush => {
            const previewCanvas = createFeaturePreview('blush', blush.id);
            const item = document.createElement('div');
            item.className = 'option-item';
            item.dataset.id = blush.id;
            item.title = blush.name;
            item.appendChild(previewCanvas);
            item.addEventListener('click', () => {
                onBlushChange(blush.id);
                updateActive('blush', blush.id);
            });
            blushContainer.appendChild(item);
        });
    }

    function createFeaturePreview(type, id) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = '#F5D6BA';
        ctx.fillRect(8, 8, 16, 16);
        
        drawPreviewFeature(ctx, type, id);
        return canvas;
    }

    function drawPreviewFeature(ctx, type, id) {
        ctx.fillStyle = '#2C2C2C';
        
        switch (type) {
            case 'eye':
                drawEyePreview(ctx, id);
                break;
            case 'eyebrow':
                drawEyebrowPreview(ctx, id);
                break;
            case 'mouth':
                drawMouthPreview(ctx, id);
                break;
            case 'nose':
                drawNosePreview(ctx, id);
                break;
            case 'blush':
                drawBlushPreview(ctx, id);
                break;
        }
    }

    function drawEyePreview(ctx, id) {
        switch (id) {
            case 'round':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(10, 12, 4, 3);
                ctx.fillRect(18, 12, 4, 3);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(11, 13, 2, 2);
                ctx.fillRect(19, 13, 2, 2);
                break;
            case 'bean':
                ctx.fillRect(10, 13, 4, 2);
                ctx.fillRect(18, 13, 4, 2);
                break;
            case 'dead':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(10, 12, 4, 3);
                ctx.fillRect(18, 12, 4, 3);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(11, 14, 3, 1);
                ctx.fillRect(18, 14, 3, 1);
                break;
            case 'star':
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(11, 13, 1, 1);
                ctx.fillRect(10, 14, 3, 1);
                ctx.fillRect(11, 15, 1, 1);
                ctx.fillRect(19, 13, 1, 1);
                ctx.fillRect(18, 14, 3, 1);
                ctx.fillRect(19, 15, 1, 1);
                break;
            case 'squint':
                ctx.fillRect(9, 14, 5, 1);
                ctx.fillRect(18, 14, 5, 1);
                break;
            case 'wink':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(10, 12, 4, 3);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(11, 13, 2, 2);
                ctx.fillRect(18, 14, 4, 1);
                break;
            case 'eyepatch':
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(10, 12, 4, 3);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(11, 13, 2, 2);
                ctx.fillStyle = '#1A1A1A';
                ctx.fillRect(16, 11, 6, 5);
                break;
        }
    }

    function drawEyebrowPreview(ctx, id) {
        switch (id) {
            case 'none':
                break;
            case 'normal':
                ctx.fillRect(9, 10, 5, 1);
                ctx.fillRect(18, 10, 5, 1);
                break;
            case 'down':
                ctx.fillRect(8, 9, 2, 1);
                ctx.fillRect(10, 10, 3, 1);
                ctx.fillRect(22, 9, 2, 1);
                ctx.fillRect(19, 10, 3, 1);
                break;
            case 'up':
                ctx.fillRect(8, 8, 2, 3);
                ctx.fillRect(22, 8, 2, 3);
                break;
            case 'thick':
                ctx.fillRect(8, 10, 7, 2);
                ctx.fillRect(17, 10, 7, 2);
                break;
            case 'thin':
                ctx.fillRect(9, 10, 5, 1);
                ctx.fillRect(18, 10, 5, 1);
                break;
        }
    }

    function drawMouthPreview(ctx, id) {
        switch (id) {
            case 'smile':
                ctx.fillRect(13, 19, 6, 1);
                ctx.fillRect(12, 18, 1, 1);
                ctx.fillRect(19, 18, 1, 1);
                break;
            case 'laugh':
                ctx.fillStyle = '#E57373';
                ctx.fillRect(12, 18, 8, 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(13, 18, 6, 1);
                ctx.fillStyle = '#2C2C2C';
                ctx.fillRect(11, 17, 1, 2);
                ctx.fillRect(20, 17, 1, 2);
                break;
            case 'sad':
                ctx.fillRect(13, 18, 6, 1);
                ctx.fillRect(12, 19, 1, 1);
                ctx.fillRect(19, 19, 1, 1);
                break;
            case 'surprised':
                ctx.fillStyle = '#E57373';
                ctx.fillRect(14, 18, 4, 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(15, 19, 2, 1);
                break;
            case 'neutral':
                ctx.fillRect(13, 19, 6, 1);
                break;
            case 'teeth':
                ctx.fillRect(12, 18, 8, 1);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(13, 19, 2, 1);
                ctx.fillRect(17, 19, 2, 1);
                break;
            case 'rose':
                ctx.fillRect(13, 19, 6, 1);
                ctx.fillStyle = '#E94560';
                ctx.fillRect(19, 17, 4, 2);
                ctx.fillStyle = '#27AE60';
                ctx.fillRect(18, 19, 2, 1);
                ctx.fillRect(17, 20, 1, 1);
                break;
        }
    }

    function drawNosePreview(ctx, id) {
        switch (id) {
            case 'none':
                break;
            case 'small':
                ctx.fillRect(15, 16, 2, 1);
                break;
            case 'triangle':
                ctx.fillRect(15, 16, 2, 1);
                ctx.fillRect(16, 17, 1, 1);
                break;
        }
    }

    function drawBlushPreview(ctx, id) {
        switch (id) {
            case 'none':
                break;
            case 'circle':
                ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
                ctx.fillRect(9, 16, 3, 2);
                ctx.fillRect(20, 16, 3, 2);
                break;
            case 'slash':
                ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
                ctx.fillRect(8, 15, 4, 1);
                ctx.fillRect(9, 16, 3, 1);
                ctx.fillRect(20, 15, 4, 1);
                ctx.fillRect(20, 16, 3, 1);
                break;
        }
    }

    function updateActive(type, id) {
        let container = null;
        switch (type) {
            case 'eye':
                container = eyeContainer;
                break;
            case 'eyebrow':
                container = eyebrowContainer;
                break;
            case 'mouth':
                container = mouthContainer;
                break;
            case 'nose':
                container = noseContainer;
                break;
            case 'blush':
                container = blushContainer;
                break;
        }
        if (container) {
            UI.updateActiveOptions(container, id);
        }
    }

    return {
        init,
        updateActive
    };
})();