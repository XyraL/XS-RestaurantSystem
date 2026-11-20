(() => {
    const root = document.getElementById('xsr-pos');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);

    const S = { open: false, brand: {}, categories: [], menu: [], boss: false, register: null, cat: 'all', lines: [], name: '', people: [], customer: null, state: 'edit', pending: null, waitUntil: 0, message: null, number: null, loadingPeople: false, drive: false, soldout: {}, waiting: [], call: null, soldMode: false };
    const sold = (id) => S.soldout && S.soldout[id] === true;
    let tick = null;
    let driveTick = null;

    const total = () => S.lines.reduce((n, l) => n + l.price * l.qty, 0);
    const count = () => S.lines.reduce((n, l) => n + l.qty, 0);
    const cfg = () => XS.config.orders || {};

    function img(src, icon) {
        return src ? `<img src="${esc(src)}" alt="" onerror="this.parentNode.innerHTML='${XS.icon(icon || 'food', 22).replace(/"/g, '&quot;')}'">` : I(icon || 'food', 22);
    }

    function itemsView() {
        const list = S.menu.filter((m) => S.cat === 'all' || m.category === S.cat);
        return list.map((m) => `<button class="rs-item ${sold(m.id) ? 'out' : ''} ${S.soldMode ? 'marking' : ''}" data-act="${S.soldMode ? 'sold' : 'add'}" data-id="${esc(m.id)}"><span class="rs-itemimg">${img(m.image)}</span><b>${esc(m.label)}</b><em>${sold(m.id) ? esc(t('pos_soldout', null, 'Sold out')) : XS.money(m.price)}</em>${S.lines.find((l) => l.id === m.id) ? `<i class="rs-itemqty">${S.lines.find((l) => l.id === m.id).qty}</i>` : ''}</button>`).join('') || `<div class="rs-empty">${esc(t('pos_nothing', null, 'Nothing in this section.'))}</div>`;
    }

    function peopleView() {
        if (S.loadingPeople && !S.people.length) return `<div class="rs-hint">${esc(t('pos_looking', null, 'Looking around…'))}</div>`;
        if (!S.people.length) return `<div class="rs-hint">${esc(t('pos_nobody', null, 'Nobody is standing at the register.'))}</div>`;
        return S.people.map((p, i) => `<button class="rs-person ${S.customer === p.src ? 'on' : ''}" data-act="customer" data-src="${p.src}">${I(p.speaker ? 'car' : 'person', 15)}<span>${esc(p.speaker ? t('pos_speaker', null, 'At the speaker') : (i === 0 ? t('pos_closest', null, 'Closest person') : t('pos_person', { n: i + 1 }, `Person ${i + 1}`)))}</span>${p.speaker ? '' : `<em>${esc(Number(p.dist).toFixed(1))} m</em>`}</button>`).join('');
    }

    function driveView() {
        if (!S.drive) return '';
        const now = Date.now() / 1000;
        const cars = S.waiting.map((w, i) => {
            const mine = S.call && S.call.customer === w.src;
            const age = Math.max(0, Math.floor(now - (w.at || now)));
            return `<div class="rs-car ${mine ? 'live' : ''}">${I('car', 16)}<div><b>${esc(t('pos_car', { n: i + 1 }, `Car ${i + 1}`))}</b><small>${mine ? esc(t('pos_talking', null, 'Talking now')) : (w.answered ? esc(t('pos_answered', null, 'Being served')) : esc(t('pos_waiting_for', { s: age }, `Waiting ${age}s`)))}</small></div>${mine ? `<button class="rs-btn sm danger" data-act="hangup">${esc(t('pos_hangup', null, 'Hang up'))}</button>` : (w.answered ? '' : `<button class="rs-btn sm primary" data-act="answer" data-src="${w.src}">${I('mic', 13)}${esc(t('pos_answer', null, 'Answer'))}</button>`)}</div>`;
        }).join('');
        return `<div class="rs-drive"><div class="rs-drivehead">${I('car', 14)}<b>${esc(t('pos_drive', null, 'Drive-thru'))}</b><span>${S.waiting.length}</span></div>${cars || `<div class="rs-hint">${esc(t('pos_no_cars', null, 'No cars at the speaker.'))}</div>`}</div>`;
    }

    function ticketView() {
        const c = cfg();
        if (S.state === 'waiting') {
            const left = Math.max(0, Math.ceil((S.waitUntil - Date.now()) / 1000));
            return `<div class="rs-state"><div class="rs-spinner"></div><b>${esc(t('pos_waiting', null, 'Waiting for the customer to pay'))}</b><p>${esc(XS.money(total()))} · ${left}s</p><button class="rs-btn ghost" data-act="cancelpay">${esc(t('pos_cancel', null, 'Cancel'))}</button></div>`;
        }
        if (S.state === 'done') {
            return `<div class="rs-state ok"><span class="rs-stateico">${I('check', 30)}</span><b>${esc(t('pos_paid', null, 'Paid'))}</b><p class="rs-bignum">#${esc(S.number)}</p><p>${esc(t('pos_on_screen', null, 'It is on the kitchen screen now.'))}</p><button class="rs-btn primary" data-act="neworder">${I('plus', 15)}${esc(t('pos_new', null, 'New order'))}</button></div>`;
        }
        const lines = S.lines.map((l) => `<div class="rs-line"><div class="rs-linename"><b>${esc(l.label)}</b><small>${XS.money(l.price)}</small></div><div class="rs-qty"><button data-act="minus" data-id="${esc(l.id)}">${I('minus', 13)}</button><span>${l.qty}</span><button data-act="plus" data-id="${esc(l.id)}">${I('plus', 13)}</button></div><b class="rs-lineprice">${XS.money(l.price * l.qty)}</b></div>`).join('');
        const canCharge = S.lines.length && S.customer;
        return `${driveView()}<div class="rs-tickethead"><b>${esc(t('pos_order', null, 'Order'))}</b>${S.lines.length ? `<span>${count()} ${esc(t('pos_items', null, 'items'))}</span><button class="rs-link" data-act="clear">${esc(t('pos_clear', null, 'Clear'))}</button>` : ''}</div>
<div class="rs-lines xsp-scroll">${lines || `<div class="rs-empty">${I('receipt', 26)}<span>${esc(t('pos_tap', null, 'Tap items to add them.'))}</span></div>`}</div>
<div class="rs-total"><span>${esc(t('pos_total', null, 'Total'))}</span><b>${XS.money(total())}</b></div>
<label class="rs-label">${esc(t('pos_name', null, 'Name on the order'))}</label><input class="rs-input" id="rs-name" value="${esc(S.name)}" maxlength="24" placeholder="${esc(t('pos_name_ph', null, 'Ask for a name'))}">
<div class="rs-labelrow"><label class="rs-label">${esc(t('pos_who_pays', null, 'Who is paying'))}</label><button class="rs-link" data-act="people">${I('refresh', 12)}${esc(t('pos_refresh', null, 'Refresh'))}</button></div>
<div class="rs-people">${peopleView()}</div>
${S.message ? `<div class="rs-msg ${S.message.kind}">${esc(S.message.text)}</div>` : ''}
<div class="rs-actions"><button class="rs-btn primary big" data-act="charge" ${canCharge ? '' : 'disabled'}>${I('register', 17)}${esc(t('pos_charge', { total: XS.money(total()) }, `Charge ${XS.money(total())}`))}</button>
${S.boss && c.onTheHouse ? `<button class="rs-btn ghost" data-act="free" ${S.lines.length ? '' : 'disabled'}>${esc(t('pos_free', null, 'On the house'))}</button>` : ''}</div>`;
    }

    function render() {
        if (!S.open) { root.innerHTML = ''; return; }
        const b = S.brand || {};
        const cats = [{ id: 'all', label: t('pos_all', null, 'All') }].concat(S.categories.filter((c) => S.menu.some((m) => m.category === c.id)));
        root.innerHTML = `<div class="xsp-stage"><div class="rs-pos ${XS.enter(root)}" id="rs-posbox">
  <header class="rs-head"><span class="rs-logo">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : I('register', 20)}</span><div class="rs-headname"><b>${esc(b.label || '')}</b><small>${esc(S.register || t('pos_register', null, 'Register'))}</small></div><span class="rs-sp"></span><button class="rs-x" data-act="close">${I('close', 16)}</button></header>
  <div class="rs-posbody">
    <section class="rs-menu"><nav class="rs-cats">${cats.map((c) => `<button class="${S.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}">${esc(c.label)}</button>`).join('')}<span class="rs-sp"></span><button class="rs-soldbtn ${S.soldMode ? 'on' : ''}" data-act="soldmode">${I('tag', 13)}${esc(S.soldMode ? t('pos_sold_done', null, 'Done') : t('pos_sold_mode', null, 'Sold out'))}</button></nav>${S.soldMode ? `<div class="rs-soldhint">${esc(t('pos_sold_hint', null, 'Tap an item to mark it sold out, or tap it again when it is back. Everyone sees it straight away.'))}</div>` : ''}<div class="rs-items xsp-scroll">${itemsView()}</div></section>
    <aside class="rs-ticket">${ticketView()}</aside>
  </div></div></div>`;
        XS.brand(root.querySelector('#rs-posbox'), b.colors, b.theme);
    }

    async function loadPeople() {
        S.loadingPeople = true;
        render();
        const res = await XS.rpc('pos:nearby');
        S.loadingPeople = false;
        S.people = res.ok ? XS.list(res.data) : [];
        if (!S.people.some((p) => p.src === S.customer)) S.customer = S.people[0] ? S.people[0].src : null;
        if (S.open && S.state === 'edit') render();
    }

    function addLine(id, delta) {
        const m = S.menu.find((x) => x.id === id);
        if (!m) return;
        const max = cfg().maxQuantity || 20;
        let line = S.lines.find((l) => l.id === id);
        if (!line) {
            if (delta < 0 || S.lines.length >= (cfg().maxLines || 20)) return;
            line = { id: m.id, label: m.label, price: m.price, qty: 0 };
            S.lines.push(line);
        }
        line.qty = Math.max(0, Math.min(max, line.qty + delta));
        S.lines = S.lines.filter((l) => l.qty > 0);
        S.message = null;
    }

    async function ring(free) {
        if (!S.lines.length) return;
        const nameEl = root.querySelector('#rs-name');
        if (nameEl) S.name = nameEl.value;
        S.message = null;
        const res = await XS.rpc('pos:ring', { lines: S.lines.map((l) => ({ id: l.id, qty: l.qty })), customer: S.customer, name: S.name, free: free === true });
        if (!res.ok) { S.message = { kind: 'err', text: res.error }; render(); return; }
        if (res.data && res.data.done) {
            S.state = 'done';
            S.number = res.data.number;
            render();
            return;
        }
        S.state = 'waiting';
        S.pending = res.data.pending;
        S.waitUntil = Date.now() + ((cfg().payTimeout || 45) * 1000);
        render();
        clearInterval(tick);
        tick = setInterval(() => { if (S.state === 'waiting') render(); else clearInterval(tick); }, 1000);
    }

    function reset() {
        S.lines = [];
        S.name = '';
        S.state = 'edit';
        S.pending = null;
        S.number = null;
        S.message = null;
    }

    root.addEventListener('click', async (e) => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        if (act === 'close') return XS.apps.pos.escape();
        if (act === 'cat') { S.cat = el.dataset.id; render(); return; }
        if (act === 'add' && S.state === 'edit') { if (!sold(el.dataset.id)) addLine(el.dataset.id, 1); render(); return; }
        if (act === 'soldmode') { S.soldMode = !S.soldMode; render(); return; }
        if (act === 'sold') {
            const id = el.dataset.id;
            const res = await XS.rpc('pos:soldout', { id, on: !sold(id) });
            if (!res.ok) { S.message = { kind: 'err', text: res.error }; render(); }
            return;
        }
        if (act === 'answer') {
            const src = Number(el.dataset.src);
            const res = await XS.rpc('pos:answer', { src });
            if (!res.ok) { S.message = { kind: 'err', text: res.error }; render(); return; }
            S.call = { customer: src };
            S.customer = src;
            loadPeople();
            return;
        }
        if (act === 'hangup') { await XS.rpc('pos:hangup'); S.call = null; render(); return; }
        if (act === 'plus') { addLine(el.dataset.id, 1); render(); return; }
        if (act === 'minus') { addLine(el.dataset.id, -1); render(); return; }
        if (act === 'clear') { S.lines = []; S.message = null; render(); return; }
        if (act === 'customer') { S.customer = Number(el.dataset.src); render(); return; }
        if (act === 'people') { loadPeople(); return; }
        if (act === 'charge') { ring(false); return; }
        if (act === 'free') { ring(true); return; }
        if (act === 'cancelpay') {
            await XS.rpc('pos:cancel', { id: S.pending });
            S.state = 'edit';
            S.pending = null;
            S.message = { kind: 'err', text: t('pos_cancelled', null, 'Payment cancelled.') };
            render();
            return;
        }
        if (act === 'neworder') { reset(); render(); loadPeople(); }
    });

    root.addEventListener('input', (e) => { if (e.target.id === 'rs-name') S.name = e.target.value; });

    XS.apps.pos = {
        isOpen: () => S.open,
        escape() {
            if (S.state === 'waiting' && S.pending) XS.rpc('pos:cancel', { id: S.pending });
            XS.close('pos');
        },
        on(action, data) {
            if (action === 'open') {
                S.open = true;
                S.brand = data.brand || {};
                S.categories = XS.list(data.categories);
                S.menu = XS.list(data.menu);
                S.boss = data.boss === true;
                S.register = data.register || null;
                S.drive = data.drive === true;
                S.soldout = data.soldout && !Array.isArray(data.soldout) ? data.soldout : {};
                S.waiting = XS.list(data.waiting);
                S.call = null;
                S.soldMode = false;
                clearInterval(driveTick);
                if (S.drive) driveTick = setInterval(() => { if (S.open && S.state === 'edit' && !root.querySelector('input:focus')) render(); }, 2000);
                S.cat = 'all';
                S.people = [];
                S.customer = null;
                reset();
                XS.show('xsr-pos', true);
                render();
                loadPeople();
            } else if (action === 'result') {
                if (!S.open || data.id !== S.pending) return;
                if (data.result === 'paid') {
                    S.state = 'done';
                    S.number = data.number;
                } else if (data.result === 'nofunds') {
                    S.message = { kind: 'err', text: t('pos_nofunds', null, 'Their payment did not go through. They can try another way.') };
                } else {
                    S.state = 'edit';
                    S.pending = null;
                    S.message = { kind: 'err', text: data.result === 'timeout' ? t('pos_timeout', null, 'They did not pay in time.') : t('pos_declined', null, 'They said no to the payment.') };
                }
                render();
            } else if (action === 'soldout') {
                S.soldout = data.map && !Array.isArray(data.map) ? data.map : {};
                S.lines = S.lines.filter((l) => !sold(l.id));
                if (S.open && S.state === 'edit') render();
            } else if (action === 'waiting') {
                S.waiting = XS.list(data.list);
                if (S.open && S.state === 'edit') render();
                if (S.open && S.drive) loadPeople();
            } else if (action === 'call') {
                S.call = data.on ? { customer: data.customer } : null;
                if (S.open && S.state === 'edit') render();
            } else if (action === 'close') {
                S.open = false;
                clearInterval(tick);
                clearInterval(driveTick);
                XS.show('xsr-pos', false);
                root.innerHTML = '';
            }
        },
    };
})();
