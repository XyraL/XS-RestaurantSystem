Supply = { open = {}, warehouse = nil }

local function save(o)
    MySQL.update('UPDATE `xs_rest_supply` SET `status` = ?, `done_at` = ? WHERE `id` = ?', { o.status, o.doneAt or 0, o.id })
end

function Supply.Publish()
    local vans, pickups = {}, {}
    for _, o in pairs(Supply.open) do
        if o.status == 'arrived' then
            local key = tostring(o.biz)
            if o.mode == 'delivery' then vans[key] = (vans[key] or 0) + 1 else pickups[key] = (pickups[key] or 0) + 1 end
        end
    end
    GlobalState['xsr:vans'] = vans
    GlobalState['xsr:pickups'] = pickups
    GlobalState['xsr:warehouse'] = Supply.warehouse
end

function Supply.Load()
    local rows = MySQL.query.await("SELECT * FROM `xs_rest_supply` WHERE `status` IN ('waiting', 'arrived')") or {}
    for _, r in ipairs(rows) do
        local id, biz = tonumber(r.id), tonumber(r.business_id)
        if id and biz and Biz.Get(biz) then
            Supply.open[id] = {
                id = id, biz = biz, lines = Db.Decode(r.lines, {}), total = tonumber(r.total) or 0, mode = r.mode,
                status = r.status, ready = tonumber(r.ready_at) or 0, by = r.by_name or '', at = tonumber(r.created_at) or 0,
            }
        end
    end
    local row = MySQL.single.await('SELECT `data` FROM `xs_rest_settings` WHERE `name` = ?', { 'warehouse' })
    Supply.warehouse = row and Util.Point(Db.Decode(row.data, nil)) or nil
    Supply.Publish()
end

function Supply.SetWarehouse(point)
    Supply.warehouse = Util.Point(point)
    MySQL.query.await('INSERT INTO `xs_rest_settings` (`name`, `data`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)', { 'warehouse', Db.Json(Supply.warehouse or {}) })
    Supply.Publish()
    return Supply.warehouse
end

function Supply.Modes(b)
    local mode = Config.Supply.mode or 'both'
    local out = {}
    if (mode == 'both' or mode == 'delivery') and #b.data.points.dock > 0 then out[#out + 1] = 'delivery' end
    if (mode == 'both' or mode == 'pickup') and Supply.warehouse then out[#out + 1] = 'pickup' end
    return out
end

function Supply.Order(src, bizId, raw, mode)
    if not Config.Supply.enabled then return false, Text('err_supply_off') end
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsBoss(src, b) then return false, Text('err_not_boss') end
    local allowed = false
    for _, m in ipairs(Supply.Modes(b)) do if m == mode then allowed = true end end
    if not allowed then return false, Text('err_supply_mode') end
    local prices = {}
    for _, s in ipairs(b.data.supplies) do prices[s.item] = s.price end
    local lines, total, seen = {}, 0, {}
    for _, l in ipairs(type(raw) == 'table' and raw or {}) do
        local item = type(l) == 'table' and l.item
        local qty = math.floor(tonumber(type(l) == 'table' and l.qty) or 0)
        if item and prices[item] and not seen[item] and qty > 0 and #lines < 20 then
            seen[item] = true
            qty = math.min(qty, 100)
            lines[#lines + 1] = { item = item, label = Inventory.Label(item), count = qty, price = prices[item] }
            total = total + prices[item] * qty
        end
    end
    if #lines == 0 then return false, Text('err_empty_order') end
    if total > 0 and not Banking.Withdraw(b.data.job, total, ('%s supplies'):format(b.data.label)) then return false, Text('err_supply_funds', { total = total }) end
    local now = os.time()
    local minutes = mode == 'delivery' and (Config.Supply.deliveryMinutes or 5) or (Config.Supply.pickupMinutes or 2)
    local by = Framework.GetName(src) or ''
    local id = MySQL.insert.await('INSERT INTO `xs_rest_supply` (`business_id`, `lines`, `total`, `mode`, `status`, `by_name`, `created_at`, `ready_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', {
        b.id, Db.Json(lines), total, mode, 'waiting', by, now, now + minutes * 60,
    })
    id = tonumber(id)
    if not id then return false, Text('err_failed') end
    Supply.open[id] = { id = id, biz = b.id, lines = lines, total = total, mode = mode, status = 'waiting', ready = now + minutes * 60, by = by, at = now }
    Logs.Send(b, 'supplies', Text('log_supply'), { { Text('log_items'), Logs.Lines(lines), false }, { Text('log_total'), ('$%d'):format(total) }, { Text('log_how'), Text('supply_mode_' .. mode) }, { Text('log_by'), by } })
    Supply.Publish()
    return true, { id = id, ready = now + minutes * 60, mode = mode, total = total }
end

function Supply.Tick()
    local now = os.time()
    local changed = false
    for id, o in pairs(Supply.open) do
        local b = Biz.Get(o.biz)
        if not b then
            Supply.open[id] = nil
            changed = true
        elseif o.status == 'waiting' and o.ready <= now then
            o.status = 'arrived'
            save(o)
            changed = true
            Orders.NotifyStaff(b, Text(o.mode == 'delivery' and 'supply_arrived_dock' or 'supply_arrived_pickup'))
        elseif o.status == 'arrived' and now - o.ready >= (Config.Supply.expireMinutes or 60) * 60 then
            o.status, o.doneAt = 'refunded', now
            save(o)
            Supply.open[id] = nil
            changed = true
            if o.total > 0 then Banking.Deposit(b.data.job, o.total, ('%s supplies refund'):format(b.data.label)) end
            Orders.NotifyStaff(b, Text('supply_refunded'))
        end
    end
    if changed then Supply.Publish() end
end

local function nearDock(src, b)
    for _, p in ipairs(b.data.points.dock) do
        if Biz.Near(src, p, 9.0) then return true end
    end
    return false
end

function Supply.Collect(src, mode, bizId)
    local picked = {}
    if mode == 'delivery' then
        local b = Biz.Get(bizId)
        if not b then return false, Text('err_no_business') end
        if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
        if not nearDock(src, b) then return false, Text('err_too_far') end
        for _, o in pairs(Supply.open) do
            if o.biz == b.id and o.mode == 'delivery' and o.status == 'arrived' then picked[#picked + 1] = o end
        end
    elseif mode == 'pickup' then
        if not Supply.warehouse or not Biz.Near(src, Supply.warehouse, 6.0) then return false, Text('err_too_far') end
        for _, o in pairs(Supply.open) do
            local b = Biz.Get(o.biz)
            if b and o.mode == 'pickup' and o.status == 'arrived' and Biz.IsStaff(src, b, false) then picked[#picked + 1] = o end
        end
    else
        return false, Text('err_failed')
    end
    if #picked == 0 then return false, Text('err_supply_none') end
    local need, order = {}, {}
    for _, o in ipairs(picked) do
        for _, l in ipairs(o.lines) do
            if not need[l.item] then order[#order + 1] = l.item end
            need[l.item] = (need[l.item] or 0) + l.count
        end
    end
    for _, item in ipairs(order) do
        if not Inventory.CanCarry(src, item, need[item]) then return false, Text('err_cant_carry') end
    end
    local now = os.time()
    for _, item in ipairs(order) do Inventory.Add(src, item, need[item]) end
    for _, o in ipairs(picked) do
        o.status, o.doneAt = 'collected', now
        save(o)
        Supply.open[o.id] = nil
    end
    Supply.Publish()
    return true, { orders = #picked, items = #order }
end

function Supply.Recent(bizId)
    local rows = MySQL.query.await('SELECT `id`, `lines`, `total`, `mode`, `status`, `by_name`, `created_at`, `ready_at` FROM `xs_rest_supply` WHERE `business_id` = ? ORDER BY `id` DESC LIMIT 10', { bizId }) or {}
    local out = {}
    for _, r in ipairs(rows) do
        out[#out + 1] = { id = tonumber(r.id), lines = Db.Decode(r.lines, {}), total = tonumber(r.total) or 0, mode = r.mode, status = r.status, by = r.by_name, at = tonumber(r.created_at) or 0, ready = tonumber(r.ready_at) or 0 }
    end
    return out
end
