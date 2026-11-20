Points = { keys = {}, props = {}, wanted = {}, blips = {} }

local function v3(p)
    return vector3(p.x + 0.0, p.y + 0.0, p.z + 0.0)
end

local function stationLabel(p)
    if p.label and p.label ~= '' then return p.label end
    return Text('station_' .. p.type)
end

local function propFor(kind, p)
    if p.prop == false then return nil end
    if p.model and p.model ~= '' then return p.model end
    if kind == 'register' then return Data.Register.prop end
    if kind == 'speaker' then return Data.Speaker.prop end
    if kind == 'office' then return Data.Office.prop end
    local def = Data.byStation[p.type]
    return def and def.prop ~= '' and def.prop or nil
end

local function screenCenter(p)
    local h = math.rad(p.w or 0.0)
    return vector3(p.x - math.sin(h) * 0.35, p.y + math.cos(h) * 0.35, p.z - 0.5)
end

local function addTarget(key, coords, radius, options)
    Target.AddPoint(key, coords, radius, options)
    Points.keys[#Points.keys + 1] = key
end

local function clearTargets()
    for _, key in ipairs(Points.keys) do Target.Remove(key) end
    Points.keys = {}
end

local function despawn(key)
    local obj = Points.props[key]
    if obj and DoesEntityExist(obj) then DeleteObject(obj) end
    Points.props[key] = nil
end

local function spawn(key, want)
    local hash = joaat(want.model)
    local existing = GetClosestObjectOfType(want.x, want.y, want.z, 0.6, hash, false, false, false)
    if existing and existing ~= 0 then
        Points.props[key] = false
        return
    end
    if not Util.LoadModel(hash, 5000) then
        Points.props[key] = false
        return
    end
    local obj = CreateObjectNoOffset(hash, want.x + 0.0, want.y + 0.0, want.z + 0.0, false, false, false)
    SetEntityHeading(obj, (want.w or 0.0) + 0.0)
    FreezeEntityPosition(obj, true)
    SetModelAsNoLongerNeeded(hash)
    Points.props[key] = obj
end

function Points.Build()
    clearTargets()
    local wanted = {}
    for _, b in ipairs(Rest.list) do
        local P = b.points or {}
        local staff = function() return Rest.IsStaff(b) end
        for _, p in ipairs(P.register or {}) do
            addTarget(('b%d_reg_%s'):format(b.id, p.id), v3(p), 1.0, {
                { label = Text('opt_register'), icon = 'fas fa-cash-register', onSelect = function() Register.Open(b, p) end, canInteract = staff },
            })
            local model = propFor('register', p)
            if model then wanted[('b%d_reg_%s'):format(b.id, p.id)] = { model = model, x = p.x, y = p.y, z = p.z, w = p.w } end
        end
        for _, p in ipairs(P.station or {}) do
            addTarget(('b%d_st_%s'):format(b.id, p.id), v3(p) + vector3(0.0, 0.0, 0.4), 1.0, {
                { label = Text('opt_station', { station = stationLabel(p) }), icon = 'fas fa-fire-burner', onSelect = function() Cook.Open(b, p) end, canInteract = staff },
            })
            local model = propFor('station', p)
            if model then wanted[('b%d_st_%s'):format(b.id, p.id)] = { model = model, x = p.x, y = p.y, z = p.z, w = p.w } end
        end
        for _, p in ipairs(P.kitchen or {}) do
            addTarget(('b%d_ki_%s'):format(b.id, p.id), screenCenter(p), 1.1, {
                { label = Text('opt_kitchen'), icon = 'fas fa-receipt', onSelect = function() Kitchen.Open(b, 'kitchen', p) end, canInteract = staff },
            })
        end
        for _, p in ipairs(P.counter or {}) do
            addTarget(('b%d_co_%s'):format(b.id, p.id), v3(p) + vector3(0.0, 0.0, 0.4), 1.1, {
                { label = Text('opt_counter'), icon = 'fas fa-bag-shopping', onSelect = function() Kitchen.Open(b, 'counter', p) end, canInteract = staff },
            })
        end
        for _, p in ipairs(P.kiosk or {}) do
            addTarget(('b%d_kio_%s'):format(b.id, p.id), screenCenter(p), 0.9, {
                { label = Text('opt_kiosk'), icon = 'fas fa-tablet-screen-button', onSelect = function() Kiosk.Open(b, p) end, canInteract = function() return Config.Kiosk.enabled end },
            })
        end
        for _, p in ipairs(P.seat or {}) do
            local key = ('%d:%s'):format(b.id, p.id)
            addTarget(('b%d_seat_%s'):format(b.id, p.id), v3(p) + vector3(0.0, 0.0, 0.5), 0.7, {
                { label = Text('opt_sit'), icon = 'fas fa-chair', onSelect = function() SeatsClient.Sit(b, p) end, canInteract = function() return Config.Seats.enabled and not SeatsClient.current and not (GlobalState['xsr:seats'] or {})[key] end },
            })
        end
        for _, p in ipairs(P.speaker or {}) do
            local model = propFor('speaker', p)
            if model then wanted[('b%d_spk_%s'):format(b.id, p.id)] = { model = model, x = p.x, y = p.y, z = p.z, w = p.w } end
        end
        for _, p in ipairs(P.office or {}) do
            addTarget(('b%d_off_%s'):format(b.id, p.id), v3(p) + vector3(0.0, 0.0, 0.2), 0.9, {
                { label = Text('opt_office'), icon = 'fas fa-chart-line', onSelect = function() Office.Open(b, p) end, canInteract = function() return Rest.CanOffice(b) end },
            })
            local model = propFor('office', p)
            if model then wanted[('b%d_off_%s'):format(b.id, p.id)] = { model = model, x = p.x, y = p.y, z = p.z, w = p.w } end
        end
        for _, p in ipairs(P.storage or {}) do
            addTarget(('b%d_sto_%s'):format(b.id, p.id), v3(p) + vector3(0.0, 0.0, 0.4), 1.1, {
                { label = p.label ~= '' and p.label or Text('opt_storage'), icon = 'fas fa-box-open', onSelect = function() Points.OpenStorage(b, p) end, canInteract = function() return Rest.IsStaff(b, Config.Staff.storageNeedsDuty) end },
            })
        end
    end
    for key in pairs(Points.props) do
        local w, old = wanted[key], Points.wanted[key]
        if not w or not old or w.model ~= old.model or w.x ~= old.x or w.y ~= old.y or w.z ~= old.z or w.w ~= old.w then despawn(key) end
    end
    Points.wanted = wanted
    Points.Blips()
end

function Points.OpenStorage(b, p)
    local ok, res = Rest.Call('storage', b.id, p.id)
    if not ok then return Util.Notify(res, 'error') end
    if res.mode ~= 'server' then Inventory.OpenStash(res.mode, res.id, res.label, res.slots, res.weight) end
end

local function blipPoint(b)
    if b.blip and b.blip.at then return b.blip.at end
    local P = b.points or {}
    for _, kind in ipairs(Data.PointKinds) do
        if P[kind] and P[kind][1] then return P[kind][1] end
    end
end

local function clearBlips()
    for _, blip in pairs(Points.blips) do
        if DoesBlipExist(blip.handle) then RemoveBlip(blip.handle) end
    end
    Points.blips = {}
end

local function styleBlip(entry, b)
    local open = Rest.IsOpen(b)
    local mode = b.blip.whenClosed ~= 'default' and b.blip.whenClosed or Config.Blips.whenClosed
    local hidden = not open and mode == 'hide'
    if hidden then
        if entry.handle and DoesBlipExist(entry.handle) then RemoveBlip(entry.handle) end
        entry.handle, entry.open = nil, open
        return
    end
    if not entry.handle or not DoesBlipExist(entry.handle) then
        local at = entry.at
        entry.handle = AddBlipForCoord(at.x + 0.0, at.y + 0.0, at.z + 0.0)
        SetBlipSprite(entry.handle, b.blip.sprite)
        SetBlipScale(entry.handle, b.blip.scale + 0.0)
        SetBlipAsShortRange(entry.handle, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(b.blip.label ~= '' and b.blip.label or b.label)
        EndTextCommandSetBlipName(entry.handle)
    end
    SetBlipColour(entry.handle, (not open and mode == 'grey') and 40 or b.blip.colour)
    entry.open = open
end

function Points.Blips()
    clearBlips()
    if not Config.Blips.enabled then return end
    for _, b in ipairs(Rest.list) do
        local at = b.blip and b.blip.show and blipPoint(b)
        if at then
            local entry = { at = at, biz = b.id }
            Points.blips[b.id] = entry
            styleBlip(entry, b)
        end
    end
end

CreateThread(function()
    while true do
        Wait(5000)
        for id, entry in pairs(Points.blips) do
            local b = Rest.Get(id)
            if b and entry.open ~= Rest.IsOpen(b) then styleBlip(entry, b) end
        end
    end
end)

CreateThread(function()
    while true do
        local sleep = 1500
        if Config.Props.enabled and next(Points.wanted) then
            local pos = GetEntityCoords(PlayerPedId())
            local range = Config.Props.range or 60.0
            for key, want in pairs(Points.wanted) do
                local d = #(pos - vector3(want.x + 0.0, want.y + 0.0, want.z + 0.0))
                if d < range and Points.props[key] == nil then
                    spawn(key, want)
                    sleep = 200
                elseif d > range + 10.0 and Points.props[key] ~= nil then
                    despawn(key)
                end
            end
        elseif next(Points.props) then
            for key in pairs(Points.props) do despawn(key) end
        end
        Wait(sleep)
    end
end)

Rest.OnChange(Points.Build)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    clearTargets()
    for key in pairs(Points.props) do despawn(key) end
    clearBlips()
end)
