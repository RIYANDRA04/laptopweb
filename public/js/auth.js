async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Isi username dan password");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || "Login gagal");
      return;
    }
    const user = data.user;
    if (user.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "shop.html";
    }
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat login");
  }
}

async function requireLogin(requiredRole) {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) {
      window.location.href = "index.html";
      return null;
    }
    const user = await res.json();
    if (requiredRole && user.role !== requiredRole) {
      window.location.href = "index.html";
      return null;
    }

    // isi nama user di footer/header kalau ada
    const usernameEls = document.querySelectorAll(".current-username");
    usernameEls.forEach((el) => (el.textContent = user.username));

    // 🔹 TAMPILKAN MENU ADMIN KALAU ROLE = 'admin'
    const adminLinks = document.querySelectorAll(".admin-link");
    adminLinks.forEach((link) => {
      if (user.role === "admin") {
        link.style.display = "inline-flex";
      } else {
        link.style.display = "none";
      }
    });

    return user;
  } catch (err) {
    console.error(err);
    window.location.href = "index.html";
    return null;
  }
}

async function logout(event) {
  if (event) event.preventDefault();
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch (err) {
    console.error(err);
  } finally {
    window.location.href = "index.html";
  }
}

async function refreshCartBadge() {
  try {
    const badge = document.getElementById("cartCount");
    if (!badge) return;
    const res = await fetch("/api/cart");
    if (!res.ok) return;
    const data = await res.json();
    const totalItems = (data.items || []).reduce(
      (sum, item) => sum + item.qty,
      0
    );
    badge.textContent = totalItems;
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
  document.querySelectorAll("[data-logout]").forEach((el) => {
    el.addEventListener("click", logout);
  });
});

window.requireLogin = requireLogin;
window.refreshCartBadge = refreshCartBadge;
