/**
 * AetherShop - Premium Node.js E-Commerce Server
 * Serves static shop files and provides REST APIs for catalog, checkout, orders, and admin analytics.
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8090;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-memory Session Manager
const SESSIONS = {}; // key: token, value: { userId, email, expiresAt }

// MIME types mapping
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Database helper functions
function readDb(callback) {
  if (process.env.JSONBIN_KEY && process.env.JSONBIN_BIN_ID) {
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${process.env.JSONBIN_BIN_ID}/latest`,
      method: 'GET',
      headers: {
        'X-Master-Key': process.env.JSONBIN_KEY,
        'X-Bin-Meta': 'false'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          callback(new Error(`JSONBin error status ${res.statusCode}: ${data}`), null);
        } else {
          try {
            callback(null, JSON.parse(data));
          } catch (parseErr) {
            callback(parseErr, null);
          }
        }
      });
    });
    req.on('error', err => callback(err, null));
    req.end();
  } else {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        console.error('Failed to read database:', err);
        callback(err, null);
      } else {
        try {
          callback(null, JSON.parse(data));
        } catch (parseErr) {
          callback(parseErr, null);
        }
      }
    });
  }
}

function writeDb(data, callback) {
  const body = JSON.stringify(data, null, 2);
  if (process.env.JSONBIN_KEY && process.env.JSONBIN_BIN_ID) {
    const options = {
      hostname: 'api.jsonbin.io',
      path: `/v3/b/${process.env.JSONBIN_BIN_ID}`,
      method: 'PUT',
      headers: {
        'X-Master-Key': process.env.JSONBIN_KEY,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          callback(new Error(`JSONBin error status ${res.statusCode}: ${responseData}`));
        } else {
          callback(null);
        }
      });
    });
    req.on('error', err => callback(err));
    req.write(body);
    req.end();
  } else {
    fs.writeFile(DATA_FILE, body, 'utf8', (err) => {
      if (err) {
        console.error('Failed to write database:', err);
        callback(err);
      } else {
        callback(null);
      }
    });
  }
}

function checkAdminAuth(req) {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const clientPass = req.headers['x-admin-password'];
  return clientPass === adminPassword;
}

function getAuthUser(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = SESSIONS[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete SESSIONS[token];
    return null;
  }
  return session;
}

function sendTelegramNotification(settings, order) {
  if (!settings.telegramToken || !settings.telegramChatId) return;

  const orderId = order.id;
  const customer = order.customer;
  const itemsText = order.items.map(item => `- ${item.qty}x ${item.name} (${item.price.toLocaleString('vi-VN')} ${item.currency})`).join('\n');
  const discountText = order.discountAmount ? `\nGiảm giá: -${order.discountAmount.toLocaleString('vi-VN')} ${order.currency} (Mã: ${order.couponCode})` : '';
  const payableAmount = order.payableAmount !== undefined ? order.payableAmount : order.subtotal;
  const shippingFee = order.shippingFee || 0;
  const totalAmount = payableAmount + shippingFee;

  const paymentText = order.paymentMethod;
  const dateStr = new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  const message = `🔔 *ĐƠN HÀNG MỚI TỪ SHOPKY*\n` +
                  `-------------------------------\n` +
                  `*Mã đơn:* \`${orderId}\`\n` +
                  `*Thời gian:* ${dateStr}\n\n` +
                  `*Khách hàng:*\n` +
                  `- Tên: ${customer.name}\n` +
                  `- SĐT: ${customer.phone}\n` +
                  `- Địa chỉ: ${customer.address}\n` +
                  `- Email: ${customer.email || 'N/A'}\n\n` +
                  `*Sản phẩm:*\n${itemsText}\n` +
                  `${discountText}\n` +
                  `*Phí vận chuyển:* ${shippingFee ? shippingFee.toLocaleString('vi-VN') + ' ' + order.currency : 'Miễn phí'}\n` +
                  `*Tổng thanh toán:* ${totalAmount.toLocaleString('vi-VN')} ${order.currency}\n` +
                  `*Hình thức:* ${paymentText}`;

  const postData = JSON.stringify({
    chat_id: settings.telegramChatId,
    text: message,
    parse_mode: 'Markdown'
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${settings.telegramToken}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`Telegram notification failed: status ${res.statusCode}, data ${data}`);
      } else {
        console.log(`Telegram notification sent successfully for order ${orderId}`);
      }
    });
  });

  req.on('error', err => {
    console.error('Telegram request error:', err);
  });

  req.write(postData);
  req.end();
}

// Server request handler
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // URL parsing
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // ==========================================
  // REST API Endpoints
  // ==========================================

  // 1. GET /api/products
  if (req.method === 'GET' && pathname === '/api/products') {
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.products));
      }
    });
    return;
  }

  // 2. POST /api/products (Admin - Add Product)
  if (req.method === 'POST' && pathname === '/api/products') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const newProduct = JSON.parse(body);
        newProduct.id = 'prod-' + Date.now();
        newProduct.rating = 5.0; // default rating for new products
        
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          db.products.push(newProduct);
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(newProduct));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 3. PUT /api/products/:id (Admin - Edit Product)
  if (req.method === 'PUT' && pathname.startsWith('/api/products/')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const id = pathname.substring('/api/products/'.length);
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const updatedFields = JSON.parse(body);
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const index = db.products.findIndex(p => p.id === id);
          if (index === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Product not found' }));
            return;
          }
          db.products[index] = { ...db.products[index], ...updatedFields, id }; // retain id
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(db.products[index]));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 4. DELETE /api/products/:id (Admin - Delete Product)
  if (req.method === 'DELETE' && pathname.startsWith('/api/products/')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const id = pathname.substring('/api/products/'.length);
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      const initialLength = db.products.length;
      db.products = db.products.filter(p => p.id !== id);
      if (db.products.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Product not found' }));
        return;
      }
      writeDb(db, (writeErr) => {
        if (writeErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database write failed' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      });
    });
    return;
  }

  // 5. POST /api/checkout (Process Purchase & Stock Deduct)
  if (req.method === 'POST' && pathname === '/api/checkout') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const orderPayload = JSON.parse(body); // { customer: {...}, items: [{id, qty, currency, price}], currency, paymentMethod, subtotal, couponCode }
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }

          // Validate and deduct stock
          const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          for (const item of orderPayload.items) {
            const product = db.products.find(p => p.id === item.id);
            if (!product) {
              console.warn(`[ORDER] Failed: Product "${item.name}" not found. IP: ${clientIp}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Product ${item.name} not found` }));
              return;
            }
            if (product.stock < item.qty) {
              console.warn(`[ORDER] Failed: Insufficient stock for "${item.name}". Requested: ${item.qty}, Remaining: ${product.stock}. IP: ${clientIp}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Insufficient stock for ${item.name}. Remaining: ${product.stock}` }));
              return;
            }
            product.stock -= item.qty; // deduct stock
          }

          // Server-side coupon verification
          let discountAmount = 0;
          let appliedCoupon = null;
          if (orderPayload.couponCode) {
            const coupons = db.coupons || [];
            const coupon = coupons.find(c => c.code.toUpperCase() === orderPayload.couponCode.toUpperCase() && c.active);
            if (coupon) {
              appliedCoupon = coupon.code;
              if (coupon.type === 'percentage') {
                discountAmount = orderPayload.subtotal * (coupon.value / 100);
              } else if (coupon.type === 'fixed') {
                if (orderPayload.currency === 'USD') {
                  if (coupon.code === 'GIAM20K') {
                    discountAmount = 1;
                  } else {
                    const rate = db.settings.exchangeRate || 25400;
                    discountAmount = Math.round((coupon.value / rate) * 100) / 100;
                  }
                } else {
                  discountAmount = coupon.value;
                }
              }
              discountAmount = Math.min(discountAmount, orderPayload.subtotal);
            }
          }
          const payableAmount = orderPayload.subtotal - discountAmount;

          const shippingFee = orderPayload.currency === 'USD' ? (db.settings.shippingFeeUSD || 0) : (db.settings.shippingFeeVND || 0);

          const session = getAuthUser(req);
          if (!session) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Vui lòng đăng nhập để tiến hành thanh toán' }));
            return;
          }

          const newOrder = {
            id: 'ord-' + Date.now(),
            userId: session ? session.userId : undefined,
            customer: orderPayload.customer,
            items: orderPayload.items,
            subtotal: orderPayload.subtotal,
            discountAmount: discountAmount,
            couponCode: appliedCoupon,
            payableAmount: payableAmount,
            shippingFee: shippingFee,
            currency: orderPayload.currency,
            paymentMethod: orderPayload.paymentMethod,
            status: 'Pending',
            createdAt: new Date().toISOString()
          };

          db.orders.unshift(newOrder);

          writeDb(db, (writeErr) => {
            if (writeErr) {
              console.error(`[ORDER] Error: Failed to write database for order "${newOrder.id}".`, writeErr);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              console.log(`[ORDER] Success: New order "${newOrder.id}" placed by "${newOrder.customer.name}" (${newOrder.customer.phone}) from IP ${clientIp} at ${new Date().toLocaleString('vi-VN', {timeZone: 'Asia/Ho_Chi_Minh'})}. Total: ${newOrder.subtotal} ${newOrder.currency}.`);
              // Send Telegram notification async
              sendTelegramNotification(db.settings, newOrder);
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(newOrder));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.5. POST /api/admin/login (Admin Password authentication check)
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        if (password === adminPassword) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mật khẩu không chính xác' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.6. POST /api/validate-coupon (Coupon Code verification check)
  if (req.method === 'POST' && pathname === '/api/validate-coupon') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { code, currency, subtotal } = JSON.parse(body);
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mã giảm giá không được để trống' }));
          return;
        }
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const coupons = db.coupons || [];
          const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
          if (!coupon) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' }));
            return;
          }
          
          let discount = 0;
          if (coupon.type === 'percentage') {
            discount = subtotal * (coupon.value / 100);
          } else if (coupon.type === 'fixed') {
            if (currency === 'USD') {
              if (coupon.code === 'GIAM20K') {
                discount = 1; // $1 USD
              } else {
                const rate = db.settings.exchangeRate || 25400;
                discount = Math.round((coupon.value / rate) * 100) / 100;
              }
            } else {
              discount = coupon.value;
            }
          }
          discount = Math.min(discount, subtotal);
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            valid: true,
            code: coupon.code,
            discount: discount,
            type: coupon.type,
            value: coupon.value
          }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.7. GET /api/settings (Storefront general settings)
  if (req.method === 'GET' && pathname === '/api/settings') {
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
      } else {
        const publicSettings = { ...db.settings };
        delete publicSettings.telegramToken;
        delete publicSettings.telegramChatId;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(publicSettings));
      }
    });
    return;
  }

  // 5.8. GET /api/admin/settings (Admin complete settings view)
  if (req.method === 'GET' && pathname === '/api/admin/settings') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.settings));
      }
    });
    return;
  }

  // 5.9. PUT /api/admin/settings (Admin update settings)
  if (req.method === 'PUT' && pathname === '/api/admin/settings') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const newSettings = JSON.parse(body);
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          db.settings = { ...db.settings, ...newSettings };
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(db.settings));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.10. GET /api/admin/coupons (Admin list all coupons)
  if (req.method === 'GET' && pathname === '/api/admin/coupons') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.coupons || []));
      }
    });
    return;
  }

  // 5.11. POST /api/admin/coupons (Admin create a coupon)
  if (req.method === 'POST' && pathname === '/api/admin/coupons') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const newCoupon = JSON.parse(body);
        if (!newCoupon.code || !newCoupon.type || newCoupon.value === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing code, type or value' }));
          return;
        }
        newCoupon.code = newCoupon.code.toUpperCase();
        newCoupon.active = newCoupon.active !== undefined ? newCoupon.active : true;

        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          if (!db.coupons) db.coupons = [];
          if (db.coupons.find(c => c.code === newCoupon.code)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Coupon code already exists' }));
            return;
          }
          db.coupons.push(newCoupon);
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(newCoupon));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.12. PUT /api/admin/coupons/:code (Admin edit coupon)
  if (req.method === 'PUT' && pathname.startsWith('/api/admin/coupons/')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const code = pathname.substring('/api/admin/coupons/'.length).toUpperCase();
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const updatedFields = JSON.parse(body);
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const index = db.coupons.findIndex(c => c.code === code);
          if (index === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Coupon not found' }));
            return;
          }
          db.coupons[index] = { ...db.coupons[index], ...updatedFields, code };
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(db.coupons[index]));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.13. DELETE /api/admin/coupons/:code (Admin delete coupon)
  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/coupons/')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const code = pathname.substring('/api/admin/coupons/'.length).toUpperCase();
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      const initialLength = db.coupons.length;
      db.coupons = db.coupons.filter(c => c.code !== code);
      if (db.coupons.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Coupon not found' }));
        return;
      }
      writeDb(db, (writeErr) => {
        if (writeErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database write failed' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      });
    });
    return;
  }

  // 5.14. GET /api/admin/users (Admin view all registered users)
  if (req.method === 'GET' && pathname === '/api/admin/users') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      const users = db.users || [];
      // Strip passwords for safety
      const safeUsers = users.map(u => {
        const publicUser = { ...u };
        delete publicUser.password;
        return publicUser;
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(safeUsers));
    });
    return;
  }

  // 5.15. DELETE /api/admin/users/:id (Admin delete registered user)
  if (req.method === 'DELETE' && pathname.startsWith('/api/admin/users/')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const userId = pathname.substring('/api/admin/users/'.length);
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      if (!db.users) db.users = [];
      const initialLength = db.users.length;
      db.users = db.users.filter(u => u.id !== userId);
      if (db.users.length === initialLength) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      writeDb(db, (writeErr) => {
        if (writeErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Database write failed' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      });
    });
    return;
  }

  // 5.80. POST /api/register (User Registration - Shopee Style)
  if (req.method === 'POST' && pathname === '/api/register') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { phone, password } = JSON.parse(body);
        if (!phone || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Vui lòng nhập đầy đủ Số điện thoại và Mật khẩu' }));
          return;
        }

        // Validate Phone (VN mobile format: 10 digits, starts with 03/05/07/08/09)
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.' }));
          return;
        }

        // Validate Password (8-16 chars, 1 uppercase, 1 lowercase, 1 digit)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;
        if (!passwordRegex.test(password)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mật khẩu dài 8-16 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' }));
          return;
        }

        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          if (!db.users) db.users = [];

          const existingUser = db.users.find(u => u.phone === phone);
          if (existingUser) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Số điện thoại này đã được đăng ký bởi tài khoản khác' }));
            return;
          }

          const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
          const newUser = {
            id: 'user-' + Date.now(),
            name: '',
            email: '',
            password: passwordHash,
            phone,
            address: '',
            createdAt: new Date().toISOString()
          };

          db.users.push(newUser);

          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              const publicUser = { ...newUser };
              delete publicUser.password;
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, user: publicUser }));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.805. POST /api/forgot-password (User Forgot Password / Reset - Shopee Style)
  if (req.method === 'POST' && pathname === '/api/forgot-password') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { emailOrPhone, newPassword } = JSON.parse(body);
        if (!emailOrPhone || !newPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Vui lòng nhập đầy đủ Tài khoản và Mật khẩu mới' }));
          return;
        }

        // Validate Phone or Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Tài khoản không hợp lệ. Phải là Email hoặc Số điện thoại đúng định dạng.' }));
          return;
        }

        // Validate password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;
        if (!passwordRegex.test(newPassword)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mật khẩu dài 8-16 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.' }));
          return;
        }

        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          if (!db.users) db.users = [];

          // Find by email OR phone
          const identifier = emailOrPhone.toLowerCase().trim();
          const user = db.users.find(u => 
            (u.phone && u.phone === identifier) || 
            (u.email && u.email.toLowerCase() === identifier)
          );

          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tài khoản này chưa được đăng ký trên hệ thống' }));
            return;
          }

          const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');
          user.password = passwordHash;

          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.81. POST /api/login (User Login - Email or Phone)
  if (req.method === 'POST' && pathname === '/api/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Vui lòng nhập tài khoản và mật khẩu' }));
          return;
        }

        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          if (!db.users) db.users = [];

          // Find by email OR phone
          const identifier = email.toLowerCase().trim();
          const user = db.users.find(u => 
            (u.email && u.email.toLowerCase() === identifier) || 
            (u.phone && u.phone === identifier)
          );

          if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tài khoản hoặc mật khẩu không chính xác' }));
            return;
          }

          const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
          if (user.password !== passwordHash) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tài khoản hoặc mật khẩu không chính xác' }));
            return;
          }

          // Generate Token
          const token = crypto.randomBytes(32).toString('hex');
          SESSIONS[token] = {
            userId: user.id,
            email: user.email || '',
            phone: user.phone,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          };

          const publicUser = { ...user };
          delete publicUser.password;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token, user: publicUser }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.82. POST /api/logout (User Logout)
  if (req.method === 'POST' && pathname === '/api/logout') {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      delete SESSIONS[token];
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 5.83. GET /api/user/profile (Get User Profile details)
  if (req.method === 'GET' && pathname === '/api/user/profile') {
    const session = getAuthUser(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      const user = db.users.find(u => u.id === session.userId);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }
      const publicUser = { ...user };
      delete publicUser.password;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(publicUser));
    });
    return;
  }

  // 5.84. PUT /api/user/profile (Update User Profile details)
  if (req.method === 'PUT' && pathname === '/api/user/profile') {
    const session = getAuthUser(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { name, email, phone, address } = JSON.parse(body);
        if (!name || !phone || !address) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, SĐT, Địa chỉ)' }));
          return;
        }

        // Validate name (letters and spaces, min 2 chars)
        const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂưăạảấầẩẫậắằẳẵặẹẻẽếềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲÝỴÝỶỸửữựỳýỵỷỹ\s]{2,}$/;
        if (!nameRegex.test(name)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Họ và tên không hợp lệ. Chỉ chấp nhận chữ cái và khoảng trắng, tối thiểu 2 ký tự.' }));
          return;
        }

        // Validate email if not empty
        if (email && email.trim() !== '') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email không đúng định dạng.' }));
            return;
          }
        }

        // Validate phone (VN mobile format)
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phone)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09.' }));
          return;
        }

        // Validate address (min 10 chars)
        if (address.trim().length < 10) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Địa chỉ quá ngắn. Vui lòng cung cấp cụ thể hơn (tối thiểu 10 ký tự).' }));
          return;
        }

        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const user = db.users.find(u => u.id === session.userId);
          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'User not found' }));
            return;
          }

          // Check unique email if changing
          const newEmail = email ? email.toLowerCase().trim() : '';
          if (newEmail !== '' && newEmail !== (user.email || '').toLowerCase()) {
            const emailTaken = db.users.some(u => u.id !== user.id && u.email && u.email.toLowerCase() === newEmail);
            if (emailTaken) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Email này đã được sử dụng bởi một tài khoản khác' }));
              return;
            }
          }

          // Check unique phone if changing
          const newPhone = phone.trim();
          if (newPhone !== user.phone) {
            const phoneTaken = db.users.some(u => u.id !== user.id && u.phone === newPhone);
            if (phoneTaken) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác' }));
              return;
            }
          }

          user.name = name;
          user.email = newEmail;
          user.phone = newPhone;
          user.address = address.trim();

          // Sync session details in memory
          for (let tok in SESSIONS) {
            if (SESSIONS[tok].userId === user.id) {
              SESSIONS[tok].email = user.email;
              SESSIONS[tok].phone = user.phone;
            }
          }

          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              const publicUser = { ...user };
              delete publicUser.password;
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(publicUser));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 5.85. GET /api/user/orders (Get User specific orders)
  if (req.method === 'GET' && pathname === '/api/user/orders') {
    const session = getAuthUser(req);
    if (!session) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }
      const matchedOrders = db.orders.filter(o => 
        (o.userId === session.userId) || 
        (o.customer && o.customer.email && session.email && o.customer.email.toLowerCase() === session.email.toLowerCase()) ||
        (o.customer && o.customer.phone && session.phone && o.customer.phone === session.phone)
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(matchedOrders));
    });
    return;
  }

  // 5.95. POST /api/orders/public-status (Public - Get order status details for specific IDs)
  if (req.method === 'POST' && pathname === '/api/orders/public-status') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { ids } = JSON.parse(body);
        if (!Array.isArray(ids)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
          return;
        }
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const matchedOrders = db.orders.filter(o => ids.some(id => id.toLowerCase() === o.id.toLowerCase()));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(matchedOrders));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 6. GET /api/orders (Admin - View Orders)
  if (req.method === 'GET' && pathname === '/api/orders') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(db.orders));
      }
    });
    return;
  }

  // 7. PUT /api/orders/:id/status (Admin - Update Order Status)
  if (req.method === 'PUT' && pathname.startsWith('/api/orders/') && pathname.endsWith('/status')) {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const parts = pathname.split('/');
    const id = parts[3]; // format: /api/orders/:id/status
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { status } = JSON.parse(body);
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const order = db.orders.find(o => o.id === id);
          if (!order) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Order not found' }));
            return;
          }
          order.status = status;
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(order));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 7.5. PUT /api/orders/:id/payment-proof (Upload payment proof)
  if (req.method === 'PUT' && pathname.startsWith('/api/orders/') && pathname.endsWith('/payment-proof')) {
    const parts = pathname.split('/');
    const id = parts[3]; // format: /api/orders/:id/payment-proof
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { proofText, proofImage } = JSON.parse(body);
        readDb((err, db) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Database read failed' }));
            return;
          }
          const order = db.orders.find(o => o.id === id);
          if (!order) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Order not found' }));
            return;
          }
          order.paymentProof = {
            text: proofText || '',
            image: proofImage || '', // base64 string
            submittedAt: new Date().toISOString()
          };
          writeDb(db, (writeErr) => {
            if (writeErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
              console.log(`[ORDER] Payment proof submitted for order "${id}".`);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(order));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 8. GET /api/analytics (Admin - Stats & Reports)
  if (req.method === 'GET' && pathname === '/api/analytics') {
    if (!checkAdminAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    readDb((err, db) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database read failed' }));
        return;
      }

      // Calculate Sales Analytics (convert USD to VND for aggregate sum to be uniform, standard rate = 25400)
      const rate = db.settings.exchangeRate || 25400;
      let totalRevenueVND = 0;
      let totalOrders = db.orders.length;
      let pendingOrders = 0;
      let completedOrders = 0;

      const salesByCategory = { Fashion: 0, Tech: 0, Flowers: 0 };
      const productSalesCount = {};

      db.orders.forEach(order => {
        const factor = order.currency === 'USD' ? rate : 1;
        const orderAmount = order.payableAmount !== undefined ? order.payableAmount : order.subtotal;
        const revenueContribution = orderAmount * factor;
        
        // Sum total revenue of completed/processing orders (or all non-cancelled ones)
        if (order.status !== 'Cancelled') {
          totalRevenueVND += revenueContribution;
        }

        if (order.status === 'Pending') pendingOrders++;
        if (order.status === 'Completed') completedOrders++;

        // Detailed item sales
        order.items.forEach(item => {
          // Accumulate product sales
          productSalesCount[item.id] = (productSalesCount[item.id] || 0) + item.qty;

          // Category distribution
          const product = db.products.find(p => p.id === item.id);
          if (product && salesByCategory[product.category] !== undefined) {
            salesByCategory[product.category] += item.qty * item.price * factor;
          }
        });
      });

      // Find top products
      const topProducts = Object.keys(productSalesCount)
        .map(id => {
          const product = db.products.find(p => p.id === id);
          return {
            name: product ? product.name : 'Unknown Product',
            sales: productSalesCount[id],
            category: product ? product.category : 'N/A'
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalRevenueVND,
        totalOrders,
        pendingOrders,
        completedOrders,
        salesByCategory,
        topProducts,
        recentOrders: db.orders.slice(0, 5)
      }));
    });
    return;
  }

  // ==========================================
  // Static File Server & Custom Routes
  // ==========================================
  let targetFile = pathname;
  if (pathname === '/' || pathname === '/ShopKy') {
    targetFile = 'index.html';
  } else if (pathname === '/ShopKydethuong') {
    targetFile = 'admin.html';
  }

  let filePath = path.join(PUBLIC_DIR, targetFile);

  // Prevent path traversal
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`ShopKy server running at http://localhost:${PORT}/ShopKy`);
  console.log(`Database stored at: ${DATA_FILE}`);
});
