(() => {
    const root = document.getElementById('xsr-cook');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);
    const STATION_ICON = { grill: 'flame', fryer: 'fryer', oven: 'oven', pizza: 'pizza', prep: 'knife', coffee: 'coffee', drinks: 'cup', beer: 'beer', bar: 'cocktail' };
    const GAME_TITLE = { timer: 'Wait for it', timing: 'Hit the zone', pour: 'Pour to the line', keys: 'Key combo', stir: 'Stir', stack: 'Build in order', heat: 'Keep the heat' };
    const GAME_HELP = { timer: 'Hold on while it cooks.', timing: 'Press Space when the marker is in the zone.', pour: 'Hold Space, let go on the line.', keys: 'Press the keys in order.', stir: 'Move your mouse in circles.', stack: 'Click the parts in the order shown.', heat: 'Tap Space to keep the needle in the zone.' };
    const PARTS = ['Base', 'Sauce', 'Filling', 'Cheese', 'Topping', 'Garnish'];

    const S = { open: false, view: 'menu', brand: {}, station: {}, recipes: [], counts: {}, maxBatch: 5, needIngredients: true, amount: {}, busy: false, result: null, test: false, session: null };
    let game = null;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rand = (a, b) => a + Math.random() * (b - a);

    function have(r) {
        if (!S.needIngredients) return true;
        const n = S.amount[r.id] || 1;
        return XS.list(r.ingredients).every((g) => (S.counts[g.item] || 0) >= g.count * n);
    }

    function menuView() {
        const st = S.station || {};
        return `<header class="rs-head"><span class="rs-logo">${I(STATION_ICON[st.type] || 'flame', 20)}</span><div class="rs-headname"><b>${esc(st.label || '')}</b><small>${esc(S.brand.label || '')}</small></div><span class="rs-sp"></span><button class="rs-x" data-act="close">${I('close', 16)}</button></header>
${S.result ? `<div class="rs-cookresult ${S.result.ok ? 'ok' : 'err'}">${I(S.result.ok ? 'check' : 'alert', 18)}<span>${esc(S.result.text)}</span></div>` : ''}
<div class="rs-recipes xsp-scroll">${S.recipes.map((r) => {
            const n = S.amount[r.id] || 1;
            const ok = have(r);
            return `<div class="rs-recipe ${ok ? '' : 'short'}"><span class="rs-recimg">${r.image ? `<img src="${esc(r.image)}" alt="" onerror="this.remove()">` : I('food', 24)}</span>
  <div class="rs-recinfo"><b>${esc(r.label)}${r.amount > 1 ? ` <em>×${r.amount}</em>` : ''}</b>
    <div class="rs-ings">${XS.list(r.ingredients).map((g) => { const need = g.count * n; const got = S.counts[g.item] || 0; return `<span class="${!S.needIngredients || got >= need ? 'ok' : 'miss'}">${g.image ? `<img src="${esc(g.image)}" alt="" onerror="this.remove()">` : ''}${need}x ${esc(g.label)}${S.needIngredients ? ` <i>${got}</i>` : ''}</span>`; }).join('') || `<span class="ok">${esc(t('cook_no_ings', null, 'No ingredients'))}</span>`}</div>
    <small>${esc(XS.list(r.steps).length === 1 ? t('cook_one_step', null, '1 step') : t('cook_steps', { n: XS.list(r.steps).length }, `${XS.list(r.steps).length} steps`))}</small></div>
  <div class="rs-recact">${S.maxBatch > 1 ? `<div class="rs-qty"><button data-act="less" data-id="${esc(r.id)}">${I('minus', 13)}</button><span>${n}</span><button data-act="more" data-id="${esc(r.id)}">${I('plus', 13)}</button></div>` : ''}<button class="rs-btn primary" data-act="make" data-id="${esc(r.id)}" ${ok && !S.busy ? '' : 'disabled'}>${I('flame', 14)}${esc(t('cook_make', null, 'Make'))}</button></div></div>`;
        }).join('')}</div>`;
    }

    function playView() {
        const g = game;
        if (!g) return '';
        const steps = g.steps.map((s, i) => `<i class="${i < g.index ? 'done' : (i === g.index ? 'on' : '')}"></i>`).join('');
        return `<div class="rs-play">
  <div class="rs-playhead"><span class="rs-recimg sm">${g.image ? `<img src="${esc(g.image)}" alt="" onerror="this.remove()">` : I('food', 18)}</span><div><b>${esc(g.label || '')}</b><small>${esc(t('cook_step_n', { n: g.index + 1, total: g.steps.length }, `Step ${g.index + 1} of ${g.steps.length}`))}</small></div><span class="rs-sp"></span><div class="rs-dots">${steps}</div></div>
  <div class="rs-gametitle"><b id="rs-gtitle"></b><span id="rs-ghelp"></span></div>
  <div class="rs-game" id="rs-game"></div>
  <div class="rs-playfoot"><span class="xp-kbd">Esc</span>${esc(t('cook_stop', null, 'stop'))}</div>
</div>`;
    }

    function render() {
        if (!S.open) { root.innerHTML = ''; return; }
        root.innerHTML = `<div class="xsp-stage"><div class="rs-cook ${XS.enter(root)} ${S.view === 'play' ? 'playing' : ''}" id="rs-cookbox">${S.view === 'play' ? playView() : menuView()}</div></div>`;
        XS.brand(root.querySelector('#rs-cookbox'), (S.brand || {}).colors, (S.brand || {}).theme);
    }

    function setTitle(step) {
        const title = root.querySelector('#rs-gtitle');
        const help = root.querySelector('#rs-ghelp');
        if (title) title.textContent = step.label || t(`cook_game_${step.game}`, null, GAME_TITLE[step.game] || step.game);
        if (help) help.textContent = t(`cook_help_${step.game}`, null, GAME_HELP[step.game] || '');
    }

    function loop(fn) {
        let last = performance.now();
        let stopped = false;
        const frame = (now) => {
            if (stopped) return;
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            if (fn(dt) === false) return;
            requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
        return () => { stopped = true; };
    }

    function keyWatch(onDown, onUp) {
        const down = (e) => { if (onDown && onDown(e) === true) e.preventDefault(); };
        const up = (e) => { if (onUp && onUp(e) === true) e.preventDefault(); };
        window.addEventListener('keydown', down, true);
        window.addEventListener('keyup', up, true);
        return () => { window.removeEventListener('keydown', down, true); window.removeEventListener('keyup', up, true); };
    }

    const GAMES = {
        timer(el, step, diff, done) {
            el.innerHTML = `<div class="rs-g-timer"><div class="rs-bar"><i id="rs-fill"></i></div><b id="rs-left"></b></div>`;
            const fill = el.querySelector('#rs-fill');
            const leftEl = el.querySelector('#rs-left');
            const total = step.seconds;
            let elapsed = 0;
            return loop((dt) => {
                elapsed += dt;
                fill.style.width = `${clamp(elapsed / total, 0, 1) * 100}%`;
                leftEl.textContent = `${Math.max(0, Math.ceil(total - elapsed))}s`;
                if (elapsed >= total) { done(true); return false; }
                return true;
            });
        },
        timing(el, step, diff, done) {
            const need = clamp(Math.round(2 + diff), 2, 5);
            const lives = Math.max(1, 3 - Math.round(diff));
            el.innerHTML = `<div class="rs-g-timing"><div class="rs-track"><i class="rs-zone" id="rs-zone"></i><i class="rs-marker" id="rs-marker"></i></div><div class="rs-gstats"><span>${esc(t('cook_hits', null, 'Hits'))} <b id="rs-hits">0/${need}</b></span><span>${esc(t('cook_misses', null, 'Misses left'))} <b id="rs-lives">${lives}</b></span></div><button class="rs-btn primary" data-game="hit">${esc(t('cook_press', null, 'Space'))}</button><div class="rs-bar thin"><i id="rs-fill"></i></div></div>`;
            const fill = el.querySelector('#rs-fill');
            const limit = Math.max(6, step.seconds * 2);
            let elapsed = 0;
            const zone = el.querySelector('#rs-zone');
            const marker = el.querySelector('#rs-marker');
            const width = clamp(0.24 / diff, 0.08, 0.34);
            let start = rand(0.1, 0.9 - width);
            let pos = 0;
            let dir = 1;
            let hits = 0;
            let misses = lives;
            const speed = 0.55 + 0.35 * diff;
            const place = () => { zone.style.left = `${start * 100}%`; zone.style.width = `${width * 100}%`; };
            place();
            const press = () => {
                const inZone = pos >= start && pos <= start + width;
                if (inZone) {
                    hits += 1;
                    el.querySelector('#rs-hits').textContent = `${hits}/${need}`;
                    zone.classList.add('hit');
                    setTimeout(() => zone.classList.remove('hit'), 160);
                    if (hits >= need) { finish(true); return; }
                    start = rand(0.08, 0.92 - width);
                    place();
                } else {
                    misses -= 1;
                    el.querySelector('#rs-lives').textContent = String(Math.max(0, misses));
                    marker.classList.add('miss');
                    setTimeout(() => marker.classList.remove('miss'), 160);
                    if (misses <= 0) finish(false);
                }
            };
            let stopKeys = null;
            let stopLoop = null;
            let over = false;
            const finish = (ok) => { if (over) return; over = true; if (stopKeys) stopKeys(); if (stopLoop) stopLoop(); done(ok); };
            stopKeys = keyWatch((e) => { if (e.code === 'Space' && !e.repeat) { press(); return true; } return false; });
            el.querySelector('[data-game="hit"]').addEventListener('click', press);
            stopLoop = loop((dt) => {
                elapsed += dt;
                fill.style.width = `${clamp(1 - elapsed / limit, 0, 1) * 100}%`;
                if (elapsed >= limit) { finish(false); return false; }
                pos += dir * speed * dt;
                if (pos >= 1) { pos = 1; dir = -1; }
                if (pos <= 0) { pos = 0; dir = 1; }
                marker.style.left = `${pos * 100}%`;
                return !over;
            });
            return () => finish(false);
        },
        pour(el, step, diff, done) {
            const band = clamp(0.16 / diff, 0.06, 0.24);
            const target = rand(0.55, 0.88 - band);
            el.innerHTML = `<div class="rs-g-pour"><div class="rs-glass"><i class="rs-band" style="bottom:${target * 100}%;height:${band * 100}%"></i><i class="rs-liquid" id="rs-liquid"></i></div><div class="rs-hint">${esc(t('cook_pour_hint', null, 'Hold Space or the button. Let go inside the band.'))}</div><button class="rs-btn primary" data-game="hold">${esc(t('cook_hold', null, 'Hold'))}</button></div>`;
            const liquid = el.querySelector('#rs-liquid');
            let level = 0;
            let holding = false;
            let started = false;
            let over = false;
            const rate = 0.32 + 0.12 * diff;
            const release = () => {
                if (!holding || over) return;
                holding = false;
                over = true;
                cleanup();
                done(level >= target && level <= target + band);
            };
            const press = () => { if (!over) { holding = true; started = true; } };
            const btn = el.querySelector('[data-game="hold"]');
            btn.addEventListener('mousedown', press);
            btn.addEventListener('mouseup', release);
            btn.addEventListener('mouseleave', release);
            const stopKeys = keyWatch((e) => { if (e.code === 'Space') { if (!e.repeat) press(); return true; } return false; }, (e) => { if (e.code === 'Space') { release(); return true; } return false; });
            const stopLoop = loop((dt) => {
                if (holding) level += rate * dt * (1 + level * 0.6);
                liquid.style.height = `${clamp(level, 0, 1) * 100}%`;
                if (level > 1.02) { over = true; cleanup(); done(false); return false; }
                return !over;
            });
            function cleanup() { stopKeys(); stopLoop(); }
            return () => { if (!over) { over = true; cleanup(); done(false); } return started; };
        },
        keys(el, step, diff, done) {
            const pool = ['W', 'A', 'S', 'D'];
            const len = clamp(Math.round(3 + diff * 2), 3, 8);
            const seq = Array.from({ length: len }, () => pool[Math.floor(Math.random() * pool.length)]);
            const limit = Math.max(4, step.seconds * 1.6);
            let pos = 0;
            let strikes = 0;
            let elapsed = 0;
            let over = false;
            el.innerHTML = `<div class="rs-g-keys"><div class="rs-keyrow" id="rs-keyrow">${seq.map((k, i) => `<span class="rs-key" data-i="${i}">${k}</span>`).join('')}</div><div class="rs-bar thin"><i id="rs-fill"></i></div></div>`;
            const keysEl = [...el.querySelectorAll('.rs-key')];
            const fill = el.querySelector('#rs-fill');
            const paint = () => keysEl.forEach((k, i) => { k.classList.toggle('done', i < pos); k.classList.toggle('on', i === pos); });
            paint();
            const finish = (ok) => { if (over) return; over = true; stopKeys(); stopLoop(); done(ok); };
            const stopKeys = keyWatch((e) => {
                const k = (e.key || '').toUpperCase();
                if (!pool.includes(k) || e.repeat) return false;
                if (k === seq[pos]) {
                    pos += 1;
                    paint();
                    if (pos >= seq.length) finish(true);
                } else {
                    strikes += 1;
                    const cur = keysEl[pos];
                    if (cur) { cur.classList.add('bad'); setTimeout(() => cur.classList.remove('bad'), 200); }
                    if (strikes >= (diff >= 1.3 ? 1 : 2)) finish(false);
                }
                return true;
            });
            const stopLoop = loop((dt) => {
                elapsed += dt;
                fill.style.width = `${clamp(1 - elapsed / limit, 0, 1) * 100}%`;
                if (elapsed >= limit) { finish(false); return false; }
                return !over;
            });
            return () => finish(false);
        },
        stir(el, step, diff, done) {
            const need = clamp(Math.round(2 + diff * 2), 2, 7);
            const limit = Math.max(5, step.seconds * 1.8);
            el.innerHTML = `<div class="rs-g-stir"><div class="rs-pot" id="rs-pot"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="track"/><circle cx="60" cy="60" r="52" class="fill" id="rs-ring" stroke-dasharray="326.7" stroke-dashoffset="326.7"/></svg><i class="rs-spoon" id="rs-spoon"></i><b id="rs-turns">0/${need}</b></div><div class="rs-bar thin"><i id="rs-fill"></i></div></div>`;
            const pot = el.querySelector('#rs-pot');
            const ring = el.querySelector('#rs-ring');
            const spoon = el.querySelector('#rs-spoon');
            const turnsEl = el.querySelector('#rs-turns');
            const fill = el.querySelector('#rs-fill');
            let lastAngle = null;
            let total = 0;
            let elapsed = 0;
            let over = false;
            const onMove = (e) => {
                const r = pot.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const a = Math.atan2(e.clientY - cy, e.clientX - cx);
                spoon.style.transform = `rotate(${a}rad) translateX(${r.width * 0.3}px)`;
                if (lastAngle !== null) {
                    let d = a - lastAngle;
                    if (d > Math.PI) d -= Math.PI * 2;
                    if (d < -Math.PI) d += Math.PI * 2;
                    total += Math.abs(d) < 0.9 ? Math.abs(d) : 0;
                }
                lastAngle = a;
                const turns = total / (Math.PI * 2);
                turnsEl.textContent = `${Math.min(need, Math.floor(turns))}/${need}`;
                ring.setAttribute('stroke-dashoffset', String(326.7 * (1 - clamp(turns / need, 0, 1))));
                if (turns >= need) finish(true);
            };
            const finish = (ok) => { if (over) return; over = true; window.removeEventListener('mousemove', onMove); stopLoop(); done(ok); };
            window.addEventListener('mousemove', onMove);
            const stopLoop = loop((dt) => {
                elapsed += dt;
                fill.style.width = `${clamp(1 - elapsed / limit, 0, 1) * 100}%`;
                if (elapsed >= limit) { finish(false); return false; }
                return !over;
            });
            return () => finish(false);
        },
        stack(el, step, diff, done, ctx) {
            let parts = XS.list(ctx.parts).filter(Boolean).slice(0, 6);
            if (parts.length < 3) parts = parts.concat(PARTS.filter((p) => !parts.includes(p))).slice(0, clamp(Math.round(3 + diff), 3, 6));
            const order = parts.slice().sort(() => Math.random() - 0.5);
            const buttons = parts.slice().sort(() => Math.random() - 0.5);
            const lives = diff < 0.9 ? 2 : 1;
            const limit = Math.max(5, step.seconds * 2);
            let pos = 0;
            let strikes = 0;
            let elapsed = 0;
            let over = false;
            el.innerHTML = `<div class="rs-g-stack"><div class="rs-order">${order.map((p, i) => `<span data-i="${i}"><em>${i + 1}</em>${esc(p)}</span>`).join('')}</div><div class="rs-parts">${buttons.map((p) => `<button class="rs-part" data-part="${esc(p)}">${esc(p)}</button>`).join('')}</div><div class="rs-bar thin"><i id="rs-fill"></i></div></div>`;
            const slots = [...el.querySelectorAll('.rs-order span')];
            const fill = el.querySelector('#rs-fill');
            const paint = () => slots.forEach((s, i) => { s.classList.toggle('done', i < pos); s.classList.toggle('on', i === pos); });
            paint();
            const finish = (ok) => { if (over) return; over = true; stopLoop(); done(ok); };
            el.querySelectorAll('.rs-part').forEach((b) => b.addEventListener('click', () => {
                if (over) return;
                if (b.dataset.part === order[pos]) {
                    b.classList.add('used');
                    b.disabled = true;
                    pos += 1;
                    paint();
                    if (pos >= order.length) finish(true);
                } else {
                    strikes += 1;
                    b.classList.add('bad');
                    setTimeout(() => b.classList.remove('bad'), 220);
                    if (strikes >= lives) finish(false);
                }
            }));
            const stopLoop = loop((dt) => {
                elapsed += dt;
                fill.style.width = `${clamp(1 - elapsed / limit, 0, 1) * 100}%`;
                if (elapsed >= limit) { finish(false); return false; }
                return !over;
            });
            return () => finish(false);
        },
        heat(el, step, diff, done) {
            const zoneW = clamp(0.26 / diff, 0.1, 0.34);
            const zoneAt = rand(0.45, 0.8 - zoneW);
            const goal = step.seconds;
            const limit = goal * 2.2 + 2;
            el.innerHTML = `<div class="rs-g-heat"><div class="rs-gauge"><i class="rs-hzone" style="bottom:${zoneAt * 100}%;height:${zoneW * 100}%"></i><i class="rs-needle" id="rs-needle"></i></div><div class="rs-heatside"><div class="rs-bar"><i id="rs-prog"></i></div><span class="rs-hint">${esc(t('cook_heat_hint', null, 'Keep it in the zone until the bar is full.'))}</span><div class="rs-bar thin"><i id="rs-fill"></i></div><button class="rs-btn primary" data-game="tap">${esc(t('cook_tap', null, 'Tap'))}</button></div></div>`;
            const needle = el.querySelector('#rs-needle');
            const prog = el.querySelector('#rs-prog');
            const fill = el.querySelector('#rs-fill');
            let v = zoneAt + zoneW / 2;
            let vel = 0;
            let held = 0;
            let elapsed = 0;
            let over = false;
            const tap = () => { if (!over) vel += 0.15 + 0.02 * diff; };
            el.querySelector('[data-game="tap"]').addEventListener('click', tap);
            const finish = (ok) => { if (over) return; over = true; stopKeys(); stopLoop(); done(ok); };
            const stopKeys = keyWatch((e) => { if (e.code === 'Space' && !e.repeat) { tap(); return true; } return false; });
            const stopLoop = loop((dt) => {
                elapsed += dt;
                vel -= (0.4 + 0.2 * diff) * dt;
                vel *= 0.96;
                v = clamp(v + vel * dt, 0, 1);
                if (v <= 0 || v >= 1) vel = 0;
                needle.style.bottom = `${v * 100}%`;
                const inside = v >= zoneAt && v <= zoneAt + zoneW;
                needle.classList.toggle('in', inside);
                if (inside) held += dt;
                prog.style.width = `${clamp(held / goal, 0, 1) * 100}%`;
                fill.style.width = `${clamp(1 - elapsed / limit, 0, 1) * 100}%`;
                if (held >= goal) { finish(true); return false; }
                if (elapsed >= limit) { finish(false); return false; }
                return !over;
            });
            return () => finish(false);
        },
    };

    function runStep(g, step, diff, ctx) {
        return new Promise((resolve) => {
            const el = root.querySelector('#rs-game');
            if (!el) return resolve(false);
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            setTitle(step);
            const play = GAMES[step.game] || GAMES.timer;
            let settled = false;
            const done = (ok) => { if (settled) return; settled = true; g.abort = null; setTimeout(() => resolve(ok), 280); };
            g.abort = play(el, step, clamp(Number(diff) || 1, 0.5, 2.5), done, ctx || {});
        });
    }

    async function play(info) {
        const g = { steps: XS.list(info.steps), index: 0, label: info.label, image: info.image, abort: null, cancelled: false };
        game = g;
        S.view = 'play';
        render();
        let passed = true;
        for (let i = 0; i < g.steps.length; i++) {
            if (g.cancelled || game !== g) return null;
            g.index = i;
            render();
            const ok = await runStep(g, g.steps[i], info.difficulty, info);
            if (g.cancelled || game !== g) return null;
            if (!ok) { passed = false; break; }
        }
        if (game === g) game = null;
        return passed;
    }

    function abortGame() {
        if (!game) return;
        game.cancelled = true;
        const abort = game.abort;
        game.abort = null;
        if (typeof abort === 'function') abort();
        game = null;
    }

    async function make(id) {
        const r = S.recipes.find((x) => x.id === id);
        if (!r || S.busy) return;
        S.busy = true;
        S.result = null;
        const res = await XS.rpc('cook:start', { recipe: id, amount: S.amount[id] || 1 });
        if (!res.ok) {
            S.busy = false;
            S.result = { ok: false, text: res.error };
            render();
            return;
        }
        const info = res.data;
        S.session = info.token;
        const parts = XS.list(r.ingredients).map((g) => g.label);
        const passed = await play(Object.assign({}, info, { parts, label: r.label, image: r.image }));
        if (passed === null) { S.busy = false; return; }
        const done = await XS.rpc('cook:done', { token: info.token, passed });
        S.busy = false;
        S.session = null;
        S.view = 'menu';
        if (!done.ok) S.result = { ok: false, text: done.error };
        else {
            const out = done.data.result || {};
            S.counts = Object.assign(S.counts, done.data.counts || {});
            S.result = out.passed ? { ok: true, text: t('cook_result_ok', { n: out.makes, item: out.label }, `Made ${out.makes}x ${out.label}.`) } : { ok: false, text: out.lost ? t('cook_result_lost', null, 'That did not turn out. The ingredients are gone.') : t('cook_result_fail', null, 'That did not turn out. Try again.') };
        }
        if (S.open) render();
    }

    root.addEventListener('click', (e) => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        const act = el.dataset.act;
        const id = el.dataset.id;
        if (act === 'close') return XS.apps.cook.escape();
        if (act === 'more') { S.amount[id] = Math.min(S.maxBatch, (S.amount[id] || 1) + 1); render(); return; }
        if (act === 'less') { S.amount[id] = Math.max(1, (S.amount[id] || 1) - 1); render(); return; }
        if (act === 'make') make(id);
    });

    XS.apps.cook = {
        isOpen: () => S.open,
        escape() {
            if (S.test) {
                abortGame();
                S.open = false;
                S.test = false;
                XS.show('xsr-cook', false);
                root.innerHTML = '';
                return;
            }
            if (S.view === 'play') {
                abortGame();
                XS.rpc('cook:cancel');
                S.busy = false;
                S.view = 'menu';
                S.result = { ok: false, text: t('cook_stopped', null, 'Stopped. Nothing was used up.') };
                render();
                return;
            }
            XS.close('cook');
        },
        async test(info) {
            S.open = true;
            S.test = true;
            S.brand = info.brand || {};
            XS.show('xsr-cook', true);
            const parts = XS.list(info.parts);
            const passed = await play(Object.assign({}, info, { parts }));
            S.open = false;
            S.test = false;
            XS.show('xsr-cook', false);
            root.innerHTML = '';
            if (passed !== null) XS.toast(passed ? t('cook_test_ok', null, 'Passed. That is how staff will play it.') : t('cook_test_fail', null, 'Failed. Staff would have to try again.'), passed ? 'ok' : 'error');
        },
        on(action, data) {
            if (action === 'menu') {
                S.open = true;
                S.test = false;
                S.view = 'menu';
                S.brand = data.brand || {};
                S.station = data.station || {};
                S.recipes = XS.list(data.recipes);
                S.counts = data.counts && !Array.isArray(data.counts) ? data.counts : {};
                S.maxBatch = Number(data.maxBatch) || 1;
                S.needIngredients = data.needIngredients !== false;
                S.amount = {};
                S.busy = false;
                S.result = null;
                XS.show('xsr-cook', true);
                render();
            } else if (action === 'close') {
                abortGame();
                S.open = false;
                S.busy = false;
                XS.show('xsr-cook', false);
                root.innerHTML = '';
            }
        },
    };
})();
