// Storefront Logic

let products = [];
let cart = JSON.parse(localStorage.getItem('aethershop_cart')) || [];
let activeCurrency = localStorage.getItem('aethershop_currency') || 'VND';
let activeLang = localStorage.getItem('shopky_lang') || 'vi';
let activeCategory = 'All';
let searchQuery = '';
let selectedDetailProduct = null;
let currentOrderId = null;

// ==========================================
// Translation Dictionary (i18n)
// ==========================================
const TRANSLATIONS = {
  vi: {
    page_title: "ShopKy - Cửa Hàng Thời Trang, Công Nghệ & Hoa",
    nav_shop: "Cửa hàng",
    nav_track: "Theo dõi đơn hàng",
    nav_admin: "Trang quản trị",
    hero_title: "Mua Sắm Thiết Kế Hiện Đại",
    hero_subtitle: "Khám phá trang phục thời trang, thiết bị công nghệ hiện đại và hoa tươi hoàng hôn tuyệt đẹp.",
    search_placeholder: "Tìm kiếm danh mục sản phẩm, tai nghe, hoa hồng...",
    cat_all: "Tất cả sản phẩm",
    cat_fashion: "Thời trang",
    cat_tech: "Công nghệ",
    cat_flowers: "Hoa tươi",
    footer_text: "© 2026 ShopKy. Thiết kế bằng phong cách kính mờ cao cấp. Bảo lưu mọi quyền.",
    cart_title: "Giỏ hàng của bạn",
    cart_subtotal: "Tổng tiền tạm tính",
    cart_checkout: "Tiến hành thanh toán",
    detail_category: "Danh mục",
    detail_price_label: "Giá bán",
    detail_stock_label: "Tình trạng kho",
    detail_instock: "Còn hàng",
    detail_add_to_cart: "Thêm vào giỏ hàng",
    checkout_title: "Thông tin thanh toán",
    checkout_name: "Họ và tên",
    checkout_name_placeholder: "Nguyễn Văn A",
    checkout_phone: "Số điện thoại",
    checkout_phone_placeholder: "0987654321",
    checkout_email: "Địa chỉ Email (Không bắt buộc)",
    checkout_email_placeholder: "nguyenvana@example.com",
    checkout_address: "Địa chỉ nhận hàng",
    checkout_address_placeholder: "Số 123 Đường, Phường, Quận, Thành phố",
    checkout_payment: "Phương thức thanh toán",
    pay_cod: "Thanh toán khi nhận hàng (COD)",
    pay_bank: "Chuyển khoản ngân hàng (VietQR)",
    pay_momo: "Ví MoMo",
    qr_title_pay: "Hãy quét mã QR bên dưới để thanh toán",
    label_proof_text: "Nội dung lời nhắn chuyển khoản / Mã giao dịch",
    placeholder_proof_text: "Ví dụ: Mã giao dịch hoặc ghi chú...",
    label_proof_file: "Tải lên ảnh chụp màn hình chuyển khoản thành công",
    btn_confirm_paid: "Xác nhận đã thanh toán",
    toast_proof_submitted: "Đã gửi bằng chứng thanh toán thành công! 🌟",
    toast_proof_failed: "Gửi bằng chứng thanh toán thất bại.",
    toast_uploading: "Đang tải ảnh bằng chứng thanh toán...",
    btn_place_order: "Đặt hàng ngay",
    summary_title: "Tóm tắt đơn hàng",
    summary_total: "Tổng số tiền cần trả",
    success_title: "Đặt hàng thành công!",
    success_subtitle: "Cảm ơn bạn đã mua sắm. Đơn hàng của bạn đã được đăng ký vào hệ thống.",
    success_order_id: "Mã đơn hàng",
    success_total_paid: "Tổng tiền",
    success_payment: "Phương thức",
    success_deliver_to: "Giao đến",
    success_continue: "Tiếp tục mua sắm",
    track_title: "Theo dõi trạng thái đơn hàng",
    track_placeholder: "Nhập Mã đơn hàng của bạn (ví dụ: ord-172324...)",
    btn_search: "Tìm kiếm",
    
    // Dynamic JS texts
    empty_cart: "Giỏ hàng của bạn đang trống.",
    insufficient_stock: "Không đủ hàng trong kho! Chỉ còn lại: {stock}",
    out_of_stock: "Hết hàng",
    in_stock_remaining: "Còn hàng (còn {stock})",
    added_to_cart: "Đã thêm {qty} x \"{name}\" vào giỏ hàng 🛒",
    removed_from_cart: "Đã xóa \"{name}\" khỏi giỏ hàng",
    fill_valid_order_id: "Vui lòng nhập Mã đơn hàng hợp lệ.",
    order_not_found: "Không tìm thấy đơn hàng nào với mã \"{id}\".",
    failed_fetch_order: "Lỗi tải trạng thái đơn hàng.",
    failed_load_catalog: "Không thể tải danh sách sản phẩm.",
    toast_switch_theme: "Đã chuyển sang chế độ {theme}",
    toast_order_registered: "Đơn hàng của bạn đã được ghi nhận! 🌟",
    toast_out_of_stock: "Xin lỗi, sản phẩm này hiện đã hết hàng!",
    toast_insufficient_stock: "Không thể thêm. Tồn kho còn lại: {stock}"
  },
  en: {
    page_title: "ShopKy - Premium Fashion, Tech & Flowers",
    nav_shop: "Shop",
    nav_track: "Track Order",
    nav_admin: "Admin Portal",
    hero_title: "Modern Curated Shopping",
    hero_subtitle: "Explore premium fashion wear, state-of-the-art tech gadgets, and fresh sunset flowers.",
    search_placeholder: "Search catalog for jackets, headphones, roses...",
    cat_all: "All Products",
    cat_fashion: "Fashion",
    cat_tech: "Technology",
    cat_flowers: "Flowers",
    footer_text: "© 2026 ShopKy. Made with premium glassmorphic aesthetics. All rights reserved.",
    cart_title: "Shopping Cart",
    cart_subtotal: "Subtotal",
    cart_checkout: "Proceed to Checkout",
    detail_category: "Category",
    detail_price_label: "Price",
    detail_stock_label: "Availability",
    detail_instock: "In Stock",
    detail_add_to_cart: "Add to Cart",
    checkout_title: "Checkout Details",
    checkout_name: "Full Name",
    checkout_name_placeholder: "John Doe",
    checkout_phone: "Phone Number",
    checkout_phone_placeholder: "0987654321",
    checkout_email: "Email Address (Optional)",
    checkout_email_placeholder: "john@example.com",
    checkout_address: "Shipping Address",
    checkout_address_placeholder: "123 Street Name, Ward, District, City",
    pay_cod: "Cash on Delivery (COD)",
    pay_bank: "Bank Transfer (VietQR)",
    pay_momo: "MoMo Wallet",
    qr_title_pay: "Please scan the QR code below to pay",
    label_proof_text: "Transaction Message / Notes (Transaction ID)",
    placeholder_proof_text: "e.g. Transaction ID, transfer note...",
    label_proof_file: "Upload Payment Receipt Screenshot",
    btn_confirm_paid: "Confirm Payment",
    toast_proof_submitted: "Payment proof submitted successfully! 🌟",
    toast_proof_failed: "Failed to submit payment proof.",
    toast_uploading: "Uploading payment screenshot...",
    btn_place_order: "Place Order",
    summary_title: "Order Summary",
    summary_total: "Total Payable",
    success_title: "Order Placed Successfully!",
    success_subtitle: "Thank you for purchasing. Your order has been registered in our system.",
    success_order_id: "Order ID",
    success_total_paid: "Total Paid",
    success_payment: "Payment Method",
    success_deliver_to: "Deliver To",
    success_continue: "Continue Shopping",
    track_title: "Track Order Status",
    track_placeholder: "Enter Order ID (e.g. ord-172324...)",
    btn_search: "Search",
    
    // Dynamic JS texts
    empty_cart: "Your cart is empty.",
    insufficient_stock: "Insufficient stock! Remaining: {stock}",
    out_of_stock: "Out of Stock",
    in_stock_remaining: "In Stock ({stock} remaining)",
    added_to_cart: "Added {qty} x \"{name}\" to cart 🛒",
    removed_from_cart: "Removed \"{name}\" from cart",
    fill_valid_order_id: "Please enter a valid Order ID.",
    order_not_found: "No order found with ID \"{id}\".",
    failed_fetch_order: "Failed to fetch order status.",
    failed_load_catalog: "Failed to load product catalogue.",
    toast_switch_theme: "Switched to {theme} mode",
    toast_order_registered: "Your order has been registered! 🌟",
    toast_out_of_stock: "Sorry, this item is out of stock!",
    toast_insufficient_stock: "Cannot add more. Remaining stock: {stock}"
  }
};

// Helper function to get translation
function t(key, vars = {}) {
  const dictionary = TRANSLATIONS[activeLang] || TRANSLATIONS['en'];
  let text = dictionary[key] || TRANSLATIONS['en'][key] || key;
  
  // Replace variables
  Object.keys(vars).forEach(k => {
    text = text.replace(`{${k}}`, vars[k]);
  });
  return text;
}

// Function to apply translation to all DOM elements
function applyLanguage() {
  // Update document title
  document.title = t('page_title');

  // Translate all tags with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    el.innerText = t(key);
  });

  // Translate all inputs with data-translate-placeholder attribute
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  updateLanguageSwitcherUI();
  renderProducts();
  updateCartUI();
}

function setLanguage(lang) {
  activeLang = lang.toLowerCase();
  localStorage.setItem('shopky_lang', activeLang);
  applyLanguage();
}

function updateLanguageSwitcherUI() {
  const btnVi = document.getElementById('btn-lang-vi');
  const btnEn = document.getElementById('btn-lang-en');
  if (!btnVi || !btnEn) return;

  if (activeLang === 'vi') {
    btnVi.classList.add('active');
    btnEn.classList.remove('active');
  } else {
    btnEn.classList.add('active');
    btnVi.classList.remove('active');
  }
}

// ==========================================
// Initialization & Loading
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Sync UI currency and language switchers
  updateCurrencySwitcherUI();
  applyLanguage(); // This handles language UI as well
  
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
      showToast(t('toast_switch_theme', { theme: newTheme }), 'info');
    });
  }

  // Load products catalog
  await loadProducts();
});

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch catalog');
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error(err);
    showToast(t('failed_load_catalog'), 'danger');
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
    
    // Category Translation display
    let displayedCategory = p.category;
    if (p.category === 'Fashion') displayedCategory = t('cat_fashion');
    if (p.category === 'Tech') displayedCategory = t('cat_tech');
    if (p.category === 'Flowers') displayedCategory = t('cat_flowers');

    const buttonLabel = p.stock <= 0 ? t('out_of_stock') : t('detail_add_to_cart');

    card.innerHTML = `
      <div class="card-image-box" onclick="openProductDetails('${p.id}')">
        <img src="${p.image}" alt="${p.name}">
        <span class="card-category-pill">${displayedCategory}</span>
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
            ${buttonLabel}
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
  if (!btnVnd || !btnUsd) return;

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
    showToast(t('toast_out_of_stock'), 'warning');
    return;
  }

  const existingItem = cart.find(item => item.id === productId);
  const currentCartQty = existingItem ? existingItem.qty : 0;
  
  if (product.stock < (currentCartQty + qty)) {
    showToast(t('toast_insufficient_stock', { stock: product.stock }), 'warning');
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
  showToast(t('added_to_cart', { qty: qty, name: product.name }), 'success');
}

// Ensure local storage changes save
function saveCart() {
  localStorage.setItem('aethershop_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) badge.innerText = totalQty;

  const container = document.getElementById('cart-items-container');
  const checkoutBtn = document.getElementById('btn-checkout-proceed');
  
  if (!container) return;
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = `<div class="empty-cart-text">${t('empty_cart')}</div>`;
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
      <button class="btn-remove-item" onclick="removeCartItem(${index})" title="${t('removed_from_cart', {name: ''})}">
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
    showToast(t('toast_insufficient_stock', { stock: product.stock }), 'warning');
    return;
  }

  item.qty = newQty;
  saveCart();
  updateCartUI();
}

// Remove item logic
function removeCartItem(index) {
  const name = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  showToast(t('removed_from_cart', { name: name }), 'warning');
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
  
  // Category translation display
  let displayedCategory = p.category;
  if (p.category === 'Fashion') displayedCategory = t('cat_fashion');
  if (p.category === 'Tech') displayedCategory = t('cat_tech');
  if (p.category === 'Flowers') displayedCategory = t('cat_flowers');
  document.getElementById('detail-product-category').innerText = displayedCategory;

  document.getElementById('detail-product-name').innerText = p.name;
  document.getElementById('detail-product-rating').innerText = p.rating.toFixed(1);
  document.getElementById('detail-product-desc').innerText = p.description;
  document.getElementById('detail-product-price').innerText = formatPrice(p);

  const stockBadge = document.getElementById('detail-product-stock');
  if (p.stock > 0) {
    stockBadge.innerText = t('in_stock_remaining', { stock: p.stock });
    stockBadge.classList.remove('out-of-stock');
  } else {
    stockBadge.innerText = t('out_of_stock');
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
    showToast(t('toast_insufficient_stock', { stock: selectedDetailProduct.stock }), 'warning');
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
    
    currentOrderId = data.id; // Store order ID globally
    
    document.getElementById('receipt-order-id').innerText = data.id;
    document.getElementById('receipt-total').innerText = formatValue(data.subtotal, data.currency);
    
    // Payment Method display translation
    let displayedPayment = data.paymentMethod;
    if (data.paymentMethod === 'COD') displayedPayment = t('pay_cod');
    if (data.paymentMethod === 'Bank Transfer') displayedPayment = t('pay_bank');
    if (data.paymentMethod === 'MoMo') displayedPayment = t('pay_momo');
    document.getElementById('receipt-payment').innerText = displayedPayment;

    document.getElementById('receipt-name').innerText = data.customer.name;

    // Reset and build payment QR display
    const qrSection = document.getElementById('qr-payment-section');
    const continueBtn = document.getElementById('btn-success-continue');
    
    if (data.paymentMethod === 'COD') {
      if (qrSection) qrSection.style.display = 'none';
      if (continueBtn) continueBtn.style.display = 'block';
    } else {
      if (qrSection) {
        qrSection.style.display = 'block';
        // Reset QR section HTML to original input form
        qrSection.innerHTML = `
          <h3 style="font-size: 1rem; font-weight:700; margin-bottom: 0.5rem; font-family: var(--font-family-title);" data-translate="qr_title_pay">${t('qr_title_pay')}</h3>
          
          <div class="qr-code-box" style="display:flex; justify-content:center; margin-bottom: 1rem;">
            <img id="payment-qr-img" src="" alt="Payment QR" style="max-width: 200px; border-radius: 12px; border: 1px solid var(--border-glass);">
          </div>
          
          <div class="proof-form" style="display:flex; flex-direction:column; gap:0.75rem; text-align: left;">
            <div class="form-group">
              <label style="font-size: 0.8rem; font-weight:600; color: var(--text-secondary);" data-translate="label_proof_text">${t('label_proof_text')}</label>
              <input type="text" id="proof-text-input" value="${data.id}" placeholder="${t('placeholder_proof_text')}" style="width:100%; padding:0.6rem; border-radius:8px; border:1px solid var(--border-glass); background:var(--bg-input); color:var(--text-main);">
            </div>
            
            <div class="form-group">
              <label style="font-size: 0.8rem; font-weight:600; color: var(--text-secondary);" data-translate="label_proof_file">${t('label_proof_file')}</label>
              <input type="file" id="proof-file-input" accept="image/*" style="width:100%; font-size:0.8rem; margin-top:0.25rem;">
            </div>
            
            <button id="btn-submit-proof" class="btn-primary" onclick="submitPaymentProof()" style="width: 100%; padding: 0.65rem;" data-translate="btn_confirm_paid">${t('btn_confirm_paid')}</button>
          </div>
        `;
      }
      if (continueBtn) continueBtn.style.display = 'none';

      // Generate dynamic QR code URL
      const amountInVND = data.currency === 'USD' ? Math.round(data.subtotal * 25400) : data.subtotal;
      const qrImg = document.getElementById('payment-qr-img');
      if (qrImg) {
        if (data.paymentMethod === 'Bank Transfer') {
          // VietQR: Bank ID (VCB), Account No (0381000579717), template (compact), name (VO DINH TRIET)
          const vietQRUrl = `https://img.vietqr.io/image/VCB-0381000579717-compact.png?amount=${amountInVND}&addInfo=${encodeURIComponent(data.id)}&accountName=${encodeURIComponent('VO DINH TRIET')}`;
          qrImg.src = vietQRUrl;
        } else if (data.paymentMethod === 'MoMo') {
          // Use the uploaded static MoMo QR code image
          qrImg.src = '/momo-qr.png';
        }
      }
    }

    openModal('modal-order-success');
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartUI();
    
    // Reload catalog to reflect new stock levels
    await loadProducts();
    
    // Reset Form
    document.getElementById('checkout-form').reset();
    showToast(t('toast_order_registered'), 'success');

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
    resultDiv.innerHTML = `<div class="error-text">${t('fill_valid_order_id')}</div>`;
    return;
  }

  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    
    const matched = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if (!matched) {
      resultDiv.innerHTML = `<div class="empty-cart-text">${t('order_not_found', { id: orderId })}</div>`;
      return;
    }

    // Render receipt track
    const dateStr = new Date(matched.createdAt).toLocaleString(activeLang === 'vi' ? 'vi-VN' : 'en-US');
    
    // Payment Method display translation
    let displayedPayment = matched.paymentMethod;
    if (matched.paymentMethod === 'COD') displayedPayment = t('pay_cod');
    if (matched.paymentMethod === 'Bank Transfer') displayedPayment = t('pay_bank');

    resultDiv.innerHTML = `
      <div class="track-receipt">
        <div class="track-status-header">
          <div>
            <h4 style="font-size:0.95rem; font-weight:700;">${t('success_order_id')}: ${matched.id}</h4>
            <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
          </div>
          <span class="status-tag ${matched.status.toLowerCase()}">${matched.status}</span>
        </div>
        <div style="font-size:0.82rem; display:flex; flex-direction:column; gap:0.4rem;">
          <p><strong>${t('checkout_name')}:</strong> ${escapeHTML(matched.customer.name)} (${matched.customer.phone})</p>
          <p><strong>${t('checkout_address')}:</strong> ${escapeHTML(matched.customer.address)}</p>
          <p><strong>${t('success_payment')}:</strong> ${displayedPayment}</p>
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
          <span data-translate="cart_subtotal">${t('cart_subtotal')}</span>
          <span style="color:var(--accent-cyan);">${formatValue(matched.subtotal, matched.currency)}</span>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<div class="error-text">${t('failed_fetch_order')}</div>`;
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

// ==========================================
// Payment Transfer Proof Submission
// ==========================================
async function submitPaymentProof() {
  if (!currentOrderId) {
    showToast(t('toast_proof_failed'), 'danger');
    return;
  }

  const proofText = document.getElementById('proof-text-input').value.trim();
  const fileInput = document.getElementById('proof-file-input');
  
  const submitBtn = document.getElementById('btn-submit-proof');
  const originalBtnText = submitBtn.innerText;
  
  submitBtn.disabled = true;
  submitBtn.innerText = t('toast_uploading');

  let proofImage = '';

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    
    // Check file size, limit to 2MB to keep db payload compact
    if (file.size > 2 * 1024 * 1024) {
      showToast(activeLang === 'vi' ? 'Dung lượng ảnh phải dưới 2MB' : 'Image size must be under 2MB', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
      return;
    }

    try {
      proofImage = await resizeAndCompressImage(file, 500, 500, 0.45);
    } catch (err) {
      showToast(t('toast_proof_failed'), 'danger');
      submitBtn.disabled = false;
      submitBtn.innerText = originalBtnText;
      return;
    }
  }

  // If both are empty, prevent submission
  if (!proofText && !proofImage) {
    showToast(activeLang === 'vi' ? 'Vui lòng nhập ghi chú hoặc tải lên ảnh chuyển khoản.' : 'Please enter notes or upload transfer photo.', 'warning');
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
    return;
  }

  try {
    const res = await fetch(`/api/orders/${currentOrderId}/payment-proof`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofText, proofImage })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit payment proof');

    showToast(t('toast_proof_submitted'), 'success');
    
    // Hide payment QR form section and show confirmation message
    const qrSection = document.getElementById('qr-payment-section');
    if (qrSection) {
      qrSection.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 0; color: var(--accent-green);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:48px; height:48px; margin-bottom: 0.5rem; display: inline-block;">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <h4 style="font-weight: 700; margin-bottom: 0.25rem;">${activeLang === 'vi' ? 'Đã gửi minh chứng!' : 'Proof Submitted!'}</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary);">${activeLang === 'vi' ? 'Quản trị viên sẽ sớm kiểm tra đơn hàng của bạn.' : 'An administrator will review your order details soon.'}</p>
        </div>
      `;
    }
    
    // Show the "Continue Shopping" button
    const continueBtn = document.getElementById('btn-success-continue');
    if (continueBtn) {
      continueBtn.style.display = 'block';
    }

  } catch (err) {
    showToast(err.message || t('toast_proof_failed'), 'danger');
    submitBtn.disabled = false;
    submitBtn.innerText = originalBtnText;
  }
}

function resizeAndCompressImage(file, maxWidth = 500, maxHeight = 500, quality = 0.45) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate proportions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with compression quality
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

