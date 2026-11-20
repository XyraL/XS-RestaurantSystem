Settings = { fields = {}, byKey = {} }

local RESET = { 'daily', 'never' }
local CLOSED = { 'grey', 'hide', 'same' }
local SUPPLY = { 'both', 'delivery', 'pickup' }

Settings.Sections = {
    { id = 'orders', icon = 'receipt', fields = {
        { 'Orders.customerRange', 'num', min = 1, max = 20, step = 0.5, unit = 'm' },
        { 'Orders.payTimeout', 'int', min = 10, max = 300, unit = 's' },
        { 'Orders.card', 'bool' },
        { 'Orders.cash', 'bool' },
        { 'Orders.onTheHouse', 'bool' },
        { 'Orders.businessPct', 'pct' },
        { 'Orders.cashierPct', 'pct' },
        { 'Orders.maxLines', 'int', min = 1, max = 60 },
        { 'Orders.maxQuantity', 'int', min = 1, max = 100 },
        { 'Orders.maxOpen', 'int', min = 1, max = 200 },
        { 'Orders.refundOnCancel', 'bool' },
        { 'Orders.resetNumbers', 'select', options = RESET },
    } },
    { id = 'kitchen', icon = 'chef', fields = {
        { 'Orders.lateMinutes', 'int', min = 1, max = 120, unit = 'min' },
        { 'Orders.readyMinutes', 'int', min = 1, max = 240, unit = 'min' },
        { 'Orders.names', 'bool' },
        { 'Orders.notifyReady', 'bool' },
        { 'Orders.handOver', 'bool' },
        { 'Orders.handOverRange', 'num', min = 1, max = 15, step = 0.5, unit = 'm', needs = 'Orders.handOver' },
    } },
    { id = 'cooking', icon = 'flame', fields = {
        { 'Cooking.minigames', 'bool' },
        { 'Cooking.difficulty', 'num', min = 0.5, max = 2, step = 0.1 },
        { 'Cooking.needIngredients', 'bool' },
        { 'Cooking.failLoses', 'bool', needs = 'Cooking.needIngredients' },
        { 'Cooking.maxBatch', 'int', min = 1, max = 20 },
        { 'Cooking.range', 'num', min = 1, max = 6, step = 0.5, unit = 'm' },
        { 'Cooking.animations', 'bool' },
    } },
    { id = 'staff', icon = 'users', fields = {
        { 'Staff.needDuty', 'bool' },
        { 'Staff.storageNeedsDuty', 'bool' },
    } },
    { id = 'front', icon = 'store', fields = {
        { 'Kiosk.enabled', 'bool' },
        { 'Kiosk.onePerPerson', 'bool', needs = 'Kiosk.enabled' },
        { 'Drive.enabled', 'bool' },
        { 'Drive.voice', 'bool', needs = 'Drive.enabled' },
        { 'Drive.range', 'num', min = 2, max = 15, step = 0.5, unit = 'm', needs = 'Drive.enabled' },
        { 'Seats.enabled', 'bool' },
        { 'Screens.boardSeconds', 'int', min = 3, max = 60, unit = 's' },
    } },
    { id = 'business', icon = 'cash', fields = {
        { 'Supply.enabled', 'bool' },
        { 'Supply.mode', 'select', options = SUPPLY, needs = 'Supply.enabled' },
        { 'Supply.deliveryMinutes', 'int', min = 0, max = 120, unit = 'min', needs = 'Supply.enabled' },
        { 'Supply.pickupMinutes', 'int', min = 0, max = 120, unit = 'min', needs = 'Supply.enabled' },
        { 'Supply.expireMinutes', 'int', min = 5, max = 1440, unit = 'min', needs = 'Supply.enabled' },
        { 'Delivery.enabled', 'bool' },
        { 'Delivery.fee', 'int', min = 0, max = 10000, unit = '$', needs = 'Delivery.enabled' },
        { 'Delivery.maxDistance', 'num', min = 100, max = 15000, step = 50, unit = 'm', needs = 'Delivery.enabled' },
        { 'Delivery.range', 'num', min = 2, max = 20, step = 0.5, unit = 'm', needs = 'Delivery.enabled' },
        { 'Phone.app', 'bool' },
        { 'Boss.prices', 'bool' },
        { 'Boss.priceRangePct', 'pct', needs = 'Boss.prices' },
        { 'Boss.bank', 'bool' },
        { 'Boss.bankMax', 'int', min = 100, max = 100000000, unit = '$', needs = 'Boss.bank' },
        { 'Logs.sales', 'bool' },
        { 'Logs.refunds', 'bool' },
        { 'Logs.supplies', 'bool' },
        { 'Logs.deliveries', 'bool' },
        { 'Logs.changes', 'bool' },
        { 'Logs.bank', 'bool' },
    } },
    { id = 'world', icon = 'monitor', fields = {
        { 'Screens.enabled', 'bool' },
        { 'Screens.drawDistance', 'num', min = 5, max = 60, step = 1, unit = 'm', needs = 'Screens.enabled' },
        { 'Screens.maxLive', 'int', min = 1, max = 16, needs = 'Screens.enabled' },
        { 'Props.enabled', 'bool' },
        { 'Props.range', 'num', min = 20, max = 200, step = 5, unit = 'm', needs = 'Props.enabled' },
        { 'Blips.enabled', 'bool' },
        { 'Blips.whenClosed', 'select', options = CLOSED, needs = 'Blips.enabled' },
    } },
}

for _, section in ipairs(Settings.Sections) do
    local list = {}
    for _, raw in ipairs(section.fields) do
        local def = { key = raw[1], type = raw[2], section = section.id }
        for k, v in pairs(raw) do
            if type(k) == 'string' then def[k] = v end
        end
        list[#list + 1] = def
        Settings.fields[#Settings.fields + 1] = def
        Settings.byKey[def.key] = def
    end
    section.fields = list
end

local function path(key)
    local parts = {}
    for part in key:gmatch('[^%.]+') do parts[#parts + 1] = tonumber(part) or part end
    return parts
end

function Settings.Read(key)
    local node = Config
    for _, part in ipairs(path(key)) do
        if type(node) ~= 'table' then return nil end
        node = node[part]
    end
    return node
end

function Settings.Write(key, value)
    local parts = path(key)
    local node = Config
    for i = 1, #parts - 1 do
        if type(node[parts[i]]) ~= 'table' then node[parts[i]] = {} end
        node = node[parts[i]]
    end
    node[parts[#parts]] = value
end

function Settings.Same(a, b)
    if type(a) ~= type(b) then return false end
    if type(a) ~= 'table' then return a == b end
    if #a ~= #b then return false end
    for k, v in pairs(a) do
        if not Settings.Same(v, b[k]) then return false end
    end
    for k in pairs(b) do
        if a[k] == nil then return false end
    end
    return true
end

local function slug(value, max)
    return (tostring(value or ''):lower():gsub('[^%w_%-]', '')):sub(1, max or 48)
end

local function within(def, n)
    if def.min and n < def.min then n = def.min end
    if def.max and n > def.max then n = def.max end
    return n
end

function Settings.Clean(def, value)
    local kind = def.type
    if kind == 'bool' then
        if type(value) == 'boolean' then return value end
        if value == 1 or value == '1' or value == 'true' then return true end
        if value == 0 or value == '0' or value == 'false' then return false end
        return nil
    elseif kind == 'int' or kind == 'grade' or kind == 'pct' then
        local n = tonumber(value)
        if not n or n ~= n then return nil end
        n = math.floor(n + 0.5)
        if kind == 'grade' then return math.max(0, math.min(50, n)) end
        if kind == 'pct' then return math.max(0, math.min(100, n)) end
        return within(def, n)
    elseif kind == 'num' then
        local n = tonumber(value)
        if not n or n ~= n then return nil end
        local step = def.step or 0.1
        n = math.floor(n / step + 0.5) * step
        n = math.floor(n * 1000 + 0.5) / 1000
        return within(def, n)
    elseif kind == 'text' then
        if value == nil or type(value) == 'table' then return nil end
        local s = Util.Text(value, 220)
        if def.slug then s = slug(s, 96) end
        s = s:sub(1, def.max or 64)
        if s == '' and not def.empty then return nil end
        return s
    elseif kind == 'select' then
        for _, option in ipairs(def.options or {}) do
            if option == value then return value end
        end
        return nil
    elseif kind == 'item' then
        local s = (value == false or value == nil) and '' or slug(value, 64)
        if s ~= '' then return s end
        if def.off then return false end
        return nil
    elseif kind == 'list' then
        if type(value) ~= 'table' then return nil end
        local out, seen = {}, {}
        for _, v in ipairs(value) do
            local s = def.slug and slug(v, 48) or Util.Text(v, 48)
            if s ~= '' and not seen[s] and #out < (def.max or 20) then
                seen[s] = true
                out[#out + 1] = s
            end
        end
        return out
    elseif kind == 'nums' then
        if type(value) ~= 'table' then return nil end
        local out, seen = {}, {}
        for _, v in ipairs(value) do
            local n = tonumber(v)
            if n then
                n = within(def, math.floor(n + 0.5))
                if not seen[n] and #out < (def.count or 10) then
                    seen[n] = true
                    out[#out + 1] = n
                end
            end
        end
        table.sort(out)
        if #out == 0 then return nil end
        return out
    elseif kind == 'seq' then
        if type(value) ~= 'table' then return nil end
        local allowed = {}
        for _, option in ipairs(def.options or {}) do allowed[option] = true end
        local out = {}
        for _, v in ipairs(value) do
            if allowed[v] and #out < (def.max or 5) then out[#out + 1] = v end
        end
        if #out == 0 then return nil end
        return out
    end
    return nil
end

function Settings.Apply(values)
    if type(values) ~= 'table' then return end
    for key, value in pairs(values) do
        local def = Settings.byKey[key]
        if def then
            local clean = Settings.Clean(def, value)
            if clean ~= nil then Settings.Write(key, clean) end
        end
    end
end

function Settings.Public()
    local sections = {}
    for _, section in ipairs(Settings.Sections) do
        local fields = {}
        for _, def in ipairs(section.fields) do
            local out = {}
            for k, v in pairs(def) do out[k] = v end
            fields[#fields + 1] = out
        end
        sections[#sections + 1] = { id = section.id, icon = section.icon, fields = fields }
    end
    return sections
end
