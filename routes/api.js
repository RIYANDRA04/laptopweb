const express = require("express");
const router = express.Router();
const db = require("../db/db");

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
// Registrasi user baru (role selalu "user")
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
    return res.json({
      success: false,
      message: "Username minimal 3 karakter",
    });
  }

  if (trimmedPassword.length < 4) {
    return res.json({
      success: false,
      message: "Password minimal 4 karakter",
    });
  }

  // Simpan user baru sebagai role "user"
  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [trimmedUsername, trimmedPassword, "user"],
    function (err) {
      if (err) {
        // Kalau username sudah dipakai (UNIQUE constraint)
        if (err.message && err.message.includes("UNIQUE")) {
          return res.json({
            success: false,
            message: "Username sudah digunakan, silakan pilih yang lain",
          });
        }
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Gagal mendaftar user baru" });
      }

      // Auto-login setelah register
      req.session.user = {
        id: this.lastID,
        username: trimmedUsername,
        role: "user",
      };

      res.json({
        success: true,
        user: req.session.user,
      });
    }
  );
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
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
    }
  );
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(req.session.user);
});

router.get("/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

router.post("/cart/add", requireLogin, (req, res) => {
  const { productId } = req.body;
  const id = parseInt(productId, 10);
  if (!req.session.cart) req.session.cart = [];
  const cart = req.session.cart;
  const existing = cart.find((item) => item.productId === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ productId: id, qty: 1 });
  }
  req.session.cart = cart;
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ success: true, count });
});
// Hapus satu produk dari cart (hapus 1 baris, bukan kurangi qty)
router.post("/cart/remove", requireLogin, (req, res) => {
  const { productId } = req.body;
  const id = parseInt(productId, 10);

  if (!req.session.cart) {
    req.session.cart = [];
    return res.json({ success: true });
  }

  const cart = req.session.cart;
  const newCart = cart.filter((item) => item.productId !== id);
  req.session.cart = newCart;

  const count = newCart.reduce((sum, item) => sum + item.qty, 0);
  res.json({ success: true, count });
});

router.get("/cart", requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.json({ items: [], total: 0 });
  }
  const ids = cart.map((item) => item.productId);
  const placeholders = ids.map(() => "?").join(",");
  db.all(
    `SELECT id, name, price, image, description FROM products WHERE id IN (${placeholders})`,
    ids,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      let total = 0;
      const items = rows.map((p) => {
        const item = cart.find((c) => c.productId === p.id);
        const subtotal = p.price * item.qty;
        total += subtotal;
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          qty: item.qty,
          image: p.image,
          description: p.description,
          subtotal,
        };
      });
      res.json({ items, total });
    }
  );
});

router.post("/cart/clear", requireLogin, (req, res) => {
  req.session.cart = [];
  res.json({ success: true });
});

router.post("/checkout", requireLogin, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.status(400).json({ error: "Keranjang masih kosong" });
  }
  const ids = cart.map((item) => item.productId);
  const placeholders = ids.map(() => "?").join(",");
  db.all(
    `SELECT id, name, price FROM products WHERE id IN (${placeholders})`,
    ids,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      let total = 0;
      const items = rows.map((p) => {
        const item = cart.find((c) => c.productId === p.id);
        const subtotal = p.price * item.qty;
        total += subtotal;
        return {
          productId: p.id,
          price: p.price,
          qty: item.qty,
        };
      });

      db.run(
        'INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, datetime("now"))',
        [req.session.user.id, total],
        function (err2) {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "Gagal menyimpan pesanan" });
          }
          const orderId = this.lastID;
          const stmt = db.prepare(
            "INSERT INTO order_items (order_id, product_id, qty, price) VALUES (?,?,?,?)"
          );
          items.forEach((it) => {
            stmt.run(orderId, it.productId, it.qty, it.price);
          });
          stmt.finalize((err3) => {
            if (err3) {
              console.error(err3);
              return res
                .status(500)
                .json({ error: "Gagal menyimpan detail pesanan" });
            }
            req.session.cart = [];
            res.json({ success: true, orderId });
          });
        }
      );
    }
  );
});

router.get("/orders", requireLogin, (req, res) => {
  db.all(
    "SELECT id, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [req.session.user.id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(rows);
    }
  );
});

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
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

module.exports = router;
