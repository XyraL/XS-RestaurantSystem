SupplyClient = { vans = {}, warehouseKey = nil, blip = nil }

local function despawn(id)
    local v = SupplyClient.vans[id]
    if not v then return end
    Target.RemoveEntity('van_' .. id)
    if v.entity and DoesEntityExist(v.entity) then DeleteVehicle(v.entity) end
    SupplyClient.vans[id] = nil
end

local function spawn(b, dock)
    local hash = joaat(Config.Supply.van or 'mule')
    if not Util.LoadModel(hash, 6000) then return nil end
    local veh = CreateVehicle(hash, dock.x + 0.0, dock.y + 0.0, dock.z + 0.0, (dock.w or 0.0) + 0.0, false, true)
    SetVehicleOnGroundProperly(veh)
    FreezeEntityPosition(veh, true)
    SetVehicleDoorsLocked(veh, 2)
    SetEntityInvincible(veh, true)
    SetVehicleDoorOpen(veh, 2, false, false)
    SetVehicleDoorOpen(veh, 3, false, false)
    SetModelAsNoLongerNeeded(hash)
    Target.AddEntity('van_' .. b.id, veh, {
        { label = Text('opt_unload'), icon = 'fas fa-boxes-stacked', canInteract = function() return Rest.IsStaff(b) end, onSelect = function()
            local ok, res = Rest.Call('supplyCollect', 'delivery', b.id)
            Util.Notify(ok and Text('supply_unloaded') or res, ok and 'success' or 'error')
        end },
    })
    return veh
end

local function myPickups()
    local waiting = GlobalState['xsr:pickups'] or {}
    for _, b in ipairs(Rest.list) do
        if (waiting[tostring(b.id)] or 0) > 0 and Rest.IsStaff(b, false) then return true end
    end
    return false
end

local function warehouseTarget()
    local wh = GlobalState['xsr:warehouse']
    local key = wh and wh.x and ('%.1f_%.1f_%.1f'):format(wh.x, wh.y, wh.z) or nil
    if key == SupplyClient.warehouseKey then return end
    if SupplyClient.warehouseKey then Target.Remove('warehouse') end
    SupplyClient.warehouseKey = key
    if not key then return end
    Target.AddPoint('warehouse', vector3(wh.x + 0.0, wh.y + 0.0, wh.z + 0.6), 1.4, {
        { label = Text('opt_collect'), icon = 'fas fa-dolly', canInteract = myPickups, onSelect = function()
            local ok, res = Rest.Call('supplyCollect', 'pickup')
            Util.Notify(ok and Text('supply_collected', { n = res.orders }) or res, ok and 'success' or 'error')
        end },
    })
end

local function warehouseBlip()
    local wh = GlobalState['xsr:warehouse']
    local want = wh and wh.x and myPickups()
    if want and not SupplyClient.blip then
        SupplyClient.blip = AddBlipForCoord(wh.x + 0.0, wh.y + 0.0, wh.z + 0.0)
        SetBlipSprite(SupplyClient.blip, 478)
        SetBlipColour(SupplyClient.blip, 47)
        SetBlipScale(SupplyClient.blip, 0.85)
        SetBlipAsShortRange(SupplyClient.blip, false)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(Text('blip_warehouse'))
        EndTextCommandSetBlipName(SupplyClient.blip)
    elseif not want and SupplyClient.blip then
        RemoveBlip(SupplyClient.blip)
        SupplyClient.blip = nil
    end
end

CreateThread(function()
    while true do
        Wait(2000)
        local vans = GlobalState['xsr:vans'] or {}
        local pos = GetEntityCoords(PlayerPedId())
        for _, b in ipairs(Rest.list) do
            local dock = (b.points or {}).dock and b.points.dock[1]
            local want = dock and (vans[tostring(b.id)] or 0) > 0 and #(pos - vector3(dock.x + 0.0, dock.y + 0.0, dock.z + 0.0)) < 150.0
            local have = SupplyClient.vans[b.id]
            if want and not have then
                local veh = spawn(b, dock)
                if veh then SupplyClient.vans[b.id] = { entity = veh } end
            elseif not want and have then
                despawn(b.id)
            end
        end
        for id in pairs(SupplyClient.vans) do
            if not Rest.Get(id) then despawn(id) end
        end
        warehouseTarget()
        warehouseBlip()
    end
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    for id in pairs(SupplyClient.vans) do despawn(id) end
    if SupplyClient.blip then RemoveBlip(SupplyClient.blip) end
end)
