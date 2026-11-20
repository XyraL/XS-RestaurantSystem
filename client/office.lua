Office = { open = nil }

local function bossMenuResource()
    local forced = Config.Bridges.bossmenu or 'auto'
    if forced == 'none' then return nil end
    if forced ~= 'auto' then return forced end
    for _, name in ipairs({ 'qbx_management', 'qb-management' }) do
        if GetResourceState(name) == 'started' then return name end
    end
end

local function load(bizId)
    local ok, data = Rest.Call('bossData', bizId)
    if not ok then return false, data end
    data.bossmenu = bossMenuResource() ~= nil
    return true, data
end

function Office.Open(b, point)
    if not Rest.CanOffice(b) then return Util.Notify(Text('err_not_boss'), 'error') end
    local ok, data = load(b.id)
    if not ok then return Util.Notify(data, 'error') end
    Office.open = { biz = b.id, point = point.id }
    UI.Send('boss', 'open', data)
    UI.Focus('boss', true)
    Rest.WatchRange(point, 6.0, function() return Office.open ~= nil and Office.open.point == point.id end, Office.Close)
end

function Office.Close()
    if not Office.open then return end
    Office.open = nil
    UI.Send('boss', 'close', {})
    UI.Focus('boss', false)
end

UI.OnClose('boss', Office.Close)

UI.Handle('boss:refresh', function()
    local o = Office.open
    if not o then return false end
    return load(o.biz)
end)

UI.Handle('boss:price', function(p)
    local o = Office.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('bossPrice', o.biz, p.id, p.price)
end)

UI.Handle('boss:flag', function(p)
    local o = Office.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('bossFlag', o.biz, p.key, p.on == true)
end)

UI.Handle('boss:soldout', function(p)
    local o = Office.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('soldOut', o.biz, p.id, p.on == true)
end)

UI.Handle('boss:supply', function(p)
    local o = Office.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('supplyOrder', o.biz, p.lines, p.mode)
end)

UI.Handle('boss:bank', function(p)
    local o = Office.open
    if not o then return false end
    p = type(p) == 'table' and p or {}
    return Rest.Call('bossBank', o.biz, p.kind, p.amount, p.account)
end)

UI.Handle('boss:menu', function()
    local res = bossMenuResource()
    if not res then return false, Text('err_no_bossmenu') end
    Office.Close()
    CreateThread(function()
        Wait(150)
        if res == 'qbx_management' then
            local ok = pcall(function() exports.qbx_management:OpenBossMenu('job') end)
            if not ok then TriggerEvent('qb-bossmenu:client:OpenMenu') end
        else
            TriggerEvent('qb-bossmenu:client:OpenMenu')
        end
    end)
    return true
end)
