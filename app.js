import { FIREBASE_CONFIG as CFG, NOMBRE, INTRO, YEAR, ADMIN_EMAIL } from './firebase-config.js';
import { DEFAULTS } from './contenido.js';

const V = 'https://www.gstatic.com/firebasejs/10.12.2/';
const LIVE = !CFG.apiKey.startsWith('PEGA');
let db, auth, F, A;
if (LIVE) {
  const [app, fs, au] = await Promise.all([import(V + 'firebase-app.js'), import(V + 'firebase-firestore.js'), import(V + 'firebase-auth.js')]);
  const a = app.initializeApp(CFG);
  db = fs.getFirestore(a); auth = au.getAuth(a); F = fs; A = au;
}

const $ = s => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
const at = n => Date.UTC(YEAR, 11, n, 5);            // medianoche en Lima (UTC-5)
let admin = false, preview = /[?&]probar/.test(location.search);
const seen = new Set(JSON.parse(localStorage.getItem('seen') || '[]'));
const isOpen = n => preview || Date.now() >= at(n);
const lastOpen = () => { let k = 0; for (let n = 1; n <= 24; n++) if (isOpen(n)) k = n; return k; };

function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  Object.assign(e, props); e.append(...kids.filter(k => k != null)); return e;
}
function svg(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]); return e;
}

// ---------- Cielo ----------
const P = Array.from({ length: 24 }, (_, i) => [200 + Math.sin(i * .85) * 125, 75 + i * 44]);
function curve(k) {                                   // curva suave por las primeras k estrellas
  let d = `M${P[0]}`;
  for (let i = 0; i < k - 1; i++) {
    const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c;
    d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}
const sky = $('#sky');
for (let i = 0; i < 70; i++) {
  const c = svg('circle', { cx: Math.random() * 400, cy: Math.random() * 1170, r: .5 + Math.random() * 1.1, class: 'bg', opacity: .6 });
  c.style.animationDelay = (-Math.random() * 4) + 's'; c.style.animationDuration = (3 + Math.random() * 4) + 's'; sky.append(c);
}
const layer = svg('g'); sky.append(layer);

function draw() {
  layer.textContent = '';
  const k = lastOpen(), t = new Date().getUTCFullYear() === YEAR ? todayN() : 0;
  layer.append(svg('path', { d: curve(24), class: 'line-off' }));
  if (k > 1) layer.append(svg('path', { d: curve(k), class: 'line-on' }));
  P.forEach(([x, y], i) => {
    const n = i + 1, open = isOpen(n);
    const g = svg('g', { class: 'star ' + (open ? (seen.has(n) ? 'seen' : 'ready') : 'locked') + (n === t ? ' today' : ''), transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': 'Estrella ' + n + (open ? '' : ' (aún bloqueada)') });
    const tx = svg('text'); tx.textContent = n;
    g.append(svg('circle', { class: 'halo', r: 15 }), svg('circle', { class: 'core', r: 15 }), tx);
    g.onclick = e => openDay(n, e);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDay(n, { clientX: innerWidth / 2, clientY: innerHeight / 2 }); } };
    layer.append(g);
  });
}
const todayN = () => { const d = new Date(Date.now() - 5 * 3600e3); return d.getUTCMonth() === 11 ? d.getUTCDate() : 0; };

// ---------- Estado en vivo ----------
const pad = x => String(x).padStart(2, '0');
function tick() {
  const now = Date.now(), k = lastOpen();
  let s;
  if (preview) s = 'Modo prueba: todas las estrellas visibles.';
  else if (now < at(1)) { const d = Math.floor((at(1) - now) / 1000); s = `La primera estrella se enciende en ${Math.floor(d / 86400)} d ${pad(Math.floor(d % 86400 / 3600))}:${pad(Math.floor(d % 3600 / 60))}:${pad(d % 60)}`; }
  else if (k < 24) { const d = Math.floor((at(k + 1) - now) / 1000); s = `Se encendió la estrella ${k}. La siguiente, en ${pad(Math.floor(d / 3600))}:${pad(Math.floor(d % 3600 / 60))}:${pad(d % 60)}`; }
  else s = 'Las 24 estrellas están encendidas. Feliz Navidad.';
  $('#status').textContent = s;
  const key = preview + '|' + k + '|' + admin;
  if (key !== tick.key) { tick.key = key; draw(); }
}

// ---------- Mensajes ----------
async function getDay(n) {
  const base = DEFAULTS[n - 1] || {};
  let d = {};
  if (LIVE) { const s = await F.getDoc(F.doc(db, 'days', String(n))); if (s.exists()) d = s.data(); }
  return { title: base.t, text: base.x, photo: base.photo, song: base.song, gift: base.gift, ask: base.ask, ...d };
}
function dust(x, y) {
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * 6.283, r = 40 + Math.random() * 110, p = h('div', { className: 'dust' });
    p.style.left = x + 'px'; p.style.top = y + 'px';
    p.style.setProperty('--x', Math.cos(a) * r + 'px'); p.style.setProperty('--y', Math.sin(a) * r + 'px');
    document.body.append(p); setTimeout(() => p.remove(), 1200);
  }
}
function media(u) {
  if (!u) return null;
  const y = u.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (y) return h('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + y[1], loading: 'lazy', allow: 'encrypted-media', title: 'Canción', className: 'vid' });
  if (/open\.spotify\.com/.test(u)) return h('iframe', { src: u.split('?')[0].replace('open.spotify.com/', 'open.spotify.com/embed/'), loading: 'lazy', allow: 'encrypted-media', title: 'Canción', className: 'spo' });
  return h('audio', { src: u, controls: true, className: 'aud' });
}
const answers = JSON.parse(localStorage.getItem('answers') || '{}');
const dlg = $('#dlg');
const close = h('button', { className: 'btn ghost', textContent: 'Cerrar', onclick: () => dlg.close() });
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => dlg.querySelectorAll('iframe,audio').forEach(e => e.remove()));

async function openDay(n, ev) {
  dlg.textContent = '';
  if (!admin && !isOpen(n)) {
    dlg.append(h('p', { className: 'n', textContent: 'Estrella ' + n }), h('h2', { textContent: 'Todavía no' }),
      h('p', { className: 'msg', textContent: 'Esta estrella se enciende el ' + n + ' de diciembre, a la medianoche. Vuelve entonces.' }), h('div', { className: 'acts' }, close));
    return dlg.showModal();
  }
  let d;
  try { d = await getDay(n); } catch { d = { title: 'Todavía no', text: 'Esta estrella aún no se enciende.' }; }
  if (admin) return editor(n, d);
  dust(ev.clientX, ev.clientY);
  if (n === 24) { let i = 0; const t = setInterval(() => { dust(innerWidth * Math.random(), innerHeight * .6 * Math.random()); if (++i > 8) clearInterval(t); }, 350); }
  dlg.append(h('p', { className: 'n', textContent: 'Estrella ' + n }));
  (d.photo || '').split(',').map(x => x.trim()).filter(Boolean).forEach(src => dlg.append(h('img', { src, alt: '', onerror() { this.remove(); } })));
  dlg.append(h('h2', { textContent: d.title || 'Para ti' }), h('p', { className: 'msg', textContent: d.text }));
  if (d.gift) dlg.append(h('div', { className: 'ticket' }, h('span', { textContent: 'Vale' }), h('b', { textContent: d.gift })));
  const m = media(d.song); if (m) dlg.append(m);
  if (d.ask) {
    const box = h('div', { className: 'ask' }, h('label', { textContent: d.ask }));
    const sent = () => box.append(h('p', { className: 'note', textContent: 'Tu respuesta llegó. Gracias por contármelo.' }));
    if (answers[n]) { box.append(h('p', { className: 'msg', textContent: answers[n] })); sent(); }
    else {
      const ta = h('textarea', { placeholder: 'Escribe aquí…' });
      const b = h('button', { className: 'btn', textContent: 'Enviar respuesta', onclick: async () => {
        const v = ta.value.trim(); if (!v) return;
        try { if (LIVE) await F.setDoc(F.doc(db, 'answers', String(n)), { text: v, at: F.serverTimestamp() }); answers[n] = v; localStorage.setItem('answers', JSON.stringify(answers)); ta.remove(); b.remove(); box.append(h('p', { className: 'msg', textContent: v })); sent(); }
        catch { b.textContent = 'No se pudo enviar. Inténtalo otra vez'; }
      } });
      box.append(ta, b);
    }
    dlg.append(box);
  }
  dlg.append(h('div', { className: 'acts' }, close));
  dlg.showModal();
  if (!seen.has(n) && isOpen(n)) {
    seen.add(n); localStorage.setItem('seen', JSON.stringify([...seen])); draw();
    if (LIVE && !preview) F.setDoc(F.doc(db, 'opened', String(n)), { at: F.serverTimestamp() }).catch(() => {});
  }
}

async function editor(n, d) {
  const f = (label, el) => [h('label', { textContent: label }), el];
  const ti = h('input', { value: d.title || '' }), ta = h('textarea', { value: d.text || '' });
  const ph = h('input', { value: d.photo || '', placeholder: 'img/dia' + String(n).padStart(2, '0') + '.jpg (varias separadas por coma)' });
  const so = h('input', { value: d.song || '', placeholder: 'Enlace de YouTube, Spotify o audio/cancion.mp3' });
  const gi = h('input', { value: d.gift || '', placeholder: 'Vale por…' }), as = h('input', { value: d.ask || '', placeholder: 'Pregunta para que ella responda' });
  const note = h('p', { className: 'note' });
  const get = c => F.getDoc(F.doc(db, c, String(n))).then(s => s.exists() ? s.data() : null).catch(() => null);
  get('opened').then(o => { if (o && o.at) note.textContent = 'Ella abrió esta estrella el ' + o.at.toDate().toLocaleString('es-PE') + '. '; });
  get('answers').then(a => { if (a) note.append(h('br'), 'Su respuesta: ' + a.text); });
  const save = h('button', { className: 'btn', textContent: 'Guardar', onclick: async () => {
    const v = x => x.value.trim();
    try { await F.setDoc(F.doc(db, 'days', String(n)), { title: v(ti), text: v(ta), photo: v(ph), song: v(so), gift: v(gi), ask: v(as) }); dlg.close(); }
    catch { note.textContent = 'No se pudo guardar. Revisa la conexión y las reglas de Firestore.'; }
  } });
  dlg.append(h('p', { className: 'n', textContent: 'Estrella ' + n + ' · modo creador' }), ...f('Título', ti), ...f('Mensaje', ta), ...f('Fotos', ph), ...f('Canción', so), ...f('Vale (opcional)', gi), ...f('Pregunta (opcional)', as), note, h('div', { className: 'acts' }, close, save));
  dlg.showModal();
}

// ---------- Estrella fugaz ----------
function shoot() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const x = Math.random() * 250, y = Math.random() * 500, l = svg('line', { x1: x, y1: y, x2: x + 50, y2: y + 25, class: 'shoot' });
  sky.append(l); setTimeout(() => l.remove(), 1500);
}
setTimeout(shoot, 3000); setInterval(shoot, 17000);

// ---------- Modo creador ----------
$('#admin').onclick = async () => {
  if (!LIVE) return alert('Primero conecta Firebase (mira el README).');
  if (admin) { await A.signOut(auth); return; }
  try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); } catch { alert('No se pudo iniciar sesión.'); }
};
if (LIVE) A.onAuthStateChanged(auth, u => { admin = !!u && u.email === ADMIN_EMAIL; $('#admin').style.opacity = admin ? 1 : ''; tick(); });

$('#title').textContent = 'Para ' + NOMBRE;
$('#intro').textContent = INTRO;
tick(); setInterval(tick, 1000);
