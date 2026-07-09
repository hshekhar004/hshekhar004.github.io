# Deployment guide — Himanshu Shekhar portfolio

Static site. No build step. Works on GitHub Pages, Netlify, Vercel, any host,
and by double-clicking `index.html` locally.

## Folder structure
```
portfolio/
├── index.html          ← must stay at repository root
├── css/style.css
├── js/content.js       ← ALL content — replacing this file = publishing
├── js/main.js          ← rendering / cursor / case pages (never edit)
├── js/admin.js         ← the editor (never edit)
├── assets/cv/…  assets/projects/…  assets/img/…
└── DEPLOYMENT.md
```
Relative paths only → works at `username.github.io`, in a sub-path, and on
any custom domain unchanged.

## First-time publish on GitHub Pages
1. Create a repo named `YOURUSERNAME.github.io` (Public).
2. Upload the *contents* of this folder (index.html at top level).
3. Settings → Pages → Deploy from branch → `main` / root. Save.
4. Live in ~2 minutes at `https://YOURUSERNAME.github.io`.

## Owner login
- Open the footer link **"Owner login"** (or `#admin`, or Ctrl+Shift+E).
- Log in with the user ID and password you chose. Credentials are validated
  against a SHA-256 hash of `userid:password` — **no plaintext password
  exists anywhere in this project**, and wrong credentials are rejected
  (with a 30s lock after 3 failures).
- Change credentials anytime in the editor's **Security** tab, then Export.

### Forgot the password?
GitHub Pages has no server, so the site cannot email you an OTP. Reset goes
through the thing that really secures the site — your GitHub account:
1. Open any page, press F12 → Console, and run (replace both values):
   `crypto.subtle.digest("SHA-256", new TextEncoder().encode("youruserid:yournewpassword")).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")))`
2. Copy the printed hash into the `adminHash` value in `js/content.js` in
   your repository. Commit. Done — new credentials work.

### Real OTP / email reset (optional upgrade, no redesign needed)
True authenticated editing with email verification requires a backend or
auth service. The clean upgrade paths, in order of ease:
1. **Netlify + Netlify Identity + Decap CMS** — free; adds email-based
   login, invite-only users and password recovery emails.
2. **Firebase Authentication** or **Supabase Auth** — free tiers; email/OTP
   flows; you'd protect the editor route with their JS SDK.
This folder is deliberately structured (content separated in content.js) so
any of these can be bolted on later without touching the design.

## Editing & publishing workflow
1. Log in → edit anything: every text and label (header, sections, footer,
   buttons), About page (photo, story, action cards, summary, gallery),
   cases (up to 30, six-section consulting flow, images with captions and
   ordering, publish/draft per case), experience, credentials, design
   (52 accents + custom, 10 background tones + custom colour, text colour,
   font pairing, text size, animation preset, cursor on/off).
2. Everything previews instantly and is auto-saved **in your browser only**
   — visitors keep seeing the published version, and drafts are marked.
3. Click **Export content.js** → in GitHub open the `js` folder → Upload
   files → drop the new `content.js` over the old one → Commit.
   That file replacement IS the publish step.

### Files & images
- Editor uploads embed images (auto-compressed) and documents into
  content.js. Fine up to a few MB total.
- For large files: upload them to `assets/projects/` in the repo and type
  the path (e.g. `assets/projects/case3.pdf`) in the case's file field —
  keeps content.js small and browser storage happy.

## Custom domain later
GitHub Pages: Settings → Pages → Custom domain + a CNAME record at your
registrar. Netlify/Vercel: import the same folder/repo, add domain there.
Zero changes to the site.
