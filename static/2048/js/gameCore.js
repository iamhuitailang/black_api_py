var GameCore = (function() {
    'use strict';

    var GRID_SIZE = 4;
    var WIN_TILE = 2048;
    var MAX_HISTORY = 10;

    var gameState = null;

    function init() {
        gameState = Storage.createGameState(
            Storage.createEmptyGrid(GRID_SIZE),
            0,
            Storage.getBestScore(),
            false,
            false,
            false,
            []
        );
    }

    function getState() {
        return Utils.clone(gameState);
    }

    function setState(state) {
        if (state) {
            gameState = Utils.clone(state);
        }
    }

    function reset() {
        init();
        addRandomTile();
        addRandomTile();
        gameState.history = [];
        gameState.isWin = false;
        gameState.gameOver = false;
        gameState.isPaused = false;
        return getState();
    }

    function addRandomTile() {
        var emptyCells = Storage.getEmptyCells(gameState.grid);
        if (emptyCells.length === 0) {
            return null;
        }
        var cell = Utils.randomChoice(emptyCells);
        var value = Math.random() < 0.9 ? 2 : 4;
        gameState.grid[cell.row][cell.col] = value;
        return {
            row: cell.row,
            col: cell.col,
            value: value,
            isNew: true
        };
    }

    function saveHistory() {
        var historyItem = {
            grid: Utils.clone(gameState.grid),
            score: gameState.score
        };
        gameState.history.push(historyItem);
        if (gameState.history.length > MAX_HISTORY) {
            gameState.history.shift();
        }
    }

    function canUndo() {
        return gameState.history.length > 0;
    }

    function undo() {
        if (!canUndo()) {
            return null;
        }
        var historyItem = gameState.history.pop();
        gameState.grid = historyItem.grid;
        gameState.score = historyItem.score;
        gameState.gameOver = false;
        return getState();
    }

    function move(direction) {
        if (gameState.isPaused || gameState.gameOver) {
            return { moved: false };
        }

        var originalGrid = Utils.clone(gameState.grid);
        var originalScore = gameState.score;
        var animations = [];
        var mergeScores = [];

        saveHistory();

        var moved = false;
        var isWin = gameState.isWin;

        switch (direction) {
            case 'up':
                var result = moveUp(gameState.grid, animations, mergeScores);
                moved = result.moved;
                break;
            case 'down':
                var result = moveDown(gameState.grid, animations, mergeScores);
                moved = result.moved;
                break;
            case 'left':
                var result = moveLeft(gameState.grid, animations, mergeScores);
                moved = result.moved;
                break;
            case 'right':
                var result = moveRight(gameState.grid, animations, mergeScores);
                moved = result.moved;
                break;
        }

        if (moved) {
            var newTile = addRandomTile();
            
            if (!isWin) {
                isWin = checkWin(gameState.grid);
            }
            gameState.isWin = isWin;

            var gameOver = checkGameOver(gameState.grid);
            gameState.gameOver = gameOver;

            if (gameState.score > gameState.bestScore) {
                gameState.bestScore = gameState.score;
                Storage.setBestScore(gameState.score);
            }

            saveCurrentState();

            return {
                moved: true,
                animations: animations,
                mergeScores: mergeScores,
                newTile: newTile,
                isWin: isWin && !checkWin(originalGrid),
                gameOver: gameOver,
                state: getState()
            };
        } else {
            gameState.history.pop();
            return { moved: false };
        }
    }

    function moveLeft(grid, animations, mergeScores) {
        var moved = false;
        var size = grid.length;

        for (var row = 0; row < size; row++) {
            var currentRow = [];
            for (var col = 0; col < size; col++) {
                if (grid[row][col] !== 0) {
                    currentRow.push({
                        value: grid[row][col],
                        originalCol: col
                    });
                }
            }

            var mergedRow = [];
            var skipNext = false;

            for (var i = 0; i < currentRow.length; i++) {
                if (skipNext) {
                    skipNext = false;
                    continue;
                }

                if (i < currentRow.length - 1 && currentRow[i].value === currentRow[i + 1].value) {
                    var mergedValue = currentRow[i].value * 2;
                    mergedRow.push({
                        value: mergedValue,
                        fromCol1: currentRow[i].originalCol,
                        fromCol2: currentRow[i + 1].originalCol,
                        toCol: mergedRow.length,
                        isMerge: true
                    });

                    animations.push({
                        type: 'merge',
                        row: row,
                        fromCol1: currentRow[i].originalCol,
                        fromCol2: currentRow[i + 1].originalCol,
                        toCol: mergedRow.length - 1,
                        value: mergedValue
                    });

                    mergeScores.push({
                        row: row,
                        col: mergedRow.length - 1,
                        value: mergedValue
                    });

                    gameState.score += mergedValue;
                    skipNext = true;
                    moved = true;
                } else {
                    mergedRow.push({
                        value: currentRow[i].value,
                        fromCol: currentRow[i].originalCol,
                        toCol: mergedRow.length
                    });

                    if (currentRow[i].originalCol !== mergedRow.length - 1) {
                        animations.push({
                            type: 'move',
                            row: row,
                            fromCol: currentRow[i].originalCol,
                            toCol: mergedRow.length - 1
                        });
                        moved = true;
                    }
                }
            }

            for (var col = 0; col < size; col++) {
                grid[row][col] = 0;
            }
            for (var j = 0; j < mergedRow.length; j++) {
                grid[row][j] = mergedRow[j].value;
            }
        }

        return { moved: moved };
    }

    function moveRight(grid, animations, mergeScores) {
        var moved = false;
        var size = grid.length;

        for (var row = 0; row < size; row++) {
            var currentRow = [];
            for (var col = size - 1; col >= 0; col--) {
                if (grid[row][col] !== 0) {
                    currentRow.push({
                        value: grid[row][col],
                        originalCol: col
                    });
                }
            }

            var mergedRow = [];
            var skipNext = false;

            for (var i = 0; i < currentRow.length; i++) {
                if (skipNext) {
                    skipNext = false;
                    continue;
                }

                if (i < currentRow.length - 1 && currentRow[i].value === currentRow[i + 1].value) {
                    var mergedValue = currentRow[i].value * 2;
                    var toCol = size - 1 - mergedRow.length;

                    mergedRow.push({
                        value: mergedValue,
                        fromCol1: currentRow[i].originalCol,
                        fromCol2: currentRow[i + 1].originalCol,
                        toCol: toCol,
                        isMerge: true
                    });

                    animations.push({
                        type: 'merge',
                        row: row,
                        fromCol1: currentRow[i].originalCol,
                        fromCol2: currentRow[i + 1].originalCol,
                        toCol: toCol,
                        value: mergedValue
                    });

                    mergeScores.push({
                        row: row,
                        col: toCol,
                        value: mergedValue
                    });

                    gameState.score += mergedValue;
                    skipNext = true;
                    moved = true;
                } else {
                    var toColSingle = size - 1 - mergedRow.length;
                    mergedRow.push({
                        value: currentRow[i].value,
                        fromCol: currentRow[i].originalCol,
                        toCol: toColSingle
                    });

                    if (currentRow[i].originalCol !== toColSingle) {
                        animations.push({
                            type: 'move',
                            row: row,
                            fromCol: currentRow[i].originalCol,
                            toCol: toColSingle
                        });
                        moved = true;
                    }
                }
            }

            for (var col = 0; col < size; col++) {
                grid[row][col] = 0;
            }
            for (var j = 0; j < mergedRow.length; j++) {
                grid[row][mergedRow[j].toCol] = mergedRow[j].value;
            }
        }

        return { moved: moved };
    }

    function moveUp(grid, animations, mergeScores) {
        var moved = false;
        var size = grid.length;

        for (var col = 0; col < size; col++) {
            var currentCol = [];
            for (var row = 0; row < size; row++) {
                if (grid[row][col] !== 0) {
                    currentCol.push({
                        value: grid[row][col],
                        originalRow: row
                    });
                }
            }

            var mergedCol = [];
            var skipNext = false;

            for (var i = 0; i < currentCol.length; i++) {
                if (skipNext) {
                    skipNext = false;
                    continue;
                }

                if (i < currentCol.length - 1 && currentCol[i].value === currentCol[i + 1].value) {
                    var mergedValue = currentCol[i].value * 2;
                    mergedCol.push({
                        value: mergedValue,
                        fromRow1: currentCol[i].originalRow,
                        fromRow2: currentCol[i + 1].originalRow,
                        toRow: mergedCol.length,
                        isMerge: true
                    });

                    animations.push({
                        type: 'merge',
                        col: col,
                        fromRow1: currentCol[i].originalRow,
                        fromRow2: currentCol[i + 1].originalRow,
                        toRow: mergedCol.length - 1,
                        value: mergedValue
                    });

                    mergeScores.push({
                        row: mergedCol.length - 1,
                        col: col,
                        value: mergedValue
                    });

                    gameState.score += mergedValue;
                    skipNext = true;
                    moved = true;
                } else {
                    mergedCol.push({
                        value: currentCol[i].value,
                        fromRow: currentCol[i].originalRow,
                        toRow: mergedCol.length
                    });

                    if (currentCol[i].originalRow !== mergedCol.length - 1) {
                        animations.push({
                            type: 'move',
                            col: col,
                            fromRow: currentCol[i].originalRow,
                            toRow: mergedCol.length - 1
                        });
                        moved = true;
                    }
                }
            }

            for (var row = 0; row < size; row++) {
                grid[row][col] = 0;
            }
            for (var j = 0; j < mergedCol.length; j++) {
                grid[j][col] = mergedCol[j].value;
            }
        }

        return { moved: moved };
    }

    function moveDown(grid, animations, mergeScores) {
        var moved = false;
        var size = grid.length;

        for (var col = 0; col < size; col++) {
            var currentCol = [];
            for (var row = size - 1; row >= 0; row--) {
                if (grid[row][col] !== 0) {
                    currentCol.push({
                        value: grid[row][col],
                        originalRow: row
                    });
                }
            }

            var mergedCol = [];
            var skipNext = false;

            for (var i = 0; i < currentCol.length; i++) {
                if (skipNext) {
                    skipNext = false;
                    continue;
                }

                if (i < currentCol.length - 1 && currentCol[i].value === currentCol[i + 1].value) {
                    var mergedValue = currentCol[i].value * 2;
                    var toRow = size - 1 - mergedCol.length;

                    mergedCol.push({
                        value: mergedValue,
                        fromRow1: currentCol[i].originalRow,
                        fromRow2: currentCol[i + 1].originalRow,
                        toRow: toRow,
                        isMerge: true
                    });

                    animations.push({
                        type: 'merge',
                        col: col,
                        fromRow1: currentCol[i].originalRow,
                        fromRow2: currentCol[i + 1].originalRow,
                        toRow: toRow,
                        value: mergedValue
                    });

                    mergeScores.push({
                        row: toRow,
                        col: col,
                        value: mergedValue
                    });

                    gameState.score += mergedValue;
                    skipNext = true;
                    moved = true;
                } else {
                    var toRowSingle = size - 1 - mergedCol.length;
                    mergedCol.push({
                        value: currentCol[i].value,
                        fromRow: currentCol[i].originalRow,
                        toRow: toRowSingle
                    });

                    if (currentCol[i].originalRow !== toRowSingle) {
                        animations.push({
                            type: 'move',
                            col: col,
                            fromRow: currentCol[i].originalRow,
                            toRow: toRowSingle
                        });
                        moved = true;
                    }
                }
            }

            for (var row = 0; row < size; row++) {
                grid[row][col] = 0;
            }
            for (var j = 0; j < mergedCol.length; j++) {
                grid[mergedCol[j].toRow][col] = mergedCol[j].value;
            }
        }

        return { moved: moved };
    }

    function checkWin(grid) {
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (grid[i][j] === WIN_TILE) {
                    return true;
                }
            }
        }
        return false;
    }

    function checkGameOver(grid) {
        var size = grid.length;

        for (var i = 0; i < size; i++) {
            for (var j = 0; j < size; j++) {
                if (grid[i][j] === 0) {
                    return false;
                }
            }
        }

        for (var row = 0; row < size; row++) {
            for (var col = 0; col < size; col++) {
                var current = grid[row][col];
                
                if (col < size - 1 && grid[row][col + 1] === current) {
                    return false;
                }
                
                if (row < size - 1 && grid[row + 1][col] === current) {
                    return false;
                }
            }
        }

        return true;
    }

    function saveCurrentState() {
        Storage.saveGameState({
            grid: gameState.grid,
            score: gameState.score,
            bestScore: gameState.bestScore,
            isWin: gameState.isWin,
            gameOver: gameState.gameOver,
            isPaused: gameState.isPaused,
            history: gameState.history
        });
    }

    function loadSavedState() {
        var saved = Storage.loadGameState();
        if (saved) {
            gameState = {
                grid: saved.grid || Storage.createEmptyGrid(GRID_SIZE),
                score: saved.score || 0,
                bestScore: Math.max(saved.bestScore || 0, Storage.getBestScore()),
                isWin: saved.isWin || false,
                gameOver: saved.gameOver || false,
                isPaused: saved.isPaused || false,
                history: saved.history || []
            };
            return getState();
        }
        return null;
    }

    function pause() {
        if (!gameState.gameOver && !gameState.isPaused) {
            gameState.isPaused = true;
            saveCurrentState();
            return true;
        }
        return false;
    }

    function resume() {
        if (gameState.isPaused) {
            gameState.isPaused = false;
            saveCurrentState();
            return true;
        }
        return false;
    }

    return {
        GRID_SIZE: GRID_SIZE,
        WIN_TILE: WIN_TILE,
        init: init,
        getState: getState,
        setState: setState,
        reset: reset,
        move: move,
        canUndo: canUndo,
        undo: undo,
        pause: pause,
        resume: resume,
        saveCurrentState: saveCurrentState,
        loadSavedState: loadSavedState
    };
})();
