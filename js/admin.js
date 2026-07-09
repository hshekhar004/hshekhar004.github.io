/* =====================================================================
   ADMIN.JS — owner editor. Footer "Owner login", #admin, or Ctrl+Shift+E.
   Login: user ID + password, validated against a SHA-256 hash of
   "userid:password". No plaintext credential exists in this project.
   Publishing = Export content.js → replace js/content.js in the repo.
   ===================================================================== */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const root = $("adminRoot");
  const MAXP = 30, MAXIMG = 10, MAXWORDS = 1000, MAXGAL = 8;

  const SWATCHES = [
    ["Oxblood", "#6E1423"], ["Deep maroon", "#5C1A1A"], ["Bordeaux", "#7B2231"], ["Brick", "#8C3B2E"],
    ["Rust", "#9A4A2E"], ["Terracotta", "#A85A44"], ["Burnt sienna", "#8A4B32"], ["Clay", "#96604A"],
    ["Copper", "#9C5B33"], ["Amber", "#B07D2B"], ["Ochre", "#A57F2C"], ["Mustard", "#B0902F"],
    ["Old gold", "#8F7A2E"], ["Olive", "#6B6B2E"], ["Moss", "#5C6B3C"], ["Fern", "#4C6B45"],
    ["Forest", "#2F5D3A"], ["Pine", "#2C5E4F"], ["Emerald ink", "#1E5B4C"], ["Teal", "#1F6360"],
    ["Deep teal", "#16505A"], ["Petrol", "#1D4E5E"], ["Marine", "#1F4A6E"], ["Prussian", "#1B3E63"],
    ["Sapphire", "#274B8F"], ["Cobalt", "#2A4FA3"], ["Royal blue", "#2E4A9E"], ["Indigo", "#3B3A8F"],
    ["Deep violet", "#4A3382"], ["Plum", "#5D3462"], ["Aubergine", "#4E2A4E"], ["Mulberry", "#6E2A52"],
    ["Raspberry", "#8E2A55"], ["Crimson", "#8E1F33"], ["Carmine", "#9A1B2F"], ["Vermilion", "#B03A2E"],
    ["Signal red", "#C0392B"], ["Coral clay", "#B65C4B"], ["Dusty rose", "#A05A66"], ["Mauve", "#7E5A72"],
    ["Slate blue", "#4C5C78"], ["Steel", "#4A5A66"], ["Graphite blue", "#3E4A57"], ["Gunmetal", "#3B4348"],
    ["Charcoal", "#2E2E30"], ["Espresso", "#4A382E"], ["Chocolate", "#5A4232"], ["Walnut", "#5E4A38"],
    ["Bronze", "#7A5A30"], ["Midnight", "#1E2433"], ["Ink navy", "#141C2E"], ["Racing green", "#1E3B2E"]
  ];
  const TONES = [["paper", "Off-white paper (default)"], ["white", "Pure white"], ["pearl", "Warm pearl"], ["ivory", "Warm ivory"], ["sand", "Soft sand"], ["fog", "Neutral fog"], ["mist", "Cool mist"], ["cool", "Cool grey"], ["stone", "Warm stone"], ["ink", "Ink (dark)"]];

  /* ---------- helpers ---------- */
  const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  function toast(msg) {
    document.querySelectorAll(".adm-toast").forEach(t => t.remove());
    const t = document.createElement("div"); t.className = "adm-toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  }
  function C() { return window.__CONTENT; }
  function saveDraft() {
    try { localStorage.setItem(window.__LS_KEY, JSON.stringify(C())); }
    catch (e) { toast("Draft too large for browser storage — Export content.js NOW so nothing is lost, and prefer repo paths for big files."); }
  }
  function rerender() { window.__render(); window.__applySettings(C().settings); }
  function words(t) { return (t || "").trim() ? t.trim().split(/\s+/).length : 0; }

  function readImage(file, cb, max = 1600) {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / img.width);
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL("image/jpeg", 0.82));
    };
    img.src = URL.createObjectURL(file);
  }
  function readDoc(file, cb) {
    if (file.size > 6 * 1024 * 1024) toast("Over 6 MB — better: upload to assets/projects/ in the repo and type the path instead.");
    const r = new FileReader();
    r.onload = () => cb(r.result, file.name);
    r.readAsDataURL(file);
  }

  /* ---------- login ---------- */
  function showLogin() {
    root.innerHTML = `<div class="adm-overlay" id="admOverlay">
      <div class="adm-login">
        <h2>Owner login</h2>
        <p>This area is for the site owner only.</p>
        <input type="text" id="admUser" placeholder="User ID" autocomplete="username">
        <input type="password" id="admPass" placeholder="Password" autocomplete="current-password">
        <div class="adm-err" id="admErr"></div>
        <button class="adm-btn solid" id="admGo" style="width:100%;justify-content:center">Log in</button>
        <button class="adm-btn" id="admForgot" style="width:100%;justify-content:center;margin-top:.6rem;border:none">Forgot password?</button>
        <button class="adm-btn" id="admCancel" style="width:100%;justify-content:center;border:none">Cancel</button>
      </div></div>`;
    $("admCancel").onclick = closeAdmin;
    $("admOverlay").addEventListener("click", e => { if (e.target.id === "admOverlay") closeAdmin(); });
    $("admForgot").onclick = () => {
      $("admErr").innerHTML = "";
      document.querySelector(".adm-login").innerHTML = `
        <h2>Password reset</h2>
        <p style="text-align:left">This site runs on GitHub Pages — a static host with <b>no server</b>, so it cannot send an OTP email by itself. Resetting works through the thing that actually secures this site: your GitHub account.</p>
        <p style="text-align:left"><b>To reset:</b> open <code>js/content.js</code> in your GitHub repository, and replace the <code>adminHash</code> value with a new hash of <code>userid:newpassword</code> (the DEPLOYMENT guide has a copy-paste generator for this). Only someone with access to your GitHub account can do that — which is the point.</p>
        <p style="text-align:left">For real OTP-by-email reset, connect a free auth service (Firebase Authentication, Supabase Auth, or Netlify Identity) — the DEPLOYMENT guide explains the upgrade path.</p>
        <button class="adm-btn solid" id="admBackLogin" style="width:100%;justify-content:center">Back to login</button>`;
      $("admBackLogin").onclick = showLogin;
    };
    let fails = 0;
    const tryLogin = async () => {
      const uid = ($("admUser").value || "").trim().toLowerCase();
      const h = await sha256(uid + ":" + $("admPass").value);
      if (h === C().settings.adminHash) { window.__ADMIN_AUTHED = true; rerender(); showPanel(); }
      else {
        fails++;
        $("admErr").textContent = "Wrong user ID or password.";
        if (fails >= 3) { $("admErr").textContent += " Locked for 30 seconds."; $("admGo").disabled = true; setTimeout(() => { $("admGo").disabled = false; fails = 0; }, 30000); }
      }
    };
    $("admGo").onclick = tryLogin;
    $("admPass").addEventListener("keydown", e => { if (e.key === "Enter") tryLogin(); });
    $("admUser").focus();
  }
  function closeAdmin() { root.innerHTML = ""; if (location.hash === "#admin") history.replaceState(null, "", location.pathname); }

  /* ---------- panel scaffolding ---------- */
  let tab = "profile", caseIdx = null;
  function showPanel() {
    caseIdx = null;
    root.innerHTML = `<aside class="adm-panel">
      <div class="adm-head"><b>Editor</b>
        <div>
          <button class="adm-btn solid" id="admExport">Export content.js</button>
          <button class="adm-btn" id="admLogout">Log out</button>
        </div></div>
      <div class="adm-tabs" id="admTabs">
        ${["profile:Profile", "labels:Texts & labels", "hero:Hero", "about:About", "cases:Cases", "exp:Experience", "cred:Credentials", "design:Design", "security:Security"]
          .map(t => { const [k, l] = t.split(":"); return `<button data-tab="${k}" class="${k === tab ? "on" : ""}">${l}</button>`; }).join("")}
      </div>
      <div class="adm-scroll" id="admBody"></div>
      <div class="adm-foot">
        <button class="adm-btn" id="admDiscard">Discard local draft</button>
        <span class="adm-note" style="margin:0;align-self:center">Edits preview live & save in this browser. Export to publish.</span>
      </div></aside>`;
    $("admLogout").onclick = () => { window.__ADMIN_AUTHED = false; rerender(); closeAdmin(); };
    $("admExport").onclick = exportContent;
    $("admDiscard").onclick = () => {
      if (confirm("Discard all local edits and return to the published content.js?")) {
        localStorage.removeItem(window.__LS_KEY); location.reload();
      }
    };
    $("admTabs").addEventListener("click", e => {
      const b = e.target.closest("[data-tab]"); if (!b) return;
      tab = b.getAttribute("data-tab"); caseIdx = null;
      document.querySelectorAll("#admTabs button").forEach(x => x.classList.toggle("on", x === b));
      renderTab();
    });
    renderTab();
  }

  function get(path) { return path.split(".").reduce((o, k) => (o || {})[k], C()) ?? ""; }
  function set(path, v) {
    const ks = path.split("."); let o = C();
    ks.slice(0, -1).forEach(k => o = o[k]);
    o[ks[ks.length - 1]] = v;
  }
  function field(label, path, type = "text", note = "") {
    return `<div class="adm-field"><label>${label}</label>
      ${type === "textarea"
        ? `<textarea data-path="${path}">${esc(get(path))}</textarea>`
        : `<input type="${type}" data-path="${path}" value="${esc(get(path))}">`}
      ${note ? `<p class="adm-note">${note}</p>` : ""}</div>`;
  }
  function bindInputs(container) {
    container.querySelectorAll("[data-path]").forEach(el => {
      el.addEventListener("input", () => { set(el.getAttribute("data-path"), el.value); saveDraft(); rerender(); });
    });
  }
  /* list editor factory: textarea, one entry per line */
  function lines(label, path) {
    return `<div class="adm-field"><label>${label} — one per line</label>
      <textarea data-lines="${path}">${esc((get(path) || []).join("\n"))}</textarea></div>`;
  }
  function bindLines(container) {
    container.querySelectorAll("[data-lines]").forEach(el => {
      el.addEventListener("input", () => {
        set(el.getAttribute("data-lines"), el.value.split("\n").map(s => s.trim()).filter(Boolean));
        saveDraft(); rerender();
      });
    });
  }

  /* ---------- tabs ---------- */
  function renderTab() {
    const body = $("admBody");

    /* ============ PROFILE ============ */
    if (tab === "profile") {
      body.innerHTML =
        field("Full name", "profile.name") + field("Monogram (logo circle)", "profile.monogram") +
        field("Role line", "profile.role") + field("Location", "profile.location") +
        field("Email", "profile.email") + field("Phone", "profile.phone") +
        field("LinkedIn URL", "profile.linkedin", "url") +
        `<div class="adm-field"><label>CV file</label>
          <div class="adm-file-row"><input type="file" id="admCvUp" accept=".pdf,.doc,.docx"></div>
          ${field("CV path or embedded file", "profile.cvFile")}
          ${field("CV button label", "profile.cvLabel")}</div>`;
      bindInputs(body);
      $("admCvUp").onchange = e => { if (e.target.files[0]) readDoc(e.target.files[0], d => { C().profile.cvFile = d; saveDraft(); rerender(); renderTab(); toast("CV embedded — export to publish."); }); };
    }

    /* ============ TEXTS & LABELS ============ */
    if (tab === "labels") {
      const L = "labels.";
      body.innerHTML = `<p class="adm-note">Every visible label on the site. Clear the footer note to remove it entirely.</p>` +
        field("Nav: Cases", L + "navCases") + field("Nav: About", L + "navAbout") +
        field("Nav: Experience", L + "navExperience") + field("Nav: Credentials", L + "navCredentials") +
        field("Nav: CV", L + "navCv") + field("Nav: Contact", L + "navContact") +
        field("Section title: Cases", L + "secCases") + field("Section title: About", L + "secAbout") +
        field("Section title: Experience", L + "secExperience") + field("Section title: Credentials", L + "secCredentials") +
        field("Section title: Contact", L + "secContact") +
        field("Case card button", L + "readCase") + field("Case page: back button", L + "backToSite") +
        field("Case page: slides button", L + "viewSlides") +
        field("Contact headline (<em>…</em> = accent italics)", L + "contactLine", "textarea") +
        field("Hero button 1", L + "heroCta1") + field("Hero button 2", L + "heroCta2") +
        field("Footer note (e.g. location — empty hides it)", L + "footerNote") +
        field("Footer owner-login link text", L + "ownerLink") +
        field("Credentials heading: Education", L + "creditEdu") + field("Credentials heading: Achievements", L + "creditAch") +
        field("Credentials heading: Languages", L + "creditLang") + field("Credentials heading: Competencies", L + "creditSkills") +
        field("Browser tab title", "meta.title") + field("Meta description", "meta.description", "textarea");
      bindInputs(body);
    }

    /* ============ HERO ============ */
    if (tab === "hero") {
      body.innerHTML =
        field("Eyebrow", "hero.eyebrow") + field("Headline", "hero.headline", "textarea") +
        field("Subline", "hero.subline", "textarea") +
        (C().hero.stats || []).map((s, i) =>
          `<div class="adm-proj"><div class="adm-proj-head"><b>Stat ${i + 1} (empty value hides it)</b></div>
          ${field("Value", `hero.stats.${i}.value`)}${field("Label", `hero.stats.${i}.label`)}</div>`).join("");
      bindInputs(body);
    }

    /* ============ ABOUT ============ */
    if (tab === "about") {
      const a = C().about;
      body.innerHTML =
        field("About headline", "about.headline", "textarea") +
        field("About story", "about.story", "textarea") +
        `<div class="adm-field"><label>Profile photo (large, HD portrait works best)</label>
          <div class="adm-file-row">
            ${a.photo ? `<img class="adm-thumb" src="${esc(a.photo)}">` : ""}
            <input type="file" id="admAbPhoto" accept="image/*">
            ${a.photo ? `<button class="adm-btn danger" id="admAbPhotoDel">Remove</button>` : ""}
          </div><p class="adm-note">No photo = the photo block is hidden automatically.</p></div>
        <hr style="border:none;border-top:1px solid var(--line);margin:1.4rem 0">
        <p class="adm-note"><b>Action cards</b> — a card is public only when both title AND link are filled.</p>` +
        (a.cards || []).map((cd, i) =>
          `<div class="adm-proj"><div class="adm-proj-head"><b>Card ${i + 1}${cd.title && cd.link ? ' <span class="adm-badge">live</span>' : " (hidden)"}</b></div>
          ${field("Icon (1–2 characters)", `about.cards.${i}.icon`)}
          ${field("Title", `about.cards.${i}.title`)}
          ${field("Short text", `about.cards.${i}.text`)}
          ${field("Button label", `about.cards.${i}.label`)}
          ${field("Link (URL, #contact, or file path)", `about.cards.${i}.link`)}</div>`).join("") +
        `<hr style="border:none;border-top:1px solid var(--line);margin:1.4rem 0">` +
        field("Summary heading", "about.summaryTitle") +
        field("Professional summary (empty hides the block)", "about.summary", "textarea") +
        `<hr style="border:none;border-top:1px solid var(--line);margin:1.4rem 0">
        <div class="adm-field"><label>Photo gallery (marquee)</label>
          <select id="admGalOn"><option value="1" ${a.galleryOn ? "selected" : ""}>On (shows only if photos exist)</option><option value="0" ${!a.galleryOn ? "selected" : ""}>Off</option></select>
          <p class="adm-note">Up to ${MAXGAL} photos. Loops horizontally; pauses on hover; hidden when empty.</p></div>
        <div id="admGalList"></div>
        <button class="adm-btn solid" id="admGalAdd" ${((a.gallery || []).length >= MAXGAL) ? "disabled" : ""}>+ Add photo (${(a.gallery || []).length}/${MAXGAL})</button>
        <input type="file" id="admGalFile" accept="image/*" style="display:none">`;
      bindInputs(body);
      $("admAbPhoto").onchange = e => { if (e.target.files[0]) readImage(e.target.files[0], d => { a.photo = d; saveDraft(); rerender(); renderTab(); }, 2000); };
      const pdel = $("admAbPhotoDel"); if (pdel) pdel.onclick = () => { a.photo = ""; saveDraft(); rerender(); renderTab(); };
      $("admGalOn").onchange = e => { a.galleryOn = e.target.value === "1"; saveDraft(); rerender(); };
      const gl = $("admGalList");
      a.gallery = a.gallery || [];
      gl.innerHTML = a.gallery.map((g, i) => `
        <div class="adm-proj"><div class="adm-proj-head">
          <img class="adm-thumb" src="${esc(g.image)}">
          <span>
            <button class="adm-btn" data-gmv="${i}:-1">↑</button>
            <button class="adm-btn" data-gmv="${i}:1">↓</button>
            <button class="adm-btn danger" data-gdel="${i}">Delete</button>
          </span></div>
          ${field("Caption (optional)", `about.gallery.${i}.caption`)}</div>`).join("");
      bindInputs(gl);
      gl.addEventListener("click", e => {
        const d = e.target.closest("[data-gdel]");
        if (d) { a.gallery.splice(+d.getAttribute("data-gdel"), 1); saveDraft(); rerender(); renderTab(); }
        const m = e.target.closest("[data-gmv]");
        if (m) { const [i, dd] = m.getAttribute("data-gmv").split(":").map(Number); const j = i + dd;
          if (j >= 0 && j < a.gallery.length) { [a.gallery[i], a.gallery[j]] = [a.gallery[j], a.gallery[i]]; saveDraft(); rerender(); renderTab(); } }
      });
      $("admGalAdd").onclick = () => $("admGalFile").click();
      $("admGalFile").onchange = e => {
        if (e.target.files[0]) readImage(e.target.files[0], d => { a.gallery.push({ image: d, caption: "" }); saveDraft(); rerender(); renderTab(); }, 1000);
      };
    }

    /* ============ CASES ============ */
    if (tab === "cases") {
      const ps = C().projects || (C().projects = []);
      if (caseIdx !== null) return renderCaseEditor(caseIdx);
      body.innerHTML = `
        <p class="adm-note">Up to ${MAXP} cases. Public visitors see a case only when it has a title <b>and</b> is set to Published. Drafts show only to you (marked DRAFT).</p>
        <button class="adm-btn solid" id="admAddC" ${ps.length >= MAXP ? "disabled" : ""}>+ Add case (${ps.length}/${MAXP})</button>
        <div id="admClist" style="margin-top:1rem">${ps.map((p, i) => `
          <div class="adm-proj"><div class="adm-proj-head">
            <b>${String(i + 1).padStart(2, "0")} · ${p.title ? esc(p.title).slice(0, 38) : "Untitled"} ${p.published && p.title ? '<span class="adm-badge">published</span>' : '<span class="adm-badge" style="background:var(--mute)">draft</span>'}</b>
            <span>
              <button class="adm-btn" data-mv="${i}:-1">↑</button>
              <button class="adm-btn" data-mv="${i}:1">↓</button>
              <button class="adm-btn solid" data-edit="${i}">Edit</button>
              <button class="adm-btn danger" data-del="${i}">Delete</button>
            </span></div></div>`).join("")}</div>`;
      $("admAddC").onclick = () => {
        ps.push({ id: "p" + Date.now(), published: false, title: "", subtitle: "", tags: [], preview: "", cover: "",
          slides: "", slidesLabel: "", link: "", linkLabel: "",
          sections: { problem: { text: "", images: [] }, diagnosis: { text: "", images: [] }, approach: { text: "", images: [] }, framework: { text: "", images: [] }, application: { text: "", images: [] }, relevance: { text: "", images: [] } } });
        saveDraft(); caseIdx = ps.length - 1; renderTab();
      };
      $("admClist").addEventListener("click", e => {
        const ed = e.target.closest("[data-edit]");
        if (ed) { caseIdx = +ed.getAttribute("data-edit"); renderTab(); return; }
        const del = e.target.closest("[data-del]");
        if (del && confirm("Delete this case completely?")) { ps.splice(+del.getAttribute("data-del"), 1); saveDraft(); rerender(); renderTab(); }
        const mv = e.target.closest("[data-mv]");
        if (mv) { const [i, d] = mv.getAttribute("data-mv").split(":").map(Number); const j = i + d;
          if (j >= 0 && j < ps.length) { [ps[i], ps[j]] = [ps[j], ps[i]]; saveDraft(); rerender(); renderTab(); } }
      });
    }

    /* ============ EXPERIENCE ============ */
    if (tab === "exp") {
      const xs = C().experience || (C().experience = []);
      body.innerHTML = `<p class="adm-note">Entries without a role title are hidden publicly.</p>
        <button class="adm-btn solid" id="admAddX">+ Add entry</button>
        <div id="admXlist" style="margin-top:1rem">${xs.map((x, i) => `
          <div class="adm-proj"><div class="adm-proj-head"><b>${esc(x.role || "New entry").slice(0, 40)}</b>
            <span><button class="adm-btn" data-xmv="${i}:-1">↑</button><button class="adm-btn" data-xmv="${i}:1">↓</button>
            <button class="adm-btn danger" data-xdel="${i}">Delete</button></span></div>
            ${field("Period", `experience.${i}.period`)}
            ${field("Role / title", `experience.${i}.role`)}
            ${field("Organisation", `experience.${i}.org`)}
            ${field("Location", `experience.${i}.place`)}
            ${lines("Bullet points", `experience.${i}.points`)}
          </div>`).join("")}</div>`;
      bindInputs(body); bindLines(body);
      $("admAddX").onclick = () => { xs.unshift({ period: "", role: "", org: "", place: "", points: [] }); saveDraft(); renderTab(); };
      $("admXlist").addEventListener("click", e => {
        const d = e.target.closest("[data-xdel]");
        if (d && confirm("Delete this entry?")) { xs.splice(+d.getAttribute("data-xdel"), 1); saveDraft(); rerender(); renderTab(); }
        const m = e.target.closest("[data-xmv]");
        if (m) { const [i, dd] = m.getAttribute("data-xmv").split(":").map(Number); const j = i + dd;
          if (j >= 0 && j < xs.length) { [xs[i], xs[j]] = [xs[j], xs[i]]; saveDraft(); rerender(); renderTab(); } }
      });
    }

    /* ============ CREDENTIALS ============ */
    if (tab === "cred") {
      const ed = C().credentials.education || (C().credentials.education = []);
      body.innerHTML = `<p class="adm-note">Education entries without a degree are hidden publicly.</p>
        <button class="adm-btn solid" id="admAddE">+ Add education</button>
        <div id="admElist" style="margin-top:1rem">${ed.map((x, i) => `
          <div class="adm-proj"><div class="adm-proj-head"><b>${esc(x.degree || "New").slice(0, 40)}</b>
            <span><button class="adm-btn" data-emv="${i}:-1">↑</button><button class="adm-btn" data-emv="${i}:1">↓</button>
            <button class="adm-btn danger" data-edel="${i}">Delete</button></span></div>
            ${field("Degree", `credentials.education.${i}.degree`)}
            ${field("Institution", `credentials.education.${i}.school`)}
            ${field("Detail line (dates, grade, thesis…)", `credentials.education.${i}.detail`, "textarea")}
          </div>`).join("")}</div>
        ${lines("Achievements", "credentials.achievements")}
        ${lines("Core competencies (tags)", "credentials.skills")}
        ${lines("Languages", "credentials.languages")}`;
      bindInputs(body); bindLines(body);
      $("admAddE").onclick = () => { ed.push({ degree: "", school: "", detail: "" }); saveDraft(); renderTab(); };
      $("admElist").addEventListener("click", e => {
        const d = e.target.closest("[data-edel]");
        if (d && confirm("Delete this entry?")) { ed.splice(+d.getAttribute("data-edel"), 1); saveDraft(); rerender(); renderTab(); }
        const m = e.target.closest("[data-emv]");
        if (m) { const [i, dd] = m.getAttribute("data-emv").split(":").map(Number); const j = i + dd;
          if (j >= 0 && j < ed.length) { [ed[i], ed[j]] = [ed[j], ed[i]]; saveDraft(); rerender(); renderTab(); } }
      });
    }

    /* ============ DESIGN ============ */
    if (tab === "design") {
      const s = C().settings;
      body.innerHTML = `
        <div class="adm-field"><label>Accent colour — ${esc(s.accentName || s.accent)}</label>
          <div class="adm-swatches">${SWATCHES.map(([n, h]) =>
            `<button title="${n}" data-acc="${h}" data-accname="${n}" class="${h.toLowerCase() === (s.accent || "").toLowerCase() ? "on" : ""}" style="background:${h}"></button>`).join("")}</div>
          <div class="adm-file-row"><label style="margin:0">Custom:</label><input type="color" id="admAccCustom" value="${esc(s.accent)}"></div>
          <p class="adm-note">Applies everywhere at once — buttons, links, tags, numbers, hover states, cursor. Text on the accent flips black/white automatically.</p></div>
        <div class="adm-field"><label>Background tone (10 presets)</label>
          <select id="admTone">${TONES.map(([k, l]) => `<option value="${k}" ${s.bgTone === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="adm-field"><label>Custom background colour (overrides preset — clear to use preset)</label>
          <div class="adm-file-row"><input type="color" id="admBgCustom" value="${esc(s.bgCustom || "#F5F3EE")}">
          <button class="adm-btn" id="admBgClear">Use preset</button></div></div>
        <div class="adm-field"><label>Text colour (overrides theme — clear to reset)</label>
          <div class="adm-file-row"><input type="color" id="admTxtCustom" value="${esc(s.textColor || "#0B0B0C")}">
          <button class="adm-btn" id="admTxtClear">Reset</button></div></div>
        <div class="adm-field"><label>Global text size — ${Math.round((s.fontScale || 1) * 100)}%</label>
          <input type="range" id="admScale" min="0.9" max="1.15" step="0.05" value="${s.fontScale || 1}" style="width:100%"></div>
        <div class="adm-field"><label>Typography</label>
          <select id="admFont">${Object.entries(window.__FONTS).map(([k, f]) =>
            `<option value="${k}" ${s.fontPair === k ? "selected" : ""}>${f.name}</option>`).join("")}</select></div>
        <div class="adm-field"><label>Animation preset</label>
          <select id="admAnim">${[["slide", "Slide-up (default)"], ["fade", "Fade-in"], ["reveal", "Reveal on scroll"], ["blur", "Soft blur reveal"], ["stagger", "Staggered card reveal"], ["minimal", "Minimal (hover only)"]]
            .map(([k, l]) => `<option value="${k}" ${s.animation === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="adm-field"><label>Custom cursor (desktop)</label>
          <select id="admCursor"><option value="1" ${s.cursor ? "selected" : ""}>On</option><option value="0" ${!s.cursor ? "selected" : ""}>Off</option></select></div>`;
      body.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => {
        s.accent = b.getAttribute("data-acc"); s.accentName = b.getAttribute("data-accname");
        saveDraft(); rerender(); renderTab();
      });
      $("admAccCustom").oninput = e => { s.accent = e.target.value; s.accentName = "Custom"; saveDraft(); rerender(); };
      $("admTone").onchange = e => { s.bgTone = e.target.value; s.bgCustom = ""; saveDraft(); rerender(); renderTab(); };
      $("admBgCustom").oninput = e => { s.bgCustom = e.target.value; saveDraft(); rerender(); };
      $("admBgClear").onclick = () => { s.bgCustom = ""; saveDraft(); rerender(); renderTab(); };
      $("admTxtCustom").oninput = e => { s.textColor = e.target.value; saveDraft(); rerender(); };
      $("admTxtClear").onclick = () => { s.textColor = ""; saveDraft(); rerender(); renderTab(); };
      $("admScale").oninput = e => { s.fontScale = +e.target.value; saveDraft(); rerender(); };
      $("admFont").onchange = e => { s.fontPair = e.target.value; saveDraft(); rerender(); };
      $("admAnim").onchange = e => { s.animation = e.target.value; saveDraft(); rerender(); document.querySelectorAll(".reveal").forEach(el => el.classList.add("in")); };
      $("admCursor").onchange = e => { s.cursor = e.target.value === "1"; saveDraft(); rerender(); };
    }

    /* ============ SECURITY ============ */
    if (tab === "security") {
      body.innerHTML = `
        <div class="adm-field"><label>User ID</label><input type="text" id="admNewUid" value="" placeholder="Keep or change your user ID"></div>
        <div class="adm-field"><label>New password</label><input type="password" id="admNewPass" autocomplete="new-password"></div>
        <div class="adm-field"><label>Repeat new password</label><input type="password" id="admNewPass2" autocomplete="new-password"></div>
        <button class="adm-btn solid" id="admPassSave">Update credentials</button>
        <p class="adm-note" style="margin-top:1.4rem"><b>How this login actually works (honest version):</b> your credentials are never stored anywhere — the site keeps only a one-way SHA-256 fingerprint of <i>userid:password</i>, and login recomputes and compares it. Nobody can read the password out of the code. But because GitHub Pages has no server, this lock protects the <i>editor screen</i>, not the site itself — what truly protects your live site is your GitHub account, since publishing always means you uploading content.js. OTP email reset needs a backend; the upgrade path (Firebase Auth / Supabase / Netlify Identity + Decap CMS) is in the DEPLOYMENT guide. Until then: if you forget the password, reset the hash via your GitHub repo as described under "Forgot password".</p>`;
      $("admPassSave").onclick = async () => {
        const uid = ($("admNewUid").value || "").trim().toLowerCase();
        const a = $("admNewPass").value, b = $("admNewPass2").value;
        if (!uid) return toast("Enter a user ID.");
        if (!a || a !== b) return toast("Passwords empty or don't match.");
        C().settings.adminHash = await sha256(uid + ":" + a);
        saveDraft(); toast("Credentials updated — Export content.js so they also apply on the published site.");
      };
    }
  }

  /* ---------- per-case editor with the six sections ---------- */
  function renderCaseEditor(i) {
    const body = $("admBody");
    const ps = C().projects, p = ps[i];
    p.sections = p.sections || {};
    window.__CASE_FLOW.forEach(([k]) => { p.sections[k] = p.sections[k] || { text: "", images: [] }; });
    body.innerHTML = `
      <button class="adm-btn" id="admBackCases">← All cases</button>
      <div class="adm-proj" style="margin-top:1rem">
        <div class="adm-proj-head"><b>Case ${String(i + 1).padStart(2, "0")}</b>
          <label style="display:flex;align-items:center;gap:.5rem;font-size:.85rem">
            <input type="checkbox" id="admPub" ${p.published ? "checked" : ""}> Published (visible to recruiters)
          </label></div>
        ${field("Title", `projects.${i}.title`)}
        ${field("Subtitle", `projects.${i}.subtitle`)}
        ${field("Tags (comma-separated)", `projects.${i}._tags`)}
        ${field("Card preview text (shown on homepage card)", `projects.${i}.preview`, "textarea")}
        <div class="adm-field"><label>Cover image</label>
          <div class="adm-file-row">
            ${p.cover ? `<img class="adm-thumb" src="${esc(p.cover)}">` : ""}
            <input type="file" id="admCover" accept="image/*">
            ${p.cover ? `<button class="adm-btn danger" id="admCoverDel">Remove</button>` : ""}
          </div><p class="adm-note">No image? A typographic cover is generated automatically.</p></div>
        <div class="adm-field"><label>Slides / case file (shown at the BOTTOM of the case page only)</label>
          <div class="adm-file-row"><input type="file" id="admSlides" accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls">
          ${p.slides ? `<button class="adm-btn danger" id="admSlidesDel">Remove</button>` : ""}</div>
          ${field("File path or embedded file", `projects.${i}.slides`)}
          ${field("Slides button label", `projects.${i}.slidesLabel`)}</div>
        ${field("External link (optional)", `projects.${i}.link`, "url")}
        ${field("External link label", `projects.${i}.linkLabel`)}
      </div>
      <p class="adm-note"><b>Case page sections</b> — the page shows only sections that have text or images, in this fixed consulting flow. Up to ${MAXWORDS} words and ${MAXIMG} images per section.</p>
      <div id="admSecs">${window.__CASE_FLOW.map(([k, name]) => {
        const s = p.sections[k];
        return `<div class="adm-proj">
          <div class="adm-proj-head"><b>${name}</b><span class="adm-note" style="margin:0" id="wc-${k}">${words(s.text)}/${MAXWORDS} words</span></div>
          <div class="adm-field"><textarea data-sec="${k}">${esc(s.text)}</textarea></div>
          <div class="adm-field"><label>Images / diagrams (${(s.images || []).length}/${MAXIMG})</label>
            <div id="imgs-${k}">${(s.images || []).map((im, ii) => `
              <div class="adm-file-row" style="margin-bottom:.5rem">
                <img class="adm-thumb" src="${esc(im.src)}">
                <input type="text" data-cap="${k}:${ii}" value="${esc(im.caption || "")}" placeholder="Caption" style="flex:1;padding:.4rem .6rem;border:1.5px solid var(--line);border-radius:8px;background:var(--bg-raise);color:var(--ink)">
                <button class="adm-btn" data-imv="${k}:${ii}:-1">↑</button>
                <button class="adm-btn" data-imv="${k}:${ii}:1">↓</button>
                <button class="adm-btn danger" data-idel="${k}:${ii}">✕</button>
              </div>`).join("")}</div>
            <input type="file" data-iadd="${k}" accept="image/*" ${(s.images || []).length >= MAXIMG ? "disabled" : ""}>
          </div></div>`;
      }).join("")}</div>
      <button class="adm-btn" id="admBackCases2">← All cases</button>`;

    p._tags = (p.tags || []).join(", ");
    bindInputs(body);
    body.querySelector(`[data-path="projects.${i}._tags"]`).addEventListener("input", (e) => {
      p.tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean); saveDraft(); rerender();
    });
    $("admBackCases").onclick = $("admBackCases2").onclick = () => { caseIdx = null; renderTab(); };
    $("admPub").onchange = e => { p.published = e.target.checked; saveDraft(); rerender(); toast(p.published ? "Case is now public (after export)." : "Case set to draft — hidden from visitors."); };
    $("admCover").onchange = e => { if (e.target.files[0]) readImage(e.target.files[0], d => { p.cover = d; saveDraft(); rerender(); renderCaseEditor(i); }); };
    const cdel = $("admCoverDel"); if (cdel) cdel.onclick = () => { p.cover = ""; saveDraft(); rerender(); renderCaseEditor(i); };
    $("admSlides").onchange = e => { if (e.target.files[0]) readDoc(e.target.files[0], (d, name) => { p.slides = d; if (!p.slidesLabel) p.slidesLabel = "View slides (" + name.split(".").pop().toUpperCase() + ")"; saveDraft(); rerender(); renderCaseEditor(i); }); };
    const sdel = $("admSlidesDel"); if (sdel) sdel.onclick = () => { p.slides = ""; saveDraft(); rerender(); renderCaseEditor(i); };

    body.querySelectorAll("[data-sec]").forEach(ta => {
      ta.addEventListener("input", () => {
        const k = ta.getAttribute("data-sec");
        const w = words(ta.value);
        if (w > MAXWORDS) { toast(`Over ${MAXWORDS} words — trimming.`); ta.value = ta.value.trim().split(/\s+/).slice(0, MAXWORDS).join(" "); }
        p.sections[k].text = ta.value;
        $("wc-" + k).textContent = words(ta.value) + "/" + MAXWORDS + " words";
        saveDraft(); rerender();
      });
    });
    body.querySelectorAll("[data-iadd]").forEach(inp => inp.onchange = e => {
      const k = inp.getAttribute("data-iadd");
      if (e.target.files[0]) readImage(e.target.files[0], d => {
        p.sections[k].images.push({ src: d, caption: "" }); saveDraft(); rerender(); renderCaseEditor(i);
      }, 1400);
    });
    body.querySelectorAll("[data-cap]").forEach(inp => inp.addEventListener("input", () => {
      const [k, ii] = inp.getAttribute("data-cap").split(":");
      p.sections[k].images[+ii].caption = inp.value; saveDraft(); rerender();
    }));
    body.addEventListener("click", e => {
      const d = e.target.closest("[data-idel]");
      if (d) { const [k, ii] = d.getAttribute("data-idel").split(":"); p.sections[k].images.splice(+ii, 1); saveDraft(); rerender(); renderCaseEditor(i); }
      const m = e.target.closest("[data-imv]");
      if (m) { const [k, ii, dd] = m.getAttribute("data-imv").split(":"); const a = p.sections[k].images, x = +ii, j = x + (+dd);
        if (j >= 0 && j < a.length) { [a[x], a[j]] = [a[j], a[x]]; saveDraft(); rerender(); renderCaseEditor(i); } }
    });
  }

  /* ---------- export ---------- */
  function exportContent() {
    const doc = JSON.parse(JSON.stringify(C()));
    (doc.projects || []).forEach(p => delete p._tags);
    const js = "/* Generated by the site editor on " + new Date().toISOString().slice(0, 10) +
      " — replace js/content.js in your repository with this file to publish. */\n" +
      "window.SITE_CONTENT = " + JSON.stringify(doc, null, 2) + ";\n";
    const blob = new Blob([js], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "content.js"; a.click();
    URL.revokeObjectURL(a.href);
    toast("content.js downloaded — replace js/content.js in your repo to publish.");
  }

  /* ---------- entry points ---------- */
  function openAdmin() { window.__ADMIN_AUTHED ? showPanel() : showLogin(); }
  window.addEventListener("hashchange", () => { if (location.hash === "#admin") openAdmin(); });
  if (location.hash === "#admin") openAdmin();
  document.addEventListener("click", (e) => {
    if (e.target.closest("#adminLink")) { e.preventDefault(); openAdmin(); }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") { e.preventDefault(); openAdmin(); }
  });
})();
