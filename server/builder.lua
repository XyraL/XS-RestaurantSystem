Builder = {}

function Builder.Allowed(src)
    return Framework.IsAdmin(src)
end

local function jobsWithGrades()
    local list
    if Framework.name == 'qbox' then
        local ok, jobs = pcall(function() return exports.qbx_core:GetJobs() end)
        list = ok and jobs or {}
    elseif Framework.core then
        list = Framework.core.Shared.Jobs
    end
    local out = {}
    for name, def in pairs(list or {}) do
        local onDuty = 0
        for _, src in ipairs(Framework.OnDutyJob(name)) do onDuty = onDuty + (src and 1 or 0) end
        local grades = {}
        for level, g in pairs(def.grades or {}) do
            local n = tonumber(level)
            if n and type(g) == 'table' then grades[#grades + 1] = { level = n, name = g.name or g.label or tostring(n), boss = g.isboss == true } end
        end
        table.sort(grades, function(a, b) return a.level < b.level end)
        out[#out + 1] = { name = name, label = def.label or name, onDuty = onDuty, grades = grades }
    end
    table.sort(out, function(a, b) return a.label < b.label end)
    return out
end

function Builder.Stats()
    local out = {}
    for id in pairs(Biz.list) do
        local ok, today = pcall(Orders.Today, id)
        local open = 0
        for _, o in pairs(Orders.open) do
            if o.biz == id then open = open + 1 end
        end
        out[tostring(id)] = { orders = ok and today.orders or 0, sales = ok and today.sales or 0, open = open, staff = Biz.IsOpen(Biz.list[id]) }
    end
    return out
end

function Builder.Data(src)
    local list = {}
    for id, b in pairs(Biz.list) do list[#list + 1] = { id = id, data = Util.Copy(b.data) } end
    table.sort(list, function(a, b) return a.id < b.id end)
    return {
        businesses = list,
        jobs = jobsWithGrades(),
        items = Inventory.Items(),
        settings = Settings.Builder(),
        stats = Builder.Stats(),
        styles = Data.Styles,
        themes = Data.Themes,
        stations = Data.Stations,
        seats = Data.Seats,
        warehouse = Supply.warehouse,
        games = Data.Games,
        system = { framework = Framework.name, inventory = Inventory.name, banking = Banking.Ready() and Banking.name or nil, voice = GetResourceState('pma-voice') == 'started', phone = Phone.name, webhook = GetConvar('xs_restaurant_webhook', '') ~= '' },
        me = { name = Framework.GetName(src) or GetPlayerName(src) or '', cid = Framework.GetCitizenId(src) },
    }
end

function Builder.Save(src, id, data)
    local newId, saved = Biz.Save(id, data)
    if not newId then return false, Text('err_failed') end
    Biz.Broadcast()
    Orders.Publish(newId)
    print(('^2[XS-RestaurantSystem]^0 %s saved %s (#%d).'):format(GetPlayerName(src) or src, saved.label, newId))
    return true, { id = newId, data = saved }
end

function Builder.Delete(src, id)
    id = tonumber(id)
    local b = Biz.Get(id)
    if not b then return false, Text('err_no_business') end
    for oid, o in pairs(Orders.open) do
        if o.biz == id then Orders.Close(o, 'expired') Orders.open[oid] = nil end
    end
    Biz.Delete(id)
    Seats.Clear(id)
    for sid, s in pairs(Supply.open) do if s.biz == id then Supply.open[sid] = nil end end
    Supply.Publish()
    Biz.boss[id] = nil
    for src in pairs(Drive.waiting[id] or {}) do Drive.Hangup(src) end
    Drive.waiting[id] = nil
    GlobalState['xsr:drive:' .. tostring(id)] = nil
    GlobalState['xsr:orders:' .. tostring(id)] = nil
    Biz.Broadcast()
    print(('^3[XS-RestaurantSystem]^0 %s deleted %s (#%d).'):format(GetPlayerName(src) or src, b.data.label, id))
    return true
end

function Builder.Players(_, query)
    query = Util.Text(query, 40):lower()
    local out, seen = {}, {}
    for _, src in ipairs(Framework.Players()) do
        local cid = Framework.GetCitizenId(src)
        local name = Framework.GetName(src) or ''
        if cid and (query == '' or name:lower():find(query, 1, true) or cid:lower():find(query, 1, true)) then
            seen[cid] = true
            out[#out + 1] = { cid = cid, name = name, online = true }
        end
    end
    if #query >= 2 and #out < 12 then
        local rows = MySQL.query.await('SELECT `citizenid`, `charinfo` FROM `players` WHERE `citizenid` LIKE ? OR `charinfo` LIKE ? LIMIT 20', { '%' .. query .. '%', '%' .. query .. '%' }) or {}
        for _, row in ipairs(rows) do
            if row.citizenid and not seen[row.citizenid] then
                local ci = Db.Decode(row.charinfo, {})
                out[#out + 1] = { cid = row.citizenid, name = Framework.FullName(ci), online = false }
                seen[row.citizenid] = true
            end
        end
    end
    while #out > 20 do table.remove(out) end
    return true, out
end

function Builder.Problems(b)
    local out = {}
    local d = b.data
    local add = function(key) out[#out + 1] = key end
    if d.job == '' then add('no_job') end
    if #d.points.register == 0 then add('no_register') end
    if #d.points.kitchen == 0 then add('no_kitchen') end
    if #d.points.counter == 0 then add('no_counter') end
    if #d.menu == 0 then add('no_menu') end
    return out
end
