const collisionManager = {
    getCarCorners(car) {
        const halfWidth = car.width / 2;
        const halfHeight = car.height / 2;
        
        const cos = Math.cos(car.angle);
        const sin = Math.sin(car.angle);
        
        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ];
        
        return corners.map(corner => ({
            x: car.x + corner.x * cos - corner.y * sin,
            y: car.y + corner.x * sin + corner.y * cos
        }));
    },
    
    getAxesFromCorners(corners) {
        const axes = [];
        for (let i = 0; i < corners.length; i++) {
            const p1 = corners[i];
            const p2 = corners[(i + 1) % corners.length];
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            axes.push({ x: -edge.y, y: edge.x });
        }
        return axes;
    },
    
    normalize(axis) {
        const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        return { x: axis.x / length, y: axis.y / length };
    },
    
    project(corners, axis) {
        let min = Infinity;
        let max = -Infinity;
        
        for (const corner of corners) {
            const projection = corner.x * axis.x + corner.y * axis.y;
            min = Math.min(min, projection);
            max = Math.max(max, projection);
        }
        
        return { min, max };
    },
    
    overlap(proj1, proj2) {
        return proj1.min <= proj2.max && proj2.min <= proj1.max;
    },
    
    satCollision(corners1, corners2) {
        const axes1 = this.getAxesFromCorners(corners1);
        const axes2 = this.getAxesFromCorners(corners2);
        const axes = [...axes1, ...axes2];
        
        for (const axis of axes) {
            const normalizedAxis = this.normalize(axis);
            const proj1 = this.project(corners1, normalizedAxis);
            const proj2 = this.project(corners2, normalizedAxis);
            
            if (!this.overlap(proj1, proj2)) {
                return false;
            }
        }
        
        return true;
    },
    
    checkCarObstacleCollision(car, obstacle) {
        const carCorners = this.getCarCorners(car);
        
        const obstacleCorners = [
            { x: obstacle.x, y: obstacle.y },
            { x: obstacle.x + obstacle.width, y: obstacle.y },
            { x: obstacle.x + obstacle.width, y: obstacle.y + obstacle.height },
            { x: obstacle.x, y: obstacle.y + obstacle.height }
        ];
        
        return this.satCollision(carCorners, obstacleCorners);
    },
    
    checkCarBoundaryCollision(car, canvasWidth, canvasHeight) {
        const carCorners = this.getCarCorners(car);
        
        for (const corner of carCorners) {
            if (corner.x < 0 || corner.x > canvasWidth || 
                corner.y < 0 || corner.y > canvasHeight) {
                return true;
            }
        }
        
        return false;
    },
    
    isCarPartiallyInGarage(car, garage) {
        const carCorners = this.getCarCorners(car);
        
        const angle = garage.angle || 0;
        const hWidth = GAME_CONFIG.garage.width / 2;
        const hHeight = GAME_CONFIG.garage.height / 2;
        
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        
        for (const corner of carCorners) {
            const dx = corner.x - garage.x;
            const dy = corner.y - garage.y;
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            
            if (rotatedX >= -hWidth && rotatedX <= hWidth &&
                rotatedY >= -hHeight && rotatedY <= hHeight) {
                return true;
            }
        }
        
        return false;
    },
    
    checkCarGarageCollision(car, garage) {
        const carCorners = this.getCarCorners(car);
        
        if (this.isCarPartiallyInGarage(car, garage)) {
            return false;
        }
        
        const border = GAME_CONFIG.garage.borderWidth;
        
        const garageEdges = [];
        
        const angle = garage.angle || 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const hWidth = GAME_CONFIG.garage.width / 2;
        const hHeight = GAME_CONFIG.garage.height / 2;
        
        const garageCorners = [
            { x: garage.x - hWidth, y: garage.y - hHeight },
            { x: garage.x + hWidth, y: garage.y - hHeight },
            { x: garage.x + hWidth, y: garage.y + hHeight },
            { x: garage.x - hWidth, y: garage.y + hHeight }
        ];
        
        const rotatedGarageCorners = garageCorners.map(c => ({
            x: garage.x + (c.x - garage.x) * cos - (c.y - garage.y) * sin,
            y: garage.y + (c.x - garage.x) * sin + (c.y - garage.y) * cos
        }));
        
        const borderThickness = border + 2;
        
        const createBorderEdge = (start, end) => {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = -dy / len * borderThickness;
            const ny = dx / len * borderThickness;
            
            return [
                { x: start.x + nx, y: start.y + ny },
                { x: end.x + nx, y: end.y + ny },
                { x: end.x, y: end.y },
                { x: start.x, y: start.y }
            ];
        };
        
        for (let i = 0; i < 4; i++) {
            const edge = createBorderEdge(
                rotatedGarageCorners[i],
                rotatedGarageCorners[(i + 1) % 4]
            );
            garageEdges.push(edge);
        }
        
        for (const edge of garageEdges) {
            if (this.satCollision(carCorners, edge)) {
                return true;
            }
        }
        
        return false;
    },
    
    checkAllCollisions(car, level, canvasWidth, canvasHeight) {
        if (this.checkCarBoundaryCollision(car, canvasWidth, canvasHeight)) {
            return { collision: true, type: 'boundary' };
        }
        
        if (level.obstacles) {
            for (const obstacle of level.obstacles) {
                if (this.checkCarObstacleCollision(car, obstacle)) {
                    return { collision: true, type: 'obstacle' };
                }
            }
        }
        
        if (this.checkCarGarageCollision(car, level.garage)) {
            return { collision: true, type: 'garage' };
        }
        
        return { collision: false };
    },
    
    isCarInGarage(car, garage) {
        const carCorners = this.getCarCorners(car);
        
        const angle = garage.angle || 0;
        const hWidth = GAME_CONFIG.garage.width / 2 - GAME_CONFIG.garage.margin - 15;
        const hHeight = GAME_CONFIG.garage.height / 2 - GAME_CONFIG.garage.margin - 15;
        
        const cos = Math.cos(-angle);
        const sin = Math.sin(-angle);
        
        for (const corner of carCorners) {
            const dx = corner.x - garage.x;
            const dy = corner.y - garage.y;
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            
            if (rotatedX < -hWidth || rotatedX > hWidth ||
                rotatedY < -hHeight || rotatedY > hHeight) {
                return false;
            }
        }
        
        const normalizedCarAngle = this.normalizeAngle(car.angle);
        const normalizedGarageAngle = this.normalizeAngle(angle);
        
        let angleDiff = Math.abs(normalizedCarAngle - normalizedGarageAngle);
        if (angleDiff > Math.PI) {
            angleDiff = Math.PI * 2 - angleDiff;
        }
        
        const reversedAngleDiff = Math.abs(angleDiff - Math.PI);
        const angleTolerance = 0.5;
        
        if (angleDiff > angleTolerance && reversedAngleDiff > angleTolerance) {
            return false;
        }
        
        return true;
    },
    
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }
};
