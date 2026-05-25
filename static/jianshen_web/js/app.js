Router.register('login', () => LoginPage.render());
Router.register('register', () => RegisterPage.render());
Router.register('home', () => HomePage.render());
Router.register('checkin', () => CheckinPage.render());
Router.register('statistics', () => StatisticsPage.render());
Router.register('plans', () => PlansPage.render());
Router.register('achievements', () => AchievementsPage.render());
Router.register('ranking', () => RankingPage.render());
Router.register('profile', () => ProfilePage.render());

Router.init();
