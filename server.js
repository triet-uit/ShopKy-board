/**
 * AetherShop - Premium Node.js E-Commerce Server
 * Serves static shop files and provides REST APIs for catalog, checkout, orders, and admin analytics.
 */
const http = require('http');
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

function writeDb(data, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Failed to write database:', err);
      callback(err);
    } else {
      callback(null);
    }
  });
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
          for (const item of orderPayload.items) {
            const product = db.products.find(p => p.id === item.id);
            if (!product) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Product ${item.name} not found` }));
              return;
            }
            if (product.stock < item.qty) {
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
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Database write failed' }));
            } else {
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
