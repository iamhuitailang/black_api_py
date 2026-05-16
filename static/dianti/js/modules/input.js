const Input = (() => {
    const keys = {};
    const keyJustPressed = {};
    
    const init = () => {
        window.addEventListener('keydown', (e) => {
            if (!keys[e.code]) {
                keyJustPressed[e.code] = true;
            }
            keys[e.code] = true;
            
            if (e.code === 'Space' || e.code === 'ArrowUp' || 
                e.code === 'ArrowDown' || e.code === 'ArrowLeft' || 
                e.code === 'ArrowRight') {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
    };
    
    const isKeyDown = (code) => {
        return keys[code] === true;
    };
    
    const isKeyJustPressed = (code) => {
        const pressed = keyJustPressed[code] === true;
        keyJustPressed[code] = false;
        return pressed;
    };
    
    const getDirection = () => {
        let dx = 0;
        let dy = 0;
        
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
        if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
        
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.sqrt(2);
            dx *= factor;
            dy *= factor;
        }
        
        return { dx, dy };
    };
    
    const update = () => {
        Object.keys(keyJustPressed).forEach(key => {
            keyJustPressed[key] = false;
        });
    };
    
    return {
        init,
        isKeyDown,
        isKeyJustPressed,
        getDirection,
        update
    };
})();