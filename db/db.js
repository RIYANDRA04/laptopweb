const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Pastikan direktori db ada (Railway kadang tidak membuatnya)
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "store.db");
const db = new Database(dbPath);

// ====== Buat tabel jika belum ada ======
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    price REAL NOT NULL
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`
).run();

// ====== Seed default users ======
const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
if (userCount === 0) {
  const insertUser = db.prepare(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
  );
  insertUser.run("admin", "admin123", "admin");
  insertUser.run("user1", "user123", "user");
  console.log("Seeded users table");
}

// ====== Seed default products ======
const productCount = db
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get().count;
if (productCount === 0) {
  const products = [
    [
      "RAZER BLADE 16",
      "Laptop gaming premium 16 inci ...",
      "/img/laptop-1.jpg",
      23000000,
    ],
    [
      "MACKBOOK M2",
      "Laptop ringan dengan chip M2 ...",
      "/img/laptop-2.jpg",
      21000000,
    ],
    [
      "ASUS TUF A15",
      "Laptop gaming tangguh ...",
      "/img/laptop-3.png",
      14000000,
    ],
    [
      "MSI TITAN 18 HX",
      "Monster gaming berlayar besar ...",
      "/img/laptop-6.Avif",
      35000000,
    ],
    ["LENOOVO LOQ", "Laptop serbaguna ...", "/img/laptop-5.Avif", 12000000],
    [
      "ACER NITRO 5",
      "Laptop gaming terjangkau ...",
      "/img/laptop-7.png",
      12500000,
    ],
    ["ROG STRIX", "Laptop gaming ROG ...", "/img/laptop-8.jpg", 45000000],
    ["ASUS TUF A16", "Laptop 16 inci ...", "/img/laptop-9.PNG", 18000000],
    ["MSI KATANA", "Laptop gaming stylish ...", "/img/laptop-10.jpg", 11000000],
    [
      "MACKBOOK AIR M4",
      "Ultrabook super ringan ...",
      "/img/laptop-11.jpg",
      28000000,
    ],
    [
      "ASUS ASPIRE LITE 14",
      "Laptop 14 inci ringkas ...",
      "/img/laptop-12.jpg",
      97000000,
    ],
    [
      "ASUS VIVOBOOK 14",
      "Laptop harian ramping ...",
      "/img/laptop-13.png",
      8000000,
    ],
  ];

  const insertProduct = db.prepare(
    "INSERT INTO products (name, description, image, price) VALUES (?, ?, ?, ?)"
  );
  const insertMany = db.transaction((data) => {
    for (const p of data) insertProduct.run(p[0], p[1], p[2], p[3]);
  });
  insertMany(products);

  console.log("Seeded products table");
}

module.exports = db;
