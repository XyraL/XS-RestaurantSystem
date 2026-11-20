(() => {
    const root = document.getElementById('xsr-builder');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);
    const copy = (v) => JSON.parse(JSON.stringify(v === undefined ? null : v));
    const fx = (n) => (Number(n) || 0).toFixed(1);

    const KINDS = ['register', 'station', 'kitchen', 'pickup', 'counter', 'storage', 'menuboard', 'kiosk', 'speaker', 'seat', 'office', 'dock'];
    const WALL = { kitchen: 0.5625, pickup: 0.5625, menuboard: 0.5625, kiosk: 1.7778 };
    const SEAT_NAME = { chair: 'Chair', table: 'Chair at a table', stool: 'Bar stool', bench: 'Bench', armchair: 'Armchair' };
    const KIND = {
        register: { icon: 'register', label: 'Registers', one: 'Register', hint: 'Where staff ring up orders. The customer pays on their own screen.' },
        station: { icon: 'flame', label: 'Cooking stations', one: 'Station', hint: 'Grills, fryers, coffee machines and the rest. Each one makes the recipes for its type.' },
        kitchen: { icon: 'receipt', label: 'Kitchen screens', one: 'Kitchen screen', hint: 'A screen on the wall with every open ticket. Staff use it to mark orders ready.' },
        pickup: { icon: 'monitor', label: 'Pickup screens', one: 'Pickup screen', hint: 'Shows customers which order numbers are being made and which are ready.' },
        counter: { icon: 'bag', label: 'Pickup counter', one: 'Counter', hint: 'Where staff hand finished orders to the customer.' },
        storage: { icon: 'box', label: 'Storage', one: 'Storage', hint: 'A shared fridge or stock room for the staff.' },
        menuboard: { icon: 'receipt', label: 'Menu boards', one: 'Menu board', hint: 'A screen on the wall with the menu, prices and pictures. Sold out items show as sold out.' },
        kiosk: { icon: 'monitor', label: 'Self-order kiosks', one: 'Kiosk', hint: 'Customers order and pay here themselves, but only while someone is working.' },
        speaker: { icon: 'car', label: 'Drive-thru speakers', one: 'Speaker', hint: 'Where cars pull up to order. Staff answer from a register set to drive-thru.' },
        seat: { icon: 'seat', label: 'Seats', one: 'Seat', hint: 'Chairs, stools and booths anyone can sit on. The arrow is the way they face.' },
        office: { icon: 'laptop', label: 'Office laptop', one: 'Office', hint: 'Where the boss sees sales, changes prices, orders supplies and opens the boss menu.' },
        dock: { icon: 'warehouse', label: 'Back door', one: 'Back door', hint: 'Where the supply van parks so staff can unload it. The van faces the way you aim.' },
    };
    const TABS = ['general', 'look', 'places', 'menu', 'recipes', 'business', 'blip'];
    const TAB = { general: ['General', 'info'], look: ['Look', 'palette'], places: ['Places', 'pin'], menu: ['Menu', 'receipt'], recipes: ['Recipes', 'chef'], business: ['Business', 'cash'], blip: ['Map blip', 'mapblip'] };
    const GAME = { timer: 'Timer', timing: 'Hit the zone', pour: 'Pour to the line', keys: 'Key combo', stir: 'Stir', stack: 'Build in order', heat: 'Keep the heat' };
    const GAME_HINT = { timer: 'Just wait for the bar.', timing: 'Press Space while the marker is in the zone.', pour: 'Hold Space and let go on the line.', keys: 'Press the keys in the order shown.', stir: 'Move the mouse in circles.', stack: 'Click the parts in the right order.', heat: 'Tap Space to keep the needle in the zone.' };
    const LEVEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
    const STATION_NAME = { grill: 'Grill', fryer: 'Fryer', oven: 'Oven', pizza: 'Pizza oven', prep: 'Prep board', coffee: 'Coffee machine', drinks: 'Drinks machine', beer: 'Beer tap', bar: 'Cocktail station' };
    const STYLE_NAME = { burger: 'Burger Joint', pizza: 'Pizza Place', cafe: 'Cafe', bar: 'Bar', diner: 'Diner', taco: 'Taco Spot', noodle: 'Noodle House', bakery: 'Bakery', icecream: 'Ice Cream Shop', club: 'Nightclub Bar', custom: 'Custom' };
    const THEME_NAME = { modern: 'Modern', ticket: 'Order Ticket', pizza: 'Pizzeria', coffee: 'Coffee House', diner: 'Diner', pub: 'Pub', sushi: 'Sushi Bar', neon: 'Neon Night' };
    const THEME_SUB = { modern: 'Clean dark screens in your colours.', ticket: 'Paper tickets on a steel rail.', pizza: 'Checked cloth, menu card, pizza box.', coffee: 'Chalkboard, wood and kraft paper.', diner: 'Chrome, checks and guest checks.', pub: 'Dark wood, brass and beer mats.', sushi: 'Washi paper, lacquer and red seals.', neon: 'Glowing signs on a dark wall.' };
    const SAMPLE = [['House special', 14], ['Side order', 6], ['Soft drink', 4], ['Dessert', 7], ['Soup of the day', 8], ['Coffee', 3]];
    const STYLE_SUB = { burger: 'Grill, fryer, prep and drinks.', pizza: 'Prep board, pizza oven and drinks.', cafe: 'Coffee machine, oven and prep.', bar: 'Beer taps, cocktails and drinks.', diner: 'Grill, fryer, oven, coffee and drinks.', taco: 'Grill, prep and drinks.', noodle: 'Prep, grill and drinks.', bakery: 'Oven, prep and coffee.', icecream: 'Prep and drinks.', club: 'Cocktails, beer and drinks.', custom: 'Start empty and add what you need.' };

    const S = {
        open: false, visible: false, page: 'overview', list: [], jobs: [], items: [], itemMap: {}, stats: {}, styles: [], themes: [], stations: [], games: [], system: {}, me: {}, here: null,
        warehouse: null, cur: null, curId: null, tab: 'general', dirty: false, busy: false, q: '', overlay: null, ownerQ: '', ownerHits: [], bbq: '', newStation: 'grill', newSeat: 'chair', openRecipe: null, seats: [],
    };

    const pageEl = () => root.querySelector('#bx-page');
    const styleName = (id) => t(`style_${id}`, null, STYLE_NAME[id] || id);
    const themeName = (id) => t(`theme_${id}`, null, THEME_NAME[id] || id);
    const themeOf = (id) => S.themes.find((x) => x.id === id) || { id: 'modern' };
    const stationName = (id) => t(`station_${id}`, null, STATION_NAME[id] || id);
    const styleOf = (id) => S.styles.find((s) => s.id === id) || S.styles.find((s) => s.id === 'custom') || { id: 'custom', icon: 'store', accent: '#ff7849', accent2: '#ffc24b', sprite: 117, colour: 47, stations: [], categories: ['Food', 'Drinks'] };
    const seatOf = (id) => S.seats.find((s) => s.id === id) || { id: 'chair', height: 0.5 };
    const seatName = (id) => t(`rb_seat_${id}`, null, SEAT_NAME[id] || id);
    const stationOf = (id) => S.stations.find((s) => s.id === id) || { id, icon: 'flame', prop: '', game: 'timer' };
    const byId = (id) => S.list.find((b) => String(b.id) === String(id));
    const itemLabel = (name) => (S.itemMap[name] && S.itemMap[name].label) || name || '';
    const itemImage = (name) => (S.itemMap[name] && S.itemMap[name].image) || '';
    const known = (name) => !!S.itemMap[name];
    const jobOf = (name) => S.jobs.find((j) => j.name === name);
    const pt = (p) => (p ? `${fx(p.x)}, ${fx(p.y)}, ${fx(p.z)}` : '—');
    const uid = (prefix) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

    function thumb(name, size) {
        const img = itemImage(name);
        return `<span class="bx-thumb" ${size ? `style="width:${size}px;height:${Math.round(size * 0.82)}px"` : ''}>${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : I('food', 16)}</span>`;
    }

    function setPath(obj, path, value) {
        const parts = path.split('.');
        let node = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
            if (node[k] === undefined || node[k] === null) node[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
            node = node[k];
        }
        const last = /^\d+$/.test(parts[parts.length - 1]) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
        node[last] = value;
    }

    function getPath(obj, path) {
        return path.split('.').reduce((node, k) => (node === undefined || node === null ? undefined : node[/^\d+$/.test(k) ? Number(k) : k]), obj);
    }

    function normalise(d) {
        d = d || {};
        const st = styleOf(d.style);
        d.label = d.label || '';
        d.style = d.style || 'custom';
        d.job = d.job || '';
        d.owner = Object.assign({ cid: '', name: '' }, d.owner || {});
        d.enabled = d.enabled !== false;
        d.colors = Object.assign({ accent: st.accent, accent2: st.accent2 }, d.colors || {});
        d.theme = S.themes.some((x) => x.id === d.theme) || !S.themes.length ? (d.theme || 'modern') : 'modern';
        d.logo = d.logo || '';
        d.blip = Object.assign({ show: true, sprite: st.sprite, colour: st.colour, scale: 0.8, label: '', at: null, whenClosed: 'default' }, d.blip || {});
        if (d.blip.at && d.blip.at.x === undefined) d.blip.at = null;
        d.points = d.points || {};
        KINDS.forEach((k) => { d.points[k] = XS.list(d.points[k]); });
        d.categories = XS.list(d.categories);
        d.menu = XS.list(d.menu).map((m) => Object.assign({ label: '', price: 0, available: true, category: '' }, m));
        d.recipes = XS.list(d.recipes).map((r) => Object.assign({ amount: 1, station: 'prep', level: 'normal' }, r, { ingredients: XS.list(r.ingredients), steps: XS.list(r.steps) }));
        d.storage = Object.assign({ slots: 50, weight: 250000 }, d.storage || {});
        d.supplies = XS.list(d.supplies).map((x) => ({ item: x.item, price: Number(x.price) || 0 }));
        d.phone = d.phone !== false;
        d.delivery = d.delivery !== false;
        d.deliveryFee = Number.isFinite(Number(d.deliveryFee)) ? Number(d.deliveryFee) : -1;
        d.webhook = d.webhook || '';
        d.bank = Object.assign({ deposit: 0, withdraw: -1 }, d.bank || {});
        d.bank.deposit = Number(d.bank.deposit);
        d.bank.withdraw = Number(d.bank.withdraw);
        return d;
    }

    function blank(style) {
        const st = styleOf(style);
        return normalise({
            label: styleName(st.id), style: st.id, theme: st.theme || 'modern', colors: { accent: st.accent, accent2: st.accent2 },
            blip: { show: true, sprite: st.sprite, colour: st.colour, scale: 0.8 },
            categories: XS.list(st.categories).map((label, i) => ({ id: `c${i + 1}`, label })),
        });
    }

    function issues(d) {
        const out = [];
        const add = (level, text, tab) => out.push({ level, text, tab });
        if (!d.job) add('bad', t('rb_iss_job', null, 'No job linked, so nobody can work here'), 'general');
        else if (S.jobs.length && !jobOf(d.job)) add('bad', t('rb_iss_job_gone', { job: d.job }, `The job "${d.job}" does not exist on this server`), 'general');
        if (!d.points.register.length) add('bad', t('rb_iss_register', null, 'No register yet'), 'places');
        if (!d.menu.length) add('bad', t('rb_iss_menu', null, 'Nothing on the menu'), 'menu');
        if (!d.points.kitchen.length) add('warn', t('rb_iss_kitchen', null, 'No kitchen screen, so staff cannot see tickets'), 'places');
        if (!d.points.counter.length) add('warn', t('rb_iss_counter', null, 'No pickup counter to hand orders over'), 'places');
        const types = new Set(d.points.station.map((s) => s.type));
        const missing = [...new Set(d.recipes.map((r) => r.station))].filter((s) => !types.has(s));
        missing.forEach((s) => add('warn', t('rb_iss_station', { station: stationName(s) }, `Recipes use a ${stationName(s)} but none is placed`), 'places'));
        const unknown = new Set();
        d.menu.forEach((m) => { if (S.items.length && !known(m.item)) unknown.add(m.item); });
        d.recipes.forEach((r) => { if (S.items.length && !known(r.item)) unknown.add(r.item); r.ingredients.forEach((i) => { if (S.items.length && !known(i.item)) unknown.add(i.item); }); });
        if (unknown.size) add('warn', t('rb_iss_items', { list: [...unknown].slice(0, 3).join(', ') }, `Items your inventory does not know: ${[...unknown].slice(0, 3).join(', ')}`), 'menu');
        if (!d.points.pickup.length) add('info', t('rb_iss_pickup', null, 'No pickup screen for customers'), 'places');
        const driveRegs = d.points.register.filter((r) => r.drive).length;
        if (driveRegs && !d.points.speaker.length) add('warn', t('rb_iss_nospeaker', null, 'A register is set to drive-thru but there is no speaker'), 'places');
        if (d.points.speaker.length && !driveRegs) add('warn', t('rb_iss_nodrivereg', null, 'There are drive-thru speakers but no register is set to drive-thru'), 'places');
        if (d.supplies.length && !d.points.dock.length && !S.warehouse) add('warn', t('rb_iss_nosupply', null, 'There are supplies to order but no back door here and no supply warehouse'), 'places');
        if (!d.points.office.length) add('info', t('rb_iss_office', null, 'No office laptop, so the boss has no dashboard'), 'places');
        const noRecipe = d.menu.filter((m) => !d.recipes.some((r) => r.item === m.item)).length;
        if (noRecipe) add('info', t('rb_iss_norecipe', { n: noRecipe }, `${noRecipe} menu items have no recipe, so they come from stock`), 'recipes');
        return out;
    }

    function shell() {
        root.innerHTML = `
<div class="xsp-stage"><div class="bx bx-in">
  <div class="bx-lightbar"></div>
  <div class="bx-top">
    <div class="bx-logo"><svg class="bx-badge" viewBox="0 0 34 34"><defs><linearGradient id="rbG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7849"/><stop offset="1" stop-color="#ffc24b"/></linearGradient></defs><rect x="1" y="1" width="32" height="32" rx="9" fill="#120c09" stroke="url(#rbG)" stroke-width="1.5"/><path d="M11 9v7a2.5 2.5 0 0 0 5 0V9M13.5 16v9" fill="none" stroke="url(#rbG)" stroke-width="1.9" stroke-linecap="round"/><path d="M22.5 9c-2 1.2-3 4-3 7.5h3V25" fill="none" stroke="#f4ede7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="bx-word"><b>XS-<span>Restaurant</span></b><small>${esc(t('rb_builder', null, 'Restaurant builder'))}</small></div></div>
    <button class="bx-search" data-act="palette">${I('search', 15)}<span class="bx-stext">${esc(t('rb_search', null, 'Search businesses, settings and pages'))}</span><span class="bx-kbd">Ctrl</span><span class="bx-kbd">K</span></button>
    <span class="bx-sp"></span>
    <div class="bx-sys" id="bx-sys"></div>
    <button class="bx-iconbtn close" data-act="close" title="Esc">${I('close', 16)}</button>
  </div>
  <div class="bx-body">
    <nav class="bx-nav" id="bx-nav"></nav>
    <main class="bx-main"><div class="bx-page xsp-scroll" id="bx-page"></div></main>
  </div>
  <div id="bx-ov"></div>
</div></div>`;
    }

    function navItem(page, icon, label, count, warn) {
        const on = S.page === page || (page === 'businesses' && S.page === 'edit');
        return `<button class="bx-navitem ${on ? 'on' : ''}" data-act="nav" data-page="${page}">${I(icon, 17)}<span class="bx-navlabel">${esc(label)}</span>${count !== undefined && count !== null ? `<span class="bx-count ${warn ? 'warn' : ''}">${esc(count)}</span>` : ''}</button>`;
    }

    function renderNav() {
        const nav = root.querySelector('#bx-nav');
        if (!nav) return;
        const bad = S.list.filter((b) => issues(b.data).some((i) => i.level === 'bad')).length;
        const changedN = XS.BuilderSettings && XS.BuilderSettings.changedCount ? XS.BuilderSettings.changedCount() : 0;
        nav.innerHTML = `
<div class="bx-navgroup">${esc(t('rb_nav_build', null, 'Build'))}</div>
${navItem('overview', 'chart', t('rb_overview', null, 'Overview'))}
${navItem('businesses', 'store', t('rb_businesses', null, 'Businesses'), S.list.length, bad > 0)}
<div class="bx-navsep"></div>
<div class="bx-navgroup">${esc(t('rb_nav_guide', null, 'Guide'))}</div>
${navItem('stations', 'flame', t('rb_stations', null, 'Stations and games'))}
<div class="bx-navsep"></div>
<div class="bx-navgroup">${esc(t('rb_nav_run', null, 'Run'))}</div>
${navItem('settings', 'sliders', t('rb_settings', null, 'Settings'), changedN || null)}
<div class="bx-me"><div class="bx-avatar">${esc(((S.me && S.me.name) || 'A').slice(0, 1).toUpperCase())}</div><div style="min-width:0"><b>${esc((S.me && S.me.name) || '')}</b><small>${esc(t('rb_admin', null, 'Builder access'))}</small></div></div>`;
    }

    function renderSys() {
        const el = root.querySelector('#bx-sys');
        if (!el) return;
        const s = S.system || {};
        const pill = (on, label) => `<span class="bx-pill ${on ? '' : 'off'}"><i></i>${esc(label)}</span>`;
        el.innerHTML = `${pill(!!s.inventory, s.inventory || t('rb_no_inventory', null, 'No inventory'))}${pill(!!s.banking, s.banking || t('rb_no_banking', null, 'No banking'))}${pill(s.target && s.target !== 'none', s.target && s.target !== 'none' ? s.target : t('rb_e_prompts', null, 'E prompts'))}`;
    }

    function render() {
        renderNav();
        renderSys();
        const el = pageEl();
        if (!el) return;
        if (S.page !== 'settings' && XS.BuilderSettings) XS.BuilderSettings.unmount();
        const pages = { overview, businesses: businessesPage, edit: editor, stations: stationsPage, settings: settingsPage };
        el.innerHTML = (pages[S.page] || overview)();
        paintThemes();
        if (S.page === 'settings') XS.BuilderSettings.mount(el.querySelector('#bx-setmount'), () => renderNav());
        renderOverlay();
    }

    function head(title, sub, actions) {
        return `<div class="bx-pagehead"><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div><span class="bx-sp"></span>${actions || ''}</div>`;
    }

    function stat(cls, n, label, sub, icon, act) {
        return `<div class="bx-stat ${cls}" ${act || ''}>${I(icon, 18)}<b>${esc(n)}</b><span>${esc(label)}</span>${sub ? `<em>${esc(sub)}</em>` : ''}</div>`;
    }

    function styleCard(st) {
        return `<button class="bx-tpl rb-tpl" data-act="new" data-style="${esc(st.id)}" style="--c1:${esc(st.accent)};--c2:${esc(st.accent2)}"><span class="bx-kindico rb-styleico">${I(st.icon, 18)}</span><div><b>${esc(styleName(st.id))}</b><span>${esc(t(`rb_style_${st.id}_sub`, null, STYLE_SUB[st.id] || ''))}</span></div></button>`;
    }

    function overview() {
        const issueList = [];
        S.list.forEach((b) => issues(b.data).forEach((i) => issueList.push(Object.assign({ id: b.id, label: b.data.label }, i))));
        const ready = S.list.length ? Math.round((S.list.filter((b) => !issues(b.data).some((i) => i.level === 'bad')).length / S.list.length) * 100) : 0;
        const circ = 2 * Math.PI * 50;
        const order = { bad: 0, warn: 1, info: 2 };
        issueList.sort((a, b) => order[a.level] - order[b.level]);
        const totals = Object.values(S.stats || {}).reduce((a, s) => ({ orders: a.orders + (s.orders || 0), sales: a.sales + (s.sales || 0), open: a.open + (s.open || 0), staff: a.staff + (s.staff ? 1 : 0) }), { orders: 0, sales: 0, open: 0, staff: 0 });
        const menuCount = S.list.reduce((n, b) => n + b.data.menu.length, 0);
        const sys = S.system || {};
        const sysRow = (label, value) => `<div class="bx-sysrow"><span>${esc(label)}</span><b class="${value ? '' : 'none'}">${esc(value || t('rb_none', null, 'none'))}</b></div>`;
        return `${head(t('rb_overview', null, 'Overview'), t('rb_overview_sub', null, 'Every restaurant, bar and cafe on the server, and what still needs doing.'), `<button class="bx-btn primary" data-act="newpick">${I('plus', 15)}${esc(t('rb_new', null, 'New business'))}</button>`)}
<div class="bx-ov">
  <div class="bx-card"><div class="bx-ready">
    <div class="bx-ring"><svg width="118" height="118"><defs><linearGradient id="bxRingGrad"><stop offset="0" stop-color="#ff7849"/><stop offset="1" stop-color="#ffc24b"/></linearGradient></defs><circle class="track" cx="59" cy="59" r="50"/><circle class="fill" cx="59" cy="59" r="50" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - ready / 100)}"/></svg><div><b>${ready}%</b><small>${esc(t('rb_ready', null, 'ready'))}</small></div></div>
    <div class="bx-readytext"><h2>${esc(S.list.length ? t('rb_ready_title', { n: S.list.length }, `${S.list.length} businesses`) : t('rb_ready_empty', null, 'Nothing built yet'))}</h2>
      <p>${esc(S.list.length ? t('rb_ready_sub', null, 'Fix the red ones first. Yellow and blue are worth a look.') : t('rb_ready_empty_sub', null, 'Pick a style below to start your first restaurant.'))}</p>
      ${issueList.length ? `<div class="bx-issues">${issueList.slice(0, 40).map((i) => `<div class="bx-issue ${i.level}" data-act="edit" data-id="${i.id}" data-tab="${esc(i.tab)}" style="cursor:pointer"><i>${I(i.level === 'bad' ? 'alert' : 'info', 13)}</i><div><b>${esc(i.text)}</b><span>#${i.id} · ${esc(i.label)}</span></div>${I('chevron', 14)}</div>`).join('')}</div>` : (S.list.length ? `<div class="bx-allgood">${I('check', 16)}${esc(t('rb_all_good', null, 'Everything is set up.'))}</div>` : '')}
    </div></div></div>
  <div class="bx-stats">
    ${stat('', S.list.length, t('rb_st_businesses', null, 'Businesses'), null, 'store', 'data-act="nav" data-page="businesses"')}
    ${stat('green', totals.staff, t('rb_st_open', null, 'Open right now'), t('rb_st_open_sub', null, 'someone on duty'), 'users', 'data-act="nav" data-page="businesses"')}
    ${stat('amber', totals.open, t('rb_st_tickets', null, 'Open orders'), null, 'receipt', 'data-act="nav" data-page="businesses"')}
    ${stat('', totals.orders, t('rb_st_orders', null, 'Orders today'), null, 'ticket', 'data-act="nav" data-page="businesses"')}
    ${stat('green', XS.money(totals.sales), t('rb_st_sales', null, 'Sales today'), null, 'cash', 'data-act="nav" data-page="businesses"')}
    ${stat('', menuCount, t('rb_st_menu', null, 'Menu items'), null, 'food', 'data-act="nav" data-page="businesses"')}
  </div>
</div>
<div class="bx-sec"><div class="bx-sectitle"><h2>${esc(t('rb_start', null, 'Start a business'))}</h2><button class="bx-btn sm ghost" data-act="newpick">${esc(t('rb_all_styles', null, 'All styles'))}${I('chevron', 13)}</button></div>
  <div class="bx-quick">${S.styles.slice(0, 4).map(styleCard).join('')}</div></div>
<div class="bx-sec"><div class="bx-sectitle"><h2>${esc(t('rb_warehouse', null, 'Supply warehouse'))}</h2></div>
  <div class="bx-card"><div class="bx-cardbody rb-whrow"><span class="bx-gico rb-gico-dock">${I('warehouse', 18)}</span><div style="flex:1;min-width:0"><b>${esc(S.warehouse ? pt(S.warehouse) : t('rb_warehouse_none', null, 'Not set'))}</b><div class="bx-hint">${esc(t('rb_warehouse_hint', null, 'One spot for the whole server. When a boss picks warehouse pickup, staff from that business collect their stock here.'))}</div></div>
    ${S.warehouse ? `<button class="bx-tool" data-act="whgo" title="${esc(t('rb_teleport', null, 'Teleport'))}">${I('goto', 13)}</button>` : ''}<button class="bx-btn sm" data-act="whplace">${I('crosshair', 14)}${esc(S.warehouse ? t('rb_move', null, 'Move') : t('rb_place', null, 'Place'))}</button><button class="bx-btn sm" data-act="whhere">${I('pin', 14)}${esc(t('rb_here', null, 'At my feet'))}</button>${S.warehouse ? `<button class="bx-tool danger" data-act="whclear" title="${esc(t('rb_remove', null, 'Remove'))}">${I('remove', 13)}</button>` : ''}</div></div></div>
<div class="bx-sec"><div class="bx-sectitle"><h2>${esc(t('rb_system', null, 'What XS-RestaurantSystem found'))}</h2></div>
  <div class="bx-sysgrid">${sysRow('Framework', sys.framework)}${sysRow('Inventory', sys.inventory ? `${sys.inventory} · ${S.items.length} items` : null)}${sysRow('Banking', sys.banking)}${sysRow('Target', sys.target && sys.target !== 'none' ? sys.target : t('rb_e_prompts', null, 'E prompts'))}${sysRow('Jobs', S.jobs.length ? String(S.jobs.length) : null)}${sysRow('Intercom', sys.voice ? 'pma-voice' : null)}${sysRow('Phone', sys.phone && sys.phone !== 'none' ? sys.phone : null)}${sysRow('Discord logs', sys.webhook ? t('rb_webhook_set', null, 'server webhook set') : null)}</div></div>`;
    }

    function bizCard(b) {
        const d = b.data;
        const list = issues(d);
        const bad = list.filter((i) => i.level === 'bad').length;
        const st = S.stats[String(b.id)] || {};
        const job = jobOf(d.job);
        const st2 = styleOf(d.style);
        const count = (k) => d.points[k].length;
        return `<div class="bx-pcard rb-card ${d.enabled ? '' : 'off'}" data-act="edit" data-id="${b.id}" style="--c1:${esc(d.colors.accent)};--c2:${esc(d.colors.accent2)}">
  <div class="rb-cardtop"><span class="rb-cardico">${I(st2.icon, 22)}</span><div class="rb-cardname"><b>${esc(d.label)}</b><small>${esc(styleName(d.style))} · #${b.id}</small></div>
    <span class="bx-chip ${st.staff ? 'ok' : 'off'}">${esc(st.staff ? t('rb_open', null, 'Open') : t('rb_closed', null, 'Closed'))}</span></div>
  <div class="rb-cardbody">
    <div class="rb-kv"><span>${esc(t('rb_job', null, 'Job'))}</span><b class="${job ? '' : 'none'}">${esc(job ? job.label : (d.job || t('rb_none', null, 'none')))}</b></div>
    <div class="rb-kv"><span>${esc(t('rb_owner', null, 'Owner'))}</span><b class="${d.owner.cid ? '' : 'none'}">${esc(d.owner.name || d.owner.cid || t('rb_none', null, 'none'))}</b></div>
    <div class="rb-kv"><span>${esc(t('rb_today', null, 'Today'))}</span><b>${esc(t('rb_today_v', { n: st.orders || 0, money: XS.money(st.sales || 0) }, `${st.orders || 0} orders · ${XS.money(st.sales || 0)}`))}</b></div>
  </div>
  <div class="bx-pcard-foot rb-cardfoot">
    <span class="bx-chip" title="${esc(t('rb_registers', null, 'Registers'))}">${I('register', 12)}${count('register')}</span>
    <span class="bx-chip" title="${esc(t('rb_stations_n', null, 'Stations'))}">${I('flame', 12)}${count('station')}</span>
    <span class="bx-chip" title="${esc(t('rb_screens', null, 'Screens'))}">${I('monitor', 12)}${count('kitchen') + count('pickup')}</span>
    <span class="bx-chip" title="${esc(t('rb_menu_n', null, 'Menu items'))}">${I('food', 12)}${d.menu.length}</span>
    <span class="bx-sp"></span>${bad ? `<span class="bx-chip bad">${I('alert', 12)}${bad}</span>` : `<span class="bx-chip ok">${I('check', 12)}</span>`}
  </div></div>`;
    }

    function businessesPage() {
        const q = S.q.trim().toLowerCase();
        const list = S.list.filter((b) => !q || `${b.data.label} ${b.data.job} ${b.data.owner.name} ${styleName(b.data.style)}`.toLowerCase().includes(q));
        return `${head(t('rb_businesses', null, 'Businesses'), t('rb_businesses_sub', null, 'Restaurants, bars and cafes. Click one to edit it.'), `<button class="bx-btn primary" data-act="newpick">${I('plus', 15)}${esc(t('rb_new', null, 'New business'))}</button>`)}
<div class="bx-listbar"><div class="bx-filter">${I('search', 15)}<input class="bx-input" id="rb-q" value="${esc(S.q)}" placeholder="${esc(t('rb_search_biz', null, 'Search by name, job or owner'))}"></div></div>
${S.list.length ? `<div class="bx-grid">${list.map(bizCard).join('')}<button class="bx-newcard" data-act="newpick"><i>${I('plus', 22)}</i>${esc(t('rb_new', null, 'New business'))}</button></div>` : `<div class="bx-empty">${I('store', 30)}<b>${esc(t('rb_empty', null, 'No businesses yet'))}</b><p>${esc(t('rb_empty_sub', null, 'Make your first one. Pick a style and it comes with the right stations, menu sections and colours.'))}</p><button class="bx-btn primary" data-act="newpick">${I('plus', 15)}${esc(t('rb_new', null, 'New business'))}</button></div>`}`;
    }

    function stationsPage() {
        const games = S.games.length ? S.games : Object.keys(GAME);
        return `${head(t('rb_stations', null, 'Stations and games'), t('rb_stations_sub', null, 'What each station is for and how each cooking minigame plays. Recipes pick a station and a list of steps.'))}
<div class="bx-cols2">
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_station_types', null, 'Station types'))}</h3></div><div class="bx-cardbody"><div class="bx-items">
    ${S.stations.map((s) => `<div class="rb-strow"><span class="bx-kindico">${I(s.icon, 16)}</span><div style="flex:1;min-width:0"><b>${esc(stationName(s.id))}</b><small>${esc(s.prop ? s.prop : t('rb_no_prop', null, 'no prop, uses the map'))} · ${esc(t(`rb_game_${s.game}`, null, GAME[s.game] || s.game))}</small></div></div>`).join('')}
  </div></div></div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_games', null, 'Minigames'))}</h3><span class="bx-sp"></span><small>${esc(t('rb_games_try', null, 'Try one'))}</small></div><div class="bx-cardbody"><div class="bx-items">
    ${games.map((g) => `<div class="rb-strow"><span class="bx-kindico">${I('gamepad', 16)}</span><div style="flex:1;min-width:0"><b>${esc(t(`rb_game_${g}`, null, GAME[g] || g))}</b><small>${esc(t(`rb_game_${g}_hint`, null, GAME_HINT[g] || ''))}</small></div><button class="bx-btn xs" data-act="trygame" data-game="${g}">${I('play', 11)}${esc(t('rb_try', null, 'Try'))}</button></div>`).join('')}
  </div></div></div>
</div>`;
    }

    function settingsPage() {
        return `${head(t('rb_settings', null, 'Settings'), t('rb_settings_sub', null, 'Every setting is live for the whole server the moment you save. They override config.lua.'))}<div id="bx-setmount"></div>`;
    }

    function field(label, inner, hint) {
        return `<div class="bx-field"><label class="bx-label">${esc(label)}</label>${inner}${hint ? `<div class="bx-hint">${esc(hint)}</div>` : ''}</div>`;
    }

    function inp(path, opts) {
        opts = opts || {};
        const v = getPath(S.cur, path);
        return `<input class="bx-input ${opts.mono ? 'mono' : ''} ${opts.sm ? 'sm' : ''}" data-path="${path}" ${opts.type ? `type="${opts.type}"` : ''} value="${esc(v === null || v === undefined ? '' : v)}" ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} ${opts.max ? `maxlength="${opts.max}"` : ''} ${opts.style ? `style="${opts.style}"` : ''}>`;
    }

    function unit(path, u, opts) {
        opts = opts || {};
        const v = getPath(S.cur, path);
        return `<div class="bx-unit" ${opts.style ? `style="${opts.style}"` : ''}><input type="number" data-path="${path}" data-num="1" value="${esc(v === null || v === undefined ? '' : v)}" ${opts.min !== undefined ? `min="${opts.min}"` : ''} ${opts.max !== undefined ? `max="${opts.max}"` : ''} step="${opts.step || 1}">${u ? `<em>${esc(u)}</em>` : ''}</div>`;
    }

    function sw(path, label, hint) {
        const v = getPath(S.cur, path);
        return `<div class="bx-rowline"><div><b>${esc(label)}</b>${hint ? `<div class="bx-hint">${esc(hint)}</div>` : ''}</div><span class="bx-switch ${v ? 'on' : ''}" data-act="toggle" data-path="${path}"></span></div>`;
    }

    function sel(path, options, extra) {
        const v = getPath(S.cur, path);
        return `<select class="bx-input ${extra && extra.sm ? 'sm' : ''}" data-path="${path}" ${extra && extra.style ? `style="${extra.style}"` : ''}>${options.map((o) => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    }

    function editor() {
        const d = S.cur;
        if (!d) return overview();
        if (!TABS.includes(S.tab)) S.tab = 'general';
        const list = issues(d);
        const bad = list.filter((i) => i.level === 'bad').length;
        const steps = [
            [t('rb_step_job', null, 'Job'), !!d.job, 'general'],
            [t('rb_step_register', null, 'Register'), d.points.register.length > 0, 'places'],
            [t('rb_step_kitchen', null, 'Kitchen screen'), d.points.kitchen.length > 0, 'places'],
            [t('rb_step_counter', null, 'Counter'), d.points.counter.length > 0, 'places'],
            [t('rb_step_menu', null, 'Menu'), d.menu.length > 0, 'menu'],
        ];
        const counts = { places: KINDS.reduce((n, k) => n + d.points[k].length, 0), menu: d.menu.length, recipes: d.recipes.length, business: d.supplies.length };
        const body = { general: tabGeneral, look: tabLook, places: tabPlaces, menu: tabMenu, recipes: tabRecipes, business: tabBusiness, blip: tabBlip };
        const first = KINDS.map((k) => d.points[k][0]).find(Boolean);
        return `<div class="bx-crumb"><button data-act="nav" data-page="businesses">${esc(t('rb_businesses', null, 'Businesses'))}</button>${I('chevron', 12)}<span>${esc(S.curId ? `#${S.curId}` : t('rb_new_short', null, 'New'))}</span></div>
<div class="bx-edhead"><span class="rb-edico" style="--c1:${esc(d.colors.accent)};--c2:${esc(d.colors.accent2)}">${I(styleOf(d.style).icon, 20)}</span><input class="bx-edname" data-path="label" value="${esc(d.label)}" placeholder="${esc(t('rb_name_ph', null, 'Mirror Park Burgers'))}" maxlength="48"><span class="bx-sp"></span>
  ${first ? `<button class="bx-btn ghost" data-act="goto" data-kind="first">${I('goto', 15)}${esc(t('rb_teleport', null, 'Teleport'))}</button>` : ''}
  ${S.curId ? `<button class="bx-btn danger" data-act="delete" title="${esc(t('rb_delete', null, 'Delete'))}">${I('trash', 15)}</button>` : ''}
  <button class="bx-btn primary" data-act="save" ${S.busy ? 'disabled' : ''}>${I('check', 15)}${esc(S.dirty || !S.curId ? t('rb_save', null, 'Save') : t('rb_saved', null, 'Saved'))}<span class="bx-kbd">Ctrl S</span></button></div>
<div class="bx-edmeta"><span class="bx-chip blue">${I(styleOf(d.style).icon, 12)}${esc(styleName(d.style))}</span>${d.enabled ? '' : `<span class="bx-chip off">${esc(t('rb_switched_off', null, 'Switched off'))}</span>`}${bad ? `<span class="bx-chip bad">${I('alert', 12)}${esc(t('rb_n_problems', { n: bad }, `${bad} to fix`))}</span>` : `<span class="bx-chip ok">${I('check', 12)}${esc(t('rb_ready_go', null, 'Ready to open'))}</span>`}</div>
<div class="bx-steps">${steps.map((s) => `<span class="bx-step ${s[1] ? 'done' : 'need'}" data-act="tab" data-tab="${s[2]}" style="cursor:pointer"><i>${I(s[1] ? 'check' : 'alert', 10)}</i>${esc(s[0])}</span>`).join('')}</div>
<div class="bx-tabs">${TABS.map((x) => `<button class="bx-tab ${S.tab === x ? 'on' : ''}" data-act="tab" data-tab="${x}">${I(TAB[x][1], 14)}${esc(t(`rb_tab_${x}`, null, TAB[x][0]))}${counts[x] ? `<em>${counts[x]}</em>` : ''}</button>`).join('')}</div>
${body[S.tab]()}
<div style="height:60px"></div>`;
    }

    function tabGeneral() {
        const d = S.cur;
        const jobOptions = [['', t('rb_pick_job', null, 'Pick a job')]].concat(S.jobs.map((j) => [j.name, `${j.label} (${j.name})${j.onDuty ? ` · ${j.onDuty} on duty` : ''}`]));
        if (d.job && !jobOf(d.job)) jobOptions.push([d.job, `${d.job} · ${t('rb_job_missing', null, 'not found')}`]);
        const st = styleOf(d.style);
        const swatch = (path, value) => `<label class="rb-swatch"><input type="color" data-path="${path}" value="${esc(value)}"><span style="background:${esc(value)}"></span><b class="xp-mono">${esc(value)}</b></label>`;
        const ownerHits = S.ownerHits.map((h) => `<button class="bx-pickopt" data-act="owner" data-cid="${esc(h.cid)}" data-name="${esc(h.name)}"><span class="bx-thumb">${I('person', 15)}</span><div style="flex:1"><b>${esc(h.name || h.cid)}</b><small>${esc(h.cid)}${h.online ? ` · ${esc(t('rb_online', null, 'online'))}` : ''}</small></div></button>`).join('');
        return `<div class="bx-layout">
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_who_works', null, 'Who works here'))}</h3></div><div class="bx-cardbody">
    ${field(t('rb_job', null, 'Job'), sel('job', jobOptions), t('rb_job_hint', null, 'Anyone with this job can work here. Hiring, ranks and pay go through your boss menu script.'))}
    ${field(t('rb_owner', null, 'Owner'), d.owner.cid ? `<div class="rb-owner"><span class="bx-thumb">${I('person', 15)}</span><div style="flex:1;min-width:0"><b>${esc(d.owner.name || d.owner.cid)}</b><small class="xp-mono">${esc(d.owner.cid)}</small></div><button class="bx-btn xs ghost" data-act="ownerclear">${I('close', 12)}${esc(t('rb_clear', null, 'Clear'))}</button></div>` : `<div class="bx-picker"><input class="bx-input" id="rb-ownerq" value="${esc(S.ownerQ)}" placeholder="${esc(t('rb_owner_ph', null, 'Search a name or citizen ID'))}" autocomplete="off">${ownerHits ? `<div class="bx-pickpop">${ownerHits}</div>` : ''}</div>`, t('rb_owner_hint', null, 'Optional. The owner can always use everything here, even without the job, and can ring up free orders.'))}
    ${sw('enabled', t('rb_enabled', null, 'Open for business'), t('rb_enabled_hint', null, 'Switched off, it disappears from the world: no points, screens or blip.'))}
  </div></div>
</div>
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_style', null, 'Style'))}</h3><small>${esc(t('rb_style_hint', null, 'Sets the icon and the colours you start from'))}</small></div><div class="bx-cardbody"><div class="rb-styles">
    ${S.styles.map((s) => `<button class="rb-stylebtn ${s.id === d.style ? 'on' : ''}" data-act="style" data-style="${esc(s.id)}" style="--c1:${esc(s.accent)};--c2:${esc(s.accent2)}">${I(s.icon, 18)}<span>${esc(styleName(s.id))}</span></button>`).join('')}
  </div></div></div>
</div>
</div>`;
    }

    function previewItems() {
        const d = S.cur;
        const menu = d.menu.filter((m) => m.item && m.available !== false).map((m) => ({ id: m.id, item: m.item, label: m.label || itemLabel(m.item), image: itemImage(m.item), price: Number(m.price) || 0, category: m.category, available: true }));
        if (menu.length) return { categories: d.categories, menu };
        const cats = d.categories.length ? d.categories : [{ id: 'c1', label: t('rb_prev_food', null, 'Food') }];
        return { categories: cats, menu: SAMPLE.map((x, i) => ({ id: `s${i}`, item: '', label: t(`rb_prev_item${i + 1}`, null, x[0]), image: '', price: x[1], category: cats[i % cats.length].id, available: true })) };
    }

    function previewBrand() {
        const d = S.cur;
        return { id: S.curId || 0, label: d.label || styleName(d.style), colors: d.colors, logo: d.logo, style: d.style, theme: d.theme };
    }

    function previewOrders() {
        const m = previewItems().menu;
        const pick = (i) => m[i % m.length];
        const line = (i, qty, done) => ({ label: pick(i).label, qty, done: !!done, item: pick(i).item });
        const now = Math.floor(Date.now() / 1000);
        return [
            { id: 9001, number: 12, status: 'new', name: 'Vincent', lines: [line(0, 2), line(1, 2, true), line(2, 2)], at: now - 140, total: pick(0).price * 2 + pick(1).price * 2 + pick(2).price * 2, paidWith: 'card', via: 'counter' },
            { id: 9002, number: 13, status: 'cooking', name: 'Isabel', lines: [line(3, 1)], at: now - 320, total: pick(3).price, paidWith: 'cash', via: 'kiosk' },
            { id: 9003, number: 14, status: 'new', name: '', lines: [line(0, 1), line(2, 1)], at: now - 35, total: pick(0).price + pick(2).price, paidWith: 'card', via: 'drive' },
            { id: 9004, number: 11, status: 'ready', name: 'Rafael', lines: [line(1, 1, true), line(2, 1, true)], at: now - 600, readyAt: now - 40, total: pick(1).price + pick(2).price, paidWith: 'card', via: 'counter' },
        ];
    }

    function previewCook() {
        const d = S.cur;
        const station = d.points.station[0] ? d.points.station[0].type : (styleOf(d.style).stations[0] || 'grill');
        const counts = {};
        let recipes = d.recipes.filter((r) => r.item && r.station === station).map((r) => ({
            id: r.id, item: r.item, label: itemLabel(r.item), image: itemImage(r.item), amount: r.amount, station: r.station, level: r.level, steps: r.steps,
            ingredients: r.ingredients.filter((g) => g.item).map((g) => { counts[g.item] = 9; return { item: g.item, count: g.count, label: itemLabel(g.item), image: itemImage(g.item) }; }),
        }));
        if (!recipes.length) {
            counts.preview = 9;
            recipes = [{ id: 'p1', item: '', label: t('rb_prev_item1', null, SAMPLE[0][0]), image: '', amount: 1, station, level: 'normal', steps: [{ game: stationOf(station).game || 'timer', seconds: 6 }], ingredients: [{ item: 'preview', count: 1, label: t('rb_prev_ing', null, 'Ingredient'), image: '' }] }];
        }
        return { brand: previewBrand(), station: { type: station, label: stationName(station) }, recipes, counts, maxBatch: 5, needIngredients: true };
    }

    function wallData(kind) {
        const labels = {};
        Object.keys(XS.T).forEach((k) => { if (k.indexOf('screen_') === 0) labels[k] = XS.T[k]; });
        const now = new Date();
        const out = { kind, brand: previewBrand(), labels, open: true, late: 480, clock: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` };
        const nowS = Math.floor(Date.now() / 1000);
        if (kind === 'kitchen' || kind === 'pickup') out.orders = previewOrders().map((o) => ({ number: o.number, status: o.status, name: o.name, age: nowS - o.at, lines: o.lines }));
        if (kind === 'menu') {
            const p = previewItems();
            out.categories = p.categories.map((c) => ({ label: c.label, items: p.menu.filter((m) => m.category === c.id).map((m) => ({ label: m.label, price: m.price, image: m.image, soldout: false })) })).filter((c) => c.items.length);
            out.seconds = 8;
        }
        return out;
    }

    function themeTile(th) {
        const d = S.cur;
        const on = d.theme === th.id;
        const items = previewItems().menu.slice(0, 3);
        const tile = (m) => `<span class="rs-item"><span class="rs-itemimg">${m.image ? `<img src="${esc(m.image)}" alt="" onerror="this.remove()">` : I('food', 22)}</span><b>${esc(m.label)}</b><em>${XS.money(m.price)}</em></span>`;
        return `<button class="rb-theme ${on ? 'on' : ''}" data-act="theme" data-theme="${esc(th.id)}"><span class="rb-themeview"><span class="rb-themebox rs-tok" data-thumb="${esc(th.id)}">
<span class="rs-head"><span class="rs-logo">${d.logo ? `<img src="${esc(d.logo)}" alt="" onerror="this.remove()">` : I(styleOf(d.style).icon, 20)}</span><span class="rs-headname"><b>${esc(d.label || styleName(d.style))}</b><small>${esc(t('pos_register', null, 'Register'))}</small></span><span class="rs-sp"></span><span class="rs-x">${I('close', 16)}</span></span>
<span class="rb-thbody"><span class="rb-thitems">${items.map(tile).join('')}</span><span class="rs-ticket rb-thside"><span class="rs-tickethead"><b>${esc(t('pos_order', null, 'Order'))}</b></span><span class="rs-line"><span class="rs-linename"><b>${esc(items[0] ? items[0].label : '')}</b></span><b class="rs-lineprice">${XS.money(items[0] ? items[0].price * 2 : 0)}</b></span><span class="rs-total"><span>${esc(t('pos_total', null, 'Total'))}</span><b>${XS.money(items[0] ? items[0].price * 2 : 0)}</b></span><span class="rs-btn primary big">${esc(t('pay_card', null, 'Pay by card'))}</span></span></span>
</span></span><span class="rb-themename"><b>${esc(themeName(th.id))}${on ? I('check', 13) : ''}</b><small>${esc(t(`theme_${th.id}_sub`, null, THEME_SUB[th.id] || ''))}</small></span></button>`;
    }

    function paintThemes() {
        if (!S.cur) return;
        root.querySelectorAll('[data-thumb]').forEach((el) => XS.brand(el, S.cur.colors, el.dataset.thumb));
    }

    function tabLook() {
        const d = S.cur;
        const th = themeOf(d.theme);
        const swatch = (path, value) => `<label class="rb-swatch"><input type="color" data-path="${path}" value="${esc(value)}"><span style="background:${esc(value)}"></span><b class="xp-mono">${esc(value)}</b></label>`;
        const pv = (view, icon, label) => `<button class="rb-prevopt" data-act="preview" data-view="${view}">${I(icon, 17)}<span>${esc(label)}</span></button>`;
        const wv = (kind, icon, label) => `<button class="rb-prevopt" data-act="wallprev" data-kind="${kind}">${I(icon, 17)}<span>${esc(label)}</span></button>`;
        return `<div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_theme', null, 'Theme'))}</h3><small>${esc(t('rb_theme_hint', null, 'How the register, kitchen, kiosk, office and wall screens look for this place'))}</small></div><div class="bx-cardbody"><div class="rb-themes">${(S.themes.length ? S.themes : [{ id: 'modern' }]).map(themeTile).join('')}</div></div></div>
<div class="bx-layout" style="margin-top:14px">
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_look', null, 'Colours and logo'))}</h3><span class="bx-sp"></span>${th.accent ? `<button class="bx-btn xs ghost" data-act="themecolours">${I('palette', 12)}${esc(t('rb_theme_colours', null, 'Use the theme colours'))}</button>` : ''}<button class="bx-btn xs ghost" data-act="stylecolours">${I('undo', 12)}${esc(t('rb_style_colours', null, 'Use the style colours'))}</button></div><div class="bx-cardbody">
    <div class="bx-cols2">${field(t('rb_colour1', null, 'Main colour'), swatch('colors.accent', d.colors.accent))}${field(t('rb_colour2', null, 'Second colour'), swatch('colors.accent2', d.colors.accent2))}</div>
    ${field(t('rb_logo', null, 'Logo picture'), inp('logo', { placeholder: 'https://… or nui://…', mono: true, max: 300 }), t('rb_logo_hint', null, 'Optional. A link to a square picture. It shows on the screens and the pay prompt.'))}
    <div class="bx-hint">${esc(t('rb_theme_colour_hint', null, 'Every theme uses your two colours, so the same place can switch themes and still look like itself.'))}</div>
  </div></div>
</div>
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_preview_full', null, 'See it full size'))}</h3><small>${esc(t('rb_preview_full_hint', null, 'Opens the real screen with this menu. Nothing is saved or sold.'))}</small></div><div class="bx-cardbody">
    <div class="rb-prevgrid">${pv('pos', 'register', t('rb_prev_pos', null, 'Register'))}${pv('pay', 'cash', t('rb_prev_pay', null, 'Pay prompt'))}${pv('kitchen', 'receipt', t('rb_prev_kitchen', null, 'Kitchen'))}${pv('counter', 'bag', t('rb_prev_counter', null, 'Pickup counter'))}${pv('kiosk', 'store', t('rb_prev_kiosk', null, 'Self-order kiosk'))}${pv('cook', 'chef', t('rb_prev_cook', null, 'Cooking station'))}</div>
    <label class="xp-label" style="margin-top:14px">${esc(t('rb_prev_walls', null, 'Wall screens'))}</label>
    <div class="rb-prevgrid">${wv('menu', 'list', t('rb_prev_menuboard', null, 'Menu board'))}${wv('kitchen', 'monitor', t('rb_prev_kscreen', null, 'Kitchen screen'))}${wv('pickup', 'tv', t('rb_prev_pscreen', null, 'Pickup screen'))}${wv('kiosk', 'store', t('rb_prev_kidle', null, 'Kiosk screen'))}</div>
  </div></div>
</div>
</div>`;
    }

    function pointRow(kind, p, i) {
        const label = p.label || `${t(`rb_kind_${kind}_one`, null, KIND[kind].one)} ${i + 1}`;
        let extra = '';
        if (kind === 'station') {
            extra = `<select class="bx-input sm" style="width:150px" data-path="points.station.${i}.type">${S.stations.map((s) => `<option value="${esc(s.id)}" ${s.id === p.type ? 'selected' : ''}>${esc(stationName(s.id))}</option>`).join('')}</select>`;
        }
        if (WALL[kind]) {
            extra = `<div class="bx-unit" style="width:96px"><input type="number" min="0.2" max="6" step="0.1" data-path="points.${kind}.${i}.width" data-num="1" value="${esc(p.width || (kind === 'kiosk' ? 0.5 : 1.2))}"><em>m</em></div>`;
        }
        if (kind === 'menuboard') {
            extra += `<input class="bx-input sm" style="width:130px" data-path="points.menuboard.${i}.title" value="${esc(p.title || '')}" placeholder="${esc(t('rb_board_title', null, 'Title, like Drinks'))}" maxlength="32">`;
        }
        if (kind === 'seat') {
            extra = `<select class="bx-input sm" style="width:150px" data-path="points.seat.${i}.seat">${S.seats.map((s) => `<option value="${esc(s.id)}" ${s.id === p.seat ? 'selected' : ''}>${esc(seatName(s.id))}</option>`).join('')}</select><div class="bx-unit" style="width:100px" title="${esc(t('rb_seat_height', null, 'Sitting height above the spot'))}"><input type="number" min="-0.5" max="1.5" step="0.05" data-path="points.seat.${i}.height" data-num="1" value="${esc(p.height !== undefined ? p.height : seatOf(p.seat).height)}"><em>m</em></div>`;
        }
        if (kind === 'register') {
            extra += `<button class="bx-tool ${p.drive ? 'on' : ''}" data-act="ptdrive" data-i="${i}" title="${esc(t('rb_drive_toggle', null, 'Drive-thru register'))}">${I('car', 13)}</button>`;
        }
        if (kind === 'register' || kind === 'station' || kind === 'speaker' || kind === 'office') {
            const def = kind === 'register' ? 'prop_till_01' : (kind === 'speaker' ? 'prop_parknmeter_01' : (kind === 'office' ? 'prop_laptop_01a' : stationOf(p.type).prop));
            extra += `<input class="bx-input sm mono" style="width:150px" data-path="points.${kind}.${i}.model" value="${esc(p.model || '')}" placeholder="${esc(def || t('rb_no_prop_short', null, 'no prop'))}" title="${esc(t('rb_model_hint', null, 'Prop model. Empty uses the default.'))}"><button class="bx-tool ${p.prop !== false ? 'on' : ''}" data-act="ptprop" data-kind="${kind}" data-i="${i}" title="${esc(p.prop !== false ? t('rb_prop_on', null, 'Prop on. Click to use what is already there instead') : t('rb_prop_off', null, 'No prop. Click to spawn one here'))}">${I('box', 13)}</button>`;
        }
        const boardCats = kind === 'menuboard' ? `<div class="rb-boardcats"><span>${esc(t('rb_board_shows', null, 'Shows'))}</span>${S.cur.categories.map((c) => `<button class="${(p.categories || []).includes(c.id) ? 'on' : ''}" data-act="boardcat" data-i="${i}" data-id="${esc(c.id)}">${esc(c.label)}</button>`).join('')}<em>${esc((p.categories || []).length ? '' : t('rb_board_all', null, 'everything'))}</em></div>` : '';
        return `<div class="bx-pt ${kind === 'menuboard' ? 'rb-ptwide' : ''}"><span class="bx-ptn">${i + 1}</span><div class="bx-ptmain"><input class="rb-ptlabel" data-path="points.${kind}.${i}.label" value="${esc(p.label || '')}" placeholder="${esc(label)}" maxlength="40"><small>${esc(pt(p))}</small></div><div class="bx-ptextra">${extra}</div>
  <div class="bx-ptacts"><button class="bx-tool" data-act="ptgo" data-kind="${kind}" data-i="${i}" title="${esc(t('rb_teleport', null, 'Teleport'))}">${I('goto', 13)}</button><button class="bx-tool" data-act="ptre" data-kind="${kind}" data-i="${i}" title="${esc(t('rb_move', null, 'Move'))}">${I('crosshair', 13)}</button><button class="bx-tool danger" data-act="ptdel" data-kind="${kind}" data-i="${i}" title="${esc(t('rb_remove', null, 'Remove'))}">${I('remove', 13)}</button></div>${boardCats}</div>`;
    }

    function pointGroup(kind) {
        const def = KIND[kind];
        const list = S.cur.points[kind];
        const need = kind === 'register';
        const wall = !!WALL[kind];
        const seatPick = kind === 'seat' ? `<select class="bx-input sm" style="width:160px" id="rb-newseat">${S.seats.map((s) => `<option value="${esc(s.id)}" ${s.id === S.newSeat ? 'selected' : ''}>${esc(seatName(s.id))}</option>`).join('')}</select>` : '';
        const stationPick = kind === 'station' ? `<select class="bx-input sm" style="width:170px" id="rb-newstation">${S.stations.map((s) => `<option value="${esc(s.id)}" ${s.id === S.newStation ? 'selected' : ''}>${esc(stationName(s.id))}</option>`).join('')}</select>` : '';
        return `<div class="bx-group ${need && !list.length ? 'need' : ''}"><div class="bx-grouph"><span class="bx-gico rb-gico-${kind}">${I(def.icon, 16)}</span><div class="bx-gtext"><b>${esc(t(`rb_kind_${kind}`, null, def.label))} ${list.length ? `<span class="bx-tag ok">${list.length}</span>` : (need ? `<span class="bx-tag req">${esc(t('rb_needed', null, 'needed'))}</span>` : '')}</b><span>${esc(t(`rb_kind_${kind}_hint`, null, def.hint))}</span></div></div>
  <div class="bx-points">${list.map((p, i) => pointRow(kind, p, i)).join('')}</div>
  <div class="bx-addrow">${stationPick}${seatPick}${kind === 'seat' ? `<button class="bx-btn sm" data-act="ptmany" data-kind="seat">${I('copy', 14)}${esc(t('rb_place_many', null, 'Place several'))}</button>` : ''}<button class="bx-btn sm" data-act="ptadd" data-kind="${kind}">${I('crosshair', 14)}${esc(wall ? t('rb_place_wall', null, 'Place on a wall') : t('rb_place', null, 'Place'))}</button>${wall ? '' : `<button class="bx-btn sm" data-act="pthere" data-kind="${kind}">${I('pin', 14)}${esc(t('rb_here', null, 'At my feet'))}</button>`}</div></div>`;
    }

    function tabPlaces() {
        const d = S.cur;
        return `<div class="bx-layout">
<div class="bx-groups"><div class="rb-sechead">${I('chef', 15)}<b>${esc(t('rb_back_of_house', null, 'Behind the counter'))}</b></div>${['register', 'station', 'kitchen', 'counter', 'storage'].map(pointGroup).join('')}
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_storage_size', null, 'Storage size'))}</h3></div><div class="bx-cardbody"><div class="bx-cols2">
    ${field(t('rb_slots', null, 'Slots'), unit('storage.slots', '', { min: 1, max: 300 }))}${field(t('rb_weight', null, 'Weight'), unit('storage.weight', 'g', { min: 1000, max: 5000000, step: 1000 }))}
  </div></div></div>
</div>
<div class="bx-groups"><div class="rb-sechead">${I('store', 15)}<b>${esc(t('rb_front_of_house', null, 'Front of house'))}</b></div>${['pickup', 'menuboard', 'kiosk', 'speaker', 'seat'].map(pointGroup).join('')}
  <div class="rb-sechead">${I('chart', 15)}<b>${esc(t('rb_back_office', null, 'Office and deliveries'))}</b></div>${['office', 'dock'].map(pointGroup).join('')}</div>
</div>`;
    }

    function bankSelect(kind) {
        const d = S.cur;
        const job = jobOf(d.job);
        const grades = job && XS.list(job.grades).length ? XS.list(job.grades) : Array.from({ length: 6 }, (_, n) => ({ level: n, name: t('rb_grade_n', { n }, `Grade ${n}`) }));
        const value = Number(d.bank[kind]);
        const options = [[-1, t('rb_bank_boss', null, 'Only the boss and owner')]].concat(grades.map((g) => [g.level, g.level === 0 ? t('rb_bank_everyone', { name: g.name }, `Everyone with the job (${g.name} and up)`) : t('rb_bank_grade', { name: g.name, n: g.level }, `${g.name} (${g.level}) and up`)]));
        if (!options.some((o) => o[0] === value)) options.push([value, t('rb_grade_n', { n: value }, `Grade ${value}`)]);
        return `<select class="bx-input" data-path="bank.${kind}" data-num="1">${options.map((o) => `<option value="${o[0]}" ${o[0] === value ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    }

    function tabBusiness() {
        const d = S.cur;
        const sys = S.system || {};
        const ownFee = d.deliveryFee >= 0;
        const rows = d.supplies.map((x, i) => `<div class="rb-suprow">${thumb(x.item, 34)}<div class="bx-itemname ${known(x.item) || !S.items.length ? '' : 'missing'}"><b>${esc(itemLabel(x.item))}</b><small class="xp-mono">${esc(x.item)}</small></div>
  <div class="bx-unit" style="width:120px"><em>$</em><input type="number" min="0" max="100000" data-path="supplies.${i}.price" data-num="1" value="${esc(x.price)}"></div><span class="bx-hint">${esc(t('rb_each', null, 'each'))}</span>
  <button class="bx-tool danger" data-act="supdel" data-i="${i}" title="${esc(t('rb_remove', null, 'Remove'))}">${I('remove', 13)}</button></div>`).join('');
        return `<div class="bx-layout">
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_supplies', null, 'Supplies'))}</h3><small>${esc(t('rb_supplies_hint', null, 'What the boss can order from the office laptop. Paid from the business account.'))}</small></div><div class="bx-cardbody">
    ${rows ? `<div class="rb-suplist">${rows}</div>` : `<div class="bx-empty sm">${I('box', 22)}<span>${esc(t('rb_supplies_none', null, 'Nothing yet. Add the ingredients and stock this place uses.'))}</span></div>`}
    <div class="bx-addrow"><button class="bx-btn sm" data-act="supadd">${I('plus', 14)}${esc(t('rb_supply_add', null, 'Add a supply'))}</button></div>
    <div class="bx-hint" style="margin-top:10px">${esc(d.points.dock.length ? t('rb_supply_dock_ok', null, 'Vans park at the back door you placed.') : t('rb_supply_dock_none', null, 'Place a back door under Places so vans can deliver here.'))} ${esc(S.warehouse ? t('rb_supply_wh_ok', null, 'Staff can also collect from the supply warehouse.') : t('rb_supply_wh_none', null, 'No supply warehouse is set yet. Set it on the Overview page.'))}</div>
  </div></div>
</div>
<div>
  <div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_phone_delivery', null, 'Phone and delivery'))}</h3></div><div class="bx-cardbody">
    ${sw('phone', t('rb_phone', null, 'Phone orders'), t('rb_phone_hint', null, 'Shows this place in the food app so people can order ahead and pick up. The boss can pause it from the office.'))}
    ${sw('delivery', t('rb_delivery', null, 'Deliveries'), t('rb_delivery_hint', null, 'Lets phone orders be delivered. Staff take them from the pickup counter and drive them out.'))}
    <div class="bx-rowline"><div><b>${esc(t('rb_fee_own', null, 'Own delivery fee'))}</b><div class="bx-hint">${esc(t('rb_fee_own_hint', null, 'Off uses the server delivery fee from the settings.'))}</div></div><span class="bx-switch ${ownFee ? 'on' : ''}" data-act="feeown"><i></i></span></div>
    ${ownFee ? field(t('rb_fee', null, 'Delivery fee'), unit('deliveryFee', '$', { min: 0, max: 10000 })) : ''}
  </div></div>
  <div class="bx-card" style="margin-top:14px"><div class="bx-cardhead"><h3>${esc(t('rb_bank', null, 'Business account'))}</h3><small>${esc(t('rb_bank_sub', null, 'From the office laptop'))}</small></div><div class="bx-cardbody">
    ${field(t('rb_bank_in', null, 'Who can put money in'), bankSelect('deposit'))}
    ${field(t('rb_bank_out', null, 'Who can take money out'), bankSelect('withdraw'), t('rb_bank_hint', null, 'Bosses and the owner always can. Staff need to be on duty if the server asks for it.'))}
  </div></div>
  <div class="bx-card" style="margin-top:14px"><div class="bx-cardhead"><h3>${esc(t('rb_logs', null, 'Discord logs'))}</h3></div><div class="bx-cardbody">
    ${field(t('rb_webhook', null, 'Webhook for this business'), inp('webhook', { placeholder: 'https://discord.com/api/webhooks/…', mono: true, max: 300 }), sys.webhook ? t('rb_webhook_hint_on', null, 'Optional. Empty sends this business to the server webhook. Players never see this link.') : t('rb_webhook_hint_off', null, 'Optional. Sales, refunds, supplies, deliveries and price changes go here. Players never see this link.'))}
  </div></div>
</div>
</div>`;
    }

    function tabMenu() {
        const d = S.cur;
        const cats = d.categories;
        const catOptions = cats.map((c) => [c.id, c.label]);
        const rows = d.menu.map((m, i) => `<div class="rb-menurow ${known(m.item) || !S.items.length ? '' : 'unknown'}">
  ${thumb(m.item)}
  <button class="rb-itembtn" data-act="menuitem" data-i="${i}"><b>${esc(itemLabel(m.item))}</b><small>${esc(m.item)}${known(m.item) || !S.items.length ? '' : ` · ${esc(t('rb_not_in_inv', null, 'not in your inventory'))}`}</small></button>
  <input class="bx-input sm" data-path="menu.${i}.label" value="${esc(m.label || '')}" placeholder="${esc(itemLabel(m.item))}" maxlength="40">
  <div class="bx-unit"><em>$</em><input type="number" min="0" max="1000000" data-path="menu.${i}.price" data-num="1" value="${esc(m.price)}"></div>
  ${cats.length ? `<select class="bx-input sm" data-path="menu.${i}.category">${catOptions.map((o) => `<option value="${esc(o[0])}" ${o[0] === m.category ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>` : '<span class="bx-hint">—</span>'}
  <span class="bx-switch ${m.available ? 'on' : ''}" data-act="toggle" data-path="menu.${i}.available" title="${esc(t('rb_available', null, 'On the menu'))}"></span>
  <button class="bx-tool danger" data-act="menudel" data-i="${i}">${I('remove', 13)}</button></div>`).join('');
        const missingDishes = d.recipes.filter((r) => !d.menu.some((m) => m.item === r.item)).length;
        return `<div class="bx-card"><div class="bx-cardhead"><h3>${esc(t('rb_categories', null, 'Menu sections'))}</h3><small>${esc(t('rb_categories_hint', null, 'Click one to rename it'))}</small></div><div class="bx-cardbody">
  <div class="rb-cats">${cats.map((c, i) => `<span class="rb-cat"><button data-act="catrename" data-i="${i}">${esc(c.label)}</button><em>${d.menu.filter((m) => m.category === c.id).length}</em><button class="rb-catx" data-act="catdel" data-i="${i}">${I('close', 11)}</button></span>`).join('')}
  <input class="bx-input sm" id="rb-newcat" style="width:180px" placeholder="${esc(t('rb_new_cat', null, 'New section, then Enter'))}" maxlength="32"></div>
</div></div>
<div class="bx-card" style="margin-top:14px"><div class="bx-cardhead"><h3>${esc(t('rb_menu_items', null, 'Menu'))}</h3><small>${esc(t('rb_menu_hint', null, 'What the register can sell. Prices are per item.'))}</small><span class="bx-sp"></span>
  ${missingDishes ? `<button class="bx-btn sm ghost" data-act="menufromrecipes">${I('chef', 13)}${esc(t('rb_menu_from_recipes', { n: missingDishes }, `Add ${missingDishes} dishes from recipes`))}</button>` : ''}
  <button class="bx-btn sm primary" data-act="menuadd">${I('plus', 13)}${esc(t('rb_add_item', null, 'Add item'))}</button></div><div class="bx-cardbody">
  ${d.menu.length ? `<div class="rb-menurow head"><span></span><span>${esc(t('rb_col_item', null, 'Item'))}</span><span>${esc(t('rb_col_name', null, 'Name on the menu'))}</span><span>${esc(t('rb_col_price', null, 'Price'))}</span><span>${esc(t('rb_col_section', null, 'Section'))}</span><span>${esc(t('rb_col_on', null, 'On'))}</span><span></span></div><div class="bx-items">${rows}</div>` : `<div class="bx-empty">${I('food', 28)}<b>${esc(t('rb_menu_empty', null, 'The menu is empty'))}</b><p>${esc(t('rb_menu_empty_sub', null, 'Add the items this place sells. They are the items your server added to its inventory, pictures and all.'))}</p><button class="bx-btn primary" data-act="menuadd">${I('plus', 15)}${esc(t('rb_add_item', null, 'Add item'))}</button></div>`}
</div></div>`;
    }

    function recipeCard(r, i) {
        const open = S.openRecipe === r.id;
        const st = stationOf(r.station);
        if (!open) {
            return `<div class="rb-recipe" data-act="recipeopen" data-id="${esc(r.id)}">${thumb(r.item)}<div class="rb-recname"><b>${esc(itemLabel(r.item))}${r.amount > 1 ? ` <em>×${r.amount}</em>` : ''}</b><small>${esc(r.ingredients.map((g) => `${g.count}x ${itemLabel(g.item)}`).join(', ') || t('rb_no_ingredients', null, 'no ingredients'))}</small></div>
  <span class="bx-chip">${I(st.icon, 12)}${esc(stationName(r.station))}</span><span class="bx-chip">${I('gamepad', 12)}${r.steps.length}</span><span class="bx-chip ${r.level === 'hard' ? 'warn' : (r.level === 'easy' ? 'ok' : '')}">${esc(t(`rb_level_${r.level}`, null, LEVEL[r.level]))}</span>${I('chevron', 14)}</div>`;
        }
        const ings = r.ingredients.map((g, j) => `<div class="rb-ingrow">${thumb(g.item, 34)}<div class="bx-itemname ${known(g.item) || !S.items.length ? '' : 'missing'}"><b>${esc(itemLabel(g.item))}</b><small>${esc(g.item)}</small></div><div class="bx-unit" style="width:96px"><input type="number" min="1" max="50" data-path="recipes.${i}.ingredients.${j}.count" data-num="1" value="${esc(g.count)}"><em>x</em></div><button class="bx-tool danger" data-act="ingdel" data-i="${i}" data-j="${j}">${I('remove', 13)}</button></div>`).join('');
        const games = (S.games.length ? S.games : Object.keys(GAME));
        const steps = r.steps.map((s, j) => `<div class="rb-steprow"><span class="bx-ptn">${j + 1}</span><select class="bx-input sm" data-path="recipes.${i}.steps.${j}.game">${games.map((g) => `<option value="${g}" ${g === s.game ? 'selected' : ''}>${esc(t(`rb_game_${g}`, null, GAME[g] || g))}</option>`).join('')}</select><div class="bx-unit" style="width:100px"><input type="number" min="2" max="60" data-path="recipes.${i}.steps.${j}.seconds" data-num="1" value="${esc(s.seconds)}"><em>s</em></div><input class="bx-input sm" data-path="recipes.${i}.steps.${j}.label" value="${esc(s.label || '')}" placeholder="${esc(t('rb_step_label_ph', null, 'What it says, like Flip the patty'))}" maxlength="40"><button class="bx-tool danger" data-act="stepdel" data-i="${i}" data-j="${j}" ${r.steps.length <= 1 ? 'disabled' : ''}>${I('remove', 13)}</button></div>`).join('');
        return `<div class="rb-recipe open">
  <div class="rb-rechead" data-act="recipeopen" data-id="${esc(r.id)}">${thumb(r.item)}<div class="rb-recname"><b>${esc(itemLabel(r.item))}</b><small>${esc(r.item)}</small></div><span class="bx-sp"></span>${I('chevron', 14)}</div>
  <div class="rb-recbody">
    <div class="rb-recgrid">
      ${field(t('rb_makes', null, 'Makes'), `<div style="display:flex;gap:8px"><button class="bx-btn sm" data-act="recipeitem" data-i="${i}">${I('edit', 13)}${esc(t('rb_change_item', null, 'Change item'))}</button>${unit(`recipes.${i}.amount`, 'x', { min: 1, max: 20, style: 'width:96px' })}</div>`)}
      ${field(t('rb_station', null, 'Station'), sel(`recipes.${i}.station`, S.stations.map((s) => [s.id, stationName(s.id)])))}
      ${field(t('rb_level', null, 'Difficulty'), sel(`recipes.${i}.level`, Object.keys(LEVEL).map((k) => [k, t(`rb_level_${k}`, null, LEVEL[k])])))}
    </div>
    <div class="bx-cols2" style="margin-top:6px">
      <div><label class="bx-label">${esc(t('rb_ingredients', null, 'Ingredients'))}</label><div class="bx-items">${ings || `<div class="bx-hint">${esc(t('rb_no_ingredients_hint', null, 'None. It can be made from nothing.'))}</div>`}</div>
        <button class="bx-btn sm" style="margin-top:8px" data-act="ingadd" data-i="${i}">${I('plus', 13)}${esc(t('rb_add_ingredient', null, 'Add ingredient'))}</button></div>
      <div><label class="bx-label">${esc(t('rb_steps', null, 'Cooking steps'))}</label><div class="bx-items">${steps}</div>
        <div style="display:flex;gap:6px;margin-top:8px"><button class="bx-btn sm" data-act="stepadd" data-i="${i}" ${r.steps.length >= 6 ? 'disabled' : ''}>${I('plus', 13)}${esc(t('rb_add_step', null, 'Add step'))}</button><button class="bx-btn sm" data-act="recipetry" data-i="${i}">${I('play', 12)}${esc(t('rb_try_it', null, 'Try it'))}</button></div></div>
    </div>
    <div class="rb-recfoot"><span class="bx-hint">${esc(t('rb_recipe_foot', null, 'Staff make this at any station of that type. What comes out lands in their pockets.'))}</span><span class="bx-sp"></span><button class="bx-btn sm danger" data-act="recipedel" data-i="${i}">${I('trash', 13)}${esc(t('rb_remove_recipe', null, 'Remove recipe'))}</button></div>
  </div></div>`;
    }

    function tabRecipes() {
        const d = S.cur;
        return `<div class="bx-listbar"><div class="bx-hint" style="flex:1">${esc(t('rb_recipes_hint', null, 'How dishes are made. A recipe takes ingredients from the cook, runs its steps at a station and gives the dish. Recipes can feed each other, like a patty made on the grill going into a burger at the prep board.'))}</div><button class="bx-btn primary" data-act="recipeadd">${I('plus', 15)}${esc(t('rb_new_recipe', null, 'New recipe'))}</button></div>
${d.recipes.length ? `<div class="rb-recipes">${d.recipes.map(recipeCard).join('')}</div>` : `<div class="bx-empty">${I('chef', 30)}<b>${esc(t('rb_recipes_empty', null, 'No recipes yet'))}</b><p>${esc(t('rb_recipes_empty_sub', null, 'Items without a recipe can still be sold, straight from the storage.'))}</p><button class="bx-btn primary" data-act="recipeadd">${I('plus', 15)}${esc(t('rb_new_recipe', null, 'New recipe'))}</button></div>`}`;
    }

    function spriteTile(sp, on) {
        return `<button class="bb-sp ${on ? 'on' : ''}" data-act="bb-sprite" data-id="${sp.id}" title="${esc(sp.label)} · ${sp.id}"><img src="${esc(XS.BLIPS.image(sp))}" alt="" loading="lazy" onerror="this.classList.add('gone')"><span>${sp.id}</span></button>`;
    }

    function spriteList() {
        const B = XS.BLIPS;
        const q = S.bbq.trim().toLowerCase();
        return q ? B.all.filter((sp) => String(sp.id) === q || sp.label.includes(q) || sp.name.includes(q)).slice(0, 180) : B.sprites;
    }

    function tabBlip() {
        const d = S.cur;
        const b = d.blip;
        const B = XS.BLIPS;
        const sprite = B.find(b.sprite);
        const colour = B.colours.find((x) => x.id === Number(b.colour));
        const at = b.at;
        const sprites = spriteList();
        const closed = [['default', t('rb_closed_default', null, 'Same as the settings')], ['grey', t('rb_closed_grey', null, 'Grey')], ['hide', t('rb_closed_hide', null, 'Hidden')], ['same', t('rb_closed_same', null, 'No change')]];
        return `<div class="bb-wrap">
  <div class="bx-card"><div class="bx-cardbody">
    ${sw('blip.show', t('rb_blip_show', null, 'Show on the map'), t('rb_blip_show_hint', null, 'Everyone sees it. It can go grey or hide while nobody is working.'))}
    <div class="bx-cols2" style="margin:14px 0 16px">
      <div><label class="bx-label">${esc(t('rb_blip_label', null, 'Name on the map'))}</label>${inp('blip.label', { placeholder: d.label, max: 48 })}</div>
      <div><label class="bx-label">${esc(t('rb_blip_closed', null, 'While closed'))}</label>${sel('blip.whenClosed', closed)}</div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><label class="bx-label" style="margin:0;flex:1">${esc(t('rb_blip_icon', null, 'Icon'))}</label>
      <div class="bx-filter" style="width:260px">${I('search', 15)}<input class="bx-input sm" id="rb-bbq" value="${esc(S.bbq)}" placeholder="${esc(t('rb_blip_search', { count: B.all.length }, `Search all ${B.all.length} icons`))}"></div>
      <div class="bx-unit" style="width:110px"><input type="number" min="1" max="999" data-path="blip.sprite" data-num="1" value="${Number(b.sprite)}"><em>#</em></div></div>
    <div class="bb-sprites xsp-scroll" id="rb-bbgrid">${sprites.map((sp) => spriteTile(sp, sp.id === Number(b.sprite))).join('') || `<div class="bx-hint" style="grid-column:1/-1;padding:10px">${esc(t('rb_blip_none', null, 'No icon matches that.'))}</div>`}</div>
    <label class="bx-label" style="margin-top:16px">${esc(t('rb_blip_colour', null, 'Colour'))}</label>
    <div class="bb-colours">${B.colours.map((c) => `<button class="bb-c ${c.id === Number(b.colour) ? 'on' : ''}" data-act="bb-colour" data-id="${c.id}" title="${esc(c.label)} · ${c.id}" style="background:${c.hex}"></button>`).join('')}</div>
    <label class="bx-label" style="margin-top:16px">${esc(t('rb_blip_size', null, 'Size'))} <span class="bx-mono" id="rb-scale">${Number(b.scale).toFixed(2)}</span></label><input type="range" min="0.4" max="1.6" step="0.05" value="${Number(b.scale)}" class="bb-range" data-path="blip.scale" data-num="1">
  </div></div>
  <div>
    <div class="bb-preview"><span class="bb-ico">${sprite ? `<img src="${esc(B.image(sprite))}" alt="" onerror="this.remove()">` : `<b>${Number(b.sprite)}</b>`}<i class="bb-dot" style="background:${colour ? colour.hex : '#888888'}"></i></span>
      <div style="min-width:0"><strong>${esc(b.label || d.label || '')}</strong><span>${esc(sprite ? `${sprite.label} · ${sprite.id}` : `#${b.sprite}`)} · ${esc(colour ? colour.label : `#${b.colour}`)}</span><span>${esc(b.show ? t('rb_blip_on', null, 'On the map') : t('rb_blip_off', null, 'Hidden'))}</span></div></div>
    <div class="bx-card" style="margin-top:12px"><div class="bx-cardhead"><h3>${esc(t('rb_blip_where', null, 'Where it sits'))}</h3></div><div class="bx-cardbody">
      <p class="bx-hint bx-mono" style="margin-bottom:10px">${at ? `${fx(at.x)}, ${fx(at.y)}, ${fx(at.z)}` : esc(t('rb_blip_auto', null, 'On the first register, or the first point placed'))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px"><button class="bx-btn sm" data-act="blipplace">${I('crosshair', 13)}${esc(t('rb_place', null, 'Place'))}</button><button class="bx-btn sm" data-act="bliphere">${I('pin', 13)}${esc(t('rb_here', null, 'At my feet'))}</button>${at ? `<button class="bx-btn sm ghost" data-act="blipreset">${I('undo', 13)}${esc(t('rb_reset', null, 'Reset'))}</button>` : ''}</div>
    </div></div>
  </div>
</div>`;
    }

    function itemPicker(opts) {
        return new Promise((resolve) => {
            S.overlay = { kind: 'items', q: '', title: opts.title, resolve, idx: 0 };
            renderOverlay();
        });
    }

    function itemResults(q) {
        q = (q || '').trim().toLowerCase();
        const list = q ? S.items.filter((i) => `${i.label} ${i.name}`.toLowerCase().includes(q)) : S.items;
        return list.slice(0, 120);
    }

    function paletteItems() {
        const out = [];
        S.list.forEach((b) => out.push({ group: t('rb_businesses', null, 'Businesses'), label: `#${b.id} ${b.data.label}`, sub: [styleName(b.data.style), b.data.job].filter(Boolean).join(' · '), run: () => edit(b.id) }));
        [['overview', 'Overview'], ['businesses', 'Businesses'], ['stations', 'Stations and games'], ['settings', 'Settings']].forEach((x) => out.push({ group: t('rb_pages', null, 'Pages'), label: t(`rb_${x[0]}`, null, x[1]), run: () => go(x[0]) }));
        S.styles.forEach((s) => out.push({ group: t('rb_new', null, 'New business'), label: styleName(s.id), sub: t(`rb_style_${s.id}_sub`, null, STYLE_SUB[s.id] || ''), run: () => newBusiness(s.id) }));
        if (XS.BuilderSettings) XS.BuilderSettings.fields().forEach((f) => out.push({ group: t('rb_settings', null, 'Settings'), label: XS.BuilderSettings.label(f.key), sub: XS.BuilderSettings.sectionLabel(f.section), run: () => { go('settings'); setTimeout(() => XS.BuilderSettings.focus(f.key), 30); } }));
        return out;
    }

    function renderOverlay() {
        const ov = root.querySelector('#bx-ov');
        if (!ov) return;
        const o = S.overlay;
        if (!o) { ov.innerHTML = ''; return; }
        if (o.kind === 'wall') {
            const tall = o.screen === 'kiosk';
            const names = { menu: t('rb_prev_menuboard', null, 'Menu board'), kitchen: t('rb_prev_kscreen', null, 'Kitchen screen'), pickup: t('rb_prev_pscreen', null, 'Pickup screen'), kiosk: t('rb_prev_kidle', null, 'Kiosk screen') };
            ov.innerHTML = `<div class="bx-overlay" data-act="ovclose"><div class="bx-modal rb-wallmodal" data-stop="1"><div class="rb-wallhead"><h3>${esc(names[o.screen] || '')}</h3><span class="bx-sp"></span>${Object.keys(names).map((k) => `<button class="bx-btn xs ${k === o.screen ? 'primary' : 'ghost'}" data-act="wallprev" data-kind="${k}">${esc(names[k])}</button>`).join('')}<button class="bx-btn xs ghost" data-act="ovclose">${I('close', 12)}</button></div><div class="rb-wallframe ${tall ? 'tall' : ''}"><iframe id="rb-wallframe" src="dui/screen.html?kind=${esc(o.screen)}"></iframe></div><div class="bx-hint" style="margin-top:10px">${esc(t('rb_prev_wall_hint', null, 'This is what the screen on the wall shows, with this menu and some example orders.'))}</div></div></div>`;
            const fr = ov.querySelector('#rb-wallframe');
            const data = JSON.stringify(wallData(o.screen));
            if (fr) fr.addEventListener('load', () => { if (fr.contentWindow) fr.contentWindow.postMessage(data, '*'); });
            return;
        }
        if (o.kind === 'palette') {
            const q = (o.q || '').trim().toLowerCase();
            const all = paletteItems();
            o.list = (q ? all.filter((i) => `${i.label} ${i.sub || ''}`.toLowerCase().includes(q)) : all.slice(0, 30)).slice(0, 60);
            o.idx = Math.min(o.idx || 0, Math.max(0, o.list.length - 1));
            let lastGroup = '';
            ov.innerHTML = `<div class="bx-overlay" data-act="ovclose"><div class="bx-palette" data-stop="1"><div class="bx-palin">${I('search', 17)}<input id="rb-palq" value="${esc(o.q || '')}" placeholder="${esc(t('rb_search', null, 'Search businesses, settings and pages'))}" autocomplete="off"></div><div class="bx-palres xsp-scroll">${o.list.map((it, i) => { const g = it.group !== lastGroup ? `<div class="bx-palgroup">${esc(it.group)}</div>` : ''; lastGroup = it.group; return `${g}<button class="bx-palitem ${i === o.idx ? 'on' : ''}" data-act="palrun" data-i="${i}"><b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</button>`; }).join('') || `<div class="bx-hint" style="padding:14px">${esc(t('rb_no_results', null, 'Nothing found.'))}</div>`}</div><div class="bx-palfoot"><span class="bx-kbd">↑</span><span class="bx-kbd">↓</span>${esc(t('rb_pal_move', null, 'move'))}<span class="bx-kbd">Enter</span>${esc(t('rb_pal_open', null, 'open'))}<span class="bx-kbd">Esc</span>${esc(t('rb_pal_close', null, 'close'))}</div></div></div>`;
            const input = ov.querySelector('#rb-palq');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            return;
        }
        if (o.kind === 'items') {
            const list = itemResults(o.q);
            const q = (o.q || '').trim();
            const typed = q && /^[a-zA-Z0-9_\-.]+$/.test(q) && !S.itemMap[q];
            ov.innerHTML = `<div class="bx-overlay" data-act="ovclose"><div class="bx-palette rb-itempal" data-stop="1"><div class="bx-palin">${I('search', 17)}<input id="rb-itemq" value="${esc(o.q || '')}" placeholder="${esc(t('rb_item_search', { n: S.items.length }, `${o.title || 'Pick an item'} · search ${S.items.length} items`))}" autocomplete="off"></div>
  <div class="rb-itemgrid xsp-scroll">${list.map((it) => `<button class="rb-itemopt" data-act="itempick" data-name="${esc(it.name)}">${thumb(it.name, 40)}<b>${esc(it.label)}</b><small>${esc(it.name)}</small></button>`).join('')}${typed ? `<button class="rb-itemopt typed" data-act="itempick" data-name="${esc(q)}"><span class="bx-thumb">${I('plus', 16)}</span><b>${esc(t('rb_use_name', { name: q }, `Use "${q}"`))}</b><small>${esc(t('rb_use_name_hint', null, 'not in your inventory list'))}</small></button>` : ''}${!list.length && !typed ? `<div class="bx-hint" style="grid-column:1/-1;padding:16px">${esc(S.items.length ? t('rb_no_results', null, 'Nothing found.') : t('rb_no_items', null, 'No inventory items were found. Type the item name instead.'))}</div>` : ''}</div></div></div>`;
            const input = ov.querySelector('#rb-itemq');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            return;
        }
        if (o.kind === 'styles') {
            ov.innerHTML = `<div class="bx-overlay" data-act="ovclose"><div class="bx-modal rb-stylemodal" data-stop="1"><h3>${esc(t('rb_pick_style', null, 'What kind of place?'))}</h3><p>${esc(t('rb_pick_style_sub', null, 'It sets the stations you will want, the menu sections and the colours. You can change all of it after.'))}</p>
  <div class="rb-stylegrid">${S.styles.map(styleCard).join('')}</div><div class="acts"><button class="bx-btn ghost" data-act="ovclose">${esc(t('rb_cancel', null, 'Cancel'))}</button></div></div></div>`;
            return;
        }
        if (o.kind === 'modal') {
            ov.innerHTML = `<div class="bx-overlay" data-act="ovclose"><div class="bx-modal" data-stop="1"><h3>${esc(o.title)}</h3><p>${esc(o.text || '')}</p>${o.input ? `<input class="bx-input" id="rb-modalin" style="margin-top:12px" value="${esc(o.value || '')}" placeholder="${esc(o.placeholder || '')}" maxlength="${o.max || 60}">` : ''}<div class="acts"><button class="bx-btn ghost" data-act="ovclose">${esc(t('rb_cancel', null, 'Cancel'))}</button><button class="bx-btn ${o.danger ? 'danger' : 'primary'}" data-act="modalok">${esc(o.ok || t('rb_ok', null, 'OK'))}</button></div></div></div>`;
            const i = ov.querySelector('#rb-modalin');
            if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
        }
    }

    function modal(opts) {
        return new Promise((resolve) => {
            S.overlay = Object.assign({ kind: 'modal' }, opts, { resolve });
            renderOverlay();
        });
    }

    function closeOverlay(result) {
        const o = S.overlay;
        S.overlay = null;
        renderOverlay();
        if (o && o.resolve) o.resolve(result);
    }

    async function confirmLeave() {
        if (!S.dirty) return true;
        const ok = await modal({ title: t('rb_unsaved', null, 'Unsaved changes'), text: t('rb_unsaved_text', null, 'Leave without saving?'), ok: t('rb_leave', null, 'Leave'), danger: true });
        if (ok) S.dirty = false;
        return !!ok;
    }

    async function go(page) {
        if (S.page === 'edit' && page !== 'edit' && !(await confirmLeave())) return;
        S.page = page;
        if (page === 'overview' || page === 'businesses') loadStats();
        render();
    }

    async function edit(id, tab) {
        if (S.page === 'edit' && S.curId !== id && !(await confirmLeave())) return;
        const b = byId(id);
        if (!b) return;
        S.cur = normalise(copy(b.data));
        S.curId = b.id;
        S.tab = tab || 'general';
        S.page = 'edit';
        S.dirty = false;
        S.ownerQ = '';
        S.ownerHits = [];
        S.openRecipe = null;
        render();
    }

    async function newBusiness(style) {
        if (S.page === 'edit' && !(await confirmLeave())) return;
        S.cur = blank(style);
        S.curId = null;
        S.tab = 'general';
        S.page = 'edit';
        S.dirty = true;
        S.ownerQ = '';
        S.ownerHits = [];
        S.openRecipe = null;
        const st = styleOf(style);
        if (XS.list(st.stations).length) S.newStation = XS.list(st.stations)[0];
        render();
    }

    async function loadStats() {
        const res = await XS.rpc('b:stats');
        if (res.ok) {
            S.stats = res.data || {};
            if (S.page === 'overview' || S.page === 'businesses') render();
        }
    }

    async function refresh() {
        const res = await XS.rpc('b:refresh');
        if (res.ok) apply(res.data, true);
    }

    async function save() {
        if (S.page === 'settings') return XS.BuilderSettings.save();
        if (S.page !== 'edit' || !S.cur || S.busy) return;
        const a = document.activeElement;
        if (a && a.blur) a.blur();
        if (!S.cur.label.trim()) return XS.toast(t('rb_need_name', null, 'Give it a name first.'), 'error');
        S.busy = true;
        const res = await XS.rpc('b:save', { id: S.curId, data: copy(S.cur) });
        S.busy = false;
        if (!res.ok) { render(); return XS.toast(res.error, 'error'); }
        const rec = { id: res.data.id, data: normalise(res.data.data) };
        const i = S.list.findIndex((b) => b.id === rec.id);
        if (i >= 0) S.list[i] = rec; else S.list.push(rec);
        S.curId = rec.id;
        S.cur = normalise(copy(rec.data));
        S.dirty = false;
        XS.toast(t('rb_saved_toast', null, 'Saved. It is live now.'), 'ok');
        render();
        loadStats();
    }

    function changed(redraw) {
        S.dirty = true;
        if (redraw !== false) render();
        else {
            const btn = root.querySelector('[data-act="save"]');
            if (btn) btn.innerHTML = `${I('check', 15)}${esc(t('rb_save', null, 'Save'))}<span class="bx-kbd">Ctrl S</span>`;
        }
    }

    function existingPoints() {
        const out = [];
        KINDS.forEach((k) => S.cur.points[k].forEach((p) => out.push({ x: p.x, y: p.y, z: p.z })));
        return out;
    }

    function propModel(kind, p, type) {
        if (kind === 'register') return (p && p.model) || 'prop_till_01';
        if (kind === 'speaker') return (p && p.model) || 'prop_parknmeter_01';
        if (kind === 'office') return (p && p.model) || 'prop_laptop_01a';
        if (kind === 'station') return (p && p.model) || stationOf(type || (p && p.type)).prop || '';
        return '';
    }

    async function place(kind, existing) {
        const label = t(`rb_kind_${kind}_one`, null, KIND[kind].one);
        const type = kind === 'station' ? (existing ? existing.type : S.newStation) : null;
        const res = await XS.rpc('b:place', {
            kind, label: kind === 'station' ? stationName(type) : label, width: existing ? existing.width : (kind === 'kiosk' ? 0.5 : (kind === 'menuboard' ? 1.6 : 1.2)), ratio: WALL[kind] || null,
            model: propModel(kind, existing, type), origin: existing || null, existing: existingPoints(), noProp: !!(existing && existing.prop === false),
        });
        if (!res.ok) { if (res.error) XS.toast(res.error, 'error'); return null; }
        return res.data || null;
    }

    function newPoint(kind, at) {
        const p = { id: uid(kind.slice(0, 1)), x: at.x, y: at.y, z: at.z, w: at.w || 0, label: '' };
        if (kind === 'station') { p.type = S.newStation; p.prop = true; p.model = ''; }
        if (kind === 'register') { p.prop = true; p.model = ''; p.drive = false; }
        if (kind === 'speaker' || kind === 'office') { p.prop = true; p.model = ''; }
        if (WALL[kind]) p.width = at.width || (kind === 'kiosk' ? 0.5 : 1.2);
        if (kind === 'menuboard') { p.title = ''; p.categories = []; }
        if (kind === 'seat') { p.seat = S.newSeat; p.height = seatOf(S.newSeat).height; }
        if (at.noProp && p.prop !== undefined) p.prop = false;
        return p;
    }

    function newRecipeFor(item) {
        const d = S.cur;
        const placed = d.points.station.map((s) => s.type);
        const station = placed[0] || XS.list(styleOf(d.style).stations)[0] || 'prep';
        const game = stationOf(station).game || 'timer';
        return { id: uid('r'), item, amount: 1, station, ingredients: [], steps: [{ game, seconds: 6, label: '' }], level: 'normal' };
    }

    async function onClick(e) {
        const stop = e.target.closest('[data-stop]');
        const el = e.target.closest('[data-act]');
        if (!el) return;
        if (stop && !stop.contains(el)) return;
        if (el.dataset.act === 'ovclose' && e.target.closest('[data-stop]') && el.classList.contains('bx-overlay')) return;
        const act = el.dataset.act;
        const d = S.cur;
        const i = Number(el.dataset.i);
        switch (act) {
            case 'close': XS.apps.builder.escape(); break;
            case 'nav': go(el.dataset.page); break;
            case 'palette': S.overlay = { kind: 'palette', q: '', idx: 0 }; renderOverlay(); break;
            case 'palrun': { const it = (S.overlay.list || [])[i]; closeOverlay(); if (it) it.run(); break; }
            case 'ovclose': closeOverlay(false); break;
            case 'modalok': { const input = root.querySelector('#rb-modalin'); closeOverlay(input ? input.value : true); break; }
            case 'itempick': closeOverlay(el.dataset.name); break;
            case 'newpick': S.overlay = { kind: 'styles' }; renderOverlay(); break;
            case 'new': if (S.overlay) closeOverlay(false); newBusiness(el.dataset.style); break;
            case 'edit': edit(Number(el.dataset.id), el.dataset.tab); break;
            case 'tab': S.tab = el.dataset.tab; render(); break;
            case 'save': save(); break;
            case 'delete': {
                const ok = await modal({ title: t('rb_delete_q', null, 'Delete this business?'), text: t('rb_delete_text', null, 'It disappears from the world and its open orders are dropped. This cannot be undone.'), ok: t('rb_delete', null, 'Delete'), danger: true });
                if (!ok) return;
                const res = await XS.rpc('b:delete', { id: S.curId });
                if (!res.ok) return XS.toast(res.error, 'error');
                S.list = S.list.filter((b) => b.id !== S.curId);
                S.cur = null;
                S.curId = null;
                S.dirty = false;
                S.page = 'businesses';
                XS.toast(t('rb_deleted', null, 'Deleted.'), 'ok');
                render();
                break;
            }
            case 'toggle': setPath(d, el.dataset.path, !getPath(d, el.dataset.path)); changed(); break;
            case 'style': {
                const st = styleOf(el.dataset.style);
                d.style = st.id;
                if (!d.categories.length) d.categories = XS.list(st.categories).map((label, n) => ({ id: `c${n + 1}`, label }));
                changed();
                break;
            }
            case 'theme': { if (!S.cur) break; S.cur.theme = el.dataset.theme; changed(); break; }
            case 'themecolours': { if (!S.cur) break; const th = themeOf(S.cur.theme); if (th.accent) { S.cur.colors.accent = th.accent; S.cur.colors.accent2 = th.accent2; changed(); } break; }
            case 'wallprev': { if (!S.cur) break; S.overlay = { kind: 'wall', screen: el.dataset.kind }; renderOverlay(); break; }
            case 'preview': {
                if (!S.cur) break;
                const v = el.dataset.view;
                const b = previewBrand();
                const p = previewItems();
                if (v === 'pos') XS.startPreview('pos', 'open', { brand: b, categories: p.categories, menu: p.menu, boss: true, register: t('rb_prev_register', null, 'Front register'), drive: false, soldout: {}, waiting: [] });
                else if (v === 'kiosk') XS.startPreview('kiosk', 'open', { brand: b, categories: p.categories, menu: p.menu, open: true, soldout: {}, card: true, cash: true });
                else if (v === 'pay') {
                    const lines = p.menu.slice(0, 3).map((m, n) => ({ label: m.label, qty: n === 0 ? 2 : 1, price: m.price }));
                    XS.startPreview('pay', 'open', { id: 'preview', business: b.label, colors: b.colors, theme: b.theme, logo: b.logo, lines, total: lines.reduce((n, l) => n + l.qty * l.price, 0), name: 'Vincent', card: true, cash: true, timeout: 45 });
                } else if (v === 'kitchen' || v === 'counter') XS.startPreview('kitchen', 'open', { mode: v, brand: b, now: Math.floor(Date.now() / 1000), list: previewOrders(), boss: true, late: 480, handOver: true });
                else if (v === 'cook') XS.startPreview('cook', 'menu', previewCook());
                break;
            }
            case 'stylecolours': { const st = styleOf(d.style); d.colors.accent = st.accent; d.colors.accent2 = st.accent2; changed(); break; }
            case 'owner': d.owner = { cid: el.dataset.cid, name: el.dataset.name }; S.ownerQ = ''; S.ownerHits = []; changed(); break;
            case 'ownerclear': d.owner = { cid: '', name: '' }; changed(); break;
            case 'goto': {
                const first = KINDS.map((k) => d.points[k][0]).find(Boolean);
                if (first) XS.rpc('b:goto', first);
                break;
            }
            case 'ptadd': {
                const kind = el.dataset.kind;
                const at = await place(kind, null);
                if (!at) return;
                d.points[kind].push(newPoint(kind, at));
                changed();
                break;
            }
            case 'pthere': {
                const kind = el.dataset.kind;
                const res = await XS.rpc('b:here');
                if (!res.ok) return;
                d.points[kind].push(newPoint(kind, res.data));
                changed();
                break;
            }
            case 'ptre': {
                const kind = el.dataset.kind;
                const p = d.points[kind][i];
                const at = await place(kind, p);
                if (!at) return;
                Object.assign(p, { x: at.x, y: at.y, z: at.z, w: at.w || 0 });
                if (at.width) p.width = at.width;
                if (p.prop !== undefined && at.noProp !== undefined) p.prop = !at.noProp;
                changed();
                break;
            }
            case 'ptgo': XS.rpc('b:goto', d.points[el.dataset.kind][i]); break;
            case 'ptdel': d.points[el.dataset.kind].splice(i, 1); changed(); break;
            case 'ptprop': { const p = d.points[el.dataset.kind][i]; p.prop = p.prop === false; changed(); break; }
            case 'ptdrive': { const p = d.points.register[i]; p.drive = !p.drive; changed(); break; }
            case 'boardcat': {
                const p = d.points.menuboard[i];
                const id = el.dataset.id;
                p.categories = XS.list(p.categories);
                if (p.categories.includes(id)) p.categories = p.categories.filter((c) => c !== id); else p.categories.push(id);
                changed();
                break;
            }
            case 'ptmany': {
                let placed = 0;
                for (let n = 0; n < 40; n++) {
                    const at = await place('seat', null);
                    if (!at) break;
                    d.points.seat.push(newPoint('seat', at));
                    placed++;
                }
                if (placed) { changed(); XS.toast(t('rb_placed_n', { n: placed }, `Placed ${placed} seats.`), 'ok'); }
                break;
            }
            case 'catrename': {
                const v = await modal({ title: t('rb_rename_cat', null, 'Rename the section'), input: true, value: d.categories[i].label, max: 32, ok: t('rb_rename', null, 'Rename') });
                if (typeof v === 'string' && v.trim()) { d.categories[i].label = v.trim().slice(0, 32); changed(); }
                break;
            }
            case 'catdel': {
                const gone = d.categories.splice(i, 1)[0];
                const next = d.categories[0] ? d.categories[0].id : '';
                d.menu.forEach((m) => { if (m.category === gone.id) m.category = next; });
                changed();
                break;
            }
            case 'supadd': {
                const name = await itemPicker({ title: t('rb_supply_add', null, 'Add a supply') });
                if (!name) return;
                if (d.supplies.some((x) => x.item === name)) { XS.toast(t('rb_supply_dupe', null, 'That is already on the list.'), 'error'); return; }
                d.supplies.push({ item: name, price: 5 });
                changed();
                break;
            }
            case 'supdel': d.supplies.splice(i, 1); changed(); break;
            case 'feeown': d.deliveryFee = d.deliveryFee >= 0 ? -1 : Number((XS.config.delivery || {}).fee) || 15; changed(); break;
            case 'whplace': case 'whhere': {
                let at = null;
                if (act === 'whhere') { const res = await XS.rpc('b:here'); at = res.ok ? res.data : null; }
                else { const res = await XS.rpc('b:place', { kind: 'warehouse', label: t('rb_warehouse', null, 'Supply warehouse'), origin: S.warehouse || null, existing: [] }); if (!res.ok) { if (res.error) XS.toast(res.error, 'error'); return; } at = res.data; }
                if (!at) return;
                const res = await XS.rpc('b:warehouse', at);
                if (!res.ok) { XS.toast(res.error, 'error'); return; }
                S.warehouse = res.data || null;
                XS.toast(t('rb_warehouse_set', null, 'Supply warehouse saved.'), 'ok');
                render();
                break;
            }
            case 'whclear': {
                const res = await XS.rpc('b:warehouse', {});
                if (!res.ok) { XS.toast(res.error, 'error'); return; }
                S.warehouse = null;
                render();
                break;
            }
            case 'whgo': if (S.warehouse) XS.rpc('b:goto', S.warehouse); break;
            case 'menuadd': {
                const name = await itemPicker({ title: t('rb_add_item', null, 'Add item') });
                if (!name) return;
                d.menu.push({ id: uid('m'), item: name, label: '', price: 10, category: d.categories[0] ? d.categories[0].id : '', available: true });
                changed();
                break;
            }
            case 'menuitem': {
                const name = await itemPicker({ title: t('rb_change_item', null, 'Change item') });
                if (!name) return;
                d.menu[i].item = name;
                changed();
                break;
            }
            case 'menudel': d.menu.splice(i, 1); changed(); break;
            case 'menufromrecipes': {
                d.recipes.forEach((r) => {
                    if (!d.menu.some((m) => m.item === r.item)) d.menu.push({ id: uid('m'), item: r.item, label: '', price: 10, category: d.categories[0] ? d.categories[0].id : '', available: true });
                });
                changed();
                break;
            }
            case 'recipeadd': {
                const name = await itemPicker({ title: t('rb_new_recipe', null, 'New recipe') });
                if (!name) return;
                const r = newRecipeFor(name);
                d.recipes.push(r);
                S.openRecipe = r.id;
                changed();
                break;
            }
            case 'recipeopen': S.openRecipe = S.openRecipe === el.dataset.id ? null : el.dataset.id; render(); break;
            case 'recipeitem': {
                const name = await itemPicker({ title: t('rb_change_item', null, 'Change item') });
                if (!name) return;
                d.recipes[i].item = name;
                changed();
                break;
            }
            case 'recipedel': d.recipes.splice(i, 1); changed(); break;
            case 'ingadd': {
                const name = await itemPicker({ title: t('rb_add_ingredient', null, 'Add ingredient') });
                if (!name) return;
                const r = d.recipes[i];
                const have = r.ingredients.find((g) => g.item === name);
                if (have) have.count += 1; else if (r.ingredients.length < 12) r.ingredients.push({ item: name, count: 1 });
                changed();
                break;
            }
            case 'ingdel': d.recipes[i].ingredients.splice(Number(el.dataset.j), 1); changed(); break;
            case 'stepadd': { const r = d.recipes[i]; if (r.steps.length < 6) r.steps.push({ game: 'timer', seconds: 5, label: '' }); changed(); break; }
            case 'stepdel': { const r = d.recipes[i]; if (r.steps.length > 1) r.steps.splice(Number(el.dataset.j), 1); changed(); break; }
            case 'recipetry': {
                const r = d.recipes[i];
                const mult = { easy: 0.75, normal: 1, hard: 1.35 }[r.level] || 1;
                if (XS.apps.cook && XS.apps.cook.test) XS.apps.cook.test({ steps: r.steps, label: itemLabel(r.item), image: itemImage(r.item), difficulty: mult * ((XS.config.cooking || {}).difficulty || 1), brand: { label: d.label, colors: d.colors } });
                break;
            }
            case 'trygame': {
                const g = el.dataset.game;
                if (XS.apps.cook && XS.apps.cook.test) XS.apps.cook.test({ steps: [{ game: g, seconds: 6, label: t(`rb_game_${g}`, null, GAME[g] || g) }], label: t(`rb_game_${g}`, null, GAME[g] || g), difficulty: (XS.config.cooking || {}).difficulty || 1, brand: { label: 'XS-Restaurant', colors: { accent: '#ff7849', accent2: '#ffc24b' } } });
                break;
            }
            case 'bb-sprite': d.blip.sprite = Number(el.dataset.id); changed(); break;
            case 'bb-colour': d.blip.colour = Number(el.dataset.id); changed(); break;
            case 'blipplace': {
                const res = await XS.rpc('b:place', { kind: 'blip', label: t('rb_blip_icon', null, 'Map blip'), origin: d.blip.at || null, existing: existingPoints() });
                if (!res.ok || !res.data) return;
                d.blip.at = { x: res.data.x, y: res.data.y, z: res.data.z, w: 0 };
                changed();
                break;
            }
            case 'bliphere': { const res = await XS.rpc('b:here'); if (res.ok) { d.blip.at = res.data; changed(); } break; }
            case 'blipreset': d.blip.at = null; changed(); break;
            default: break;
        }
    }

    let ownerTimer = null;
    function searchOwner(q) {
        clearTimeout(ownerTimer);
        ownerTimer = setTimeout(async () => {
            if (!q.trim()) { S.ownerHits = []; render(); return; }
            const res = await XS.rpc('b:players', { q });
            S.ownerHits = res.ok ? XS.list(res.data) : [];
            render();
            const input = root.querySelector('#rb-ownerq');
            if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
        }, 280);
    }

    function keepFocus(sel, fn) {
        fn();
        render();
        const input = root.querySelector(sel);
        if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }

    function onInput(e) {
        const el = e.target;
        if (el.id === 'rb-palq') { S.overlay.q = el.value; S.overlay.idx = 0; renderOverlay(); return; }
        if (el.id === 'rb-itemq') { S.overlay.q = el.value; renderOverlay(); return; }
        if (el.id === 'rb-q') return keepFocus('#rb-q', () => { S.q = el.value; });
        if (el.id === 'rb-ownerq') { S.ownerQ = el.value; searchOwner(el.value); return; }
        if (el.id === 'rb-bbq') {
            S.bbq = el.value;
            const grid = root.querySelector('#rb-bbgrid');
            if (grid) grid.innerHTML = spriteList().map((sp) => spriteTile(sp, sp.id === Number(S.cur.blip.sprite))).join('') || `<div class="bx-hint" style="grid-column:1/-1;padding:10px">${esc(t('rb_blip_none', null, 'No icon matches that.'))}</div>`;
            return;
        }
        if (el.id === 'rb-newstation' || el.id === 'rb-newseat' || el.id === 'rb-newcat') return;
        if (el.dataset.path && S.cur) {
            let v = el.value;
            if (el.dataset.num || el.type === 'number' || el.type === 'range') v = el.value === '' ? 0 : Number(el.value);
            setPath(S.cur, el.dataset.path, v);
            if (el.dataset.path === 'blip.scale') { const s = root.querySelector('#rb-scale'); if (s) s.textContent = Number(v).toFixed(2); }
            if (el.type === 'color') {
                const sw = el.parentElement;
                if (sw) { sw.querySelector('span').style.background = v; sw.querySelector('b').textContent = v; }
                paintThemes();
            }
            changed(false);
        }
    }

    function onChange(e) {
        const el = e.target;
        if (el.id === 'rb-newstation') { S.newStation = el.value; return; }
        if (el.id === 'rb-newseat') { S.newSeat = el.value; return; }
        if (el.tagName === 'SELECT' && el.dataset.path && S.cur) {
            setPath(S.cur, el.dataset.path, el.dataset.num ? Number(el.value) : el.value);
            if (/^recipes\.\d+\.station$/.test(el.dataset.path)) {
                const r = getPath(S.cur, el.dataset.path.replace(/\.station$/, ''));
                if (r && r.steps.length === 1 && r.steps[0].game !== 'timer') r.steps[0].game = stationOf(el.value).game || r.steps[0].game;
            }
            changed();
            return;
        }
        if (el.type === 'color' && el.dataset.path) { changed(); return; }
        if (el.dataset.path && el.dataset.path.startsWith('blip.sprite')) changed();
    }

    function onKey(e) {
        const o = S.overlay;
        if (o && o.kind === 'palette') {
            if (e.key === 'ArrowDown') { o.idx = Math.min((o.list || []).length - 1, (o.idx || 0) + 1); renderOverlay(); e.preventDefault(); return; }
            if (e.key === 'ArrowUp') { o.idx = Math.max(0, (o.idx || 0) - 1); renderOverlay(); e.preventDefault(); return; }
            if (e.key === 'Enter') { const it = (o.list || [])[o.idx || 0]; closeOverlay(); if (it) it.run(); e.preventDefault(); return; }
        }
        if (o && o.kind === 'items' && e.key === 'Enter') {
            const q = (o.q || '').trim();
            const first = itemResults(q)[0];
            if (S.itemMap[q]) closeOverlay(q);
            else if (first) closeOverlay(first.name);
            else if (q) closeOverlay(q);
            e.preventDefault();
            return;
        }
        if (o && o.kind === 'modal' && e.key === 'Enter') { const input = root.querySelector('#rb-modalin'); closeOverlay(input ? input.value : true); e.preventDefault(); return; }
        if (e.key === 'Enter' && e.target.id === 'rb-newcat' && S.cur) {
            const v = e.target.value.trim();
            if (v && S.cur.categories.length < 20) {
                S.cur.categories.push({ id: uid('c'), label: v.slice(0, 32) });
                changed();
                const again = root.querySelector('#rb-newcat');
                if (again) again.focus();
            }
            e.preventDefault();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { S.overlay = { kind: 'palette', q: '', idx: 0 }; renderOverlay(); e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { save(); e.preventDefault(); }
    }

    function apply(data, keepPage) {
        data = XS.fix(data || {});
        S.themes = XS.list(data.themes);
        S.list = XS.list(data.businesses).map((b) => ({ id: Number(b.id), data: normalise(b.data || {}) }));
        S.jobs = XS.list(data.jobs);
        S.items = XS.list(data.items);
        S.itemMap = {};
        S.items.forEach((it) => { S.itemMap[it.name] = it; });
        S.stats = data.stats || {};
        S.styles = XS.list(data.styles).map((s) => Object.assign(s, { stations: XS.list(s.stations), categories: XS.list(s.categories) }));
        S.stations = XS.list(data.stations);
        S.seats = XS.list(data.seats);
        S.games = XS.list(data.games);
        S.system = data.system || {};
        S.warehouse = data.warehouse && data.warehouse.x !== undefined ? data.warehouse : null;
        S.me = data.me || {};
        if (data.here) S.here = data.here;
        XS.BuilderSettings.load({ settings: data.settings || {}, jobs: S.jobs, items: S.items });
        if (keepPage && S.page === 'edit' && S.curId && !S.dirty) {
            const b = byId(S.curId);
            if (b) S.cur = normalise(copy(b.data));
        }
        if (!keepPage) S.page = S.cur && S.dirty ? 'edit' : 'overview';
    }

    XS.apps.builder = {
        isOpen: () => S.open && S.visible,
        escape() {
            if (S.overlay) return closeOverlay(false);
            XS.close('builder');
        },
        on(action, data) {
            if (action === 'open') {
                const keep = S.cur && S.dirty;
                apply(data, !!keep);
                S.open = true;
                S.visible = true;
                shell();
                XS.show('xsr-builder', true);
                render();
            } else if (action === 'show') {
                S.visible = true;
                XS.show('xsr-builder', true);
            } else if (action === 'hide') {
                S.visible = false;
                XS.show('xsr-builder', false);
            }
        },
    };

    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    window.addEventListener('keydown', (e) => { if (S.open && S.visible) onKey(e); });
})();
