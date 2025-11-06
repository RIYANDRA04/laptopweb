const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const apiRoutes = require("./routes/api");

// Middleware untuk parsing JSON dan form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Pastikan Express mempercayai proxy (Railway pakai HTTPS proxy)
app.set("trust proxy", 1);

// ✅ Konfigurasi session untuk production (HTTPS + cookie aman)
app.use(
  session({
    secret: "laptop-shop-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // aktifkan hanya di HTTPS
      sameSite: "none", // izinkan cookie cross-domain
      httpOnly: true, // tidak bisa diakses via JS (lebih aman)
      maxAge: 1000 * 60 * 60 * 24, // berlaku 1 hari
    },
  })
);

// Folder public (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Routing API
app.use("/api", apiRoutes);

// Default route (homepage)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Gunakan port dinamis Railway
const PORT = process.env.PORT || 3000;

// Gunakan host 0.0.0.0 agar bisa diakses publik
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
