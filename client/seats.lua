SeatsClient = { current = nil }

local function standUp(quiet)
    local cur = SeatsClient.current
    if not cur then return end
    SeatsClient.current = nil
    local ped = PlayerPedId()
    ClearPedTasks(ped)
    lib.hideTextUI()
    if cur.back then SetEntityCoords(ped, cur.back.x, cur.back.y, cur.back.z, false, false, false, false) end
    if not quiet then Rest.Call('stand') end
end

function SeatsClient.Sit(b, p)
    if SeatsClient.current then return end
    local ok, err = Rest.Call('sit', b.id, p.id)
    if not ok then return Util.Notify(err, 'error') end
    local ped = PlayerPedId()
    local def = Data.bySeat[p.seat] or Data.bySeat.chair
    local back = GetEntityCoords(ped)
    SeatsClient.current = { biz = b.id, seat = p.id, back = { x = back.x, y = back.y, z = back.z } }
    TaskStartScenarioAtPosition(ped, def.scenario, p.x + 0.0, p.y + 0.0, p.z + (p.height or def.height) + 0.0, (p.w or 0.0) + 0.0, 0, true, true)
    lib.showTextUI(Text('seat_hint'), { position = 'right-center' })
    CreateThread(function()
        local started = GetGameTimer()
        while SeatsClient.current and SeatsClient.current.seat == p.id do
            Wait(0)
            if IsControlJustReleased(0, 73) or IsControlJustReleased(0, 32) then
                standUp(false)
                break
            end
            if GetGameTimer() - started > 2500 and not IsPedUsingAnyScenario(ped) then
                standUp(false)
                break
            end
        end
    end)
end

Framework.OnUnloaded(function() standUp(true) end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    standUp(true)
end)
