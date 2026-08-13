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
  localStorage.setItem('auraCart', JSON.stringify(cart)); // Sync legacy key
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

  // Update navigation count and total price labels
  if (cartCount) cartCount.innerText = totalCount;
  if (cartTotal) cartTotal.innerText = `$${totalPrice.toLocaleString()}`;

  // Update drawer contents if container exists
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

  // Refresh checkout page summary if present
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
// AUTHENTICATION LOGIC (Sign Up & Sign In)
// ==========================================

function setupAuthHandlers() {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  // Handle Sign Up Form
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevents page reload

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
          alert(data.error || 'Signup failed.');
          return;
        }

        alert(data.message || 'Account created successfully!');
        if (typeof closeAuthModal === 'function') closeAuthModal();
        if (typeof switchTab === 'function') switchTab('login');
      } catch (err) {
        console.error('Signup error:', err);
        alert('Network error. Please try again.');
      }
    });
  }

  // Handle Sign In Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevents page reload

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
          alert(data.error || 'Login failed.');
          return;
        }

        alert('Logged in successfully!');
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', data.username);

        if (typeof closeAuthModal === 'function') closeAuthModal();
        checkLoginStatus();
      } catch (err) {
        console.error('Login error:', err);
        alert('Network error. Please try again.');
      }
    });
  }

  checkLoginStatus();
}

// Update Nav UI when user is logged in
function checkLoginStatus() {
  const user = localStorage.getItem('authUser');
  const authStatus = document.getElementById('authStatus');

  if (user && authStatus) {
    authStatus.innerHTML = `
      <span class="user-greeting" style="color: white; margin-right: 12px; font-weight: 500;">Welcome, <strong>${user}</strong></span>
      <button class="btn-glass" onclick="logout()">Logout</button>
      <a href="collection.html" class="btn-glass">Collection</a>
    `;
  }
}

// Logout helper function
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  location.reload();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  setupAuthHandlers();
});