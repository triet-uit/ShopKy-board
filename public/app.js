// Storefront Logic

let products = [];
let cart = JSON.parse(localStorage.getItem('aethershop_cart')) || [];
let activeCurrency = localStorage.getItem('aethershop_currency') || 'VND';
let activeLang = localStorage.getItem('shopky_lang') || 'vi';
let activeCategory = 'All';
let searchQuery = '';
let selectedDetailProduct = null;
let currentOrderId = null;
let appliedCoupon = null;
let discountVal = 0;
let settings = {};

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
    cart_subtotal: "Tạm tính",
    cart_shipping: "Phí vận chuyển",
    cart_total: "Tổng thanh toán",
    checkout_shipping: "Phí vận chuyển",
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
    my_orders_title: "Đơn hàng bạn đã mua",
    checkout_coupon_label: "Mã Giảm Giá",
    coupon_placeholder: "Nhập mã (ví dụ: SHOPKY10)",
    btn_apply_coupon: "Áp dụng",
    sort_default: "Sắp xếp: Mặc định",
    sort_price_asc: "Giá: Thấp đến Cao",
    sort_price_desc: "Giá: Cao đến Thấp",
    sort_rating_desc: "Đánh giá: Cao đến Thấp",
    discount_label: "Giảm giá ({code})",
    toast_coupon_applied: "Áp dụng mã giảm giá thành công! 🎉",
    toast_coupon_invalid: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    coupon_msg_valid: "Mã giảm giá \"{code}\" hợp lệ! Đã giảm {amount}.",
    coupon_msg_invalid: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
    
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
    toast_insufficient_stock: "Không thể thêm. Tồn kho còn lại: {stock}",
    login_title: "Đăng Nhập",
    login_subtitle_shop: "Đăng nhập để xem lịch sử đơn hàng và đặt hàng nhanh hơn.",
    label_email: "Email",
    label_password: "Mật khẩu",
    btn_login_submit: "Đăng Nhập",
    no_account_yet: "Chưa có tài khoản?",
    link_register: "Đăng ký ngay",
    register_title: "Đăng Ký Tài Khoản",
    register_subtitle_shop: "Tạo tài khoản mua sắm thông minh của bạn.",
    btn_register_submit: "Đăng Ký",
    already_have_account: "Đã có tài khoản?",
    link_login: "Đăng nhập",
    profile_title: "Hồ Sơ Tài Khoản",
    tab_profile_info: "Thông tin",
    tab_profile_orders: "Lịch sử đơn hàng",
    btn_update_profile: "Cập Nhật Hồ Sơ",
    btn_logout: "Đăng Xuất",
    toast_login_success: "Đăng nhập thành công! Chào mừng {name} 🎉",
    toast_login_fail: "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.",
    toast_register_success: "Đăng ký và đăng nhập thành công! Chào mừng bạn đến với ShopKy 🎉",
    toast_register_fail: "Đăng ký thất bại. Số điện thoại có thể đã được sử dụng.",
    toast_profile_updated: "Cập nhật hồ sơ thành công! 🌟",
    toast_profile_update_fail: "Cập nhật hồ sơ thất bại.",
    toast_logged_out: "Đã đăng xuất khỏi tài khoản.",
    no_orders_yet: "Bạn chưa có đơn hàng nào.",
    label_login_identifier: "Email hoặc Số điện thoại <span style='color: #ef4444;'>*</span>",
    label_password_required: "Mật khẩu <span style='color: #ef4444;'>*</span>",
    register_phone_required: "Số điện thoại <span style='color: #ef4444;'>*</span>",
    register_password_required: "Mật khẩu <span style='color: #ef4444;'>*</span>",
    register_name_required: "Họ và Tên <span style='color: #ef4444;'>*</span>",
    label_email_optional: "Email (Không bắt buộc)",
    register_address_required: "Địa chỉ giao hàng mặc định <span style='color: #ef4444;'>*</span>",
    err_name_invalid: "Họ và tên không hợp lệ. Chỉ chấp nhận chữ cái và khoảng trắng, tối thiểu 2 ký tự.",
    err_email_invalid: "Email không đúng định dạng (ví dụ: example@domain.com).",
    err_phone_invalid: "Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.",
    err_password_invalid: "Mật khẩu dài 8-16 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.",
    err_address_invalid: "Vui lòng nhập địa chỉ cụ thể hơn (tối thiểu 10 ký tự).",
    err_login_identifier_empty: "Vui lòng nhập Email hoặc Số điện thoại.",
    err_login_password_empty: "Vui lòng nhập mật khẩu.",
    toast_checkout_login_required: "Vui lòng đăng nhập hoặc đăng ký tài khoản để tiếp tục thanh toán.",
    err_login_identifier_invalid: "Định dạng Email hoặc Số điện thoại không hợp lệ.",
    placeholder_login_identifier: "Email hoặc Số điện thoại",
    placeholder_password: "Mật khẩu",
    placeholder_phone: "Số điện thoại",
    placeholder_name: "Họ và Tên",
    placeholder_email: "Email",
    placeholder_address: "Địa chỉ giao hàng mặc định",
    link_forgot_password: "Quên mật khẩu?",
    forgot_title: "Đặt Lại Mật Khẩu",
    forgot_subtitle: "Nhập Email hoặc Số điện thoại đã đăng ký để tạo mật khẩu mới.",
    forgot_new_password_required: "Mật khẩu mới <span style='color: #ef4444;'>*</span>",
    placeholder_new_password: "Mật khẩu mới",
    btn_forgot_submit: "Đặt Lại Mật Khẩu",
    toast_forgot_success: "Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập. 🎉",
    toast_forgot_fail: "Đặt lại mật khẩu thất bại. Tài khoản chưa được đăng ký."
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
    cart_shipping: "Shipping Fee",
    cart_total: "Total Payable",
    checkout_shipping: "Shipping Fee",
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
    my_orders_title: "Your Purchased Orders",
    checkout_coupon_label: "Promo Code",
    coupon_placeholder: "Enter code (e.g. SHOPKY10)",
    btn_apply_coupon: "Apply",
    sort_default: "Sort: Default",
    sort_price_asc: "Price: Low to High",
    sort_price_desc: "Price: High to Low",
    sort_rating_desc: "Rating: High to Low",
    discount_label: "Discount ({code})",
    toast_coupon_applied: "Coupon code applied successfully! 🎉",
    toast_coupon_invalid: "Invalid or expired coupon code.",
    coupon_msg_valid: "Coupon \"{code}\" applied! Discounted {amount}.",
    coupon_msg_invalid: "Invalid or expired coupon code.",
    
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
    toast_insufficient_stock: "Cannot add more. Remaining stock: {stock}",
    login_title: "Log In",
    login_subtitle_shop: "Sign in to view your order history and checkout faster.",
    label_email: "Email Address",
    label_password: "Password",
    btn_login_submit: "Log In",
    no_account_yet: "Don't have an account?",
    link_register: "Register now",
    register_title: "Create Account",
    register_subtitle_shop: "Create your premium shopping account.",
    btn_register_submit: "Register",
    already_have_account: "Already have an account?",
    link_login: "Log in",
    profile_title: "Account Profile",
    tab_profile_info: "Information",
    tab_profile_orders: "Order History",
    btn_update_profile: "Update Profile",
    btn_logout: "Log Out",
    toast_login_success: "Login successful! Welcome {name} 🎉",
    toast_login_fail: "Login failed. Please check your credentials.",
    toast_register_success: "Registration & login successful! Welcome to ShopKy 🎉",
    toast_register_fail: "Registration failed. Phone number might already be taken.",
    toast_profile_updated: "Profile updated successfully! 🌟",
    toast_profile_update_fail: "Failed to update profile.",
    toast_logged_out: "Logged out successfully.",
    no_orders_yet: "You don't have any orders yet.",
    label_login_identifier: "Email or Phone Number <span style='color: #ef4444;'>*</span>",
    label_password_required: "Password <span style='color: #ef4444;'>*</span>",
    register_phone_required: "Phone Number <span style='color: #ef4444;'>*</span>",
    register_password_required: "Password <span style='color: #ef4444;'>*</span>",
    register_name_required: "Full Name <span style='color: #ef4444;'>*</span>",
    label_email_optional: "Email (Optional)",
    register_address_required: "Default Shipping Address <span style='color: #ef4444;'>*</span>",
    err_name_invalid: "Invalid name. Letters and spaces only, minimum 2 characters.",
    err_email_invalid: "Invalid email format (e.g. example@domain.com).",
    err_phone_invalid: "Invalid phone number. Must be 10 digits and start with 03, 05, 07, 08, 09.",
    err_password_invalid: "Password must be 8-16 characters, containing at least 1 uppercase, 1 lowercase letter, and 1 number.",
    err_address_invalid: "Address is too short. Please provide a more detailed address (min 10 characters).",
    err_login_identifier_empty: "Please enter your Email or Phone number.",
    err_login_password_empty: "Please enter your password.",
    toast_checkout_login_required: "Please log in or register to proceed to checkout.",
    err_login_identifier_invalid: "Invalid Email or Phone number format.",
    placeholder_login_identifier: "Email or Phone Number",
    placeholder_password: "Password",
    placeholder_phone: "Phone Number",
    placeholder_name: "Full Name",
    placeholder_email: "Email",
    placeholder_address: "Default Shipping Address",
    link_forgot_password: "Forgot password?",
    forgot_title: "Reset Password",
    forgot_subtitle: "Enter your registered Email or Phone number to create a new password.",
    forgot_new_password_required: "New Password <span style='color: #ef4444;'>*</span>",
    placeholder_new_password: "New Password",
    btn_forgot_submit: "Reset Password",
    toast_forgot_success: "Password reset successful! You can now log in. 🎉",
    toast_forgot_fail: "Password reset failed. Account might not be registered."
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
    el.innerHTML = t(key);
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
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to fetch settings');
    settings = await res.json();
    
    // Update shop name dynamically in Header logo
    const logoEl = document.querySelector('.logo h1');
    if (logoEl && settings.shopName) {
      const mainText = settings.shopName.substring(0, settings.shopName.length - 2);
      const accentText = settings.shopName.substring(settings.shopName.length - 2);
      logoEl.innerHTML = `${mainText}<span>${accentText}</span>`;
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Sync UI currency and language switchers
  updateCurrencySwitcherUI();
  await loadSettings();
  applyLanguage(); // This handles language UI as well
  checkAuthStatus(); // Synchronize user authentication UI state
  registerRealtimeValidationListeners(); // Register real-time validation listeners
  
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

  // Check notifications for order statuses
  checkOrderStatusNotifications();
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

  // Sort products
  const sortSelector = document.getElementById('sort-selector');
  const activeSort = sortSelector ? sortSelector.value : 'default';

  if (activeSort === 'price-asc') {
    filtered.sort((a, b) => {
      const priceA = activeCurrency === 'VND' ? a.priceVND : a.priceUSD;
      const priceB = activeCurrency === 'VND' ? b.priceVND : b.priceUSD;
      return priceA - priceB;
    });
  } else if (activeSort === 'price-desc') {
    filtered.sort((a, b) => {
      const priceA = activeCurrency === 'VND' ? a.priceVND : a.priceUSD;
      const priceB = activeCurrency === 'VND' ? b.priceVND : b.priceUSD;
      return priceB - priceA;
    });
  } else if (activeSort === 'rating-desc') {
    filtered.sort((a, b) => b.rating - a.rating);
  }

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

function handleSortChange() {
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

  const shippingFee = activeCurrency === 'USD' ? (settings.shippingFeeUSD || 0) : (settings.shippingFeeVND || 0);
  const cartTotal = totalSum + shippingFee;

  updateSubtotal(totalSum, shippingFee, cartTotal);
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

function updateSubtotal(subtotal, shippingFee = 0, cartTotal = 0) {
  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) {
    subtotalEl.innerText = formatValue(subtotal);
  }
  const shippingValEl = document.getElementById('cart-shipping-val');
  if (shippingValEl) {
    shippingValEl.innerText = shippingFee > 0 ? formatValue(shippingFee) : (activeLang === 'vi' ? 'Miễn phí' : 'Free');
  }
  const totalValEl = document.getElementById('cart-total-val');
  if (totalValEl) {
    totalValEl.innerText = formatValue(cartTotal);
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

  const token = localStorage.getItem('aethershop_token');
  if (!token) {
    openAuthModal();
    showToast(t('toast_checkout_login_required'), 'warning');
    return;
  }

  // Autofill if logged in
  const savedUserJson = localStorage.getItem('aethershop_user');
  if (savedUserJson) {
    try {
      const savedUser = JSON.parse(savedUserJson);
      const inputName = document.getElementById('checkout-name');
      const inputPhone = document.getElementById('checkout-phone');
      const inputEmail = document.getElementById('checkout-email');
      const inputAddress = document.getElementById('checkout-address');
      if (inputName) inputName.value = savedUser.name || '';
      if (inputPhone) inputPhone.value = savedUser.phone || '';
      if (inputEmail) inputEmail.value = savedUser.email || '';
      if (inputAddress) inputAddress.value = savedUser.address || '';
    } catch (e) {
      console.error(e);
    }
  } else {
    const inputName = document.getElementById('checkout-name');
    const inputPhone = document.getElementById('checkout-phone');
    const inputEmail = document.getElementById('checkout-email');
    const inputAddress = document.getElementById('checkout-address');
    if (inputName) inputName.value = '';
    if (inputPhone) inputPhone.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputAddress) inputAddress.value = '';
  }
  
  // Reset coupon state
  appliedCoupon = null;
  discountVal = 0;
  const couponInput = document.getElementById('checkout-coupon-input');
  if (couponInput) couponInput.value = '';
  const couponMsg = document.getElementById('coupon-message');
  if (couponMsg) {
    couponMsg.style.display = 'none';
    couponMsg.innerText = '';
  }
  const discountRow = document.getElementById('checkout-discount-row');
  if (discountRow) discountRow.style.display = 'none';

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

  const shippingFee = activeCurrency === 'USD' ? (settings.shippingFeeUSD || 0) : (settings.shippingFeeVND || 0);
  const finalTotal = totalSum + shippingFee;

  const shippingValEl = document.getElementById('checkout-shipping-val');
  if (shippingValEl) {
    shippingValEl.innerText = shippingFee > 0 ? formatValue(shippingFee) : (activeLang === 'vi' ? 'Miễn phí' : 'Free');
  }

  const totalValEl = document.getElementById('checkout-total-val');
  if (totalValEl) totalValEl.innerText = formatValue(finalTotal);

  openModal('modal-checkout');
}

async function applyCoupon() {
  const couponInput = document.getElementById('checkout-coupon-input');
  const couponMsg = document.getElementById('coupon-message');
  const discountRow = document.getElementById('checkout-discount-row');
  const discountValEl = document.getElementById('checkout-discount-val');
  const totalValEl = document.getElementById('checkout-total-val');
  const labelDiscountApplied = document.getElementById('label-discount-applied');

  if (!couponInput || !couponMsg || !discountRow || !discountValEl || !totalValEl) return;

  const code = couponInput.value.trim();
  if (!code) {
    showToast(t('coupon_msg_invalid'), 'warning');
    return;
  }

  const subtotal = cart.reduce((sum, item) => {
    const price = activeCurrency === 'VND' ? item.priceVND : item.priceUSD;
    return sum + (price * item.qty);
  }, 0);

  try {
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, currency: activeCurrency, subtotal })
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('toast_coupon_invalid'));

    appliedCoupon = data.code;
    discountVal = data.discount;

    // Show discount row
    discountRow.style.display = 'flex';
    if (labelDiscountApplied) {
      labelDiscountApplied.innerText = t('discount_label', { code: data.code });
    }
    discountValEl.innerText = '-' + formatValue(data.discount);

    // Recalculate total payable
    const shippingFee = activeCurrency === 'USD' ? (settings.shippingFeeUSD || 0) : (settings.shippingFeeVND || 0);
    const finalTotal = Math.max(0, subtotal - data.discount) + shippingFee;
    totalValEl.innerText = formatValue(finalTotal);

    // Show success message
    couponMsg.style.display = 'block';
    couponMsg.style.color = '#10b981'; // Green
    couponMsg.innerText = t('coupon_msg_valid', { code: data.code, amount: formatValue(data.discount) });

    showToast(t('toast_coupon_applied'), 'success');
  } catch (err) {
    appliedCoupon = null;
    discountVal = 0;

    // Hide discount row
    discountRow.style.display = 'none';

    // Reset total
    const shippingFee = activeCurrency === 'USD' ? (settings.shippingFeeUSD || 0) : (settings.shippingFeeVND || 0);
    totalValEl.innerText = formatValue(subtotal + shippingFee);

    // Show error message
    couponMsg.style.display = 'block';
    couponMsg.style.color = '#ef4444'; // Red
    couponMsg.innerText = err.message || t('coupon_msg_invalid');

    showToast(err.message || t('toast_coupon_invalid'), 'danger');
  }
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
    couponCode: appliedCoupon,
    currency: activeCurrency,
    paymentMethod
  };

  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('aethershop_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    // Show Success Modal
    closeModal('modal-checkout');
    
    // Auto-update profile info with checkout customer info if logged in but name/address is missing
    if (token) {
      const userJson = localStorage.getItem('aethershop_user');
      if (userJson) {
        try {
          const userObj = JSON.parse(userJson);
          if (!userObj.name || !userObj.address) {
            fetch('/api/user/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: userObj.name || name,
                email: userObj.email || email,
                phone: userObj.phone || phone,
                address: userObj.address || address
              })
            }).then(profileRes => {
              if (profileRes.ok) return profileRes.json();
            }).then(updatedUser => {
              if (updatedUser) {
                localStorage.setItem('aethershop_user', JSON.stringify(updatedUser));
                checkAuthStatus();
              }
            }).catch(err => console.error('Checkout profile auto-sync failed:', err));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    currentOrderId = data.id; // Store order ID globally
    
    document.getElementById('receipt-order-id').innerText = data.id;
    const finalPaid = data.payableAmount !== undefined ? data.payableAmount : data.subtotal;
    const totalPayableWithFee = finalPaid + (data.shippingFee || 0);
    document.getElementById('receipt-total').innerText = formatValue(totalPayableWithFee, data.currency);
    
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
      const amountInVND = data.currency === 'USD' ? Math.round(totalPayableWithFee * 25400) : totalPayableWithFee;
      const qrImg = document.getElementById('payment-qr-img');
      if (qrImg) {
        if (data.paymentMethod === 'Bank Transfer') {
          const bankName = settings.bankName || 'VCB';
          const bankAccount = settings.bankAccount || '0381000579717';
          const bankAccountName = settings.bankAccountName || 'VO DINH TRIET';
          
          const vietQRUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact.png?amount=${amountInVND}&addInfo=${encodeURIComponent(data.id)}&accountName=${encodeURIComponent(bankAccountName)}`;
          qrImg.src = vietQRUrl;
        } else if (data.paymentMethod === 'MoMo') {
          // Use the uploaded static MoMo QR code image
          qrImg.src = '/momo-qr.png';
        }
      }
    }

    openModal('modal-order-success');
    
    // Save order to history
    saveMyOrder(data);
    
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
  if (document.getElementById('track-order-id-input')) {
    document.getElementById('track-order-id-input').value = '';
  }
  if (document.getElementById('track-order-result')) {
    document.getElementById('track-order-result').innerHTML = '';
  }
  renderMyOrdersList();
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
    const res = await fetch('/api/orders/public-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [orderId] })
    });
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    
    const matched = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if (!matched) {
      resultDiv.innerHTML = `<div class="empty-cart-text">${t('order_not_found', { id: orderId })}</div>`;
      return;
    }

    // Sync status in history
    updateMyOrderStatusInHistory(matched.id, matched.status);

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
            <div style="display:flex; justify-content:space-between; gap:0.5rem;">
              <span style="word-break:break-word; flex-grow:1; margin-right:0.5rem;">${item.qty}x ${escapeHTML(item.name)}</span>
              <span style="flex-shrink:0; white-space:nowrap;">${formatValue(item.price * item.qty, matched.currency)}</span>
            </div>
          `).join('')}
        </div>
        ${matched.discountAmount && matched.discountAmount > 0 ? `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#10b981; margin-bottom: 0.25rem;">
          <span>${t('discount_label', { code: matched.couponCode || '' })}</span>
          <span>-${formatValue(matched.discountAmount, matched.currency)}</span>
        </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:var(--text-secondary); margin-bottom: 0.25rem;">
          <span>${t('checkout_shipping')}</span>
          <span>${matched.shippingFee && matched.shippingFee > 0 ? formatValue(matched.shippingFee, matched.currency) : (activeLang === 'vi' ? 'Miễn phí' : 'Free')}</span>
        </div>
        <div style="border-top:1px solid var(--border-glass); padding-top:0.75rem; display:flex; justify-content:space-between; font-weight:700; font-size:0.95rem;">
          <span data-translate="summary_total">${t('summary_total')}</span>
          <span style="color:var(--accent-cyan);">${formatValue((matched.payableAmount !== undefined ? matched.payableAmount : matched.subtotal) + (matched.shippingFee || 0), matched.currency)}</span>
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

// ==========================================
// Customer Order History & Notifications
// ==========================================
function saveMyOrder(order) {
  let myOrders = JSON.parse(localStorage.getItem('shopky_my_orders')) || [];
  const payableAmount = order.payableAmount !== undefined ? order.payableAmount : order.subtotal;
  const totalPayableWithFee = payableAmount + (order.shippingFee || 0);
  const orderSummary = {
    id: order.id,
    subtotal: totalPayableWithFee,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt || new Date().toISOString()
  };
  myOrders.unshift(orderSummary);
  if (myOrders.length > 20) myOrders.pop();
  localStorage.setItem('shopky_my_orders', JSON.stringify(myOrders));
}

function updateMyOrderStatusInHistory(orderId, status) {
  let myOrders = JSON.parse(localStorage.getItem('shopky_my_orders')) || [];
  let matched = myOrders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
  if (matched && matched.status !== status) {
    matched.status = status;
    localStorage.setItem('shopky_my_orders', JSON.stringify(myOrders));
    renderMyOrdersList();
  }
}

function renderMyOrdersList() {
  const section = document.getElementById('my-orders-section');
  const list = document.getElementById('my-orders-list');
  if (!section || !list) return;

  const myOrders = JSON.parse(localStorage.getItem('shopky_my_orders')) || [];
  if (myOrders.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  list.innerHTML = '';

  myOrders.forEach(order => {
    const dateStr = new Date(order.createdAt).toLocaleDateString(activeLang === 'vi' ? 'vi-VN' : 'en-US');
    const totalStr = formatValue(order.subtotal, order.currency);
    
    let statusText = order.status;
    if (activeLang === 'vi') {
      if (order.status === 'Pending') statusText = 'Đang chờ';
      if (order.status === 'Processing') statusText = 'Đang giao';
      if (order.status === 'Completed') statusText = 'Hoàn thành';
      if (order.status === 'Cancelled') statusText = 'Đã hủy';
    }

    const item = document.createElement('div');
    item.className = 'my-order-item';
    item.onclick = () => {
      if (document.getElementById('track-order-id-input')) {
        document.getElementById('track-order-id-input').value = order.id;
        handleTrackOrder();
      }
    };

    item.innerHTML = `
      <div>
        <span class="font-bold" style="font-size:0.82rem; color:var(--accent-cyan);">${order.id}</span>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top: 0.15rem;">${dateStr} - ${totalStr}</div>
      </div>
      <span class="status-tag ${order.status.toLowerCase()}" style="font-size:0.68rem; padding: 0.15rem 0.4rem; border-radius: 4px;">${statusText}</span>
    `;
    list.appendChild(item);
  });
}

async function checkOrderStatusNotifications() {
  let myOrders = JSON.parse(localStorage.getItem('shopky_my_orders')) || [];
  if (myOrders.length === 0) return;

  try {
    const ids = myOrders.map(o => o.id);
    const res = await fetch('/api/orders/public-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) return;
    const allOrders = await res.json();

    let updated = false;
    myOrders.forEach(myOrder => {
      const dbOrder = allOrders.find(o => o.id === myOrder.id);
      if (dbOrder && dbOrder.status !== myOrder.status) {
        let statusText = dbOrder.status;
        if (activeLang === 'vi') {
          if (dbOrder.status === 'Pending') statusText = 'Đang chờ';
          if (dbOrder.status === 'Processing') statusText = 'Đang giao';
          if (dbOrder.status === 'Completed') statusText = 'Hoàn thành';
          if (dbOrder.status === 'Cancelled') statusText = 'Đã hủy';
        }
        
        showToast(
          activeLang === 'vi' 
            ? `Trạng thái đơn hàng "${myOrder.id}" của bạn đã đổi thành: "${statusText}" 📦`
            : `Your order "${myOrder.id}" status has changed to: "${dbOrder.status}" 📦`,
          'info'
        );
        myOrder.status = dbOrder.status;
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem('shopky_my_orders', JSON.stringify(myOrders));
    }
  } catch (err) {
    console.error('Error checking order status notifications:', err);
  }
}

// ==========================================
// User Authentication & Profile Functionalities
// ==========================================

function openAuthModal() {
  const token = localStorage.getItem('aethershop_token');
  if (token) {
    // Already logged in - show profile
    const savedUserJson = localStorage.getItem('aethershop_user');
    if (savedUserJson) {
      try {
        const user = JSON.parse(savedUserJson);
        document.getElementById('profile-email-display').innerText = user.email || user.phone;
        document.getElementById('profile-name-title').innerText = user.name || user.phone;
        
        // Populate inputs
        document.getElementById('profile-name').value = user.name || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-address').value = user.address || '';
      } catch (e) {
        console.error(e);
      }
    }
    clearFormErrors('profile-edit-form');
    document.getElementById('auth-view-login').style.display = 'none';
    document.getElementById('auth-view-register').style.display = 'none';
    document.getElementById('auth-view-forgot').style.display = 'none';
    document.getElementById('auth-view-profile').style.display = 'block';
    switchProfileTab('info');
  } else {
    // Not logged in - show login form
    clearFormErrors('login-form');
    document.getElementById('auth-view-login').style.display = 'block';
    document.getElementById('auth-view-register').style.display = 'none';
    document.getElementById('auth-view-forgot').style.display = 'none';
    document.getElementById('auth-view-profile').style.display = 'none';
  }
  openModal('modal-auth');
}

function switchAuthView(viewName) {
  if (viewName === 'register') {
    clearFormErrors('register-form');
    document.getElementById('auth-view-login').style.display = 'none';
    document.getElementById('auth-view-register').style.display = 'block';
    document.getElementById('auth-view-forgot').style.display = 'none';
  } else if (viewName === 'login') {
    clearFormErrors('login-form');
    document.getElementById('auth-view-login').style.display = 'block';
    document.getElementById('auth-view-register').style.display = 'none';
    document.getElementById('auth-view-forgot').style.display = 'none';
  } else if (viewName === 'forgot') {
    clearFormErrors('forgot-form');
    document.getElementById('auth-view-login').style.display = 'none';
    document.getElementById('auth-view-register').style.display = 'none';
    document.getElementById('auth-view-forgot').style.display = 'block';
  }
}

function switchProfileTab(tabName) {
  const tabInfo = document.getElementById('tab-profile-info');
  const tabOrders = document.getElementById('tab-profile-orders');
  const subtabInfo = document.getElementById('profile-subtab-info');
  const subtabOrders = document.getElementById('profile-subtab-orders');

  if (!tabInfo || !tabOrders || !subtabInfo || !subtabOrders) return;

  if (tabName === 'info') {
    tabInfo.classList.add('active');
    tabOrders.classList.remove('active');
    subtabInfo.style.display = 'flex';
    subtabOrders.style.display = 'none';
  } else if (tabName === 'orders') {
    tabOrders.classList.add('active');
    tabInfo.classList.remove('active');
    subtabInfo.style.display = 'none';
    subtabOrders.style.display = 'block';
    loadUserOrders();
  }
}

async function loadUserOrders() {
  const container = document.getElementById('profile-orders-list');
  if (!container) return;
  
  container.innerHTML = `<div class="empty-cart-text" style="margin-top: 1rem;">Loading orders...</div>`;
  const token = localStorage.getItem('aethershop_token');
  if (!token) return;

  try {
    const res = await fetch('/api/user/orders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to load orders');
    const orders = await res.json();

    container.innerHTML = '';
    if (orders.length === 0) {
      container.innerHTML = `<div class="empty-cart-text" style="margin-top: 1.5rem;" data-translate="no_orders_yet">${t('no_orders_yet')}</div>`;
      return;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleString(activeLang === 'vi' ? 'vi-VN' : 'en-US');
      const itemsSummary = order.items.map(item => `${item.qty}x ${escapeHTML(item.name)}`).join(', ');
      
      const payableAmount = order.payableAmount !== undefined ? order.payableAmount : order.subtotal;
      const totalAmountWithFee = payableAmount + (order.shippingFee || 0);

      // Status badge styling class
      let statusClass = 'pending';
      if (order.status === 'Processing') statusClass = 'processing';
      if (order.status === 'Completed') statusClass = 'completed';
      if (order.status === 'Cancelled') statusClass = 'cancelled';

      // Translate status string for display
      let statusDisplay = order.status;
      if (activeLang === 'vi') {
        if (order.status === 'Pending') statusDisplay = 'Đang Chờ';
        if (order.status === 'Processing') statusDisplay = 'Đang Giao';
        if (order.status === 'Completed') statusDisplay = 'Hoàn Thành';
        if (order.status === 'Cancelled') statusDisplay = 'Đã Hủy';
      }

      const card = document.createElement('div');
      card.className = 'user-order-card';
      card.innerHTML = `
        <div class="user-order-header">
          <span class="user-order-id">${order.id}</span>
          <span class="status-badge ${statusClass}">${statusDisplay}</span>
        </div>
        <div class="user-order-date">${dateStr}</div>
        <div class="user-order-details">
          <span class="user-order-items-summary" title="${escapeHTML(itemsSummary)}">${escapeHTML(itemsSummary)}</span>
          <span class="user-order-total">${formatValue(totalAmountWithFee, order.currency)}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-cart-text" style="color: #ef4444; margin-top: 1.5rem;">${t('failed_fetch_order')}</div>`;
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  clearFormErrors('login-form');

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

  if (!email) {
    showFieldError(emailInput, t('err_login_identifier_empty'));
    isValid = false;
  } else if (!emailRegex.test(email) && !phoneRegex.test(email)) {
    showFieldError(emailInput, t('err_login_identifier_invalid'));
    isValid = false;
  }
  if (!password) {
    showFieldError(passwordInput, t('err_login_password_empty'));
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('aethershop_token', data.token);
    localStorage.setItem('aethershop_user', JSON.stringify(data.user));

    checkAuthStatus();
    closeModal('modal-auth');
    showToast(t('toast_login_success', { name: data.user.name || data.user.phone }), 'success');
    
    document.getElementById('login-form').reset();
  } catch (err) {
    console.error(err);
    showFieldError(passwordInput, err.message || t('toast_login_fail'));
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();
  clearFormErrors('register-form');

  const phoneInput = document.getElementById('register-phone');
  const passwordInput = document.getElementById('register-password');
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;
  
  // Validate phone format
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phone || !phoneRegex.test(phone)) {
    showFieldError(phoneInput, t('err_phone_invalid'));
    isValid = false;
  }

  // Validate password format (8-16 chars, 1 uppercase, 1 lowercase, 1 digit)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;
  if (!passwordRegex.test(password)) {
    showFieldError(passwordInput, t('err_password_invalid'));
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // Tự động đăng nhập sau khi đăng ký thành công
    const loginRes = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: phone, password })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Auto-login failed');

    localStorage.setItem('aethershop_token', loginData.token);
    localStorage.setItem('aethershop_user', JSON.stringify(loginData.user));

    checkAuthStatus();
    closeModal('modal-auth');
    document.getElementById('register-form').reset();
    showToast(t('toast_register_success'), 'success');
  } catch (err) {
    console.error(err);
    showFieldError(phoneInput, err.message || t('toast_register_fail'));
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  clearFormErrors('profile-edit-form');

  const nameInput = document.getElementById('profile-name');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const addressInput = document.getElementById('profile-address');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const token = localStorage.getItem('aethershop_token');

  if (!token) return;

  let isValid = true;

  // Name validation
  const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲÝỴÝỶỸửữựỳýỵỷỹ\s]{2,}$/;
  if (!nameRegex.test(name)) {
    showFieldError(nameInput, t('err_name_invalid'));
    isValid = false;
  }

  // Email validation (optional)
  if (email !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFieldError(emailInput, t('err_email_invalid'));
      isValid = false;
    }
  }

  // Phone validation
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phoneRegex.test(phone)) {
    showFieldError(phoneInput, t('err_phone_invalid'));
    isValid = false;
  }

  // Address validation
  if (address.length < 10) {
    showFieldError(addressInput, t('err_address_invalid'));
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, phone, address })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');

    localStorage.setItem('aethershop_user', JSON.stringify(data));
    checkAuthStatus();
    
    document.getElementById('profile-name-title').innerText = data.name || data.phone;
    if (document.getElementById('profile-email-display')) {
      document.getElementById('profile-email-display').innerText = data.email || data.phone;
    }

    showToast(t('toast_profile_updated'), 'success');
  } catch (err) {
    console.error(err);
    showToast(err.message || t('toast_profile_update_fail'), 'danger');
  }
}

async function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  clearFormErrors('forgot-form');

  const phoneInput = document.getElementById('forgot-phone');
  const passwordInput = document.getElementById('forgot-password');
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;
  
  // Validate email or phone format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  if (!phone || (!emailRegex.test(phone) && !phoneRegex.test(phone))) {
    showFieldError(phoneInput, t('err_login_identifier_invalid'));
    isValid = false;
  }

  // Validate password format
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;
  if (!passwordRegex.test(password)) {
    showFieldError(passwordInput, t('err_password_invalid'));
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: phone, newPassword: password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');

    showToast(t('toast_forgot_success'), 'success');
    
    document.getElementById('forgot-form').reset();
    switchAuthView('login');
    document.getElementById('login-email').value = phone;
  } catch (err) {
    console.error(err);
    showFieldError(phoneInput, err.message || t('toast_forgot_fail'));
  }
}

async function handleLogout() {
  const token = localStorage.getItem('aethershop_token');
  if (token) {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Logout API error:', e);
    }
  }

  localStorage.removeItem('aethershop_token');
  localStorage.removeItem('aethershop_user');

  checkAuthStatus();
  closeModal('modal-auth');
  showToast(t('toast_logged_out'), 'info');
}

function checkAuthStatus() {
  const token = localStorage.getItem('aethershop_token');
  const userJson = localStorage.getItem('aethershop_user');
  const usernameSpan = document.getElementById('header-username');

  if (token && userJson && usernameSpan) {
    try {
      const user = JSON.parse(userJson);
      usernameSpan.innerText = user.name || user.phone;
      usernameSpan.style.display = 'inline-block';
    } catch (e) {
      console.error(e);
      usernameSpan.style.display = 'none';
    }
  } else if (usernameSpan) {
    usernameSpan.style.display = 'none';
    usernameSpan.innerText = '';
  }
}

// ==========================================
// Inline Validation Helper Functions
// ==========================================

function showFieldError(inputElement, errorText) {
  if (!inputElement) return;
  inputElement.style.borderColor = '#ef4444';
  
  const formGroup = inputElement.closest('.form-group');
  if (formGroup) {
    const errorDiv = formGroup.querySelector('.field-error-msg');
    if (errorDiv) {
      errorDiv.innerHTML = errorText;
      errorDiv.style.display = 'block';
    }
  }
}

function clearFieldError(inputElement) {
  if (!inputElement) return;
  inputElement.style.borderColor = '';
  
  const formGroup = inputElement.closest('.form-group');
  if (formGroup) {
    const errorDiv = formGroup.querySelector('.field-error-msg');
    if (errorDiv) {
      errorDiv.innerText = '';
      errorDiv.style.display = 'none';
    }
  }
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('input').forEach(input => {
    clearFieldError(input);
  });
}

function validateField(inputElement) {
  if (!inputElement) return;
  const val = inputElement.value;
  const id = inputElement.id;

  if (id === 'register-phone' || id === 'profile-phone') {
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (val.trim() === '') {
      showFieldError(inputElement, t('err_phone_invalid'));
    } else if (!phoneRegex.test(val.trim())) {
      showFieldError(inputElement, t('err_phone_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'forgot-phone') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    const trimVal = val.trim();
    if (trimVal === '') {
      showFieldError(inputElement, t('err_login_identifier_empty'));
    } else if (!emailRegex.test(trimVal) && !phoneRegex.test(trimVal)) {
      showFieldError(inputElement, t('err_login_identifier_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'register-password' || id === 'forgot-password') {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;
    if (!passwordRegex.test(val)) {
      showFieldError(inputElement, t('err_password_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'profile-name') {
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲÝỴÝỶỸửữựỳýỵỷỹ\s]{2,}$/;
    if (!nameRegex.test(val.trim())) {
      showFieldError(inputElement, t('err_name_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'profile-email') {
    if (val.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val.trim())) {
        showFieldError(inputElement, t('err_email_invalid'));
      } else {
        clearFieldError(inputElement);
      }
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'profile-address') {
    if (val.trim().length < 10) {
      showFieldError(inputElement, t('err_address_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'login-email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    const trimVal = val.trim();
    if (trimVal === '') {
      showFieldError(inputElement, t('err_login_identifier_empty'));
    } else if (!emailRegex.test(trimVal) && !phoneRegex.test(trimVal)) {
      showFieldError(inputElement, t('err_login_identifier_invalid'));
    } else {
      clearFieldError(inputElement);
    }
  } else if (id === 'login-password') {
    if (val === '') {
      showFieldError(inputElement, t('err_login_password_empty'));
    } else {
      clearFieldError(inputElement);
    }
  }
}

function registerRealtimeValidationListeners() {
  const inputs = document.querySelectorAll('#register-form input, #login-form input, #profile-edit-form input, #forgot-form input');
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      validateField(e.target);
    });
    input.addEventListener('blur', (e) => {
      validateField(e.target);
    });
  });
}


