// Admin Panel Logic

let products = [];
let orders = [];
let currentTab = 'analytics';
let activeLang = localStorage.getItem('shopky_lang') || 'vi';

// ==========================================
// Translation Dictionary (i18n)
// ==========================================
const TRANSLATIONS = {
  vi: {
    page_title: "ShopKydethuong - Trang Quản Trị Admin",
    nav_dashboard: "Bảng điều khiển",
    nav_orders: "Đơn hàng",
    nav_products: "Sản phẩm",
    nav_storefront: "Trang cửa hàng",
    stat_revenue: "Tổng doanh thu",
    stat_orders: "Tổng số đơn",
    stat_pending: "Đơn hàng đang xử lý",
    stat_pending_desc: "Chờ thực hiện giao",
    stat_completed: "Đơn hàng hoàn thành",
    stat_completed_desc: "Giao hàng thành công",
    widget_popular_title: "Sản phẩm bán chạy nhất",
    th_product: "Sản phẩm",
    th_category: "Danh mục",
    th_sales_count: "Số lượng bán",
    widget_cat_sales_title: "Doanh thu theo danh mục",
    orders_title: "Quản lý các đơn hàng",
    th_order_id: "Mã đơn hàng",
    th_customer: "Khách hàng",
    th_contact: "Thông tin liên hệ",
    th_items: "Sản phẩm mua",
    th_total: "Tổng thanh toán",
    th_payment: "Thành toán",
    th_status: "Trạng thái",
    th_date: "Ngày tạo",
    products_title: "Danh mục sản phẩm CRUD",
    btn_add_product: "Thêm sản phẩm mới",
    th_image: "Hình ảnh",
    th_name: "Tên sản phẩm",
    th_price_vnd: "Giá (VNĐ)",
    th_price_usd: "Giá (USD)",
    th_stock: "Tồn kho",
    th_rating: "Đánh giá",
    th_actions: "Hành động",
    footer_text: "© 2026 ShopKydethuong. Trang quản trị trung tâm. Bảo lưu mọi quyền.",
    modal_add_title: "Thêm sản phẩm mới",
    modal_edit_title: "Sửa thông tin sản phẩm",
    modal_prod_name: "Tên sản phẩm",
    modal_prod_category: "Danh mục sản phẩm",
    modal_prod_stock: "Số lượng tồn kho",
    modal_price_vnd: "Giá bán VNĐ (đ)",
    modal_price_usd: "Giá bán USD ($)",
    modal_prod_image: "Đường dẫn URL hình ảnh",
    modal_prod_desc: "Mô tả sản phẩm",
    btn_save_product: "Lưu thông tin sản phẩm",
    cat_fashion: "Thời trang",
    cat_tech: "Công nghệ",
    cat_flowers: "Hoa tươi",
    
    status_pending: "Đang chờ",
    status_processing: "Đang giao",
    status_completed: "Hoàn thành",
    status_cancelled: "Đã hủy",

    // Dynamic js messages
    toast_switch_theme: "Đã chuyển sang chế độ {theme}",
    toast_load_metrics_fail: "Lỗi tải thông số thống kê.",
    toast_load_orders_fail: "Lỗi tải danh sách đơn hàng.",
    toast_load_products_fail: "Lỗi tải danh sách sản phẩm.",
    toast_status_updated: "Đã cập nhật trạng thái đơn {id} sang {status} 📦",
    toast_status_update_fail: "Lỗi cập nhật trạng thái đơn hàng.",
    toast_product_saved: "Đã lưu thông tin sản phẩm thành công! 🌟",
    toast_product_save_fail: "Lỗi lưu thông tin sản phẩm.",
    toast_product_deleted: "Đã xóa sản phẩm thành công",
    toast_product_delete_fail: "Lỗi xóa sản phẩm.",
    confirm_delete: "Bạn có chắc chắn muốn xóa sản phẩm \"{name}\" không?",
    units: "sản phẩm",
    no_sales_data: "Chưa ghi nhận số liệu bán hàng.",
    no_orders_yet: "Chưa có đơn hàng nào từ khách.",
    pending_text: "đang chờ",
    pay_momo: "Ví MoMo",
    btn_view_proof: "Xem minh chứng",
    modal_proof_title: "Chi tiết chuyển khoản",
    modal_proof_note: "Ghi chú khách hàng",
    modal_proof_date: "Thời gian gửi",
    modal_proof_img: "Hình ảnh đối soát",
    modal_proof_empty: "Chưa gửi minh chứng",
    modal_proof_no_img: "Không có ảnh đính kèm"
  },
  en: {
    page_title: "ShopKydethuong - Admin Portal",
    nav_dashboard: "Dashboard",
    nav_orders: "Orders",
    nav_products: "Products",
    nav_storefront: "View Storefront",
    stat_revenue: "Total Revenue",
    stat_orders: "Total Orders",
    stat_pending: "Processing Orders",
    stat_pending_desc: "Awaiting fulfillment",
    stat_completed: "Completed Orders",
    stat_completed_desc: "Shipped successfully",
    widget_popular_title: "Popular Products",
    th_product: "Product",
    th_category: "Category",
    th_sales_count: "Sales Count",
    widget_cat_sales_title: "Sales distribution by Category",
    orders_title: "Manage Shop Orders",
    th_order_id: "Order ID",
    th_customer: "Customer",
    th_contact: "Contact Details",
    th_items: "Items Purchased",
    th_total: "Total Payable",
    th_payment: "Payment",
    th_status: "Status",
    th_date: "Created Date",
    products_title: "Product Catalogue CRUD",
    btn_add_product: "Add New Product",
    th_image: "Image",
    th_name: "Name",
    th_price_vnd: "Price (VND)",
    th_price_usd: "Price (USD)",
    th_stock: "Stock Count",
    th_rating: "Rating",
    th_actions: "Actions",
    footer_text: "© 2026 ShopKydethuong Admin Dashboard. Control center. All rights reserved.",
    modal_add_title: "Create New Product",
    modal_edit_title: "Edit Product Details",
    modal_prod_name: "Product Name",
    modal_prod_category: "Category",
    modal_prod_stock: "Stock Level",
    modal_price_vnd: "Price in VND (đ)",
    modal_price_usd: "Price in USD ($)",
    modal_prod_image: "Image URL",
    modal_prod_desc: "Description",
    btn_save_product: "Save Product",
    cat_fashion: "Fashion",
    cat_tech: "Technology",
    cat_flowers: "Flowers",
    
    status_pending: "Pending",
    status_processing: "Processing",
    status_completed: "Completed",
    status_cancelled: "Cancelled",

    toast_switch_theme: "Switched to {theme} mode",
    toast_load_metrics_fail: "Failed to load dashboard metrics",
    toast_load_orders_fail: "Failed to load shop orders",
    toast_load_products_fail: "Failed to load products list",
    toast_status_updated: "Order {id} updated to {status} 📦",
    toast_status_update_fail: "Failed to update order status",
    toast_product_saved: "Product details saved successfully! 🌟",
    toast_product_save_fail: "Failed to save product details",
    toast_product_deleted: "Product deleted successfully",
    toast_product_delete_fail: "Failed to delete product",
    confirm_delete: "Are you sure you want to delete \"{name}\"?",
    units: "units",
    no_sales_data: "No sales data recorded yet.",
    no_orders_yet: "No customer orders placed yet.",
    pending_text: "Pending",
    pay_momo: "MoMo Wallet",
    btn_view_proof: "View Proof",
    modal_proof_title: "Payment Proof Details",
    modal_proof_note: "Customer Notes",
    modal_proof_date: "Submitted At",
    modal_proof_img: "Transaction Screenshot",
    modal_proof_empty: "No proof submitted yet",
    modal_proof_no_img: "No screenshot uploaded"
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

  // Reload current tab content with new translations
  if (currentTab === 'analytics') {
    loadAnalytics();
  } else if (currentTab === 'orders') {
    loadOrders();
  } else if (currentTab === 'products') {
    loadProducts();
  }
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

  // Load Initial Dashboard Tab
  applyLanguage();
});

// ==========================================
// Navigation & Tab Switcher
// ==========================================
async function switchTab(tabName) {
  currentTab = tabName;

  // Toggle active tab link style
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    const onclickStr = link.getAttribute('onclick') || '';
    if (onclickStr.includes(tabName)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle visible tab contents
  document.querySelectorAll('.admin-tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const activeTabDiv = document.getElementById(`tab-${tabName}`);
  if (activeTabDiv) activeTabDiv.classList.add('active');

  // Load relevant data based on active tab
  if (tabName === 'analytics') {
    await loadAnalytics();
  } else if (tabName === 'orders') {
    await loadOrders();
  } else if (tabName === 'products') {
    await loadProducts();
  }
}

// ==========================================
// TAB 1: Analytics & Reports
// ==========================================
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const stats = await res.json();

    // Render Stats Cards
    document.querySelector('#stat-revenue .stat-value').innerText = stats.totalRevenueVND.toLocaleString('vi-VN') + ' đ';
    document.querySelector('#stat-revenue #stat-revenue-usd').innerText = `$${(stats.totalRevenueVND / 25400).toFixed(2)} USD`;
    document.getElementById('stat-orders-val').innerText = stats.totalOrders;
    document.getElementById('stat-orders-pending').innerText = `${stats.pendingOrders} ${t('pending_text')}`;
    document.getElementById('stat-pending-val').innerText = stats.totalOrders - stats.completedOrders; // active processing
    document.getElementById('stat-completed-val').innerText = stats.completedOrders;

    // Render Popular Products Table
    const popularTbody = document.getElementById('popular-products-tbody');
    if (popularTbody) {
      popularTbody.innerHTML = '';
      if (stats.topProducts.length === 0) {
        popularTbody.innerHTML = `<tr><td colspan="3" class="text-center" style="color:var(--text-muted);">${t('no_sales_data')}</td></tr>`;
      } else {
        stats.topProducts.forEach(p => {
          // Category translation display
          let displayedCategory = p.category;
          if (p.category === 'Fashion') displayedCategory = t('cat_fashion');
          if (p.category === 'Tech') displayedCategory = t('cat_tech');
          if (p.category === 'Flowers') displayedCategory = t('cat_flowers');

          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="font-bold">${escapeHTML(p.name)}</td>
            <td><span class="category-pill">${displayedCategory}</span></td>
            <td class="text-right font-bold">${p.sales} ${t('units')}</td>
          `;
          popularTbody.appendChild(tr);
        });
      }
    }

    // Render Sales Distribution by Category
    const categorySalesList = document.getElementById('category-sales-list');
    if (categorySalesList) {
      categorySalesList.innerHTML = '';
      
      const sales = stats.salesByCategory;
      const totalSalesSum = Object.values(sales).reduce((sum, val) => sum + val, 0);

      const categories = [
        { name: 'Fashion', color: 'var(--accent-purple)', label: t('cat_fashion') },
        { name: 'Tech', color: 'var(--accent-cyan)', label: t('cat_tech') },
        { name: 'Flowers', color: 'var(--accent-yellow)', label: t('cat_flowers') }
      ];

      categories.forEach(cat => {
        const value = sales[cat.name] || 0;
        const percentage = totalSalesSum > 0 ? Math.round((value / totalSalesSum) * 100) : 0;
        
        const div = document.createElement('div');
        div.className = 'bar-stat-item';
        div.innerHTML = `
          <div class="bar-header">
            <span class="dot" style="background-color: ${cat.color}"></span>
            <span class="label">${cat.label}</span>
            <span class="val">${value.toLocaleString('vi-VN')} đ (${percentage}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percentage}%; background-color: ${cat.color}"></div>
          </div>
        `;
        categorySalesList.appendChild(div);
      });
    }

  } catch (err) {
    console.error(err);
    showToast(t('toast_load_metrics_fail'), 'danger');
  }
}

// ==========================================
// TAB 2: Orders Management
// ==========================================
async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    orders = await res.json();

    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--text-muted); padding:3rem;">${t('no_orders_yet')}</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleString(activeLang === 'vi' ? 'vi-VN' : 'en-US');
      const itemsList = order.items.map(item => `${item.qty}x ${escapeHTML(item.name)}`).join('<br>');
      const totalText = order.currency === 'VND' ? order.subtotal.toLocaleString('vi-VN') + ' đ' : '$' + order.subtotal.toFixed(2);
      
      // Payment Method display translation
      let displayedPayment = order.paymentMethod;
      if (order.paymentMethod === 'COD') displayedPayment = t('pay_cod');
      if (order.paymentMethod === 'Bank Transfer') displayedPayment = t('pay_bank');
      if (order.paymentMethod === 'MoMo') displayedPayment = t('pay_momo');

      let proofHtml = '';
      if (order.paymentMethod !== 'COD') {
        if (order.paymentProof) {
          proofHtml = `
            <div style="margin-top: 0.35rem;">
              <button class="btn-view-proof" onclick="viewPaymentProof('${order.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span style="vertical-align: middle;">${t('btn_view_proof')}</span>
              </button>
            </div>
          `;
        } else {
          proofHtml = `
            <div style="margin-top: 0.35rem; font-size: 0.7rem; color: var(--text-muted); font-style: italic;">
              ${t('modal_proof_empty')}
            </div>
          `;
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-bold" style="color:var(--accent-cyan);">${order.id}</td>
        <td>
          <div class="font-bold">${escapeHTML(order.customer.name)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(order.customer.email)}</div>
        </td>
        <td>
          <div>${order.customer.phone}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(order.customer.address)}">${escapeHTML(order.customer.address)}</div>
        </td>
        <td style="font-size:0.78rem; line-height:1.4;">${itemsList}</td>
        <td class="font-bold">${totalText}</td>
        <td>
          <div>${displayedPayment}</div>
          ${proofHtml}
        </td>
        <td>
          <select class="status-select ${order.status.toLowerCase()}" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>${t('status_pending')}</option>
            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>${t('status_processing')}</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>${t('status_completed')}</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>${t('status_cancelled')}</option>
          </select>
        </td>
        <td style="color:var(--text-muted); font-size:0.75rem;">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    showToast(t('toast_load_orders_fail'), 'danger');
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');

    // Translate displayed status for toast
    let statusLabel = newStatus;
    if (newStatus === 'Pending') statusLabel = t('status_pending');
    if (newStatus === 'Processing') statusLabel = t('status_processing');
    if (newStatus === 'Completed') statusLabel = t('status_completed');
    if (newStatus === 'Cancelled') statusLabel = t('status_cancelled');

    showToast(t('toast_status_updated', { id: orderId, status: statusLabel }), 'success');
    await loadOrders(); // reload
  } catch (err) {
    showToast(t('toast_status_update_fail'), 'danger');
  }
}

// ==========================================
// TAB 3: Product catalogue CRUD
// ==========================================
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    products = await res.json();

    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
      // Category translation display
      let displayedCategory = p.category;
      if (p.category === 'Fashion') displayedCategory = t('cat_fashion');
      if (p.category === 'Tech') displayedCategory = t('cat_tech');
      if (p.category === 'Flowers') displayedCategory = t('cat_flowers');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${p.image}" alt="${p.name}" class="table-img"></td>
        <td class="font-bold">${escapeHTML(p.name)}</td>
        <td><span class="category-pill">${displayedCategory}</span></td>
        <td class="font-bold">${p.priceVND.toLocaleString('vi-VN')} đ</td>
        <td class="font-bold">$${p.priceUSD.toFixed(2)}</td>
        <td class="${p.stock <= 5 ? 'text-danger font-bold' : ''}">${p.stock} ${t('units')}</td>
        <td>⭐ ${p.rating.toFixed(1)}</td>
        <td class="text-center">
          <div style="display:flex; justify-content:center; gap:0.25rem;">
            <button class="btn-table-action btn-edit-action" onclick="openProductModal('${p.id}')" title="${t('modal_edit_title')}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button class="btn-table-action btn-delete-action" onclick="deleteProduct('${p.id}')" title="Delete Item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    showToast(t('toast_load_products_fail'), 'danger');
  }
}

// Open Form Modal (Add / Edit)
function openProductModal(productId = null) {
  const modalTitle = document.getElementById('product-modal-title');
  const form = document.getElementById('product-form');
  
  form.reset();
  document.getElementById('product-form-id').value = '';

  if (productId) {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    modalTitle.innerText = t('modal_edit_title');
    document.getElementById('product-form-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-category').value = p.category;
    document.getElementById('product-stock').value = p.stock;
    document.getElementById('product-price-vnd').value = p.priceVND;
    document.getElementById('product-price-usd').value = p.priceUSD;
    document.getElementById('product-image').value = p.image;
    document.getElementById('product-desc').value = p.description;
  } else {
    modalTitle.innerText = t('modal_add_title');
  }

  const modal = document.getElementById('modal-product');
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

async function handleSaveProduct(event) {
  event.preventDefault();

  const id = document.getElementById('product-form-id').value;
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value;
  const stock = parseInt(document.getElementById('product-stock').value) || 0;
  const priceVND = parseFloat(document.getElementById('product-price-vnd').value) || 0;
  const priceUSD = parseFloat(document.getElementById('product-price-usd').value) || 0;
  const image = document.getElementById('product-image').value.trim();
  const description = document.getElementById('product-desc').value.trim();

  const payload = { name, category, stock, priceVND, priceUSD, image, description };

  const url = id ? `/api/products/${id}` : `/api/products`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save product details');

    showToast(t('toast_product_saved'), 'success');
    closeModal('modal-product');
    await loadProducts(); // reload
  } catch (err) {
    showToast(t('toast_product_save_fail'), 'danger');
  }
}

async function deleteProduct(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  if (confirm(t('confirm_delete', { name: p.name }))) {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      showToast(t('toast_product_deleted'), 'warning');
      await loadProducts(); // reload
    } catch (err) {
      showToast(t('toast_product_delete_fail'), 'danger');
    }
  }
}

// ==========================================
// Formatting & Helpers
// ==========================================
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
// View Payment Proof Details Modal
// ==========================================
function viewPaymentProof(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order || !order.paymentProof) {
    showToast(t('modal_proof_empty'), 'warning');
    return;
  }

  const proof = order.paymentProof;
  const noteEl = document.getElementById('proof-modal-note');
  const imgEl = document.getElementById('proof-modal-img');
  const dateEl = document.getElementById('proof-modal-date');
  const idEl = document.getElementById('proof-modal-order-id');

  if (idEl) idEl.innerText = order.id;
  if (noteEl) noteEl.innerText = proof.text || (activeLang === 'vi' ? '(Không có ghi chú)' : '(No notes)');
  if (dateEl) {
    const proofDate = new Date(proof.submittedAt).toLocaleString(activeLang === 'vi' ? 'vi-VN' : 'en-US');
    dateEl.innerText = proofDate;
  }

  if (imgEl) {
    if (proof.image) {
      imgEl.src = proof.image;
      imgEl.style.display = 'block';
      const noImgEl = document.getElementById('proof-modal-no-img');
      if (noImgEl) noImgEl.style.display = 'none';
    } else {
      imgEl.style.display = 'none';
      const noImgEl = document.getElementById('proof-modal-no-img');
      if (noImgEl) noImgEl.style.display = 'block';
    }
  }

  const modal = document.getElementById('modal-payment-proof');
  if (modal) modal.classList.add('open');
}

