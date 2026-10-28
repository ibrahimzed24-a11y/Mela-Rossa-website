/* =========================================================
   Mela Rossa Restaurant & Cafe
   Vanilla ES6, no libraries. Motion only touches transform
   and opacity, driven by IntersectionObserver and
   requestAnimationFrame. Each feature runs on its own, so one
   failure never leaves the page half hidden.
   ========================================================= */

(() => {
  'use strict';
  if (window.__melaRossaInit) return; // inline copy and main.js: run once
  window.__melaRossaInit = true;

  const root = document.documentElement;
  root.classList.add('js');

  // ---------- Settings ----------
  const CURRENCY = 'EGP'; // PLACEHOLDER: confirm the currency shown with prices
  const WHATSAPP = '201280060772';
  const mq = (q) => (window.matchMedia ? window.matchMedia(q).matches : false);
  const REDUCED = mq('(prefers-reduced-motion: reduce)');
  const FINE_POINTER = mq('(hover: hover) and (pointer: fine)');
  const HAS_IO = 'IntersectionObserver' in window;

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const money = (n) => `${n.toFixed(2)} ${CURRENCY}`;
  const unsplash = (base, w) => `${base}?w=${w}&q=75&auto=format&fit=crop`;

  const safely = (name, fn) => {
    try { fn(); } catch (err) {
      root.classList.add('js-fallback');
      console.error(`Mela Rossa: ${name} failed`, err);
    }
  };

  const cart = $('#cart');
  const scrim = $('#scrim');
  const lightbox = $('#lightbox');
  const grid = $('#menu-grid');

  safely('year', () => { $('#year').textContent = String(new Date().getFullYear()); });

  // ---------- Image upgrades: fade in on load, branded fallback on error ----------
  const FALLBACK_SRC = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#1a1a1a"/>' +
    '<g transform="translate(168 108)">' +
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
      img.removeAttribute('sizes');
      img.src = FALLBACK_SRC;
      img.alt = `${img.alt} (photo unavailable)`;
      box.classList.add('is-fallback');
      done();
    };
    img.addEventListener('load', done);
    img.addEventListener('error', fail);
    if (img.complete) {
      if (img.naturalWidth > 0) done();
      else if (img.getAttribute('loading') !== 'lazy') fail(); // failed before this script ran
    }
  }
  safely('images', () => $$('.media img').forEach(watchImage));

  // ---------- Menu data, read from the cards in the HTML ----------
  const MENU = [];
  safely('menu', () => {
    $$('.card', grid).forEach((card) => {
      const price = parseFloat(card.dataset.price);
      MENU.push({ id: card.dataset.id, name: $('.card__title', card).textContent.trim(), price });
      $('.card__amount', card).textContent = price.toFixed(2);
      $('.card__currency', card).textContent = CURRENCY;
    });
  });

  // ---------- Filters ----------
  safely('filters', () => {
    const filters = $$('.filter');
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const f = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        $$('.card', grid).forEach((card) => {
          clearTimeout(card._hideTimer);
          const show = f === 'all' || card.dataset.category === f;
          if (show) {
            card.hidden = false;
            requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-out')));
          } else {
            card.classList.add('is-out');
            card._hideTimer = setTimeout(() => { card.hidden = true; }, REDUCED ? 0 : 320);
          }
        });
      });
    });
  });

  // ---------- Overlays (opacity and transform only) ----------
  function openLayer(el) {
    clearTimeout(el._hideTimer);
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('is-open');
  }
  function closeLayer(el) {
    el.classList.remove('is-open');
    const hide = () => { if (!el.classList.contains('is-open')) el.hidden = true; };
    if (REDUCED) hide(); else el._hideTimer = setTimeout(hide, 600);
  }

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
      if (!item) return;
      count += qty;
      total += qty * item.price;
      text.push(`${qty} x ${item.name} (${money(item.price * qty)})`);
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
    const msg = text.length
      ? `Hello Mela Rossa, I would like to order:\n${text.join('\n')}\nTotal: ${money(total)}`
      : 'Hello Mela Rossa';
    orderLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  function bump() {
    countEl.classList.remove('is-bump');
    void countEl.offsetWidth;
    countEl.classList.add('is-bump');
  }

  function openCart() {
    openLayer(scrim); openLayer(cart);
    cart.setAttribute('aria-hidden', 'false');
    $('#cart-close').focus();
  }
  function closeCart() {
    if (!cart.classList.contains('is-open')) return;
    closeLayer(cart); closeLayer(scrim);
    cart.setAttribute('aria-hidden', 'true');
    cartBtn.focus();
  }

  safely('cart', () => {
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      if (add) { const id = add.dataset.add; lines.set(id, (lines.get(id) || 0) + 1); renderCart(); bump(); }
      if (inc) { const id = inc.dataset.inc; lines.set(id, (lines.get(id) || 0) + 1); renderCart(); bump(); }
      if (dec) {
        const id = dec.dataset.dec;
        const q = (lines.get(id) || 0) - 1;
        if (q > 0) lines.set(id, q); else lines.delete(id);
        renderCart();
        if (!lines.has(id)) $('#cart-close').focus(); // the pressed button is gone
      }
    });
    cartBtn.addEventListener('click', openCart);
    $('#cart-close').addEventListener('click', closeCart);
    scrim.addEventListener('click', closeCart);
    renderCart();
  });

  // ---------- Mobile nav ----------
  const toggle = $('#nav-toggle');
  const links = $('#nav-links');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
  };
  const menuOpen = () => links.classList.contains('is-open');
  safely('mobile nav', () => {
    toggle.addEventListener('click', () => setMenu(!menuOpen()));
    $$('.nav__link', links).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('click', (e) => {
      if (menuOpen() && !e.target.closest('.nav')) setMenu(false);
    });
  });

  // ---------- Nav background on scroll, current section link ----------
  safely('nav state', () => {
    const nav = $('.nav');
    let ticking = false;
    const onScroll = () => { nav.classList.toggle('is-scrolled', window.scrollY > 20); ticking = false; };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    }, { passive: true });
    onScroll();
    if (!HAS_IO) return;
    const navLinks = $$('.nav__link');
    const sectionIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === `#${en.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sectionIO.observe(s));
  });

  // ---------- Pattern A: Snap-In headings ----------
  // The real text stays in a screen-reader span; the animated letters are aria-hidden.
  function splitHeading(el) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    let i = 0;
    text.split(' ').forEach((word, wi) => {
      if (wi) vis.appendChild(document.createTextNode(' '));
      const w = document.createElement('span');
      w.className = 'word';
      Array.from(word).forEach((c) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.style.setProperty('--i', String(i++));
        s.textContent = c;
        w.appendChild(s);
      });
      i++;
      vis.appendChild(w);
    });
    el.replaceChildren(sr, vis);
  }
  safely('headings', () => {
    const heads = $$('.split');
    if (REDUCED || !HAS_IO) { heads.forEach((h) => h.classList.add('is-in')); }
    heads.forEach(splitHeading);
    if (REDUCED || !HAS_IO) return;
    const headIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); headIO.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    heads.forEach((h) => headIO.observe(h));
  });

  // ---------- Pattern B: 3D card tilt ----------
  safely('tilt', () => {
    if (REDUCED || !FINE_POINTER) return;
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
  });

  // ---------- Pattern C: magnetic CTAs, nav links, cart ----------
  safely('magnetic', () => {
    if (REDUCED || !FINE_POINTER) return;
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
        if (!r.width) return; // hidden (closed mobile menu)
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
  });

  // ---------- Pattern D: infinite ticker (clones, hover slow, drag with momentum) ----------
  safely('ticker', () => {
    if (REDUCED) return; // static, wrapped list under reduced motion
    const wrap = $('.ticker');
    const track = $('#ticker-track');
    const group = $('.ticker__group', track);

    // clone the group until the track covers the strip twice over
    const fill = () => {
      $$('.ticker__group[data-clone]', track).forEach((n) => n.remove());
      const gw = group.offsetWidth;
      if (!gw) return;
      const need = Math.ceil((wrap.offsetWidth * 2) / gw) + 1;
      for (let i = 0; i < need; i++) {
        const c = group.cloneNode(true);
        c.dataset.clone = '1';
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
    };
    fill();
    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fill, 150); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fill); // widths change once fonts land

    const BASE = 0.6;   // px per frame
    const SLOW = 0.15;  // on hover
    let speed = BASE;
    let target = BASE;
    let x = 0;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let visible = true;

    if (HAS_IO) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(wrap);

    wrap.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') target = SLOW; });
    wrap.addEventListener('pointerleave', () => { target = BASE; });
    wrap.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true; lastX = e.clientX; velocity = 0;
      wrap.classList.add('is-dragging');
      try { wrap.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
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
    wrap.addEventListener('lostpointercapture', release);

    const loop = () => {
      if (visible) {
        const w = group.offsetWidth;
        if (!dragging) {
          speed += (target - speed) * 0.06;
          velocity *= 0.94; // momentum decay after a drag
          x += velocity - speed;
        }
        if (w) { x %= w; if (x > 0) x -= w; } // keep x in (-w, 0]
        track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });

  // ---------- Gallery lightbox ----------
  const lbImg = $('#lightbox-img');
  const lbClose = $('#lightbox-close');
  let lastFocus = null;
  function openLightbox(img) {
    lastFocus = document.activeElement;
    const src = img.currentSrc || img.src;
    lbImg.onerror = () => { lbImg.onerror = null; lbImg.src = src; };
    lbImg.src = img.dataset.fallback ? src : unsplash(src.split('?')[0], 1200);
    lbImg.alt = img.alt;
    lbImg.width = img.naturalWidth || Number(img.getAttribute('width')) || 1200;
    lbImg.height = img.naturalHeight || Number(img.getAttribute('height')) || 800;
    openLayer(lightbox);
    lightbox.setAttribute('aria-hidden', 'false');
    lbClose.focus();
  }
  function closeLightbox() {
    if (!lightbox.classList.contains('is-open')) return;
    closeLayer(lightbox);
    lightbox.setAttribute('aria-hidden', 'true');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  safely('lightbox', () => {
    $$('.gallery__item').forEach((btn) => btn.addEventListener('click', () => openLightbox($('img', btn))));
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  });

  // ---------- Keyboard: Esc closes the top layer, Tab stays inside open dialogs ----------
  safely('keyboard', () => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lightbox.classList.contains('is-open')) closeLightbox();
        else if (cart.classList.contains('is-open')) closeCart();
        else if (menuOpen()) { setMenu(false); toggle.focus(); }
        return;
      }
      if (e.key !== 'Tab') return;
      let layer = null;
      if (lightbox.classList.contains('is-open')) layer = lightbox;
      else if (cart.classList.contains('is-open')) layer = cart;
      if (!layer) return;
      const items = $$('button, a[href], input, select, textarea', layer).filter((n) => !n.disabled && n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!layer.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    });
  });

  // ---------- Booking form -> wa.me link ----------
  safely('booking', () => {
    const form = $('#booking-form');
    const errEl = $('#booking-error');
    const statusEl = $('#booking-status');
    const today = new Date();
    $('#b-date').min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fields = $$('input[required], select[required]', form);
      let ok = true;
      fields.forEach((f) => {
        let bad = !f.value.trim() || !f.checkValidity();
        if (f.name === 'phone' && f.value.replace(/\D/g, '').length < 7) bad = true;
        f.classList.toggle('is-invalid', bad);
        f.setAttribute('aria-invalid', String(bad));
        if (bad) ok = false;
      });
      if (!ok) {
        errEl.textContent = 'Please fill in your name, phone, date, time (10:00 to 23:00), guests (1 to 30) and branch.';
        statusEl.textContent = '';
        const firstBad = $('.is-invalid', form);
        if (firstBad) firstBad.focus();
        return;
      }
      errEl.textContent = '';
      const d = Object.fromEntries(new FormData(form).entries());
      const msg = [
        'Hello Mela Rossa, I would like to book a table.',
        `Name: ${d.name.trim()}`,
        `Phone: ${d.phone.trim()}`,
        `Date: ${d.date}`,
        `Time: ${d.time}`,
        `Guests: ${d.guests}`,
        `Branch: ${d.branch}`,
        d.notes && d.notes.trim() ? `Notes: ${d.notes.trim()}` : ''
      ].filter(Boolean).join('\n');
      const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
      form.dataset.whatsapp = url;

      statusEl.textContent = 'Your booking message is ready. If WhatsApp did not open, ';
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'tap here to send it';
      statusEl.appendChild(a);
      statusEl.appendChild(document.createTextNode('.'));
      a.click();
    });
  });

  // ---------- In-page links: scrolled by script so they also work from blob: and data: copies ----------
  safely('anchors', () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      if (id === 'main') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
      try { history.replaceState(null, '', '#' + id); } catch (_) { /* blob: and data: pages refuse */ }
    });
  });

  window.__melaRossaReady = true;
})();
