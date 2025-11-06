const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "store.db");
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
      "Laptop gaming premium 16 inci dengan bodi aluminium kokoh, performa kelas flagship, dan cocok untuk game AAA maupun kerja kreatif berat.",
      "/img/laptop-1.jpg",
      23000000,
    ],
    [
      "MACKBOOK M2",
      "Laptop dan ringan dengan chip M2 yang kencang, ideal untuk mahasiswa, kreator konten, dan pekerjaan harian yang butuh baterai awet.",
      "/img/laptop-2.jpg",
      21000000,
    ],
    [
      "ASUS TUF A15",
      "Laptop gaming tangguh dengan desain militaristik, prosesor bertenaga, dan sistem pendingin yang siap dipakai main game berjam-jam.",
      "/img/laptop-3.png",
      14000000,
    ],
    [
      "MSI TITAN 18 HX",
      "Monster gaming berlayar besar dengan hardware kelas atas, cocok untuk gamer serius, streamer, maupun content creator profesional.",
      "/img/laptop-6.Avif",
      35000000,
    ],
    [
      "LENOOVO LOQ",
      "Laptop serbaguna untuk kerja dan gaming kasual, dengan desain simpel, performa stabil, dan keyboard yang nyaman dipakai mengetik lama.",
      "/img/laptop-5.Avif",
      12000000,
    ],
    [
      "ACER NITRO 5",
      "Laptop gaming terjangkau dengan performa kencang, cocok untuk pelajar atau pemula yang ingin main game modern tanpa bikin dompet jebol.",
      "/img/laptop-7.png",
      12500000,
    ],
    [
      "ROG STRIX",
      "Laptop gaming ROG dengan tampilan agresif RGB, refresh rate tinggi, dan performa yang halus untuk esports maupun game kompetitif.",
      "/img/laptop-8.jpg",
      45000000,
    ],
    [
      "ASUS TUF A16",
      "Laptop 16 inci dengan layar lega, baterai cukup awet, dan performa yang pas untuk multitasking, kuliah online, dan hiburan harian.",
      "/img/laptop-9.PNG",
      18000000,
    ],
    [
      "MSI KATANA",
      "Laptop gaming dengan desain stylish dan bobot masih bersahabat, pas buat yang sering pindah-pindah tapi tetap ingin performa kencang.",
      "/img/laptop-10.jpg",
      11000000,
    ],
    [
      "MACKBOOK AIR M4",
      "Ultrabook super ringan dengan chip M4 hemat daya, ideal untuk kerja mobile, editing ringan, dan penggunaan sehari-hari yang butuh kepraktisan.",
      "/img/laptop-11.jpg",
      28000000,
    ],
    [
      "ASUS ASPIRE LITE 14",
      "Laptop 14 inci yang ringkas dan elegan, cocok untuk pelajar dan profesional yang butuh perangkat kerja simpel, cepat, dan mudah dibawa.",
      "/img/laptop-12.jpg",
      97000000,
    ],
    [
      "ASUS VIVOBOOK 14",
      "Laptop harian yang ramping dengan performa cukup untuk tugas sekolah, kerja kantoran, dan hiburan seperti streaming dan browsing.",
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
