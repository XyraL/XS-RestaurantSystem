Cook = { menu = nil, session = nil }

local function stationLabel(p)
    if p.label and p.label ~= '' then return p.label end
    return Text('station_' .. p.type)
end

local function recipesFor(b, station)
    local out = {}
    for _, r in ipairs(b.recipes or {}) do
        if r.station == station.type then out[#out + 1] = r end
    end
    return out
end

local function counts(recipes)
    local items, seen = {}, {}
    for _, r in ipairs(recipes) do
        for _, ing in ipairs(r.ingredients or {}) do
            if not seen[ing.item] then
                seen[ing.item] = true
                items[#items + 1] = ing.item
            end
        end
    end
    if #items == 0 then return {} end
    return Inventory.Counts(items)
end

local function animate(point, stationType)
    if not Config.Cooking.animations then return end
    local ped = PlayerPedId()
    TaskTurnPedToFaceCoord(ped, point.x + 0.0, point.y + 0.0, point.z + 0.0, 700)
    Wait(650)
    local def = Data.byStation[stationType]
    if Cook.session and def and def.scenario ~= '' then TaskStartScenarioInPlace(ped, def.scenario, 0, true) end
end

local function stopAnim()
    if Config.Cooking.animations then ClearPedTasks(PlayerPedId()) end
end

function Cook.Open(b, station)
    if not Rest.IsStaff(b) then return Util.Notify(Text('err_not_staff'), 'error') end
    local recipes = recipesFor(b, station)
    if #recipes == 0 then return Util.Notify(Text('err_no_recipes_here'), 'error') end
    Cook.menu = { biz = b.id, station = station.id, point = station, type = station.type }
    UI.Send('cook', 'menu', {
        brand = Rest.Brand(b), station = { type = station.type, label = stationLabel(station) }, recipes = recipes,
        counts = counts(recipes), maxBatch = Config.Cooking.maxBatch, needIngredients = Config.Cooking.needIngredients,
    })
    UI.Focus('cook', true)
    Rest.WatchRange(station, Config.Cooking.range + 3.0, function() return Cook.menu ~= nil and Cook.menu.station == station.id end, Cook.Close)
end

function Cook.Close()
    if Cook.session then
        Cook.session = nil
        stopAnim()
        Rest.Call('cookCancel')
    end
    if not Cook.menu then return end
    Cook.menu = nil
    UI.Send('cook', 'close', {})
    UI.Focus('cook', false)
end

UI.OnClose('cook', Cook.Close)

UI.Handle('cook:start', function(p)
    local m = Cook.menu
    if not m then return false end
    if Cook.session then return false, Text('err_busy_cooking') end
    p = type(p) == 'table' and p or {}
    local ok, data = Rest.Call('cookStart', m.biz, m.station, p.recipe, p.amount)
    if not ok then return false, data end
    Cook.session = { token = data.token }
    CreateThread(function() animate(m.point, m.type) end)
    return true, data
end)

UI.Handle('cook:done', function(p)
    p = type(p) == 'table' and p or {}
    local s = Cook.session
    if not s or s.token ~= p.token then return false, Text('err_failed') end
    Cook.session = nil
    stopAnim()
    local ok, res = Rest.Call('cookFinish', p.token, p.passed == true)
    if not ok then return false, res end
    if res.passed then
        Util.Notify(Text('cook_done', { n = res.makes, item = res.label }), 'success')
    else
        Util.Notify(Text(res.lost and 'cook_failed_lost' or 'cook_failed'), 'error')
    end
    local b = Cook.menu and Rest.Get(Cook.menu.biz)
    local fresh = {}
    if b then fresh = counts(recipesFor(b, { type = Cook.menu.type })) end
    return true, { result = res, counts = fresh }
end)

UI.Handle('cook:cancel', function()
    if Cook.session then
        Cook.session = nil
        stopAnim()
        Rest.Call('cookCancel')
    end
    return true
end)
