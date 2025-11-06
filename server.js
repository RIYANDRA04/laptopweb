const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const apiRoutes = require("./routes/api");

// Middleware JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: "laptop-shop-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Static file directory (for public folder)
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api", apiRoutes);

// Root route → serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Dynamic port binding for Railway / Render
const PORT = process.env.PORT || 3000;

// ⚠️ Penting: gunakan host "0.0.0.0" agar bisa diakses publik
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
