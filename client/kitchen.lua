Kitchen = { open = nil }

function Kitchen.Open(b, mode, point)
    if not Rest.IsStaff(b) then return Util.Notify(Text('err_not_staff'), 'error') end
    local ok, data = Rest.Call('orders', b.id)
    if not ok then return Util.Notify(data, 'error') end
    Rest.Snapshot(data)
    Kitchen.open = { biz = b.id, mode = mode, point = point.id }
    UI.Send('kitchen', 'open', {
        mode = mode, brand = Rest.Brand(b), now = Rest.Now(), list = data.list or {}, boss = Rest.IsBoss(b),
        late = (Config.Orders.lateMinutes or 8) * 60, handOver = Config.Orders.handOver,
    })
    UI.Focus('kitchen', true)
    Rest.WatchRange(point, mode == 'kitchen' and 8.0 or 6.0, function() return Kitchen.open ~= nil and Kitchen.open.point == point.id end, Kitchen.Close)
end

function Kitchen.Close()
    if not Kitchen.open then return end
    Kitchen.open = nil
    UI.Send('kitchen', 'close', {})
    UI.Focus('kitchen', false)
end

UI.OnClose('kitchen', Kitchen.Close)

AddStateBagChangeHandler(nil, 'global', function(_, key, value)
    if not Kitchen.open or type(key) ~= 'string' then return end
    if key ~= 'xsr:orders:' .. tostring(Kitchen.open.biz) then return end
    Rest.Snapshot(value)
    UI.Send('kitchen', 'orders', { now = Rest.Now(), list = type(value) == 'table' and value.list or {} })
end)

UI.Handle('k:status', function(p)
    p = type(p) == 'table' and p or {}
    local ok, res = Rest.Call('orderStatus', p.id, p.status)
    if ok and type(res) == 'table' and res.refund then
        local key = ({ done = 'refund_done', away = 'refund_away', funds = 'refund_funds' })[res.refund]
        if key then Util.Notify(Text(key), res.refund == 'done' and 'success' or 'error') end
    end
    return ok, res
end)

UI.Handle('k:line', function(p)
    p = type(p) == 'table' and p or {}
    return Rest.Call('orderLine', p.id, p.index)
end)

UI.Handle('k:nearby', function()
    local o = Kitchen.open
    if not o or o.mode ~= 'counter' then return false end
    return Rest.Call('nearby', o.biz, 'counter', o.point)
end)

UI.Handle('k:take', function(p)
    local o = Kitchen.open
    if not o or o.mode ~= 'counter' then return false end
    p = type(p) == 'table' and p or {}
    local ok, res = Rest.Call('deliveryTake', p.id)
    if not ok then return false, res end
    Kitchen.Close()
    DeliveryRun.Start(res)
    return true
end)

UI.Handle('k:hand', function(p)
    local o = Kitchen.open
    if not o or o.mode ~= 'counter' then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('handOver', p.id, p.target, o.point)
end)
