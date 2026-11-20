Biz = { list = {}, open = {}, ready = false }

local LIMITS = { points = 40, categories = 20, menu = 120, recipes = 120, ingredients = 12, steps = 6 }

local function list(value)
    return type(value) == 'table' and value or {}
end

local function uniqueId(raw, prefix, seen)
    local id = Util.Slug(raw, 24)
    if id == '' or seen[id] then
        repeat id = Util.Id(prefix) until not seen[id]
    end
    seen[id] = true
    return id
end

local function points(raw, kind)
    local out, seen = {}, {}
    for _, p in ipairs(list(raw)) do
        local pt = Util.Point(p)
        if pt and #out < LIMITS.points then
            pt.id = uniqueId(p.id, kind:sub(1, 1), seen)
            pt.label = Util.Text(p.label, 40)
            if kind == 'station' then pt.type = Data.byStation[p.type] and p.type or 'prep' end
            if kind == 'register' or kind == 'station' or kind == 'speaker' or kind == 'office' then
                pt.prop = p.prop ~= false
                pt.model = Util.Slug(p.model, 64)
            end
            if kind == 'register' then pt.drive = p.drive == true end
            if kind == 'kitchen' or kind == 'pickup' or kind == 'menuboard' then
                pt.width = Util.Round(Util.Clamp(tonumber(p.width) or 1.2, 0.3, 6.0), 2)
            end
            if kind == 'kiosk' then
                pt.width = Util.Round(Util.Clamp(tonumber(p.width) or 0.5, 0.2, 2.0), 2)
            end
            if kind == 'menuboard' then
                pt.title = Util.Text(p.title, 32)
                pt.categories = {}
                for _, c in ipairs(list(p.categories)) do
                    local id = Util.Slug(c, 24)
                    if id ~= '' and #pt.categories < 20 then pt.categories[#pt.categories + 1] = id end
                end
            end
            if kind == 'seat' then
                local seat = Data.bySeat[p.seat] and p.seat or 'chair'
                pt.seat = seat
                pt.height = Util.Round(Util.Clamp(tonumber(p.height) or Data.bySeat[seat].height, -0.5, 1.5), 2)
            end
            out[#out + 1] = pt
        end
    end
    return out
end

local function ingredients(raw)
    local out, seen = {}, {}
    for _, ing in ipairs(list(raw)) do
        local item = Util.Slug(type(ing) == 'table' and ing.item, 64)
        if item ~= '' and not seen[item] and #out < LIMITS.ingredients then
            seen[item] = true
            out[#out + 1] = { item = item, count = math.floor(Util.Clamp(tonumber(ing.count) or 1, 1, 50)) }
        end
    end
    return out
end

local function steps(raw, station)
    local games = {}
    for _, g in ipairs(Data.Games) do games[g] = true end
    local out = {}
    for _, s in ipairs(list(raw)) do
        if type(s) == 'table' and #out < LIMITS.steps then
            out[#out + 1] = {
                game = games[s.game] and s.game or 'timer',
                seconds = math.floor(Util.Clamp(tonumber(s.seconds) or 5, 2, 60)),
                label = Util.Text(s.label, 40),
            }
        end
    end
    if #out == 0 then
        local def = Data.byStation[station]
        out[1] = { game = def and def.game or 'timer', seconds = 6, label = '' }
    end
    return out
end

function Biz.Normalise(raw)
    raw = list(raw)
    local style = Data.byStyle[raw.style] and raw.style or 'custom'
    local def = Data.byStyle[style]
    local colors = list(raw.colors)
    local blip = list(raw.blip)
    local owner = list(raw.owner)
    local storage = list(raw.storage)
    local d = {
        label = Util.Text(raw.label, 48),
        style = style,
        theme = Data.byTheme[raw.theme] and raw.theme or 'modern',
        job = Util.Slug(raw.job, 50),
        owner = { cid = Util.Slug(owner.cid, 64), name = Util.Text(owner.name, 80) },
        enabled = raw.enabled ~= false,
        colors = { accent = Util.Colour(colors.accent, def.accent), accent2 = Util.Colour(colors.accent2, def.accent2) },
        logo = '',
        blip = {
            show = blip.show ~= false,
            sprite = math.floor(Util.Clamp(tonumber(blip.sprite) or def.sprite, 1, 999)),
            colour = math.floor(Util.Clamp(tonumber(blip.colour) or def.colour, 0, 85)),
            scale = Util.Round(Util.Clamp(tonumber(blip.scale) or 0.8, 0.4, 1.6), 2),
            label = Util.Text(blip.label, 48),
            at = Util.Point(blip.at),
            whenClosed = (blip.whenClosed == 'grey' or blip.whenClosed == 'hide' or blip.whenClosed == 'same') and blip.whenClosed or 'default',
        },
        points = {},
        categories = {},
        menu = {},
        recipes = {},
        storage = {
            slots = math.floor(Util.Clamp(tonumber(storage.slots) or 50, 1, 300)),
            weight = math.floor(Util.Clamp(tonumber(storage.weight) or 250000, 1000, 5000000)),
        },
        supplies = {},
        phone = raw.phone ~= false,
        delivery = raw.delivery ~= false,
        deliveryFee = math.floor(Util.Clamp(tonumber(raw.deliveryFee) or -1, -1, 10000)),
        webhook = '',
        bank = {
            deposit = math.floor(Util.Clamp(tonumber(list(raw.bank).deposit) or 0, -1, 50)),
            withdraw = math.floor(Util.Clamp(tonumber(list(raw.bank).withdraw) or -1, -1, 50)),
        },
    }
    local hook = Util.Text(raw.webhook, 300)
    if hook:match('^https://discord%.com/api/webhooks/') or hook:match('^https://discordapp%.com/api/webhooks/') or hook:match('^https://ptb%.discord%.com/api/webhooks/') or hook:match('^https://canary%.discord%.com/api/webhooks/') then d.webhook = hook end
    local supplySeen = {}
    for _, s in ipairs(list(raw.supplies)) do
        local item = type(s) == 'table' and Util.Slug(s.item, 64) or ''
        if item ~= '' and not supplySeen[item] and #d.supplies < 60 then
            supplySeen[item] = true
            d.supplies[#d.supplies + 1] = { item = item, price = math.floor(Util.Clamp(tonumber(s.price) or 1, 0, 100000)) }
        end
    end
    local logo = Util.Text(raw.logo, 300)
    if logo:match('^https://') or logo:match('^nui://') then d.logo = logo end
    if d.label == '' then d.label = Text('biz_default_name') end

    local rawPoints = list(raw.points)
    for _, kind in ipairs(Data.PointKinds) do d.points[kind] = points(rawPoints[kind], kind) end

    local seen = {}
    for _, c in ipairs(list(raw.categories)) do
        if type(c) == 'table' and #d.categories < LIMITS.categories then
            local label = Util.Text(c.label, 32)
            if label ~= '' then d.categories[#d.categories + 1] = { id = uniqueId(c.id, 'c', seen), label = label } end
        end
    end
    local known = {}
    for _, c in ipairs(d.categories) do known[c.id] = true end
    for _, board in ipairs(d.points.menuboard) do
        local keep = {}
        for _, id in ipairs(board.categories) do
            if known[id] then keep[#keep + 1] = id end
        end
        board.categories = keep
    end

    seen = {}
    for _, m in ipairs(list(raw.menu)) do
        local item = type(m) == 'table' and Util.Slug(m.item, 64) or ''
        if item ~= '' and #d.menu < LIMITS.menu then
            d.menu[#d.menu + 1] = {
                id = uniqueId(m.id, 'm', seen),
                item = item,
                label = Util.Text(m.label, 40),
                price = math.floor(Util.Clamp(tonumber(m.price) or 0, 0, 1000000)),
                category = known[m.category] and m.category or (d.categories[1] and d.categories[1].id or ''),
                available = m.available ~= false,
            }
        end
    end

    seen = {}
    for _, r in ipairs(list(raw.recipes)) do
        local item = type(r) == 'table' and Util.Slug(r.item, 64) or ''
        if item ~= '' and #d.recipes < LIMITS.recipes then
            local station = Data.byStation[r.station] and r.station or 'prep'
            d.recipes[#d.recipes + 1] = {
                id = uniqueId(r.id, 'r', seen),
                item = item,
                amount = math.floor(Util.Clamp(tonumber(r.amount) or 1, 1, 20)),
                station = station,
                ingredients = ingredients(r.ingredients),
                steps = steps(r.steps, station),
                level = (r.level == 'easy' or r.level == 'hard') and r.level or 'normal',
            }
        end
    end
    return d
end

function Biz.Blank(style)
    local def = Data.byStyle[style] or Data.byStyle.custom
    local cats = {}
    for i, label in ipairs(def.categories) do cats[i] = { id = 'c' .. i, label = label } end
    return Biz.Normalise({ style = def.id, theme = def.theme, label = Text('style_' .. def.id), categories = cats })
end

function Biz.Load()
    local rows = MySQL.query.await('SELECT `id`, `data` FROM `xs_rest_businesses`') or {}
    Biz.list = {}
    for _, row in ipairs(rows) do
        local id = tonumber(row.id)
        if id then Biz.list[id] = { id = id, data = Biz.Normalise(Db.Decode(row.data, {})) } end
    end
    Biz.ready = true
end

function Biz.Get(id)
    return Biz.list[tonumber(id) or -1]
end

function Biz.Save(id, raw)
    local data = Biz.Normalise(raw)
    local now = os.time()
    id = tonumber(id)
    if id and Biz.list[id] then
        MySQL.update.await('UPDATE `xs_rest_businesses` SET `data` = ?, `updated_at` = ? WHERE `id` = ?', { Db.Json(data), now, id })
    else
        id = MySQL.insert.await('INSERT INTO `xs_rest_businesses` (`data`, `created_at`, `updated_at`) VALUES (?, ?, ?)', { Db.Json(data), now, now })
        id = tonumber(id)
        if not id then return nil end
    end
    Biz.list[id] = { id = id, data = data }
    Biz.RefreshOpen()
    return id, data
end

function Biz.Delete(id)
    id = tonumber(id)
    if not id or not Biz.list[id] then return false end
    MySQL.query.await('DELETE FROM `xs_rest_businesses` WHERE `id` = ?', { id })
    Biz.list[id] = nil
    if Biz.soldout[id] then
        Biz.soldout[id] = nil
        Biz.PublishSoldOut()
    end
    Biz.RefreshOpen()
    return true
end

function Biz.IsStaff(src, b, needDuty)
    if not b then return false end
    local cid = Framework.GetCitizenId(src)
    if cid and b.data.owner.cid ~= '' and cid == b.data.owner.cid then return true end
    local job = Framework.GetJob(src)
    if not job or b.data.job == '' or job.name ~= b.data.job then return false end
    if needDuty == nil then needDuty = Config.Staff.needDuty end
    return not needDuty or job.onDuty
end

function Biz.IsBoss(src, b)
    if not b then return false end
    local cid = Framework.GetCitizenId(src)
    if cid and b.data.owner.cid ~= '' and cid == b.data.owner.cid then return true end
    local job = Framework.GetJob(src)
    return job ~= nil and b.data.job ~= '' and job.name == b.data.job and job.isBoss == true
end

function Biz.CanBank(src, b, kind)
    if not b or not Config.Boss.bank then return false end
    if Biz.IsBoss(src, b) then return true end
    local need = (b.data.bank or {})[kind]
    if type(need) ~= 'number' or need < 0 or not Biz.IsStaff(src, b) then return false end
    local cid = Framework.GetCitizenId(src)
    if cid and b.data.owner.cid ~= '' and cid == b.data.owner.cid then return true end
    local job = Framework.GetJob(src)
    return job ~= nil and (job.grade or 0) >= need
end

function Biz.Point(b, kind, id)
    for _, p in ipairs(b and b.data.points[kind] or {}) do
        if p.id == id then return p end
    end
end

function Biz.Near(src, point, range)
    if not point then return false end
    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then return false end
    local c = GetEntityCoords(ped)
    return Util.Distance({ x = c.x, y = c.y, z = c.z }, point) <= range
end

function Biz.MenuItem(b, id)
    for _, m in ipairs(b and b.data.menu or {}) do
        if m.id == id then return m end
    end
end

function Biz.Recipe(b, id)
    for _, r in ipairs(b and b.data.recipes or {}) do
        if r.id == id then return r end
    end
end

function Biz.Label(item, custom)
    if custom and custom ~= '' then return custom end
    return Inventory.Label(item)
end

function Biz.Public(b)
    local d = b.data
    local menu, recipes = {}, {}
    for _, m in ipairs(d.menu) do
        menu[#menu + 1] = { id = m.id, item = m.item, label = Biz.Label(m.item, m.label), image = Inventory.Image(m.item), price = Biz.Price(b, m), category = m.category, available = m.available }
    end
    for _, r in ipairs(d.recipes) do
        local ings = {}
        for i, ing in ipairs(r.ingredients) do ings[i] = { item = ing.item, count = ing.count, label = Inventory.Label(ing.item), image = Inventory.Image(ing.item) } end
        recipes[#recipes + 1] = { id = r.id, item = r.item, label = Inventory.Label(r.item), image = Inventory.Image(r.item), amount = r.amount, station = r.station, ingredients = ings, steps = Util.Copy(r.steps), level = r.level }
    end
    return {
        id = b.id, label = d.label, style = d.style, theme = d.theme, job = d.job, owner = d.owner.cid, enabled = d.enabled,
        colors = Util.Copy(d.colors), logo = d.logo, blip = Util.Copy(d.blip), points = Util.Copy(d.points),
        categories = Util.Copy(d.categories), menu = menu, recipes = recipes,
        phone = Biz.Flag(b, 'phone'), delivery = Biz.Flag(b, 'delivery'), deliveryFee = Biz.DeliveryFee(b),
        bank = Util.Copy(d.bank),
    }
end

function Biz.PublicAll()
    local out = {}
    for _, b in pairs(Biz.list) do
        if b.data.enabled then out[#out + 1] = Biz.Public(b) end
    end
    table.sort(out, function(a, c) return a.id < c.id end)
    return out
end

function Biz.Broadcast(target)
    TriggerClientEvent('XS-RestaurantSystem:client:businesses', target or -1, Biz.PublicAll())
end

function Biz.RefreshOpen()
    local onDuty = {}
    for _, src in ipairs(Framework.Players()) do
        local job = Framework.GetJob(src)
        if job and job.onDuty then onDuty[job.name] = (onDuty[job.name] or 0) + 1 end
    end
    local state, changed = {}, false
    for id, b in pairs(Biz.list) do
        local open = b.data.enabled and b.data.job ~= '' and (onDuty[b.data.job] or 0) > 0
        state[tostring(id)] = open
        if Biz.open[id] ~= open then changed = true end
        Biz.open[id] = open
    end
    for id in pairs(Biz.open) do
        if not Biz.list[id] then Biz.open[id] = nil changed = true end
    end
    if changed or GlobalState['xsr:open'] == nil then GlobalState['xsr:open'] = state end
end

function Biz.IsOpen(b)
    return b and Biz.open[b.id] == true or false
end

Biz.soldout = {}

function Biz.PublishSoldOut()
    local out = {}
    for id, map in pairs(Biz.soldout) do out[tostring(id)] = map end
    GlobalState['xsr:soldout'] = out
end

function Biz.LoadSoldOut()
    local row = MySQL.single.await('SELECT `data` FROM `xs_rest_settings` WHERE `name` = ?', { 'soldout' })
    local raw = row and Db.Decode(row.data, {}) or {}
    Biz.soldout = {}
    for id, map in pairs(type(raw) == 'table' and raw or {}) do
        local b = Biz.list[tonumber(id) or -1]
        if b and type(map) == 'table' then
            local keep = {}
            for menuId, on in pairs(map) do
                if on == true and Biz.MenuItem(b, menuId) then keep[menuId] = true end
            end
            if next(keep) then Biz.soldout[b.id] = keep end
        end
    end
    Biz.PublishSoldOut()
end

function Biz.IsSoldOut(b, menuId)
    local map = b and Biz.soldout[b.id]
    return map ~= nil and map[menuId] == true
end

function Biz.SetSoldOut(src, bizId, menuId, on)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    if not Biz.MenuItem(b, menuId) then return false, Text('err_failed') end
    local map = Biz.soldout[b.id] or {}
    map[menuId] = on == true or nil
    Biz.soldout[b.id] = next(map) and map or nil
    local out = {}
    for id, m in pairs(Biz.soldout) do out[tostring(id)] = m end
    MySQL.query.await('INSERT INTO `xs_rest_settings` (`name`, `data`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)', { 'soldout', Db.Json(out) })
    Biz.PublishSoldOut()
    return true
end

Biz.boss = {}

local function saveBoss()
    local out = {}
    for id, entry in pairs(Biz.boss) do out[tostring(id)] = entry end
    MySQL.query.await('INSERT INTO `xs_rest_settings` (`name`, `data`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `data` = VALUES(`data`)', { 'boss', Db.Json(out) })
end

function Biz.LoadBoss()
    local row = MySQL.single.await('SELECT `data` FROM `xs_rest_settings` WHERE `name` = ?', { 'boss' })
    local raw = row and Db.Decode(row.data, {}) or {}
    Biz.boss = {}
    for id, entry in pairs(type(raw) == 'table' and raw or {}) do
        local b = Biz.list[tonumber(id) or -1]
        if b and type(entry) == 'table' then
            local clean = { prices = {} }
            for menuId, price in pairs(type(entry.prices) == 'table' and entry.prices or {}) do
                if Biz.MenuItem(b, menuId) and tonumber(price) then clean.prices[menuId] = math.floor(tonumber(price)) end
            end
            if type(entry.phone) == 'boolean' then clean.phone = entry.phone end
            if type(entry.delivery) == 'boolean' then clean.delivery = entry.delivery end
            Biz.boss[b.id] = clean
        end
    end
end

function Biz.PriceRange(m)
    local pct = (Config.Boss.priceRangePct or 50) / 100
    return math.max(0, math.floor(m.price * (1 - pct))), math.ceil(m.price * (1 + pct))
end

function Biz.Price(b, m)
    local entry = b and Biz.boss[b.id]
    local price = entry and entry.prices[m.id]
    if not price or not Config.Boss.prices then return m.price end
    local low, high = Biz.PriceRange(m)
    return math.floor(Util.Clamp(price, low, high))
end

function Biz.Flag(b, key)
    local entry = b and Biz.boss[b.id]
    if entry and entry[key] ~= nil then return entry[key] and b.data[key] end
    return b.data[key] == true
end

function Biz.DeliveryFee(b)
    if b.data.deliveryFee >= 0 then return b.data.deliveryFee end
    return Config.Delivery.fee or 0
end

function Biz.SetPrice(src, bizId, menuId, price)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsBoss(src, b) then return false, Text('err_not_boss') end
    if not Config.Boss.prices then return false, Text('err_prices_off') end
    local m = Biz.MenuItem(b, menuId)
    if not m then return false, Text('err_failed') end
    local low, high = Biz.PriceRange(m)
    price = math.floor(tonumber(price) or m.price)
    if price < low or price > high then return false, Text('err_price_range', { low = low, high = high }) end
    local entry = Biz.boss[b.id] or { prices = {} }
    local before = Biz.Price(b, m)
    entry.prices[menuId] = price ~= m.price and price or nil
    Biz.boss[b.id] = entry
    saveBoss()
    Logs.Send(b, 'changes', Text('log_price'), { { Text('log_item'), Biz.Label(m.item, m.label) }, { Text('log_was'), ('$%d'):format(before) }, { Text('log_now'), ('$%d'):format(price) }, { Text('log_by'), Framework.GetName(src) or '' } })
    Biz.Broadcast()
    return true, { price = price }
end

function Biz.SetFlag(src, bizId, key, on)
    if key ~= 'phone' and key ~= 'delivery' then return false, Text('err_failed') end
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsBoss(src, b) then return false, Text('err_not_boss') end
    if not b.data[key] then return false, Text('err_flag_builder') end
    local entry = Biz.boss[b.id] or { prices = {} }
    entry[key] = on == true
    Biz.boss[b.id] = entry
    saveBoss()
    Biz.Broadcast()
    return true
end
