class PathSystem {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth || 800;
        this.canvasHeight = canvasHeight || 600;
        this.pathPoints = [];
        this.towerSlots = [];
        this.pathLengths = null;
        this.totalLength = 0;
        this.generatePath();
        this.generateTowerSlots();
        this.calculatePathLengths();
    }

    generatePath() {
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        
        this.pathPoints = [
            { x: 0, y: h * 0.3 },
            { x: w * 0.15, y: h * 0.3 },
            { x: w * 0.15, y: h * 0.6 },
            { x: w * 0.35, y: h * 0.6 },
            { x: w * 0.35, y: h * 0.25 },
            { x: w * 0.55, y: h * 0.25 },
            { x: w * 0.55, y: h * 0.7 },
            { x: w * 0.75, y: h * 0.7 },
            { x: w * 0.75, y: h * 0.4 },
            { x: w * 0.9, y: h * 0.4 },
            { x: w * 0.9, y: h * 0.65 },
            { x: w, y: h * 0.65 }
        ];
    }

    generateTowerSlots() {
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        const slotSize = 45;

        const slotPositions = [
            { x: w * 0.08, y: h * 0.18 },
            { x: w * 0.08, y: h * 0.42 },
            { x: w * 0.22, y: h * 0.45 },
            { x: w * 0.28, y: h * 0.72 },
            { x: w * 0.42, y: h * 0.45 },
            { x: w * 0.42, y: h * 0.72 },
            { x: w * 0.48, y: h * 0.12 },
            { x: w * 0.62, y: h * 0.45 },
            { x: w * 0.62, y: h * 0.82 },
            { x: w * 0.68, y: h * 0.55 },
            { x: w * 0.82, y: h * 0.25 },
            { x: w * 0.82, y: h * 0.55 },
            { x: w * 0.82, y: h * 0.8 },
            { x: w * 0.95, y: h * 0.5 }
        ];

        this.towerSlots = [];
        for (let i = 0; i < slotPositions.length; i++) {
            this.towerSlots.push({
                x: slotPositions[i].x,
                y: slotPositions[i].y,
                size: slotSize,
                index: i,
                occupied: false,
                tower: null
            });
        }
    }

    getPath() {
        return this.pathPoints;
    }

    getTowerSlots() {
        return this.towerSlots;
    }

    calculatePathLengths() {
        this.pathLengths = [];
        this.totalLength = 0;
        
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const segmentLength = Utils.distance(
                this.pathPoints[i].x, this.pathPoints[i].y,
                this.pathPoints[i + 1].x, this.pathPoints[i + 1].y
            );
            this.pathLengths.push({
                start: this.totalLength,
                end: this.totalLength + segmentLength,
                startPoint: this.pathPoints[i],
                endPoint: this.pathPoints[i + 1],
                length: segmentLength
            });
            this.totalLength += segmentLength;
        }
    }

    getPointAtDistance(distance) {
        if (distance >= this.totalLength) {
            return { ...this.pathPoints[this.pathPoints.length - 1], endOfPath: true };
        }
        
        for (let i = 0; i < this.pathLengths.length; i++) {
            const segment = this.pathLengths[i];
            if (distance >= segment.start && distance <= segment.end) {
                const t = (distance - segment.start) / segment.length;
                return {
                    x: Utils.lerp(segment.startPoint.x, segment.endPoint.x, t),
                    y: Utils.lerp(segment.startPoint.y, segment.endPoint.y, t),
                    segmentIndex: i
                };
            }
        }
        
        return { ...this.pathPoints[this.pathPoints.length - 1], endOfPath: true };
    }

    getSlotAtPosition(x, y) {
        for (const slot of this.towerSlots) {
            const dist = Utils.distance(x, y, slot.x, slot.y);
            if (dist < slot.size / 2 + 10) {
                return slot;
            }
        }
        return null;
    }

    isNearPath(x, y, threshold = 50) {
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            
            const dist = this.pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y);
            if (dist < threshold) {
                return true;
            }
        }
        return false;
    }

    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Utils.distance(px, py, xx, yy);
    }

    getPathLength() {
        return Utils.getPathLength(this.pathPoints);
    }

    getPointAtDistance(distance) {
        return Utils.getPointOnPath(this.pathPoints, distance);
    }

    resize(newWidth, newHeight) {
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;
        this.generatePath();
        this.generateTowerSlots();
    }
}
