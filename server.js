const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const apiRoutes = require("./routes/api");

// Support JSON dan form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fix session agar aman di Railway (HTTPS)
app.set("trust proxy", 1);
app.use(
  session({
    secret: "laptop-shop-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // cookie hanya aktif di HTTPS
      sameSite: "none", // biar bisa diakses cross-domain (frontend <-> backend)
    },
  })
);

// Folder public
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api", apiRoutes);

// Default route (homepage)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Gunakan port dinamis Railway
const PORT = process.env.PORT || 3000;

// Host 0.0.0.0 agar bisa diakses publik
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
