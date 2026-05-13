const App = {
    init() {
        MapRenderer.init('mapCanvas');
        Interaction.init(MapRenderer, (province) => {
            Game.handleProvinceClick(province);
        });
        Game.init();
        UI.init();
        
        window.addEventListener('resize', () => {
            MapRenderer.resize();
            MapRenderer.centerMap();
            if (Game.isPlaying) {
                MapRenderer.render();
            }
        });
        
        MapRenderer.render();
        
        setInterval(() => {
            if (Game.isPlaying && !Game.isPaused) {
                Game.saveState();
            }
        }, 5000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
