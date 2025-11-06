async function loadAdminOrders() {
  const container = document.getElementById('adminOrdersContainer');
  if (!container) return;
  container.innerHTML = '<p class="text-muted">Memuat semua pesanan...</p>';
  try {
    const res = await fetch('/api/admin/orders');
    if (!res.ok) {
      container.innerHTML = '<div class="empty-state">Gagal mengakses data admin.</div>';
      return;
    }
    const orders = await res.json();
    if (!Array.isArray(orders) || orders.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada pesanan yang tercatat.</div>';
      return;
    }
    let rowsHtml = '';
    orders.forEach((o, idx) => {
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>#${o.id}</td>
          <td>${o.username}</td>
          <td>${new Date(o.created_at).toLocaleString('id-ID')}</td>
          <td>${o.items || '-'}</td>
          <td class="text-right">Rp ${Number(o.total).toLocaleString('id-ID')}</td>
        </tr>
      `;
    });
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID Pesanan</th>
            <th>User</th>
            <th>Tanggal</th>
            <th>Item</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state">Gagal memuat pesanan admin.</div>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await window.requireLogin('admin');
  if (!user) return;
  await window.refreshCartBadge();
  loadAdminOrders();
});
