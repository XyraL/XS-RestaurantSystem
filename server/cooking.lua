Cooking = { active = {} }

local LEVEL = { easy = 0.75, normal = 1.0, hard = 1.35 }

local function needs(recipe, amount)
    local out = {}
    for _, ing in ipairs(recipe.ingredients) do out[#out + 1] = { item = ing.item, count = ing.count * amount } end
    return out
end

local function missing(src, list)
    for _, n in ipairs(list) do
        if Inventory.Count(src, n.item) < n.count then return n end
    end
end

local function minimumTime(stepList)
    local total = 0.0
    for _, s in ipairs(stepList) do
        if s.game == 'timer' then total = total + s.seconds * 0.85 else total = total + 1.2 end
    end
    return total
end

function Cooking.Start(src, bizId, stationId, recipeId, amount)
    local b = Biz.Get(bizId)
    if not b or not b.data.enabled then return false, Text('err_no_business') end
    if not Biz.IsStaff(src, b) then return false, Text('err_not_staff') end
    local station = Biz.Point(b, 'station', stationId)
    if not station then return false, Text('err_failed') end
    if not Biz.Near(src, station, Config.Cooking.range + 1.5) then return false, Text('err_too_far') end
    local recipe = Biz.Recipe(b, recipeId)
    if not recipe or recipe.station ~= station.type then return false, Text('err_no_recipe') end
    amount = math.floor(Util.Clamp(tonumber(amount) or 1, 1, Config.Cooking.maxBatch))
    if Cooking.active[src] then return false, Text('err_busy_cooking') end
    local list = needs(recipe, amount)
    if Config.Cooking.needIngredients then
        local gap = missing(src, list)
        if gap then return false, Text('err_missing_ingredient', { item = Inventory.Label(gap.item), n = gap.count }) end
    end
    local makes = recipe.amount * amount
    if not Inventory.CanCarry(src, recipe.item, makes) then return false, Text('err_cant_carry') end

    local stepList = {}
    for i, s in ipairs(recipe.steps) do
        stepList[i] = { game = Config.Cooking.minigames and s.game or 'timer', seconds = s.seconds, label = s.label }
    end
    local token = Util.Id('k')
    Cooking.active[src] = {
        token = token, biz = b.id, station = station.id, recipe = recipe.id, amount = amount, makes = makes,
        started = GetGameTimer(), minTime = minimumTime(stepList),
    }
    return true, {
        token = token, steps = stepList, amount = amount, makes = makes, item = recipe.item, label = Inventory.Label(recipe.item),
        image = Inventory.Image(recipe.item), difficulty = Util.Round((Config.Cooking.difficulty or 1.0) * (LEVEL[recipe.level] or 1.0), 2),
        station = station.type,
    }
end

function Cooking.Finish(src, token, passed)
    local a = Cooking.active[src]
    if not a or a.token ~= token then return false, Text('err_failed') end
    Cooking.active[src] = nil
    local elapsed = (GetGameTimer() - a.started) / 1000
    if elapsed < a.minTime then return false, Text('err_too_fast') end
    local b = Biz.Get(a.biz)
    local station = Biz.Point(b, 'station', a.station)
    local recipe = Biz.Recipe(b, a.recipe)
    if not station or not recipe then return false, Text('err_failed') end
    if not Biz.Near(src, station, Config.Cooking.range + 2.5) then return false, Text('err_too_far') end
    local list = needs(recipe, a.amount)
    local useUp = Config.Cooking.needIngredients and (passed == true or Config.Cooking.failLoses)
    if Config.Cooking.needIngredients then
        local gap = missing(src, list)
        if gap then return false, Text('err_missing_ingredient', { item = Inventory.Label(gap.item), n = gap.count }) end
    end
    if useUp then
        for _, n in ipairs(list) do Inventory.Remove(src, n.item, n.count) end
    end
    if passed ~= true then
        return true, { passed = false, lost = useUp == true }
    end
    if not Inventory.Add(src, recipe.item, a.makes) then return false, Text('err_cant_carry') end
    return true, { passed = true, makes = a.makes, label = Inventory.Label(recipe.item) }
end

function Cooking.Cancel(src)
    Cooking.active[src] = nil
    return true
end

function Cooking.Drop(src)
    Cooking.active[src] = nil
end
