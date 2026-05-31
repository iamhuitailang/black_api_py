const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },
    registerRoutes() {
        Router.register('login', () => LoginPage.render());
        Router.register('register', () => RegisterPage.render());
        Router.register('home', () => HomePage.render());
        Router.register('serviceDetail', () => ServiceDetailPage.render());
        Router.register('booking', () => BookingPage.render());
        Router.register('myBookings', () => MyBookingsPage.render());
        Router.register('review', () => ReviewPage.render());
        Router.register('notifications', () => NotificationsPage.render());
        Router.register('profile', () => ProfilePage.render());
        Router.register('password', () => PasswordPage.render());
        Router.register('pets', () => PetsPage.render());
        Router.register('adminLogin', () => AdminLoginPage.render());
        Router.register('adminDashboard', () => AdminDashboardPage.render());
        Router.register('adminServices', () => AdminServicesPage.render());
        Router.register('adminBookings', () => AdminBookingsPage.render());
        Router.register('adminPets', () => AdminPetsPage.render());
        Router.register('adminOrders', () => AdminOrdersPage.render());
        Router.register('adminProfile', () => AdminProfilePage.render());
    }
};

document.addEventListener('DOMContentLoaded', () => { App.init(); });
