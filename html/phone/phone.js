(() => {
    const qs = new URLSearchParams(location.search);
    const host = location.hostname || '';
    const res = qs.get('res')
        || (host.startsWith('cfx-nui-') ? host.slice(8) : '')
        || (typeof GetParentResourceName === 'function' && GetParentResourceName())
        || 'XS-RestaurantSystem';
    const full = qs.get('full') === '1';
    document.documentElement.classList.add(full ? 'is-full' : 'is-phone');

    const post = window.XSR_PHONE_POST || ((name, data) => fetch(`https://${res}/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data || {}),
    }).then((r) => r.json()).catch(() => null));
    const call = async (name, arg) => (await post('phoneCall', { name, args: arg === undefined ? [] : [arg] })) || { ok: false, error: 'The food app could not reach the server.' };

    const app = document.getElementById('app');
    const main = document.getElementById('main');
    const nav = document.getElementById('nav');
    const bar = document.getElementById('cartbar');
    const sheet = document.getElementById('sheet');
    const toasts = document.getElementById('toasts');

    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const money = (v) => '$' + Math.round(Number(v) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const metres = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m || 0)} m`);
    const list = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []));
    const hex = (c, f) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : f);
    const rgb = (h) => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
    const ink = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? '#151010' : '#ffffff'; };

    const P = {
        back: '<path d="M15 18l-6-6 6-6"/>',
        bag: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
        car: '<path d="M5 16V11l2-4h10l2 4v5"/><path d="M3 16h18v2H3z"/><circle cx="7.5" cy="16" r="1.6"/><circle cx="16.5" cy="16" r="1.6"/>',
        clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        minus: '<path d="M5 12h14"/>',
        close: '<path d="M6 6l12 12M18 6L6 18"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a3 3 0 0 1-5.3 1.9A3 3 0 0 1 12 14a3 3 0 0 1-2.7-1.1A3 3 0 0 1 4 11V9z"/><path d="M5.5 13.5V20h13v-6.5"/>',
        search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
        receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
        food: '<path d="M7 3v8a2 2 0 0 0 2 2v8"/><path d="M11 3v8a2 2 0 0 1-2 2"/><path d="M17 21V3c-2 1-3 4-3 7v4h3"/>',
        card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    };
    const svg = (n, s) => `<svg viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}">${P[n] || P.food}</svg>`;
    const STYLE = { burger: 'Burger Joint', pizza: 'Pizza Place', cafe: 'Cafe', bar: 'Bar', diner: 'Diner', taco: 'Taco Spot', noodle: 'Noodle House', bakery: 'Bakery', icecream: 'Ice Cream Shop', club: 'Nightclub Bar', custom: 'Restaurant' };

    const S = { page: 'home', data: null, place: null, cat: 'all', cart: {}, mode: 'pickup', name: '', q: '', busy: false };
    let poll = null;

    function toast(text, kind) {
        if (!text) return;
        const el = document.createElement('div');
        el.className = `toast ${kind || ''}`;
        el.textContent = text;
        toasts.appendChild(el);
        setTimeout(() => el.remove(), 3600);
    }

    function brand(el, colors) {
        const c = colors || {};
        const a = hex(c.accent, '#ff7849');
        const b = hex(c.accent2, '#ffc24b');
        el.style.setProperty('--c1', a);
        el.style.setProperty('--c1-rgb', rgb(a));
        el.style.setProperty('--c1-ink', ink(a));
        el.style.setProperty('--c2', b);
        el.style.setProperty('--c2-rgb', rgb(b));
    }

    const place = () => (S.data ? list(S.data.list).find((b) => b.id === S.place) : null);
    const mine = () => (S.data ? list(S.data.mine) : []);
    const logo = (b, size) => `<span class="logo" style="--c1:${hex((b.colors || {}).accent, '#ff7849')};--c1-ink:${ink(hex((b.colors || {}).accent, '#ff7849'))};width:${size}px;height:${size}px">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : ''}${svg('store', Math.round(size * 0.48))}</span>`;
    const pic = (src) => `<span class="pic">${svg('food', 22)}${src ? `<img src="${esc(src)}" alt="" onerror="this.remove()">` : ''}</span>`;

    function stage(o) {
        if (o.status === 'ready') return o.via === 'delivery' ? (o.onWay ? 3 : 2) : 3;
        if (o.status === 'cooking') return 1;
        return 0;
    }

    function orderCard(o, compact) {
        const delivery = o.via === 'delivery';
        const steps = delivery ? ['Ordered', 'Cooking', 'Packed', 'On the way'] : ['Ordered', 'Cooking', 'Almost', 'Ready'];
        const st = stage(o);
        const head = delivery
            ? (o.onWay ? 'On the way to you' : (o.status === 'ready' ? 'Waiting for a driver' : 'Being made'))
            : (o.status === 'ready' ? 'Ready at the counter' : 'Being made');
        const b = list(S.data && S.data.list).find((x) => x.id === o.biz);
        return `<div class="ocard ${o.status === 'ready' ? 'ready' : ''}" style="--c1:${hex((o.colors || {}).accent, '#ff7849')};--c1-rgb:${rgb(hex((o.colors || {}).accent, '#ff7849'))}">
  <div class="ohead"><b>#${esc(o.number)}</b><div><span>${esc(o.business)}</span><small>${esc(head)}</small></div>${svg(delivery ? 'car' : 'bag', 18)}</div>
  ${compact ? '' : `<div class="osteps">${steps.map((s, i) => `<div class="${i <= st ? 'on' : ''}"><i></i><span>${esc(s)}</span></div>`).join('')}</div>
  <div class="ofoot"><span>${money(o.total)} · ${delivery ? 'Delivery' : 'Pickup'}</span>${!delivery && b && b.at ? `<button class="chip" data-act="gps" data-x="${b.at.x}" data-y="${b.at.y}">${svg('pin', 14)}GPS</button>` : ''}</div>`}
</div>`;
    }

    function home() {
        const d = S.data;
        const q = S.q.trim().toLowerCase();
        const places = list(d.list).filter((b) => !q || b.label.toLowerCase().includes(q) || (STYLE[b.style] || '').toLowerCase().includes(q));
        const active = mine();
        return `<header class="top"><div><small>Order food</small><h1>Food Order</h1></div><span class="bank">${svg('card', 15)}${money(d.bank)}</span>${full ? `<button class="iconbtn" data-act="close">${svg('close', 18)}</button>` : ''}</header>
${active.length ? `<section class="block"><div class="label">Your orders</div><div class="ostrip">${active.map((o) => `<button class="oslim" data-act="tab" data-page="orders">${orderCard(o, true)}</button>`).join('')}</div></section>` : ''}
<div class="search">${svg('search', 16)}<input id="q" placeholder="Search restaurants" value="${esc(S.q)}"></div>
<section class="block"><div class="label">Restaurants</div>
<div class="places">${places.map((b) => `<button class="place ${b.open ? '' : 'closed'}" data-act="place" data-id="${b.id}">${logo(b, 50)}<div class="pmeta"><b>${esc(b.label)}</b><small>${esc(STYLE[b.style] || 'Restaurant')} · ${metres(b.distance)}</small>
  <div class="ptags"><span class="tag ${b.open ? 'open' : ''}">${b.open ? 'Open' : 'Closed'}</span>${b.delivery ? `<span class="tag">${svg('car', 12)}${b.fee > 0 ? money(b.fee) : 'Free'} delivery</span>` : `<span class="tag">${svg('bag', 12)}Pickup</span>`}</div></div>${svg('back', 16).replace('<svg ', '<svg class="chev" ')}</button>`).join('') || `<div class="empty">${svg('store', 34)}<span>${q ? 'Nothing matches that.' : 'No restaurants are taking phone orders yet.'}</span></div>`}</div></section>`;
    }

    function menuPage() {
        const b = place();
        if (!b) { S.page = 'home'; return home(); }
        const cats = list(b.categories);
        const items = list(b.menu).filter((m) => S.cat === 'all' || m.category === S.cat);
        return `<header class="hero"><button class="iconbtn" data-act="home">${svg('back', 18)}</button>${logo(b, 64)}<h2>${esc(b.label)}</h2><small>${esc(STYLE[b.style] || 'Restaurant')} · ${metres(b.distance)}</small>
  <div class="ptags"><span class="tag ${b.open ? 'open' : ''}">${b.open ? 'Open now' : 'Closed right now'}</span>${b.delivery ? `<span class="tag">${svg('car', 12)}Delivers · ${b.fee > 0 ? money(b.fee) : 'free'}</span>` : ''}${b.at ? `<button class="tag link" data-act="gps" data-x="${b.at.x}" data-y="${b.at.y}">${svg('pin', 12)}GPS</button>` : ''}</div></header>
${b.open ? '' : '<div class="note">Nobody is working right now. You can look at the menu, but orders open when they do.</div>'}
<div class="cats">${[{ id: 'all', label: 'All' }].concat(cats).map((c) => `<button class="${S.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div>
<div class="menu">${items.map((m) => {
        const n = S.cart[m.id] || 0;
        return `<div class="mrow ${m.soldout ? 'out' : ''}">${pic(m.image)}<div class="mmeta"><b>${esc(m.label)}</b><em>${m.soldout ? 'Sold out' : money(m.price)}</em></div>
  ${m.soldout ? '' : (n ? `<div class="step"><button data-act="qty" data-id="${esc(m.id)}" data-n="-1">${svg('minus', 14)}</button><span>${n}</span><button data-act="qty" data-id="${esc(m.id)}" data-n="1">${svg('plus', 14)}</button></div>` : `<button class="add" data-act="qty" data-id="${esc(m.id)}" data-n="1">${svg('plus', 16)}</button>`)}</div>`;
    }).join('') || '<div class="empty"><span>Nothing in this section.</span></div>'}</div>`;
    }

    function ordersPage() {
        const active = mine();
        return `<header class="top"><div><small>Tracking</small><h1>My orders</h1></div>${full ? `<button class="iconbtn" data-act="close">${svg('close', 18)}</button>` : ''}</header>
<div class="olist">${active.map((o) => orderCard(o, false)).join('') || `<div class="empty">${svg('receipt', 34)}<span>No orders on the go.</span><button class="btn" data-act="tab" data-page="home">Find food</button></div>`}</div>`;
    }

    function cartLines(b) {
        return list(b.menu).filter((m) => (S.cart[m.id] || 0) > 0 && !m.soldout).map((m) => ({ m, n: S.cart[m.id] }));
    }

    function renderBar() {
        const b = S.page === 'place' ? place() : null;
        const lines = b ? cartLines(b) : [];
        if (!lines.length) { bar.innerHTML = ''; bar.classList.remove('show'); return; }
        const count = lines.reduce((a, l) => a + l.n, 0);
        const total = lines.reduce((a, l) => a + l.n * l.m.price, 0);
        bar.innerHTML = `<button data-act="cart"><em>${count}</em><span>View order</span><b>${money(total)}</b></button>`;
        bar.classList.add('show');
        brand(bar, b.colors);
    }

    function openCart() {
        const b = place();
        if (!b) return;
        const lines = cartLines(b);
        if (!lines.length) { sheet.classList.remove('open'); return; }
        if (!b.delivery) S.mode = 'pickup';
        const sub = lines.reduce((a, l) => a + l.n * l.m.price, 0);
        const fee = S.mode === 'delivery' ? (b.fee || 0) : 0;
        const total = sub + fee;
        const bank = Number(S.data.bank) || 0;
        sheet.innerHTML = `<div class="panel"><div class="grab"></div><div class="phead"><b>Your order</b><span>${esc(b.label)}</span><button class="iconbtn sm" data-act="sheetclose">${svg('close', 16)}</button></div>
  <div class="clines">${lines.map((l) => `<div class="cline"><div class="step sm"><button data-act="qty" data-id="${esc(l.m.id)}" data-n="-1">${svg('minus', 12)}</button><span>${l.n}</span><button data-act="qty" data-id="${esc(l.m.id)}" data-n="1">${svg('plus', 12)}</button></div><span>${esc(l.m.label)}</span><b>${money(l.n * l.m.price)}</b></div>`).join('')}</div>
  <div class="seg"><button class="${S.mode === 'pickup' ? 'on' : ''}" data-act="mode" data-mode="pickup">${svg('bag', 16)}Pickup</button><button class="${S.mode === 'delivery' ? 'on' : ''}" data-act="mode" data-mode="delivery" ${b.delivery ? '' : 'disabled'}>${svg('car', 16)}Delivery</button></div>
  <div class="hint">${S.mode === 'delivery' ? 'Staff bring it to where you are standing when you order. Stay close by.' : (b.delivery ? 'Pick it up at the counter. We text you when it is ready.' : 'This place is not delivering to you right now. Pick it up at the counter.')}</div>
  <input class="field" id="cname" maxlength="24" placeholder="Name for the order (optional)" value="${esc(S.name)}">
  <div class="sums"><div><span>Food</span><b>${money(sub)}</b></div>${S.mode === 'delivery' ? `<div><span>Delivery</span><b>${fee > 0 ? money(fee) : 'Free'}</b></div>` : ''}<div class="tot"><span>Total</span><b>${money(total)}</b></div></div>
  <button class="btn big" data-act="pay" ${S.busy || !b.open || total > bank ? 'disabled' : ''}>${svg('card', 17)}${!b.open ? 'Closed right now' : (total > bank ? 'Not enough in the bank' : `Pay ${money(total)} by card`)}</button>
</div>`;
        brand(sheet.firstElementChild, b.colors);
        sheet.classList.add('open');
    }

    function renderNav() {
        const n = mine().length;
        nav.innerHTML = `<button class="${S.page !== 'orders' ? 'on' : ''}" data-act="tab" data-page="home">${svg('store', 20)}<span>Restaurants</span></button><button class="${S.page === 'orders' ? 'on' : ''}" data-act="tab" data-page="orders">${svg('receipt', 20)}<span>My orders</span>${n ? `<em>${n}</em>` : ''}</button>`;
    }

    function render() {
        if (!S.data) return;
        const keep = main.scrollTop;
        const b = S.page === 'place' ? place() : null;
        main.innerHTML = S.page === 'place' ? menuPage() : (S.page === 'orders' ? ordersPage() : home());
        brand(app, b ? b.colors : null);
        renderNav();
        renderBar();
        main.scrollTop = keep;
        if (sheet.classList.contains('open')) openCart();
    }

    async function load(quiet) {
        const r = await call('phoneList');
        if (!r.ok) {
            if (!quiet) main.innerHTML = `<div class="empty full">${svg('store', 36)}<span>${esc(r.error || 'The food app could not reach the server.')}</span></div>`;
            return false;
        }
        S.data = r.data || {};
        if (document.activeElement && document.activeElement.id === 'q') return true;
        if (document.activeElement && document.activeElement.id === 'cname') return true;
        render();
        return true;
    }

    function go(page, id) {
        S.page = page;
        if (page === 'place') { S.place = id; S.cat = 'all'; S.cart = {}; S.mode = 'pickup'; }
        sheet.classList.remove('open');
        main.scrollTop = 0;
        render();
        main.scrollTop = 0;
    }

    app.addEventListener('input', (e) => {
        if (e.target.id === 'q') {
            S.q = e.target.value;
            const pos = e.target.selectionStart;
            render();
            const q = document.getElementById('q');
            if (q) { q.focus(); q.setSelectionRange(pos, pos); }
        } else if (e.target.id === 'cname') {
            S.name = e.target.value;
        }
    });

    app.addEventListener('click', async (e) => {
        if (e.target === sheet) { sheet.classList.remove('open'); return; }
        const el = e.target.closest('[data-act]');
        if (!el || el.disabled) return;
        const act = el.dataset.act;
        if (act === 'close') { post('phoneClose'); return; }
        if (act === 'home') return go('home');
        if (act === 'tab') return go(el.dataset.page === 'orders' ? 'orders' : 'home');
        if (act === 'place') return go('place', Number(el.dataset.id));
        if (act === 'cat') { S.cat = el.dataset.id; render(); return; }
        if (act === 'gps') { post('phoneGps', { x: Number(el.dataset.x), y: Number(el.dataset.y) }); toast('GPS set.'); return; }
        if (act === 'qty') {
            const id = el.dataset.id;
            S.cart[id] = Math.max(0, Math.min(20, (S.cart[id] || 0) + Number(el.dataset.n)));
            render();
            return;
        }
        if (act === 'cart') { openCart(); return; }
        if (act === 'sheetclose') { sheet.classList.remove('open'); return; }
        if (act === 'mode') { S.mode = el.dataset.mode === 'delivery' ? 'delivery' : 'pickup'; openCart(); return; }
        if (act === 'pay') {
            const b = place();
            if (!b || S.busy) return;
            S.busy = true;
            openCart();
            const lines = cartLines(b).map((l) => ({ id: l.m.id, qty: l.n }));
            const r = await call('phoneOrder', { biz: b.id, lines, mode: S.mode, name: S.name });
            S.busy = false;
            if (!r.ok) { toast(r.error, 'err'); openCart(); return; }
            toast(r.data && r.data.mode === 'delivery' ? `Ordered. #${r.data.number} is coming to you.` : `Ordered. Your number is #${r.data ? r.data.number : ''}.`, 'ok');
            S.cart = {};
            sheet.classList.remove('open');
            await load(true);
            go('orders');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (sheet.classList.contains('open')) { sheet.classList.remove('open'); return; }
        if (S.page !== 'home') { go('home'); return; }
        if (full) post('phoneClose');
        else if (window.parent !== window) window.parent.postMessage('xs-phone:escape', '*');
    });

    (async () => {
        const ok = await load(false);
        app.classList.remove('booting');
        if (!ok) return;
        clearInterval(poll);
        poll = setInterval(() => { if (!S.busy) load(true); }, 6000);
    })();
})();
