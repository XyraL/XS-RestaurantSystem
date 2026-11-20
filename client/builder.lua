Builder = { open = false }

local function here()
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    return { x = Util.Round(pos.x, 3), y = Util.Round(pos.y, 3), z = Util.Round(pos.z - 0.98, 3), w = Util.Round(GetEntityHeading(ped), 2) }
end

local function show(on)
    Builder.open = on
    UI.Focus('builder', on)
    UI.Send('builder', on and 'show' or 'hide', {})
end

local function load()
    local ok, data = Rest.Call('builderData')
    if not ok then return false, data end
    data.here = here()
    data.system = data.system or {}
    data.system.target = Target.Detect()
    return true, data
end

function Builder.Open()
    local ok, data = load()
    if not ok then return Util.Notify(data or Text('err_not_admin'), 'error') end
    UI.Send('builder', 'open', data)
    Builder.open = true
    UI.Focus('builder', true)
end

RegisterCommand(Config.Commands.builder, function()
    Builder.Open()
end, false)

UI.OnClose('builder', function()
    Builder.open = false
    UI.Focus('builder', false)
    UI.Send('builder', 'hide', {})
end)

UI.Handle('b:refresh', function() return load() end)
UI.Handle('b:here', function() return true, here() end)

UI.Handle('b:save', function(p)
    p = type(p) == 'table' and p or {}
    return Rest.Call('builderSave', p.id, p.data)
end)

UI.Handle('b:delete', function(p)
    p = type(p) == 'table' and p or {}
    return Rest.Call('builderDelete', p.id)
end)

UI.Handle('b:players', function(p)
    return Rest.Call('builderPlayers', type(p) == 'table' and p.q or '')
end)

UI.Handle('b:stats', function()
    return Rest.Call('builderStats')
end)

UI.Handle('b:settings', function(p)
    return UI.Await('builderSettingsSave', p)
end)

UI.Handle('b:place', function(p)
    p = type(p) == 'table' and p or {}
    local wall = p.kind == 'kitchen' or p.kind == 'pickup' or p.kind == 'menuboard' or p.kind == 'kiosk'
    local dock = p.kind == 'dock'
    local model = (not wall and p.model and p.model ~= '') and p.model or nil
    if dock then model = Config.Supply.van or 'mule' end
    show(false)
    local ok, at = pcall(Placement.Start, {
        label = p.label, mode = wall and 'wall' or 'point', width = tonumber(p.width) or 1.2, ratio = tonumber(p.ratio) or 0.5625,
        previewModel = model, previewVehicle = dock or nil, origin = p.origin, existing = p.existing,
        allowNoProp = model ~= nil and not dock, noProp = p.noProp == true,
    })
    show(true)
    if not ok then
        print(('^1[XS-RestaurantSystem]^0 placing failed: %s'):format(tostring(at)))
        return false, Text('err_failed')
    end
    if not at then return true, false end
    return true, { x = Util.Round(at.x, 3), y = Util.Round(at.y, 3), z = Util.Round(at.z, 3), w = Util.Round(at.w or 0.0, 2), width = wall and Util.Round(at.width or 1.2, 2) or nil, noProp = at.noProp == true }
end)

UI.Handle('b:warehouse', function(p)
    return Rest.Call('builderWarehouse', type(p) == 'table' and p.x and p or false)
end)

UI.Handle('b:goto', function(p)
    p = type(p) == 'table' and p or {}
    local x, y, z = tonumber(p.x), tonumber(p.y), tonumber(p.z)
    if not x or not y or not z then return false end
    local ped = PlayerPedId()
    RequestCollisionAtCoord(x + 0.0, y + 0.0, z + 0.0)
    SetEntityCoords(ped, x + 0.0, y + 0.0, z + 0.2, false, false, false, false)
    if p.w then SetEntityHeading(ped, (tonumber(p.w) or 0.0) + 0.0) end
    return true
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if Placement.active then Placement.Abort() end
end)
