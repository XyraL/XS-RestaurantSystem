(() => {
    const root = document.getElementById('xsr-pay');
    const t = XS.t;
    const esc = XS.esc;
    const I = (name, size) => XS.icon(name, size || 16);

    const S = { open: false, data: null, until: 0, busy: false, error: null };
    let tick = null;

    function render() {
        if (!S.open || !S.data) { root.innerHTML = ''; return; }
        const d = S.data;
        const left = Math.max(0, (S.until - Date.now()) / 1000);
        const pct = Math.max(0, Math.min(100, (left / (d.timeout || 45)) * 100));
        root.innerHTML = `<div class="xsp-stage"><div class="rs-pay ${XS.enter(root)}" id="rs-paybox">
  <div class="rs-payhead"><span class="rs-logo">${d.logo ? `<img src="${esc(d.logo)}" alt="" onerror="this.remove()">` : I('receipt', 20)}</span><div><b>${esc(d.business || '')}</b><small>${esc(d.name ? t('pay_for', { name: d.name }, `Order for ${d.name}`) : t('pay_title', null, 'Your order'))}</small></div></div>
  <div class="rs-paylines xsp-scroll">${XS.list(d.lines).map((l) => `<div class="rs-payline"><span>${l.qty}x ${esc(l.label)}</span><b>${XS.money(l.price * l.qty)}</b></div>`).join('')}</div>
  <div class="rs-paytotal"><span>${esc(t('pay_total', null, 'Total'))}</span><b>${XS.money(d.total)}</b></div>
  ${S.error ? `<div class="rs-msg err">${esc(S.error)}</div>` : ''}
  <div class="rs-paybtns">${d.card ? `<button class="rs-btn primary big" data-act="card" ${S.busy ? 'disabled' : ''}>${I('id', 17)}${esc(t('pay_card', null, 'Pay by card'))}</button>` : ''}${d.cash ? `<button class="rs-btn ${d.card ? 'second' : 'primary'} big" data-act="cash" ${S.busy ? 'disabled' : ''}>${I('cash', 17)}${esc(t('pay_cash', null, 'Pay cash'))}</button>` : ''}</div>
  <button class="rs-btn ghost wide" data-act="decline" ${S.busy ? 'disabled' : ''}>${esc(t('pay_no', null, 'No thanks'))}</button>
  <div class="rs-paytimer"><i style="width:${pct.toFixed(1)}%"></i></div>
</div></div>`;
        XS.brand(root.querySelector('#rs-paybox'), d.colors, d.theme);
    }

    async function respond(method) {
        if (!S.data || S.busy) return;
        S.busy = true;
        S.error = null;
        render();
        const res = await XS.rpc('pay:respond', { id: S.data.id, method });
        S.busy = false;
        if (!res.ok && S.open) {
            S.error = res.error;
            render();
        }
    }

    root.addEventListener('click', (e) => {
        const el = e.target.closest('[data-act]');
        if (!el) return;
        respond(el.dataset.act);
    });

    XS.apps.pay = {
        isOpen: () => S.open,
        escape() { if (!S.busy) respond('decline'); },
        on(action, data) {
            if (action === 'open') {
                S.open = true;
                S.data = data;
                S.until = Date.now() + (data.timeout || 45) * 1000;
                S.busy = false;
                S.error = null;
                XS.show('xsr-pay', true);
                render();
                clearInterval(tick);
                tick = setInterval(() => { if (S.open) render(); else clearInterval(tick); }, 500);
            } else if (action === 'close') {
                S.open = false;
                S.data = null;
                clearInterval(tick);
                XS.show('xsr-pay', false);
                root.innerHTML = '';
            }
        },
    };
})();
