const Utils = {
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    arrayEquals: function(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    },

    containsArray: function(arr, target) {
        for (let i = 0; i < arr.length; i++) {
            if (this.arrayEquals(arr[i], target)) {
                return true;
            }
        }
        return false;
    },

    lerp: function(start, end, t) {
        return start + (end - start) * t;
    },

    easeOutQuart: function(t) {
        return 1 - Math.pow(1 - t, 4);
    },

    easeInOutQuart: function(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
};

const Directions = {
    UP: [0, -1],
    DOWN: [0, 1],
    LEFT: [-1, 0],
    RIGHT: [1, 0],
    
    isOpposite: function(dir1, dir2) {
        return (dir1[0] === -dir2[0] && dir1[1] === -dir2[1]);
    },
    
    getPerpendicular: function(dir) {
        if (dir[0] !== 0) {
            return [this.UP, this.DOWN];
        } else {
            return [this.LEFT, this.RIGHT];
        }
    },
    
    allExcept: function(excludeDirs) {
        const all = [this.UP, this.DOWN, this.LEFT, this.RIGHT];
        return all.filter(dir => {
            return !excludeDirs.some(exclude => this.arrayEquals(dir, exclude));
        });
    },
    
    arrayEquals: function(arr1, arr2) {
        return arr1[0] === arr2[0] && arr1[1] === arr2[1];
    }
};
