Logs = {}

local function colour(hex)
    hex = tostring(hex or ''):gsub('#', '')
    return tonumber(hex, 16) or 16742473
end

function Logs.Hook(b)
    if b and b.data.webhook ~= '' then return b.data.webhook end
    local shared = GetConvar('xs_restaurant_webhook', '')
    if shared:match('^https://') then return shared end
    return nil
end

function Logs.Send(b, kind, title, fields)
    if not Config.Logs[kind] then return end
    local hook = Logs.Hook(b)
    if not hook then return end
    local list = {}
    for _, f in ipairs(fields or {}) do
        if f[2] ~= nil and tostring(f[2]) ~= '' then list[#list + 1] = { name = tostring(f[1]), value = tostring(f[2]):sub(1, 1000), inline = f[3] ~= false } end
    end
    local payload = {
        username = 'XS-RestaurantSystem',
        embeds = { {
            title = title, color = colour(b and b.data.colors.accent), fields = list,
            footer = { text = b and ('%s · #%d'):format(b.data.label, b.id) or 'XS-RestaurantSystem' },
            timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
        } },
    }
    PerformHttpRequest(hook, function() end, 'POST', json.encode(payload), { ['Content-Type'] = 'application/json' })
end

function Logs.Lines(lines)
    local out = {}
    for _, l in ipairs(lines or {}) do out[#out + 1] = ('%dx %s'):format(l.qty or l.count or 1, l.label or l.item or '?') end
    return table.concat(out, '\n')
end
