const Input = (() => {
    let canvas = null;
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;
    let isTouching = false;
    let touchX = 0;
    let touchY = 0;
    
    const keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    
    const init = (canvasElement) => {
        canvas = canvasElement;
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    };
    
    const handleKeyDown = (e) => {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                keys.up = true;
                break;
            case 's':
            case 'arrowdown':
                keys.down = true;
                break;
            case 'a':
            case 'arrowleft':
                keys.left = true;
                break;
            case 'd':
            case 'arrowright':
                keys.right = true;
                break;
        }
    };
    
    const handleKeyUp = (e) => {
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                keys.up = false;
                break;
            case 's':
            case 'arrowdown':
                keys.down = false;
                break;
            case 'a':
            case 'arrowleft':
                keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                keys.right = false;
                break;
        }
    };
    
    const getCanvasPosition = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };
    
    const handleMouseMove = (e) => {
        const pos = getCanvasPosition(e.clientX, e.clientY);
        mouseX = pos.x;
        mouseY = pos.y;
    };
    
    const handleMouseDown = () => {
        isMouseDown = true;
    };
    
    const handleMouseUp = () => {
        isMouseDown = false;
    };
    
    const handleMouseLeave = () => {
        isMouseDown = false;
    };
    
    const handleTouchStart = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            isTouching = true;
            const pos = getCanvasPosition(e.touches[0].clientX, e.touches[0].clientY);
            touchX = pos.x;
            touchY = pos.y;
        }
    };
    
    const handleTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const pos = getCanvasPosition(e.touches[0].clientX, e.touches[0].clientY);
            touchX = pos.x;
            touchY = pos.y;
        }
    };
    
    const handleTouchEnd = (e) => {
        e.preventDefault();
        isTouching = false;
    };
    
    const getMovement = (playerX, playerY, speed) => {
        let dx = 0;
        let dy = 0;
        
        if (keys.up) dy -= speed;
        if (keys.down) dy += speed;
        if (keys.left) dx -= speed;
        if (keys.right) dx += speed;
        
        if (isMouseDown || isTouching) {
            const targetX = isTouching ? touchX : mouseX;
            const targetY = isTouching ? touchY : mouseY;
            
            const diffX = targetX - playerX;
            const diffY = targetY - playerY;
            
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);
            
            if (distance > speed) {
                dx = (diffX / distance) * speed;
                dy = (diffY / distance) * speed;
            } else {
                dx = diffX;
                dy = diffY;
            }
        }
        
        return { dx, dy };
    };
    
    const destroy = () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        
        if (canvas) {
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
            canvas.removeEventListener('touchcancel', handleTouchEnd);
        }
    };
    
    return {
        init,
        getMovement,
        destroy
    };
})();
