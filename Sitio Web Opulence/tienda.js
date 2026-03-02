const DEFAULT_PRODUCTS = [
  {
    id: 1, name: 'Fountain of Life', category: 'Antioxidantes', price: 1200,
    description: 'El antioxidante más poderoso del mercado. Combina ingredientes naturales de alta biodisponibilidad para combatir el envejecimiento celular y potenciar tu vitalidad.',
    image: 'assets/fountain-of-life.png', stock: 50, featured: true
  },
  {
    id: 2, name: 'Collagen Boost', category: 'Colágeno', price: 980,
    description: 'Fórmula premium de colágeno marino hidrolizado que mejora la elasticidad de la piel, fortalece articulaciones y promueve la recuperación muscular.',
    image: '', stock: 35, featured: false
  },
  {
    id: 3, name: 'Immunity Shield', category: 'Inmunidad', price: 850,
    description: 'Complejo inmunológico con vitaminas C, D3, Zinc y extracto de equinácea para fortalecer tus defensas naturales todo el año.',
    image: '', stock: 40, featured: false
  },
  {
    id: 4, name: 'Energy Formula', category: 'Energía', price: 750,
    description: 'Adaptógenos naturales, vitaminas del complejo B y minerales esenciales para mantener niveles óptimos de energía y concentración.',
    image: '', stock: 45, featured: false
  }
];

const CAT_COLORS = {
  'Antioxidantes': '#2b2b2b',
  'Colágeno':      '#8b6f6f',
  'Inmunidad':     '#4a6741',
  'Energía':       '#6b5a2a'
};

function loadProducts() {
  const saved = localStorage.getItem('opulence_admin_products');
  return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
}

function getCart() {
  return JSON.parse(localStorage.getItem('opulence_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('opulence_cart', JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}

function addToCart(productId) {
  const products = loadProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  const cart  = getCart();
  const index = cart.findIndex(i => i.id === productId);

  if (index > -1) {
    cart[index].qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }

  saveCart(cart);
  openCart();

  const btn = document.querySelector(`[data-product-id="${productId}"]`);
  if (btn) {
    btn.textContent = '¡Agregado!';
    btn.style.background = '#444';
    setTimeout(() => {
      btn.textContent = 'AGREGAR AL CARRITO';
      btn.style.background = '';
    }, 1500);
  }
}

function removeFromCart(productId) {
  const cart = getCart().filter(i => i.id !== productId);
  saveCart(cart);
}

function changeQty(productId, delta) {
  const cart  = getCart();
  const index = cart.findIndex(i => i.id === productId);
  if (index < 0) return;
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem('opulence_cart');
  renderCart();
  updateCartBadge();
}

function renderCart() {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const total  = document.getElementById('cartTotal');
  if (!body) return;

  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = '<p class="cart-empty">Tu carrito está vacío.</p>';
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item__img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : ''}
        <div class="cart-img-placeholder" style="${item.image ? 'display:none' : ''}">🛒</div>
      </div>
      <div class="cart-item__info">
        <p class="cart-item__name">${item.name}</p>
        <p class="cart-item__price">$${(item.price * item.qty).toLocaleString()} MXN</p>
      </div>
      <div class="cart-item__qty">
        <button onclick="changeQty(${item.id}, -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${item.id}, +1)">+</button>
      </div>
      <button class="cart-item__remove" onclick="removeFromCart(${item.id})" aria-label="Eliminar">✕</button>
    </div>
  `).join('');

  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (total) total.textContent = `$${sum.toLocaleString()} MXN`;
  if (footer) footer.style.display = 'block';
}

function openCart() {
  document.getElementById('cartSidebar')?.classList.add('is-open');
  document.getElementById('cartOverlay')?.classList.add('is-open');
  document.getElementById('cartSidebar')?.setAttribute('aria-hidden', 'false');
}

function closeCartSidebar() {
  document.getElementById('cartSidebar')?.classList.remove('is-open');
  document.getElementById('cartOverlay')?.classList.remove('is-open');
  document.getElementById('cartSidebar')?.setAttribute('aria-hidden', 'true');
}

function openCheckout() {
  closeCartSidebar();
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  renderCheckoutSummary();
}

function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('checkoutContent').style.display = 'block';
  document.getElementById('orderSuccess').style.display    = 'none';
  document.getElementById('checkoutForm')?.reset();
}

function renderCheckoutSummary() {
  const el   = document.getElementById('checkoutSummary');
  const cart = getCart();
  if (!el || cart.length === 0) return;

  const sum = cart.reduce((s, i) => s + i.price * i.qty, 0);
  el.innerHTML = `
    <h3>Resumen de tu pedido</h3>
    <ul class="summary-list">
      ${cart.map(i => `
        <li class="summary-item">
          <span>${i.name} × ${i.qty}</span>
          <span>$${(i.price * i.qty).toLocaleString()} MXN</span>
        </li>`).join('')}
    </ul>
    <div class="summary-total">
      <strong>Total: $${sum.toLocaleString()} MXN</strong>
    </div>
    <hr style="margin:20px 0; border-color:#eee;">
  `;
}

function confirmOrder(formData) {
  const cart    = getCart();
  const sum     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const orderId = 'OP-' + Date.now().toString().slice(-6);

  const order = {
    id:       orderId,
    date:     new Date().toISOString(),
    customer: formData.name,
    email:    formData.email,
    phone:    formData.phone,
    address:  `${formData.address || ''}, ${formData.city || ''} ${formData.zip || ''}`.trim(),
    payment:  formData.payment,
    notes:    formData.notes,
    items:    cart,
    total:    sum,
    status:   'Pendiente'
  };

  const orders = JSON.parse(localStorage.getItem('opulence_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('opulence_orders', JSON.stringify(orders));

  document.getElementById('orderNum').textContent = `Número de pedido: ${orderId}`;
  document.getElementById('checkoutContent').style.display = 'none';
  document.getElementById('orderSuccess').style.display    = 'block';
}

function renderProducts(category = 'Todos') {
  const grid    = document.getElementById('productGrid');
  const empty   = document.getElementById('storeEmpty');
  if (!grid) return;

  const products = loadProducts();
  const filtered = category === 'Todos' ? products : products.filter(p => p.category === category);

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const color = (cat) => CAT_COLORS[cat] || '#2b2b2b';

  grid.innerHTML = filtered.map(p => `
    <article class="product-card ${p.featured ? 'product-card--featured' : ''}">
      <div class="product-card__img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'">` : ''}
        <div class="product-img-placeholder"
             style="${p.image ? 'display:none;' : ''}background:${color(p.category)}">
          <span>${p.name.charAt(0)}</span>
        </div>
        ${p.featured ? '<span class="product-badge">Destacado</span>' : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__category">${p.category}</span>
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__desc">${p.description}</p>
        <div class="product-card__footer">
          <span class="product-card__price">$${p.price.toLocaleString()} MXN</span>
          <button class="product-card__btn" data-product-id="${p.id}"
                  onclick="addToCart(${p.id})"
                  ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Sin stock' : 'AGREGAR AL CARRITO'}
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();

  document.getElementById('storeFilters')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    renderProducts(pill.dataset.cat);
  });

  document.getElementById('cartTrigger')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCartSidebar);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCartSidebar);

  document.getElementById('checkoutBtn')?.addEventListener('click', openCheckout);
  document.getElementById('checkoutClose')?.addEventListener('click', closeCheckout);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCheckout(); closeCartSidebar(); }
  });

  document.getElementById('checkoutForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    confirmOrder(Object.fromEntries(fd));
    clearCart();
  });
});
