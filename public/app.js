let cart = [];

// Scroll tracking for dynamic background shifts
window.addEventListener('scroll', () => {
  if (!window.bgState) return;
  const catalogEl = document.getElementById('catalog');
  if (!catalogEl) return;
  
  const rect = catalogEl.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom >= 0) {
    window.bgState.targetScale = 85;
    window.bgState.targetTwist = 2.4;
    window.bgState.targetChaos = 1.1;
  } else {
    window.bgState.targetScale = 60;
    window.bgState.targetTwist = 1.2;
    window.bgState.targetChaos = 0.6;
  }
});

// Cart Drawer Handlers
window.openCartDrawer = function() {
  document.getElementById('cartDrawer').classList.add('active');
  document.getElementById('cartDrawerOverlay').classList.add('active');
  
  if (window.bgState) {
    window.bgState.targetCamX = -25;
    window.bgState.targetChaos = 1.4;
  }
};

window.closeCartDrawer = function() {
  document.getElementById('cartDrawer').classList.remove('active');
  document.getElementById('cartDrawerOverlay').classList.remove('active');
  
  if (window.bgState) {
    window.bgState.targetCamX = 0;
    window.bgState.targetChaos = 0.6;
  }
};

window.addToCart = function(title, price) {
  cart.push({ title, price });
  updateCartUI();
  openCartDrawer();
};

window.removeFromCart = function(index) {
  cart.splice(index, 1);
  updateCartUI();
};

function updateCartUI() {
  const cartCountEl = document.getElementById('navCartCount');
  const itemsContainer = document.getElementById('cartItemsContainer');
  const totalEl = document.getElementById('cartTotal');
  
  if (cartCountEl) cartCountEl.textContent = cart.length;

  if (cart.length === 0) {
    if (itemsContainer) itemsContainer.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
    if (totalEl) totalEl.textContent = '$0';
    return;
  }

  let total = 0;
  if (itemsContainer) itemsContainer.innerHTML = '';
  
  cart.forEach((item, index) => {
    total += item.price;
    const itemEl = document.createElement('div');
    itemEl.className = 'cart-item';
    itemEl.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <div>$${item.price}</div>
      </div>
      <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:18px;">&times;</button>
    `;
    if (itemsContainer) itemsContainer.appendChild(itemEl);
  });

  if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
}

// Modal Handlers
window.openAuthModal = function(mode) {
  document.getElementById('authModal').classList.add('active');
  switchTab(mode);
};

window.closeAuthModal = function() {
  document.getElementById('authModal').classList.remove('active');
};

window.switchTab = function(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  if (tab === 'login') {
    if (loginForm) loginForm.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (loginTab) loginTab.classList.add('active');
    if (signupTab) signupTab.classList.remove('active');
  } else {
    if (signupForm) signupForm.classList.remove('hidden');
    if (loginForm) loginForm.classList.add('hidden');
    if (signupTab) signupTab.classList.add('active');
    if (loginTab) loginTab.classList.remove('active');
  }
};