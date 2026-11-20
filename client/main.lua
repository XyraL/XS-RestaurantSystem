Rest = { list = {}, byId = {}, hooks = {}, offset = nil }

function Util.LoadModel(model, timeout)
    local hash = type(model) == 'number' and model or joaat(model)
    if not IsModelInCdimage(hash) then return false end
    if HasModelLoaded(hash) then return true end
    RequestModel(hash)
    local untilAt = GetGameTimer() + (timeout or 8000)
    while not HasModelLoaded(hash) and GetGameTimer() < untilAt do Wait(20) end
    return HasModelLoaded(hash)
end

function Util.Notify(msg, kind)
    if not msg or msg == '' then return end
    Framework.Notify(msg, kind)
end

function Rest.Call(name, ...)
    return UI.Await(name, ...)
end

function Rest.Set(list)
    Rest.list = type(list) == 'table' and list or {}
    Rest.byId = {}
    for _, b in ipairs(Rest.list) do Rest.byId[b.id] = b end
    for _, fn in ipairs(Rest.hooks) do
        local ok, err = pcall(fn)
        if not ok then print(('^1[XS-RestaurantSystem]^0 refresh failed: %s'):format(tostring(err))) end
    end
end

function Rest.OnChange(fn)
    Rest.hooks[#Rest.hooks + 1] = fn
end

function Rest.Get(id)
    return Rest.byId[tonumber(id) or -1]
end

function Rest.IsStaff(b, needDuty)
    if not b then return false end
    local data = Framework.PlayerData()
    if b.owner and b.owner ~= '' and data.citizenid == b.owner then return true end
    local job = Framework.Job()
    if not job or b.job == '' or job.name ~= b.job then return false end
    if needDuty == nil then needDuty = Config.Staff.needDuty end
    return not needDuty or job.onDuty
end

function Rest.IsBoss(b)
    if not b then return false end
    local data = Framework.PlayerData()
    if b.owner and b.owner ~= '' and data.citizenid == b.owner then return true end
    local job = Framework.Job()
    return job ~= nil and b.job ~= '' and job.name == b.job and job.isBoss == true
end

function Rest.CanBank(b, kind)
    if not b or not Config.Boss.bank then return false end
    if Rest.IsBoss(b) then return true end
    local need = (b.bank or {})[kind]
    if type(need) ~= 'number' or need < 0 or not Rest.IsStaff(b) then return false end
    local data = Framework.PlayerData()
    if b.owner and b.owner ~= '' and data.citizenid == b.owner then return true end
    local job = Framework.Job()
    return job ~= nil and (job.grade or 0) >= need
end

function Rest.CanOffice(b)
    return Rest.IsBoss(b) or Rest.CanBank(b, 'deposit') or Rest.CanBank(b, 'withdraw')
end

function Rest.IsOpen(b)
    local state = GlobalState['xsr:open'] or {}
    return b ~= nil and state[tostring(b.id)] == true
end

function Rest.Snapshot(value)
    if type(value) == 'table' and tonumber(value.now) then
        Rest.offset = tonumber(value.now) - GetCloudTimeAsInt()
    end
end

function Rest.Now()
    return GetCloudTimeAsInt() + (Rest.offset or 0)
end

function Rest.Brand(b)
    return { id = b.id, label = b.label, colors = b.colors, logo = b.logo, style = b.style, theme = b.theme }
end

function Rest.Distance(point)
    local c = GetEntityCoords(PlayerPedId())
    return #(c - vector3(point.x + 0.0, point.y + 0.0, point.z + 0.0))
end

function Rest.WatchRange(point, range, isOpen, close)
    CreateThread(function()
        while isOpen() do
            Wait(500)
            if isOpen() and Rest.Distance(point) > range then
                close()
                break
            end
        end
    end)
end

function Rest.Refresh()
    local ok, list = Rest.Call('businesses')
    if ok then Rest.Set(list) end
end

RegisterNetEvent('XS-RestaurantSystem:client:businesses', function(list)
    Rest.Set(list)
end)

AddStateBagChangeHandler(nil, 'global', function(_, key, value)
    if type(key) == 'string' and key:sub(1, 11) == 'xsr:orders:' then Rest.Snapshot(value) end
end)

CreateThread(function()
    while not Framework.name do Wait(200) end
    while not Framework.Loaded() do Wait(500) end
    Wait(1000)
    Rest.Refresh()
end)

Framework.OnLoaded(function()
    SetTimeout(1500, Rest.Refresh)
end)
