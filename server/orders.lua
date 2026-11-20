Orders = { open = {}, pending = {}, numbers = {}, nextLocal = -1 }

local function publicOrder(o)
    local lines = {}
    for i, l in ipairs(o.lines) do lines[i] = { label = l.label, qty = l.qty, done = l.done == true, item = l.item } end
    return {
        id = o.id, number = o.number, status = o.status, name = Config.Orders.names and o.name or '',
        lines = lines, at = o.at, readyAt = o.readyAt or 0, total = o.total, paidWith = o.paidWith, via = o.via or 'counter',
        street = o.extra and o.extra.street or nil, taken = o.extra and o.extra.driver ~= nil or nil, driver = o.extra and o.extra.driverName or nil,
    }
end

function Orders.Public(bizId)
    local list = {}
    for _, o in pairs(Orders.open) do
        if o.biz == bizId then list[#list + 1] = publicOrder(o) end
    end
    table.sort(list, function(a, b)
        if a.at ~= b.at then return a.at < b.at end
        return a.number < b.number
    end)
    return list
end

function Orders.Publish(bizId)
    GlobalState['xsr:orders:' .. tostring(bizId)] = { now = os.time(), list = Orders.Public(bizId) }
end

local function startOfToday()
    local t = os.date('*t')
    return os.time({ year = t.year, month = t.month, day = t.day, hour = 0, min = 0, sec = 0 })
end

function Orders.Load()
    local rows = MySQL.query.await("SELECT * FROM `xs_rest_orders` WHERE `status` IN ('new', 'cooking', 'ready')") or {}
    for _, r in ipairs(rows) do
        local id, biz = tonumber(r.id), tonumber(r.business_id)
        if id and biz and Biz.Get(biz) then
            Orders.open[id] = {
                id = id, biz = biz, number = tonumber(r.number) or 0, status = r.status,
                customer = r.customer or '', customerName = r.customer_name or '', name = r.name or '',
                lines = Db.Decode(r.lines, {}), total = tonumber(r.total) or 0, paidWith = r.paid_with or '',
                staff = r.staff or '', staffName = r.staff_name or '', at = tonumber(r.created_at) or os.time(),
                readyAt = tonumber(r.ready_at) or 0, via = r.via or 'counter', extra = Db.Decode(r.extra, {}),
            }
        elseif id then
            MySQL.update('UPDATE `xs_rest_orders` SET `status` = ?, `done_at` = ? WHERE `id` = ?', { 'expired', os.time(), id })
        end
    end
    local since = Config.Orders.resetNumbers == 'never' and 0 or startOfToday()
    local counts = MySQL.query.await('SELECT `business_id`, MAX(`number`) AS `n` FROM `xs_rest_orders` WHERE `created_at` >= ? GROUP BY `business_id`', { since }) or {}
    for _, r in ipairs(counts) do
        local biz = tonumber(r.business_id)
        if biz then Orders.numbers[biz] = { day = Util.Today(), n = tonumber(r.n) or 0 } end
    end
    for id in pairs(Biz.list) do Orders.Publish(id) end
end

local function nextNumber(bizId)
    local day = Util.Today()
    local cur = Orders.numbers[bizId]
    if not cur or (Config.Orders.resetNumbers ~= 'never' and cur.day ~= day) then cur = { day = day, n = 0 } end
    cur.n = cur.n % 999 + 1
    cur.day = day
    Orders.numbers[bizId] = cur
    return cur.n
end

local function openCount(bizId)
    local n = 0
    for _, o in pairs(Orders.open) do
        if o.biz == bizId then n = n + 1 end
    end
    return n
end

local function save(o)
    MySQL.update('UPDATE `xs_rest_orders` SET `status` = ?, `lines` = ?, `ready_at` = ?, `done_at` = ?, `extra` = ? WHERE `id` = ?', { o.status, Db.Json(o.lines), o.readyAt or 0, o.doneAt or 0, Db.Json(o.extra or {}), o.id })
end

Orders.Save = save

function Orders.Create(b, info)
    local now = os.time()
    local staffSrc, customerSrc = info.staffSrc, info.customerSrc
    local order = {
        biz = b.id, number = nextNumber(b.id), status = 'new',
        customer = customerSrc and Framework.GetCitizenId(customerSrc) or '',
        customerName = customerSrc and Framework.GetName(customerSrc) or '',
        name = info.name or '', lines = info.lines, total = info.total or 0, paidWith = info.paidWith or '',
        staff = staffSrc and Framework.GetCitizenId(staffSrc) or '', staffName = staffSrc and Framework.GetName(staffSrc) or '',
        at = now, readyAt = 0, via = info.via or 'counter', extra = info.extra or {},
    }
    local id = MySQL.insert.await('INSERT INTO `xs_rest_orders` (`business_id`, `number`, `status`, `customer`, `customer_name`, `name`, `lines`, `total`, `paid_with`, `via`, `extra`, `staff`, `staff_name`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', {
        b.id, order.number, order.status, order.customer, order.customerName, order.name, Db.Json(order.lines), order.total, order.paidWith, order.via, Db.Json(order.extra), order.staff, order.staffName, now,
    })
    order.id = tonumber(id)
    if not order.id then
        order.id = Orders.nextLocal
        Orders.nextLocal = Orders.nextLocal - 1
    end
    Orders.open[order.id] = order
    Orders.Publish(b.id)
    if order.total > 0 then
        Logs.Send(b, 'sales', Text('log_sale', { number = order.number }), { { Text('log_items'), Logs.Lines(order.lines), false }, { Text('log_total'), ('$%d'):format(order.total) }, { Text('log_paid'), order.paidWith }, { Text('log_via'), Text('via_' .. order.via) }, { Text('log_customer'), order.customerName }, { Text('log_by'), order.staffName } })
    end
    return order
end

local function payoutFn(b, total, staffSrc)
    local toBusiness = math.floor(total * (Config.Orders.businessPct or 100) / 100)
    local toCashier = math.floor(total * (Config.Orders.cashierPct or 0) / 100)
    if toBusiness > 0 and not Banking.Deposit(b.data.job, toBusiness, ('%s order'):format(b.data.label)) then
        print(('^3[XS-RestaurantSystem]^0 $%d for %s had no business account to go into (banking: %s).'):format(toBusiness, b.data.label, Banking.name or 'none'))
    end
    if toCashier > 0 and staffSrc and GetPlayerName(staffSrc) then
        Framework.AddMoney(staffSrc, 'bank', toCashier, 'xs-restaurant-cut')
    end
end

local payout = payoutFn
Orders.Payout = payoutFn

local function tellStaff(pend, result, extra)
    if not pend.staffSrc or not GetPlayerName(pend.staffSrc) then return end
    TriggerClientEvent('XS-RestaurantSystem:client:ringResult', pend.staffSrc, { id = pend.id, result = result, number = extra and extra.number, total = pend.total })
end

local function nearSpeaker(src, b)
    for _, sp in ipairs(b.data.points.speaker) do
        if Biz.Near(src, sp, (Config.Drive.range or 5.0) + 1.0) then return true end
    end
    return false
end

local function customerOk(target, b, reg)
    if Biz.Near(target, reg, Config.Orders.customerRange + 0.5) then return true end
    return reg.drive == true and Config.Drive.enabled and nearSpeaker(target, b)
end

function Orders.NotifyStaff(b, text)
    if b.data.job == '' then return end
    for _, src in ipairs(Framework.OnDutyJob(b.data.job)) do Framework.Notify(src, text, 'inform') end
end

local function lineList(b, raw)
    local lines, total = {}, 0
    for _, l in ipairs(type(raw) == 'table' and raw or {}) do
        local m = type(l) == 'table' and Biz.MenuItem(b, l.id) or nil
        local qty = math.floor(tonumber(type(l) == 'table' and l.qty) or 0)
        if m and m.available and not Biz.IsSoldOut(b, m.id) and qty > 0 and #lines < Config.Orders.maxLines then
            qty = math.min(qty, Config.Orders.maxQuantity)
            local price = Biz.Price(b, m)
            lines[#lines + 1] = { id = m.id, item = m.item, label = Biz.Label(m.item, m.label), qty = qty, price = price, done = false }
            total = total + price * qty
        end
    end
    return lines, total
end

Orders.Lines = lineList
Orders.OpenCount = openCount

function Orders.Ring(src, p)
    p = type(p) == 'table' and p or {}
    local b = Biz.Get(p.biz)
    if not b or not b.data.enabled then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    local reg = Biz.Point(b, 'register', p.register)
    if not reg or not Biz.Near(src, reg, 4.0) then return false, Text('err_too_far') end
    for _, pend in pairs(Orders.pending) do
        if pend.staffSrc == src then return false, Text('err_waiting_pay') end
    end
    local lines, total = lineList(b, p.lines)
    if #lines == 0 then return false, Text('err_empty_order') end
    if openCount(b.id) >= Config.Orders.maxOpen then return false, Text('err_too_many_orders') end
    local name = Util.Text(p.name, 24)

    if p.free == true or total <= 0 then
        if total > 0 and not (Config.Orders.onTheHouse and Biz.IsBoss(src, b)) then return false, Text('err_not_boss') end
        local target = tonumber(p.customer)
        if target and (not GetPlayerName(target) or not customerOk(target, b, reg)) then target = nil end
        local o = Orders.Create(b, { lines = lines, total = 0, paidWith = 'free', name = name, staffSrc = src, customerSrc = target, via = reg.drive and 'drive' or 'counter' })
        if reg.drive and target then Drive.Served(b.id, target) end
        return true, { done = true, number = o.number }
    end

    if not Config.Orders.card and not Config.Orders.cash then return false, Text('err_no_payment') end
    local target = tonumber(p.customer)
    if not target or target == src or not GetPlayerName(target) then return false, Text('err_no_customer') end
    if not customerOk(target, b, reg) then return false, Text('err_customer_far') end
    for _, pend in pairs(Orders.pending) do
        if pend.customerSrc == target then return false, Text('err_customer_busy') end
    end

    local id = Util.Id('p')
    local pend = { id = id, biz = b.id, staffSrc = src, customerSrc = target, lines = lines, total = total, name = name, at = os.time(), via = reg.drive and 'drive' or 'counter' }
    Orders.pending[id] = pend
    local shown = {}
    for i, l in ipairs(lines) do shown[i] = { label = l.label, qty = l.qty, price = l.price } end
    TriggerClientEvent('XS-RestaurantSystem:client:pay', target, {
        id = id, business = b.data.label, colors = b.data.colors, theme = b.data.theme, logo = b.data.logo, lines = shown, total = total,
        name = name, card = Config.Orders.card, cash = Config.Orders.cash, timeout = Config.Orders.payTimeout,
    })
    return true, { pending = id, total = total }
end

function Orders.Respond(src, id, method)
    local pend = Orders.pending[id]
    if not pend or pend.customerSrc ~= src then return false, Text('err_pay_gone') end
    local b = Biz.Get(pend.biz)
    if method == 'decline' or not b then
        Orders.pending[id] = nil
        tellStaff(pend, 'declined')
        return true, { declined = true }
    end
    if method ~= 'card' and method ~= 'cash' then return false, Text('err_failed') end
    if (method == 'card' and not Config.Orders.card) or (method == 'cash' and not Config.Orders.cash) then return false, Text('err_failed') end
    if not Framework.RemoveMoney(src, method == 'card' and 'bank' or 'cash', pend.total, 'xs-restaurant-order') then
        tellStaff(pend, 'nofunds')
        return false, Text(method == 'card' and 'err_no_bank' or 'err_no_cash')
    end
    Orders.pending[id] = nil
    local o = Orders.Create(b, { lines = pend.lines, total = pend.total, paidWith = method, name = pend.name, staffSrc = pend.staffSrc, customerSrc = src, via = pend.via })
    payout(b, pend.total, pend.staffSrc)
    tellStaff(pend, 'paid', { number = o.number })
    if pend.via == 'drive' then Drive.Served(b.id, src) end
    return true, { number = o.number, business = b.data.label }
end

function Orders.CancelRing(src, id)
    local pend = Orders.pending[id]
    if not pend or pend.staffSrc ~= src then return false, Text('err_pay_gone') end
    Orders.pending[id] = nil
    TriggerClientEvent('XS-RestaurantSystem:client:payClose', pend.customerSrc, id)
    return true
end

function Orders.Close(o, status)
    o.status = status
    o.doneAt = os.time()
    Orders.open[o.id] = nil
    save(o)
    Orders.Publish(o.biz)
end

local function refund(o, b)
    if o.total <= 0 or (o.paidWith ~= 'card' and o.paidWith ~= 'cash') then return 'none' end
    if not Config.Orders.refundOnCancel then return 'off' end
    local target = o.customer ~= '' and Framework.SourceOf(o.customer) or nil
    if not target then return 'away' end
    if not Banking.Withdraw(b.data.job, o.total, ('%s refund'):format(b.data.label)) then return 'funds' end
    Framework.AddMoney(target, o.paidWith == 'cash' and 'cash' or 'bank', o.total, 'xs-restaurant-refund')
    Framework.Notify(target, Text('refund_customer', { total = o.total, number = o.number, business = b.data.label }), 'inform')
    Logs.Send(b, 'refunds', Text('log_refund', { number = o.number }), { { Text('log_total'), ('$%d'):format(o.total) }, { Text('log_customer'), o.customerName } })
    return 'done'
end

function Orders.ForStaff(src, bizId)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    return true, b
end

local function nearBusiness(src, b, range)
    for _, kind in ipairs(Data.PointKinds) do
        for _, p in ipairs(b.data.points[kind]) do
            if Biz.Near(src, p, range) then return true end
        end
    end
    return false
end

function Orders.SetStatus(src, oid, status)
    local o = Orders.open[tonumber(oid) or 0]
    if not o then return false, Text('err_no_order') end
    local b = Biz.Get(o.biz)
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    if not nearBusiness(src, b, 60.0) then return false, Text('err_too_far') end
    if status == 'cooking' then
        o.status = 'cooking'
    elseif status == 'new' then
        o.status, o.readyAt = 'new', 0
    elseif status == 'ready' then
        if o.status == 'ready' then return true end
        o.status, o.readyAt = 'ready', os.time()
        if Config.Orders.notifyReady and o.customer ~= '' and o.via ~= 'delivery' then
            local target = Framework.SourceOf(o.customer)
            if target then
                Framework.Notify(target, Text('order_ready', { number = o.number, business = b.data.label }), 'success')
                if o.via == 'phone' and Phone.name ~= 'none' then Phone.Notify(target, b.data.label, Text('order_ready', { number = o.number, business = b.data.label })) end
            end
        end
    elseif status == 'cancelled' then
        local result = refund(o, b)
        Orders.Close(o, 'cancelled')
        return true, { refund = result }
    elseif status == 'collected' then
        Orders.Close(o, 'collected')
        return true
    else
        return false, Text('err_failed')
    end
    save(o)
    Orders.Publish(o.biz)
    return true
end

function Orders.ToggleLine(src, oid, index)
    local o = Orders.open[tonumber(oid) or 0]
    if not o then return false, Text('err_no_order') end
    local b = Biz.Get(o.biz)
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    local line = o.lines[tonumber(index) or 0]
    if not line then return false, Text('err_failed') end
    line.done = not line.done
    save(o)
    Orders.Publish(o.biz)
    return true
end

function Orders.Nearby(src, bizId, kind, pointId)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    if kind ~= 'register' and kind ~= 'counter' then return false, Text('err_failed') end
    local point = Biz.Point(b, kind, pointId)
    if not point or not Biz.Near(src, point, 4.0) then return false, Text('err_too_far') end
    local range = kind == 'register' and Config.Orders.customerRange or Config.Orders.handOverRange
    local speakers = (kind == 'register' and point.drive and Config.Drive.enabled) and b.data.points.speaker or {}
    local ready = {}
    for _, o in pairs(Orders.open) do
        if o.biz == b.id and o.customer ~= '' then
            ready[o.customer] = ready[o.customer] or {}
            ready[o.customer][#ready[o.customer] + 1] = o.number
        end
    end
    local out = {}
    for _, other in ipairs(Framework.Players()) do
        if other ~= src then
            local ped = GetPlayerPed(other)
            if ped and ped ~= 0 then
                local c = GetEntityCoords(ped)
                local at = { x = c.x, y = c.y, z = c.z }
                local d = Util.Distance(at, point)
                local speaker = false
                if d > range then
                    for _, sp in ipairs(speakers) do
                        if Util.Distance(at, sp) <= (Config.Drive.range or 5.0) + 1.0 then speaker = true break end
                    end
                end
                if d <= range or speaker then
                    local cid = Framework.GetCitizenId(other)
                    out[#out + 1] = { src = other, dist = Util.Round(d, 1), speaker = speaker or nil, orders = cid and ready[cid] or nil }
                end
            end
        end
    end
    table.sort(out, function(a, c) return a.dist < c.dist end)
    while #out > 8 do table.remove(out) end
    return true, out
end

function Orders.HandOver(src, oid, target, counterId)
    local o = Orders.open[tonumber(oid) or 0]
    if not o then return false, Text('err_no_order') end
    local b = Biz.Get(o.biz)
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    local counter = Biz.Point(b, 'counter', counterId)
    if not counter or not Biz.Near(src, counter, 4.0) then return false, Text('err_too_far') end
    if o.status ~= 'ready' then return false, Text('err_not_ready') end
    if o.via == 'delivery' then return false, Text('err_is_delivery') end
    if not Config.Orders.handOver then
        Orders.Close(o, 'collected')
        return true, { number = o.number }
    end
    target = tonumber(target)
    if not target or target == src or not GetPlayerName(target) then return false, Text('err_no_customer') end
    local sp, tp = GetPlayerPed(src), GetPlayerPed(target)
    local a, c = GetEntityCoords(sp), GetEntityCoords(tp)
    if Util.Distance({ x = a.x, y = a.y, z = a.z }, { x = c.x, y = c.y, z = c.z }) > Config.Orders.handOverRange + 0.5 then return false, Text('err_customer_far') end
    local need, order = {}, {}
    for _, l in ipairs(o.lines) do
        if not need[l.item] then order[#order + 1] = l.item end
        need[l.item] = (need[l.item] or 0) + l.qty
    end
    for _, item in ipairs(order) do
        if Inventory.Count(src, item) < need[item] then
            return false, Text('err_missing_food', { item = Inventory.Label(item), n = need[item] })
        end
    end
    for _, item in ipairs(order) do
        if not Inventory.CanCarry(target, item, need[item]) then return false, Text('err_customer_full') end
    end
    for _, item in ipairs(order) do
        if Inventory.Remove(src, item, need[item]) then Inventory.Add(target, item, need[item]) end
    end
    Framework.Notify(target, Text('order_received', { number = o.number, business = b.data.label }), 'success')
    Orders.Close(o, 'collected')
    return true, { number = o.number }
end

function Orders.Kiosk(src, p)
    p = type(p) == 'table' and p or {}
    if not Config.Kiosk.enabled then return false, Text('err_kiosk_off') end
    local b = Biz.Get(p.biz)
    if not b or not b.data.enabled then return false, Text('err_no_business') end
    local kiosk = Biz.Point(b, 'kiosk', p.kiosk)
    if not kiosk or not Biz.Near(src, kiosk, 4.0) then return false, Text('err_too_far') end
    if not Biz.IsOpen(b) then return false, Text('err_kiosk_closed') end
    local cid = Framework.GetCitizenId(src)
    if Config.Kiosk.onePerPerson and cid then
        for _, o in pairs(Orders.open) do
            if o.biz == b.id and o.customer == cid then return false, Text('err_kiosk_one', { number = o.number }) end
        end
    end
    for _, pend in pairs(Orders.pending) do
        if pend.customerSrc == src then return false, Text('err_customer_busy') end
    end
    local lines, total = lineList(b, p.lines)
    if #lines == 0 then return false, Text('err_empty_order') end
    if openCount(b.id) >= Config.Orders.maxOpen then return false, Text('err_too_many_orders') end
    local method = p.method
    if method ~= 'card' and method ~= 'cash' then return false, Text('err_failed') end
    if (method == 'card' and not Config.Orders.card) or (method == 'cash' and not Config.Orders.cash) then return false, Text('err_failed') end
    if total > 0 and not Framework.RemoveMoney(src, method == 'card' and 'bank' or 'cash', total, 'xs-restaurant-order') then
        return false, Text(method == 'card' and 'err_no_bank' or 'err_no_cash')
    end
    local o = Orders.Create(b, { lines = lines, total = total, paidWith = total > 0 and method or 'free', name = Util.Text(p.name, 24), customerSrc = src, via = 'kiosk' })
    if total > 0 then payout(b, total, nil) end
    Orders.NotifyStaff(b, Text('kiosk_staff', { number = o.number }))
    return true, { number = o.number, total = total, business = b.data.label }
end

function Orders.Drop(src)
    for id, pend in pairs(Orders.pending) do
        if pend.staffSrc == src then
            Orders.pending[id] = nil
            if GetPlayerName(pend.customerSrc) then TriggerClientEvent('XS-RestaurantSystem:client:payClose', pend.customerSrc, id) end
        elseif pend.customerSrc == src then
            Orders.pending[id] = nil
            tellStaff(pend, 'declined')
        end
    end
end

function Orders.Tick()
    local now = os.time()
    for id, pend in pairs(Orders.pending) do
        if now - pend.at >= Config.Orders.payTimeout then
            Orders.pending[id] = nil
            tellStaff(pend, 'timeout')
            if GetPlayerName(pend.customerSrc) then TriggerClientEvent('XS-RestaurantSystem:client:payClose', pend.customerSrc, id) end
        end
    end
    local limit = (Config.Orders.readyMinutes or 20) * 60
    for _, o in pairs(Orders.open) do
        if o.status == 'ready' and o.readyAt > 0 and now - o.readyAt >= limit then Orders.Close(o, 'expired') end
    end
end

function Orders.Today(bizId)
    local row = MySQL.single.await("SELECT COUNT(*) AS `n`, COALESCE(SUM(`total`), 0) AS `sum` FROM `xs_rest_orders` WHERE `business_id` = ? AND `created_at` >= ? AND `status` <> 'cancelled'", { bizId, startOfToday() })
    return { orders = tonumber(row and row.n) or 0, sales = tonumber(row and row.sum) or 0 }
end
