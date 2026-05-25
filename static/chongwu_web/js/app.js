const App = {
    init() {
        this.registerRoutes();
        Router.init();
    },

    registerRoutes() {
        Router.register('home', () => {
            HomePage.render();
        });

        Router.register('pet_form', () => {
            PetFormPage.render();
        });

        Router.register('pet_detail', () => {
            PetDetailPage.render();
        });

        Router.register('health', () => {
            HealthPage.render();
        });

        Router.register('diary', () => {
            DiaryPage.render();
        });

        Router.register('reminder', () => {
            ReminderPage.render();
        });

        Router.register('reminders', () => {
            ReminderPage.render();
        });

        Router.register('photo', () => {
            PhotoPage.render();
        });

        Router.register('photos', () => {
            PhotoPage.render();
        });

        Router.register('medical', () => {
            MedicalPage.render();
        });

        Router.register('vaccine', () => {
            VaccinePage.render();
        });

        Router.register('weight', () => {
            WeightPage.render();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});