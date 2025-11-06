const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Middleware proteksi login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// ===================== REGISTER =====================
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username dan password wajib diisi" });
  }

  const trimmedUsername = String(username).trim();
  const trimmedPassword = String(password).trim();

  if (trimmedUsername.length < 3) {
    return res.json({ success: false, message: "Username minimal 3 karakter" });
  }
  if (trimmedPassword.length < 4) {
    return res.json({ success: false, message: "Password minimal 4 karakter" });
  }

  try {
    const insertUser = db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    );
    insertUser.run(trimmedUsername, trimmedPassword, "user");

    // Auto-login setelah register
    const newUser = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(trimmedUsername);
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.json({
        success: false,
        message: "Username sudah digunakan, silakan pilih yang lain",
      });
    }
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Gagal mendaftar user baru" });
  }
});

// ===================== LOGIN =====================
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  try {
    const user = db
      .prepare("SELECT * FROM users WHERE username = ? AND password = ?")
      .get(username, password);
    if (!user) {
      return res.json({
        success: false,
        message: "Username atau password salah",
      });
    }
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== LOGOUT =====================
router.post("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ===================== ME =====================
router.get("/me", (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Not logged in" });
  res.json(req.session.user);
});

// ===================== PRODUCTS =====================
router.get("/products", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM products").all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== CART =====================
router.post("/cart/add", requireLogin, (req, res) => {
  const { productId } = req.body;
  const id = parseInt(productId, 10);
  if (!req.session.cart) req.session.cart = [];
  const cart = req.session.cart;
  const existing = cart.find((item) => item.productId === id);
  if (existing) existing.qty += 1;
  else cart.push({ productId: id, qty: 1 });

  req.session.cart = cart;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ success: true, count });
});

router.post("/cart/remove", requireLogin, (req, res) => {
  const { productId } = req.body;
  const id = parseInt(productId, 10);
  const cart = req.session.cart || [];
  req.session.cart = cart.filter((item) => item.productId !== id);
  const count = req.session.cart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ success: true, count });
});

router.get("/cart", requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.json({ items: [], total: 0 });

  const ids = cart.map((item) => item.productId);
  const placeholders = ids.map(() => "?").join(",");
  try {
    const rows = db
      .prepare(
        `SELECT id, name, price, image, description FROM products WHERE id IN (${placeholders})`
      )
      .all(...ids);
    let total = 0;
    const items = rows.map((p) => {
      const item = cart.find((c) => c.productId === p.id);
      const subtotal = p.price * item.qty;
      total += subtotal;
      return { ...p, qty: item.qty, subtotal };
    });
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/cart/clear", requireLogin, (req, res) => {
  req.session.cart = [];
  res.json({ success: true });
});

// ===================== CHECKOUT =====================
router.post("/checkout", requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0)
    return res.status(400).json({ error: "Keranjang masih kosong" });

  const ids = cart.map((item) => item.productId);
  const placeholders = ids.map(() => "?").join(",");
  try {
    const rows = db
      .prepare(`SELECT id, price FROM products WHERE id IN (${placeholders})`)
      .all(...ids);
    let total = 0;
    const items = rows.map((p) => {
      const item = cart.find((c) => c.productId === p.id);
      const subtotal = p.price * item.qty;
      total += subtotal;
      return { productId: p.id, price: p.price, qty: item.qty };
    });

    const insertOrder = db.prepare(
      'INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, datetime("now"))'
    );
    const result = insertOrder.run(req.session.user.id, total);
    const orderId = result.lastInsertRowid;

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)"
    );
    const insertMany = db.transaction((items) => {
      for (const it of items)
        insertItem.run(orderId, it.productId, it.qty, it.price);
    });
    insertMany(items);

    req.session.cart = [];
    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal menyimpan pesanan" });
  }
});

// ===================== ORDERS =====================
router.get("/orders", requireLogin, (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(req.session.user.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ===================== ADMIN ORDERS =====================
router.get("/admin/orders", requireAdmin, (req, res) => {
  const sql = `
    SELECT 
      o.id,
      o.total,
      o.created_at,
      u.username,
      GROUP_CONCAT(p.name || ' x' || oi.qty, ', ') AS items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  try {
    const rows = db.prepare(sql).all();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
