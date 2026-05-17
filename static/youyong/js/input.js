const Input = (() => {
    let canvas = null;
    let callbacks = {};
    let lastStrokeTime = 0;
    let strokeHistory = [];
    let mouseDown = false;
    let mousePosition = { x: 0, y: 0 };
    let lastMousePosition = { x: 0, y: 0 };
    let mouseCirclePoints = [];
    let swipeStart = { x: 0, y: 0 };
    let isSwipe = false;
    let lastKeyTime = 0;
    let lastKey = null;

    const init = (canvasElement) => {
        canvas = canvasElement;
        attachEvents();
    };

    const attachEvents = () => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseUp);

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    };

    const handleKeyDown = (e) => {
        const now = performance.now() / 1000;

        if (e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            trigger('breathe');
            return;
        }

        if (e.code === 'Escape') {
            e.preventDefault();
            trigger('pause');
            return;
        }

        if (e.repeat) return;

        if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            lastKey = 'left';
            handleStroke(now, 'keyboard');
        } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            lastKey = 'right';
            handleStroke(now, 'keyboard');
        }
    };

    const handleKeyUp = (e) => {
        if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') {
            lastKey = null;
        }
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        mouseDown = true;
        mousePosition.x = e.clientX;
        mousePosition.y = e.clientY;
        lastMousePosition.x = e.clientX;
        lastMousePosition.y = e.clientY;
        mouseCirclePoints = [];
        const now = performance.now() / 1000;
        handleStroke(now, 'click');
    };

    const handleMouseUp = (e) => {
        mouseDown = false;
        mouseCirclePoints = [];
    };

    const handleMouseMove = (e) => {
        if (!mouseDown) return;

        lastMousePosition.x = mousePosition.x;
        lastMousePosition.y = mousePosition.y;
        mousePosition.x = e.clientX;
        mousePosition.y = e.clientY;

        mouseCirclePoints.push({ x: e.clientX, y: e.clientY, time: performance.now() / 1000 });

        const recentPoints = mouseCirclePoints.filter(p => performance.now() / 1000 - p.time < 0.5);
        if (recentPoints.length > 10) {
            const circleScore = calculateCircleScore(recentPoints);
            if (circleScore > Config.INPUT.MOUSE_CIRCLE_THRESHOLD) {
                const now = performance.now() / 1000;
                handleStroke(now, 'circle');
                mouseCirclePoints = [];
            }
        }
    };

    const calculateCircleScore = (points) => {
        if (points.length < 5) return 0;

        const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        const distances = points.map(p =>
            Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2));
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((sum, d) => sum + (d - avgDistance) ** 2, 0) / distances.length;
        const stdDev = Math.sqrt(variance);

        const totalAngle = calculateTotalAngle(points);
        const closedLoop = Math.abs(totalAngle) > Math.PI * 1.5;

        return closedLoop ? avgDistance * (1 - stdDev / avgDistance) : 0;
    };

    const calculateTotalAngle = (points) => {
        let totalAngle = 0;
        for (let i = 1; i < points.length - 1; i++) {
            const v1 = {
                x: points[i].x - points[i - 1].x,
                y: points[i].y - points[i - 1].y
            };
            const v2 = {
                x: points[i + 1].x - points[i].x,
                y: points[i + 1].y - points[i].y
            };
            const cross = v1.x * v2.y - v1.y * v2.x;
            const dot = v1.x * v2.x + v1.y * v2.y;
            totalAngle += Math.atan2(cross, dot);
        }
        return totalAngle;
    };

    const handleTouchStart = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            swipeStart.x = touch.clientX;
            swipeStart.y = touch.clientY;
            isSwipe = false;
            const now = performance.now() / 1000;
            handleStroke(now, 'touch');
        }
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - swipeStart.x;
            const deltaY = touch.clientY - swipeStart.y;

            if (Math.abs(deltaY) > Config.INPUT.SWIPE_THRESHOLD) {
                isSwipe = true;
                const now = performance.now() / 1000;
                handleStroke(now, 'swipe');
                swipeStart.x = touch.clientX;
                swipeStart.y = touch.clientY;
            }
        }
    };

    const handleTouchEnd = (e) => {
        e.preventDefault();
        isSwipe = false;
    };

    const handleStroke = (time, source) => {
        const timeSinceLastStroke = lastStrokeTime > 0 ? time - lastStrokeTime : 0.4;
        const rhythmScore = calculateRhythmScore(timeSinceLastStroke);
        lastStrokeTime = time;

        strokeHistory.push({ time, source, rhythm: rhythmScore });
        if (strokeHistory.length > 10) {
            strokeHistory.shift();
        }

        trigger('stroke', {
            time,
            source,
            rhythm: rhythmScore,
            timeSinceLast: timeSinceLastStroke
        });
    };

    const calculateRhythmScore = (interval) => {
        const optimalInterval = 0.4;
        const window = Config.INPUT.RHYTHM_WINDOW;

        if (interval < 0.15) {
            return Config.INPUT.BAD_RHYTHM_PENALTY;
        }

        const deviation = Math.abs(interval - optimalInterval) / window;

        if (deviation < 0.3) {
            return Config.INPUT.PERFECT_RHYTHM_BONUS;
        } else if (deviation < 0.7) {
            return Config.INPUT.GOOD_RHYTHM_BONUS;
        } else {
            return Config.INPUT.BAD_RHYTHM_PENALTY;
        }
    };

    const on = (event, callback) => {
        if (!callbacks[event]) {
            callbacks[event] = [];
        }
        callbacks[event].push(callback);
    };

    const trigger = (event, data) => {
        if (callbacks[event]) {
            callbacks[event].forEach(cb => cb(data));
        }
    };

    const getLastRhythmQuality = () => {
        if (strokeHistory.length < 3) return 'normal';

        const avgRhythm = strokeHistory.reduce((sum, s) => sum + s.rhythm, 0) / strokeHistory.length;

        if (avgRhythm >= Config.INPUT.PERFECT_RHYTHM_BONUS * 0.9) {
            return 'perfect';
        } else if (avgRhythm >= Config.INPUT.GOOD_RHYTHM_BONUS * 0.9) {
            return 'good';
        } else {
            return 'normal';
        }
    };

    const getStrokeRate = () => {
        if (strokeHistory.length < 2) return 0;

        const timeSpan = strokeHistory[strokeHistory.length - 1].time - strokeHistory[0].time;
        return strokeHistory.length / timeSpan;
    };

    const getLastStrokeTime = () => lastStrokeTime;

    return {
        init,
        on,
        getLastRhythmQuality,
        getStrokeRate,
        getLastStrokeTime
    };
})();
