var Renderer = (function() {
    var canvas, ctx;
    var width, height;
    var reeds = [];
    var clouds = [];
    
    function init(canvasElement) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        resize();
        generateBackground();
    }
    
    function resize() {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    function generateBackground() {
        reeds = [];
        clouds = [];
        
        var reedCount = Math.floor(width / 30);
        for (var i = 0; i < reedCount; i++) {
            reeds.push({
                x: i * 30 + Math.random() * 15,
                height: 80 + Math.random() * 120,
                width: 3 + Math.random() * 4,
                colorIndex: Math.floor(Math.random() * GameConfig.GRASS_COLORS.length),
                swayOffset: Math.random() * Math.PI * 2
            });
        }
        
        for (var i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * width,
                y: 50 + Math.random() * 150,
                width: 100 + Math.random() * 150,
                height: 40 + Math.random() * 40,
                speed: 0.1 + Math.random() * 0.3
            });
        }
    }
    
    function drawSky() {
        var gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, GameConfig.SKY_COLOR_TOP);
        gradient.addColorStop(1, GameConfig.SKY_COLOR_BOTTOM);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    function drawClouds() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (var i = 0; i < clouds.length; i++) {
            var cloud = clouds[i];
            cloud.x += cloud.speed;
            if (cloud.x > width + cloud.width) {
                cloud.x = -cloud.width;
            }
            drawCloud(cloud.x, cloud.y, cloud.width, cloud.height);
        }
    }
    
    function drawCloud(x, y, w, h) {
        ctx.beginPath();
        ctx.arc(x, y, h * 0.4, 0, Math.PI * 2);
        ctx.arc(x + w * 0.3, y - h * 0.2, h * 0.5, 0, Math.PI * 2);
        ctx.arc(x + w * 0.6, y, h * 0.4, 0, Math.PI * 2);
        ctx.arc(x + w * 0.4, y + h * 0.1, h * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function drawGround() {
        var grassHeight = height * 0.25;
        var grassY = height - grassHeight;
        
        var groundGradient = ctx.createLinearGradient(0, grassY, 0, height);
        groundGradient.addColorStop(0, GameConfig.GRASS_COLORS[0]);
        groundGradient.addColorStop(1, GameConfig.GRASS_COLORS[2]);
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, grassY, width, grassHeight);
        
        ctx.fillStyle = GameConfig.GRASS_COLORS[1];
        for (var i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, height);
            ctx.lineTo(i + 5, grassY + 10);
            ctx.lineTo(i + 10, height);
            ctx.fill();
        }
    }
    
    function drawReeds(time) {
        var reedY = height * 0.7;
        for (var i = 0; i < reeds.length; i++) {
            var reed = reeds[i];
            var sway = Math.sin(time * 0.001 + reed.swayOffset) * 5;
            
            ctx.strokeStyle = GameConfig.GRASS_COLORS[reed.colorIndex];
            ctx.lineWidth = reed.width;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(reed.x, height);
            ctx.quadraticCurveTo(
                reed.x + sway,
                reedY + reed.height * 0.5,
                reed.x + sway * 2,
                reedY + reed.height
            );
            ctx.stroke();
            
            ctx.fillStyle = GameConfig.GRASS_COLORS[(reed.colorIndex + 1) % GameConfig.GRASS_COLORS.length];
            ctx.beginPath();
            ctx.ellipse(
                reed.x + sway * 2,
                reedY + reed.height,
                reed.width * 3,
                reed.width * 1.5,
                Math.PI / 6,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    function drawDuck(duck) {
        if (duck.isHit) return;
        
        var x = duck.x;
        var y = duck.y;
        var w = duck.width;
        var h = duck.height;
        
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        
        var headColor = duck.isGolden ? GameConfig.GOLDEN_DUCK_COLOR : GameConfig.DUCK_HEAD_COLOR;
        var bodyColor = duck.isGolden ? '#FFE55C' : GameConfig.DUCK_BODY_COLOR;
        var beakColor = GameConfig.DUCK_BEAK_COLOR;
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        var wingOffset = (duck.wingPhase % 2) === 0 ? 0 : -10;
        ctx.fillStyle = duck.isGolden ? '#FFF59D' : '#A0522D';
        ctx.beginPath();
        ctx.ellipse(-w * 0.1, -h * 0.1 + wingOffset, w * 0.2, h * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-w * 0.05, -h * 0.05 + wingOffset * 0.5, w * 0.15, h * 0.15, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = headColor;
        ctx.beginPath();
        ctx.arc(w * 0.25, -h * 0.1, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = beakColor;
        ctx.beginPath();
        ctx.moveTo(w * 0.4, -h * 0.15);
        ctx.lineTo(w * 0.55, -h * 0.1);
        ctx.lineTo(w * 0.4, -h * 0.05);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(w * 0.3, -h * 0.15, w * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(w * 0.32, -h * 0.15, w * 0.02, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = bodyColor;
        ctx.fillRect(-w * 0.2, h * 0.25, w * 0.08, h * 0.1);
        ctx.fillRect(w * 0.1, h * 0.25, w * 0.08, h * 0.1);
        
        if (duck.isGolden) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function drawFeathers(feathers) {
        for (var i = 0; i < feathers.length; i++) {
            var feather = feathers[i];
            ctx.save();
            ctx.translate(feather.x, feather.y);
            ctx.rotate(feather.rotation);
            ctx.globalAlpha = feather.alpha;
            ctx.fillStyle = feather.color;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                feather.size * 0.5,
                -feather.size * 0.3,
                feather.size,
                0
            );
            ctx.quadraticCurveTo(
                feather.size * 0.5,
                feather.size * 0.3,
                0,
                0
            );
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(feather.size, 0);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    function drawSmokes(smokes) {
        for (var i = 0; i < smokes.length; i++) {
            var smoke = smokes[i];
            ctx.save();
            ctx.globalAlpha = smoke.alpha;
            ctx.fillStyle = GameConfig.SMOKE_COLOR;
            
            ctx.beginPath();
            ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(smoke.x + smoke.size * 0.3, smoke.y - smoke.size * 0.2, smoke.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    function drawCrosshairFlashes(flashes) {
        for (var i = 0; i < flashes.length; i++) {
            var flash = flashes[i];
            ctx.save();
            ctx.globalAlpha = flash.alpha;
            
            var outerRadius = flash.size;
            var innerRadius = flash.size * 0.7;
            var lineLength = flash.size * 1.8;
            var gap = 8;
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, outerRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(flash.x - lineLength, flash.y);
            ctx.lineTo(flash.x - gap, flash.y);
            ctx.moveTo(flash.x + gap, flash.y);
            ctx.lineTo(flash.x + lineLength, flash.y);
            ctx.moveTo(flash.x, flash.y - lineLength);
            ctx.lineTo(flash.x, flash.y - gap);
            ctx.moveTo(flash.x, flash.y + gap);
            ctx.lineTo(flash.x, flash.y + lineLength);
            ctx.stroke();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, outerRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(flash.x - lineLength, flash.y);
            ctx.lineTo(flash.x - gap, flash.y);
            ctx.moveTo(flash.x + gap, flash.y);
            ctx.lineTo(flash.x + lineLength, flash.y);
            ctx.moveTo(flash.x, flash.y - lineLength);
            ctx.lineTo(flash.x, flash.y - gap);
            ctx.moveTo(flash.x, flash.y + gap);
            ctx.lineTo(flash.x, flash.y + lineLength);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(flash.x, flash.y, 4, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    function render(ducks, time) {
        ctx.clearRect(0, 0, width, height);
        
        drawSky();
        drawClouds();
        drawGround();
        drawReeds(time);
        
        for (var i = 0; i < ducks.length; i++) {
            drawDuck(ducks[i]);
        }
        
        drawFeathers(Effects.getFeathers());
        drawSmokes(Effects.getSmokes());
        drawCrosshairFlashes(Effects.getCrosshairFlashes());
    }
    
    function getCanvasSize() {
        return { width: width, height: height };
    }
    
    function getCanvas() {
        return canvas;
    }
    
    return {
        init: init,
        resize: resize,
        render: render,
        getCanvasSize: getCanvasSize,
        getCanvas: getCanvas
    };
})();
