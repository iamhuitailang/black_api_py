window.app = null;

document.addEventListener('DOMContentLoaded', function () {
  GameStore.init();
  GameRouter.init();

  var app = Vue.createApp({
    data: function () {
      return {
        currentRoute: 'lobby',
        routeParams: {}
      };
    },
    computed: {
      currentComponent: function () {
        var route = this.currentRoute;
        var componentMap = {
          lobby: LobbyPage,
          shop: ShopPage,
          dress: DressPage,
          maps: MapsPage,
          profile: ProfilePage,
          activity: ActivityPage,
          props: PropsPage,
          game: GamePage
        };
        return componentMap[route] || LobbyPage;
      }
    },
    methods: {
      handleRouteChange: function (route, params) {
        this.currentRoute = route;
        this.routeParams = params || {};
      }
    },
    mounted: function () {
      var self = this;
      GameRouter.onRouteChange(function (route, params) {
        self.handleRouteChange(route, params);
      });
      var current = GameRouter.getCurrentRoute();
      this.currentRoute = current.route;
      this.routeParams = current.params;
    },
    template: '<component :is="currentComponent" :key="currentRoute + JSON.stringify(routeParams)"></component>'
  });

  window.app = app.mount('#app');
});
