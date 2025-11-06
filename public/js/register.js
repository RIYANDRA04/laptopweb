document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const password2 = document.getElementById("password2").value.trim();

    if (password !== password2) {
      alert("Password dan konfirmasi password tidak sama.");
      return;
    }

    if (username.length < 3) {
      alert("Username minimal 3 karakter.");
      return;
    }

    if (password.length < 4) {
      alert("Password minimal 4 karakter.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Pendaftaran gagal.");
        return;
      }

      // Kalau berhasil, user sudah auto-login (session dibuat di backend)
      alert("Pendaftaran berhasil! Kamu sudah login.");
      window.location.href = "shop.html"; // langsung ke halaman Shop
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mendaftar.");
    }
  });
});
