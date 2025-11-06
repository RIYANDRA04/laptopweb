async function loadProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = '<p class="text-muted">Memuat produk...</p>';
  try {
    const res = await fetch("/api/products");
    const products = await res.json();
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML =
        '<div class="empty-state">Belum ada produk tersedia.</div>';
      return;
    }
    grid.innerHTML = "";
    products.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="card-img-wrap">
          <img src="${p.image}" alt="${
        p.name
      }" onerror="this.src='https://via.placeholder.com/400x250?text=Laptop';">
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <p class="card-desc">${p.description || ""}</p>
          <div class="card-meta">
            <span class="price">Rp ${Number(p.price).toLocaleString(
              "id-ID"
            )}</span>
            <span class="pill-soft">Stok ready</span>
          </div>
          <div class="card-actions">
            <button class="btn primary btn-add-cart" data-id="${
              p.id
            }">Tambah ke Cart</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    document.querySelectorAll(".btn-add-cart").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        try {
          const res = await fetch("/api/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          });
          const data = await res.json();
          if (!data.success) {
            alert("Gagal menambah ke cart");
            return;
          }
          await window.refreshCartBadge();
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan saat menambah ke cart");
        }
      });
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="empty-state">Gagal memuat produk.</div>';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.requireLogin();
  if (!user) return;
  await window.refreshCartBadge();
  loadProducts();
});
