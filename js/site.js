/* Le Jour, vision prototype. Plain JS, no build step. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- header: follows the surface below, shrinks on scroll ---------- */
  var hdr = $("#hdr");
  var surfaces = $$("[data-surface]");
  function onScrollHeader() {
    if (!hdr) return;
    var y = window.scrollY || 0;
    hdr.classList.toggle("is-small", y > 40);
    doc.classList.toggle("is-scrolled", y > 40);
    var probe = (y > 40 ? 56 : 72) - 2;
    var cur = "dark";
    for (var i = 0; i < surfaces.length; i++) {
      var r = surfaces[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { cur = surfaces[i].getAttribute("data-surface"); }
    }
    hdr.classList.toggle("is-light", cur === "light");
    hdr.classList.toggle("is-paper", cur === "paper");
  }

  /* ---------- mega menu ---------- */
  var megaBtn = $("#mega-btn"), mega = $("#mega"), megaScrim = $("#mega-scrim"), megaTimer;
  function megaSet(open) {
    if (!mega) return;
    mega.classList.toggle("open", open);
    megaScrim.classList.toggle("open", open);
    megaBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (megaBtn && mega) {
    megaBtn.addEventListener("click", function () { megaSet(megaBtn.getAttribute("aria-expanded") !== "true"); });
    var hoverable = window.matchMedia("(hover: hover)").matches;
    if (hoverable) {
      [megaBtn, mega].forEach(function (el) {
        el.addEventListener("mouseenter", function () { clearTimeout(megaTimer); megaSet(true); });
        el.addEventListener("mouseleave", function () { megaTimer = setTimeout(function () { megaSet(false); }, 180); });
      });
    }
    megaScrim.addEventListener("click", function () { megaSet(false); });
    mega.addEventListener("focusout", function (e) { if (!mega.contains(e.relatedTarget) && e.relatedTarget !== megaBtn) megaSet(false); });
  }

  /* ---------- overlays ---------- */
  var scrim = $("#scrim");
  var lastFocus = null;
  function openPanel(panel, focusEl) {
    lastFocus = document.activeElement;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (scrim && panel.id !== "mnav") scrim.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { (focusEl || panel.querySelector("button, a, input")).focus(); }, 60);
  }
  function closePanel(panel) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    if (scrim) scrim.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  function bindPanel(btnSel, panelSel, closeSel, focusSel) {
    var b = $(btnSel), p = $(panelSel);
    if (!b || !p) return;
    b.addEventListener("click", function () { openPanel(p, focusSel ? $(focusSel) : null); });
    $$(closeSel, p).forEach(function (c) { c.addEventListener("click", function () { closePanel(p); }); });
  }
  bindPanel("#menu-btn", "#mnav", "[data-close]");
  bindPanel("#search-btn", "#search", "[data-close]", "#search-input");
  bindPanel("#bag-btn", "#bag", "[data-close]");
  if (scrim) scrim.addEventListener("click", function () { $$(".drawer.open, .search.open").forEach(closePanel); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      $$(".drawer.open, .search.open, .mnav.open").forEach(closePanel);
      megaSet(false);
      var z = $(".zoom-full.open"); if (z) z.classList.remove("open");
    }
  });

  /* search filter */
  var si = $("#search-input");
  if (si) si.addEventListener("input", function () {
    var q = si.value.trim().toLowerCase();
    $$("#search li").forEach(function (li) { li.classList.toggle("hide", q && li.textContent.toLowerCase().indexOf(q) < 0); });
  });

  /* ---------- bag (mock) ---------- */
  function renderBag() {
    var items = store.get("lj-bag") || [];
    $$(".bag-dot").forEach(function (d) { d.classList.toggle("on", items.length > 0); });
    var body = $("#bag-body");
    if (!body) return;
    if (!items.length) { body.innerHTML = '<p class="bag-empty">Your bag is empty. Good watches are worth the wait.</p>'; return; }
    var it = items[items.length - 1];
    body.innerHTML = '<div class="bag-item"><div class="media"><img src="' + it.img + '" alt="" width="96" height="96"></div><div><div style="font-weight:500">' + it.name + '</div><div class="label muted" style="margin:4px 0 8px">' + it.ref + '</div><div class="price" style="font-size:1rem">' + it.price + '</div></div></div>' +
      (items.length > 1 ? '<p class="small muted" style="margin-top:14px">' + items.length + ' watches in your bag.</p>' : "");
  }
  $$("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      var items = store.get("lj-bag") || [];
      items.push({ name: b.getAttribute("data-name"), ref: b.getAttribute("data-ref"), price: b.getAttribute("data-price"), img: b.getAttribute("data-img") });
      store.set("lj-bag", items.slice(-3));
      renderBag();
      var bag = $("#bag"); if (bag) setTimeout(function () { openPanel(bag); }, 140);
    });
  });
  var clr = $("#bag-clear");
  if (clr) clr.addEventListener("click", function () { store.set("lj-bag", []); renderBag(); });
  renderBag();

  /* ---------- pusher feel on primary buttons ---------- */
  $$(".btn-primary, .pusher").forEach(function (b) {
    b.addEventListener("click", function () {
      b.classList.add("is-pressed");
      setTimeout(function () { b.classList.remove("is-pressed"); }, 125);
    });
  });

  /* ---------- demo forms ---------- */
  $$("form[data-demo]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = f.querySelector(".form-note");
      if (n) n.textContent = f.getAttribute("data-demo");
    });
  });

  /* ---------- reveal and minuterie rules ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  $$("[data-reveal], .rule[data-draw], [data-line]").forEach(function (el) {
    if (io && !reduce) io.observe(el); else el.classList.add("in");
  });

  /* ---------- hero: ring draws, then the red hand ticks 8 beats a second ---------- */
  var heroRing = $("#hero-ring");
  if (heroRing) {
    $$(".draw", heroRing).forEach(function (p) {
      var L = p.getTotalLength ? p.getTotalLength() : 2000;
      p.style.setProperty("--len", Math.ceil(L));
    });
    var hand = $("#hero-hand");
    if (reduce) { heroRing.classList.remove("pre"); }
    else {
      requestAnimationFrame(function () { requestAnimationFrame(function () { heroRing.classList.remove("pre"); }); });
      var t0 = null;
      setTimeout(function () {
        hand.style.opacity = 1;
        (function tick(ts) {
          if (t0 === null) t0 = ts;
          var beats = Math.floor((ts - t0) / 125);
          hand.setAttribute("transform", "rotate(" + (beats * 0.75) % 360 + " 300 300)");
          requestAnimationFrame(tick);
        })(performance.now());
      }, 1200);
    }
  }

  /* ---------- roulette counter: 354 down to 300 ---------- */
  $$("[data-roulette-from]").forEach(function (el) {
    var from = +el.getAttribute("data-roulette-from"), to = +el.getAttribute("data-roulette-to");
    var out = el.querySelector(".digits");
    function paint(v) {
      out.innerHTML = String(v).split("").map(function (d) { return '<span class="d">' + d + "</span>"; }).join("");
    }
    paint(reduce ? to : from);
    if (reduce || !io) { paint(to); return; }
    var o = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      var v = from;
      var iv = setInterval(function () { v -= 1; paint(v); if (v <= to) clearInterval(iv); }, 1400 / (from - to));
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* ---------- swatches (home, line pages) ---------- */
  $$("[data-swatches]").forEach(function (group) {
    var target = $(group.getAttribute("data-swatches"));
    var nameEl = $(group.getAttribute("data-name-target"));
    var linkEl = $(group.getAttribute("data-link-target"));
    $$(".sw", group).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".sw", group).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        if (nameEl) nameEl.textContent = b.getAttribute("data-name") + " · " + b.getAttribute("data-ref");
        if (linkEl && b.getAttribute("data-href")) linkEl.setAttribute("href", b.getAttribute("data-href"));
        if (target) crossfade(target, b.getAttribute("data-src"), b.getAttribute("data-srcset"), b.getAttribute("data-alt"));
      });
    });
  });
  function crossfade(box, src, srcset, alt) {
    var cur = box.querySelector("img:not(.next)");
    var nx = document.createElement("img");
    nx.className = "next"; nx.alt = alt || ""; nx.decoding = "async";
    if (srcset) nx.srcset = srcset;
    nx.sizes = cur.sizes || "100vw";
    nx.src = src; nx.width = cur.width; nx.height = cur.height;
    box.appendChild(nx);
    var done = function () {
      requestAnimationFrame(function () {
        nx.style.opacity = 1;
        setTimeout(function () { cur.remove(); nx.classList.remove("next"); nx.style.opacity = ""; }, reduce ? 0 : 260);
      });
    };
    if (nx.complete) done(); else nx.onload = done;
  }

  /* ---------- Read the dial ---------- */
  var DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  $$("[data-rtd]").forEach(function (box) {
    var svg = box.querySelector("svg");
    var g = function (s) { return svg.querySelector(s); };
    var chrono = g(".ch-hand"), hH = g(".h-hour"), hM = g(".h-min"), s9 = g(".sub-g9"), s12 = g(".sub-g12"), s6 = g(".sub-g6");
    var mk = g(".marker"), mkT = g(".marker text"), mkR = g(".marker rect");
    var mkTele = g(".marker-tele"), mkTeleT = g(".marker-tele text"), mkTeleR = g(".marker-tele rect");
    var tele = g(".tele-scale");
    var out = box.querySelector(".rtd-out");
    var startBtns = $$('[data-act="start"]', box), resetBtns = $$('[data-act="reset"]', box);
    var modeBtns = $$("[data-mode]", box);
    var mode = "tachy", running = false, acc = 0, t0 = 0, raf = null;
    var dDay = g(".dd-day"), dDate = g(".dd-date"), now = new Date();
    if (dDay) dDay.textContent = DAYS[now.getDay()];
    if (dDate) dDate.textContent = now.getDate();
    function rot(el, a) { if (el) el.style.transform = "rotate(" + a + "deg)"; }
    function elapsed() { return running ? acc + (performance.now() - t0) : acc; }
    function paintChrono(ms) {
      var beats = Math.floor(ms / 125);
      rot(chrono, beats * 0.75);
      rot(s12, (Math.floor(ms / 60000) % 30) * 12);
      rot(s6, ((ms / 3600000) % 12) * 30);
    }
    function paintTime() {
      if (reduce) { rot(hH, 305); rot(hM, 60); rot(s9, 180); return; }
      var d = new Date(), ms = d.getSeconds() * 1000 + d.getMilliseconds();
      rot(s9, Math.floor(ms / 125) * 0.75);
      rot(hM, (d.getMinutes() + d.getSeconds() / 60) * 6);
      rot(hH, ((d.getHours() % 12) + d.getMinutes() / 60) * 30);
    }
    function loop() {
      paintTime();
      if (running) paintChrono(elapsed());
      raf = requestAnimationFrame(loop);
    }
    paintTime();
    if (!reduce) loop(); else setInterval(paintTime, 1000);
    function place(group, rectEl, textEl, r, angle, label) {
      var a = angle * Math.PI / 180;
      var x = 300 + r * Math.sin(a), y = 300 - r * Math.cos(a);
      textEl.textContent = label;
      var w = Math.max(38, label.length * 11 + 18);
      rectEl.setAttribute("x", x - w / 2); rectEl.setAttribute("width", w);
      rectEl.setAttribute("y", y - 13); textEl.setAttribute("x", x); textEl.setAttribute("y", y + 1);
      group.classList.add("on");
    }
    function fmt(n, d) { return n.toFixed(d); }
    function result() {
      var t = Math.floor(elapsed() / 125) * 0.125;
      var ang = (t * 6) % 360;
      if (t <= 0) { out.innerHTML = ""; return; }
      if (mode === "tachy") {
        var v = 3600 / t;
        if (t < 7.2) { out.innerHTML = "1 km in <span class='val'>" + fmt(t, 1) + " s</span>. Faster than the scale. Even 1980 didn't go that fast."; mk.classList.remove("on"); return; }
        if (t > 60) { out.innerHTML = "1 km in <span class='val'>" + fmt(t, 1) + " s</span>. Under 60 km/h. The scale stops here. Enjoy the view."; mk.classList.remove("on"); return; }
        var kmh = Math.round(v);
        place(mk, mkR, mkT, 262, ang, String(kmh));
        var tail = kmh > 120 ? " Slow down, you're on a pass road." : kmh > 80 ? " A good pace for an empty road." : " Plenty of time to look at the view.";
        out.innerHTML = "1 km in <span class='val'>" + fmt(t, 1) + " seconds</span>. That's <span class='val'>" + kmh + " km/h</span>." + tail;
      } else {
        var km = t * 0.343;
        if (km > 20) { out.innerHTML = "Thunder after <span class='val'>" + fmt(t, 1) + " s</span>. More than 20 km away. Far enough to watch."; mkTele.classList.remove("on"); return; }
        place(mkTele, mkTeleR, mkTeleT, 196, ang, fmt(km, 1));
        out.innerHTML = "Thunder after <span class='val'>" + fmt(t, 1) + " seconds</span>. The storm is <span class='val'>" + fmt(km, 1) + " km</span> away." + (km < 3 ? " Time to head in." : " Keep an eye on it.");
      }
    }
    function startStop() {
      if (!running) {
        running = true; t0 = performance.now();
        mk.classList.remove("on"); mkTele.classList.remove("on");
        out.textContent = mode === "tachy" ? "Running. Stop it at the next kilometre marker." : "Running. Stop it when you hear the thunder.";
        if (reduce) (function step() { if (running) { paintChrono(elapsed()); requestAnimationFrame(step); } })();
      } else {
        acc = elapsed(); running = false; paintChrono(acc); result();
      }
      startBtns.forEach(function (b) { b.setAttribute("aria-pressed", running ? "true" : "false"); });
    }
    function reset() {
      running = false; acc = 0;
      mk.classList.remove("on"); mkTele.classList.remove("on");
      if (!reduce) { svg.classList.add("resetting"); setTimeout(function () { svg.classList.remove("resetting"); }, 600); }
      rot(chrono, 0); rot(s12, 0); rot(s6, 0);
      out.textContent = mode === "tachy" ? "Press start as you pass a kilometre marker." : "Count from the flash to the thunder. Press start at the flash.";
      startBtns.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    }
    startBtns.forEach(function (b) { b.addEventListener("click", startStop); });
    resetBtns.forEach(function (b) { b.addEventListener("click", reset); });
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-mode");
        modeBtns.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        if (tele) tele.style.opacity = mode === "tele" ? 1 : 0.5;
        reset();
      });
    });
    box.addEventListener("keydown", function (e) {
      if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      if (e.key === " ") { e.preventDefault(); startStop(); }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); reset(); }
    });
    reset();
  });

  /* ---------- PDP gallery, swatches and loupe ---------- */
  var gal = $("[data-gallery]");
  if (gal) {
    var main = $(".g-main", gal), mainImg = $(".g-main img", gal), loupe = $(".loupe", gal), thumbs = $$(".g-thumbs button", gal);
    var zoom = $(".zoom-full"), zoomImg = zoom ? zoom.querySelector("img") : null;
    var cur = { ref: gal.getAttribute("data-ref"), idx: 0 };
    var keys = ["ga", "gb", "gc", "gd"];
    function srcFor(ref, i, w) { return "img/" + ref + "-" + keys[i] + "-" + w + ".webp"; }
    function show(i) {
      cur.idx = i;
      thumbs.forEach(function (t, k) { t.setAttribute("aria-current", k === i ? "true" : "false"); });
      mainImg.classList.toggle("is-photo", i >= 2);
      mainImg.style.opacity = 0;
      setTimeout(function () {
        mainImg.src = srcFor(cur.ref, i, 960);
        mainImg.srcset = srcFor(cur.ref, i, 960) + " 960w, " + srcFor(cur.ref, i, 2000) + " 2000w";
        mainImg.alt = thumbs[i].getAttribute("data-alt");
        mainImg.style.opacity = 1;
      }, reduce ? 0 : 140);
    }
    thumbs.forEach(function (t, k) { t.addEventListener("click", function () { show(k); }); });
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine && loupe) {
      main.addEventListener("mouseenter", function () { loupe.style.backgroundImage = "url(" + srcFor(cur.ref, cur.idx, 2000) + ")"; loupe.classList.add("on"); });
      main.addEventListener("mouseleave", function () { loupe.classList.remove("on"); });
      main.addEventListener("mousemove", function (e) {
        var r = main.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, z = 2.5;
        loupe.style.left = x + "px"; loupe.style.top = y + "px";
        loupe.style.backgroundSize = (r.width * z) + "px " + (r.height * z) + "px";
        loupe.style.backgroundPosition = (-(x * z) + 110) + "px " + (-(y * z) + 110) + "px";
      });
    }
    main.addEventListener("click", function () {
      if (fine || !zoom) return;
      zoomImg.src = srcFor(cur.ref, cur.idx, 2000);
      zoom.classList.add("open");
      zoom.querySelector(".x").focus();
    });
    if (zoom) zoom.querySelector(".x").addEventListener("click", function () { zoom.classList.remove("open"); main.focus(); });
    main.addEventListener("keydown", function (e) { if (e.key === "Enter" && !fine && zoom) main.click(); });

    var sws = $$(".buybox .sw");
    function choose(b, push) {
      sws.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      cur.ref = b.getAttribute("data-ref").toLowerCase();
      $("#pdp-colour").textContent = b.getAttribute("data-name");
      $("#pdp-ref").textContent = b.getAttribute("data-ref");
      $$("[data-ref-text]").forEach(function (el) { el.textContent = b.getAttribute("data-ref"); });
      var last = $(".crumbs [aria-current]"); if (last) last.textContent = (b.getAttribute("data-name") + " · " + b.getAttribute("data-ref")).toUpperCase();
      thumbs.forEach(function (t, k) { t.querySelector("img").src = srcFor(cur.ref, k, 960); });
      var add = $("#pdp-add");
      add.setAttribute("data-ref", b.getAttribute("data-ref"));
      add.setAttribute("data-name", "Corsa Master Chronograph 42 · " + b.getAttribute("data-name"));
      add.setAttribute("data-img", srcFor(cur.ref, 0, 960));
      document.title = "Corsa Master Chronograph 42, " + b.getAttribute("data-name") + " (" + b.getAttribute("data-ref") + ") | Le Jour";
      if (push && history.replaceState) history.replaceState(null, "", "#" + cur.ref);
      show(0);
    }
    sws.forEach(function (b) { b.addEventListener("click", function () { choose(b, true); }); });
    var h = (location.hash || "").slice(1).toLowerCase();
    if (h) { var m = sws.filter(function (b) { return b.getAttribute("data-ref").toLowerCase() === h; })[0]; if (m) choose(m, false); }
  }

  /* ---------- then and now ---------- */
  $$("[data-tn]").forEach(function (tn) {
    var r = tn.querySelector("input");
    var set = function () { tn.style.setProperty("--pos", r.value + "%"); };
    r.addEventListener("input", set); set();
  });

  /* ---------- heritage: the bezel turns with the scroll, years click in at twelve ---------- */
  var her = $("[data-her]");
  if (her) {
    var bz = $(".bz svg.r", her), yb = $(".yr b", her), ys = $(".yr span", her);
    var chaps = $$(".chap[data-year]", her);
    var turn = function () {
      var r = her.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / r.height));
      if (bz && !reduce) bz.style.transform = "rotate(" + (-p * 360) + "deg)";
    };
    if (io) {
      var cio = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) {
            yb.textContent = e.target.getAttribute("data-year");
            ys.textContent = e.target.getAttribute("data-mark");
          }
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      chaps.forEach(function (c) { cio.observe(c); });
    }
    window.addEventListener("scroll", function () { requestAnimationFrame(turn); }, { passive: true });
    turn();
  }

  /* ---------- collection filters ---------- */
  var fl = $("[data-filters]");
  if (fl) {
    var cards = $$("[data-card]");
    var sel = $$("select", fl);
    var countEl = $(".count", fl);
    var apply = function () {
      var v = {}; sel.forEach(function (s) { v[s.name] = s.value; });
      var n = 0;
      cards.forEach(function (c) {
        var ok = (!v.family || c.dataset.fam === v.family) && (!v.size || c.dataset.size === v.size) &&
          (!v.movement || c.dataset.move === v.movement) && (!v.case || c.dataset.case === v.case) &&
          (!v.price || (+c.dataset.price <= +v.price));
        c.hidden = !ok; if (ok) n++;
      });
      $$("[data-group]").forEach(function (gp) {
        var grid = gp.querySelector(".cards");
        var list = $$("[data-card]", grid);
        if (v.sort) {
          list.sort(function (a, b) {
            if (v.sort === "price-asc") return a.dataset.price - b.dataset.price;
            if (v.sort === "price-desc") return b.dataset.price - a.dataset.price;
            if (v.sort === "size") return a.dataset.size - b.dataset.size;
            return a.dataset.order - b.dataset.order;
          }).forEach(function (c) { grid.appendChild(c); });
        }
        gp.hidden = !list.some(function (c) { return !c.hidden; });
      });
      if (countEl) countEl.textContent = n + (n === 1 ? " watch" : " watches");
      var empty = $(".empty-note"); if (empty) empty.style.display = n ? "none" : "block";
    };
    sel.forEach(function (s) { s.addEventListener("change", apply); });
    var fp = new URLSearchParams(location.search).get("family");
    if (fp) { var fs = sel.filter(function (s) { return s.name === "family"; })[0]; if (fs) fs.value = fp; }
    apply();
  }

  /* ---------- journal tabs ---------- */
  var tabs = $("[data-tabs]");
  if (tabs) {
    var tb = $$("button", tabs);
    tb.forEach(function (b) {
      b.addEventListener("click", function () {
        tb.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var c = b.getAttribute("data-cat");
        $$("[data-cat-item]").forEach(function (it) { it.hidden = c !== "all" && it.getAttribute("data-cat-item") !== c; });
      });
    });
  }

  /* ---------- brand book demos ---------- */
  $$("[data-tick-demo]").forEach(function (el) {
    var h = el.querySelector(".h");
    if (reduce) return;
    (function step(ts) { h.setAttribute("transform", "rotate(" + (Math.floor(ts / 125) * 0.75) % 360 + " 60 60)"); requestAnimationFrame(step); })(0);
  });
  $$("[data-ease-demo]").forEach(function (el) {
    var dot = el.querySelector("i");
    el.closest(".demo").querySelector("button").addEventListener("click", function () {
      dot.style.transition = "none"; dot.style.left = "0";
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        dot.style.transition = "left " + (reduce ? 0 : 640) + "ms " + el.getAttribute("data-ease-demo");
        dot.style.left = "calc(100% - 18px)";
      }); });
    });
  });
  $$("[data-redraw]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = $(b.getAttribute("data-redraw"));
      r.classList.remove("in"); void r.offsetWidth;
      setTimeout(function () { r.classList.add("in"); }, 40);
    });
  });

  /* ---------- chrono scroll: page progress as a 30 minute counter ---------- */
  var cs = $("#cscroll");
  if (cs) {
    var ch = cs.querySelector(".h");
    var first = $("main > section");
    var csUpdate = function () {
      var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      var show = y > (first ? first.offsetHeight * 0.6 : 400);
      cs.classList.toggle("on", show);
      if (!cs.classList.contains("resetting")) ch.style.transform = "rotate(" + (max > 0 ? (y / max) * 360 : 0) + "deg)";
    };
    cs.addEventListener("click", function () {
      cs.classList.add("resetting");
      ch.style.transform = "rotate(0deg)";
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { cs.classList.remove("resetting"); }, 900);
    });
    window.addEventListener("scroll", function () { requestAnimationFrame(csUpdate); }, { passive: true });
    csUpdate();
  }

  window.addEventListener("scroll", function () { requestAnimationFrame(onScrollHeader); }, { passive: true });
  window.addEventListener("resize", onScrollHeader);
  onScrollHeader();
})();
