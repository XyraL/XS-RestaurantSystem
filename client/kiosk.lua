Kiosk = { open = nil }

function Kiosk.Open(b, point)
    if not Config.Kiosk.enabled then return Util.Notify(Text('err_kiosk_off'), 'error') end
    local menu = {}
    for _, m in ipairs(b.menu or {}) do
        if m.available then menu[#menu + 1] = m end
    end
    if #menu == 0 then return Util.Notify(Text('err_no_menu'), 'error') end
    Kiosk.open = { biz = b.id, point = point.id }
    UI.Send('kiosk', 'open', {
        brand = Rest.Brand(b), categories = b.categories or {}, menu = menu, open = Rest.IsOpen(b),
        soldout = (GlobalState['xsr:soldout'] or {})[tostring(b.id)] or {}, card = Config.Orders.card, cash = Config.Orders.cash,
    })
    UI.Focus('kiosk', true)
    Rest.WatchRange(point, 4.0, function() return Kiosk.open ~= nil and Kiosk.open.point == point.id end, Kiosk.Close)
end

function Kiosk.Close()
    if not Kiosk.open then return end
    Kiosk.open = nil
    UI.Send('kiosk', 'close', {})
    UI.Focus('kiosk', false)
end

UI.OnClose('kiosk', Kiosk.Close)

UI.Handle('kiosk:order', function(p)
    local o = Kiosk.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    local ok, res = Rest.Call('kiosk', { biz = o.biz, kiosk = o.point, lines = p.lines, name = p.name, method = p.method })
    if ok and res and res.number then
        Util.Notify(Text('kiosk_done', { number = res.number, business = res.business or '' }), 'success')
    end
    return ok, res
end)

AddStateBagChangeHandler(nil, 'global', function(_, key, value)
    local o = Kiosk.open
    if not o or type(key) ~= 'string' then return end
    if key == 'xsr:soldout' then
        UI.Send('kiosk', 'soldout', { map = type(value) == 'table' and value[tostring(o.biz)] or {} })
    elseif key == 'xsr:open' then
        UI.Send('kiosk', 'state', { open = type(value) == 'table' and value[tostring(o.biz)] == true })
    end
end)
