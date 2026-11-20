(() => {
    if (typeof GetParentResourceName === 'function') return;
    if ((location.hostname || '').startsWith('cfx-nui-')) return;
    if (location.protocol === 'https:' && !new URLSearchParams(location.search).get('mock')) return;

    const params = new URLSearchParams(location.search);
    const now = () => Math.floor(Date.now() / 1000);
    const dot = (c) => `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="40%" cy="35%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient></defs><ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".25"/><circle cx="32" cy="30" r="22" fill="${c}"/><circle cx="32" cy="30" r="22" fill="url(#g)"/></svg>`)}`;
    const LIST = [
        {
            id: 1, label: 'Mirror Park Burgers', style: 'burger', colors: { accent: '#ff7a1a', accent2: '#ffd23f' }, logo: '', open: params.get('closed') !== '1', distance: 420, delivery: true, fee: 15, at: { x: 1185, y: -323 },
            categories: [{ id: 'c1', label: 'Burgers' }, { id: 'c2', label: 'Sides' }, { id: 'c3', label: 'Drinks' }, { id: 'c4', label: 'Desserts' }],
            menu: [
                { id: 'm1', label: 'Classic Burger', price: 14, category: 'c1', image: dot('#c8742e') }, { id: 'm6', label: 'Double Stack', price: 19, category: 'c1', image: dot('#8a4a22') },
                { id: 'm2', label: 'Fries', price: 6, category: 'c2', image: dot('#e8b53a') }, { id: 'm3', label: 'Cola', price: 4, category: 'c3', image: dot('#7a2d1e') },
                { id: 'm4', label: 'Strawberry Shake', price: 7, category: 'c4', image: dot('#f4b6c8'), soldout: params.get('sold') === '1' },
            ],
        },
        {
            id: 2, label: 'Vespucci Coffee', style: 'cafe', colors: { accent: '#c8874b', accent2: '#f3e1c7' }, logo: '', open: true, distance: 1840, delivery: false, fee: 15, at: { x: -1270, y: -1430 },
            categories: [{ id: 'c1', label: 'Coffee' }, { id: 'c2', label: 'Bakery' }],
            menu: [{ id: 'm1', label: 'Latte', price: 5, category: 'c1', image: dot('#c8a27c') }, { id: 'm2', label: 'Croissant', price: 4, category: 'c2', image: dot('#d99a4e') }],
        },
        {
            id: 3, label: 'Pillbox Pizza Co.', style: 'pizza', colors: { accent: '#e63946', accent2: '#f4a261' }, logo: '', open: false, distance: 2650, delivery: false, fee: 0, at: { x: 290, y: -960 },
            categories: [{ id: 'c1', label: 'Pizza' }], menu: [{ id: 'm1', label: 'Pepperoni slice', price: 6, category: 'c1', image: dot('#d4553a') }],
        },
    ];
    const MINE = params.get('orders') === '0' ? [] : [
        { id: 101, biz: 1, business: 'Mirror Park Burgers', colors: LIST[0].colors, number: 17, status: 'cooking', via: 'delivery', total: 47, onWay: false, at: now() - 120 },
        { id: 98, biz: 2, business: 'Vespucci Coffee', colors: LIST[1].colors, number: 4, status: 'ready', via: 'phone', total: 9, onWay: false, at: now() - 400 },
    ];
    let NUM = 18;
    const reply = (data) => ({ ok: true, data });
    window.XSR_PHONE_POST = async (name, data) => {
        await new Promise((r) => setTimeout(r, 30));
        if (name !== 'phoneCall') return { ok: true };
        const arg = (data.args || [])[0] || {};
        if (data.name === 'phoneList') return reply({ list: LIST, mine: MINE, bank: 2480 });
        if (data.name === 'phoneMine') return reply(MINE);
        if (data.name === 'phoneOrder') {
            const b = LIST.find((x) => x.id === arg.biz);
            if (!b.open) return { ok: false, error: 'Nobody is working here right now.' };
            let total = (arg.lines || []).reduce((a, l) => a + (b.menu.find((m) => m.id === l.id) || { price: 0 }).price * l.qty, 0);
            if (arg.mode === 'delivery') total += b.fee;
            const o = { id: 200 + NUM, biz: b.id, business: b.label, colors: b.colors, number: NUM, status: 'new', via: arg.mode === 'delivery' ? 'delivery' : 'phone', total, onWay: false, at: now() };
            NUM += 1;
            MINE.unshift(o);
            return reply({ number: o.number, total, mode: o.via, business: b.label });
        }
        return reply(null);
    };
})();
