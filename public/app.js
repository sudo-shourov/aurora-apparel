// Storage key helper for backward compatibility
const CART_STORAGE_KEY = 'auroraCart';

// Retrieve cart data safely
function getCart() {
  return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || 
         JSON.parse(localStorage.getItem('auraCart')) || [];
}

// Save cart data safely
function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  localStorage.setItem('auraCart', JSON.stringify(cart));
}

// Add item to cart and open drawer
function addToCart(id, name, price, image) {
  let cart = getCart();
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }

  saveCart(cart);
  updateCartUI();

  if (typeof openCartDrawer === 'function') {
    openCartDrawer();
  }
}

// Update UI elements across pages
function updateCartUI() {
  const cart = getCart();
  const container = document.getElementById('cartItemsContainer');
  const cartCount = document.getElementById('navCartCount');
  const cartTotal = document.getElementById('cartTotal');

  let totalCount = 0;
  let totalPrice = 0;

  cart.forEach(item => {
    totalCount += item.quantity;
    totalPrice += item.price * item.quantity;
  });

  if (cartCount) cartCount.innerText = totalCount;
  if (cartTotal) cartTotal.innerText = `$${totalPrice.toLocaleString()}`;

  if (container) {
    if (cart.length === 0) {
      container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    } else {
      container.innerHTML = cart.map(item => `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <p>$${item.price.toLocaleString()}</p>
            <div class="qty-controls">
              <button class="btn-qty" onclick="changeQuantity(${item.id}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="btn-qty" onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
          </div>
          <button class="btn-remove" onclick="removeFromCart(${item.id})">&times;</button>
        </div>
      `).join('');
    }
  }

  if (typeof renderCheckoutSummary === 'function') {
    renderCheckoutSummary();
  }
}

// Increase or decrease quantity
function changeQuantity(id, delta) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);

  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== id);
    }
    saveCart(cart);
    updateCartUI();
  }
}

// Remove item completely
function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);
  updateCartUI();
}

// ==========================================
// CUSTOM GLASS TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `glass-toast ${type}`;
  
  const icon = type === 'error' ? '✕' : type === 'success' ? '✓' : 'ℹ';
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Tab Switcher Functionality
function switchTab(tabName) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  if (tabName === 'login') {
    loginForm?.classList.remove('hidden');
    signupForm?.classList.add('hidden');
    loginTab?.classList.add('active');
    signupTab?.classList.remove('active');
  } else {
    signupForm?.classList.remove('hidden');
    loginForm?.classList.add('hidden');
    signupTab?.classList.add('active');
    loginTab?.classList.remove('active');
  }
}

// Modal Control Helpers
function openAuthModal() {
  document.getElementById('authModal')?.classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
}

// ==========================================
// AUTHENTICATION LOGIC (Sign Up & Sign In)
// ==========================================

function setupAuthHandlers() {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  // Handle Sign Up
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('signupUsername')?.value;
      const email = document.getElementById('signupEmail')?.value;
      const password = document.getElementById('signupPassword')?.value;

      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.error || 'Signup failed.', 'error');
          return;
        }

        showToast(data.message || 'Account created successfully!', 'success');
        signupForm.reset();
        switchTab('login');
      } catch (err) {
        console.error('Signup error:', err);
        showToast('Network error. Please try again.', 'error');
      }
    });
  }

  // Handle Sign In
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('loginUsername')?.value;
      const password = document.getElementById('loginPassword')?.value;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.error || 'Login failed.', 'error');
          return;
        }

        showToast('Logged in successfully!', 'success');
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', data.username);

        loginForm.reset();
        closeAuthModal();
        checkLoginStatus();
      } catch (err) {
        console.error('Login error:', err);
        showToast('Network error. Please try again.', 'error');
      }
    });
  }

  checkLoginStatus();
}

// Update Nav UI when logged in
function checkLoginStatus() {
  const user = localStorage.getItem('authUser');
  const authStatus = document.getElementById('authStatus');

  if (user && authStatus) {
    authStatus.innerHTML = `
      <span class="user-greeting">Welcome, <strong>${user}</strong></span>
      <button class="btn-glass" onclick="logout()">Logout</button>
      <a href="collection.html" class="btn-glass">Collection</a>
    `;
  }
}

// Logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  showToast('Logged out successfully', 'info');
  setTimeout(() => location.reload(), 1000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  setupAuthHandlers();
});




