(() => {
    const root = document.getElementById('xsr-phonefull');
    let open = false;

    function close() {
        open = false;
        XS.show('xsr-phonefull', false);
        root.innerHTML = '';
    }

    window.addEventListener('message', (event) => {
        if (!open || event.data !== 'xsr-phone:escape') return;
        const frame = root.querySelector('iframe');
        if (frame && event.source === frame.contentWindow) XS.close('phonefull');
    });

    XS.apps.phonefull = {
        isOpen: () => open,
        escape() { XS.close('phonefull'); },
        on(action, data) {
            if (action === 'open') {
                open = true;
                const local = typeof GetParentResourceName !== 'function';
                const url = local ? 'phone/index.html?full=1&mock=1' : String(data.url || 'phone/index.html?full=1');
                root.innerHTML = `<div class="rs-phonedev"><iframe title="Food Order" src="${XS.esc(url)}&t=${Date.now()}"></iframe></div>`;
                XS.show('xsr-phonefull', true);
                const frame = root.querySelector('iframe');
                frame.addEventListener('load', () => { try { frame.contentWindow.focus(); } catch (e) { frame.focus(); } });
            } else if (action === 'close') {
                close();
            }
        },
    };
})();
