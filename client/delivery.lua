DeliveryRun = { current = nil, blip = nil }

local function clear()
    if DeliveryRun.blip then RemoveBlip(DeliveryRun.blip) end
    DeliveryRun.blip = nil
    DeliveryRun.current = nil
    lib.hideTextUI()
end

local function customerCoords(run)
    if run.customer then
        local player = GetPlayerFromServerId(run.customer)
        if player and player ~= -1 then
            local ped = GetPlayerPed(player)
            if ped and ped ~= 0 then return GetEntityCoords(ped) end
        end
    end
    local a = run.address
    return a and vector3(a.x + 0.0, a.y + 0.0, a.z + 0.0) or nil
end

function DeliveryRun.Start(run)
    clear()
    if type(run) ~= 'table' or not run.address then return end
    DeliveryRun.current = run
    local a = run.address
    SetNewWaypoint(a.x + 0.0, a.y + 0.0)
    DeliveryRun.blip = AddBlipForCoord(a.x + 0.0, a.y + 0.0, a.z + 0.0)
    SetBlipSprite(DeliveryRun.blip, 501)
    SetBlipColour(DeliveryRun.blip, 47)
    SetBlipRoute(DeliveryRun.blip, true)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName(Text('blip_delivery', { number = run.number }))
    EndTextCommandSetBlipName(DeliveryRun.blip)
    Util.Notify(Text('delivery_started', { number = run.number, street = run.street or '' }), 'inform')
    CreateThread(function()
        local shown = nil
        while DeliveryRun.current == run do
            local sleep = 500
            local target = customerCoords(run)
            local pos = GetEntityCoords(PlayerPedId())
            if target and #(pos - target) <= (Config.Delivery.range or 6.0) then
                sleep = 0
                local text = Text('delivery_prompt', { number = run.number })
                if shown ~= text then lib.showTextUI(text, { position = 'right-center' }) shown = text end
                if IsControlJustReleased(0, 38) and not IsNuiFocused() then
                    local ok, res = Rest.Call('deliveryHand', run.id)
                    if ok then
                        Util.Notify(Text('delivery_done', { number = run.number }), 'success')
                        clear()
                        break
                    end
                    Util.Notify(res, 'error')
                    Wait(800)
                end
            elseif shown then
                lib.hideTextUI()
                shown = nil
            end
            Wait(sleep)
        end
    end)
end

RegisterCommand('canceldelivery', function()
    if DeliveryRun.current then
        clear()
        Util.Notify(Text('delivery_dropped'), 'inform')
    end
end, false)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    clear()
end)
