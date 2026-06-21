class LightBeam {
    constructor(x, y, angle, intensity = 1.0) {
        this.startX = x;
        this.startY = y;
        this.angle = angle;
        this.intensity = intensity;
        this.colors = {
            red: intensity,
            green: intensity,
            blue: intensity
        };
        this.path = [];
        this.maxBounces = 30;
        this.hitTarget = false;
        this.hitPrismCounts = {};
        this.elementEffects = [];
        this.splitBeams = [];
        this.armorPierce = 0;
    }

    getDirection() {
        const rad = this.angle * Math.PI / 180;
        return {
            x: Math.cos(rad),
            y: Math.sin(rad)
        };
    }

    trace(prisms, target, canvasWidth, canvasHeight) {
        this.path = [];
        this.hitTarget = false;
        this.hitPrismCounts = {};
        this.elementEffects = [];
        this.splitBeams = [];
        this.armorPierce = 0;

        let currentX = this.startX;
        let currentY = this.startY;
        const dir = this.getDirection();
        let dx = dir.x;
        let dy = dir.y;
        let currentIntensity = this.intensity;
        let currentColors = { ...this.colors };
        let bounces = 0;
        const EPSILON = 0.5;
        let lastPrismId = null;

        this.path.push({
            x: currentX,
            y: currentY,
            intensity: currentIntensity,
            colors: { ...currentColors },
            type: 'start'
        });

        while (bounces < this.maxBounces && currentIntensity > 0.03) {
            let nearestHit = null;
            let nearestDist = Infinity;
            let hitPrism = null;

            for (const prism of prisms) {
                if (prism.melted) continue;

                const hit = prism.rayIntersection(currentX, currentY, dx, dy);
                if (hit && hit.distance > EPSILON && hit.distance < nearestDist) {
                    nearestDist = hit.distance;
                    nearestHit = hit;
                    hitPrism = prism;
                }
            }

            const targetHit = this._rayCircleIntersection(
                currentX, currentY, dx, dy,
                target.x, target.y, target.radius
            );

            if (targetHit && targetHit < nearestDist) {
                this.hitTarget = true;
                const hitX = currentX + dx * targetHit;
                const hitY = currentY + dy * targetHit;

                this.path.push({
                    x: hitX,
                    y: hitY,
                    intensity: currentIntensity,
                    colors: { ...currentColors },
                    type: 'target'
                });

                this._checkElementResonance(currentColors);
                break;
            }

            if (nearestHit && hitPrism) {
                if (lastPrismId !== hitPrism.id) {
                    this.hitPrismCounts[hitPrism.id] = (this.hitPrismCounts[hitPrism.id] || 0) + 1;
                }
                lastPrismId = hitPrism.id;

                if (nearestHit.incidentAngleDeg > 15) {
                    currentIntensity *= 0.4;
                    for (const c in currentColors) {
                        currentColors[c] *= 0.4;
                    }
                }

                if (hitPrism.colorFilter) {
                    for (const c in currentColors) {
                        if (c !== hitPrism.colorFilter) {
                            currentColors[c] *= 0.15;
                        }
                    }
                }

                const pathPoint = {
                    x: nearestHit.x,
                    y: nearestHit.y,
                    intensity: currentIntensity,
                    colors: { ...currentColors },
                    type: 'prism',
                    prismId: hitPrism.id,
                    incidentAngle: nearestHit.incidentAngleDeg
                };
                this.path.push(pathPoint);

                dx = nearestHit.reflected.x;
                dy = nearestHit.reflected.y;

                const dirLen = Math.sqrt(dx * dx + dy * dy);
                if (dirLen > 0) {
                    dx /= dirLen;
                    dy /= dirLen;
                }

                currentX = nearestHit.x + dx * EPSILON * 2;
                currentY = nearestHit.y + dy * EPSILON * 2;

                this._checkElementResonance(currentColors);

                if (this.elementEffects.includes('growth') && this.splitBeams.length === 0 && bounces >= 1) {
                    this._createSplitBeams(
                        nearestHit.x, nearestHit.y, dx, dy,
                        currentColors, currentIntensity * 0.5,
                        prisms, target, canvasWidth, canvasHeight
                    );
                }

                bounces++;
            } else {
                const boundaryHit = this._findBoundaryHit(
                    currentX, currentY, dx, dy,
                    canvasWidth, canvasHeight
                );

                if (boundaryHit) {
                    this.path.push({
                        x: boundaryHit.x,
                        y: boundaryHit.y,
                        intensity: currentIntensity,
                        colors: { ...currentColors },
                        type: 'boundary'
                    });
                }
                break;
            }
        }

        return {
            hitTarget: this.hitTarget,
            intensity: currentIntensity,
            colors: currentColors,
            path: this.path,
            bounces: bounces,
            elementEffects: this.elementEffects,
            splitBeams: this.splitBeams,
            armorPierce: this.armorPierce,
            hitPrismCounts: this.hitPrismCounts
        };
    }

    _createSplitBeams(x, y, dx, dy, colors, intensity, prisms, target, canvasWidth, canvasHeight) {
        const baseAngle = Math.atan2(dy, dx);
        const offsets = [-22, 0, 22];

        for (const offset of offsets) {
            const angleRad = baseAngle + offset * Math.PI / 180;
            const beam = new LightBeam(
                x + Math.cos(angleRad) * 2,
                y + Math.sin(angleRad) * 2,
                (baseAngle + offset) * 180 / Math.PI,
                intensity
            );
            beam.colors = { ...colors };
            beam.maxBounces = 15;

            const result = beam.trace(prisms, target, canvasWidth, canvasHeight);
            this.splitBeams.push({
                beam: beam,
                result: result
            });

            if (result.hitTarget) {
                this.hitTarget = true;
            }
        }
    }

    _checkElementResonance(colors) {
        const hasRed = colors.red > 0.12;
        const hasGreen = colors.green > 0.12;
        const hasBlue = colors.blue > 0.12;

        if (hasRed && hasBlue && !this.elementEffects.includes('heat')) {
            this.elementEffects.push('heat');
            this.armorPierce = 20;
        }
        if (hasRed && hasGreen && !this.elementEffects.includes('growth')) {
            this.elementEffects.push('growth');
        }
        if (hasBlue && hasGreen && !this.elementEffects.includes('freeze')) {
            this.elementEffects.push('freeze');
        }
    }

    _rayCircleIntersection(rx, ry, dx, dy, cx, cy, radius) {
        const fx = rx - cx;
        const fy = ry - cy;

        const a = dx * dx + dy * dy;
        if (a < 0.00001) return null;

        const b = 2 * (fx * dx + fy * dy);
        const c = fx * fx + fy * fy - radius * radius;

        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) return null;

        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);

        if (t1 > 0.01) return t1;
        if (t2 > 0.01) return t2;
        return null;
    }

    _findBoundaryHit(x, y, dx, dy, width, height) {
        let minT = Infinity;
        let hitPoint = null;

        if (dx > 0.0001) {
            const t = (width - x) / dx;
            if (t > 0 && t < minT) {
                const hy = y + dy * t;
                if (hy >= -10 && hy <= height + 10) {
                    minT = t;
                    hitPoint = { x: width, y: Math.max(0, Math.min(height, hy)) };
                }
            }
        } else if (dx < -0.0001) {
            const t = -x / dx;
            if (t > 0 && t < minT) {
                const hy = y + dy * t;
                if (hy >= -10 && hy <= height + 10) {
                    minT = t;
                    hitPoint = { x: 0, y: Math.max(0, Math.min(height, hy)) };
                }
            }
        }

        if (dy > 0.0001) {
            const t = (height - y) / dy;
            if (t > 0 && t < minT) {
                const hx = x + dx * t;
                if (hx >= -10 && hx <= width + 10) {
                    minT = t;
                    hitPoint = { x: Math.max(0, Math.min(width, hx)), y: height };
                }
            }
        } else if (dy < -0.0001) {
            const t = -y / dy;
            if (t > 0 && t < minT) {
                const hx = x + dx * t;
                if (hx >= -10 && hx <= width + 10) {
                    minT = t;
                    hitPoint = { x: Math.max(0, Math.min(width, hx)), y: 0 };
                }
            }
        }

        return hitPoint;
    }

    getAverageColor() {
        const r = Math.round(this.colors.red * 255);
        const g = Math.round(this.colors.green * 255);
        const b = Math.round(this.colors.blue * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }
}
