// Admin Panel Logic

let products = [];
let orders = [];
let currentTab = 'analytics';

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
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }

  // Load Initial Dashboard Tab
  await switchTab('analytics');
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
    document.getElementById('stat-orders-pending').innerText = `${stats.pendingOrders} Pending`;
    document.getElementById('stat-pending-val').innerText = stats.totalOrders - stats.completedOrders; // active processing
    document.getElementById('stat-completed-val').innerText = stats.completedOrders;

    // Render Popular Products Table
    const popularTbody = document.getElementById('popular-products-tbody');
    if (popularTbody) {
      popularTbody.innerHTML = '';
      if (stats.topProducts.length === 0) {
        popularTbody.innerHTML = `<tr><td colspan="3" class="text-center" style="color:var(--text-muted);">No sales data recorded yet.</td></tr>`;
      } else {
        stats.topProducts.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="font-bold">${escapeHTML(p.name)}</td>
            <td><span class="category-pill">${p.category}</span></td>
            <td class="text-right font-bold">${p.sales} units</td>
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
        { name: 'Fashion', color: 'var(--accent-purple)' },
        { name: 'Tech', color: 'var(--accent-cyan)' },
        { name: 'Flowers', color: 'var(--accent-yellow)' }
      ];

      categories.forEach(cat => {
        const value = sales[cat.name] || 0;
        const percentage = totalSalesSum > 0 ? Math.round((value / totalSalesSum) * 100) : 0;
        
        const div = document.createElement('div');
        div.className = 'bar-stat-item';
        div.innerHTML = `
          <div class="bar-header">
            <span class="dot" style="background-color: ${cat.color}"></span>
            <span class="label">${cat.name}</span>
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
    showToast('Failed to load dashboard metrics', 'danger');
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
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:var(--text-muted); padding:3rem;">No customer orders placed yet.</td></tr>`;
      return;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleString();
      const itemsList = order.items.map(item => `${item.qty}x ${escapeHTML(item.name)}`).join('<br>');
      const totalText = order.currency === 'VND' ? order.subtotal.toLocaleString('vi-VN') + ' đ' : '$' + order.subtotal.toFixed(2);
      
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
        <td>${order.paymentMethod}</td>
        <td>
          <select class="status-select ${order.status.toLowerCase()}" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td style="color:var(--text-muted); font-size:0.75rem;">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    showToast('Failed to load shop orders', 'danger');
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

    showToast(`Order ${orderId} updated to ${newStatus} 📦`, 'success');
    await loadOrders(); // reload
  } catch (err) {
    showToast(err.message, 'danger');
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
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${p.image}" alt="${p.name}" class="table-img"></td>
        <td class="font-bold">${escapeHTML(p.name)}</td>
        <td><span class="category-pill">${p.category}</span></td>
        <td class="font-bold">${p.priceVND.toLocaleString('vi-VN')} đ</td>
        <td class="font-bold">$${p.priceUSD.toFixed(2)}</td>
        <td class="${p.stock <= 5 ? 'text-danger font-bold' : ''}">${p.stock} units</td>
        <td>⭐ ${p.rating.toFixed(1)}</td>
        <td class="text-center">
          <div style="display:flex; justify-content:center; gap:0.25rem;">
            <button class="btn-table-action btn-edit-action" onclick="openProductModal('${p.id}')" title="Edit Item">
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
    showToast('Failed to load products list', 'danger');
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

    modalTitle.innerText = `Edit Product Details`;
    document.getElementById('product-form-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-category').value = p.category;
    document.getElementById('product-stock').value = p.stock;
    document.getElementById('product-price-vnd').value = p.priceVND;
    document.getElementById('product-price-usd').value = p.priceUSD;
    document.getElementById('product-image').value = p.image;
    document.getElementById('product-desc').value = p.description;
  } else {
    modalTitle.innerText = `Create New Product`;
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

    showToast(id ? 'Product details updated successfully!' : 'New product created!', 'success');
    closeModal('modal-product');
    await loadProducts(); // reload
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteProduct(productId) {
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      showToast(`Product deleted successfully`, 'warning');
      await loadProducts(); // reload
    } catch (err) {
      showToast(err.message, 'danger');
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
