PhoneOrders = {}

local function anchor(b)
    for _, kind in ipairs({ 'register', 'counter', 'kiosk' }) do
        local p = b.data.points[kind][1]
        if p then return p end
    end
end

local function coords(src)
    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then return nil end
    local c = GetEntityCoords(ped)
    return { x = c.x, y = c.y, z = c.z }
end

local function tell(src, title, body)
    if not src then return end
    Framework.Notify(src, body, 'inform')
    if Phone.name ~= 'none' then Phone.Notify(src, title, body) end
end

function PhoneOrders.Mine(src)
    local cid = Framework.GetCitizenId(src)
    local out = {}
    if not cid then return out end
    for _, o in pairs(Orders.open) do
        if o.customer == cid then
            local b = Biz.Get(o.biz)
            out[#out + 1] = {
                id = o.id, biz = o.biz, business = b and b.data.label or '', colors = b and b.data.colors or nil, number = o.number,
                status = o.status, via = o.via, total = o.total, onWay = o.extra and o.extra.driver ~= nil or false, at = o.at,
            }
        end
    end
    table.sort(out, function(a, b) return a.at > b.at end)
    return out
end

function PhoneOrders.List(src)
    if not Config.Phone.app then return false, Text('err_phone_off') end
    local here = coords(src)
    local soldout = Biz.soldout
    local list = {}
    for _, b in pairs(Biz.list) do
        local a = anchor(b)
        if b.data.enabled and Biz.Flag(b, 'phone') and a and #b.data.menu > 0 then
            local dist = here and Util.Distance(here, a) or 0
            local pub = Biz.Public(b)
            local menu = {}
            for _, m in ipairs(pub.menu) do
                if m.available then
                    m.soldout = soldout[b.id] ~= nil and soldout[b.id][m.id] == true
                    menu[#menu + 1] = m
                end
            end
            list[#list + 1] = {
                id = b.id, label = b.data.label, style = b.data.style, colors = b.data.colors, logo = b.data.logo,
                open = Biz.IsOpen(b), distance = math.floor(dist),
                delivery = Config.Delivery.enabled and Biz.Flag(b, 'delivery') and dist <= (Config.Delivery.maxDistance or 2500),
                fee = Biz.DeliveryFee(b), categories = pub.categories, menu = menu, at = { x = a.x, y = a.y },
            }
        end
    end
    table.sort(list, function(a, b)
        if a.open ~= b.open then return a.open end
        return a.distance < b.distance
    end)
    return true, { list = list, mine = PhoneOrders.Mine(src), bank = Framework.GetMoney(src).bank }
end

function PhoneOrders.Order(src, p)
    p = type(p) == 'table' and p or {}
    if not Config.Phone.app then return false, Text('err_phone_off') end
    local b = Biz.Get(p.biz)
    if not b or not b.data.enabled or not Biz.Flag(b, 'phone') then return false, Text('err_no_business') end
    if not Biz.IsOpen(b) then return false, Text('err_kiosk_closed') end
    local cid = Framework.GetCitizenId(src)
    for _, o in pairs(Orders.open) do
        if o.biz == b.id and o.customer == cid then return false, Text('err_kiosk_one', { number = o.number }) end
    end
    for _, pend in pairs(Orders.pending) do
        if pend.customerSrc == src then return false, Text('err_customer_busy') end
    end
    local lines, total = Orders.Lines(b, p.lines)
    if #lines == 0 then return false, Text('err_empty_order') end
    if Orders.OpenCount(b.id) >= Config.Orders.maxOpen then return false, Text('err_too_many_orders') end
    local mode = p.mode == 'delivery' and 'delivery' or 'phone'
    local extra = {}
    if mode == 'delivery' then
        if not Config.Delivery.enabled or not Biz.Flag(b, 'delivery') then return false, Text('err_delivery_off') end
        local here, a = coords(src), anchor(b)
        if not here or not a or Util.Distance(here, a) > (Config.Delivery.maxDistance or 2500) then return false, Text('err_delivery_far') end
        extra.address = here
        extra.street = Util.Text(p.street, 60)
        extra.fee = Biz.DeliveryFee(b)
        total = total + extra.fee
    end
    if total > 0 and not Framework.RemoveMoney(src, 'bank', total, 'xs-restaurant-order') then return false, Text('err_no_bank') end
    local o = Orders.Create(b, { lines = lines, total = total, paidWith = total > 0 and 'card' or 'free', name = Util.Text(p.name, 24), customerSrc = src, via = mode, extra = extra })
    if total > 0 then Orders.Payout(b, total, nil) end
    Orders.NotifyStaff(b, Text(mode == 'delivery' and 'delivery_staff' or 'phone_staff', { number = o.number }))
    return true, { number = o.number, total = total, mode = mode, business = b.data.label }
end

function PhoneOrders.Take(src, oid)
    local o = Orders.open[tonumber(oid) or 0]
    if not o or o.via ~= 'delivery' then return false, Text('err_no_order') end
    local b = Biz.Get(o.biz)
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    if o.status ~= 'ready' then return false, Text('err_not_ready') end
    o.extra = o.extra or {}
    if o.extra.driver and o.extra.driver ~= src and GetPlayerName(o.extra.driver) then return false, Text('err_delivery_taken') end
    o.extra.driver, o.extra.driverName = src, Framework.GetName(src) or ''
    Orders.Save(o)
    Orders.Publish(o.biz)
    local customer = o.customer ~= '' and Framework.SourceOf(o.customer) or nil
    if customer then tell(customer, b.data.label, Text('delivery_on_way', { number = o.number, business = b.data.label })) end
    return true, { id = o.id, number = o.number, address = o.extra.address, street = o.extra.street, customer = customer, business = b.data.label }
end

function PhoneOrders.Hand(src, oid)
    local o = Orders.open[tonumber(oid) or 0]
    if not o or o.via ~= 'delivery' then return false, Text('err_no_order') end
    local b = Biz.Get(o.biz)
    if not o.extra or o.extra.driver ~= src then return false, Text('err_delivery_not_yours') end
    local customer = o.customer ~= '' and Framework.SourceOf(o.customer) or nil
    if not customer then return false, Text('err_delivery_away') end
    local a, c = coords(src), coords(customer)
    if not a or not c or Util.Distance(a, c) > (Config.Delivery.range or 6.0) + 0.5 then return false, Text('err_customer_far') end
    local need, order = {}, {}
    for _, l in ipairs(o.lines) do
        if not need[l.item] then order[#order + 1] = l.item end
        need[l.item] = (need[l.item] or 0) + l.qty
    end
    for _, item in ipairs(order) do
        if Inventory.Count(src, item) < need[item] then return false, Text('err_missing_food', { item = Inventory.Label(item), n = need[item] }) end
    end
    for _, item in ipairs(order) do
        if not Inventory.CanCarry(customer, item, need[item]) then return false, Text('err_customer_full') end
    end
    for _, item in ipairs(order) do
        if Inventory.Remove(src, item, need[item]) then Inventory.Add(customer, item, need[item]) end
    end
    Orders.Close(o, 'collected')
    Framework.Notify(customer, Text('order_received', { number = o.number, business = b.data.label }), 'success')
    Logs.Send(b, 'deliveries', Text('log_delivery', { number = o.number }), { { Text('log_items'), Logs.Lines(o.lines), false }, { Text('log_customer'), o.customerName }, { Text('log_driver'), o.extra.driverName }, { Text('log_where'), o.extra.street } })
    return true, { number = o.number }
end

function PhoneOrders.Drop(src)
    for _, o in pairs(Orders.open) do
        if o.via == 'delivery' and o.extra and o.extra.driver == src then
            o.extra.driver, o.extra.driverName = nil, nil
            Orders.Save(o)
            Orders.Publish(o.biz)
        end
    end
end
