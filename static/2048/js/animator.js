var Animator = (function() {
    'use strict';

    var ANIMATION_DURATION = 150;
    var MERGE_SCALE_DURATION = 100;
    var NEW_TILE_ANIMATION_DURATION = 200;

    var animations = [];
    var isAnimating = false;
    var animationStartTime = 0;
    var onAnimationComplete = null;

    var tileAnimations = [];
    var mergeAnimations = [];
    var newTileAnimations = [];

    function init() {
        animations = [];
        isAnimating = false;
        tileAnimations = [];
        mergeAnimations = [];
        newTileAnimations = [];
    }

    function isCurrentlyAnimating() {
        return isAnimating;
    }

    function prepareAnimations(moveResult) {
        tileAnimations = [];
        mergeAnimations = [];
        newTileAnimations = [];

        if (!moveResult || !moveResult.animations) {
            return;
        }

        moveResult.animations.forEach(function(anim) {
            if (anim.type === 'move') {
                tileAnimations.push({
                    row: anim.row !== undefined ? anim.row : null,
                    col: anim.col !== undefined ? anim.col : null,
                    fromRow: anim.fromRow,
                    fromCol: anim.fromCol,
                    toRow: anim.toRow !== undefined ? anim.toRow : null,
                    toCol: anim.toCol !== undefined ? anim.toCol : null,
                    startProgress: 0,
                    endProgress: 1
                });
            } else if (anim.type === 'merge') {
                mergeAnimations.push({
                    row: anim.row !== undefined ? anim.row : null,
                    col: anim.col !== undefined ? anim.col : null,
                    fromRow1: anim.fromRow1,
                    fromCol1: anim.fromCol1,
                    fromRow2: anim.fromRow2,
                    fromCol2: anim.fromCol2,
                    toRow: anim.toRow !== undefined ? anim.toRow : null,
                    toCol: anim.toCol !== undefined ? anim.toCol : null,
                    value: anim.value,
                    startProgress: 0,
                    endProgress: 1
                });
            }
        });

        if (moveResult.newTile) {
            newTileAnimations.push({
                row: moveResult.newTile.row,
                col: moveResult.newTile.col,
                value: moveResult.newTile.value,
                startProgress: 0,
                endProgress: 1
            });
        }
    }

    function start(callback) {
        if (tileAnimations.length === 0 && mergeAnimations.length === 0 && newTileAnimations.length === 0) {
            if (callback) callback();
            return;
        }

        isAnimating = true;
        onAnimationComplete = callback;
        animationStartTime = performance.now();
        requestAnimationFrame(update);
    }

    function update(timestamp) {
        if (!isAnimating) return;

        var elapsed = timestamp - animationStartTime;
        var progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        var moveProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
        var mergeProgress = elapsed > ANIMATION_DURATION * 0.8 
            ? Math.min((elapsed - ANIMATION_DURATION * 0.8) / MERGE_SCALE_DURATION, 1) 
            : 0;
        var newTileProgress = elapsed > ANIMATION_DURATION 
            ? Math.min((elapsed - ANIMATION_DURATION) / NEW_TILE_ANIMATION_DURATION, 1) 
            : 0;

        if (progress >= 1 && newTileProgress >= 1) {
            isAnimating = false;
            if (onAnimationComplete) {
                onAnimationComplete();
            }
            return;
        }

        requestAnimationFrame(update);
    }

    function getTileAnimations() {
        return tileAnimations;
    }

    function getMergeAnimations() {
        return mergeAnimations;
    }

    function getNewTileAnimations() {
        return newTileAnimations;
    }

    function getAnimationProgress(timestamp) {
        if (!animationStartTime) return { move: 0, merge: 0, newTile: 0 };
        
        var elapsed = timestamp - animationStartTime;
        return {
            move: Math.min(elapsed / ANIMATION_DURATION, 1),
            merge: elapsed > ANIMATION_DURATION * 0.8 
                ? Math.min((elapsed - ANIMATION_DURATION * 0.8) / MERGE_SCALE_DURATION, 1) 
                : 0,
            newTile: elapsed > ANIMATION_DURATION 
                ? Math.min((elapsed - ANIMATION_DURATION) / NEW_TILE_ANIMATION_DURATION, 1) 
                : 0
        };
    }

    function easeOutQuad(t) {
        return t * (2 - t);
    }

    function easeOutBack(t) {
        var c1 = 1.70158;
        var c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    return {
        init: init,
        isAnimating: isCurrentlyAnimating,
        prepareAnimations: prepareAnimations,
        start: start,
        getTileAnimations: getTileAnimations,
        getMergeAnimations: getMergeAnimations,
        getNewTileAnimations: getNewTileAnimations,
        getAnimationProgress: getAnimationProgress,
        easeOutQuad: easeOutQuad,
        easeOutBack: easeOutBack
    };
})();
