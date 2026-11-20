Drive = { near = nil, shown = nil, call = nil }

local function driver()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    return veh ~= 0 and GetPedInVehicleSeat(veh, -1) == ped
end

local function nearestSpeaker(pos)
    local best, bestDist = nil, (Config.Drive.range or 5.0)
    for _, b in ipairs(Rest.list) do
        for _, sp in ipairs((b.points or {}).speaker or {}) do
            local d = #(pos - vector3(sp.x + 0.0, sp.y + 0.0, sp.z + 0.0))
            if d <= bestDist then best, bestDist = { biz = b, speaker = sp }, d end
        end
    end
    return best
end

local function hint(text)
    if Drive.shown == text then return end
    if text then lib.showTextUI(text, { position = 'right-center' }) else lib.hideTextUI() end
    Drive.shown = text
end

CreateThread(function()
    while true do
        local sleep = 800
        if Config.Drive.enabled and #Rest.list > 0 and driver() then
            local found = nearestSpeaker(GetEntityCoords(PlayerPedId()))
            Drive.near = found
            if found then
                sleep = 0
                local open = Rest.IsOpen(found.biz)
                hint(open and Text('drive_prompt', { business = found.biz.label }) or Text('drive_closed', { business = found.biz.label }))
                if open and IsControlJustReleased(0, 38) and not IsNuiFocused() then
                    local ok, err = Rest.Call('driveCall', found.biz.id, found.speaker.id)
                    Util.Notify(ok and Text('drive_called') or err, ok and 'success' or 'error')
                    Wait(600)
                end
            else
                hint(nil)
            end
        else
            Drive.near = nil
            hint(nil)
        end
        Wait(sleep)
    end
end)

RegisterNetEvent('XS-RestaurantSystem:client:driveCall', function(data)
    if type(data) ~= 'table' then return end
    Util.Notify(Text('drive_staff', { business = data.label or '' }), 'inform')
    PlaySoundFrontend(-1, 'Text_Arrive_Tone', 'Phone_SoundSet_Default', true)
end)

RegisterNetEvent('XS-RestaurantSystem:client:driveState', function(data)
    if type(data) ~= 'table' then return end
    Drive.call = data.call and data or nil
    if data.call and data.business then
        Util.Notify(Text(data.voice and 'drive_connected' or 'drive_connected_text', { business = data.business }), 'success')
    end
    if Register.open then UI.Send('pos', 'call', { on = data.call == true, customer = data.customer }) end
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if Drive.shown then lib.hideTextUI() end
end)
