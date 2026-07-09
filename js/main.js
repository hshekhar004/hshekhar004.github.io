/* =====================================================================
   MAIN.JS — renders the site from SITE_CONTENT (+ local admin draft),
   drives cursor, animations, and the internal case pages.
   ===================================================================== */
(function () {
  "use strict";

  const LS_KEY = "hs_portfolio_draft_v2";
  function loadContent() {
    const base = window.SITE_CONTENT || {};
    try {
      const draft = localStorage.getItem(LS_KEY);
      if (draft) { const d = JSON.parse(draft); if (d && d.profile) return d; }
    } catch (e) {}
    return base;
  }
  const C0 = loadContent();
  window.__CONTENT = C0;
  window.__LS_KEY = LS_KEY;
  window.__ADMIN_AUTHED = false;   // admin.js flips this; drafts preview only for owner

  /* ---------- fonts ---------- */
  const FONTS = {
    editorial: { d: "'Archivo',sans-serif", b: "'Instrument Sans',sans-serif", m: "'IBM Plex Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Instrument+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap", name: "Editorial (Archivo)" },
    modernist: { d: "'Space Grotesk',sans-serif", b: "'Inter',sans-serif", m: "'Space Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;600&family=Space+Mono&display=swap", name: "Modernist (Space Grotesk)" },
    serif: { d: "'Fraunces',serif", b: "'Source Sans 3',sans-serif", m: "'IBM Plex Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Source+Sans+3:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap", name: "Serif authority (Fraunces)" },
    swiss: { d: "'Manrope',sans-serif", b: "'Manrope',sans-serif", m: "'JetBrains Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=JetBrains+Mono:wght@400;500&display=swap", name: "Swiss (Manrope)" },
    classic: { d: "'Newsreader',serif", b: "'Inter',sans-serif", m: "'IBM Plex Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,600;6..72,700&family=Inter:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap", name: "Classic consulting (Newsreader)" },
    sharp: { d: "'Sora',sans-serif", b: "'Inter',sans-serif", m: "'DM Mono',monospace",
      url: "https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&family=Inter:wght@400;600&family=DM+Mono&display=swap", name: "Sharp tech (Sora)" }
  };
  window.__FONTS = FONTS;

  /* ---------- settings ---------- */
  function contrastInk(hex) {
    const n = (hex || "#000").replace("#", "");
    const r = parseInt(n.substr(0, 2), 16), g = parseInt(n.substr(2, 2), 16), b = parseInt(n.substr(4, 2), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 165 ? "#111111" : "#ffffff";
  }
  function applySettings(s) {
    const root = document.documentElement;
    root.style.setProperty("--accent", s.accent);
    root.style.setProperty("--accent-ink", contrastInk(s.accent));
    root.setAttribute("data-tone", s.bgTone || "paper");
    root.setAttribute("data-anim", s.animation || "slide");
    root.style.setProperty("--bg", s.bgCustom || "");        // empty = preset value
    if (!s.bgCustom) root.style.removeProperty("--bg");
    if (s.textColor) { root.style.setProperty("--ink", s.textColor); }
    else root.style.removeProperty("--ink");
    document.body.style.fontSize = s.fontScale && s.fontScale !== 1 ? (17 * s.fontScale) + "px" : "";
    const f = FONTS[s.fontPair] || FONTS.editorial;
    root.style.setProperty("--font-display", f.d);
    root.style.setProperty("--font-body", f.b);
    root.style.setProperty("--font-mono", f.m);
    const link = document.getElementById("fontLink");
    if (link.getAttribute("href") !== f.url) link.setAttribute("href", f.url);
    document.body.classList.toggle("has-cursor", !!s.cursor && matchMedia("(pointer:fine)").matches);
  }
  window.__applySettings = applySettings;
  applySettings(C0.settings);

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  function statHTML(v) { return esc(v).replace(/([\d.,]+%?|USD\s?[\d.,]+[MBK]?)/g, "<b>$1</b>"); }

  const CASE_FLOW = [
    ["problem", "Problem"], ["diagnosis", "Diagnosis"], ["approach", "Approach"],
    ["framework", "Framework"], ["application", "Application"], ["relevance", "Business relevance"]
  ];
  window.__CASE_FLOW = CASE_FLOW;

  function publicProjects() {
    const c = window.__CONTENT;
    return (c.projects || []).filter(p => p && p.title && p.title.trim() && (p.published || window.__ADMIN_AUTHED));
  }
  window.__publicProjects = publicProjects;

  /* ---------- render ---------- */
  function render() {
    const c = window.__CONTENT, L = c.labels, p = c.profile;
    document.title = c.meta.title || p.name;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", c.meta.description || "");

    /* header */
    $("navMono").textContent = p.monogram || "HS";
    $("navName").textContent = p.name;
    $("lnkCases").textContent = L.navCases; $("lnkAbout").textContent = L.navAbout;
    $("lnkExp").textContent = L.navExperience; $("lnkCred").textContent = L.navCredentials;
    $("lnkCv").textContent = L.navCv; $("lnkCv").href = p.cvFile || "#";
    $("lnkContact").textContent = L.navContact;

    /* footer */
    $("footerName").textContent = "© " + new Date().getFullYear() + " " + p.name;
    const note = $("footerNote"); note.textContent = L.footerNote || "";
    note.style.display = L.footerNote ? "" : "none";
    $("adminLink").textContent = L.ownerLink || "Owner login";

    /* hero */
    $("heroEyebrow").textContent = c.hero.eyebrow;
    $("heroHeadline").textContent = c.hero.headline;
    $("heroSubline").textContent = c.hero.subline;
    $("heroCta1").textContent = L.heroCta1 || "View cases";
    const cv = $("heroCv"); cv.href = p.cvFile || "#"; cv.textContent = L.heroCta2 || p.cvLabel || "Download CV";
    $("heroStats").innerHTML = (c.hero.stats || []).filter(s => s.value).map((s, i) =>
      `<div class="stat reveal" style="--i:${i}"><div class="stat-value">${statHTML(s.value)}</div><div class="stat-label">${esc(s.label)}</div></div>`).join("");

    /* section tags */
    $("tagCases").textContent = L.secCases; $("tagAbout").textContent = L.secAbout;
    $("tagExp").textContent = L.secExperience; $("tagCred").textContent = L.secCredentials;
    $("tagContact").textContent = L.secContact;

    /* cases — one clean button only */
    const live = publicProjects();
    $("workGrid").innerHTML = live.map((pr, i) => {
      const cover = pr.cover
        ? `<img src="${esc(pr.cover)}" alt="${esc(pr.title)}" loading="lazy">`
        : `<div class="case-autocover"><i>Case ${String(i + 1).padStart(2, "0")}</i><span>${esc(pr.title)}</span></div>`;
      const tags = (pr.tags || []).map((t, ti) => `<span class="tag${ti === 0 ? " accent" : ""}">${esc(t)}</span>`).join("");
      const draft = (!pr.published && window.__ADMIN_AUTHED) ? `<span class="tag" style="border-color:var(--accent);color:var(--accent)">DRAFT — only you see this</span>` : "";
      return `<article class="case reveal" style="--i:${i}" data-tilt>
        <div class="case-cover" data-case="${esc(pr.id)}" data-cursor="Read Case">${cover}</div>
        <div class="case-body">
          <div class="case-tags">${tags}${draft}</div>
          <h3 class="case-title">${esc(pr.title)}</h3>
          <p class="case-sub">${esc(pr.preview || pr.subtitle || "")}</p>
          <div class="case-foot"><button data-case="${esc(pr.id)}" data-cursor="Read Case">${esc(L.readCase)} →</button></div>
        </div></article>`;
    }).join("") || `<p style="color:var(--mute)">Case studies are being prepared — the CV has the full picture in the meantime.</p>`;

    /* about */
    const a = c.about;
    $("abxHeadline").textContent = a.headline;
    $("abxStory").textContent = a.story;
    const pw = $("abxPhotoWrap");
    if (a.photo) { pw.classList.remove("empty"); pw.innerHTML = `<img src="${esc(a.photo)}" alt="${esc(p.name)}">`; }
    else { pw.classList.add("empty"); pw.innerHTML = ""; }
    const cards = (a.cards || []).filter(cd => cd && (cd.title || "").trim() && (cd.link || "").trim());
    $("abxCards").innerHTML = cards.map(cd => {
      const ext = /^https?:/i.test(cd.link);
      return `<div class="abx-card reveal">
        <span class="abx-ic">${esc(cd.icon || "→")}</span>
        <h4>${esc(cd.title)}</h4><p>${esc(cd.text || "")}</p>
        <a href="${esc(cd.link)}" ${ext ? 'target="_blank" rel="noopener"' : ""} data-cursor="${esc(cd.title)}">${esc(cd.label || "Open")} →</a>
      </div>`;
    }).join("");
    $("abxCards").style.display = cards.length ? "" : "none";
    const hasSummary = (a.summary || "").trim();
    $("abxSummaryWrap").style.display = hasSummary ? "" : "none";
    $("abxSummaryTitle").textContent = a.summaryTitle || "Professional summary";
    $("abxSummary").textContent = a.summary || "";
    /* gallery marquee — hidden unless enabled AND photos exist */
    const shots = (a.gallery || []).filter(g => g && g.image);
    const gal = $("abxGallery");
    if (a.galleryOn && shots.length) {
      const item = (g) => `<figure class="abx-shot"><img src="${esc(g.image)}" alt="${esc(g.caption || "")}">${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ""}</figure>`;
      const strip = shots.map(item).join("");
      gal.style.setProperty("--marq", Math.max(18, shots.length * 8) + "s");
      gal.innerHTML = `<div class="abx-track">${strip}${strip}</div>`;   /* duplicated for seamless loop */
      gal.style.display = "";
    } else { gal.innerHTML = ""; gal.style.display = "none"; }

    /* experience */
    $("expList").innerHTML = (c.experience || []).filter(e => e.role).map(e =>
      `<div class="exp reveal"><div class="exp-period">${esc(e.period)}</div><div>
        <h3>${esc(e.role)}</h3><p class="exp-org">${esc(e.org)}${e.place ? " · " + esc(e.place) : ""}</p>
        <ul>${(e.points || []).map(pt => `<li>${esc(pt)}</li>`).join("")}</ul></div></div>`).join("");

    /* credentials */
    $("hEdu").textContent = L.creditEdu; $("hAch").textContent = L.creditAch;
    $("hLang").textContent = L.creditLang; $("hSkills").textContent = L.creditSkills;
    $("credEdu").innerHTML = (c.credentials.education || []).filter(e => e.degree).map(e =>
      `<div class="cred-edu"><b>${esc(e.degree)}</b><span>${esc(e.school)}</span><span>${esc(e.detail)}</span></div>`).join("");
    $("credAch").innerHTML = (c.credentials.achievements || []).filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("");
    $("credLang").innerHTML = (c.credentials.languages || []).filter(Boolean).map(l => `<span class="tag">${esc(l)}</span>`).join("");
    $("credSkills").innerHTML = (c.credentials.skills || []).filter(Boolean).map(s => `<span class="tag">${esc(s)}</span>`).join("");

    /* contact */
    $("contactLine").innerHTML = (L.contactLine || "").replace(/<(?!\/?em>)[^>]*>/g, "");
    $("contactLinks").innerHTML = [
      p.email ? `<a href="mailto:${esc(p.email)}" data-cursor="Email">${esc(p.email)}</a>` : "",
      p.phone ? `<a href="tel:${esc(p.phone.replace(/\s/g, ""))}" data-cursor="Call">${esc(p.phone)}</a>` : "",
      p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener" data-cursor="Connect">LinkedIn</a>` : "",
      p.cvFile ? `<a href="${esc(p.cvFile)}" target="_blank" rel="noopener" data-cursor="Open CV">${esc(p.cvLabel || "Download CV")}</a>` : ""
    ].filter(Boolean).join("");

    observeReveals();
    if (document.body.classList.contains("viewing-case") && window.__currentCase) renderCase(window.__currentCase);
  }
  window.__render = render;

  /* ---------- case pages ---------- */
  const casePage = $("casePage"), caseInner = $("casePageInner");
  function renderCase(id) {
    const pr = (window.__CONTENT.projects || []).find(x => x.id === id);
    if (!pr || !pr.title || (!pr.published && !window.__ADMIN_AUTHED)) { closeCase(); return; }
    window.__currentCase = id;
    const L = window.__CONTENT.labels;
    const secs = CASE_FLOW.map(([key, name], i) => {
      const s = (pr.sections || {})[key] || {};
      if (!(s.text || "").trim() && !(s.images || []).some(im => im.src)) return "";
      const figs = (s.images || []).filter(im => im.src).map(im =>
        `<figure><img src="${esc(im.src)}" alt="${esc(im.caption || "")}" loading="lazy">${im.caption ? `<figcaption>${esc(im.caption)}</figcaption>` : ""}</figure>`).join("");
      return `<section class="cp-section" id="cps-${key}">
        <h2><i>0${i + 1}</i>${esc(name)}</h2>
        ${s.text ? `<p class="cp-text">${esc(s.text)}</p>` : ""}
        ${figs ? `<div class="cp-figs">${figs}</div>` : ""}
      </section>`;
    }).join("");
    const flowNav = CASE_FLOW.filter(([key]) => {
      const s = (pr.sections || {})[key] || {};
      return (s.text || "").trim() || (s.images || []).some(im => im.src);
    }).map(([key, name]) => `<a href="#cps-${key}" data-cursor="Go">${esc(name)}</a>`).join(`<span class="cp-arrow">→</span>`);
    caseInner.innerHTML = `
      <button class="cp-back" data-back data-cursor="Back">← ${esc(L.backToSite)}</button>
      <p class="cp-eyebrow">Case study${!pr.published ? " · DRAFT (only you can see this)" : ""}</p>
      <h1 class="cp-title">${esc(pr.title)}</h1>
      <p class="cp-sub">${esc(pr.subtitle || "")}</p>
      <div class="cp-tags">${(pr.tags || []).map(t => `<span class="tag accent">${esc(t)}</span>`).join("")}</div>
      <div class="cp-flow">${flowNav}</div>
      ${pr.cover ? `<div class="cp-cover"><img src="${esc(pr.cover)}" alt=""></div>` : ""}
      ${secs}
      <div class="cp-foot">
        <button class="btn btn-solid" data-back data-cursor="Back">← ${esc(L.backToSite)}</button>
        ${pr.slides ? `<a class="btn btn-line" href="${esc(pr.slides)}" target="_blank" rel="noopener" data-cursor="Open">${esc(pr.slidesLabel || L.viewSlides)}</a>` : ""}
        ${pr.link ? `<a class="btn btn-line" href="${esc(pr.link)}" target="_blank" rel="noopener" data-cursor="Visit">${esc(pr.linkLabel || "External link")}</a>` : ""}
      </div>`;
    casePage.hidden = false;
    document.body.classList.add("viewing-case");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }
  function openCase(id) {
    history.pushState({ case: id }, "", "#case-" + id);
    renderCase(id);
  }
  function closeCase() {
    window.__currentCase = null;
    casePage.hidden = true;
    document.body.classList.remove("viewing-case");
    if (location.hash.startsWith("#case-")) history.pushState(null, "", location.pathname + "#work");
    const w = $("work"); if (w) w.scrollIntoView({ behavior: "auto", block: "start" });
    observeReveals();
  }
  window.__openCase = openCase;
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-case]");
    if (opener) { e.preventDefault(); openCase(opener.getAttribute("data-case")); return; }
    if (e.target.closest("[data-back]")) { e.preventDefault(); closeCase(); }
  });
  window.addEventListener("popstate", () => {
    if (location.hash.startsWith("#case-")) renderCase(location.hash.slice(6));
    else if (document.body.classList.contains("viewing-case")) closeCase();
  });
  if (location.hash.startsWith("#case-")) renderCase(location.hash.slice(6));

  /* ---------- scroll reveal ---------- */
  let io;
  function observeReveals() {
    if (io) io.disconnect();
    io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
  }

  /* ---------- cursor: arrow stays on plain areas; circle takes over on clickables ---------- */
  const cursor = $("cursor"), label = $("cursorLabel");
  let cx = -100, cy = -100, tx = -100, ty = -100;
  document.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    document.body.classList.add("cursor-seen");
  }, { passive: true });
  (function loop() {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor]");
    const clickable = t || e.target.closest("a,button,input,textarea,select,label,[data-case],[data-back]");
    if (clickable) {
      cursor.classList.add("grow"); cursor.classList.remove("tiny");
      label.textContent = t ? t.getAttribute("data-cursor") : "Click";
      document.body.classList.add("cursor-hide");      /* hide native arrow ONLY here */
    } else {
      cursor.classList.remove("grow");
      document.body.classList.remove("cursor-hide");   /* arrow + small dot together */
      cursor.classList.toggle("tiny", !!e.target.closest("p,h1,h2,h3,h4,li,span"));
    }
  });

  /* ---------- hero parallax + card tilt ---------- */
  const hero = $("hero");
  const shapes = document.querySelectorAll(".shape");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) {
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      shapes.forEach((s, i) => {
        const d = (i + 1) * 10;
        s.style.transform = `translate3d(${x * d}px, ${y * d}px, 0) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
      });
    }, { passive: true });
    document.addEventListener("mousemove", (e) => {
      const card = e.target.closest("[data-tilt]");
      document.querySelectorAll("[data-tilt]").forEach(c => { if (c !== card) c.style.transform = ""; });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${-y * 3.2}deg) rotateY(${x * 3.2}deg) translateY(-2px)`;
    }, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  const burger = $("navBurger"), navLinks = $("navLinks");
  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  burger.addEventListener("click", (e) => { e.stopPropagation(); setMenu(!navLinks.classList.contains("open")); });
  /* CV opens in a new tab: close the menu but let the link do its job */
  navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("click", (e) => { if (!e.target.closest("#nav")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  matchMedia("(min-width:821px)").addEventListener("change", (m) => { if (m.matches) setMenu(false); });

  /* in-page anchors must clear the sticky header */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!id || id === "admin" || id.startsWith("case-")) return;
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    if (document.body.classList.contains("viewing-case") && !id.startsWith("cps-")) closeCase();
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - ($("nav").offsetHeight + 12);
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", "#" + id);
  });

  render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.classList.add("anim-ready");
    observeReveals();
  }));
})();
