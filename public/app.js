// Function to handle adding items and saving to LocalStorage
function addToCart(id, name, price, image) {
  let cart = JSON.parse(localStorage.getItem('auraCart')) || [];
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }

  localStorage.setItem('auraCart', JSON.stringify(cart));
  updateCartUI();
  if (typeof openCartDrawer === 'function') {
    openCartDrawer();
  }
}

function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem('auraCart')) || [];
  const container = document.getElementById('cartItemsContainer');
  const cartCount = document.getElementById('navCartCount');
  const cartTotal = document.getElementById('cartTotal');

  if (!container) return;

  let totalCount = 0;
  let totalPrice = 0;

  if (cart.length === 0) {
    container.innerHTML = '<p class="empty-msg">Your cart is empty.</p>';
  } else {
    container.innerHTML = cart.map(item => {
      totalCount += item.quantity;
      totalPrice += item.price * item.quantity;
      return `
        <div class="cart-item-row">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <p>$${item.price.toLocaleString()} × ${item.quantity}</p>
          </div>
          <button class="btn-glass" onclick="removeFromCart(${item.id})">×</button>
        </div>
      `;
    }).join('');
  }

  if (cartCount) cartCount.innerText = totalCount;
  if (cartTotal) cartTotal.innerText = `$${totalPrice.toLocaleString()}`;
}

function removeFromCart(id) {
  let cart = JSON.parse(localStorage.getItem('auraCart')) || [];
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('auraCart', JSON.stringify(cart));
  updateCartUI();
}

document.addEventListener('DOMContentLoaded', updateCartUI);