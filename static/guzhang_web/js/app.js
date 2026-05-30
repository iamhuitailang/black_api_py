const routes = {
  '/login': LoginPage,
  '/register': RegisterPage,
  '/home': HomePage,
  '/game': GamePage,
  '/settings': SettingsPage
};

const App = {
  setup() {
    const currentRoute = Vue.ref(window.location.hash.slice(1) || '/login');
    
    const updateRoute = () => {
      let hash = window.location.hash.slice(1) || '/login';
      
      if (!store.isLoggedIn() && !['/login', '/register'].includes(hash)) {
        hash = '/login';
        window.location.hash = '#/login';
      }
      
      if (store.isLoggedIn() && ['/login', '/register'].includes(hash)) {
        hash = '/home';
        window.location.hash = '#/home';
      }
      
      currentRoute.value = hash;
    };
    
    Vue.onMounted(() => {
      updateRoute();
      window.addEventListener('hashchange', updateRoute);
    });
    
    return {
      currentRoute,
      routes
    };
  },
  template: `
    <component :is="routes[currentRoute] || routes['/login']" />
  `
};

const app = Vue.createApp(App);
app.mount('#app');
