export class AuthManager {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.authOverlay = document.getElementById('auth-overlay');
    this.loginForm = document.getElementById('login-form');
    this.emailInput = document.getElementById('auth-email');
    this.passwordInput = document.getElementById('auth-password');
    this.authError = document.getElementById('auth-error');
    this.btnQuickFill = document.getElementById('btn-quick-fill');
    this.btnLogout = document.getElementById('btn-logout');

    this.defaultAdmin = {
      email: 'admin@apex.city',
      password: 'admin123'
    };

    this.init();
  }

  init() {
    // Check if already authenticated in localStorage
    if (localStorage.getItem('apex_auth_session') === 'true') {
      this.grantAccess();
    } else {
      this.showAuthModal();
    }

    if (this.btnQuickFill) {
      this.btnQuickFill.addEventListener('click', (e) => {
        e.preventDefault();
        this.emailInput.value = this.defaultAdmin.email;
        this.passwordInput.value = this.defaultAdmin.password;
        this.authError.textContent = '';
      });
    }

    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    if (this.btnLogout) {
      this.btnLogout.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  showAuthModal() {
    if (this.authOverlay) {
      this.authOverlay.classList.remove('hidden');
    }
  }

  handleLogin() {
    const email = this.emailInput.value.trim().toLowerCase();
    const password = this.passwordInput.value.trim();

    // Check credentials (accepts admin@apex.city / admin123, or simple admin / admin123)
    if (
      (email === this.defaultAdmin.email || email === 'admin' || email === 'admin@admin.com') &&
      (password === this.defaultAdmin.password || password === 'admin')
    ) {
      localStorage.setItem('apex_auth_session', 'true');
      this.authError.textContent = '';
      this.grantAccess();
    } else {
      this.authError.textContent = 'Invalid credentials! Use demo credentials: admin@apex.city / admin123';
    }
  }

  grantAccess() {
    if (this.authOverlay) {
      this.authOverlay.classList.add('hidden');
    }

    // Unfocus all form inputs so physical keyboard directly controls the game immediately
    if (document.activeElement) {
      document.activeElement.blur();
    }
    window.focus();

    if (this.onAuthSuccess) {
      this.onAuthSuccess();
    }
  }

  logout() {
    localStorage.removeItem('apex_auth_session');
    location.reload();
  }
}
