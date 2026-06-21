class Prism {
    constructor(config) {
        this.id = config.id || Math.random().toString(36).substr(2, 9);
        this.x = config.x || 400;
        this.y = config.y || 300;
        this.rotation = config.rotation || 0;
        this.sides = config.sides || 6;
        this.size = config.size || 40;
        this.isRotatable = config.is_rotatable !== undefined ? config.is_rotatable : true;
        this.colorFilter = config.color_filter || '';
        this.selected = false;
        this.hovered = false;
        this.melted = false;
        this.meltTurns = 0;
        this.frozen = false;
        this.frozenTurns = 0;
        this.hitCount = 0;
    }

    getVertices() {
        const vertices = [];
        const angleOffset = -Math.PI / 2 + (this.rotation * Math.PI / 180);
        
        for (let i = 0; i < this.sides; i++) {
            const angle = angleOffset + (2 * Math.PI * i) / this.sides;
            vertices.push({
                x: this.x + this.size * Math.cos(angle),
                y: this.y + this.size * Math.sin(angle)
            });
        }
        
        return vertices;
    }

    getEdges() {
        const vertices = this.getVertices();
        const edges = [];
        
        for (let i = 0; i < this.sides; i++) {
            edges.push({
                start: vertices[i],
                end: vertices[(i + 1) % this.sides],
                index: i
            });
        }
        
        return edges;
    }

    containsPoint(px, py) {
        const vertices = this.getVertices();
        let inside = false;
        
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    rotate(angle) {
        if (!this.isRotatable || this.melted || this.frozen) {
            return false;
        }
        this.rotation = (this.rotation + angle) % 360;
        if (this.rotation < 0) this.rotation += 360;
        return true;
    }

    rayIntersection(rx, ry, dx, dy) {
        if (this.melted) return null;

        const edges = this.getEdges();
        let nearestHit = null;
        let nearestDist = Infinity;

        for (let i = 0; i < edges.length; i++) {
            const edge = edges[i];
            const ex = edge.end.x - edge.start.x;
            const ey = edge.end.y - edge.start.y;
            
            const denom = dx * ey - dy * ex;
            if (Math.abs(denom) < 0.0001) continue;
            
            const t = ((edge.start.x - rx) * ey - (edge.start.y - ry) * ex) / denom;
            const u = ((edge.start.x - rx) * dy - (edge.start.y - ry) * dx) / denom;
            
            if (t > 0.01 && u >= 0 && u <= 1) {
                if (t < nearestDist) {
                    nearestDist = t;
                    
                    let nx = ey;
                    let ny = -ex;
                    const len = Math.sqrt(nx * nx + ny * ny);
                    nx /= len;
                    ny /= len;
                    
                    const midX = (edge.start.x + edge.end.x) / 2;
                    const midY = (edge.start.y + edge.end.y) / 2;
                    const toCenterX = this.x - midX;
                    const toCenterY = this.y - midY;
                    if (nx * toCenterX + ny * toCenterY < 0) {
                        nx = -nx;
                        ny = -ny;
                    }
                    
                    const incidentDot = -(dx * nx + dy * ny);
                    const incidentAngle = Math.acos(Math.max(-1, Math.min(1, incidentDot)));
                    
                    const reflectDx = dx + 2 * incidentDot * nx;
                    const reflectDy = dy + 2 * incidentDot * ny;
                    
                    nearestHit = {
                        distance: t,
                        x: rx + dx * t,
                        y: ry + dy * t,
                        incidentAngle: incidentAngle,
                        incidentAngleDeg: incidentAngle * 180 / Math.PI,
                        normal: { x: nx, y: ny },
                        reflected: { x: reflectDx, y: reflectDy },
                        edgeIndex: i
                    };
                }
            }
        }

        return nearestHit;
    }

    registerHit() {
        this.hitCount++;
        if (this.hitCount >= 5 && !this.melted) {
            this.melted = true;
            this.meltTurns = 3;
            return true;
        }
        return false;
    }

    resetHits() {
        this.hitCount = 0;
    }

    updateTurn() {
        if (this.melted) {
            this.meltTurns--;
            if (this.meltTurns <= 0) {
                this.melted = false;
                this.hitCount = 0;
            }
        }
        if (this.frozen) {
            this.frozenTurns--;
            if (this.frozenTurns <= 0) {
                this.frozen = false;
            }
        }
    }

    freeze() {
        if (!this.frozen && this.isRotatable) {
            this.frozen = true;
            this.frozenTurns = 3;
            return true;
        }
        return false;
    }
}
