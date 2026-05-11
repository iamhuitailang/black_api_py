var Storage = (function() {
    'use strict';

    var STORAGE_KEY = Config.GAME_CONFIG.storageKey;

    function saveGame(data) {
        try {
            var serialized = JSON.stringify(data);
            localStorage.setItem(STORAGE_KEY, serialized);
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }

    function loadGame() {
        try {
            var serialized = localStorage.getItem(STORAGE_KEY);
            if (!serialized) {
                return null;
            }
            var data = JSON.parse(serialized);
            return data;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    function clearGame() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Failed to clear game:', e);
            return false;
        }
    }

    function hasSavedGame() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch (e) {
            return false;
        }
    }

    function serializeBall(ball) {
        return {
            x: ball.x,
            y: ball.y,
            vx: ball.vx,
            vy: ball.vy,
            radius: ball.radius,
            color: ball.color,
            label: ball.label,
            isCue: ball.isCue,
            isPocketed: ball.isPocketed,
            isMoving: ball.isMoving
        };
    }

    function deserializeBall(ballData) {
        return {
            x: ballData.x,
            y: ballData.y,
            vx: ballData.vx || 0,
            vy: ballData.vy || 0,
            radius: ballData.radius || Config.GAME_CONFIG.ballRadius,
            color: ballData.color,
            label: ballData.label,
            isCue: ballData.isCue || false,
            isPocketed: ballData.isPocketed || false,
            isMoving: ballData.isMoving || false
        };
    }

    function serializeBalls(balls) {
        return balls.map(serializeBall);
    }

    function deserializeBalls(ballsData) {
        return ballsData.map(deserializeBall);
    }

    return {
        saveGame: saveGame,
        loadGame: loadGame,
        clearGame: clearGame,
        hasSavedGame: hasSavedGame,
        serializeBall: serializeBall,
        deserializeBall: deserializeBall,
        serializeBalls: serializeBalls,
        deserializeBalls: deserializeBalls
    };
})();
