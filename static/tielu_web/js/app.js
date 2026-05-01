(function() {
    'use strict';

    var App = {
        init: function() {
            var self = this;
            
            Router.init();
            
            this.handleInitialRoute();
        },

        handleInitialRoute: function() {
            var hash = window.location.hash.slice(1);
            var isLoggedIn = Auth.isLoggedIn();
            
            if (!hash) {
                if (isLoggedIn) {
                    window.location.hash = 'home';
                } else {
                    window.location.hash = 'login';
                }
            } else if (!isLoggedIn && hash !== 'login' && hash !== 'register') {
                window.location.hash = 'login';
            }
        },

        start: function() {
            console.log('🚂 铁道大亨游戏已启动！');
            console.log('📱 朋克风格铁路帝国');
            console.log('============================');
            console.log('可用路由:');
            console.log('  - #login    - 登录');
            console.log('  - #register - 注册');
            console.log('  - #home     - 首页');
            console.log('  - #trains   - 火车列表');
            console.log('  - #cities   - 城市地图');
            console.log('  - #warehouse - 仓库');
            console.log('  - #shop     - 商店');
            console.log('  - #transport - 运输页面');
            console.log('============================');
        }
    };

    window.App = App;

    document.addEventListener('DOMContentLoaded', function() {
        App.init();
        App.start();
    });

    window.addEventListener('load', function() {
        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 0);
    });
})();
