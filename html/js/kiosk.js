(() => {
    const root = document.getElementById('xsr-kiosk');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);

    const S = { open: false, brand: {}, categories: [], menu: [], soldout: {}, isOpen: true, card: true, cash: true, cat: 'all', lines: [], name: '', state: 'menu', busy: false, error: null, number: null };
    let closer = null;

    const total = () => S.lines.reduce((n, l) => n + l.price * l.qty, 0);
    const count = () => S.lines.reduce((n, l) => n + l.qty, 0);
    const sold = (id) => S.soldout && S.soldout[id] === true;
    const cfg = () => XS.config.orders || {};

    function img(src) {
        return src ? `<img src="${esc(src)}" alt="" onerror="this.remove()">` : I('food', 30);
    }

    function menuView() {
        const cats = [{ id: 'all', label: t('kiosk_all', null, 'Everything') }].concat(S.categories.filter((c) => S.menu.some((m) => m.category === c.id)));
        const items = S.menu.filter((m) => S.cat === 'all' || m.category === S.cat);
        const lines = S.lines.map((l) => `<div class="ks-line"><div><b>${esc(l.label)}</b><small>${XS.money(l.price)}</small></div><div class="rs-qty"><button data-act="minus" data-id="${esc(l.id)}">${I('minus', 13)}</button><span>${l.qty}</span><button data-act="plus" data-id="${esc(l.id)}">${I('plus', 13)}</button></div></div>`).join('');
        return `<div class="ks-body">
  <nav class="ks-cats">${cats.map((c) => `<button class="${S.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</nav>
  <section class="ks-items xsp-scroll">${items.map((m) => {
            const out = sold(m.id);
            const have = S.lines.find((l) => l.id === m.id);
            return `<button class="ks-item ${out ? 'out' : ''}" data-act="add" data-id="${esc(m.id)}" ${out ? 'disabled' : ''}><span class="ks-itemimg">${img(m.image)}</span><b>${esc(m.label)}</b><em>${out ? esc(t('kiosk_soldout', null, 'Sold out')) : XS.money(m.price)}</em>${have ? `<i class="rs-itemqty">${have.qty}</i>` : ''}</button>`;
        }).join('')}</section>
  <aside class="ks-cart">
    <div class="ks-carthead"><b>${esc(t('kiosk_your_order', null, 'Your order'))}</b>${S.lines.length ? `<span>${count()}</span>` : ''}</div>
    <div class="ks-lines xsp-scroll">${lines || `<div class="rs-empty">${I('bag', 26)}<span>${esc(t('kiosk_tap', null, 'Tap something to add it.'))}</span></div>`}</div>
    <div class="rs-total"><span>${esc(t('pos_total', null, 'Total'))}</span><b>${XS.money(total())}</b></div>
    <label class="rs-label">${esc(t('kiosk_name', null, 'Your name'))}</label><input class="rs-input" id="ks-name" value="${esc(S.name)}" maxlength="24" placeholder="${esc(t('kiosk_name_ph', null, 'So they can call you'))}">
    ${S.error ? `<div class="rs-msg err">${esc(S.error)}</div>` : ''}
    <div class="ks-pay">${S.card ? `<button class="rs-btn primary big" data-act="pay" data-method="card" ${S.lines.length && !S.busy ? '' : 'disabled'}>${I('id', 17)}${esc(t('kiosk_card', null, 'Pay by card'))}</button>` : ''}${S.cash ? `<button class="rs-btn ${S.card ? 'second' : 'primary'} big" data-act="pay" data-method="cash" ${S.lines.length && !S.busy ? '' : 'disabled'}>${I('cash', 17)}${esc(t('kiosk_cash', null, 'Pay cash'))}</button>` : ''}</div>
  </aside>
</div>`;
    }

    function doneView() {
        return `<div class="ks-done"><span class="rs-stateico">${I('check', 34)}</span><b>${esc(t('kiosk_thanks', null, 'Thanks! Your order number is'))}</b><p class="ks-number">#${esc(S.number)}</p><p>${esc(t('kiosk_watch', null, 'Watch the pickup screen. Staff will call your number.'))}</p><button class="rs-btn primary big" data-act="close">${esc(t('kiosk_done_btn', null, 'Done'))}</button></div>`;
    }

    function closedView() {
        return `<div class="ks-done closed"><span class="ks-closedico">${I('clock', 34)}</span><b>${esc(t('kiosk_closed', null, 'Closed right now'))}</b><p>${esc(t('kiosk_closed_sub', null, 'The kiosk takes orders while someone is working.'))}</p><button class="rs-btn big" data-act="close">${esc(t('kiosk_back', null, 'Back'))}</button></div>`;
    }

    function render() {
        if (!S.open) { root.innerHTML = ''; return; }
        const b = S.brand || {};
        const body = S.state === 'done' ? doneView() : (!S.isOpen ? closedView() : menuView());
        root.innerHTML = `<div class="xsp-stage"><div class="rs-kiosk ${XS.enter(root)}" id="ks-box">
  <header class="ks-head"><span class="rs-logo big">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : I('store', 26)}</span><div class="rs-headname"><b>${esc(b.label || '')}</b><small>${esc(t('kiosk_title', null, 'Order here'))}</small></div><span class="rs-sp"></span><button class="rs-x" data-act="close">${I('close', 16)}</button></header>
  ${body}
</div></div>`;
        XS.brand(root.querySelector('#ks-box'), b.colors, b.theme);
    }

    function add(id, delta) {
        const m = S.menu.find((x) => x.id === id);
        if (!m || sold(id)) return;
        let line = S.lines.find((l) => l.id === id);
        if (!line) {
            if (delta < 0 || S.lines.length >= (cfg().maxLines || 20)) return;
            line = { id: m.id, label: m.label, price: m.price, qty: 0 };
            S.lines.push(line);
        }
        line.qty = Math.max(0, Math.min(cfg().maxQuantity || 20, line.qty + delta));
        S.lines = S.lines.filter((l) => l.qty > 0);
        S.error = null;
    }

    async function pay(method) {
        if (!S.lines.length || S.busy) return;
        const nameEl = root.querySelector('#ks-name');
        if (nameEl) S.name = nameEl.value;
        S.busy = true;
        S.error = null;
        render();
        const res = await XS.rpc('kiosk:order', { lines: S.lines.map((l) => ({ id: l.id, qty: l.qty })), name: S.name, method });
        S.busy = false;
        if (!res.ok) { S.error = res.error; render(); return; }
        S.state = 'done';
        S.number = res.data.number;
        render();
        clearTimeout(closer);
        closer = setTimeout(() => { if (S.open && S.state === 'done') XS.close('kiosk'); }, 9000);
    }

    root.addEventListener('click', (e) => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        if (act === 'close') { XS.close('kiosk'); return; }
        if (act === 'cat') { S.cat = el.dataset.id; render(); return; }
        if (act === 'add') { add(el.dataset.id, 1); render(); return; }
        if (act === 'plus') { add(el.dataset.id, 1); render(); return; }
        if (act === 'minus') { add(el.dataset.id, -1); render(); return; }
        if (act === 'pay') pay(el.dataset.method);
    });

    root.addEventListener('input', (e) => { if (e.target.id === 'ks-name') S.name = e.target.value; });

    XS.apps.kiosk = {
        isOpen: () => S.open,
        escape() { XS.close('kiosk'); },
        on(action, data) {
            if (action === 'open') {
                S.open = true;
                S.brand = data.brand || {};
                S.categories = XS.list(data.categories);
                S.menu = XS.list(data.menu);
                S.soldout = data.soldout && !Array.isArray(data.soldout) ? data.soldout : {};
                S.isOpen = data.open !== false;
                S.card = data.card !== false;
                S.cash = data.cash !== false;
                S.cat = 'all';
                S.lines = [];
                S.name = '';
                S.state = 'menu';
                S.error = null;
                S.busy = false;
                XS.show('xsr-kiosk', true);
                render();
            } else if (action === 'soldout') {
                S.soldout = data.map && !Array.isArray(data.map) ? data.map : {};
                S.lines = S.lines.filter((l) => !sold(l.id));
                if (S.open && S.state === 'menu') render();
            } else if (action === 'state') {
                S.isOpen = data.open !== false;
                if (S.open && S.state === 'menu') render();
            } else if (action === 'close') {
                S.open = false;
                clearTimeout(closer);
                XS.show('xsr-kiosk', false);
                root.innerHTML = '';
            }
        },
    };
})();
