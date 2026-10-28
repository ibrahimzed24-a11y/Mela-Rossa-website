/* Mela Rossa — Arabic shared script (vanilla, no libraries) */
(function () {
  "use strict";
  if (window.__mrAr) return; window.__mrAr = true;
  var CURRENCY = "ج.م";
  var WA = "201280060772";
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var rtl = (root.getAttribute("dir") || "rtl") === "rtl";
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  try {
    /* Prices: one currency constant for every price on the page */
    $$(".cur").forEach(function (el) { el.textContent = CURRENCY; });

    /* Mobile menu */
    var nav = document.querySelector(".nav"), tog = document.querySelector(".toggle");
    if (nav && tog) {
      tog.addEventListener("click", function () {
        var open = nav.classList.toggle("open");
        tog.setAttribute("aria-expanded", open ? "true" : "false");
        tog.setAttribute("aria-label", open ? "اقفل القائمة" : "افتح القائمة");
      });
      $$(".nav__links a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); tog.setAttribute("aria-expanded", "false"); }); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") { nav.classList.remove("open"); tog.setAttribute("aria-expanded", "false"); } });
    }

    /* Arabic headings animate by whole words, never by letters (keeps the letters joined) */
    $$(".words").forEach(function (h) {
      if (h.dataset.split) return; h.dataset.split = "1";
      var txt = h.textContent.trim(); h.setAttribute("aria-label", txt); h.textContent = "";
      txt.split(/\s+/).forEach(function (w, i, a) {
        var s = document.createElement("span"); s.className = "w"; s.setAttribute("aria-hidden", "true");
        s.style.transitionDelay = (i * 0.08) + "s"; s.textContent = w; h.appendChild(s);
        if (i < a.length - 1) h.appendChild(document.createTextNode(" "));
      });
    });

    /* Reveal on scroll */
    var targets = $$(".rv, .words");
    if ("IntersectionObserver" in window && !reduce) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      targets.forEach(function (t) { io.observe(t); });
    } else { root.classList.add("done"); }

    /* Image upgrade: fade in each photo once it has loaded; never leave one hidden */
    $$("img[data-up]").forEach(function (img) {
      if (reduce) return;
      function ok() { img.classList.add("ok"); }
      if (img.complete && img.naturalWidth) return;
      img.classList.add("img-up");
      img.addEventListener("load", ok); img.addEventListener("error", ok);
      setTimeout(ok, 3000);
    });

    /* Magnetic CTAs */
    if (fine && !reduce) {
      $$(".mag").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
          el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        });
        el.addEventListener("pointerleave", function () { el.style.transform = ""; });
      });
      /* Card tilt, mirrored for RTL */
      $$(".tilt").forEach(function (c) {
        c.addEventListener("pointermove", function (e) {
          var r = c.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          var ry = (rtl ? -1 : 1) * px * 8, rx = -py * 8;
          c.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        });
        c.addEventListener("pointerleave", function () { c.style.transform = ""; });
      });
    }

    /* Menu: search + section tabs */
    var q = document.getElementById("q");
    if (q) {
      var secs = $$(".msec"), tabs = $$(".tab"), empty = document.getElementById("empty");
      var norm = function (s) { return (s || "").toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[ً-ْـ]/g, ""); };
      q.addEventListener("input", function () {
        var v = norm(q.value.trim()), any = false;
        secs.forEach(function (s) {
          var shown = 0;
          $$(".it, tbody tr", s).forEach(function (it) {
            var hit = !v || norm(it.textContent).indexOf(v) > -1;
            it.hidden = !hit; if (hit) shown++;
          });
          $$(".sub", s).forEach(function (h) {
            var list = h.nextElementSibling, vis = list ? $$(".it", list).some(function (i) { return !i.hidden; }) : true;
            h.hidden = !!v && !vis;
          });
          s.hidden = !!v && shown === 0; if (shown) any = true;
        });
        if (empty) empty.style.display = any ? "none" : "block";
      });
      if ("IntersectionObserver" in window) {
        var tio = new IntersectionObserver(function (ents) {
          ents.forEach(function (e) {
            if (!e.isIntersecting) return;
            tabs.forEach(function (t) {
              var on = t.getAttribute("href") === "#" + e.target.id;
              t.classList.toggle("on", on);
              if (on) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
              if (on && t.parentNode.scrollTo) t.parentNode.scrollTo({ left: t.offsetLeft - 40, behavior: reduce ? "auto" : "smooth" });
            });
          });
        }, { rootMargin: "-35% 0px -60% 0px" });
        secs.forEach(function (s) { tio.observe(s); });
      }
    }

    /* Booking form: opens WhatsApp with the details written in Arabic */
    var form = document.getElementById("book");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var f = form.elements;
        if (!form.reportValidity()) return;
        var lines = [
          "أهلاً ميلا روسا، حابب أحجز ترابيزة:",
          "الاسم: " + f.name.value.trim(),
          "رقم الموبايل: " + f.phone.value.trim(),
          "الفرع: " + f.branch.value,
          "التاريخ: " + f.date.value,
          "الساعة: " + f.time.value,
          "عدد الأفراد: " + f.guests.value,
          "المناسبة: " + f.occasion.value
        ];
        if (f.notes.value.trim()) lines.push("ملاحظات: " + f.notes.value.trim());
        lines.push("شكرًا ليكم 🌹");
        var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(lines.join("\n"));
        var w = window.open(url, "_blank", "noopener");
        if (!w) location.href = url;
      });
    }
  } catch (err) {
    root.classList.add("done");
  }
})();
