let currentUser = localStorage.getItem('aura_username') || null;

document.addEventListener('DOMContentLoaded', () => {
  updateUserUI();
});

function openAuthModal(mode) {
  document.getElementById('authModal').classList.add('active');
  switchTab(mode);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
  clearAlert();
}

function switchTab(tab) {
  clearAlert();
  if (tab === 'login') {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('signupTab').classList.remove('active');
  } else {
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupTab').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('alertBox');
  alertBox.textContent = message;
  alertBox.className = `alert-box ${type}`;
}

function clearAlert() {
  const alertBox = document.getElementById('alertBox');
  alertBox.className = 'alert-box hidden';
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

  const percentage = (passedCount / 5) * 100;
  strengthBar.style.width = `${percentage}%`;

  if (passedCount <= 2) {
    strengthBar.style.backgroundColor = '#ff4757';
    strengthLabel.textContent = 'Weak Password';
  } else if (passedCount <= 4) {
    strengthBar.style.backgroundColor = '#ffa502';
    strengthLabel.textContent = 'Medium Password';
  } else {
    strengthBar.style.backgroundColor = '#2ed573';
    strengthLabel.textContent = 'Strong Password';
  }

  // Enable button only when all rules are met
  signupBtn.disabled = passedCount !== 5;
}

function updateRuleUI(elementId, isValid) {
  const el = document.getElementById(elementId);
  if (isValid) {
    el.classList.add('valid');
  } else {
    el.classList.remove('valid');
  }
}

/* Auth Submissions */
async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    localStorage.setItem('aura_token', data.token);
    localStorage.setItem('aura_username', data.username);
    currentUser = data.username;
    
    updateUserUI();
    closeAuthModal();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

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