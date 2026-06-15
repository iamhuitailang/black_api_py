function renderApp() {
  renderUserArea();
  const view = AppState.view;
  if (view === 'publish') {
    showPublishModal();
    AppState.view = 'home';
    return;
  }
  switch (view) {
    case 'home':
      renderHomePage();
      break;
    case 'detail':
      renderDetailPage();
      break;
    case 'records':
      renderRecordsPage();
      break;
    case 'profile':
      renderProfilePage();
      break;
    default:
      renderHomePage();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  renderApp();
  setInterval(async () => {
    if (api.isLoggedIn()) {
      try { await api.check_overdue_reminders(); } catch(e) {}
    }
  }, 60000);
});
