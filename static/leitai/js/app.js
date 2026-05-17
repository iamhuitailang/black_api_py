const App = {
    game: null,

    init() {
        const canvas = document.getElementById('gameCanvas');
        this.game = new Game(canvas);
        this.game.init();
        this.game.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
