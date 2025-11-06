async function loadOrders() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  container.innerHTML = '<p class="text-muted">Memuat pesanan...</p>';
  try {
    const res = await fetch("/api/orders");
    const orders = await res.json();
    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML =
        '<div class="empty-state">Belum ada pesanan. Silakan lakukan checkout terlebih dahulu.</div>';
      return;
    }
    let rowsHtml = "";
    orders.forEach((o, idx) => {
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>#${o.id}</td>
          <td>${new Date(o.created_at).toLocaleString("id-ID")}</td>
          <td class="text-right">Rp ${Number(o.total).toLocaleString(
            "id-ID"
          )}</td>
          <td class="text-right"><span class="status-badge">Sukses</span></td>
        </tr>
      `;
    });
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID Pesanan</th>
            <th>Tanggal</th>
            <th class="text-right">Total</th>
            <th class="text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="empty-state">Gagal memuat pesanan.</div>';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.requireLogin();
  if (!user) return;
  await window.refreshCartBadge();
  loadOrders();
});
