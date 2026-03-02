// ─── Navigation hamburger ─────────────────────────────────────────────────────
(function () {
  const toggle = document.querySelector('.navToggle');
  const nav    = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ─── Cart badge (used in tienda.html) ────────────────────────────────────────
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const cart  = JSON.parse(localStorage.getItem('opulence_cart') || '[]');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}
updateCartBadge();

// ─── Contact form (contacto.html) → localStorage ──────────────────────────────
(function () {
  const form = document.getElementById('mainContactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const msg = {
      id:      Date.now(),
      name:    fd.get('name')    || '',
      email:   fd.get('email')   || '',
      phone:   fd.get('phone')   || '',
      subject: fd.get('subject') || 'Contacto general',
      message: fd.get('message') || '',
      date:    new Date().toISOString(),
      read:    false,
      source:  'contacto'
    };
    const msgs = JSON.parse(localStorage.getItem('opulence_messages') || '[]');
    msgs.unshift(msg);
    localStorage.setItem('opulence_messages', JSON.stringify(msgs));
    form.reset();
    const ok = document.getElementById('formSuccess');
    if (ok) {
      ok.style.display = 'block';
      setTimeout(() => (ok.style.display = 'none'), 5000);
    }
  });
})();

// ─── Negocio form → localStorage ─────────────────────────────────────────────
(function () {
  const form = document.querySelector('#contacto-negocio .form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = {
      id:      Date.now(),
      name:    form.querySelector('#name')?.value    || '',
      email:   form.querySelector('#email')?.value   || '',
      phone:   form.querySelector('#phone')?.value   || '',
      city:    form.querySelector('#city')?.value    || '',
      message: form.querySelector('#message')?.value || '',
      subject: 'Oportunidad de negocio',
      date:    new Date().toISOString(),
      read:    false,
      source:  'negocio'
    };
    const msgs = JSON.parse(localStorage.getItem('opulence_messages') || '[]');
    msgs.unshift(msg);
    localStorage.setItem('opulence_messages', JSON.stringify(msgs));
    form.reset();
    alert('¡Mensaje enviado! Te contactaremos pronto.');
  });
})();


