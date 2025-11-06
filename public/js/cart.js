async function loadCart() {
  const container = document.getElementById("cartContainer");
  if (!container) return;
  container.innerHTML = '<p class="text-muted">Memuat keranjang...</p>';

  try {
    const res = await fetch("/api/cart");
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      container.innerHTML =
        '<div class="empty-state">Keranjang kamu masih kosong. Silakan pilih laptop di halaman Shop.</div>';
      document.getElementById("checkoutSection").style.display = "none";
      return;
    }

    document.getElementById("checkoutSection").style.display = "flex";

    // ⬇️ CUMA SEKALI dideklarasikan, di luar loop
    let rowsHtml = "";
    items.forEach((it, idx) => {
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>${it.name}</td>
          <td class="text-right">Rp ${Number(it.price).toLocaleString(
            "id-ID"
          )}</td>
          <td class="text-right">${it.qty}</td>
          <td class="text-right">Rp ${Number(it.subtotal).toLocaleString(
            "id-ID"
          )}</td>
          <td class="text-right">
            <button class="btn secondary btn-remove" data-id="${it.productId}">
              Hapus
            </button>
          </td>
        </tr>
      `;
    });

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Produk</th>
            <th class="text-right">Harga</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Subtotal</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    container.innerHTML = tableHtml;
    document.getElementById("cartTotal").textContent =
      "Rp " + Number(data.total).toLocaleString("id-ID");

    // Tambahkan event listener untuk tombol Hapus
    document.querySelectorAll(".btn-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        const konfirmasi = confirm("Hapus produk ini dari keranjang?");
        if (!konfirmasi) return;

        try {
          const res = await fetch("/api/cart/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          });
          const data = await res.json();
          if (!data.success) {
            alert("Gagal menghapus dari keranjang");
            return;
          }
          // Reload cart & update badge
          await loadCart();
          await window.refreshCartBadge();
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan saat menghapus dari keranjang");
        }
      });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="empty-state">Gagal memuat keranjang.</div>';
  }
}

async function handleCheckout(event) {
  event.preventDefault();
  if (!confirm("Lanjutkan checkout?")) return;
  try {
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (!data.success) {
      alert(data.error || "Checkout gagal");
      return;
    }
    await window.refreshCartBadge();
    alert("Checkout berhasil! Pesanan kamu sudah tersimpan.");
    window.location.href = "orders.html";
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat checkout");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.requireLogin();
  if (!user) return;
  await window.refreshCartBadge();
  loadCart();
  const btnCheckout = document.getElementById("btnCheckout");
  if (btnCheckout) {
    btnCheckout.addEventListener("click", handleCheckout);
  }
});
