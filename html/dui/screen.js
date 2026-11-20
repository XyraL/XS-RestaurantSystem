(() => {
    const el = document.getElementById('screen');
    let kind = new URLSearchParams(location.search).get('kind') || 'kitchen';
    const esc = (v) => String(v === null || v === undefined ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const list = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []));
    const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

    function rgb(hex) {
        const h = String(hex || '');
        if (!/^#[0-9a-f]{6}$/i.test(h)) return '255,120,73';
        const n = parseInt(h.slice(1), 16);
        return `${n >> 16},${(n >> 8) & 255},${n & 255}`;
    }

    function ink(hex) {
        const h = String(hex || '');
        if (!/^#[0-9a-f]{6}$/i.test(h)) return '#ffffff';
        const n = parseInt(h.slice(1), 16);
        return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#141008' : '#ffffff';
    }

    const SURFACE = { modern: '#1b1512', ticket: '#fdfcf8', pizza: '#fffaf0', coffee: '#2c312e', diner: '#fffdf7', pub: '#3a2416', sushi: '#fbf8f1', neon: '#16131f' };

    function lum(hex) {
        const n = parseInt(hex.slice(1), 16);
        const ch = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * ch(n >> 16) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
    }

    function readable(hex, surface) {
        const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
        const toward = lum(surface) > 0.4 ? 0 : 255;
        const n = parseInt(hex.slice(1), 16);
        const parts = [n >> 16, (n >> 8) & 255, n & 255];
        let out = hex;
        for (let i = 0; i <= 20 && ratio(out, surface) < 3.4; i += 1) {
            out = `#${parts.map((v) => Math.round(v + (toward - v) * (i / 20)).toString(16).padStart(2, '0')).join('')}`;
        }
        return out;
    }

    function brand(b) {
        const c = (b && b.colors) || {};
        const a = /^#[0-9a-f]{6}$/i.test(c.accent || '') ? c.accent : '#ff7849';
        const a2 = /^#[0-9a-f]{6}$/i.test(c.accent2 || '') ? c.accent2 : '#ffc24b';
        el.style.setProperty('--c1', a);
        el.style.setProperty('--c1-rgb', rgb(a));
        el.style.setProperty('--c1-ink', ink(a));
        el.style.setProperty('--c2', a2);
        el.style.setProperty('--c2-rgb', rgb(a2));
        const theme = b && Object.prototype.hasOwnProperty.call(SURFACE, b.theme) ? b.theme : 'modern';
        el.dataset.xt = theme;
        el.style.setProperty('--c1t', readable(a, SURFACE[theme]));
        el.style.setProperty('--c2t', readable(a2, SURFACE[theme]));
        el.style.setProperty('--c1d', readable(a, '#cea97c'));
        if (theme !== 'modern') {
            const ratio = (x, y) => (Math.max(lum(x), lum(y)) + 0.05) / (Math.min(lum(x), lum(y)) + 0.05);
            el.style.setProperty('--c1-ink', ratio('#ffffff', a) >= ratio('#141008', a) ? '#ffffff' : '#141008');
        }
    }

    function head(d, title) {
        const b = d.brand || {};
        return `<header><span class="logo">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : esc((b.label || '?').slice(0, 1))}</span><div class="name"><b>${esc(b.label || '')}</b><small>${esc(title)}</small></div><span class="sp"></span><span class="state ${d.open ? 'open' : ''}">${esc(d.open ? (d.labels.screen_open || 'Open') : (d.labels.screen_closed || 'Closed'))}</span><span class="clock">${esc(d.clock || '')}</span></header>`;
    }

    function kitchen(d) {
        const L = d.labels || {};
        const orders = list(d.orders);
        const open = orders.filter((o) => o.status !== 'ready');
        const ready = orders.filter((o) => o.status === 'ready');
        const shown = open.concat(ready).slice(0, 8);
        const more = orders.length - shown.length;
        const card = (o) => {
            const late = o.status !== 'ready' && o.age >= (d.late || 480);
            return `<div class="tk ${esc(o.status)} ${late ? 'late' : ''}"><div class="tkhead"><b>#${esc(o.number)}</b><span class="age">${clock(o.age || 0)}</span></div>${o.name ? `<div class="tkname">${esc(o.name)}</div>` : ''}<div class="tkstatus">${esc(L[`screen_${o.status}`] || o.status)}</div><ul>${list(o.lines).slice(0, 6).map((l) => `<li class="${l.done ? 'done' : ''}"><b>${esc(l.qty)}x</b>${esc(l.label)}</li>`).join('')}${list(o.lines).length > 6 ? `<li class="more">+${list(o.lines).length - 6}</li>` : ''}</ul></div>`;
        };
        return `${head(d, L.screen_kitchen || 'Kitchen')}<main class="kgrid">${shown.map(card).join('') || `<div class="empty">${esc(L.screen_empty || 'No open orders')}</div>`}</main>${more > 0 ? `<footer>+${more} ${esc(L.screen_orders || 'orders')}</footer>` : ''}`;
    }

    function pickup(d) {
        const L = d.labels || {};
        const orders = list(d.orders);
        const prep = orders.filter((o) => o.status !== 'ready').slice(0, 15);
        const ready = orders.filter((o) => o.status === 'ready').slice(0, 8);
        if (!d.open && !orders.length) {
            return `${head(d, '')}<main class="closed"><b>${esc(L.screen_closed || 'Closed')}</b></main>`;
        }
        return `${head(d, '')}<main class="pboard"><section class="prep"><h2>${esc(L.screen_preparing || 'Preparing')}</h2><div class="nums">${prep.map((o) => `<span>${esc(o.number)}</span>`).join('')}</div></section><section class="ready"><h2>${esc(L.screen_collect || 'Ready to collect')}</h2><div class="cards">${ready.map((o) => `<div class="rd ${o.age < 20 ? 'fresh' : ''}" style="animation-delay:-${(Date.now() / 1000) % 2}s"><b>${esc(o.number)}</b>${o.name ? `<small>${esc(o.name)}</small>` : ''}</div>`).join('')}</div></section></main>`;
    }

    let page = 0;
    let pageTimer = null;
    let last = null;
    const PER_PAGE = 12;

    function menu(d) {
        const L = d.labels || {};
        const flat = [];
        list(d.categories).forEach((c) => list(c.items).forEach((it) => flat.push(Object.assign({ cat: c.label }, it))));
        const pages = Math.max(1, Math.ceil(flat.length / PER_PAGE));
        if (page >= pages) page = 0;
        const shown = flat.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
        let lastCat = null;
        const cells = shown.map((it) => {
            const head = it.cat !== lastCat ? `<div class="mcat">${esc(it.cat)}</div>` : '';
            lastCat = it.cat;
            return `${head}<div class="mitem ${it.soldout ? 'out' : ''}"><span class="mimg">${it.image ? `<img src="${esc(it.image)}" alt="" onerror="this.remove()">` : ''}</span><b>${esc(it.label)}</b><em>${it.soldout ? esc(L.screen_soldout || 'Sold out') : `$${esc(it.price)}`}</em></div>`;
        }).join('');
        return `${head(d, d.title || L.screen_menu || 'Menu')}<main class="mgrid">${cells || `<div class="empty">${esc(L.screen_empty || '')}</div>`}</main>${pages > 1 ? `<footer class="mdots">${Array.from({ length: pages }, (_, i) => `<i class="${i === page ? 'on' : ''}"></i>`).join('')}</footer>` : ''}`;
    }

    function kiosk(d) {
        const L = d.labels || {};
        const b = d.brand || {};
        return `<div class="kbig ${d.open ? '' : 'shut'}"><span class="klogo">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : esc((b.label || '?').slice(0, 1))}</span><b class="kname">${esc(b.label || '')}</b><div class="kcta"><b>${esc(d.open ? (L.screen_tap || 'Order here') : (L.screen_kiosk_closed || 'Closed right now'))}</b><span>${esc(d.open ? (L.screen_tap_sub || '') : (L.screen_kiosk_closed_sub || ''))}</span></div></div>`;
    }

    function draw() {
        const d = last;
        if (!d) return;
        el.innerHTML = kind === 'pickup' ? pickup(d) : (kind === 'menu' ? menu(d) : (kind === 'kiosk' ? kiosk(d) : kitchen(d)));
    }

    window.addEventListener('message', (event) => {
        let d = event.data;
        if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { return; } }
        if (!d || typeof d !== 'object') return;
        if (d.blank) { el.className = 'blank'; delete el.dataset.xt; el.innerHTML = ''; last = null; page = 0; clearInterval(pageTimer); pageTimer = null; return; }
        if (d.kind === 'kitchen' || d.kind === 'pickup' || d.kind === 'menu' || d.kind === 'kiosk') kind = d.kind;
        d.labels = d.labels || {};
        brand(d.brand);
        el.className = `screen ${kind}`;
        last = d;
        draw();
        if (kind === 'menu' && !pageTimer) {
            pageTimer = setInterval(() => { page += 1; draw(); }, Math.max(3, Number(d.seconds) || 8) * 1000);
        }
    });
})();
