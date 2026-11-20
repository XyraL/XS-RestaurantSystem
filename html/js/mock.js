(() => {
    if (typeof GetParentResourceName === 'function') return;
    if (location.hostname.toLowerCase() === RESOURCE.toLowerCase()) return;

    const send = (app, action, data) => window.dispatchEvent(new MessageEvent('message', { data: { app, action, data } }));
    const params = new URLSearchParams(location.search);
    const view = params.get('view') || 'builder';
    if (params.get('bg') !== 'none') document.documentElement.style.background = 'linear-gradient(160deg,#8a7d74 0%,#4f4540 45%,#28221f 100%)';
    const now = () => Math.floor(Date.now() / 1000);

    const COLOURS = { burger: '#c8742e', fries: '#e8b53a', cola: '#7a2d1e', shake: '#f4b6c8', bun: '#d9a35c', patty: '#6b3a24', lettuce: '#5fae4a', cheese: '#f2c230', potato: '#c9a36b', syrup: '#3b1a10', coffee: '#5a3622', latte: '#c8a27c', milk: '#f0ece4', beans: '#3e2416', croissant: '#d99a4e', beer: '#e0a526', pizza: '#d4553a', dough: '#e9d3a8', sauce: '#b8321f', water: '#7cc4e8' };
    const ITEM = (name, label) => {
        const c = COLOURS[name] || '#888888';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="40%" cy="35%"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".25"/><circle cx="32" cy="30" r="22" fill="${c}"/><circle cx="32" cy="30" r="22" fill="url(#g)"/></svg>`;
        return { name, label, image: `data:image/svg+xml;base64,${btoa(svg)}` };
    };
    const ITEMS = [
        ITEM('burger', 'Burger'), ITEM('fries', 'Fries'), ITEM('cola', 'Cola'), ITEM('shake', 'Milkshake'), ITEM('bun', 'Burger bun'), ITEM('patty', 'Beef patty'),
        ITEM('lettuce', 'Lettuce'), ITEM('cheese', 'Cheese slice'), ITEM('potato', 'Potato'), ITEM('syrup', 'Cola syrup'), ITEM('coffee', 'Coffee'), ITEM('latte', 'Latte'),
        ITEM('milk', 'Milk'), ITEM('beans', 'Coffee beans'), ITEM('croissant', 'Croissant'), ITEM('beer', 'Beer'), ITEM('pizza', 'Pizza slice'), ITEM('dough', 'Pizza dough'), ITEM('sauce', 'Tomato sauce'), ITEM('water', 'Water'),
    ];
    const IMG = {};
    ITEMS.forEach((i) => { IMG[i.name] = i; });
    const pub = (name) => ({ label: (IMG[name] || {}).label || name, image: (IMG[name] || {}).image || '' });

    const STATIONS = [
        { id: 'grill', icon: 'flame', prop: 'prop_griddle_01', scenario: 'PROP_HUMAN_BBQ', game: 'timing' }, { id: 'fryer', icon: 'fryer', prop: 'prop_chip_fryer', scenario: 'PROP_HUMAN_BBQ', game: 'heat' },
        { id: 'oven', icon: 'oven', prop: 'prop_cooker_03', scenario: 'PROP_HUMAN_BBQ', game: 'heat' }, { id: 'pizza', icon: 'pizza', prop: 'prop_pizza_oven_01', scenario: 'PROP_HUMAN_BBQ', game: 'timing' },
        { id: 'prep', icon: 'knife', prop: 'v_res_mchopboard', scenario: 'PROP_HUMAN_BBQ', game: 'stack' }, { id: 'coffee', icon: 'coffee', prop: 'prop_coffee_mac_02', scenario: 'PROP_HUMAN_PARKING_METER', game: 'pour' },
        { id: 'drinks', icon: 'cup', prop: 'prop_juice_dispenser', scenario: 'PROP_HUMAN_PARKING_METER', game: 'pour' }, { id: 'beer', icon: 'beer', prop: 'prop_bar_pump_01', scenario: 'PROP_HUMAN_PARKING_METER', game: 'pour' },
        { id: 'bar', theme: 'pub', icon: 'cocktail', prop: '', scenario: 'PROP_HUMAN_PARKING_METER', game: 'stir' },
    ];
    const STYLES = [
        { id: 'burger', theme: 'modern', icon: 'burger', accent: '#ff7a1a', accent2: '#ffd23f', sprite: 98, colour: 47, stations: ['grill', 'fryer', 'prep', 'drinks'], categories: ['Burgers', 'Sides', 'Drinks', 'Desserts'] },
        { id: 'pizza', theme: 'pizza', icon: 'pizza', accent: '#e63946', accent2: '#f4a261', sprite: 889, colour: 1, stations: ['prep', 'pizza', 'drinks'], categories: ['Pizza', 'Sides', 'Drinks', 'Desserts'] },
        { id: 'cafe', theme: 'coffee', icon: 'coffee', accent: '#c8874b', accent2: '#f3e1c7', sprite: 117, colour: 21, stations: ['coffee', 'oven', 'prep'], categories: ['Coffee', 'Tea', 'Bakery', 'Food'] },
        { id: 'bar', icon: 'beer', accent: '#d4a017', accent2: '#9b2c2c', sprite: 93, colour: 46, stations: ['beer', 'bar', 'drinks'], categories: ['Beer', 'Cocktails', 'Spirits', 'Snacks'] },
        { id: 'diner', theme: 'diner', icon: 'diner', accent: '#e5383b', accent2: '#4cc9f0', sprite: 117, colour: 1, stations: ['grill', 'fryer', 'oven', 'coffee', 'drinks'], categories: ['Breakfast', 'Mains', 'Sides', 'Drinks', 'Desserts'] },
        { id: 'taco', theme: 'ticket', icon: 'taco', accent: '#2a9d8f', accent2: '#e9c46a', sprite: 87, colour: 2, stations: ['grill', 'prep', 'drinks'], categories: ['Tacos', 'Burritos', 'Sides', 'Drinks'] },
        { id: 'noodle', theme: 'sushi', icon: 'bowl', accent: '#ef476f', accent2: '#ffd166', sprite: 117, colour: 48, stations: ['prep', 'grill', 'drinks'], categories: ['Noodles', 'Sushi', 'Sides', 'Drinks'] },
        { id: 'bakery', theme: 'coffee', icon: 'cake', accent: '#f28fad', accent2: '#8d5524', sprite: 117, colour: 8, stations: ['oven', 'prep', 'coffee'], categories: ['Bread', 'Pastries', 'Cakes', 'Drinks'] },
        { id: 'icecream', theme: 'diner', icon: 'icecream', accent: '#5ec8e8', accent2: '#f7aef8', sprite: 117, colour: 3, stations: ['prep', 'drinks'], categories: ['Ice cream', 'Shakes', 'Toppings'] },
        { id: 'club', theme: 'neon', icon: 'cocktail', accent: '#9d4edd', accent2: '#ff4fd8', sprite: 93, colour: 27, stations: ['bar', 'beer', 'drinks'], categories: ['Cocktails', 'Shots', 'Beer', 'Soft drinks'] },
        { id: 'custom', theme: 'modern', icon: 'store', accent: '#ff7849', accent2: '#ffc24b', sprite: 117, colour: 47, stations: [], categories: ['Food', 'Drinks'] },
    ];
    const P = (id, x, y, z, w, extra) => Object.assign({ id, x, y, z, w, label: '' }, extra || {});
    let NEXT = 3;
    const BIZ = [
        {
            id: 1,
            data: {
                label: 'Mirror Park Burgers', style: 'burger', job: 'burgerjoint', owner: { cid: 'XYR10001', name: 'Vincent Valentine' }, enabled: true,
                colors: { accent: '#ff7a1a', accent2: '#ffd23f' }, logo: '', blip: { show: true, sprite: 98, colour: 47, scale: 0.8, label: '', at: null, whenClosed: 'default' },
                points: {
                    register: [P('r1', 1185.4, -323.1, 69.2, 100, { prop: true, model: '' }), P('r2', 1186.9, -322.0, 69.2, 100, { prop: true, model: '', label: 'Drive-thru', drive: true })],
                    station: [P('s1', 1190.2, -326.8, 69.2, 280, { type: 'grill', prop: true, model: '' }), P('s2', 1191.0, -328.4, 69.2, 280, { type: 'fryer', prop: true, model: '' }), P('s3', 1188.6, -329.2, 69.2, 190, { type: 'prep', prop: true, model: '' }), P('s4', 1187.1, -325.5, 69.2, 10, { type: 'drinks', prop: true, model: '' })],
                    kitchen: [P('k1', 1189.4, -330.6, 70.9, 190, { width: 1.4 })], pickup: [P('p1', 1183.2, -320.4, 71.2, 100, { width: 1.8 })], counter: [P('c1', 1184.8, -324.6, 69.2, 100)], storage: [P('t1', 1192.4, -331.0, 69.2, 270, { label: 'Walk-in fridge' })],
                    menuboard: [P('b1', 1186.0, -326.0, 72.0, 100, { width: 2.4, title: '', categories: [] })], kiosk: [P('q1', 1180.2, -321.0, 70.4, 100, { width: 0.5 })],
                    speaker: [P('v1', 1170.4, -310.2, 68.9, 0, { prop: true, model: '' })], office: [P('o1', 1193.1, -333.4, 70.1, 180, { prop: true, model: '' })], dock: params.get('nodock') ? [] : [P('d1', 1199.8, -340.2, 69.0, 90)], seat: [P('e1', 1178.0, -318.0, 69.2, 90, { seat: 'chair', height: 0.5 }), P('e2', 1178.0, -319.2, 69.2, 270, { seat: 'chair', height: 0.5 }), P('e3', 1176.2, -322.4, 69.2, 180, { seat: 'stool', height: 0.75 })],
                },
                categories: [{ id: 'c1', label: 'Burgers' }, { id: 'c2', label: 'Sides' }, { id: 'c3', label: 'Drinks' }, { id: 'c4', label: 'Desserts' }],
                menu: [
                    { id: 'm1', item: 'burger', label: 'Classic Burger', price: 14, category: 'c1', available: true }, { id: 'm2', item: 'fries', label: '', price: 6, category: 'c2', available: true },
                    { id: 'm3', item: 'cola', label: '', price: 4, category: 'c3', available: true }, { id: 'm4', item: 'shake', label: 'Strawberry Shake', price: 7, category: 'c4', available: true }, { id: 'm5', item: 'water', label: '', price: 2, category: 'c3', available: false },
                ],
                recipes: [
                    { id: 'r1', item: 'patty', amount: 1, station: 'grill', ingredients: [], steps: [{ game: 'timing', seconds: 6, label: 'Flip the patty' }], level: 'normal' },
                    { id: 'r2', item: 'burger', amount: 1, station: 'prep', ingredients: [{ item: 'bun', count: 1 }, { item: 'patty', count: 1 }, { item: 'lettuce', count: 1 }, { item: 'cheese', count: 1 }], steps: [{ game: 'stack', seconds: 8, label: 'Build the burger' }], level: 'normal' },
                    { id: 'r3', item: 'fries', amount: 2, station: 'fryer', ingredients: [{ item: 'potato', count: 2 }], steps: [{ game: 'heat', seconds: 5, label: 'Keep the oil hot' }, { game: 'timer', seconds: 3, label: 'Drain' }], level: 'easy' },
                    { id: 'r4', item: 'cola', amount: 1, station: 'drinks', ingredients: [{ item: 'syrup', count: 1 }], steps: [{ game: 'pour', seconds: 4, label: '' }], level: 'normal' },
                ],
                storage: { slots: 60, weight: 400000 },
                supplies: [{ item: 'bun', price: 2 }, { item: 'patty', price: 4 }, { item: 'lettuce', price: 1 }, { item: 'cheese', price: 1 }, { item: 'potato', price: 1 }, { item: 'syrup', price: 3 }],
                phone: true, delivery: true, deliveryFee: -1, webhook: '',
            },
        },
        {
            id: 2,
            data: {
                label: 'Vespucci Coffee', style: 'cafe', job: 'beancoffee', owner: { cid: '', name: '' }, enabled: true, colors: { accent: '#c8874b', accent2: '#f3e1c7' }, logo: '',
                blip: { show: true, sprite: 117, colour: 21, scale: 0.8, label: '', at: null, whenClosed: 'grey' },
                points: { register: [P('r1', -1270.1, -1430.6, 4.4, 30, { prop: true, model: '' })], station: [P('s1', -1272.3, -1432.1, 4.4, 120, { type: 'coffee', prop: true, model: '' })], kitchen: [], pickup: [], counter: [], storage: [], menuboard: [], kiosk: [], speaker: [], seat: [] },
                categories: [{ id: 'c1', label: 'Coffee' }, { id: 'c2', label: 'Bakery' }],
                menu: [{ id: 'm1', item: 'latte', label: '', price: 5, category: 'c1', available: true }, { id: 'm2', item: 'croissant', label: '', price: 4, category: 'c2', available: true }],
                recipes: [{ id: 'r1', item: 'latte', amount: 1, station: 'coffee', ingredients: [{ item: 'beans', count: 1 }, { item: 'milk', count: 1 }], steps: [{ game: 'pour', seconds: 5, label: 'Steam the milk' }], level: 'normal' }],
                storage: { slots: 40, weight: 200000 },
            },
        },
    ];
    const SETTINGS = {
        sections: [
            { id: 'orders', icon: 'receipt', fields: [{ key: 'Orders.customerRange', type: 'num', section: 'orders', min: 1, max: 20, step: 0.5, unit: 'm' }, { key: 'Orders.payTimeout', type: 'int', section: 'orders', min: 10, max: 300, unit: 's' }, { key: 'Orders.card', type: 'bool', section: 'orders' }, { key: 'Orders.cash', type: 'bool', section: 'orders' }, { key: 'Orders.businessPct', type: 'pct', section: 'orders' }, { key: 'Orders.resetNumbers', type: 'select', section: 'orders', options: ['daily', 'never'] }] },
            { id: 'cooking', icon: 'flame', fields: [{ key: 'Cooking.minigames', type: 'bool', section: 'cooking' }, { key: 'Cooking.difficulty', type: 'num', section: 'cooking', min: 0.5, max: 2, step: 0.1 }, { key: 'Cooking.needIngredients', type: 'bool', section: 'cooking' }, { key: 'Cooking.failLoses', type: 'bool', section: 'cooking', needs: 'Cooking.needIngredients' }, { key: 'Cooking.maxBatch', type: 'int', section: 'cooking', min: 1, max: 20 }] },
        ],
        values: { 'Orders.customerRange': 6, 'Orders.payTimeout': 45, 'Orders.card': true, 'Orders.cash': true, 'Orders.businessPct': 100, 'Orders.resetNumbers': 'daily', 'Cooking.minigames': true, 'Cooking.difficulty': 1, 'Cooking.needIngredients': true, 'Cooking.failLoses': true, 'Cooking.maxBatch': 5 },
        defaults: { 'Orders.customerRange': 6, 'Orders.payTimeout': 45, 'Orders.card': true, 'Orders.cash': true, 'Orders.businessPct': 100, 'Orders.resetNumbers': 'daily', 'Cooking.minigames': true, 'Cooking.difficulty': 1, 'Cooking.needIngredients': true, 'Cooking.failLoses': true, 'Cooking.maxBatch': 5 },
        boot: {},
    };
    if (params.get('empty')) BIZ.length = 0;
    const THEMES = [{ id: 'modern' }, { id: 'ticket', accent: '#d6332a', accent2: '#1f5fa8' }, { id: 'pizza', accent: '#c8102e', accent2: '#2e7d32' }, { id: 'coffee', accent: '#c8874b', accent2: '#e9d8bd' }, { id: 'diner', accent: '#d62828', accent2: '#1fb5a8' }, { id: 'pub', accent: '#c9a24d', accent2: '#b5453a' }, { id: 'sushi', accent: '#c8352c', accent2: '#3f6e4a' }, { id: 'neon', accent: '#ff2bd6', accent2: '#22e6ff' }];
    if (BIZ[0]) {
        const th = THEMES.find((x) => x.id === params.get('theme'));
        BIZ[0].data.theme = th ? th.id : (BIZ[0].data.theme || 'modern');
        if (th && th.accent && params.get('tc') === '1') BIZ[0].data.colors = { accent: th.accent, accent2: th.accent2 };
    }

    function builderData() {
        return {
            businesses: BIZ.map((b) => ({ id: b.id, data: JSON.parse(JSON.stringify(b.data)) })),
            jobs: [{ name: 'burgerjoint', label: 'Burger Joint', onDuty: 2, grades: [{ level: 0, name: 'Trainee' }, { level: 1, name: 'Cook' }, { level: 2, name: 'Shift Lead' }, { level: 3, name: 'Manager', boss: true }] }, { name: 'beancoffee', label: 'Bean Machine', onDuty: 0 }, { name: 'police', label: 'Police', onDuty: 4 }, { name: 'unemployed', label: 'Civilian', onDuty: 0 }],
            items: ITEMS, settings: SETTINGS, stats: { 1: { orders: 23, sales: 418, open: 3, staff: true }, 2: { orders: 0, sales: 0, open: 0, staff: false } },
            styles: STYLES, themes: THEMES, stations: STATIONS, games: ['timer', 'timing', 'pour', 'keys', 'stir', 'stack', 'heat'],
            seats: [{ id: 'chair', height: 0.5 }, { id: 'table', height: 0.5 }, { id: 'stool', height: 0.75 }, { id: 'bench', height: 0.5 }, { id: 'armchair', height: 0.45 }],
            system: { framework: 'qbx_core', inventory: 'ox_inventory', banking: 'Renewed-Banking', target: 'ox_target', voice: true, phone: 'XS-Phone', webhook: true }, me: { name: 'XyraL', cid: 'XYR10000' },
            warehouse: params.get('nowh') ? null : { x: 1009.4, y: -2510.8, z: 28.3, w: 90 },
            here: { x: 1185.0, y: -324.0, z: 69.2, w: 90 },
        };
    }

    function brand(id) {
        const b = BIZ.find((x) => x.id === id) || BIZ[0];
        return { id: b.id, label: b.data.label, colors: b.data.colors, logo: b.data.logo, style: b.data.style, theme: b.data.theme };
    }

    let ORDERS = [
        { id: 101, number: 12, status: 'new', name: 'Vincent', lines: [{ label: 'Classic Burger', qty: 2, done: false, item: 'burger' }, { label: 'Fries', qty: 2, done: true, item: 'fries' }, { label: 'Cola', qty: 2, done: false, item: 'cola' }], at: now() - 140, total: 48, paidWith: 'card' },
        { id: 102, number: 13, status: 'cooking', name: 'Isabel', lines: [{ label: 'Strawberry Shake', qty: 1, done: false, item: 'shake' }], at: now() - 610, total: 7, paidWith: 'cash' },
        { id: 103, number: 14, status: 'new', name: '', lines: [{ label: 'Classic Burger', qty: 1, done: false, item: 'burger' }, { label: 'Cola', qty: 1, done: false, item: 'cola' }], at: now() - 35, total: 18, paidWith: 'free' },
        { id: 100, number: 11, status: 'ready', name: 'Rafael', lines: [{ label: 'Fries', qty: 1, done: true, item: 'fries' }, { label: 'Cola', qty: 1, done: true, item: 'cola' }], at: now() - 900, readyAt: now() - 60, total: 10, paidWith: 'card' },
    ];
    let NUMBER = 15;
    let SEATN = 0;
    const SOLD = params.get('sold') ? { m4: true } : {};
    const WAITING = [{ src: 31, speaker: 'v1', at: now() - 25, answered: false }];
    if (params.get('delivery')) ORDERS.push({ id: 104, number: 15, status: 'ready', name: 'Delia', lines: [{ label: 'Classic Burger', qty: 1, done: true, item: 'burger' }, { label: 'Fries', qty: 1, done: true, item: 'fries' }], at: now() - 420, readyAt: now() - 30, total: 35, paidWith: 'card', via: 'delivery', street: 'Mirror Park Blvd & Nikola Ave', taken: params.get('delivery') === 'taken' || undefined, driver: params.get('delivery') === 'taken' ? 'Isabel Reyes' : undefined }, { id: 105, number: 16, status: 'cooking', name: 'Marco', lines: [{ label: 'Cola', qty: 2, done: false, item: 'cola' }], at: now() - 90, total: 8, paidWith: 'card', via: 'phone' });
    const pushOrders = () => send('kitchen', 'orders', { now: now(), list: ORDERS });
    const day0 = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return Math.floor(d.getTime() / 1000); })();
    const SALES = [312, 268, 401, 190, 455, 520, 233];
    const BOSS = {
        brand: brand(1), open: params.get('closed') !== '1', now: now(), balance: params.get('nobank') || params.get('noacct') ? null : (params.get('broke') ? 40 : 18420), banking: 'Renewed-Banking', job: 'burgerjoint',
        days: SALES.map((v, i) => ({ at: day0 - (6 - i) * 86400, sales: v, orders: Math.round(v / 17) })), today: { at: day0, sales: 233, orders: 14 }, week: { sales: 2379, orders: 141 },
        best: [{ label: 'Classic Burger', item: 'burger', qty: 88, sales: 1232, image: pub('burger').image }, { label: 'Fries', item: 'fries', qty: 74, sales: 444, image: pub('fries').image }, { label: 'Cola', item: 'cola', qty: 61, sales: 244, image: pub('cola').image }, { label: 'Strawberry Shake', item: 'shake', qty: 23, sales: 161, image: pub('shake').image }],
        staff: [{ name: 'Isabel Reyes', orders: 58, sales: 1012 }, { name: 'Vincent Valentine', orders: 47, sales: 801 }, { name: 'Marco Bellini', orders: 36, sales: 566 }],
        via: { counter: 82, drive: 27, kiosk: 18, phone: 9, delivery: 5 },
        recent: [
            { id: 140, number: 17, status: 'cooking', total: 47, customer_name: 'Delia Moss', name: 'Delia', via: 'delivery', paid_with: 'card', staff_name: '', created_at: now() - 120 },
            { id: 139, number: 16, status: 'ready', total: 18, customer_name: 'Rafael Ortiz', name: 'Rafael', via: 'counter', paid_with: 'cash', staff_name: 'Isabel Reyes', created_at: now() - 600 },
            { id: 138, number: 15, status: 'collected', total: 22, customer_name: 'Tony Price', name: '', via: 'drive', paid_with: 'card', staff_name: 'Vincent Valentine', created_at: now() - 1500 },
            { id: 137, number: 14, status: 'cancelled', total: 14, customer_name: 'Mia Chen', name: 'Mia', via: 'kiosk', paid_with: 'card', staff_name: '', created_at: now() - 2400 },
            { id: 136, number: 13, status: 'collected', total: 0, customer_name: 'Vincent Valentine', name: '', via: 'counter', paid_with: 'free', staff_name: 'Vincent Valentine', created_at: now() - 3600 },
        ],
        categories: BIZ[0].data.categories,
        menu: BIZ[0].data.menu.map((m) => ({ id: m.id, label: m.label || pub(m.item).label, image: pub(m.item).image, base: m.price, price: m.id === 'm1' ? 15 : m.price, low: Math.floor(m.price * 0.5), high: Math.ceil(m.price * 1.5), available: m.available, soldout: m.id === 'm4', category: m.category })),
        prices: params.get('prices') !== 'off', range: 50,
        supplies: [['bun', 2], ['patty', 4], ['lettuce', 1], ['cheese', 1], ['potato', 1], ['syrup', 3]].map(([item, price]) => ({ item, price, label: pub(item).label, image: pub(item).image })),
        modes: params.get('modes') === 'none' ? [] : ['delivery', 'pickup'], supplyOn: true, deliveryMinutes: 5, pickupMinutes: 2,
        supplyRecent: [
            { id: 9, lines: [{ item: 'bun', label: 'Burger bun', count: 40, price: 2 }, { item: 'patty', label: 'Beef patty', count: 40, price: 4 }], total: 240, mode: 'delivery', status: 'waiting', by: 'Vincent Valentine', at: now() - 60, ready: now() + 184 },
            { id: 8, lines: [{ item: 'potato', label: 'Potato', count: 60, price: 1 }], total: 60, mode: 'pickup', status: 'arrived', by: 'Vincent Valentine', at: now() - 900, ready: now() - 780 },
            { id: 7, lines: [{ item: 'syrup', label: 'Cola syrup', count: 20, price: 3 }], total: 60, mode: 'delivery', status: 'collected', by: 'Isabel Reyes', at: now() - 86400, ready: now() - 86100 },
            { id: 6, lines: [{ item: 'cheese', label: 'Cheese slice', count: 30, price: 1 }], total: 30, mode: 'pickup', status: 'refunded', by: 'Isabel Reyes', at: now() - 172800, ready: now() - 172600 },
        ],
        flags: { phone: { allowed: true, on: true }, delivery: { allowed: params.get('nodelivery') !== '1', on: false } },
        bossmenu: true,
        bank: { on: true, ready: params.get('nobank') !== '1', supported: ['Renewed-Banking', 'qb-banking', 'okokBanking', 'tgg-banking', 'wasabi_banking', 'fd_banking', 'qb-management'], deposit: true, withdraw: params.get('nowithdraw') !== '1' && params.get('limited') !== '1', max: 1000000, recent: [
            { kind: 'deposit', amount: 2500, account: 'cash', by: 'Isabel Reyes', at: now() - 3600 },
            { kind: 'withdraw', amount: 800, account: 'bank', by: 'Vincent Valentine', at: now() - 90000 },
        ] },
        mine: { cash: 1200, bank: 5400 },
        limited: params.get('limited') === '1' || undefined,
    };

    const reply = (data) => ({ ok: true, data });
    const fail = (error) => ({ ok: false, error });
    const RPC = {
        'b:refresh': () => reply(builderData()),
        'b:stats': () => reply(builderData().stats),
        'b:save': (p) => {
            let b = BIZ.find((x) => x.id === p.id);
            if (!b) { b = { id: NEXT++, data: p.data }; BIZ.push(b); }
            b.data = JSON.parse(JSON.stringify(p.data));
            return reply({ id: b.id, data: b.data });
        },
        'b:delete': (p) => { const i = BIZ.findIndex((x) => x.id === p.id); if (i >= 0) BIZ.splice(i, 1); return reply(true); },
        'b:players': (p) => reply([{ cid: 'XYR10001', name: 'Vincent Valentine', online: true }, { cid: 'XYR10007', name: 'Rafael Duarte', online: true }, { cid: 'XYR10008', name: 'Delia Moss', online: false }].filter((x) => !p.q || x.name.toLowerCase().includes(String(p.q).toLowerCase()))),
        'b:settings': (p) => { Object.assign(SETTINGS.values, p.changes || {}); return reply({ values: SETTINGS.values, boot: {} }); },
        'b:here': () => reply({ x: 1185.0 + Math.random(), y: -324.0, z: 69.2, w: 90 }),
        'b:place': (p) => {
            send('builder', 'hide', {});
            if (p.kind === 'seat' && ++SEATN % 4 === 0) return new Promise((resolve) => setTimeout(() => { send('builder', 'show', {}); resolve(reply(false)); }, 120));
            return new Promise((resolve) => setTimeout(() => { send('builder', 'show', {}); resolve(reply({ x: 1188.2, y: -327.4, z: p.kind === 'kitchen' || p.kind === 'pickup' ? 71.0 : 69.2, w: 180, width: p.kind === 'kitchen' || p.kind === 'pickup' ? 1.6 : undefined, noProp: params.get('noprop') === '1' })); }, 250));
        },
        'b:goto': () => reply(true),
        'b:warehouse': (p) => reply(p && p.x !== undefined ? p : null),
        'pos:nearby': () => reply(params.get('drive') === '1' ? [{ src: 12, dist: 1.4 }, { src: 31, dist: 14.2, speaker: true }] : [{ src: 12, dist: 1.4 }, { src: 14, dist: 3.2 }]),
        'pos:ring': (p) => {
            if (!p.lines || !p.lines.length) return fail('The order is empty.');
            const n = NUMBER++;
            if (p.free) return reply({ done: true, number: n });
            setTimeout(() => send('pos', 'result', { id: 'p1', result: params.get('pay') === 'decline' ? 'declined' : 'paid', number: n }), 1200);
            return reply({ pending: 'p1', total: 0 });
        },
        'pos:cancel': () => reply(true),
        'pos:soldout': (p) => { if (p.on) SOLD[p.id] = true; else delete SOLD[p.id]; setTimeout(() => { send('pos', 'soldout', { map: Object.assign({}, SOLD) }); send('kiosk', 'soldout', { map: Object.assign({}, SOLD) }); }, 30); return reply(true); },
        'pos:answer': (p) => { WAITING.forEach((w) => { if (w.src === p.src) w.answered = true; }); setTimeout(() => send('pos', 'waiting', { list: WAITING }), 30); return reply({ voice: true }); },
        'pos:hangup': () => reply(true),
        'kiosk:order': (p) => {
            if (!p.lines || !p.lines.length) return fail('The order is empty.');
            if (params.get('kiosk') === 'one') return fail('You already have order #15 on the way. Pick that up first.');
            return reply({ number: NUMBER++, total: 0, business: 'Mirror Park Burgers' });
        },
        'pay:respond': (p) => { send('pay', 'close', {}); return reply(p.method === 'decline' ? { declined: true } : { number: 16, business: 'Mirror Park Burgers' }); },
        'k:status': (p) => {
            const o = ORDERS.find((x) => x.id === p.id);
            if (!o) return fail('That order is gone.');
            if (p.status === 'cancelled' || p.status === 'collected') ORDERS = ORDERS.filter((x) => x.id !== p.id);
            else { o.status = p.status; if (p.status === 'ready') o.readyAt = now(); }
            setTimeout(pushOrders, 30);
            return reply(true);
        },
        'k:line': (p) => { const o = ORDERS.find((x) => x.id === p.id); if (o && o.lines[p.index - 1]) o.lines[p.index - 1].done = !o.lines[p.index - 1].done; setTimeout(pushOrders, 30); return reply(true); },
        'k:nearby': () => reply([{ src: 12, dist: 1.1, orders: [11] }, { src: 14, dist: 2.6 }]),
        'k:hand': (p) => { ORDERS = ORDERS.filter((x) => x.id !== p.id); setTimeout(pushOrders, 30); return reply({ number: 11 }); },
        'cook:start': (p) => {
            const r = BIZ[0].data.recipes.find((x) => x.id === p.recipe) || BIZ[0].data.recipes[0];
            return reply({ token: 'k1', steps: r.steps, amount: p.amount || 1, makes: (p.amount || 1) * r.amount, item: r.item, label: pub(r.item).label, image: pub(r.item).image, difficulty: 1, station: r.station });
        },
        'cook:done': (p) => reply({ result: p.passed ? { passed: true, makes: 1, label: 'Burger' } : { passed: false, lost: true }, counts: { bun: 2, patty: 1, lettuce: 3, cheese: 2 } }),
        'cook:cancel': () => reply(true),
        'boss:refresh': () => { BOSS.now = now(); return reply(BOSS); },
        'boss:price': (p) => { const m = BOSS.menu.find((x) => x.id === p.id); if (!m) return fail('That did not go through.'); if (p.price < m.low || p.price > m.high) return fail(`Pick a price between $${m.low} and $${m.high}.`); m.price = p.price; return reply({ price: p.price }); },
        'boss:soldout': (p) => { const m = BOSS.menu.find((x) => x.id === p.id); if (m) m.soldout = p.on; return reply(true); },
        'boss:flag': (p) => { BOSS.flags[p.key].on = p.on; return reply(true); },
        'boss:supply': (p) => { const total = p.lines.reduce((a, l) => a + (BOSS.supplies.find((x) => x.item === l.item) || { price: 0 }).price * l.qty, 0); if (total > BOSS.balance) return fail(`The business account cannot cover $${total}.`); BOSS.balance -= total; BOSS.supplyRecent.unshift({ id: 10 + BOSS.supplyRecent.length, lines: p.lines.map((l) => ({ item: l.item, label: pub(l.item).label, count: l.qty })), total, mode: p.mode, status: 'waiting', by: 'XyraL', at: now(), ready: now() + (p.mode === 'delivery' ? 300 : 120) }); return reply({ total }); },
        'boss:menu': () => reply(true),
        'boss:bank': (p) => {
            const amount = Number(p.amount);
            if (p.kind === 'deposit') {
                if (amount > BOSS.mine[p.account]) return fail(p.account === 'bank' ? 'Not enough money in the bank.' : 'Not enough cash on you.');
                BOSS.mine[p.account] -= amount; BOSS.balance += amount;
            } else {
                if (!BOSS.bank.withdraw) return fail('You cannot take money out here.');
                if (amount > BOSS.balance) return fail(`The business account does not have $${amount}.`);
                BOSS.balance -= amount; BOSS.mine[p.account] += amount;
            }
            BOSS.bank.recent.unshift({ kind: p.kind, amount, account: p.account, by: 'XyraL', at: now() });
            return reply({ balance: BOSS.balance, mine: BOSS.mine });
        },
        'k:take': (p) => { const o = ORDERS.find((x) => x.id === p.id); if (o) { o.taken = true; o.driver = 'XyraL'; } send('kitchen', 'close', {}); return reply(true); },
    };

    XS.post = async (endpoint, payload) => {
        if (endpoint === 'close') { send(payload.app, payload.app === 'builder' ? 'hide' : 'close', {}); return { ok: true }; }
        if (endpoint !== 'rpc') return { ok: true };
        const fn = RPC[payload.name];
        await new Promise((r) => setTimeout(r, 40));
        return fn ? fn(payload.payload || {}) : { ok: true, data: null };
    };

    function cookMenu() {
        const b = BIZ[0].data;
        const station = params.get('station') || 'prep';
        const recipes = b.recipes.filter((r) => r.station === station).map((r) => Object.assign({}, r, pub(r.item), { ingredients: r.ingredients.map((g) => Object.assign({}, g, pub(g.item))) }));
        return { brand: brand(1), station: { type: station, label: { prep: 'Prep board', grill: 'Grill', fryer: 'Fryer', drinks: 'Drinks machine' }[station] || station }, recipes, counts: { bun: 2, patty: 1, lettuce: 3, cheese: 0, potato: 6, syrup: 4 }, maxBatch: 5, needIngredients: true };
    }

    window.addEventListener('load', () => {
        send('core', 'boot', { locale: window.XSR_LOCALE || {}, config: { currency: '$', orders: { card: true, cash: true, onTheHouse: true, maxQuantity: 20, maxLines: 20, lateMinutes: 8, readyMinutes: 20, payTimeout: 45, names: true, handOver: true }, cooking: { minigames: true, difficulty: 1, maxBatch: 5, needIngredients: true } } });
        if (view === 'builder') {
            send('builder', 'open', builderData());
            const page = params.get('page');
            const edit = params.get('edit');
            setTimeout(() => {
                if (edit) {
                    const card = document.querySelector('[data-act="nav"][data-page="businesses"]');
                    if (card) card.click();
                    setTimeout(() => {
                        const c = document.querySelector(`.bx-pcard[data-act="edit"][data-id="${edit}"]`);
                        if (c) c.click();
                        const tab = params.get('tab');
                        if (tab) setTimeout(() => { const tb = document.querySelector(`[data-act="tab"][data-tab="${tab}"]`); if (tb) tb.click(); }, 60);
                    }, 60);
                } else if (page) {
                    const n = document.querySelector(`[data-act="nav"][data-page="${page}"]`);
                    if (n) n.click();
                }
            }, 60);
        } else if (view === 'pos') {
            const b = BIZ[0].data;
            const drive = params.get('drive') === '1';
            send('pos', 'open', { brand: brand(1), categories: b.categories, menu: b.menu.filter((m) => m.available).map((m) => Object.assign({}, m, pub(m.item), m.label ? { label: m.label } : {})), boss: true, register: drive ? 'Drive-thru' : 'Front register', drive, soldout: Object.assign({}, SOLD), waiting: drive ? WAITING : [] });
        } else if (view === 'kiosk') {
            const b = BIZ[0].data;
            send('kiosk', 'open', { brand: brand(1), categories: b.categories, menu: b.menu.filter((x) => x.available).map((x) => Object.assign({}, x, pub(x.item), x.label ? { label: x.label } : {})), open: params.get('closed') !== '1', soldout: Object.assign({}, SOLD), card: true, cash: true });
        } else if (view === 'pay') {
            send('pay', 'open', { id: 'p1', business: 'Mirror Park Burgers', colors: BIZ[0].data.colors, theme: BIZ[0].data.theme, logo: '', lines: [{ label: 'Classic Burger', qty: 2, price: 14 }, { label: 'Fries', qty: 2, price: 6 }, { label: 'Cola', qty: 2, price: 4 }], total: 48, name: 'Vincent', card: true, cash: true, timeout: 45 });
        } else if (view === 'kitchen' || view === 'counter') {
            send('kitchen', 'open', { mode: view, brand: brand(1), now: now(), list: ORDERS, boss: true, late: 480, handOver: params.get('handover') !== 'off' });
        } else if (view === 'boss') {
            send('boss', 'open', BOSS);
            const tab = params.get('tab');
            if (tab) setTimeout(() => { const b = document.querySelector(`[data-act="tab"][data-tab="${tab}"]`); if (b) b.click(); }, 60);
        } else if (view === 'phone') {
            send('phonefull', 'open', {});
        } else if (view === 'cook') {
            if (params.get('play')) {
                const g = params.get('play');
                XS.apps.cook.test({ steps: [{ game: g, seconds: Number(params.get('s')) || 6, label: '' }], label: 'Classic Burger', image: pub('burger').image, difficulty: Number(params.get('d')) || 1, brand: brand(1), parts: ['Bun', 'Patty', 'Lettuce', 'Cheese'] });
            } else {
                send('cook', 'menu', cookMenu());
            }
        }
    });
})();
