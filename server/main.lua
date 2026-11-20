local ready = false

local function reply(ok, a, b)
    if ok == false then return false, a end
    if ok == true then return true, a end
    return ok, a, b
end

local function cb(name, fn, admin)
    lib.callback.register('XS-RestaurantSystem:server:' .. name, function(src, ...)
        if not ready then return false, Text('err_starting') end
        if admin and not Builder.Allowed(src) then return false, Text('err_not_admin') end
        local result = table.pack(pcall(fn, src, ...))
        if not result[1] then
            print(('^1[XS-RestaurantSystem]^0 %s failed: %s'):format(name, tostring(result[2])))
            return false, Text('err_failed')
        end
        return reply(result[2], result[3], result[4])
    end)
end

cb('businesses', function() return true, Biz.PublicAll() end)

cb('nearby', function(src, bizId, kind, pointId) return Orders.Nearby(src, tonumber(bizId), kind, pointId) end)
cb('ring', function(src, payload) return Orders.Ring(src, payload) end)
cb('cancelRing', function(src, id) return Orders.CancelRing(src, id) end)
cb('payRespond', function(src, id, method) return Orders.Respond(src, id, method) end)

cb('orders', function(src, bizId)
    local ok, b = Orders.ForStaff(src, tonumber(bizId))
    if not ok then return false, b end
    return true, { now = os.time(), list = Orders.Public(b.id) }
end)

cb('orderStatus', function(src, oid, status) return Orders.SetStatus(src, oid, status) end)
cb('orderLine', function(src, oid, index) return Orders.ToggleLine(src, oid, index) end)
cb('handOver', function(src, oid, target, counterId) return Orders.HandOver(src, oid, target, counterId) end)

cb('soldOut', function(src, bizId, menuId, on) return Biz.SetSoldOut(src, tonumber(bizId), menuId, on == true) end)
cb('kiosk', function(src, payload) return Orders.Kiosk(src, payload) end)
cb('driveCall', function(src, bizId, speakerId) return Drive.Call(src, tonumber(bizId), speakerId) end)
cb('driveAnswer', function(src, bizId, registerId, customer) return Drive.Answer(src, tonumber(bizId), registerId, customer) end)
cb('driveHangup', function(src) return Drive.Hangup(src) end)
cb('sit', function(src, bizId, seatId) return Seats.Sit(src, tonumber(bizId), seatId) end)
cb('stand', function(src) return Seats.Stand(src) end)

cb('phoneList', function(src) return PhoneOrders.List(src) end)
cb('phoneOrder', function(src, payload) return PhoneOrders.Order(src, payload) end)
cb('phoneMine', function(src) return true, PhoneOrders.Mine(src) end)
cb('deliveryTake', function(src, oid) return PhoneOrders.Take(src, oid) end)
cb('deliveryHand', function(src, oid) return PhoneOrders.Hand(src, oid) end)
cb('supplyOrder', function(src, bizId, lines, mode) return Supply.Order(src, tonumber(bizId), lines, mode) end)
cb('supplyCollect', function(src, mode, bizId) return Supply.Collect(src, mode, tonumber(bizId)) end)
cb('bossData', function(src, bizId) return Boss.Data(src, tonumber(bizId)) end)
cb('bossPrice', function(src, bizId, menuId, price) return Biz.SetPrice(src, tonumber(bizId), menuId, price) end)
cb('bossFlag', function(src, bizId, key, on) return Biz.SetFlag(src, tonumber(bizId), key, on == true) end)
cb('bossBank', function(src, bizId, kind, amount, account) return Boss.Move(src, tonumber(bizId), kind, amount, account) end)
cb('builderWarehouse', function(_, point) return true, Supply.SetWarehouse(point) end, true)

cb('cookStart', function(src, bizId, stationId, recipeId, amount) return Cooking.Start(src, tonumber(bizId), stationId, recipeId, amount) end)
cb('cookFinish', function(src, token, passed) return Cooking.Finish(src, token, passed == true) end)
cb('cookCancel', function(src) return Cooking.Cancel(src) end)

cb('storage', function(src, bizId, pointId)
    local b = Biz.Get(tonumber(bizId))
    if not b then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b, Config.Staff.storageNeedsDuty) then return false, Text('err_not_staff') end
    local point = Biz.Point(b, 'storage', pointId)
    if not point or not Biz.Near(src, point, 4.0) then return false, Text('err_too_far') end
    local id = ('xsr_%d_%s'):format(b.id, point.id)
    local label = point.label ~= '' and ('%s · %s'):format(b.data.label, point.label) or b.data.label
    local groups = b.data.job ~= '' and { [b.data.job] = 0 } or nil
    local mode = Inventory.OpenStash(src, id, label, b.data.storage.slots, b.data.storage.weight, groups, vector3(point.x, point.y, point.z))
    return true, { mode = mode, id = id, label = label, slots = b.data.storage.slots, weight = b.data.storage.weight }
end)

cb('builderData', function(src) return true, Builder.Data(src) end, true)
cb('builderSave', function(src, id, data) return Builder.Save(src, id, data) end, true)
cb('builderDelete', function(src, id) return Builder.Delete(src, id) end, true)
cb('builderPlayers', function(src, query) return Builder.Players(src, query) end, true)
cb('builderStats', function() return true, Builder.Stats() end, true)

RegisterCommand(Config.Commands.diag, function(src)
    local lines = {
        ('XS-RestaurantSystem %s'):format(GetResourceMetadata(GetCurrentResourceName(), 'version', 0) or ''),
        ('framework %s · inventory %s · banking %s'):format(Framework.name or 'none', Inventory.name or 'none', (Banking.Ready() and Banking.name) or 'none found'),
    }
    local count, open = 0, 0
    for _, b in pairs(Biz.list) do
        count = count + 1
        if Biz.IsOpen(b) then open = open + 1 end
    end
    local orders = 0
    for _ in pairs(Orders.open) do orders = orders + 1 end
    lines[#lines + 1] = ('%d businesses · %d open now · %d open orders'):format(count, open, orders)
    for _, b in pairs(Biz.list) do
        local problems = Builder.Problems(b)
        if #problems > 0 then
            local words = {}
            for i, key in ipairs(problems) do words[i] = Text('diag_' .. key) end
            lines[#lines + 1] = ('#%d %s: %s'):format(b.id, b.data.label, table.concat(words, ', '))
        end
    end
    if src > 0 then
        local job = Framework.GetJob(src)
        lines[#lines + 1] = job and ('your job %s, grade %d, %s'):format(job.name, job.grade, job.onDuty and 'on duty' or 'off duty') or 'no job'
        local mine = {}
        for _, b in pairs(Biz.list) do
            if Biz.IsStaff(src, b, false) then mine[#mine + 1] = b.data.label end
        end
        lines[#lines + 1] = #mine > 0 and ('you work at %s'):format(table.concat(mine, ', ')) or 'you do not work at any of them'
        for _, b in pairs(Biz.list) do
            if Biz.IsStaff(src, b, false) then
                local balance = Banking.Ready() and Banking.Balance(b.data.job) or nil
                local access = Biz.IsBoss(src, b) and 'you are the boss' or ((Biz.CanBank(src, b, 'deposit') or Biz.CanBank(src, b, 'withdraw')) and 'you can use the account' or 'your rank cannot use the account')
                lines[#lines + 1] = ('%s: account "%s" %s, %s'):format(b.data.label, b.data.job, balance and ('$' .. balance) or 'not found', access)
            end
        end
        TriggerClientEvent('chat:addMessage', src, { args = { 'XS-RestaurantSystem', table.concat(lines, ' | ') } })
    end
    for _, l in ipairs(lines) do print('[XS-RestaurantSystem] ' .. l) end
end, false)

Framework.OnUnloaded(function(src)
    Orders.Drop(src)
    Cooking.Drop(src)
    Drive.Drop(src)
    Seats.Stand(src)
    PhoneOrders.Drop(src)
    SetTimeout(500, Biz.RefreshOpen)
end)

Framework.OnLoaded(function(src)
    SetTimeout(1500, Biz.RefreshOpen)
    SetTimeout(2000, function() Biz.Broadcast(src) end)
end)

Framework.OnJobChange(function()
    SetTimeout(300, Biz.RefreshOpen)
end)

CreateThread(function()
    while not Framework.name do Wait(500) end
    if not Db.Setup() then return end
    Settings.Load()
    Biz.Load()
    Biz.LoadSoldOut()
    Biz.LoadBoss()
    Orders.Load()
    Supply.Load()
    Biz.RefreshOpen()
    ready = true
    Biz.Broadcast()
    local count = 0
    for _ in pairs(Biz.list) do count = count + 1 end
    print(('^2[XS-RestaurantSystem]^0 ready: %d businesses, framework %s, inventory %s, banking %s.'):format(count, Framework.name, Inventory.name or 'none', Banking.name or 'none'))
    while true do
        Wait(2000)
        local ok, err = pcall(Orders.Tick)
        if not ok then print(('^1[XS-RestaurantSystem]^0 order tick failed: %s'):format(tostring(err))) end
        ok, err = pcall(Drive.Tick)
        if not ok then print(('^1[XS-RestaurantSystem]^0 drive-thru tick failed: %s'):format(tostring(err))) end
        ok, err = pcall(Supply.Tick)
        if not ok then print(('^1[XS-RestaurantSystem]^0 supply tick failed: %s'):format(tostring(err))) end
    end
end)

CreateThread(function()
    while true do
        Wait(15000)
        if ready then pcall(Biz.RefreshOpen) end
    end
end)
