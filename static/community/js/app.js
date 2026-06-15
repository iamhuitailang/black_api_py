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
  if (api.isLoggedIn()) {
    startNotifPolling();
  }
  setInterval(async () => {
    if (api.isLoggedIn()) {
      try { await api.getMyOverdue(); } catch(e) {}
    }
  }, 60000);
});
