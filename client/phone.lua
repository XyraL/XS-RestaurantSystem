PhoneApp = { added = false }

local RES = GetCurrentResourceName()
local PAGE = ('https://cfx-nui-%s/html/phone/index.html?res=%s'):format(RES, RES)
local ICON = ('https://cfx-nui-%s/html/phone/icon.png'):format(RES)

local function label()
    return Config.Phone.appName or 'Food Order'
end

local ADD = {
    ['XS-Phone'] = function()
        return exports['XS-Phone']:AddCustomApp({
            id = Phone.appId, name = label(), icon = ICON, ui = PAGE, colour = '#ff7849',
            description = Text('app_description'), developer = 'XyraL', category = 'Food', defaultApp = true,
        })
    end,
    ['lb-phone'] = function()
        return exports['lb-phone']:AddCustomApp({
            identifier = Phone.appId,
            name = label(),
            description = Text('app_description'),
            developer = 'XyraL',
            defaultApp = true,
            ui = RES .. '/html/phone/index.html?res=' .. RES,
            icon = ICON,
            fixBlur = true,
        })
    end,
    ['qs-smartphone-pro'] = function()
        return exports['qs-smartphone-pro']:addCustomApp({
            app = Phone.appId,
            label = label(),
            image = ICON,
            ui = PAGE,
            job = false,
            blockedJobs = {},
            timeout = 5000,
            creator = 'XyraL',
            category = 'social',
            isGame = false,
            description = Text('app_description'),
            age = '16+',
            extraDescription = {},
        })
    end,
    ['qs-smartphone'] = function()
        return exports['qs-smartphone']:addCustomApp({
            id = Phone.appId,
            label = label(),
            icon = ICON,
            category = 'Utilities',
            creator = 'XyraL',
            description = Text('app_description'),
            appStoreOnly = false,
            price = 0,
            sizeMb = 1,
            iframe = { url = PAGE },
            custom = { enabled = true, bridge = { enabled = true, allowedOrigins = { 'https://cfx-nui-' .. RES } } },
        })
    end,
    ['gksphone'] = function()
        return exports.gksphone:AddCustomApp({
            name = label(),
            appurl = PAGE,
            icons = ICON,
            description = Text('app_description'),
            show = true,
        })
    end,
    ['yseries'] = function()
        return exports.yseries:AddCustomApp({
            key = Phone.appId,
            name = label(),
            defaultApp = true,
            ui = PAGE,
            icon = ICON,
        })
    end,
    ['okokPhone'] = function()
        return exports.okokPhone:loadApp({
            id = Phone.appId,
            label = label(),
            description = Text('app_description'),
            custom = true,
            icon = ICON,
            resourceName = RES,
            webUrl = PAGE,
        })
    end,
}

local REMOVE = {
    ['XS-Phone'] = function() exports['XS-Phone']:RemoveCustomApp(Phone.appId) end,
    ['lb-phone'] = function() exports['lb-phone']:RemoveCustomApp(Phone.appId) end,
    ['qs-smartphone-pro'] = function() exports['qs-smartphone-pro']:removeCustomApp(Phone.appId) end,
    ['qs-smartphone'] = function() exports['qs-smartphone']:removeCustomApp(Phone.appId) end,
    ['yseries'] = function() exports.yseries:RemoveCustomApp(Phone.appId) end,
}

local CLOSE = {
    ['XS-Phone'] = function() exports['XS-Phone']:Close() end,
    ['lb-phone'] = function() exports['lb-phone']:ToggleOpen(false) end,
}

local function addApp()
    if not Phone.HasApp() then return end
    local add = ADD[Phone.name]
    if not add then return end
    local ok, err = pcall(add)
    PhoneApp.added = ok and err ~= false
    if not ok and Config.Debug then
        print(('^1[XS-RestaurantSystem]^0 could not add the %s app: %s'):format(Phone.name, tostring(err)))
    end
end

function PhoneApp.Close()
    local close = CLOSE[Phone.name]
    if close and PhoneApp.added then pcall(close) end
end

RegisterNetEvent('XS-RestaurantSystem:client:phoneNotify', function(title, body)
    if Phone.name == 'npwd' then
        pcall(function()
            exports.npwd:createNotification({
                notisId = ('xs-restaurant:%d'):format(GetGameTimer()),
                appId = 'MESSAGES',
                content = body,
                secondaryTitle = title,
                duration = 6000,
            })
        end)
    elseif Phone.name == 'qs-smartphone-pro' then
        pcall(function()
            exports['qs-smartphone-pro']:SendTempNotification({ title = title, text = body, app = Phone.appId, timeout = 6000 })
        end)
    else
        Framework.Notify(('%s: %s'):format(title, body), 'inform')
    end
end)

CreateThread(function()
    Wait(1500)
    addApp()
end)

AddEventHandler('onResourceStart', function(resource)
    if resource ~= Phone.name then return end
    CreateThread(function()
        Wait(1000)
        addApp()
    end)
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= RES or not PhoneApp.added then return end
    local remove = REMOVE[Phone.name]
    if remove then pcall(remove) end
end)

local CALLS = { phoneList = true, phoneOrder = true, phoneMine = true }

local function street()
    local c = GetEntityCoords(PlayerPedId())
    local a, b = GetStreetNameAtCoord(c.x, c.y, c.z)
    local name = GetStreetNameFromHashKey(a)
    local cross = b and b ~= 0 and GetStreetNameFromHashKey(b) or ''
    if cross ~= '' and cross ~= name then return ('%s & %s'):format(name, cross) end
    return name
end

RegisterNUICallback('phoneCall', function(data, cb)
    local name = type(data) == 'table' and data.name or nil
    if not CALLS[name] then return cb({ ok = false, error = Text('err_failed') }) end
    local args = type(data.args) == 'table' and data.args or {}
    if name == 'phoneOrder' and type(args[1]) == 'table' then args[1].street = street() end
    local ok, res = Rest.Call(name, args[1])
    if name == 'phoneOrder' and ok and res and res.number then
        Util.Notify(Text(res.mode == 'delivery' and 'phone_done_delivery' or 'phone_done', { number = res.number, business = res.business or '' }), 'success')
    end
    cb(ok and { ok = true, data = res } or { ok = false, error = res or Text('err_failed') })
end)

RegisterNUICallback('phoneGps', function(data, cb)
    if type(data) == 'table' and tonumber(data.x) and tonumber(data.y) then
        SetNewWaypoint(tonumber(data.x) + 0.0, tonumber(data.y) + 0.0)
        Util.Notify(Text('gps_set'), 'inform')
    end
    cb(true)
end)

RegisterNUICallback('phoneClose', function(_, cb)
    cb(true)
    if UI.HasFocus('phonefull') then
        UI.Send('phonefull', 'close', {})
        UI.Focus('phonefull', false)
    else
        PhoneApp.Close()
    end
end)

UI.OnClose('phonefull', function()
    UI.Send('phonefull', 'close', {})
    UI.Focus('phonefull', false)
end)

if Config.Phone.command then
    RegisterCommand(Config.Phone.command, function()
        if not Config.Phone.app then return Util.Notify(Text('err_phone_off'), 'error') end
        UI.Send('phonefull', 'open', { url = ('https://cfx-nui-%s/html/phone/index.html?res=%s&full=1'):format(RES, RES) })
        UI.Focus('phonefull', true)
    end, false)
end
