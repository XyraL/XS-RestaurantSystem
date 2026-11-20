local function apply(values)
    if type(values) ~= 'table' then return end
    Settings.Apply(values)
    UI.Send('core', 'config', UI.PublicConfig())
end

RegisterNetEvent('XS-RestaurantSystem:client:settings', apply)

CreateThread(function()
    while not Framework.name do Wait(200) end
    apply(lib.callback.await('XS-RestaurantSystem:server:settings', false))
end)
