/* =========================================================
   Mela Rossa Restaurant & Cafe
   Vanilla ES6, no libraries. Motion only touches transform
   and opacity, driven by IntersectionObserver and
   requestAnimationFrame.
   ========================================================= */

(() => {
  'use strict';

  // ---------- Settings ----------
  const CURRENCY = 'EGP'; // PLACEHOLDER: confirm the currency shown with prices
  const WHATSAPP = '201280060772';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // PLACEHOLDER DISHES AND PRICES: replace with the real Mela Rossa menu.
  // PLACEHOLDER PHOTOS (Unsplash): replace with real photos of each dish.
  const MENU = [
    {
      id: 'pappardelle',
      name: 'Pappardelle with Roasted Seasonal Vegetables',
      category: 'mains',
      price: 35.0,
      desc: 'Placeholder dish. Wide ribbon pasta with roasted vegetables.',
      img: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9',
      ratio: [800, 1200],
      alt: 'Bowl of pappardelle ribbons with herbs and a rich sauce'
    },
    {
      id: 'ravioli',
      name: 'Ravioli Stuffed with Creamy Walnut & Pesto Sauce',
      category: 'mains',
      price: 38.5,
      desc: 'Placeholder dish. Filled pasta with walnut cream and pesto.',
      img: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa',
      ratio: [800, 1067],
      alt: 'Square ravioli dusted with grated cheese on a dark plate'
    },
    {
      id: 'filetto',
      name: 'Filetto di Manzo, Beef Tenderloin in Rosemary Glaze',
      category: 'mains',
      price: 48.0,
      desc: 'Placeholder dish. Sliced beef tenderloin with a rosemary glaze.',
      img: 'https://images.unsplash.com/photo-1558030006-450675393462',
      ratio: [800, 450],
      alt: 'Sliced medium-rare beef tenderloin on a wooden board'
    },
    {
      id: 'roast',
      name: 'Mela Rossa Roast, Signature Dark Espresso Blend',
      category: 'drinks',
      price: 8.0,
      desc: 'Placeholder drink. Our dark espresso blend.',
      img: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04',
      ratio: [800, 533],
      alt: 'White cup of espresso seen from above on a dark stone table'
    }
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => `${n.toFixed(2)} ${CURRENCY}`;
  const unsplash = (base, w) => `${base}?w=${w}&q=75&auto=format&fit=crop`;

  // Closed overlays are display:none so they stay hidden under reduced motion.
  const cart = $('#cart');
  const scrim = $('#scrim');
  const lightbox = $('#lightbox');
  cart.hidden = true;
  lightbox.hidden = true;
  lightbox.classList.add('is-ready');

  $('#year').textContent = new Date().getFullYear();

  // ---------- Image fallback mark ----------
  const FALLBACK_SRC = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#1a1a1a"/>' +
    '<g transform="translate(168 108) scale(1)">' +
    '<path d="M32 21c3-5 9-7 13-5-1 5-6 8-13 5z" fill="#2E4F23"/>' +
    '<path d="M31 21c-2-4-7-6-11-4 1 4 5 6 11 4z" fill="#3E6A30"/>' +
    '<path d="M32 24c-4-3-11-3-15 1-5 5-5 15-1 23 3 6 8 9 12 9 2 0 3-1 4-1s2 1 4 1c4 0 9-3 12-9 4-8 4-18-1-23-4-4-11-4-15-1z" fill="#8B1E14"/>' +
    '<path d="M48 31c5 0 8 3 7 7s-5 6-9 5" fill="none" stroke="#8B1E14" stroke-width="3.5" stroke-linecap="round"/>' +
    '</g></svg>'
  );

  function watchImage(img) {
    const box = img.closest('.media');
    if (!box) return;
    const done = () => box.classList.add('is-loaded');
    const fail = () => {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.removeAttribute('srcset');
      img.src = FALLBACK_SRC;
      img.alt = `${img.alt} (photo unavailable)`;
      box.classList.add('is-fallback');
      done();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', fail, { once: true });
    if (img.complete) {
      if (img.naturalWidth > 0) done();
      else if (img.currentSrc || img.src) fail();
    }
  }

  // ---------- Menu cards ----------
  const grid = $('#menu-grid');

  function cardHTML(item) {
    const [w, h] = item.ratio;
    return `
      <article class="card" data-category="${item.category}">
        <figure class="media card__media">
          <img src="${unsplash(item.img, 800)}"
               srcset="${unsplash(item.img, 400)} 400w, ${unsplash(item.img, 800)} 800w, ${unsplash(item.img, 1200)} 1200w"
               sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
               width="${w}" height="${h}" style="aspect-ratio:${w}/${h}"
               alt="${item.alt}" loading="lazy" decoding="async">
          <span class="card__tag">${item.category === 'drinks' ? 'Drinks' : 'Mains'}</span>
        </figure>
        <div class="card__body">
          <h3 class="card__title">${item.name}</h3>
          <p class="card__desc">${item.desc}</p>
          <div class="card__foot">
            <span class="card__price">${item.price.toFixed(2)}<small>${CURRENCY}</small></span>
            <button class="btn btn--red card__add magnetic" type="button" data-add="${item.id}"
                    aria-label="Add ${item.name} to cart">Add to cart</button>
          </div>
        </div>
      </article>`;
  }

  grid.innerHTML = MENU.map(cardHTML).join('');
  $$('.media img').forEach(watchImage);

  // ---------- Filters ----------
  $$('.filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('.filter').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('.card', grid).forEach((card) => {
        const show = f === 'all' || card.dataset.category === f;
        if (show) {
          card.hidden = false;
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-out')));
        } else {
          card.classList.add('is-out');
          setTimeout(() => { if (card.classList.contains('is-out')) card.hidden = true; }, REDUCED ? 0 : 320);
        }
      });
    });
  });

  // ---------- Cart ----------
  const lines = new Map(); // id -> qty
  const countEl = $('#cart-count');
  const cartBtn = $('#cart-btn');
  const listEl = $('#cart-list');
  const totalEl = $('#cart-total');
  const orderLink = $('#cart-whatsapp');

  function renderCart() {
    let count = 0;
    let total = 0;
    const rows = [];
    const text = [];
    lines.forEach((qty, id) => {
      const item = MENU.find((m) => m.id === id);
      count += qty;
      total += qty * item.price;
      text.push(`${qty} x ${item.name}`);
      rows.push(`
        <li class="cart__item">
          <div>
            <div class="cart__item-name">${item.name}</div>
            <div class="cart__item-price">${money(item.price)}</div>
          </div>
          <div class="qty">
            <button type="button" data-dec="${id}" aria-label="Remove one ${item.name}">−</button>
            <span>${qty}</span>
            <button type="button" data-inc="${id}" aria-label="Add one ${item.name}">+</button>
          </div>
        </li>`);
    });
    listEl.innerHTML = rows.length ? rows.join('') : '<li class="cart__empty">Your cart is empty.</li>';
    totalEl.textContent = money(total);
    countEl.textContent = String(count);
    cartBtn.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
    const msg = text.length ? `Hello Mela Rossa, I would like to order:\n${text.join('\n')}` : 'Hello Mela Rossa';
    orderLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  function bump() {
    countEl.classList.remove('is-bump');
    void countEl.offsetWidth;
    countEl.classList.add('is-bump');
  }

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (add) { lines.set(add.dataset.add, (lines.get(add.dataset.add) || 0) + 1); renderCart(); bump(); }
    if (inc) { lines.set(inc.dataset.inc, lines.get(inc.dataset.inc) + 1); renderCart(); bump(); }
    if (dec) {
      const q = lines.get(dec.dataset.dec) - 1;
      if (q > 0) lines.set(dec.dataset.dec, q); else lines.delete(dec.dataset.dec);
      renderCart();
    }
  });

  // open / close helpers for overlays (opacity and transform only)
  function openLayer(el) {
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-open');
  }
  function closeLayer(el) {
    el.classList.remove('is-open');
    const hide = () => { if (!el.classList.contains('is-open')) el.hidden = true; };
    if (REDUCED) hide(); else setTimeout(hide, 600);
  }

  function openCart() {
    openLayer(scrim); openLayer(cart);
    cart.setAttribute('aria-hidden', 'false');
    $('#cart-close').focus();
  }
  function closeCart() {
    closeLayer(cart); closeLayer(scrim);
    cart.setAttribute('aria-hidden', 'true');
    cartBtn.focus();
  }
  cartBtn.addEventListener('click', openCart);
  $('#cart-close').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);
  renderCart();

  // ---------- Mobile nav ----------
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
  });
  $$('.nav__link', links).forEach((a) => a.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
  }));

  // nav background on scroll, current section link
  const nav = $('.nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { nav.classList.toggle('is-scrolled', window.scrollY > 20); ticking = false; });
  }, { passive: true });

  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$('.nav__link').forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionIO.observe(s));

  // ---------- Pattern A: Snap-In headings ----------
  function splitHeading(el) {
    const words = el.textContent.trim().split(/\s+/);
    let i = 0;
    el.innerHTML = words.map((w) => {
      const chars = Array.from(w).map((c) => `<span class="char" style="--i:${i++}">${c}</span>`).join('');
      i++;
      return `<span class="word" aria-hidden="true">${chars}</span>`;
    }).join(' ');
  }
  const heads = $$('.split');
  heads.forEach(splitHeading);
  const headIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); headIO.unobserve(en.target); }
    });
  }, { threshold: 0.3 });
  heads.forEach((h) => (REDUCED ? h.classList.add('is-in') : headIO.observe(h)));

  // ---------- Pattern B: 3D card tilt ----------
  if (!REDUCED && FINE_POINTER) {
    const MAX_TILT = 12;
    $$('.card', grid).forEach((card) => {
      let frame = 0;
      let px = 0.5;
      let py = 0.5;
      const apply = () => {
        frame = 0;
        const rx = (0.5 - py) * 2 * MAX_TILT;
        const ry = (px - 0.5) * 2 * MAX_TILT;
        card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      };
      card.addEventListener('pointerenter', () => card.classList.add('is-hover', 'is-tilting'));
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width;
        py = (e.clientY - r.top) / r.height;
        if (!frame) frame = requestAnimationFrame(apply);
      });
      card.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.classList.remove('is-hover', 'is-tilting');
        card.style.transform = ''; // eased back by the spring transition
      });
    });
  }

  // ---------- Pattern C: magnetic CTAs, nav links, cart ----------
  if (!REDUCED && FINE_POINTER) {
    const FIELD = 40;
    const PULL = 0.25;
    const mags = $$('.magnetic');
    let mx = -9999;
    let my = -9999;
    let queued = false;
    const update = () => {
      queued = false;
      mags.forEach((el) => {
        if (el.closest('.card.is-tilting')) return;
        const r = el.getBoundingClientRect();
        const inside = mx > r.left - FIELD && mx < r.right + FIELD && my > r.top - FIELD && my < r.bottom + FIELD;
        if (inside) {
          const dx = (mx - (r.left + r.width / 2)) * PULL;
          const dy = (my - (r.top + r.height / 2)) * PULL;
          el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
          el.dataset.pulled = '1';
        } else if (el.dataset.pulled) {
          el.style.transform = '';
          delete el.dataset.pulled;
        }
      });
    };
    window.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = my = -9999; requestAnimationFrame(update); });
  }

  // ---------- Pattern D: infinite ticker ----------
  (function ticker() {
    const wrap = $('.ticker');
    const track = $('#ticker-track');
    const group = $('.ticker__group', track);
    if (REDUCED) return;

    // clone the group until the track covers twice the viewport
    const fill = () => {
      $$('.ticker__group[data-clone]', track).forEach((n) => n.remove());
      const need = Math.ceil((window.innerWidth * 2) / group.offsetWidth) + 1;
      for (let i = 0; i < need; i++) {
        const c = group.cloneNode(true);
        c.dataset.clone = '1';
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
    };
    fill();
    window.addEventListener('resize', fill);

    const BASE = 0.6;   // px per frame
    const SLOW = 0.15;
    let speed = BASE;
    let target = BASE;
    let x = 0;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let visible = true;

    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(wrap);

    wrap.addEventListener('pointerenter', () => { target = SLOW; });
    wrap.addEventListener('pointerleave', () => { target = BASE; });
    wrap.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; velocity = 0;
      wrap.classList.add('is-dragging');
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      x += dx;
      velocity = dx;
    });
    const release = () => { dragging = false; wrap.classList.remove('is-dragging'); };
    wrap.addEventListener('pointerup', release);
    wrap.addEventListener('pointercancel', release);

    const loop = () => {
      if (visible) {
        const w = group.offsetWidth;
        if (!dragging) {
          speed += (target - speed) * 0.06;
          velocity *= 0.94;              // momentum decay after a drag
          x += velocity - speed;
        }
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  })();

  // ---------- Gallery lightbox ----------
  const lbImg = $('#lightbox-img');
  let lastFocus = null;
  function openLightbox(img) {
    lastFocus = document.activeElement;
    const base = img.currentSrc.split('?')[0];
    lbImg.src = img.dataset.fallback ? img.src : unsplash(base, 1200);
    lbImg.alt = img.alt;
    lbImg.width = img.width && img.naturalWidth ? img.naturalWidth : 1200;
    lbImg.height = img.height && img.naturalHeight ? img.naturalHeight : 800;
    openLayer(lightbox);
    lightbox.setAttribute('aria-hidden', 'false');
    $('#lightbox-close').focus();
  }
  function closeLightbox() {
    closeLayer(lightbox);
    lightbox.setAttribute('aria-hidden', 'true');
    if (lastFocus) lastFocus.focus();
  }
  $$('.gallery__item').forEach((btn) => btn.addEventListener('click', () => openLightbox($('img', btn))));
  $('#lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (lightbox.classList.contains('is-open')) closeLightbox();
    else if (cart.classList.contains('is-open')) closeCart();
  });

  // ---------- Booking form -> WhatsApp ----------
  const form = $('#booking-form');
  const errEl = $('#booking-error');
  const today = new Date();
  $('#b-date').min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('input[required], select[required]', form);
    let ok = true;
    fields.forEach((f) => {
      const bad = !f.value.trim() || !f.checkValidity();
      f.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) {
      errEl.textContent = 'Please fill in your name, phone, date, time (10:00 to 23:00), guests and branch.';
      return;
    }
    errEl.textContent = '';
    const d = Object.fromEntries(new FormData(form).entries());
    const msg = [
      'Hello Mela Rossa, I would like to book a table.',
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      `Date: ${d.date}`,
      `Time: ${d.time}`,
      `Guests: ${d.guests}`,
      `Branch: ${d.branch}`,
      d.notes ? `Notes: ${d.notes}` : ''
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();
