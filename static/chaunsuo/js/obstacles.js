const Obstacles = (function() {
    let canvas, ctx;
    let obstacles = [];
    let spawnTimer = 0;
    let spawnInterval = 60;
    let speed = 5;
    let types = {
        BLOCK: 'block',
        DIAMOND: 'diamond',
        ELECTRIC: 'electric',
        ORB: 'orb'
    };

    let obstacleConfig = {
        [types.BLOCK]: {
            color: '#ff3366',
            damage: 10,
            scorePenalty: 100,
            width: 60,
            height: 60
        },
        [types.DIAMOND]: {
            color: '#ff9900',
            damage: 8,
            scorePenalty: 80,
            width: 55,
            height: 55
        },
        [types.ELECTRIC]: {
            color: '#ffee00',
            damage: 15,
            scorePenalty: 150,
            width: 0,
            height: 20
        },
        [types.ORB]: {
            color: '#00ffee',
            damage: 0,
            scoreBonus: 50,
            radius: 20
        }
    };

    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        reset();
    }

    function reset() {
        obstacles = [];
        spawnTimer = 0;
        spawnInterval = 60;
        speed = 5;
    }

    function setSpeed(newSpeed) {
        speed = newSpeed;
        spawnInterval = Math.max(30, 80 - newSpeed * 3);
    }

    function update() {
        spawnTimer++;
        
        if (spawnTimer >= spawnInterval) {
            spawnObstacle();
            spawnTimer = 0;
        }
        
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y += speed + obs.speed;
            
            if (obs.type === types.ORB) {
                obs.pulse = (obs.pulse || 0) + 0.1;
            }
            
            if (obs.y > canvas.height + 100) {
                obstacles.splice(i, 1);
            }
        }
    }

    function spawnObstacle() {
        const typeRoll = Math.random();
        let type;
        
        if (typeRoll < 0.25) {
            type = types.ORB;
        } else if (typeRoll < 0.5) {
            type = types.BLOCK;
        } else if (typeRoll < 0.75) {
            type = types.DIAMOND;
        } else {
            type = types.ELECTRIC;
        }
        
        const config = obstacleConfig[type];
        const playerMargin = 50;
        const playerWidth = 50;
        const minX = playerMargin;
        const maxX = canvas.width - playerWidth - playerMargin;
        
        let x, y, width, height;
        
        if (type === types.ELECTRIC) {
            width = canvas.width * 0.7 + Math.random() * canvas.width * 0.2;
            height = config.height;
            x = (canvas.width - width) / 2 + (Math.random() - 0.5) * 150;
            x = Math.max(0, Math.min(canvas.width - width, x));
            y = -height;
        } else if (type === types.ORB) {
            width = config.radius * 2;
            height = config.radius * 2;
            x = minX + Math.random() * (maxX - minX + playerWidth - width);
            y = -height;
        } else {
            width = config.width;
            height = config.height;
            x = minX + Math.random() * (maxX - minX + playerWidth - width);
            y = -height;
        }
        
        obstacles.push({
            type,
            x,
            y,
            width,
            height,
            color: config.color,
            speed: Math.random() * 2,
            pulse: 0
        });
        
        if (speed > 8 && Math.random() < 0.15) {
            spawnSideObstacle();
        }
    }
    
    function spawnSideObstacle() {
        const playerMargin = 50;
        const playerWidth = 50;
        const minX = playerMargin;
        const maxX = canvas.width - playerWidth - playerMargin;
        
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const typeRoll = Math.random();
        let type;
        
        if (typeRoll < 0.5) {
            type = types.BLOCK;
        } else {
            type = types.DIAMOND;
        }
        
        const config = obstacleConfig[type];
        let x;
        
        if (side === 'left') {
            x = minX + Math.random() * 60;
        } else {
            x = maxX + playerWidth - config.width - Math.random() * 60;
        }
        
        obstacles.push({
            type,
            x,
            y: -config.height - Math.random() * 200,
            width: config.width,
            height: config.height,
            color: config.color,
            speed: Math.random() * 2,
            pulse: 0
        });
    }

    function draw() {
        obstacles.forEach(obs => {
            const config = obstacleConfig[obs.type];
            
            ctx.save();
            
            if (obs.type === types.BLOCK) {
                drawBlock(obs);
            } else if (obs.type === types.DIAMOND) {
                drawDiamond(obs);
            } else if (obs.type === types.ELECTRIC) {
                drawElectric(obs);
            } else if (obs.type === types.ORB) {
                drawOrb(obs);
            }
            
            ctx.restore();
        });
    }

    function drawBlock(obs) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 20;
        
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obs.x + 5, obs.y + 5, obs.width - 10, 5);
    }

    function drawDiamond(obs) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        const size = obs.width / 2;
        
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 25;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.fillStyle = obs.color;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - size * 0.5);
        ctx.lineTo(cx + size * 0.5, cy);
        ctx.lineTo(cx, cy + size * 0.5);
        ctx.lineTo(cx - size * 0.5, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }

    function drawElectric(obs) {
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 30;
        
        const gradient = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        gradient.addColorStop(0, 'rgba(255, 238, 0, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 238, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 238, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(obs.x + Math.random() * obs.width, obs.y);
            ctx.lineTo(obs.x + Math.random() * obs.width, obs.y + obs.height);
            ctx.stroke();
        }
    }

    function drawOrb(obs) {
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2;
        const radius = obstacleConfig[types.ORB].radius;
        const pulseSize = radius + Math.sin(obs.pulse) * 5;
        
        ctx.shadowColor = obs.color;
        ctx.shadowBlur = 30;
        
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseSize * 2);
        gradient.addColorStop(0, 'rgba(0, 255, 238, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 238, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 238, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(cx - pulseSize * 2, cy - pulseSize * 2, pulseSize * 4, pulseSize * 4);
        
        ctx.beginPath();
        ctx.arc(cx, cy, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = obs.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(cx - pulseSize * 0.3, cy - pulseSize * 0.3, pulseSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
    }

    function checkCollision(playerBounds) {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            const obsBounds = getObstacleBounds(obs);
            
            if (boundsIntersect(playerBounds, obsBounds)) {
                const config = obstacleConfig[obs.type];
                obstacles.splice(i, 1);
                
                return {
                    type: obs.type,
                    damage: config.damage,
                    scorePenalty: config.scorePenalty || 0,
                    scoreBonus: config.scoreBonus || 0,
                    x: obs.x + obs.width / 2,
                    y: obs.y + obs.height / 2
                };
            }
        }
        return null;
    }

    function getObstacleBounds(obs) {
        if (obs.type === types.ORB) {
            const radius = obstacleConfig[types.ORB].radius;
            return {
                x: obs.x + obs.width / 2 - radius,
                y: obs.y + obs.height / 2 - radius,
                width: radius * 2,
                height: radius * 2
            };
        }
        return {
            x: obs.x,
            y: obs.y,
            width: obs.width,
            height: obs.height
        };
    }

    function boundsIntersect(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    function getObstacles() {
        return obstacles;
    }

    function getTypes() {
        return types;
    }

    function getState() {
        return {
            obstacles: [...obstacles],
            spawnTimer,
            spawnInterval,
            speed
        };
    }

    function setState(state) {
        obstacles = [...state.obstacles];
        spawnTimer = state.spawnTimer;
        spawnInterval = state.spawnInterval;
        speed = state.speed;
    }

    return {
        init,
        reset,
        update,
        draw,
        setSpeed,
        checkCollision,
        getObstacles,
        getTypes,
        getState,
        setState
    };
})();
