const App = {
  init() {
    this.registerRoutes();
    Router.init();
  },

  registerRoutes() {
    Router.register('/', {
      render: () => HomePage.render(),
      mounted: () => {}
    });

    Router.register('/login', {
      render: () => LoginPage.render(),
      mounted: () => {}
    });

    Router.register('/register', {
      render: () => RegisterPage.render(),
      mounted: () => {}
    });

    Router.register('/room/detail', {
      render: () => RoomDetailPage.render(),
      mounted: () => {}
    });

    Router.register('/my-bookings', {
      render: () => MyBookingsPage.render(),
      mounted: () => {}
    });

    Router.register('/messages', {
      render: () => MessagesPage.render(),
      mounted: () => {}
    });

    Router.register('/profile', {
      render: () => ProfilePage.render(),
      mounted: () => {}
    });

    Router.register('/booking/detail', {
      render: () => BookingDetailPage.render(),
      mounted: () => {}
    });

    Router.register('/admin/dashboard', {
      render: () => AdminDashboardPage.render(),
      mounted: () => {}
    });

    Router.register('/admin/rooms', {
      render: () => AdminRoomsPage.render(),
      mounted: () => {}
    });

    Router.register('/admin/bookings', {
      render: () => AdminBookingsPage.render(),
      mounted: () => {}
    });

    Router.register('/admin/checkin', {
      render: () => AdminCheckinPage.render(),
      mounted: () => {}
    });

    Router.register('/404', {
      render: () => this.render404(),
      mounted: () => {}
    });
  },

  render404() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="text-align: center; color: white;">
          <div style="font-size: 120px; font-weight: 700; margin-bottom: 16px;">404</div>
          <div style="font-size: 24px; margin-bottom: 24px;">页面不存在</div>
          <button class="btn btn-primary" onclick="Router.navigate('/')">返回首页</button>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
