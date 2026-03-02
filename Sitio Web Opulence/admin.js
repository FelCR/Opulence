const ADMIN_USER = 'admin';
const ADMIN_PASS = 'opulence2024';

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Fountain of Life', category: 'Antioxidantes', price: 1200,
    description: 'El antioxidante más poderoso del mercado.', image: 'assets/fountain-of-life.png', stock: 50, featured: true },
  { id: 2, name: 'Collagen Boost',   category: 'Colágeno',      price: 980,
    description: 'Colágeno marino hidrolizado premium.',       image: '', stock: 35, featured: false },
  { id: 3, name: 'Immunity Shield',  category: 'Inmunidad',     price: 850,
    description: 'Complejo inmunológico de alta potencia.',    image: '', stock: 40, featured: false },
  { id: 4, name: 'Energy Formula',   category: 'Energía',       price: 750,
    description: 'Adaptógenos y vitaminas para tu energía.',   image: '', stock: 45, featured: false }
];

function getProducts()  { return JSON.parse(localStorage.getItem('opulence_admin_products') || 'null') || DEFAULT_PRODUCTS; }
function getOrders()    { return JSON.parse(localStorage.getItem('opulence_orders')         || '[]'); }
function getMessages()  { return JSON.parse(localStorage.getItem('opulence_messages')       || '[]'); }
function saveProducts(p){ localStorage.setItem('opulence_admin_products', JSON.stringify(p)); }

function isLoggedIn() { return sessionStorage.getItem('opulence_admin_logged') === 'true'; }

function doLogin(user, pass) {
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('opulence_admin_logged', 'true');
    return true;
  }
  return false;
}

function doLogout() {
  sessionStorage.removeItem('opulence_admin_logged');
  document.getElementById('adminLogin').style.display  = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
  document.getElementById(`section-${name}`).style.display = 'block';
  document.querySelectorAll('.admin-nav__link').forEach(a => a.classList.toggle('is-active', a.dataset.section === name));
  const titles = { dashboard: 'Dashboard', products: 'Productos', orders: 'Pedidos', messages: 'Mensajes' };
  document.getElementById('pageTitle').textContent = titles[name] || '';
  if (name === 'dashboard') renderDashboard();
  if (name === 'products')  renderProductsTable();
  if (name === 'orders')    renderOrdersTable();
  if (name === 'messages')  renderMessagesTable();
}

function renderDashboard() {
  const products = getProducts(), orders = getOrders(), messages = getMessages();
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const unread  = messages.filter(m => !m.read).length;

  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent   = orders.length;
  document.getElementById('statRevenue').textContent  = `$${revenue.toLocaleString()}`;
  document.getElementById('statMessages').textContent = unread > 0 ? `${unread} nuevos` : messages.length;

  const recentEl = document.getElementById('recentOrders');
  recentEl.innerHTML = orders.length === 0 ? '<p class="empty-state">Sin pedidos aún.</p>' : `
    <table class="admin-table"><thead><tr><th>ID</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead>
    <tbody>${orders.slice(0,5).map(o => `<tr><td>${o.id}</td><td>${o.customer}</td><td>$${(o.total||0).toLocaleString()} MXN</td><td>${badgeForStatus(o.status)}</td></tr>`).join('')}</tbody></table>`;

  const msgsEl = document.getElementById('recentMessages');
  msgsEl.innerHTML = messages.length === 0 ? '<p class="empty-state">Sin mensajes aún.</p>' : `
    <table class="admin-table"><thead><tr><th>Nombre</th><th>Asunto</th><th>Fecha</th><th>Estado</th></tr></thead>
    <tbody>${messages.slice(0,5).map(m => `<tr><td>${m.name}</td><td>${m.subject||'—'}</td><td>${formatDate(m.date)}</td><td>${m.read?'<span class="badge badge--read">Leído</span>':'<span class="badge badge--unread">Nuevo</span>'}</td></tr>`).join('')}</tbody></table>`;
}

function renderProductsTable() {
  const products = getProducts();
  const tbody = document.getElementById('productsBody');
  tbody.innerHTML = products.length === 0
    ? '<tr><td colspan="6" class="empty-state">Sin productos.</td></tr>'
    : products.map(p => `
      <tr>
        <td>${p.image ? `<img src="${p.image}" class="table-thumb" alt="" onerror="this.style.display='none'">` : `<div class="table-placeholder">${p.name.charAt(0)}</div>`}</td>
        <td><strong>${p.name}</strong>${p.featured?'<span class="badge badge--confirm" style="margin-left:6px;">Destacado</span>':''}</td>
        <td>${p.category}</td>
        <td>$${p.price.toLocaleString()} MXN</td>
        <td>${p.stock}</td>
        <td><div class="action-btns"><button class="btn-edit" onclick="editProduct(${p.id})">Editar</button><button class="btn-danger" onclick="deleteProduct(${p.id})">Eliminar</button></div></td>
      </tr>`).join('');
}

let editingProductId = null;

function openProductModal(product = null) {
  editingProductId = product ? product.id : null;
  document.getElementById('modalTitle').textContent = product ? 'Editar producto' : 'Nuevo producto';
  const form = document.getElementById('productForm');
  form.reset();
  if (product) {
    form.pId.value = product.id; form.name.value = product.name;
    form.category.value = product.category; form.price.value = product.price;
    form.stock.value = product.stock; form.image.value = product.image || '';
    form.description.value = product.description || ''; form.featured.checked = product.featured || false;
  }
  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() { document.getElementById('productModal').style.display = 'none'; editingProductId = null; }

function editProduct(id) { const p = getProducts().find(p => p.id === id); if (p) openProductModal(p); }

function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  saveProducts(getProducts().filter(p => p.id !== id));
  renderProductsTable();
}

function saveProduct(formData) {
  const products = getProducts();
  const priceNum = parseFloat(formData.price) || 0;
  const stockNum = parseInt(formData.stock, 10) || 0;
  const featured = !!document.getElementById('pFeatured').checked;

  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx > -1) products[idx] = { ...products[idx], name: formData.name, category: formData.category, price: priceNum, stock: stockNum, image: formData.image || '', description: formData.description || '', featured };
  } else {
    products.push({ id: Date.now(), name: formData.name, category: formData.category, price: priceNum, stock: stockNum, image: formData.image || '', description: formData.description || '', featured });
  }
  saveProducts(products);
  closeProductModal();
  renderProductsTable();
}

let viewingOrderId = null;

function renderOrdersTable() {
  const orders = getOrders();
  const tbody = document.getElementById('ordersBody');
  const empty = document.getElementById('ordersEmpty');
  if (orders.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><code>${o.id}</code></td>
      <td>${formatDate(o.date)}</td>
      <td><strong>${o.customer}</strong><br><small>${o.email}</small></td>
      <td>$${(o.total||0).toLocaleString()} MXN</td>
      <td>${o.payment||'—'}</td>
      <td>${badgeForStatus(o.status)}</td>
      <td><button class="btn-view" onclick="viewOrder('${o.id}')">Ver</button></td>
    </tr>`).join('');
}

function viewOrder(id) {
  const order = getOrders().find(o => o.id === id);
  if (!order) return;
  viewingOrderId = id;
  document.getElementById('orderDetail').innerHTML = `
    <p><strong>Pedido:</strong> ${order.id}</p>
    <p><strong>Fecha:</strong> ${formatDate(order.date)}</p>
    <p><strong>Cliente:</strong> ${order.customer}</p>
    <p><strong>Correo:</strong> ${order.email}</p>
    <p><strong>Teléfono:</strong> ${order.phone}</p>
    <p><strong>Dirección:</strong> ${order.address||'—'}</p>
    <p><strong>Pago:</strong> ${order.payment||'—'}</p>
    ${order.notes?`<p><strong>Notas:</strong> ${order.notes}</p>`:''}
    <div class="order-items-list"><strong>Productos:</strong>
      ${(order.items||[]).map(i=>`<div class="order-item-row"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toLocaleString()} MXN</span></div>`).join('')}
      <div class="order-item-row" style="font-weight:600;margin-top:8px;"><span>Total</span><span>$${(order.total||0).toLocaleString()} MXN</span></div>
    </div>`;
  document.getElementById('orderStatusSelect').value = order.status || 'Pendiente';
  document.getElementById('orderModal').style.display = 'flex';
}

function closeOrderModal() { document.getElementById('orderModal').style.display = 'none'; viewingOrderId = null; }

function saveOrderStatus() {
  if (!viewingOrderId) return;
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === viewingOrderId);
  if (idx > -1) { orders[idx].status = document.getElementById('orderStatusSelect').value; localStorage.setItem('opulence_orders', JSON.stringify(orders)); }
  closeOrderModal(); renderOrdersTable();
}

function renderMessagesTable() {
  const msgs = getMessages();
  const tbody = document.getElementById('messagesBody');
  const empty = document.getElementById('messagesEmpty');
  if (msgs.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  tbody.innerHTML = msgs.map((m, i) => `
    <tr style="${!m.read?'font-weight:500;':''}">
      <td>${formatDate(m.date)}</td><td>${m.name}</td><td>${m.email}</td>
      <td>${m.subject||'—'}</td>
      <td style="max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.message}</td>
      <td>${m.read?'<span class="badge badge--read">Leído</span>':`<button class="btn-edit" onclick="markRead(${i})" style="font-size:10px;">Marcar leído</button>`}</td>
    </tr>`).join('');
}

function markRead(index) {
  const msgs = getMessages();
  if (msgs[index]) { msgs[index].read = true; localStorage.setItem('opulence_messages', JSON.stringify(msgs)); renderMessagesTable(); }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function badgeForStatus(status) {
  const map = { 'Pendiente':'badge--pending','Confirmado':'badge--confirm','En camino':'badge--shipping','Entregado':'badge--done','Cancelado':'badge--cancel' };
  return `<span class="badge ${map[status]||'badge--pending'}">${status||'Pendiente'}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    document.getElementById('adminLogin').style.display  = 'none';
    document.getElementById('adminLayout').style.display = 'grid';
    renderDashboard();
  }

  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (doLogin(user, pass)) {
      document.getElementById('adminLogin').style.display  = 'none';
      document.getElementById('adminLayout').style.display = 'grid';
      document.getElementById('loginError').style.display  = 'none';
      renderDashboard();
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });

  document.getElementById('logoutBtn')?.addEventListener('click', doLogout);
  document.querySelectorAll('.admin-nav__link').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); showSection(link.dataset.section); });
  });
  document.getElementById('newProductBtn')?.addEventListener('click', () => openProductModal());
  document.getElementById('cancelProductBtn')?.addEventListener('click', closeProductModal);
  document.getElementById('modalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault(); saveProduct(Object.fromEntries(new FormData(e.target)));
  });
  document.getElementById('orderModalClose')?.addEventListener('click', closeOrderModal);
  document.getElementById('saveOrderStatus')?.addEventListener('click', saveOrderStatus);
  document.getElementById('productModal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeProductModal(); });
  document.getElementById('orderModal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeOrderModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeProductModal(); closeOrderModal(); } });
});
