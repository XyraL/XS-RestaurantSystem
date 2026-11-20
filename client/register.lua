Register = { open = nil }

function Register.Open(b, point)
    if not Rest.IsStaff(b) then return Util.Notify(Text('err_not_staff'), 'error') end
    if Register.open then Register.Close() end
    local menu = {}
    for _, m in ipairs(b.menu or {}) do
        if m.available then menu[#menu + 1] = m end
    end
    if #menu == 0 then return Util.Notify(Text('err_no_menu'), 'error') end
    Register.open = { biz = b.id, point = point.id, drive = point.drive == true and Config.Drive.enabled }
    UI.Send('pos', 'open', {
        brand = Rest.Brand(b), categories = b.categories or {}, menu = menu, boss = Rest.IsBoss(b),
        register = point.label ~= '' and point.label or nil, drive = Register.open.drive,
        soldout = (GlobalState['xsr:soldout'] or {})[tostring(b.id)] or {}, waiting = Register.open.drive and (GlobalState['xsr:drive:' .. tostring(b.id)] or {}) or {},
    })
    UI.Focus('pos', true)
    Rest.WatchRange(point, 6.0, function() return Register.open ~= nil and Register.open.point == point.id end, Register.Close)
end

function Register.Close()
    if not Register.open then return end
    if Register.open.drive then Rest.Call('driveHangup') end
    Register.open = nil
    UI.Send('pos', 'close', {})
    UI.Focus('pos', false)
end

UI.OnClose('pos', Register.Close)

UI.Handle('pos:nearby', function()
    local o = Register.open
    if not o then return false end
    return Rest.Call('nearby', o.biz, 'register', o.point)
end)

UI.Handle('pos:ring', function(p)
    local o = Register.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('ring', { biz = o.biz, register = o.point, lines = p.lines, customer = p.customer, name = p.name, free = p.free == true })
end)

UI.Handle('pos:soldout', function(p)
    local o = Register.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('soldOut', o.biz, p.id, p.on == true)
end)

UI.Handle('pos:answer', function(p)
    local o = Register.open
    if not o or not o.drive then return false end
    return Rest.Call('driveAnswer', o.biz, o.point, type(p) == 'table' and p.src or nil)
end)

UI.Handle('pos:hangup', function()
    return Rest.Call('driveHangup')
end)

AddStateBagChangeHandler(nil, 'global', function(_, key, value)
    local o = Register.open
    if not o or type(key) ~= 'string' then return end
    if key == 'xsr:soldout' then
        UI.Send('pos', 'soldout', { map = type(value) == 'table' and value[tostring(o.biz)] or {} })
    elseif o.drive and key == 'xsr:drive:' .. tostring(o.biz) then
        UI.Send('pos', 'waiting', { list = type(value) == 'table' and value or {} })
    end
end)

UI.Handle('pos:cancel', function(p)
    return Rest.Call('cancelRing', type(p) == 'table' and p.id or nil)
end)

RegisterNetEvent('XS-RestaurantSystem:client:ringResult', function(r)
    if type(r) ~= 'table' then return end
    if Register.open then
        UI.Send('pos', 'result', r)
        return
    end
    if r.result == 'paid' then
        Util.Notify(Text('ring_paid', { number = r.number }), 'success')
    elseif r.result == 'declined' then
        Util.Notify(Text('ring_declined'), 'error')
    elseif r.result == 'timeout' then
        Util.Notify(Text('ring_timeout'), 'error')
    end
end)
