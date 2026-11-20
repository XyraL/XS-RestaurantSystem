(() => {
    const root = document.getElementById('xsr-boss');
    const t = XS.t;
    const esc = XS.esc;
    const money = XS.money;
    const I = (name, size) => XS.icon(name, size || 16);

    const S = { open: false, d: null, tab: 'overview', cat: 'all', cart: {}, mode: null, edits: {}, busy: false, offset: 0, message: null, bank: { in: '', out: '', inAcc: 'cash', outAcc: 'cash' } };
    let tick = null;

    const now = () => Math.floor(Date.now() / 1000) + S.offset;
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const VIA = { counter: ['register', 'Counter'], drive: ['car', 'Drive-thru'], kiosk: ['monitor', 'Kiosk'], phone: ['bag', 'Phone pickup'], delivery: ['car', 'Delivery'] };
    const viaLabel = (v) => t(`via_${v}`, null, (VIA[v] || [null, v])[1]);
    const STATUS = { new: 'New', cooking: 'Cooking', ready: 'Ready', collected: 'Collected', cancelled: 'Cancelled', expired: 'Expired', waiting: 'On the way', arrived: 'Arrived', refunded: 'Sent back' };
    const statusLabel = (s) => t(`b_status_${s}`, null, STATUS[s] || s);
    const img = (src, icon) => `${I(icon || 'food', 18)}${src ? `<img src="${esc(src)}" alt="" onerror="this.remove()">` : ''}`;

    function stat(label, value, sub, icon) {
        return `<div class="rs-bstat"><div class="rs-bstaticon">${I(icon, 18)}</div><div><small>${esc(label)}</small><b>${value}</b>${sub ? `<em>${esc(sub)}</em>` : ''}</div></div>`;
    }

    function overview() {
        const d = S.d;
        const days = XS.list(d.days);
        const max = Math.max(1, ...days.map((x) => Number(x.sales) || 0));
        const avg = d.week.orders > 0 ? Math.round(d.week.sales / d.week.orders) : 0;
        const via = d.via || {};
        const viaKeys = Object.keys(via).sort((a, b) => via[b] - via[a]);
        const viaMax = Math.max(1, ...viaKeys.map((k) => via[k]));
        const best = XS.list(d.best);
        const staff = XS.list(d.staff);
        return `<div class="rs-bstats">
  ${stat(t('b_today', null, 'Today'), money(d.today ? d.today.sales : 0), t('b_orders_n', { n: d.today ? d.today.orders : 0 }, `${d.today ? d.today.orders : 0} orders`), 'cash')}
  ${stat(t('b_week', null, 'Last 7 days'), money(d.week.sales), t('b_orders_n', { n: d.week.orders }, `${d.week.orders} orders`), 'chart')}
  ${stat(t('b_avg', null, 'Average order'), money(avg), t('b_avg_sub', null, 'over the last 7 days'), 'receipt')}
  ${stat(t('b_account', null, 'Business account'), d.balance === false || d.balance === null || d.balance === undefined ? '—' : money(d.balance), d.bank && d.bank.ready === false ? t('b_nobank', null, 'No banking script found') : (d.job || ''), 'safe')}
</div>
<div class="rs-bgrid two">
  <section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_sales_days', null, 'Sales by day'))}</b><small>${esc(t('b_sales_days_sub', null, 'Paid orders, not counting cancelled'))}</small></div>
    <div class="rs-days">${days.map((x, i) => {
        const h = Math.round(((Number(x.sales) || 0) / max) * 100);
        const day = new Date((Number(x.at) + 43200) * 1000);
        return `<div class="rs-day ${i === days.length - 1 ? 'today' : ''}"><span class="rs-dayval">${money(x.sales)}</span><div class="rs-daytrack"><i style="height:${Math.max(2, h)}%"></i></div><b>${esc(i === days.length - 1 ? t('b_today', null, 'Today') : DAYS[day.getDay()])}</b><small>${esc(t('b_orders_short', { n: x.orders }, `${x.orders} ord`))}</small></div>`;
    }).join('')}</div></section>
  <section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_sources', null, 'Where orders come from'))}</b><small>${esc(t('b_week', null, 'Last 7 days'))}</small></div>
    <div class="rs-hbars">${viaKeys.map((k) => `<div class="rs-hbar"><span>${I((VIA[k] || ['receipt'])[0], 14)}${esc(viaLabel(k))}</span><div><i style="width:${Math.round((via[k] / viaMax) * 100)}%"></i></div><b>${via[k]}</b></div>`).join('') || `<div class="rs-empty">${esc(t('b_no_orders', null, 'No orders yet.'))}</div>`}</div></section>
</div>
<div class="rs-bgrid two">
  <section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_best', null, 'Best sellers'))}</b><small>${esc(t('b_week', null, 'Last 7 days'))}</small></div>
    <div class="rs-blist">${best.map((e, i) => `<div class="rs-brow"><em class="rs-rank">${i + 1}</em><span class="rs-bimg">${img(e.image)}</span><b>${esc(e.label)}</b><span class="rs-sp"></span><small>${esc(t('b_sold_n', { n: e.qty }, `${e.qty} sold`))}</small><strong>${money(e.sales)}</strong></div>`).join('') || `<div class="rs-empty">${esc(t('b_no_orders', null, 'No orders yet.'))}</div>`}</div></section>
  <section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_staff', null, 'Staff'))}</b><small>${esc(t('b_staff_sub', null, 'Orders rung up, last 7 days'))}</small></div>
    <div class="rs-blist">${staff.map((s, i) => `<div class="rs-brow"><em class="rs-rank">${i + 1}</em><span class="rs-bimg">${I('person', 16)}</span><b>${esc(s.name)}</b><span class="rs-sp"></span><small>${esc(t('b_orders_n', { n: s.orders }, `${s.orders} orders`))}</small><strong>${money(s.sales)}</strong></div>`).join('') || `<div class="rs-empty">${esc(t('b_no_staff', null, 'Nobody has rung up an order yet.'))}</div>`}</div></section>
</div>`;
    }

    function orders() {
        const rows = XS.list(S.d.recent);
        if (!rows.length) return `<div class="rs-empty big">${I('receipt', 30)}<span>${esc(t('b_no_orders', null, 'No orders yet.'))}</span></div>`;
        return `<section class="rs-bcard flush"><table class="rs-btable">
  <thead><tr><th>#</th><th>${esc(t('b_col_time', null, 'Time'))}</th><th>${esc(t('b_col_customer', null, 'Customer'))}</th><th>${esc(t('b_col_via', null, 'Ordered at'))}</th><th>${esc(t('b_col_paid', null, 'Paid'))}</th><th>${esc(t('b_col_staff', null, 'Rung up by'))}</th><th class="r">${esc(t('b_col_total', null, 'Total'))}</th><th>${esc(t('b_col_status', null, 'Status'))}</th></tr></thead>
  <tbody>${rows.map((r) => `<tr><td><b>#${esc(r.number)}</b></td><td>${esc(XS.date(Number(r.created_at)))}</td><td>${esc(r.name || r.customer_name || '—')}</td><td>${esc(viaLabel(r.via || 'counter'))}</td><td>${esc(r.paid_with === 'free' ? t('b_free', null, 'On the house') : (r.paid_with || ''))}</td><td>${esc(r.staff_name || '—')}</td><td class="r"><b>${money(r.total)}</b></td><td><span class="rs-pill s-${esc(r.status)}">${esc(statusLabel(r.status))}</span></td></tr>`).join('')}</tbody>
</table></section>`;
    }

    function toggle(key, label, hint, icon) {
        const f = (S.d.flags || {})[key] || {};
        const allowed = f.allowed === true;
        return `<div class="rs-btoggle ${allowed ? '' : 'off'}"><span class="rs-bstaticon">${I(icon, 18)}</span><div><b>${esc(label)}</b><small>${esc(allowed ? hint : t('b_flag_builder', null, 'Switch it on in the builder first.'))}</small></div><span class="rs-sp"></span>
  <button class="rs-switch ${f.on && allowed ? 'on' : ''}" data-act="flag" data-key="${key}" ${allowed ? '' : 'disabled'}><i></i></button></div>`;
    }

    function menu() {
        const d = S.d;
        const cats = XS.list(d.categories);
        const list = XS.list(d.menu).filter((m) => S.cat === 'all' || m.category === S.cat);
        const catLabel = (id) => (cats.find((c) => c.id === id) || {}).label || '';
        return `<div class="rs-bgrid two">${toggle('phone', t('b_phone', null, 'Phone orders'), t('b_phone_hint', null, 'Customers can order from the food app and pick up.'), 'bag')}${toggle('delivery', t('b_delivery', null, 'Deliveries'), t('b_delivery_hint', null, 'Phone orders can be delivered by your staff.'), 'car')}</div>
${d.prices ? '' : `<div class="rs-msg">${esc(t('b_prices_off', null, 'The server has switched off price changes. Sold out still works.'))}</div>`}
<div class="rs-cats">${[{ id: 'all', label: t('b_all', null, 'All') }].concat(cats).map((c) => `<button class="${S.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div>
<section class="rs-bcard flush"><div class="rs-bmenu">${list.map((m) => {
        const val = S.edits[m.id] !== undefined ? S.edits[m.id] : m.price;
        const n = Number(val);
        const changed = S.edits[m.id] !== undefined && n !== m.price;
        const bad = !Number.isFinite(n) || n < m.low || n > m.high;
        return `<div class="rs-bmrow ${m.available ? '' : 'hidden'}"><span class="rs-bimg">${img(m.image)}</span><div class="rs-bmname"><b>${esc(m.label)}</b><small>${esc(catLabel(m.category))}${m.available ? '' : ` · ${esc(t('b_hidden', null, 'Not on the menu'))}`}</small></div>
  <div class="rs-bmbase"><small>${esc(t('b_builder_price', null, 'Builder price'))}</small><b>${money(m.base)}</b></div>
  <div class="rs-bmprice"><div class="rs-money ${changed && bad ? 'bad' : ''}"><span>$</span><input type="number" min="${m.low}" max="${m.high}" step="1" value="${esc(val)}" data-price="${esc(m.id)}" ${d.prices ? '' : 'disabled'}></div><small>${money(m.low)} – ${money(m.high)}</small></div>
  <button class="rs-btn sm ${changed && !bad ? 'primary' : ''}" data-act="price" data-id="${esc(m.id)}" ${changed && !bad && d.prices ? '' : 'disabled'}>${esc(t('b_save', null, 'Save'))}</button>
  <button class="rs-btn sm ${m.soldout ? 'danger' : 'ghost'}" data-act="soldout" data-id="${esc(m.id)}" ${m.available ? '' : 'disabled'}>${esc(m.soldout ? t('b_soldout_on', null, 'Sold out') : t('b_soldout', null, 'Mark sold out'))}</button>
</div>`;
    }).join('') || `<div class="rs-empty">${esc(t('err_no_menu', null, 'There is nothing on the menu yet.'))}</div>`}</div></section>`;
    }

    function supplyStatus(o) {
        if (o.status === 'waiting') return t('b_arrives', { time: XS.clock(o.ready - now()) }, `Arrives in ${XS.clock(o.ready - now())}`);
        if (o.status === 'arrived') return o.mode === 'delivery' ? t('b_at_dock', null, 'At the back door') : t('b_at_warehouse', null, 'Ready at the warehouse');
        return statusLabel(o.status);
    }

    function supplies() {
        const d = S.d;
        if (!d.supplyOn) return `<div class="rs-empty big">${I('box', 30)}<span>${esc(t('err_supply_off', null, 'Supply orders are switched off.'))}</span></div>`;
        const items = XS.list(d.supplies);
        const modes = XS.list(d.modes);
        if (!S.mode || !modes.includes(S.mode)) S.mode = modes[0] || null;
        const lines = items.filter((s) => (S.cart[s.item] || 0) > 0);
        const total = lines.reduce((a, s) => a + s.price * S.cart[s.item], 0);
        const recent = XS.list(d.supplyRecent);
        const MODE = {
            delivery: [t('supply_mode_delivery', null, 'Van to the back door'), t('b_takes', { n: d.deliveryMinutes }, `About ${d.deliveryMinutes} min`), 'car'],
            pickup: [t('supply_mode_pickup', null, 'Pick up at the warehouse'), t('b_takes', { n: d.pickupMinutes }, `About ${d.pickupMinutes} min`), 'warehouse'],
        };
        const balance = typeof d.balance === 'number' ? d.balance : null;
        return `<div class="rs-bsupply">
  <section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_stock', null, 'Stock list'))}</b><small>${esc(t('b_stock_sub', null, 'Paid from the business account'))}</small></div>
    ${items.length ? `<div class="rs-bsgrid">${items.map((s) => {
        const n = S.cart[s.item] || 0;
        return `<div class="rs-bsitem ${n ? 'on' : ''}"><span class="rs-bsimg">${img(s.image, 'box')}</span><b>${esc(s.label)}</b><em>${money(s.price)} ${esc(t('b_each', null, 'each'))}</em>
  <div class="rs-qty"><button data-act="qty" data-item="${esc(s.item)}" data-n="-1">${I('minus', 13)}</button><span>${n}</span><button data-act="qty" data-item="${esc(s.item)}" data-n="1">${I('plus', 13)}</button></div><button class="rs-link" data-act="qty" data-item="${esc(s.item)}" data-n="10">+10</button></div>`;
    }).join('')}</div>` : `<div class="rs-empty big">${I('box', 30)}<span>${esc(t('b_no_supplies', null, 'Nothing on the stock list yet. Ask staff to add supplies in the builder.'))}</span></div>`}
  </section>
  <aside class="rs-bcard rs-bcart"><div class="rs-bcardhead"><b>${esc(t('b_order', null, 'Order'))}</b>${lines.length ? `<button class="rs-link" data-act="clear">${esc(t('b_clear', null, 'Clear'))}</button>` : ''}</div>
    <div class="rs-bclines xsp-scroll">${lines.map((s) => `<div><b>${S.cart[s.item]}x</b><span>${esc(s.label)}</span><em>${money(s.price * S.cart[s.item])}</em></div>`).join('') || `<div class="rs-hint">${esc(t('b_pick_stock', null, 'Add stock from the list.'))}</div>`}</div>
    <label class="rs-label">${esc(t('b_how', null, 'How it gets here'))}</label>
    ${modes.length ? `<div class="rs-bmodes">${modes.map((m) => `<button class="${S.mode === m ? 'on' : ''}" data-act="mode" data-mode="${m}">${I(MODE[m][2], 16)}<div><b>${esc(MODE[m][0])}</b><small>${esc(MODE[m][1])}</small></div></button>`).join('')}</div>` : `<div class="rs-msg err">${esc(t('b_no_modes', null, 'Nothing is set up yet. Staff need to place a back door for this business or set the supply warehouse in the builder.'))}</div>`}
    <div class="rs-total"><span>${esc(t('b_total', null, 'Total'))}</span><b>${money(total)}</b></div>
    ${balance !== null ? `<div class="rs-hint">${esc(t('b_after', { amount: money(balance - total) }, `Account after: ${money(balance - total)}`))}</div>` : ''}
    ${S.message ? `<div class="rs-msg ${S.message.kind}">${esc(S.message.text)}</div>` : ''}
    <button class="rs-btn primary big wide" data-act="order" ${S.busy || !lines.length || !S.mode || (balance !== null && total > balance) ? 'disabled' : ''}>${I('box', 17)}${esc(t('b_place', null, 'Place the order'))}</button>
    <label class="rs-label">${esc(t('b_recent_supply', null, 'Recent supply orders'))}</label>
    <div class="rs-bsrecent xsp-scroll">${recent.map((o) => `<div class="rs-bsr"><div><b>${esc(XS.list(o.lines).map((l) => `${l.count}x ${l.label}`).join(', '))}</b><small>${esc(XS.date(o.at))} · ${esc(o.by || '')}</small></div><span class="rs-pill s-${esc(o.status)}">${esc(supplyStatus(o))}</span><em>${money(o.total)}</em></div>`).join('') || `<div class="rs-hint">${esc(t('b_no_supply_orders', null, 'No supply orders yet.'))}</div>`}</div>
  </aside>
</div>`;
    }

    function bankForm(kind) {
        const d = S.d;
        const bank = d.bank || {};
        const key = kind === 'deposit' ? 'in' : 'out';
        const acc = S.bank[`${key}Acc`];
        const val = S.bank[key];
        const n = Number(val);
        const mine = d.mine || { cash: 0, bank: 0 };
        const balance = typeof d.balance === 'number' ? d.balance : null;
        const max = Number(bank.max) || 1000000;
        const room = kind === 'deposit' ? mine[acc] : (balance === null ? max : balance);
        const ok = Number.isFinite(n) && n >= 1 && n <= max && n <= room;
        const title = kind === 'deposit' ? t('b_bank_in', null, 'Put money in') : t('b_bank_out', null, 'Take money out');
        const sub = kind === 'deposit' ? t('b_bank_in_sub', null, 'From you into the business account') : t('b_bank_out_sub', null, 'From the business account to you');
        if (!bank[kind]) {
            return `<section class="rs-bcard rs-bform off"><div class="rs-bcardhead"><b>${esc(title)}</b></div><div class="rs-empty">${I('lock', 22)}<span>${esc(kind === 'deposit' ? t('b_bank_in_no', null, 'Your rank cannot put money in here.') : t('b_bank_out_no', null, 'Your rank cannot take money out here. Ask the boss.'))}</span></div></section>`;
        }
        return `<section class="rs-bcard rs-bform"><div class="rs-bcardhead"><b>${esc(title)}</b><small>${esc(sub)}</small></div>
  <div class="rs-money big ${val !== '' && !ok ? 'bad' : ''}"><span>$</span><input type="number" min="1" max="${max}" step="1" data-bank="${key}" value="${esc(val)}" placeholder="0"></div>
  <div class="rs-bchips">${[100, 500, 1000, 5000].map((x) => `<button data-act="bankquick" data-key="${key}" data-n="${x}">+${money(x)}</button>`).join('')}<button data-act="bankall" data-key="${key}">${esc(t('b_bank_all', null, 'All'))}</button></div>
  <div class="rs-bseg">${['cash', 'bank'].map((a) => `<button class="${acc === a ? 'on' : ''}" data-act="bankacc" data-key="${key}" data-acc="${a}">${I(a === 'cash' ? 'cash' : 'building', 15)}<div><b>${esc(kind === 'deposit' ? (a === 'cash' ? t('b_from_cash', null, 'From cash') : t('b_from_bank', null, 'From your bank')) : (a === 'cash' ? t('b_to_cash', null, 'As cash') : t('b_to_bank', null, 'To your bank')))}</b><small>${esc(t('b_you_have', { amount: money(mine[a]) }, `You have ${money(mine[a])}`))}</small></div></button>`).join('')}</div>
  <button class="rs-btn ${kind === 'deposit' ? 'primary' : 'second'} big wide" data-act="bank" data-kind="${kind}" ${ok && !S.busy ? '' : 'disabled'}>${I(kind === 'deposit' ? 'plus' : 'minus', 16)}${esc(ok ? (kind === 'deposit' ? t('b_bank_in_go', { amount: money(n) }, `Put in ${money(n)}`) : t('b_bank_out_go', { amount: money(n) }, `Take out ${money(n)}`)) : title)}</button>
</section>`;
    }

    function account() {
        const d = S.d;
        const bank = d.bank || {};
        const recent = XS.list(bank.recent);
        if (!bank.on) return `<div class="rs-empty big">${I('safe', 30)}<span>${esc(t('err_bank_off', null, 'The business account is switched off.'))}</span></div>`;
        if (bank.ready === false) {
            return `<section class="rs-bcard rs-bnobank"><div class="rs-bstaticon">${I('alert', 20)}</div><div><b>${esc(t('b_nobank', null, 'No banking script found'))}</b>
  <p>${esc(t('b_nobank_text', null, 'The business account lives in your banking script, and none of the ones this works with is running. Start one of these, then reopen the office:'))}</p>
  <div class="rs-bbanks">${XS.list(bank.supported).map((n) => `<span>${esc(n)}</span>`).join('')}</div>
  <p class="rs-hint">${esc(t('b_nobank_hint', null, 'Using a different banking script? Tell XyraL which one so it can be added.'))}</p></div></section>`;
        }
        return `<section class="rs-bcard rs-bbal"><div class="rs-bstaticon">${I('safe', 20)}</div><div><small>${esc(t('b_account', null, 'Business account'))}</small><b>${typeof d.balance === 'number' ? money(d.balance) : '—'}</b><em>${esc(d.job || '')}${d.banking ? ` · ${esc(d.banking)}` : ''}</em>${typeof d.balance === 'number' ? '' : `<p class="rs-hint">${esc(t('b_noaccount', { job: d.job || '' }, `Your banking script has no account called "${d.job || ''}" yet. It is made the first time money goes in.`))}</p>`}</div></section>
<div class="rs-bgrid two">${bankForm('deposit')}${bankForm('withdraw')}</div>
<section class="rs-bcard"><div class="rs-bcardhead"><b>${esc(t('b_bank_recent', null, 'Money in and out'))}</b><small>${esc(t('b_bank_recent_sub', null, 'Done from the office'))}</small></div>
  <div class="rs-blist">${recent.map((r) => `<div class="rs-brow rs-bmove ${r.kind}"><span class="rs-bimg">${I(r.kind === 'deposit' ? 'plus' : 'minus', 15)}</span><b>${esc(r.kind === 'deposit' ? t('b_moved_in', null, 'Put in') : t('b_moved_out', null, 'Taken out'))}</b><small>${esc(r.by || '')} · ${esc(t(`bank_account_${r.account}`, null, r.account === 'bank' ? 'Bank' : 'Cash'))} · ${esc(XS.date(r.at))}</small><span class="rs-sp"></span><strong>${r.kind === 'deposit' ? '+' : '−'}${money(r.amount)}</strong></div>`).join('') || `<div class="rs-empty">${esc(t('b_bank_none', null, 'Nothing moved yet.'))}</div>`}</div></section>`;
    }

    const TABS = [
        ['overview', 'chart', 'Overview'],
        ['orders', 'receipt', 'Orders'],
        ['menu', 'tag', 'Menu and prices'],
        ['supplies', 'box', 'Supplies'],
        ['account', 'safe', 'Business account'],
    ];

    function render() {
        if (!S.open || !S.d) { root.innerHTML = ''; return; }
        const d = S.d;
        const b = d.brand || {};
        const scroll = root.querySelector('.rs-bmain');
        const top = scroll ? scroll.scrollTop : 0;
        const bank = d.bank || {};
        const bankTab = bank.on && (bank.deposit || bank.withdraw);
        const tabs = TABS.filter(([id]) => (d.limited ? id === 'account' : (id !== 'account' || bankTab)));
        if (!tabs.some(([id]) => id === S.tab)) S.tab = tabs[0] ? tabs[0][0] : 'overview';
        const body = { overview, orders, menu, supplies, account }[S.tab]();
        root.innerHTML = `<div class="xsp-stage"><div class="rs-boss ${XS.enter(root)}" id="rs-bbox">
  <header class="rs-head"><span class="rs-logo">${b.logo ? `<img src="${esc(b.logo)}" alt="" onerror="this.remove()">` : I('chart', 20)}</span><div class="rs-headname"><b>${esc(b.label || '')}</b><small>${esc(t('b_office', null, 'Office'))}</small></div>
    <span class="rs-pill ${d.open ? 's-ready' : 's-cancelled'}">${esc(d.open ? t('screen_open', null, 'Open') : t('screen_closed', null, 'Closed'))}</span><span class="rs-sp"></span>
    <button class="rs-btn sm ghost" data-act="refresh">${I('refresh', 13)}${esc(t('pos_refresh', null, 'Refresh'))}</button>
    <button class="rs-x" data-act="close">${I('close', 16)}</button></header>
  <div class="rs-bossbody">
    <nav class="rs-bnav">${tabs.map(([id, icon, label]) => `<button class="${S.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}">${I(icon, 17)}<span>${esc(t(`b_tab_${id}`, null, label))}</span></button>`).join('')}
      <span class="rs-sp"></span>
      ${d.bossmenu && !d.limited ? `<button class="rs-bnavboss" data-act="bossmenu">${I('users', 17)}<span>${esc(t('b_bossmenu', null, 'Boss menu'))}</span></button><small class="rs-bnavhint">${esc(t('b_bossmenu_hint', null, 'Hire, fire, wages and the account'))}</small>` : ''}
    </nav>
    <main class="rs-bmain xsp-scroll">${body}</main>
  </div>
</div></div>`;
        XS.brand(root.querySelector('#rs-bbox'), b.colors, b.theme);
        const main = root.querySelector('.rs-bmain');
        if (main) main.scrollTop = top;
    }

    async function refresh() {
        const res = await XS.rpc('boss:refresh');
        if (!res.ok) { XS.toast(res.error, 'error'); return; }
        apply(res.data);
        render();
    }

    function apply(d) {
        S.d = d || {};
        S.d.week = S.d.week || { sales: 0, orders: 0 };
        S.offset = Number(S.d.now) ? Number(S.d.now) - Math.floor(Date.now() / 1000) : 0;
    }

    root.addEventListener('input', (e) => {
        const bk = e.target.closest('[data-bank]');
        if (bk) {
            S.bank[bk.dataset.bank] = bk.value;
            const pos = bk.selectionStart;
            render();
            const again = root.querySelector(`[data-bank="${bk.dataset.bank}"]`);
            if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) { again.focus(); } }
            return;
        }
        const el = e.target.closest('[data-price]');
        if (!el) return;
        S.edits[el.dataset.price] = el.value === '' ? '' : Number(el.value);
        const pos = el.selectionStart;
        render();
        const again = root.querySelector(`[data-price="${CSS.escape(el.dataset.price)}"]`);
        if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) { again.focus(); } }
    });

    root.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const el = e.target.closest('[data-price]');
        if (!el) return;
        const btn = root.querySelector(`[data-act="price"][data-id="${CSS.escape(el.dataset.price)}"]`);
        if (btn && !btn.disabled) btn.click();
    });

    root.addEventListener('click', async (e) => {
        const el = e.target.closest('[data-act]');
        if (!el || S.busy || el.disabled) return;
        const act = el.dataset.act;
        if (act === 'close') return XS.close('boss');
        if (act === 'refresh') return refresh();
        if (act === 'tab') { S.tab = el.dataset.tab; S.message = null; render(); const m = root.querySelector('.rs-bmain'); if (m) m.scrollTop = 0; return; }
        if (act === 'cat') { S.cat = el.dataset.id; render(); return; }
        if (act === 'mode') { S.mode = el.dataset.mode; render(); return; }
        if (act === 'clear') { S.cart = {}; S.message = null; render(); return; }
        if (act === 'qty') {
            const item = el.dataset.item;
            S.cart[item] = Math.max(0, Math.min(100, (S.cart[item] || 0) + Number(el.dataset.n)));
            S.message = null;
            render();
            return;
        }
        if (act === 'bankacc') { S.bank[`${el.dataset.key}Acc`] = el.dataset.acc; render(); return; }
        if (act === 'bankquick') { S.bank[el.dataset.key] = String((Number(S.bank[el.dataset.key]) || 0) + Number(el.dataset.n)); render(); return; }
        if (act === 'bankall') {
            const key = el.dataset.key;
            const mine = S.d.mine || {};
            const max = Number((S.d.bank || {}).max) || 1000000;
            const room = key === 'in' ? (mine[S.bank.inAcc] || 0) : (typeof S.d.balance === 'number' ? S.d.balance : 0);
            S.bank[key] = String(Math.max(0, Math.min(max, room)));
            render();
            return;
        }
        if (act === 'bank') {
            const kind = el.dataset.kind;
            const key = kind === 'deposit' ? 'in' : 'out';
            S.busy = true;
            const res = await XS.rpc('boss:bank', { kind, amount: Number(S.bank[key]), account: S.bank[`${key}Acc`] });
            S.busy = false;
            if (res.ok) {
                S.bank[key] = '';
                XS.toast(kind === 'deposit' ? t('b_bank_in_done', null, 'Money put in.') : t('b_bank_out_done', null, 'Money taken out.'), 'ok');
            } else XS.toast(res.error, 'error');
            await refresh();
            return;
        }
        if (act === 'bossmenu') {
            const res = await XS.rpc('boss:menu');
            if (!res.ok) XS.toast(res.error, 'error');
            return;
        }
        S.busy = true;
        let res;
        if (act === 'price') {
            const id = el.dataset.id;
            res = await XS.rpc('boss:price', { id, price: Number(S.edits[id]) });
            if (res.ok) { delete S.edits[id]; XS.toast(t('b_price_saved', null, 'Price saved.'), 'ok'); }
        } else if (act === 'soldout') {
            const m = XS.list(S.d.menu).find((x) => x.id === el.dataset.id);
            res = await XS.rpc('boss:soldout', { id: el.dataset.id, on: !(m && m.soldout) });
        } else if (act === 'flag') {
            const f = (S.d.flags || {})[el.dataset.key] || {};
            res = await XS.rpc('boss:flag', { key: el.dataset.key, on: !f.on });
        } else if (act === 'order') {
            const lines = Object.keys(S.cart).filter((k) => S.cart[k] > 0).map((item) => ({ item, qty: S.cart[item] }));
            res = await XS.rpc('boss:supply', { lines, mode: S.mode });
            if (res.ok) { S.cart = {}; S.message = { kind: 'ok', text: t('b_ordered', null, 'Ordered. Staff get a message when it arrives.') }; }
            else S.message = { kind: 'err', text: res.error };
        }
        S.busy = false;
        if (res && !res.ok && act !== 'order') XS.toast(res.error, 'error');
        await refresh();
    });

    XS.apps.boss = {
        isOpen: () => S.open,
        escape() { XS.close('boss'); },
        on(action, data) {
            if (action === 'open') {
                S.open = true;
                S.tab = data && data.limited ? 'account' : 'overview';
                S.bank = { in: '', out: '', inAcc: 'cash', outAcc: 'cash' };
                S.cat = 'all';
                S.cart = {};
                S.edits = {};
                S.mode = null;
                S.message = null;
                S.busy = false;
                apply(data);
                XS.show('xsr-boss', true);
                render();
                clearInterval(tick);
                tick = setInterval(() => {
                    if (S.open && S.tab === 'supplies' && !root.querySelector('input:focus') && XS.list(S.d.supplyRecent).some((o) => o.status === 'waiting')) render();
                }, 1000);
            } else if (action === 'close') {
                S.open = false;
                clearInterval(tick);
                XS.show('xsr-boss', false);
                root.innerHTML = '';
            }
        },
    };
})();
