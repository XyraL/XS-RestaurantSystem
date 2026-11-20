Drive = { waiting = {}, calls = {}, pressed = {}, nextChannel = 0 }

local function voice()
    return Config.Drive.voice and GetResourceState('pma-voice') == 'started'
end

local function setCall(src, channel)
    if not voice() or not src or GetPlayerPed(src) == 0 then return end
    pcall(function() exports['pma-voice']:setPlayerCall(src, channel) end)
end

local function inVehicle(src)
    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then return false end
    local veh = GetVehiclePedIsIn(ped, false)
    return veh ~= nil and veh ~= 0
end

function Drive.Publish(bizId)
    local list = {}
    for src, w in pairs(Drive.waiting[bizId] or {}) do
        list[#list + 1] = { src = src, speaker = w.speaker, at = w.at, answered = w.call ~= nil, staff = w.staff }
    end
    table.sort(list, function(a, b) return a.at < b.at end)
    GlobalState['xsr:drive:' .. tostring(bizId)] = list
end

local function endCall(channel, reason)
    local call = Drive.calls[channel]
    if not call then return end
    Drive.calls[channel] = nil
    setCall(call.staff, 0)
    setCall(call.customer, 0)
    local waiting = (Drive.waiting[call.biz] or {})[call.customer]
    if waiting then waiting.call, waiting.staff = nil, nil end
    if reason ~= 'quiet' then
        if GetPlayerName(call.staff) then TriggerClientEvent('XS-RestaurantSystem:client:driveState', call.staff, { biz = call.biz, call = false }) end
        if GetPlayerName(call.customer) then TriggerClientEvent('XS-RestaurantSystem:client:driveState', call.customer, { biz = call.biz, call = false }) end
    end
    Drive.Publish(call.biz)
end

function Drive.Call(src, bizId, speakerId)
    if not Config.Drive.enabled then return false, Text('err_drive_off') end
    local b = Biz.Get(bizId)
    if not b or not b.data.enabled then return false, Text('err_no_business') end
    local speaker = Biz.Point(b, 'speaker', speakerId)
    if not speaker or not Biz.Near(src, speaker, (Config.Drive.range or 5.0) + 2.0) then return false, Text('err_too_far') end
    if not inVehicle(src) then return false, Text('err_drive_car') end
    if not Biz.IsOpen(b) then return false, Text('err_kiosk_closed') end
    local now = os.time()
    if Drive.pressed[src] and now - Drive.pressed[src] < 15 then return false, Text('err_drive_wait') end
    Drive.pressed[src] = now
    Drive.waiting[b.id] = Drive.waiting[b.id] or {}
    local w = Drive.waiting[b.id][src] or { at = now }
    w.speaker = speaker.id
    Drive.waiting[b.id][src] = w
    Drive.Publish(b.id)
    for _, staff in ipairs(Framework.OnDutyJob(b.data.job)) do
        TriggerClientEvent('XS-RestaurantSystem:client:driveCall', staff, { biz = b.id, label = b.data.label, speaker = speaker.label })
    end
    return true
end

function Drive.Answer(src, bizId, registerId, customer)
    local b = Biz.Get(bizId)
    if not b then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    local reg = Biz.Point(b, 'register', registerId)
    if not reg or not reg.drive or not Biz.Near(src, reg, 4.0) then return false, Text('err_too_far') end
    customer = tonumber(customer)
    local w = customer and (Drive.waiting[b.id] or {})[customer]
    if not w then return false, Text('err_drive_gone') end
    if w.call and Drive.calls[w.call] and Drive.calls[w.call].staff ~= src then return false, Text('err_drive_taken') end
    Drive.Hangup(src, 'quiet')
    Drive.nextChannel = Drive.nextChannel + 1
    local channel = 7300 + b.id * 100 + (Drive.nextChannel % 100)
    Drive.calls[channel] = { staff = src, customer = customer, biz = b.id, speaker = w.speaker }
    w.call, w.staff = channel, src
    setCall(src, channel)
    setCall(customer, channel)
    TriggerClientEvent('XS-RestaurantSystem:client:driveState', customer, { biz = b.id, call = true, business = b.data.label, voice = voice() })
    TriggerClientEvent('XS-RestaurantSystem:client:driveState', src, { biz = b.id, call = true, customer = customer, voice = voice() })
    Drive.Publish(b.id)
    return true, { voice = voice() }
end

function Drive.Hangup(src, reason)
    for channel, call in pairs(Drive.calls) do
        if call.staff == src or call.customer == src then endCall(channel, reason) end
    end
    return true
end

function Drive.Served(bizId, customer)
    local list = Drive.waiting[bizId]
    if not list or not list[customer] then return end
    local w = list[customer]
    if w.call then endCall(w.call) end
    list[customer] = nil
    Drive.Publish(bizId)
end

function Drive.Drop(src)
    Drive.Hangup(src)
    Drive.pressed[src] = nil
    for bizId, list in pairs(Drive.waiting) do
        if list[src] then
            list[src] = nil
            Drive.Publish(bizId)
        end
    end
end

function Drive.Tick()
    local range = (Config.Drive.range or 5.0) + 8.0
    for bizId, list in pairs(Drive.waiting) do
        local b = Biz.Get(bizId)
        local changed = false
        for src, w in pairs(list) do
            local speaker = b and Biz.Point(b, 'speaker', w.speaker)
            if not speaker or not GetPlayerName(src) or not Biz.Near(src, speaker, range) then
                if w.call then endCall(w.call) end
                list[src] = nil
                changed = true
            end
        end
        if changed then Drive.Publish(bizId) end
    end
    for channel, call in pairs(Drive.calls) do
        local b = Biz.Get(call.biz)
        local near = false
        for _, reg in ipairs(b and b.data.points.register or {}) do
            if reg.drive and Biz.Near(call.staff, reg, 10.0) then near = true break end
        end
        if not near or not GetPlayerName(call.staff) then endCall(channel) end
    end
end
