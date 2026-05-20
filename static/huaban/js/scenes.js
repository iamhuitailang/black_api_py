const Scenes = (function() {
    const THEMES = {
        city: {
            id: 'city',
            name: '城市街道',
            skyGradient: ['#87CEEB', '#E0F6FF'],
            groundColor: '#8B7355',
            groundDarkColor: '#6B5344',
            buildingColors: ['#708090', '#778899', '#696969', '#808080'],
            obstacleColors: {
                cone: '#FF6B35',
                trash: '#4A4A4A',
                barrier: '#E74C3C'
            },
            obstacleFrequency: 0.3,
            railFrequency: 0.2,
            rampFrequency: 0.15
        },
        park: {
            id: 'park',
            name: '滑板公园',
            skyGradient: ['#87CEEB', '#B0E0E6'],
            groundColor: '#6B8E23',
            groundDarkColor: '#556B2F',
            buildingColors: ['#D2B48C', '#DEB887', '#F5DEB3'],
            obstacleColors: {
                cone: '#FF6B35',
                trash: '#4A4A4A',
                barrier: '#3498DB'
            },
            obstacleFrequency: 0.2,
            railFrequency: 0.4,
            rampFrequency: 0.3
        },
        desert: {
            id: 'desert',
            name: '沙漠公路',
            skyGradient: ['#FFB347', '#FFCC99'],
            groundColor: '#C2B280',
            groundDarkColor: '#A0926C',
            buildingColors: ['#D2691E', '#CD853F', '#DEB887'],
            obstacleColors: {
                cone: '#FF6B35',
                cactus: '#228B22',
                vehicle: '#8B4513'
            },
            obstacleFrequency: 0.35,
            railFrequency: 0.1,
            rampFrequency: 0.25
        },
        industrial: {
            id: 'industrial',
            name: '工业区',
            skyGradient: ['#708090', '#A9A9A9'],
            groundColor: '#696969',
            groundDarkColor: '#505050',
            buildingColors: ['#4A4A4A', '#5A5A5A', '#3A3A3A'],
            obstacleColors: {
                pipe: '#B87333',
                container: '#1E90FF',
                barrier: '#E74C3C'
            },
            obstacleFrequency: 0.4,
            railFrequency: 0.35,
            rampFrequency: 0.2
        },
        night: {
            id: 'night',
            name: '夜间城市',
            skyGradient: ['#191970', '#000033'],
            groundColor: '#2F2F2F',
            groundDarkColor: '#1A1A1A',
            buildingColors: ['#1C1C1C', '#2A2A2A', '#383838'],
            obstacleColors: {
                cone: '#FF6B35',
                trash: '#4A4A4A',
                vehicle: '#FFD700'
            },
            obstacleFrequency: 0.45,
            railFrequency: 0.25,
            rampFrequency: 0.15,
            isNight: true,
            neonColor: '#00FFFF'
        }
    };
    
    let currentTheme = THEMES.city;
    let generatedChunks = new Map();
    let chunkSize = 1000;
    let groundY = 0;
    
    function init(themeId, canvasHeight) {
        currentTheme = THEMES[themeId] || THEMES.city;
        groundY = canvasHeight * 0.6;
        generatedChunks.clear();
    }
    
    function getTheme() {
        return currentTheme;
    }
    
    function getGroundY() {
        return groundY;
    }
    
    function generateChunk(chunkIndex) {
        if (generatedChunks.has(chunkIndex)) {
            return generatedChunks.get(chunkIndex);
        }
        
        const chunkX = chunkIndex * chunkSize;
        const chunk = {
            index: chunkIndex,
            x: chunkX,
            obstacles: [],
            rails: [],
            ramps: [],
            collectibles: [],
            boostPads: [],
            vehicles: [],
            buildings: []
        };
        
        generateBuildings(chunk);
        
        const rand = Math.random();
        if (rand < currentTheme.obstacleFrequency) {
            generateObstacle(chunk);
        }
        
        if (Math.random() < currentTheme.railFrequency) {
            generateRail(chunk);
        }
        
        if (Math.random() < currentTheme.rampFrequency) {
            generateRamp(chunk);
        }
        
        if (Math.random() < 0.3) {
            generateCollectibles(chunk);
        }
        
        if (Math.random() < 0.15) {
            generateBoostPad(chunk);
        }
        
        if (currentTheme.id === 'city' || currentTheme.id === 'night') {
            if (Math.random() < 0.1) {
                generateVehicle(chunk);
            }
        }
        
        generatedChunks.set(chunkIndex, chunk);
        return chunk;
    }
    
    function generateBuildings(chunk) {
        const buildingCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < buildingCount; i++) {
            const width = 80 + Math.random() * 120;
            const height = 150 + Math.random() * 300;
            const x = chunk.x + (i / buildingCount) * chunkSize + Math.random() * 50;
            const y = groundY - height;
            
            chunk.buildings.push({
                x: x,
                y: y,
                width: width,
                height: height,
                color: currentTheme.buildingColors[Math.floor(Math.random() * currentTheme.buildingColors.length)],
                windows: generateWindows(width, height),
                isNeon: currentTheme.isNight && Math.random() < 0.3
            });
        }
    }
    
    function generateWindows(buildingWidth, buildingHeight) {
        const windows = [];
        const cols = Math.floor(buildingWidth / 30);
        const rows = Math.floor(buildingHeight / 40);
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() < 0.7) {
                    windows.push({
                        x: 15 + c * 30,
                        y: 20 + r * 40,
                        width: 15,
                        height: 20,
                        lit: Math.random() < 0.6
                    });
                }
            }
        }
        
        return windows;
    }
    
    function generateObstacle(chunk) {
        const types = ['cone', 'trash', 'barrier'];
        if (currentTheme.id === 'desert') types.push('cactus');
        if (currentTheme.id === 'industrial') types.push('pipe', 'container');
        
        const type = types[Math.floor(Math.random() * types.length)];
        const x = chunk.x + 200 + Math.random() * (chunkSize - 400);
        
        let width, height;
        switch (type) {
            case 'cone':
                width = 30;
                height = 40;
                break;
            case 'trash':
                width = 40;
                height = 50;
                break;
            case 'barrier':
                width = 60;
                height = 30;
                break;
            case 'cactus':
                width = 25;
                height = 60;
                break;
            case 'pipe':
                width = 80;
                height = 40;
                break;
            case 'container':
                width = 100;
                height = 80;
                break;
            default:
                width = 40;
                height = 40;
        }
        
        chunk.obstacles.push({
            type: type,
            x: x,
            y: groundY - height,
            width: width,
            height: height,
            color: currentTheme.obstacleColors[type] || '#FF6B35'
        });
    }
    
    function generateRail(chunk) {
        const x = chunk.x + 150 + Math.random() * (chunkSize - 300);
        const width = 100 + Math.random() * 150;
        const height = 5;
        const elevation = 40 + Math.random() * 30;
        
        chunk.rails.push({
            x: x,
            y: groundY - elevation,
            width: width,
            height: height,
            elevation: elevation,
            color: '#C0C0C0'
        });
    }
    
    function generateRamp(chunk) {
        const x = chunk.x + 200 + Math.random() * (chunkSize - 400);
        const width = 150 + Math.random() * 100;
        const height = 60 + Math.random() * 40;
        const types = ['up', 'down', 'pipe'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        chunk.ramps.push({
            type: type,
            x: x,
            y: groundY - height,
            width: width,
            height: height,
            color: '#8B4513'
        });
    }
    
    function generateCollectibles(chunk) {
        const count = 3 + Math.floor(Math.random() * 5);
        const startX = chunk.x + 100 + Math.random() * 200;
        const pattern = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            let x, y;
            
            switch (pattern) {
                case 0:
                    x = startX + i * 50;
                    y = groundY - 100;
                    break;
                case 1:
                    x = startX + i * 40;
                    y = groundY - 80 - Math.sin(i * 0.8) * 40;
                    break;
                case 2:
                    x = startX + i * 60;
                    y = groundY - 150 - i * 10;
                    break;
            }
            
            const type = Math.random() < 0.8 ? 'coin' : 'star';
            
            chunk.collectibles.push({
                type: type,
                x: x,
                y: y,
                width: type === 'coin' ? 20 : 25,
                height: type === 'coin' ? 20 : 25,
                value: type === 'coin' ? 10 : 50,
                collected: false,
                animationOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    function generateBoostPad(chunk) {
        const x = chunk.x + 300 + Math.random() * (chunkSize - 400);
        const width = 80;
        const height = 10;
        
        chunk.boostPads.push({
            x: x,
            y: groundY - height,
            width: width,
            height: height,
            color: '#00FF88',
            active: true
        });
    }
    
    function generateVehicle(chunk) {
        const x = chunk.x + Math.random() * chunkSize;
        const width = 100 + Math.random() * 50;
        const height = 50 + Math.random() * 20;
        
        chunk.vehicles.push({
            x: x,
            y: groundY - height,
            width: width,
            height: height,
            speed: 2 + Math.random() * 3,
            direction: Math.random() < 0.5 ? 1 : -1,
            color: currentTheme.obstacleColors.vehicle || '#FFD700'
        });
    }
    
    function generateTrickArena() {
        const arena = {
            obstacles: [],
            rails: [],
            ramps: [],
            collectibles: [],
            boostPads: [],
            vehicles: [],
            buildings: []
        };
        
        const halfPipeWidth = 400;
        const halfPipeHeight = 150;
        const centerX = 400;
        
        arena.ramps.push({
            type: 'pipe',
            x: centerX - halfPipeWidth / 2,
            y: groundY - halfPipeHeight,
            width: halfPipeWidth / 2,
            height: halfPipeHeight,
            color: '#8B4513'
        });
        
        arena.ramps.push({
            type: 'pipe',
            x: centerX,
            y: groundY - halfPipeHeight,
            width: halfPipeWidth / 2,
            height: halfPipeHeight,
            color: '#8B4513',
            flipped: true
        });
        
        arena.rails.push({
            x: centerX - 100,
            y: groundY - 60,
            width: 200,
            height: 5,
            elevation: 60,
            color: '#C0C0C0'
        });
        
        return arena;
    }
    
    function updateVehicles(chunks, deltaTime) {
        for (const chunk of chunks) {
            for (const vehicle of chunk.vehicles) {
                vehicle.x += vehicle.speed * vehicle.direction * (deltaTime / 16.67);
                
                if (vehicle.x < chunk.x - 200 || vehicle.x > chunk.x + chunkSize + 200) {
                    vehicle.direction *= -1;
                }
            }
        }
    }
    
    function drawBackground(ctx, cameraX, canvasWidth, canvasHeight) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, currentTheme.skyGradient[0]);
        gradient.addColorStop(1, currentTheme.skyGradient[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        drawClouds(ctx, cameraX, canvasWidth);
        
        if (currentTheme.isNight) {
            drawStars(ctx, cameraX, canvasWidth, canvasHeight);
            drawMoon(ctx, canvasWidth);
        }
    }
    
    function drawClouds(ctx, cameraX, canvasWidth) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 5; i++) {
            const cloudX = ((i * 300 - cameraX * 0.3) % (canvasWidth + 200)) - 100;
            const cloudY = 50 + i * 30;
            
            ctx.beginPath();
            ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
            ctx.arc(cloudX + 25, cloudY - 10, 25, 0, Math.PI * 2);
            ctx.arc(cloudX + 50, cloudY, 30, 0, Math.PI * 2);
            ctx.arc(cloudX + 25, cloudY + 10, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawStars(ctx, cameraX, canvasWidth, canvasHeight) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (let i = 0; i < 50; i++) {
            const starX = ((i * 137 - cameraX * 0.1) % canvasWidth + canvasWidth) % canvasWidth;
            const starY = (i * 73) % (canvasHeight * 0.5);
            const size = 1 + (i % 3);
            
            ctx.beginPath();
            ctx.arc(starX, starY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawMoon(ctx, canvasWidth) {
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(canvasWidth - 100, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#EEE8AA';
        ctx.beginPath();
        ctx.arc(canvasWidth - 90, 70, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(canvasWidth - 110, 90, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawGround(ctx, cameraX, canvasWidth, canvasHeight) {
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvasHeight);
        groundGradient.addColorStop(0, currentTheme.groundColor);
        groundGradient.addColorStop(1, currentTheme.groundDarkColor);
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, canvasWidth, canvasHeight - groundY);
        
        ctx.strokeStyle = currentTheme.isNight ? '#333' : '#5D4E37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(canvasWidth, groundY);
        ctx.stroke();
        
        ctx.strokeStyle = currentTheme.isNight ? '#222' : '#6B5344';
        ctx.lineWidth = 1;
        for (let x = -cameraX % 100; x < canvasWidth; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 20);
            ctx.lineTo(x + 50, groundY + 20);
            ctx.stroke();
        }
    }
    
    function drawBuildings(ctx, chunks, cameraX, canvasWidth) {
        for (const chunk of chunks) {
            for (const building of chunk.buildings) {
                const screenX = building.x - cameraX;
                
                if (screenX + building.width < 0 || screenX > canvasWidth) continue;
                
                ctx.fillStyle = building.color;
                ctx.fillRect(screenX, building.y, building.width, building.height);
                
                if (currentTheme.isNight) {
                    for (const window of building.windows) {
                        ctx.fillStyle = window.lit ? '#FFD700' : '#1A1A1A';
                        ctx.fillRect(screenX + window.x, building.y + window.y, window.width, window.height);
                    }
                    
                    if (building.isNeon) {
                        ctx.strokeStyle = currentTheme.neonColor;
                        ctx.lineWidth = 2;
                        ctx.shadowColor = currentTheme.neonColor;
                        ctx.shadowBlur = 10;
                        ctx.strokeRect(screenX, building.y, building.width, building.height);
                        ctx.shadowBlur = 0;
                    }
                } else {
                    for (const window of building.windows) {
                        ctx.fillStyle = window.lit ? '#FFFFE0' : '#B0C4DE';
                        ctx.fillRect(screenX + window.x, building.y + window.y, window.width, window.height);
                    }
                }
            }
        }
    }
    
    function drawObstacles(ctx, chunks, cameraX, canvasWidth) {
        for (const chunk of chunks) {
            for (const obstacle of chunk.obstacles) {
                const screenX = obstacle.x - cameraX;
                
                if (screenX + obstacle.width < 0 || screenX > canvasWidth) continue;
                
                switch (obstacle.type) {
                    case 'cone':
                        drawCone(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                    case 'trash':
                        drawTrashCan(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                    case 'barrier':
                        drawBarrier(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                    case 'cactus':
                        drawCactus(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                    case 'pipe':
                        drawPipe(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                    case 'container':
                        drawContainer(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle.color);
                        break;
                }
            }
        }
    }
    
    function drawCone(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x + 5, y + height * 0.4, width - 10, height * 0.15);
        ctx.fillRect(x + 8, y + height * 0.6, width - 16, height * 0.15);
    }
    
    function drawTrashCan(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y + 5, width, height - 5, 3);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 3, y, width + 6, 8);
        
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 15 + i * 12);
            ctx.lineTo(x + width - 10, y + 15 + i * 12);
            ctx.stroke();
        }
    }
    
    function drawBarrier(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = '#FFF';
        for (let i = 0; i < width; i += 20) {
            ctx.fillRect(x + i, y, 10, height);
        }
    }
    
    function drawCactus(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x + width * 0.3, y, width * 0.4, height, 5);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(x, y + height * 0.3, width * 0.35, height * 0.15, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x, y + height * 0.15, width * 0.15, height * 0.3, 3);
        ctx.fill();
        
        ctx.beginPath();
        ctx.roundRect(x + width * 0.65, y + height * 0.5, width * 0.35, height * 0.12, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x + width * 0.85, y + height * 0.35, width * 0.15, height * 0.3, 3);
        ctx.fill();
    }
    
    function drawPipe(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawContainer(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y + (i + 1) * height / 4);
            ctx.lineTo(x + width, y + (i + 1) * height / 4);
            ctx.stroke();
        }
    }
    
    function drawRails(ctx, chunks, cameraX, canvasWidth) {
        for (const chunk of chunks) {
            for (const rail of chunk.rails) {
                const screenX = rail.x - cameraX;
                
                if (screenX + rail.width < 0 || screenX > canvasWidth) continue;
                
                ctx.fillStyle = '#333';
                ctx.fillRect(screenX + 10, rail.y + rail.height, 10, groundY - rail.y - rail.height);
                ctx.fillRect(screenX + rail.width - 20, rail.y + rail.height, 10, groundY - rail.y - rail.height);
                
                ctx.fillStyle = rail.color;
                ctx.beginPath();
                ctx.roundRect(screenX, rail.y, rail.width, rail.height, 2);
                ctx.fill();
                
                ctx.fillStyle = '#E0E0E0';
                ctx.fillRect(screenX, rail.y, rail.width, 2);
            }
        }
    }
    
    function drawRamps(ctx, chunks, cameraX, canvasWidth) {
        for (const chunk of chunks) {
            for (const ramp of chunk.ramps) {
                const screenX = ramp.x - cameraX;
                
                if (screenX + ramp.width < 0 || screenX > canvasWidth) continue;
                
                drawRamp(ctx, screenX, ramp);
            }
        }
    }
    
    function drawRamp(ctx, x, ramp) {
        const steps = 20;
        
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        
        for (let i = 0; i <= steps; i++) {
            const px = x + (i / steps) * ramp.width;
            const rampHeight = Physics.getRampHeightAt(ramp.x + (i / steps) * ramp.width, ramp);
            const py = ramp.y + ramp.height - rampHeight;
            ctx.lineTo(px, py);
        }
        
        ctx.lineTo(x + ramp.width, groundY);
        ctx.closePath();
        ctx.fillStyle = ramp.color;
        ctx.fill();
        
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        
        for (let i = 0; i <= steps; i++) {
            const px = x + (i / steps) * ramp.width;
            const rampHeight = Physics.getRampHeightAt(ramp.x + (i / steps) * ramp.width, ramp);
            const py = ramp.y + ramp.height - rampHeight;
            ctx.lineTo(px, py);
        }
        
        ctx.lineTo(x + ramp.width, groundY);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(x + 5, groundY - 5);
        for (let i = 0; i <= steps; i++) {
            const px = x + 5 + (i / steps) * (ramp.width - 10);
            const rampHeight = Physics.getRampHeightAt(ramp.x + (i / steps) * ramp.width, ramp);
            const py = ramp.y + ramp.height - rampHeight - 5;
            ctx.lineTo(px, py);
        }
        ctx.lineTo(x + ramp.width - 5, groundY - 5);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawCollectibles(ctx, chunks, cameraX, canvasWidth, time) {
        for (const chunk of chunks) {
            for (const item of chunk.collectibles) {
                if (item.collected) continue;
                
                const screenX = item.x - cameraX;
                
                if (screenX + item.width < 0 || screenX > canvasWidth) continue;
                
                const floatOffset = Math.sin(time * 0.005 + item.animationOffset) * 5;
                
                if (item.type === 'coin') {
                    drawCoin(ctx, screenX, item.y + floatOffset, item.width, item.height);
                } else {
                    drawStar(ctx, screenX, item.y + floatOffset, item.width, item.height);
                }
            }
        }
    }
    
    function drawCoin(ctx, x, y, width, height) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#DAA520';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x + width / 2, y + height / 2);
    }
    
    function drawStar(ctx, x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const spikes = 5;
        const outerRadius = width / 2;
        const innerRadius = width / 4;
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = centerX + Math.cos(angle) * radius;
            const py = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawBoostPads(ctx, chunks, cameraX, canvasWidth, time) {
        for (const chunk of chunks) {
            for (const pad of chunk.boostPads) {
                const screenX = pad.x - cameraX;
                
                if (screenX + pad.width < 0 || screenX > canvasWidth) continue;
                
                const glowIntensity = 0.5 + Math.sin(time * 0.01) * 0.3;
                
                ctx.shadowColor = pad.color;
                ctx.shadowBlur = 15 * glowIntensity;
                
                ctx.fillStyle = pad.color;
                ctx.beginPath();
                ctx.roundRect(screenX, pad.y, pad.width, pad.height, 3);
                ctx.fill();
                
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.moveTo(screenX + pad.width * 0.3, pad.y + pad.height / 2);
                ctx.lineTo(screenX + pad.width * 0.7, pad.y + pad.height / 2);
                ctx.lineTo(screenX + pad.width * 0.5, pad.y + pad.height + 5);
                ctx.closePath();
                ctx.fill();
                
                ctx.shadowBlur = 0;
            }
        }
    }
    
    function drawVehicles(ctx, chunks, cameraX, canvasWidth) {
        for (const chunk of chunks) {
            for (const vehicle of chunk.vehicles) {
                const screenX = vehicle.x - cameraX;
                
                if (screenX + vehicle.width < 0 || screenX > canvasWidth) continue;
                
                ctx.fillStyle = vehicle.color;
                ctx.beginPath();
                ctx.roundRect(screenX, vehicle.y, vehicle.width, vehicle.height * 0.7, 5);
                ctx.fill();
                
                ctx.fillStyle = '#2C3E50';
                ctx.beginPath();
                ctx.roundRect(screenX + vehicle.width * 0.2, vehicle.y - vehicle.height * 0.3, vehicle.width * 0.6, vehicle.height * 0.4, 3);
                ctx.fill();
                
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(screenX + vehicle.width * 0.25, vehicle.y - vehicle.height * 0.25, vehicle.width * 0.2, vehicle.height * 0.25);
                ctx.fillRect(screenX + vehicle.width * 0.55, vehicle.y - vehicle.height * 0.25, vehicle.width * 0.2, vehicle.height * 0.25);
                
                ctx.fillStyle = '#1A1A1A';
                ctx.beginPath();
                ctx.arc(screenX + vehicle.width * 0.2, vehicle.y + vehicle.height * 0.7, vehicle.height * 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(screenX + vehicle.width * 0.8, vehicle.y + vehicle.height * 0.7, vehicle.height * 0.15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#FFFF00';
                if (vehicle.direction > 0) {
                    ctx.fillRect(screenX + vehicle.width - 5, vehicle.y + vehicle.height * 0.2, 5, vehicle.height * 0.2);
                } else {
                    ctx.fillRect(screenX, vehicle.y + vehicle.height * 0.2, 5, vehicle.height * 0.2);
                }
            }
        }
    }
    
    function getChunkSize() {
        return chunkSize;
    }
    
    function getChunkIndex(x) {
        return Math.floor(x / chunkSize);
    }
    
    function clearChunks() {
        generatedChunks.clear();
    }
    
    function cleanupChunks(cameraX, visibleRange) {
        const minChunk = Math.floor((cameraX - visibleRange) / chunkSize);
        const maxChunk = Math.floor((cameraX + visibleRange) / chunkSize);
        
        for (const [index, chunk] of generatedChunks) {
            if (index < minChunk - 2 || index > maxChunk + 2) {
                generatedChunks.delete(index);
            }
        }
    }
    
    return {
        THEMES,
        init,
        getTheme,
        getGroundY,
        generateChunk,
        generateTrickArena,
        updateVehicles,
        drawBackground,
        drawGround,
        drawBuildings,
        drawObstacles,
        drawRails,
        drawRamps,
        drawCollectibles,
        drawBoostPads,
        drawVehicles,
        getChunkSize,
        getChunkIndex,
        clearChunks,
        cleanupChunks
    };
})();
