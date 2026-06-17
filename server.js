/**
 * AetherShop - Premium Node.js E-Commerce Server
 * Serves static shop files and provides REST APIs for catalog, checkout, orders, and admin analytics.
 */
require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8090;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

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

// Server request handler
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        const orderPayload = JSON.parse(body); // { customer: {...}, items: [{id, qty, currency, price}], currency, paymentMethod, subtotal }
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

          const newOrder = {
            id: 'ord-' + Date.now(),
            customer: orderPayload.customer,
            items: orderPayload.items,
            subtotal: orderPayload.subtotal,
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

  // 6. GET /api/orders (Admin - View Orders)
  if (req.method === 'GET' && pathname === '/api/orders') {
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
        const revenueContribution = order.subtotal * factor;
        
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
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`ShopKy server running at http://localhost:${PORT}/ShopKy`);
  console.log(`Database stored at: ${DATA_FILE}`);
});
