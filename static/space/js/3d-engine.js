const Engine3D = (function() {
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        add(v) {
            return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
        }

        sub(v) {
            return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
        }

        mul(s) {
            return new Vector3(this.x * s, this.y * s, this.z * s);
        }

        dot(v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        }

        cross(v) {
            return new Vector3(
                this.y * v.z - this.z * v.y,
                this.z * v.x - this.x * v.z,
                this.x * v.y - this.y * v.x
            );
        }

        length() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }

        normalize() {
            const len = this.length();
            if (len === 0) return new Vector3();
            return this.mul(1 / len);
        }

        clone() {
            return new Vector3(this.x, this.y, this.z);
        }
    }

    class Matrix4 {
        constructor() {
            this.m = new Float32Array(16);
            this.identity();
        }

        identity() {
            this.m.fill(0);
            this.m[0] = this.m[5] = this.m[10] = this.m[15] = 1;
            return this;
        }

        multiply(other) {
            const result = new Matrix4();
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    let sum = 0;
                    for (let k = 0; k < 4; k++) {
                        sum += this.m[i * 4 + k] * other.m[k * 4 + j];
                    }
                    result.m[i * 4 + j] = sum;
                }
            }
            return result;
        }

        static rotateX(angle) {
            const mat = new Matrix4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[5] = c; mat.m[6] = s;
            mat.m[9] = -s; mat.m[10] = c;
            return mat;
        }

        static rotateY(angle) {
            const mat = new Matrix4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[0] = c; mat.m[2] = -s;
            mat.m[8] = s; mat.m[10] = c;
            return mat;
        }

        static rotateZ(angle) {
            const mat = new Matrix4();
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            mat.m[0] = c; mat.m[1] = s;
            mat.m[4] = -s; mat.m[5] = c;
            return mat;
        }

        static translate(x, y, z) {
            const mat = new Matrix4();
            mat.m[3] = x;
            mat.m[7] = y;
            mat.m[11] = z;
            return mat;
        }

        static scale(s) {
            const mat = new Matrix4();
            mat.m[0] = mat.m[5] = mat.m[10] = s;
            return mat;
        }

        transformVector(v) {
            const x = v.x * this.m[0] + v.y * this.m[1] + v.z * this.m[2] + this.m[3];
            const y = v.x * this.m[4] + v.y * this.m[5] + v.z * this.m[6] + this.m[7];
            const z = v.x * this.m[8] + v.y * this.m[9] + v.z * this.m[10] + this.m[11];
            const w = v.x * this.m[12] + v.y * this.m[13] + v.z * this.m[14] + this.m[15];
            return new Vector3(x / w, y / w, z / w);
        }
    }

    class Camera {
        constructor() {
            this.position = new Vector3(0, 0, 300);
            this.target = new Vector3(0, 0, 0);
            this.fov = 60;
            this.near = 1;
            this.far = 2000;
        }

        project(point, canvasWidth, canvasHeight) {
            const aspect = canvasWidth / canvasHeight;
            const fovRad = (this.fov * Math.PI) / 180;
            const f = 1 / Math.tan(fovRad / 2);
            
            const relPos = point.sub(this.position);
            
            const forward = this.target.sub(this.position).normalize();
            const right = forward.cross(new Vector3(0, 1, 0)).normalize();
            const up = right.cross(forward);
            
            const x = relPos.dot(right);
            const y = relPos.dot(up);
            const z = relPos.dot(forward);
            
            if (z <= 0) return null;
            
            const screenX = (x * f) / (z * aspect) * canvasWidth / 2 + canvasWidth / 2;
            const screenY = -(y * f) / z * canvasHeight / 2 + canvasHeight / 2;
            
            return { x: screenX, y: screenY, z: z };
        }
    }

    class Renderer {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.camera = new Camera();
            this.width = 0;
            this.height = 0;
            this.resize();
            
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width * window.devicePixelRatio;
            this.canvas.height = this.height * window.devicePixelRatio;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';
            this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }

        clear() {
            this.ctx.fillStyle = '#000010';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        drawPoint(x, y, size, color) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        drawLine(x1, y1, x2, y2, color, width = 1) {
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        drawTriangle(p1, p2, p3, color) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.lineTo(p3.x, p3.y);
            this.ctx.closePath();
            this.ctx.fill();
        }

        projectPoint(point) {
            return this.camera.project(point, this.width, this.height);
        }
    }

    return {
        Vector3,
        Matrix4,
        Camera,
        Renderer
    };
})();
