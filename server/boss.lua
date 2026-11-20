Boss = {}

local function startOfToday()
    local t = os.date('*t')
    return os.time({ year = t.year, month = t.month, day = t.day, hour = 0, min = 0, sec = 0 })
end

function Boss.Data(src, bizId)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    local bank = Boss.BankInfo(src, b)
    if not Biz.IsBoss(src, b) then
        if not bank.deposit and not bank.withdraw then return false, Text('err_not_boss') end
        return true, {
            limited = true, brand = { id = b.id, label = b.data.label, colors = b.data.colors, logo = b.data.logo, style = b.data.style, theme = b.data.theme },
            balance = Banking.Balance(b.data.job), banking = Banking.name, job = b.data.job, bank = bank, mine = Framework.GetMoney(src),
            week = { sales = 0, orders = 0 }, open = Biz.IsOpen(b), now = os.time(),
        }
    end
    local today = startOfToday()
    local since = today - 6 * 86400
    local rows = MySQL.query.await("SELECT `lines`, `total`, `staff_name`, `created_at`, `via` FROM `xs_rest_orders` WHERE `business_id` = ? AND `created_at` >= ? AND `status` <> 'cancelled'", { b.id, since }) or {}
    local days = {}
    for i = 0, 6 do days[i + 1] = { at = since + i * 86400, sales = 0, orders = 0 } end
    local best, staff, via = {}, {}, {}
    local week = { sales = 0, orders = 0 }
    for _, r in ipairs(rows) do
        local at = tonumber(r.created_at) or 0
        local total = tonumber(r.total) or 0
        local slot = math.floor((at - since) / 86400) + 1
        if days[slot] then
            days[slot].sales = days[slot].sales + total
            days[slot].orders = days[slot].orders + 1
        end
        week.sales, week.orders = week.sales + total, week.orders + 1
        for _, l in ipairs(Db.Decode(r.lines, {})) do
            local key = l.label or l.item or '?'
            local e = best[key] or { label = key, item = l.item, qty = 0, sales = 0 }
            e.qty = e.qty + (tonumber(l.qty) or 0)
            e.sales = e.sales + (tonumber(l.qty) or 0) * (tonumber(l.price) or 0)
            best[key] = e
        end
        local name = r.staff_name ~= '' and r.staff_name or nil
        if name then
            local s = staff[name] or { name = name, orders = 0, sales = 0 }
            s.orders, s.sales = s.orders + 1, s.sales + total
            staff[name] = s
        end
        local v = r.via or 'counter'
        via[v] = (via[v] or 0) + 1
    end
    local bestList, staffList = {}, {}
    for _, e in pairs(best) do e.image = e.item and Inventory.Image(e.item) or '' bestList[#bestList + 1] = e end
    for _, s in pairs(staff) do staffList[#staffList + 1] = s end
    table.sort(bestList, function(a, c) return a.qty > c.qty end)
    table.sort(staffList, function(a, c) return a.orders > c.orders end)
    while #bestList > 6 do table.remove(bestList) end
    while #staffList > 8 do table.remove(staffList) end
    local recent = MySQL.query.await('SELECT `id`, `number`, `status`, `total`, `customer_name`, `name`, `via`, `paid_with`, `staff_name`, `created_at` FROM `xs_rest_orders` WHERE `business_id` = ? ORDER BY `id` DESC LIMIT 15', { b.id }) or {}
    local menu = {}
    for _, m in ipairs(b.data.menu) do
        local low, high = Biz.PriceRange(m)
        menu[#menu + 1] = {
            id = m.id, label = Biz.Label(m.item, m.label), image = Inventory.Image(m.item), base = m.price, price = Biz.Price(b, m),
            low = low, high = high, available = m.available, soldout = Biz.IsSoldOut(b, m.id), category = m.category,
        }
    end
    local supplies = {}
    for _, s in ipairs(b.data.supplies) do supplies[#supplies + 1] = { item = s.item, label = Inventory.Label(s.item), image = Inventory.Image(s.item), price = s.price } end
    return true, {
        brand = { id = b.id, label = b.data.label, colors = b.data.colors, logo = b.data.logo, style = b.data.style, theme = b.data.theme },
        today = days[7], week = week, days = days, best = bestList, staff = staffList, via = via, recent = recent,
        balance = Banking.Balance(b.data.job), banking = Banking.name, job = b.data.job,
        menu = menu, categories = b.data.categories, prices = Config.Boss.prices, range = Config.Boss.priceRangePct,
        supplies = supplies, modes = Supply.Modes(b), supplyOn = Config.Supply.enabled, supplyRecent = Supply.Recent(b.id),
        deliveryMinutes = Config.Supply.deliveryMinutes, pickupMinutes = Config.Supply.pickupMinutes,
        flags = {
            phone = { allowed = b.data.phone, on = Biz.Flag(b, 'phone') },
            delivery = { allowed = b.data.delivery and Config.Delivery.enabled, on = Biz.Flag(b, 'delivery') },
        },
        open = Biz.IsOpen(b), now = os.time(), bank = bank, mine = Framework.GetMoney(src),
    }
end

function Boss.BankRecent(bizId)
    local rows = MySQL.query.await('SELECT `kind`, `amount`, `account`, `by_name`, `created_at` FROM `xs_rest_bank` WHERE `business_id` = ? ORDER BY `id` DESC LIMIT 12', { bizId }) or {}
    local out = {}
    for _, r in ipairs(rows) do
        out[#out + 1] = { kind = r.kind, amount = tonumber(r.amount) or 0, account = r.account, by = r.by_name, at = tonumber(r.created_at) or 0 }
    end
    return out
end

function Boss.BankInfo(src, b)
    local on = Config.Boss.bank == true
    local ready = on and Banking.Ready() or false
    return {
        on = on, ready = ready, supported = Banking.supported, job = b.data.job,
        deposit = on and Biz.CanBank(src, b, 'deposit') or false, withdraw = on and Biz.CanBank(src, b, 'withdraw') or false,
        max = Config.Boss.bankMax or 1000000, recent = ready and Boss.BankRecent(b.id) or {},
    }
end

function Boss.Move(src, bizId, kind, amount, account)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Config.Boss.bank then return false, Text('err_bank_off') end
    if not Banking.Ready() then return false, Text('err_bank_none') end
    if kind ~= 'deposit' and kind ~= 'withdraw' then return false, Text('err_failed') end
    if not Biz.CanBank(src, b, kind) then return false, Text(kind == 'deposit' and 'err_bank_in_denied' or 'err_bank_out_denied') end
    account = account == 'bank' and 'bank' or 'cash'
    amount = math.floor(tonumber(amount) or 0)
    local max = Config.Boss.bankMax or 1000000
    if amount < 1 or amount > max then return false, Text('err_bank_amount', { max = max }) end
    local note = ('%s %s'):format(b.data.label, kind == 'deposit' and 'deposit' or 'withdrawal')
    if kind == 'deposit' then
        if not Framework.RemoveMoney(src, account, amount, 'xs-restaurant-deposit') then return false, Text(account == 'bank' and 'err_no_bank' or 'err_no_cash') end
        if not Banking.Deposit(b.data.job, amount, note) then
            Framework.AddMoney(src, account, amount, 'xs-restaurant-deposit-refund')
            return false, Text('err_failed')
        end
    else
        if not Banking.Withdraw(b.data.job, amount, note) then return false, Text('err_bank_funds', { amount = amount }) end
        if not Framework.AddMoney(src, account, amount, 'xs-restaurant-withdrawal') then
            Banking.Deposit(b.data.job, amount, note)
            return false, Text('err_failed')
        end
    end
    local by = Framework.GetName(src) or ''
    MySQL.insert.await('INSERT INTO `xs_rest_bank` (`business_id`, `kind`, `amount`, `account`, `by_name`, `created_at`) VALUES (?, ?, ?, ?, ?, ?)', { b.id, kind, amount, account, by, os.time() })
    Logs.Send(b, 'bank', Text(kind == 'deposit' and 'log_bank_in' or 'log_bank_out'), { { Text('log_amount'), ('$%d'):format(amount) }, { Text(kind == 'deposit' and 'log_from' or 'log_to'), Text('bank_account_' .. account) }, { Text('log_by'), by } })
    return true, { balance = Banking.Balance(b.data.job), mine = Framework.GetMoney(src) }
end
