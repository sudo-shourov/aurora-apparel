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

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateCartUI);