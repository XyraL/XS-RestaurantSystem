const RESOURCE = (typeof GetParentResourceName === 'function') ? GetParentResourceName() : 'XS-RestaurantSystem';

const XS = {
    apps: {},
    T: {},
    config: {},
    open: new Set(),
    preview: null,
};
window.XS = XS;

XS.esc = function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

XS.t = function t(key, vars, fallback) {
    let s = XS.T[key] || (fallback !== undefined && fallback !== null ? fallback : key);
    if (vars) Object.keys(vars).forEach((k) => { s = s.split(`%{${k}}`).join(vars[k]); });
    return s;
};

XS.fix = function fix(value) {
    if (Array.isArray(value)) return value.map(fix);
    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return [];
        const out = {};
        keys.forEach((k) => { out[k] = fix(value[k]); });
        return out;
    }
    return value;
};

XS.list = function list(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
};

XS.post = async function post(endpoint, payload) {
    try {
        const res = await fetch(`https://${RESOURCE}/${endpoint}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}),
        });
        return XS.fix(await res.json());
    } catch (e) {
        return null;
    }
};

XS.rpc = async function rpc(name, payload) {
    if (XS.preview) return { ok: false, error: XS.t('preview_only', null, 'This is only a preview. Press Esc to go back.') };
    const res = await XS.post('rpc', { name, payload: payload || {} });
    if (!res) return { ok: false, error: XS.t('err_failed', null, 'That did not go through.') };
    return res;
};

XS.close = function close(app) {
    if (XS.preview && XS.preview === app) { XS.endPreview(); return; }
    XS.post('close', { app });
};

XS.startPreview = function startPreview(app, action, data) {
    const target = XS.apps[app];
    if (!target || !target.on) return;
    if (XS.preview) XS.endPreview();
    XS.preview = app;
    const bar = document.getElementById('xsr-previewbar');
    if (bar) bar.innerHTML = `<b>${XS.esc(XS.t('preview_title', null, 'Preview'))}</b><span>${XS.esc(XS.t('preview_sub', null, 'Nothing here is real.'))}</span><span class="xp-kbd">Esc</span><span>${XS.esc(XS.t('preview_back', null, 'to go back'))}</span>`;
    XS.show('xsr-previewbar', true);
    target.on(action, data);
};

XS.endPreview = function endPreview() {
    const app = XS.preview;
    if (!app) return;
    XS.preview = null;
    XS.show('xsr-previewbar', false);
    const target = XS.apps[app];
    if (target && target.on) target.on('close', {});
};

XS.clock = function clock(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

XS.ago = function ago(ts) {
    if (!ts) return '';
    const s = Math.max(0, Math.floor(Date.now() / 1000 - Number(ts)));
    if (s < 60) return XS.t('ago_now', null, 'just now');
    if (s < 3600) return XS.t('ago_min', { n: Math.floor(s / 60) }, `${Math.floor(s / 60)}m ago`);
    return XS.t('ago_hour', { n: Math.floor(s / 3600) }, `${Math.floor(s / 3600)}h ago`);
};

XS.time = function time(ts) {
    if (!ts) return '';
    const d = new Date(Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

XS.date = function date(ts) {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' ? (ts > 1e12 ? ts : ts * 1000) : ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

XS.accent = function accent(colour) {
    const hex = String(colour || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    const n = parseInt(hex.slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    document.documentElement.style.setProperty('--x-accent', hex);
    document.documentElement.style.setProperty('--x-ink', lum > 0.5 ? '#0b0b0d' : '#ffffff');
};

XS.toast = function toast(text, kind) {
    if (!text) return;
    const box = document.getElementById('xsp-toastbox');
    const el = document.createElement('div');
    el.className = `xsp-toast ${kind === 'error' ? 't-err' : (kind === 'ok' ? 't-ok' : '')}`;
    el.textContent = text;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3800);
};

XS.stage = function stage(root, cls) {
    root.innerHTML = `<div class="xsp-stage ${cls || ''}"></div>`;
    return root.firstElementChild;
};

XS.show = function show(id, on) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('xsp-hidden', !on);
    if (!on) delete el.dataset.entered;
};

XS.enter = function enter(root) {
    if (root.dataset.entered) return '';
    root.dataset.entered = '1';
    return 'rs-in';
};

XS.rgb = function rgb(hex) {
    const h = String(hex || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(h)) return '255,120,73';
    const n = parseInt(h.slice(1), 16);
    return `${n >> 16},${(n >> 8) & 255},${n & 255}`;
};

XS.ink = function ink(hex) {
    const h = String(hex || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(h)) return '#ffffff';
    const n = parseInt(h.slice(1), 16);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? '#141008' : '#ffffff';
};

XS.THEMES = {
    modern: { surface: '#211d1b' },
    ticket: { surface: '#fdfcf8' },
    pizza: { surface: '#fffaf0' },
    coffee: { surface: '#2c312e' },
    diner: { surface: '#fffdf7' },
    pub: { surface: '#3a2418' },
    sushi: { surface: '#fbf8f1' },
    neon: { surface: '#15131f' },
};

XS.theme = (id) => (Object.prototype.hasOwnProperty.call(XS.THEMES, id) ? id : 'modern');

XS.lum = function lum(hex) {
    const n = parseInt(String(hex).slice(1), 16);
    const ch = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
};

XS.contrast = function contrast(a, b) {
    const x = XS.lum(a);
    const y = XS.lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

XS.readable = function readable(hex, surface, min) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '') || !/^#[0-9a-f]{6}$/i.test(surface || '')) return hex;
    const need = min || 3.4;
    const toward = XS.lum(surface) > 0.4 ? 0 : 255;
    const n = parseInt(hex.slice(1), 16);
    const rgb = [n >> 16, (n >> 8) & 255, n & 255];
    let out = hex;
    for (let i = 0; i <= 20 && XS.contrast(out, surface) < need; i += 1) {
        const f = i / 20;
        out = `#${rgb.map((v) => Math.round(v + (toward - v) * f).toString(16).padStart(2, '0')).join('')}`;
    }
    return out;
};

XS.brand = function brand(el, colors, theme) {
    if (!el) return;
    const c = colors || {};
    const a = /^#[0-9a-f]{6}$/i.test(c.accent || '') ? c.accent : '#ff7849';
    const b = /^#[0-9a-f]{6}$/i.test(c.accent2 || '') ? c.accent2 : '#ffc24b';
    el.style.setProperty('--c1', a);
    el.style.setProperty('--c1-rgb', XS.rgb(a));
    el.style.setProperty('--c1-ink', XS.ink(a));
    el.style.setProperty('--c2', b);
    el.style.setProperty('--c2-rgb', XS.rgb(b));
    el.style.setProperty('--c2-ink', XS.ink(b));
    const id = XS.theme(theme);
    el.dataset.xt = id;
    el.style.setProperty('--c1t', XS.readable(a, XS.THEMES[id].surface));
    el.style.setProperty('--c2t', XS.readable(b, XS.THEMES[id].surface));
    el.style.setProperty('--c1d', XS.readable(a, '#cea97c'));
    el.style.setProperty('--c2d', XS.readable(b, '#cea97c'));
    if (id !== 'modern') {
        const inkFor = (hex) => (XS.contrast('#ffffff', hex) >= XS.contrast('#141008', hex) ? '#ffffff' : '#141008');
        el.style.setProperty('--c1-ink', inkFor(a));
        el.style.setProperty('--c2-ink', inkFor(b));
    }
};

XS.money = (n) => `$${Math.floor(Number(n) || 0).toLocaleString("en-US")}`;

function scale() {
    const s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    document.documentElement.style.setProperty('--xsp-s', String(s));
}
window.addEventListener('resize', scale);
scale();

window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object' || !msg.app) return;
    const data = XS.fix(msg.data || {});
    if (msg.app === 'core' && msg.action === 'boot') {
        XS.T = data.locale || {};
        XS.config = data.config || {};
        Object.values(XS.apps).forEach((app) => { if (app.boot) app.boot(); });
        return;
    }
    if (msg.app === 'core' && msg.action === 'config') {
        XS.config = data || {};
        return;
    }
    const app = XS.apps[msg.app];
    if (app && app.on) app.on(msg.action, data);
});

window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (XS.preview) { XS.endPreview(); return; }
    const order = ['cook', 'pay', 'phonefull', 'boss', 'kiosk', 'kitchen', 'pos', 'builder'];
    for (const name of order) {
        const app = XS.apps[name];
        if (app && app.isOpen && app.isOpen() && app.escape) { app.escape(); break; }
    }
});

window.addEventListener('load', () => { XS.post('ready', {}); });
