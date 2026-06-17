// Storefront Logic

let products = [];
let cart = JSON.parse(localStorage.getItem('aethershop_cart')) || [];
let activeCurrency = localStorage.getItem('aethershop_currency') || 'VND';
let activeCategory = 'All';
let searchQuery = '';
let selectedDetailProduct = null;

// ==========================================
// Initialization & Loading
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Sync UI currency buttons
  updateCurrencySwitcherUI();
  
  // Theme Toggle Setup
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  if (themeToggleBtn) {
    const savedTheme = localStorage.getItem('aethershop_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('aethershop_theme', newTheme);
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }

  // Load products catalog
  await loadProducts();
  updateCartUI();
});

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch catalog');
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error(err);
    showToast('Failed to load product catalogue', 'danger');
  }
}

// ==========================================
// Render Products Grid
// ==========================================
function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '';

  // Filter products
  const filtered = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-cart-text" style="grid-column: 1/-1; margin: 3rem 0;">No matching products found.</div>`;
    return;
  }

  filtered.forEach(p => {
    const priceText = formatPrice(p);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-image-box" onclick="openProductDetails('${p.id}')">
        <img src="${p.image}" alt="${p.name}">
        <span class="card-category-pill">${p.category}</span>
      </div>
      <div class="card-content">
        <div class="card-header-row">
          <h3 class="card-title" onclick="openProductDetails('${p.id}')">${escapeHTML(p.name)}</h3>
          <div class="card-rating">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>${p.rating.toFixed(1)}</span>
          </div>
        </div>
        <p class="card-desc">${escapeHTML(p.description)}</p>
        <div class="card-footer">
          <span class="card-price">${priceText}</span>
          <button class="btn-add-cart-card" ${p.stock <= 0 ? 'disabled' : ''} onclick="addToCart('${p.id}')">
            ${p.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ==========================================
// Catalog Control Filters
// ==========================================
function filterCategory(category) {
  activeCategory = category;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    if (tab.getAttribute('data-category') === category) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  renderProducts();
}

function handleSearch() {
  const input = document.getElementById('search-input');
  searchQuery = input ? input.value.trim() : '';
  renderProducts();
}

function setCurrency(currency) {
  activeCurrency = currency;
  localStorage.setItem('aethershop_currency', currency);
  updateCurrencySwitcherUI();
  renderProducts();
  updateCartUI();
}

function updateCurrencySwitcherUI() {
  const btnVnd = document.getElementById('btn-currency-vnd');
  const btnUsd = document.getElementById('btn-currency-usd');
  if (activeCurrency === 'VND') {
    btnVnd.classList.add('active');
    btnUsd.classList.remove('active');
  } else {
    btnUsd.classList.add('active');
    btnVnd.classList.remove('active');
  }
}

// ==========================================
// Shopping Cart Functionalities
// ==========================================
function addToCart(productId, qty = 1) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast('Sorry, this item is out of stock!', 'warning');
    return;
  }

  const existingItem = cart.find(item => item.id === productId);
  const currentCartQty = existingItem ? existingItem.qty : 0;
  
  if (product.stock < (currentCartQty + qty)) {
    showToast(`Cannot add more. Remaining stock: ${product.stock}`, 'warning');
    return;
  }

  if (existingItem) {
    existingItem.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      priceVND: product.priceVND,
      priceUSD: product.priceUSD,
      image: product.image,
      qty: qty
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${qty} x "${product.name}" to cart 🛒`, 'success');
}

function saveCart() {
  localStorage.setItem('aethershop_cart', JSON.stringify(cart));
}

function updateCartUI() {
  // Update badge count
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.innerText = totalQty;

  // Render items inside drawer
  const container = document.getElementById('cart-items-container');
  const checkoutBtn = document.getElementById('btn-checkout-proceed');
  
  if (!container) return;
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-cart-text">Your cart is empty.</div>`;
    if (checkoutBtn) checkoutBtn.disabled = true;
    updateSubtotal(0);
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let totalSum = 0;

  cart.forEach((item, index) => {
    const price = activeCurrency === 'VND' ? item.priceVND : item.priceUSD;
    const itemTotal = price * item.qty;
    totalSum += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHTML(item.name)}</h4>
        <span class="cart-item-price">${formatValue(price)}</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeCartQty(${index}, -1)">-</button>
        <span class="cart-item-qty-input">${item.qty}</span>
        <button class="qty-btn" onclick="changeCartQty(${index}, 1)">+</button>
      </div>
      <button class="btn-remove-item" onclick="removeCartItem(${index})" title="Remove Item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    container.appendChild(div);
  });

  updateSubtotal(totalSum);
}

function changeCartQty(index, offset) {
  const item = cart[index];
  const product = products.find(p => p.id === item.id);
  if (!product) return;

  const newQty = item.qty + offset;
  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }

  if (offset > 0 && product.stock < newQty) {
    showToast(`Sorry, only ${product.stock} items left in stock.`, 'warning');
    return;
  }

  item.qty = newQty;
  saveCart();
  updateCartUI();
}

function removeCartItem(index) {
  const name = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast(`Removed "${name}" from cart`, 'warning');
}

function updateSubtotal(subtotal) {
  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) {
    subtotalEl.innerText = formatValue(subtotal);
  }
}

function toggleCart(open) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    if (open) {
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  }
}

// ==========================================
// Modal Handlers
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

function openProductDetails(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  selectedDetailProduct = p;

  document.getElementById('detail-product-img').src = p.image;
  document.getElementById('detail-product-category').innerText = p.category;
  document.getElementById('detail-product-name').innerText = p.name;
  document.getElementById('detail-product-rating').innerText = p.rating.toFixed(1);
  document.getElementById('detail-product-desc').innerText = p.description;
  document.getElementById('detail-product-price').innerText = formatPrice(p);

  const stockBadge = document.getElementById('detail-product-stock');
  if (p.stock > 0) {
    stockBadge.innerText = `In Stock (${p.stock} remaining)`;
    stockBadge.classList.remove('out-of-stock');
  } else {
    stockBadge.innerText = 'Out of Stock';
    stockBadge.classList.add('out-of-stock');
  }

  document.getElementById('detail-qty-input').value = 1;

  // Add event listener to add-to-cart in modal
  const addBtn = document.getElementById('btn-detail-add-to-cart');
  addBtn.disabled = p.stock <= 0;
  addBtn.onclick = () => {
    const qty = parseInt(document.getElementById('detail-qty-input').value) || 1;
    addToCart(p.id, qty);
    closeModal('modal-product-details');
  };

  openModal('modal-product-details');
}

function changeDetailQty(offset) {
  const input = document.getElementById('detail-qty-input');
  if (!input || !selectedDetailProduct) return;
  
  let val = (parseInt(input.value) || 1) + offset;
  if (val < 1) val = 1;
  if (selectedDetailProduct.stock < val) {
    showToast(`Sorry, only ${selectedDetailProduct.stock} items left in stock.`, 'warning');
    return;
  }
  input.value = val;
}

// ==========================================
// Checkout Handling
// ==========================================
function openCheckoutModal() {
  if (cart.length === 0) return;
  toggleCart(false); // Close cart drawer
  
  // Render checkout summary list
  const summaryContainer = document.getElementById('checkout-summary-list');
  if (!summaryContainer) return;
  summaryContainer.innerHTML = '';

  let totalSum = 0;

  cart.forEach(item => {
    const price = activeCurrency === 'VND' ? item.priceVND : item.priceUSD;
    const itemTotal = price * item.qty;
    totalSum += itemTotal;

    const div = document.createElement('div');
    div.className = 'checkout-summary-item';
    div.innerHTML = `
      <span><span class="item-qty">${item.qty}x</span> ${escapeHTML(item.name)}</span>
      <span>${formatValue(itemTotal)}</span>
    `;
    summaryContainer.appendChild(div);
  });

  const totalValEl = document.getElementById('checkout-total-val');
  if (totalValEl) totalValEl.innerText = formatValue(totalSum);

  openModal('modal-checkout');
}

async function handleCheckout(event) {
  event.preventDefault();

  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const paymentMethod = document.getElementById('checkout-payment').value;

  const totalSum = cart.reduce((sum, item) => {
    const price = activeCurrency === 'VND' ? item.priceVND : item.priceUSD;
    return sum + (price * item.qty);
  }, 0);

  const orderPayload = {
    customer: { name, phone, email, address },
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      qty: item.qty,
      price: activeCurrency === 'VND' ? item.priceVND : item.priceUSD,
      currency: activeCurrency
    })),
    subtotal: totalSum,
    currency: activeCurrency,
    paymentMethod
  };

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    // Show Success Modal
    closeModal('modal-checkout');
    
    document.getElementById('receipt-order-id').innerText = data.id;
    document.getElementById('receipt-total').innerText = formatValue(data.subtotal, data.currency);
    document.getElementById('receipt-payment').innerText = data.paymentMethod;
    document.getElementById('receipt-name').innerText = data.customer.name;

    openModal('modal-order-success');
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    // Reload catalog to reflect new stock levels
    await loadProducts();
    
    // Reset Form
    document.getElementById('checkout-form').reset();
    showToast('Your order has been registered! 🌟', 'success');

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function closeOrderSuccess() {
  closeModal('modal-order-success');
}

// ==========================================
// Track Order Functionalities
// ==========================================
function openTrackOrderModal() {
  document.getElementById('track-order-id-input').value = '';
  document.getElementById('track-order-result').innerHTML = '';
  openModal('modal-track-order');
}

async function handleTrackOrder() {
  const input = document.getElementById('track-order-id-input');
  const orderId = input ? input.value.trim() : '';
  const resultDiv = document.getElementById('track-order-result');
  if (!resultDiv) return;

  if (!orderId) {
    resultDiv.innerHTML = `<div class="error-text">Please enter a valid Order ID.</div>`;
    return;
  }

  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    
    const matched = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if (!matched) {
      resultDiv.innerHTML = `<div class="empty-cart-text">No order found with ID "${orderId}".</div>`;
      return;
    }

    // Render receipt track
    const dateStr = new Date(matched.createdAt).toLocaleString();
    resultDiv.innerHTML = `
      <div class="track-receipt">
        <div class="track-status-header">
          <div>
            <h4 style="font-size:0.95rem; font-weight:700;">Order: ${matched.id}</h4>
            <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
          </div>
          <span class="status-tag ${matched.status.toLowerCase()}">${matched.status}</span>
        </div>
        <div style="font-size:0.82rem; display:flex; flex-direction:column; gap:0.4rem;">
          <p><strong>Customer:</strong> ${escapeHTML(matched.customer.name)} (${matched.customer.phone})</p>
          <p><strong>Address:</strong> ${escapeHTML(matched.customer.address)}</p>
          <p><strong>Payment:</strong> ${matched.paymentMethod}</p>
        </div>
        <div style="border-top:1px dashed var(--border-glass); padding-top:0.75rem; font-size:0.8rem; display:flex; flex-direction:column; gap:0.3rem;">
          ${matched.items.map(item => `
            <div style="display:flex; justify-content:space-between;">
              <span>${item.qty}x ${escapeHTML(item.name)}</span>
              <span>${formatValue(item.price * item.qty, matched.currency)}</span>
            </div>
          `).join('')}
        </div>
        <div style="border-top:1px solid var(--border-glass); padding-top:0.75rem; display:flex; justify-content:space-between; font-weight:700; font-size:0.95rem;">
          <span>Total</span>
          <span style="color:var(--accent-cyan);">${formatValue(matched.subtotal, matched.currency)}</span>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<div class="error-text">Failed to fetch order status.</div>`;
  }
}

// ==========================================
// Formatting & Helpers
// ==========================================
function formatPrice(product) {
  const val = activeCurrency === 'VND' ? product.priceVND : product.priceUSD;
  return formatValue(val, activeCurrency);
}

function formatValue(value, currency = activeCurrency) {
  if (currency === 'VND') {
    return value.toLocaleString('vi-VN') + ' đ';
  } else {
    return '$' + value.toFixed(2);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.remove();
  }, 3000);
}
