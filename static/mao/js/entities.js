var Entities = (function() {
    'use strict';

    var Mouse = function(x, y) {
        this.x = x;
        this.y = y;
        this.size = GameConfig.get('MOUSE.SIZE');
        this.radius = this.size / 2;
        this.speed = GameConfig.get('MOUSE.SPEED');
        this.direction = { x: 0, y: 0 };
        this.isMoving = false;
        this.tailAngle = 0;
        this.tailSwingSpeed = GameConfig.get('MOUSE.TAIL_SWING_SPEED');
        this.tailSwingAmplitude = GameConfig.get('MOUSE.TAIL_SWING_AMPLITUDE');
    };

    Mouse.prototype.update = function(keys, canvasWidth, canvasHeight) {
        var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');
        var minX = borderWidth + this.radius;
        var maxX = canvasWidth - borderWidth - this.radius;
        var minY = borderWidth + this.radius;
        var maxY = canvasHeight - borderWidth - this.radius;

        this.direction.x = 0;
        this.direction.y = 0;

        if (keys.up || keys.w) {
            this.direction.y = -1;
        }
        if (keys.down || keys.s) {
            this.direction.y = 1;
        }
        if (keys.left || keys.a) {
            this.direction.x = -1;
        }
        if (keys.right || keys.d) {
            this.direction.x = 1;
        }

        var len = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
        this.isMoving = len > 0;

        if (this.isMoving) {
            this.direction.x /= len;
            this.direction.y /= len;

            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;

            this.tailAngle += this.tailSwingSpeed;
        }

        this.x = Utils.clamp(this.x, minX, maxX);
        this.y = Utils.clamp(this.y, minY, maxY);
    };

    Mouse.prototype.getTailPosition = function() {
        var tailBaseX = this.x - this.radius * 0.8;
        var tailBaseY = this.y;
        var swingOffset = Math.sin(this.tailAngle) * this.tailSwingAmplitude;
        var tailEndX = tailBaseX - GameConfig.get('MOUSE.TAIL_LENGTH');
        var tailEndY = tailBaseY + swingOffset;

        return {
            baseX: tailBaseX,
            baseY: tailBaseY,
            endX: tailEndX,
            endY: tailEndY
        };
    };

    Mouse.prototype.toJSON = function() {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            radius: this.radius,
            speed: this.speed,
            direction: this.direction,
            isMoving: this.isMoving,
            tailAngle: this.tailAngle
        };
    };

    Mouse.fromJSON = function(data) {
        if (!data || typeof data.x === 'undefined' || typeof data.y === 'undefined') {
            return createMouseAtCenter();
        }
        var mouse = new Mouse(data.x, data.y);
        mouse.size = typeof data.size !== 'undefined' ? data.size : GameConfig.get('MOUSE.SIZE');
        mouse.radius = typeof data.radius !== 'undefined' ? data.radius : mouse.size / 2;
        mouse.speed = typeof data.speed !== 'undefined' ? data.speed : GameConfig.get('MOUSE.SPEED');
        mouse.direction = data.direction || { x: 0, y: 0 };
        mouse.isMoving = typeof data.isMoving !== 'undefined' ? data.isMoving : false;
        mouse.tailAngle = typeof data.tailAngle !== 'undefined' ? data.tailAngle : 0;
        return mouse;
    };

    var Cat = function(x, y) {
        this.x = x;
        this.y = y;
        this.size = GameConfig.get('CAT.SIZE');
        this.radius = this.size / 2;
        this.initialSpeed = GameConfig.get('CAT.INITIAL_SPEED');
        this.maxSpeed = GameConfig.get('CAT.MAX_SPEED');
        this.speed = this.initialSpeed;
        this.direction = { x: 0, y: 0 };
    };

    Cat.prototype.update = function(mouseX, mouseY, elapsedSeconds) {
        this.speed = GameConfig.getCatSpeed(elapsedSeconds);

        var dx = mouseX - this.x;
        var dy = mouseY - this.y;
        var len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            this.direction.x = dx / len;
            this.direction.y = dy / len;

            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;
        }

        var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');
        var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
        var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');

        var minX = borderWidth + this.radius;
        var maxX = canvasWidth - borderWidth - this.radius;
        var minY = borderWidth + this.radius;
        var maxY = canvasHeight - borderWidth - this.radius;

        this.x = Utils.clamp(this.x, minX, maxX);
        this.y = Utils.clamp(this.y, minY, maxY);
    };

    Cat.prototype.toJSON = function() {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            radius: this.radius,
            speed: this.speed,
            direction: this.direction
        };
    };

    Cat.fromJSON = function(data) {
        if (!data || typeof data.x === 'undefined' || typeof data.y === 'undefined') {
            return createCatAtCorner();
        }
        var cat = new Cat(data.x, data.y);
        cat.size = typeof data.size !== 'undefined' ? data.size : GameConfig.get('CAT.SIZE');
        cat.radius = typeof data.radius !== 'undefined' ? data.radius : cat.size / 2;
        cat.speed = typeof data.speed !== 'undefined' ? data.speed : GameConfig.get('CAT.INITIAL_SPEED');
        cat.direction = data.direction || { x: 0, y: 0 };
        return cat;
    };

    var Cheese = function(x, y) {
        this.x = x;
        this.y = y;
        this.size = GameConfig.get('CHEESE.SIZE');
        this.radius = this.size / 2;
        this.id = Utils.uuid();
    };

    Cheese.prototype.toJSON = function() {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            radius: this.radius,
            id: this.id
        };
    };

    Cheese.fromJSON = function(data) {
        if (!data || typeof data.x === 'undefined' || typeof data.y === 'undefined') {
            var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
            var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');
            var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');
            var cheeseSize = GameConfig.get('CHEESE.SIZE');
            return new Cheese(
                Utils.random(borderWidth + cheeseSize + 20, canvasWidth - borderWidth - cheeseSize - 20),
                Utils.random(borderWidth + cheeseSize + 20, canvasHeight - borderWidth - cheeseSize - 20)
            );
        }
        var cheese = new Cheese(data.x, data.y);
        cheese.size = typeof data.size !== 'undefined' ? data.size : GameConfig.get('CHEESE.SIZE');
        cheese.radius = typeof data.radius !== 'undefined' ? data.radius : cheese.size / 2;
        cheese.id = data.id || Utils.uuid();
        return cheese;
    };

    function createMouseAtCenter() {
        var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
        var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');
        return new Mouse(canvasWidth / 2, canvasHeight / 2);
    }

    function createCatAtCorner() {
        var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');
        var catSize = GameConfig.get('CAT.SIZE');
        var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
        var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');

        var x = borderWidth + catSize / 2 + 20;
        var y = borderWidth + catSize / 2 + 20;

        return new Cat(x, y);
    }

    function createRandomCheese(existingCheeses, mouse, cat) {
        var canvasWidth = GameConfig.get('GAME.CANVAS_WIDTH');
        var canvasHeight = GameConfig.get('GAME.CANVAS_HEIGHT');
        var borderWidth = GameConfig.get('GAME.BORDER_WIDTH');
        var cheeseSize = GameConfig.get('CHEESE.SIZE');

        var minX = borderWidth + cheeseSize + 20;
        var maxX = canvasWidth - borderWidth - cheeseSize - 20;
        var minY = borderWidth + cheeseSize + 20;
        var maxY = canvasHeight - borderWidth - cheeseSize - 20;

        var attempts = 0;
        var maxAttempts = 100;
        var x, y, valid;

        while (attempts < maxAttempts) {
            x = Utils.random(minX, maxX);
            y = Utils.random(minY, maxY);
            valid = true;

            if (mouse) {
                var distToMouse = Utils.getDistance(x, y, mouse.x, mouse.y);
                if (distToMouse < cheeseSize * 3 + mouse.radius) {
                    valid = false;
                }
            }

            if (cat && valid) {
                var distToCat = Utils.getDistance(x, y, cat.x, cat.y);
                if (distToCat < cheeseSize * 3 + cat.radius) {
                    valid = false;
                }
            }

            if (valid && existingCheeses) {
                for (var i = 0; i < existingCheeses.length; i++) {
                    var distToCheese = Utils.getDistance(x, y, existingCheeses[i].x, existingCheeses[i].y);
                    if (distToCheese < cheeseSize * 2) {
                        valid = false;
                        break;
                    }
                }
            }

            if (valid) {
                return new Cheese(x, y);
            }
            attempts++;
        }

        return new Cheese(
            Utils.random(minX, maxX),
            Utils.random(minY, maxY)
        );
    }

    function createInitialCheeses(mouse, cat) {
        var count = Utils.random(
            GameConfig.get('CHEESE.MIN_COUNT'),
            GameConfig.get('CHEESE.MAX_COUNT')
        );
        var cheeses = [];

        for (var i = 0; i < count; i++) {
            var cheese = createRandomCheese(cheeses, mouse, cat);
            cheeses.push(cheese);
        }

        return cheeses;
    }

    return {
        Mouse: Mouse,
        Cat: Cat,
        Cheese: Cheese,
        createMouseAtCenter: createMouseAtCenter,
        createCatAtCorner: createCatAtCorner,
        createRandomCheese: createRandomCheese,
        createInitialCheeses: createInitialCheeses
    };
})();
