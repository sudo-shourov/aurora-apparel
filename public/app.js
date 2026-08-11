let currentUser = localStorage.getItem('aura_username') || null;

document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();

  // Attach submit listeners dynamically
  const signupForm = document.getElementById('signupForm') || document.getElementById('signup-form');
  const loginForm = document.getElementById('loginForm') || document.getElementById('signin-form');
  const verifyForm = document.getElementById('verifyForm') || document.getElementById('verify-form');

  if (signupForm) signupForm.addEventListener('submit', handleSignup);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (verifyForm) verifyForm.addEventListener('submit', handleVerifyCode);
});

function openAuthModal(mode) {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('active');
  switchTab(mode);
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
  clearAlert();
}

function switchTab(tab) {
  clearAlert();
  const loginForm = document.getElementById('loginForm') || document.getElementById('signin-form');
  const signupForm = document.getElementById('signupForm') || document.getElementById('signup-form');
  const verifyForm = document.getElementById('verifyForm') || document.getElementById('verify-form');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  if (verifyForm) verifyForm.style.display = 'none';

  if (tab === 'login') {
    if (loginForm) { loginForm.classList.remove('hidden'); loginForm.style.display = 'block'; }
    if (signupForm) { signupForm.classList.add('hidden'); signupForm.style.display = 'none'; }
    if (loginTab) loginTab.classList.add('active');
    if (signupTab) signupTab.classList.remove('active');
  } else {
    if (signupForm) { signupForm.classList.remove('hidden'); signupForm.style.display = 'block'; }
    if (loginForm) { loginForm.classList.add('hidden'); loginForm.style.display = 'none'; }
    if (signupTab) signupTab.classList.add('active');
    if (loginTab) loginTab.classList.remove('active');
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
  } else {
    alert(message);
  }
}

function clearAlert() {
  const alertBox = document.getElementById('alertBox');
  if (alertBox) alertBox.className = 'alert-box hidden';
}

/* Password Strength Evaluator */
function assessPasswordStrength(password) {
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  updateRuleUI('ruleLength', rules.length);
  updateRuleUI('ruleUpper', rules.upper);
  updateRuleUI('ruleLower', rules.lower);
  updateRuleUI('ruleNumber', rules.number);
  updateRuleUI('ruleSpecial', rules.special);

  const passedCount = Object.values(rules).filter(Boolean).length;
  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');
  const signupBtn = document.getElementById('signupBtn');

  if (strengthBar) {
    const percentage = (passedCount / 5) * 100;
    strengthBar.style.width = `${percentage}%`;

    if (passedCount <= 2) {
      strengthBar.style.backgroundColor = '#ff4757';
      if (strengthLabel) strengthLabel.textContent = 'Weak Password';
    } else if (passedCount <= 4) {
      strengthBar.style.backgroundColor = '#ffa502';
      if (strengthLabel) strengthLabel.textContent = 'Medium Password';
    } else {
      strengthBar.style.backgroundColor = '#2ed573';
      if (strengthLabel) strengthLabel.textContent = 'Strong Password';
    }
  }

  if (signupBtn) signupBtn.disabled = passedCount !== 5;
}

function updateRuleUI(elementId, isValid) {
  const el = document.getElementById(elementId);
  if (el) {
    if (isValid) el.classList.add('valid');
    else el.classList.remove('valid');
  }
}

/* 1. Handle Signup */
async function handleSignup(e) {
  e.preventDefault();
  
  const usernameInput = document.getElementById('signupUsername') || document.getElementById('signup-username');
  const emailInput = document.getElementById('signupEmail') || document.getElementById('signup-email');
  const passwordInput = document.getElementById('signupPassword') || document.getElementById('signup-password');

  const username = usernameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');

    // Switch to Verification View
    const signupForm = document.getElementById('signupForm') || document.getElementById('signup-form');
    const loginForm = document.getElementById('loginForm') || document.getElementById('signin-form');
    const verifyForm = document.getElementById('verifyForm') || document.getElementById('verify-form');
    const emailDisplay = document.getElementById('verify-email-display') || document.getElementById('verifyEmailDisplay');

    if (signupForm) signupForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'none';

    if (verifyForm) {
      verifyForm.style.display = 'block';
      verifyForm.dataset.email = email;
    }

    if (emailDisplay) emailDisplay.innerText = email;

    showAlert('Verification code sent! Please check your email.', 'success');
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* 2. Handle 6-Digit Code Verification */
async function handleVerifyCode(e) {
  e.preventDefault();
  const verifyForm = e.target;
  const email = verifyForm.dataset.email;
  const codeInput = document.getElementById('verifyCode') || document.getElementById('verify-code');
  const code = codeInput.value;

  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');

    showAlert('Account verified successfully! Please sign in.', 'success');
    switchTab('login');
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

/* 3. Handle Login */
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('loginUsername') || document.getElementById('login-username');
  const passwordInput = document.getElementById('loginPassword') || document.getElementById('login-password');

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    // If backend reports email is unverified, show verify form
    if (res.status === 403 && data.requiresVerification) {
      const loginForm = document.getElementById('loginForm') || document.getElementById('signin-form');
      const verifyForm = document.getElementById('verifyForm') || document.getElementById('verify-form');
      const emailDisplay = document.getElementById('verify-email-display') || document.getElementById('verifyEmailDisplay');

      if (loginForm) loginForm.style.display = 'none';
      if (verifyForm) {
        verifyForm.style.display = 'block';
        verifyForm.dataset.email = data.email;
      }
      if (emailDisplay) emailDisplay.innerText = data.email;
      throw new Error(data.error);
    }

    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('aura_token', data.token);
    localStorage.setItem('aura_username', data.username);
    currentUser = data.username;

    updateUserUI();
    closeAuthModal();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

function handleLogout() {
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_username');
  currentUser = null;
  updateUserUI();
}

function updateUserUI() {
  const authStatus = document.getElementById('authStatus');
  if (!authStatus) return;

  if (currentUser) {
    authStatus.innerHTML = `
      <span style="margin-right: 12px;">Welcome, <strong>${currentUser}</strong></span>
      <button class="btn-glass" onclick="handleLogout()">Sign Out</button>
    `;
  } else {
    authStatus.innerHTML = `
      <button class="btn-glass" onclick="openAuthModal('login')">Sign In</button>
      <button class="btn-primary" onclick="openAuthModal('signup')">Create Account</button>
    `;
  }
}