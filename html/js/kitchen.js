(() => {
    const root = document.getElementById('xsr-kitchen');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);

    const S = { open: false, mode: 'kitchen', brand: {}, list: [], offset: 0, late: 480, handOver: true, boss: false, pick: null, people: [], target: null, busy: false, confirm: null, message: null };
    let tick = null;

    const now = () => Math.floor(Date.now() / 1000) + S.offset;
    const age = (o) => Math.max(0, now() - (o.at || now()));
    const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const VIA = { drive: ['car', 'Drive-thru'], kiosk: ['monitor', 'Kiosk'], phone: ['bag', 'Phone pickup'], delivery: ['car', 'Delivery'] };
    const viaChip = (v) => (VIA[v] ? `<span class="rs-via ${v === 'delivery' ? 'del' : ''}">${I(VIA[v][0], 11)}${esc(t(`via_${v}`, null, VIA[v][1]))}</span>` : '');
    const viaTag = (v) => (VIA[v] ? ` <i class="rs-tag ${v === 'delivery' ? 'del' : ''}">${esc(t(`via_${v}`, null, VIA[v][1]))}</i>` : '');

    function ticket(o) {
        const a = age(o);
        const late = o.status !== 'ready' && a >= S.late;
        const conf = S.confirm === o.id;
        const actions = o.status === 'ready'
            ? `<button class="rs-btn sm ghost" data-act="status" data-id="${o.id}" data-status="new">${I('undo', 13)}${esc(t('k_back', null, 'Back to kitchen'))}</button><button class="rs-btn sm" data-act="status" data-id="${o.id}" data-status="collected">${I('check', 13)}${esc(t('k_collected', null, 'Collected'))}</button>`
            : `${o.status === 'new' ? `<button class="rs-btn sm" data-act="status" data-id="${o.id}" data-status="cooking">${I('flame', 13)}${esc(t('k_start', null, 'Start'))}</button>` : ''}<button class="rs-btn sm primary" data-act="status" data-id="${o.id}" data-status="ready">${I('bell', 13)}${esc(t('k_ready', null, 'Ready'))}</button>`;
        return `<div class="rs-tk ${o.status} ${late ? 'late' : ''}">
  <div class="rs-tkhead"><b>#${esc(o.number)}</b>${o.name ? `<span class="rs-tkname">${esc(o.name)}</span>` : ''}<span class="rs-sp"></span><span class="rs-tkage">${I('clock', 12)}${clock(a)}</span></div>
  <div class="rs-tkstatus">${esc(t(`k_status_${o.status}`, null, { new: 'New', cooking: 'Cooking', ready: 'Ready' }[o.status] || o.status))}${o.paidWith === 'free' ? ` · ${esc(t('k_free', null, 'on the house'))}` : ''}${viaChip(o.via)}</div>
  <div class="rs-tklines">${XS.list(o.lines).map((l, i) => `<button class="rs-tkline ${l.done ? 'done' : ''}" data-act="line" data-id="${o.id}" data-i="${i + 1}"><i>${l.done ? I('check', 12) : ''}</i><b>${l.qty}x</b><span>${esc(l.label)}</span></button>`).join('')}</div>
  <div class="rs-tkacts">${conf ? `<span class="rs-tkconfirm">${esc(t('k_cancel_q', null, 'Cancel this order?'))}</span><button class="rs-btn sm ghost" data-act="noconfirm">${esc(t('k_keep', null, 'Keep'))}</button><button class="rs-btn sm danger" data-act="status" data-id="${o.id}" data-status="cancelled">${esc(t('k_cancel', null, 'Cancel it'))}</button>` : `${actions}<span class="rs-sp"></span><button class="rs-x sm" data-act="confirm" data-id="${o.id}" title="${esc(t('k_cancel', null, 'Cancel it'))}">${I('trash', 13)}</button>`}</div>
</div>`;
    }

    function kitchenView() {
        const open = S.list.filter((o) => o.status !== 'ready');
        const ready = S.list.filter((o) => o.status === 'ready');
        return `<div class="rs-kboard">
  <section class="rs-klane"><div class="rs-klanehead"><b>${esc(t('k_tickets', null, 'Tickets'))}</b><em>${open.length}</em></div><div class="rs-kgrid xsp-scroll">${open.map(ticket).join('') || `<div class="rs-empty big">${I('chef', 30)}<span>${esc(t('k_none', null, 'No open tickets. Nice.'))}</span></div>`}</div></section>
  <section class="rs-klane ready"><div class="rs-klanehead"><b>${esc(t('k_ready_lane', null, 'Ready for pickup'))}</b><em>${ready.length}</em></div><div class="rs-kstack xsp-scroll">${ready.map(ticket).join('') || `<div class="rs-empty">${esc(t('k_none_ready', null, 'Nothing waiting.'))}</div>`}</div></section>
</div>`;
    }

    function deliveryPanel(o) {
        return `<div class="rs-deliv">${I('car', 18)}<div><b>${esc(t('k_delivery_to', null, 'Deliver to'))}</b><span>${esc(o.street || t('k_no_street', null, 'The customer'))}</span></div></div>
    ${o.taken ? `<div class="rs-hint">${esc(t('k_taken_by', { name: o.driver || '?' }, `${o.driver || 'Someone'} is driving this one.`))}</div>` : `<div class="rs-hint">${esc(t('k_delivery_hint', null, 'Take the food with you. Your GPS points to the customer and you hand it over when you get there.'))}</div>`}
    ${S.message ? `<div class="rs-msg ${S.message.kind}">${esc(S.message.text)}</div>` : ''}
    <button class="rs-btn primary big" data-act="take" ${S.busy ? 'disabled' : ''}>${I('car', 17)}${esc(o.taken ? t('k_take_over', null, 'Take it over') : t('k_take', null, 'Take the delivery'))}</button>`;
    }

    function counterView() {
        const ready = S.list.filter((o) => o.status === 'ready');
        const cooking = S.list.filter((o) => o.status !== 'ready');
        const sel = ready.find((o) => o.id === S.pick) || null;
        const people = S.people.map((p, i) => {
            const theirs = sel && XS.list(p.orders).includes(sel.number);
            return `<button class="rs-person ${S.target === p.src ? 'on' : ''}" data-act="target" data-src="${p.src}">${I('person', 15)}<span>${esc(theirs ? t('k_customer', null, 'The customer') : (i === 0 ? t('pos_closest', null, 'Closest person') : t('pos_person', { n: i + 1 }, `Person ${i + 1}`)))}</span>${theirs ? `<i class="rs-tag">#${esc(sel.number)}</i>` : ''}<em>${esc(Number(p.dist).toFixed(1))} m</em></button>`;
        }).join('');
        return `<div class="rs-counter">
  <section class="rs-klane"><div class="rs-klanehead"><b>${esc(t('k_ready_lane', null, 'Ready for pickup'))}</b><em>${ready.length}</em><span class="rs-sp"></span><small>${esc(t('k_cooking_n', { n: cooking.length }, `${cooking.length} still cooking`))}</small></div>
    <div class="rs-readylist xsp-scroll">${ready.map((o) => `<button class="rs-ready ${S.pick === o.id ? 'on' : ''}" data-act="pick" data-id="${o.id}"><b>#${esc(o.number)}</b><div><span>${esc(o.name || t('k_no_name', null, 'No name'))}${viaTag(o.via)}</span><small>${o.via === 'delivery' && o.street ? `${I('pin', 11)} ${esc(o.street)} · ` : ''}${XS.list(o.lines).map((l) => `${l.qty}x ${esc(l.label)}`).join(', ')}</small></div><em>${clock(age(o))}</em></button>`).join('') || `<div class="rs-empty big">${I('bag', 30)}<span>${esc(t('k_none_ready', null, 'Nothing waiting.'))}</span></div>`}</div></section>
  <aside class="rs-handpanel">${sel ? `<div class="rs-handhead"><b>#${esc(sel.number)}</b><span>${esc(sel.name || '')}</span></div>
    <div class="rs-handlines">${XS.list(sel.lines).map((l) => `<div><b>${l.qty}x</b> ${esc(l.label)}</div>`).join('')}</div>
    ${sel.via === 'delivery' ? deliveryPanel(sel) : `${S.handOver ? `<div class="rs-labelrow"><label class="rs-label">${esc(t('k_hand_to', null, 'Hand it to'))}</label><button class="rs-link" data-act="people">${I('refresh', 12)}${esc(t('pos_refresh', null, 'Refresh'))}</button></div><div class="rs-people">${people || `<div class="rs-hint">${esc(t('k_nobody', null, 'Nobody is at the counter.'))}</div>`}</div>
      <div class="rs-hint" style="margin-top:8px">${esc(t('k_hand_hint', null, 'The food comes out of your pockets, so cook it first.'))}</div>` : `<div class="rs-hint">${esc(t('k_hand_manual', null, 'Give the food to the customer yourself, then mark it collected.'))}</div>`}
    ${S.message ? `<div class="rs-msg ${S.message.kind}">${esc(S.message.text)}</div>` : ''}
    <button class="rs-btn primary big" data-act="hand" ${S.busy || (S.handOver && !S.target) ? 'disabled' : ''}>${I('bag', 17)}${esc(S.handOver ? t('k_hand', null, 'Hand over') : t('k_mark', null, 'Mark collected'))}</button>`}` : `<div class="rs-empty big">${I('hand', 30)}<span>${esc(t('k_pick', null, 'Pick a ready order.'))}</span></div>`}</aside>
</div>`;
    }

    function render() {
        if (!S.open) { root.innerHTML = ''; return; }
        const b = S.brand || {};
        const counter = S.mode === 'counter';
        root.innerHTML = `<div class="xsp-stage"><div class="rs-kitchen ${XS.enter(root)}" id="rs-kbox">
  <header class="rs-head"><span class="rs-logo">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : I(counter ? 'bag' : 'receipt', 20)}</span><div class="rs-headname"><b>${esc(b.label || '')}</b><small>${esc(counter ? t('k_counter', null, 'Pickup counter') : t('k_kitchen', null, 'Kitchen'))}</small></div><span class="rs-sp"></span>
    <span class="rs-headstat"><b>${S.list.filter((o) => o.status === 'new').length}</b>${esc(t('k_new', null, 'new'))}</span><span class="rs-headstat"><b>${S.list.filter((o) => o.status === 'cooking').length}</b>${esc(t('k_cooking', null, 'cooking'))}</span><span class="rs-headstat"><b>${S.list.filter((o) => o.status === 'ready').length}</b>${esc(t('k_ready_n', null, 'ready'))}</span>
    <button class="rs-x" data-act="close">${I('close', 16)}</button></header>
  ${counter ? counterView() : kitchenView()}
</div></div>`;
        XS.brand(root.querySelector('#rs-kbox'), b.colors, b.theme);
    }

    async function loadPeople() {
        const res = await XS.rpc('k:nearby');
        S.people = res.ok ? XS.list(res.data) : [];
        const sel = S.list.find((o) => o.id === S.pick);
        const theirs = sel && S.people.find((p) => XS.list(p.orders).includes(sel.number));
        if (theirs) S.target = theirs.src;
        else if (!S.people.some((p) => p.src === S.target)) S.target = S.people[0] ? S.people[0].src : null;
        if (S.open) render();
    }

    root.addEventListener('click', async (e) => {
        const el = e.target.closest('[data-act]');
        if (!el || S.busy) return;
        const act = el.dataset.act;
        const id = Number(el.dataset.id);
        if (act === 'close') return XS.close('kitchen');
        if (act === 'confirm') { S.confirm = id; render(); return; }
        if (act === 'noconfirm') { S.confirm = null; render(); return; }
        if (act === 'status') {
            S.confirm = null;
            const res = await XS.rpc('k:status', { id, status: el.dataset.status });
            if (!res.ok) XS.toast(res.error, 'error');
            return;
        }
        if (act === 'line') {
            const res = await XS.rpc('k:line', { id, index: Number(el.dataset.i) });
            if (!res.ok) XS.toast(res.error, 'error');
            return;
        }
        if (act === 'pick') { S.pick = id; S.message = null; render(); loadPeople(); return; }
        if (act === 'target') { S.target = Number(el.dataset.src); render(); return; }
        if (act === 'people') { loadPeople(); return; }
        if (act === 'take') {
            S.busy = true;
            S.message = null;
            render();
            const res = await XS.rpc('k:take', { id: S.pick });
            S.busy = false;
            if (!res.ok) { S.message = { kind: 'err', text: res.error }; render(); }
            return;
        }
        if (act === 'hand') {
            S.busy = true;
            S.message = null;
            render();
            const res = S.handOver ? await XS.rpc('k:hand', { id: S.pick, target: S.target }) : await XS.rpc('k:status', { id: S.pick, status: 'collected' });
            S.busy = false;
            if (!res.ok) { S.message = { kind: 'err', text: res.error }; render(); return; }
            XS.toast(t('k_handed', null, 'Order handed over.'), 'ok');
            S.pick = null;
            render();
        }
    });

    XS.apps.kitchen = {
        isOpen: () => S.open,
        escape() {
            if (S.confirm) { S.confirm = null; render(); return; }
            XS.close('kitchen');
        },
        on(action, data) {
            if (action === 'open') {
                S.open = true;
                S.mode = data.mode === 'counter' ? 'counter' : 'kitchen';
                S.brand = data.brand || {};
                S.list = XS.list(data.list);
                S.offset = Number(data.now) ? Number(data.now) - Math.floor(Date.now() / 1000) : 0;
                S.late = Number(data.late) || 480;
                S.handOver = data.handOver !== false;
                S.boss = data.boss === true;
                S.pick = null;
                S.target = null;
                S.people = [];
                S.confirm = null;
                S.message = null;
                XS.show('xsr-kitchen', true);
                render();
                clearInterval(tick);
                tick = setInterval(() => { if (S.open && !root.querySelector('input:focus')) render(); }, 1000);
            } else if (action === 'orders') {
                S.list = XS.list(data.list);
                if (Number(data.now)) S.offset = Number(data.now) - Math.floor(Date.now() / 1000);
                if (S.pick && !S.list.some((o) => o.id === S.pick && o.status === 'ready')) S.pick = null;
                if (S.open) render();
            } else if (action === 'close') {
                S.open = false;
                clearInterval(tick);
                XS.show('xsr-kitchen', false);
                root.innerHTML = '';
            }
        },
    };
})();
