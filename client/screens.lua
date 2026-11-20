Screens = { list = {}, live = {}, pool = { kitchen = {}, pickup = {}, menu = {}, kiosk = {} }, drawing = false, counter = 0 }

local SIZES = { kitchen = { 1280, 720 }, pickup = { 1280, 720 }, menu = { 1280, 720 }, kiosk = { 720, 1280 } }

local function url(kind)
    return ('nui://%s/html/dui/screen.html?kind=%s'):format(GetCurrentResourceName(), kind)
end

local function corners(s)
    local h = math.rad(s.h or 0.0)
    local right = vector3(-math.cos(h), -math.sin(h), 0.0)
    local up = vector3(0.0, 0.0, 1.0)
    local normal = vector3(-math.sin(h), math.cos(h), 0.0)
    local c = vector3(s.x + 0.0, s.y + 0.0, s.z + 0.0) + normal * 0.012
    local hw, hh = s.width / 2, s.height / 2
    return c - right * hw + up * hh, c + right * hw + up * hh, c - right * hw - up * hh, c + right * hw - up * hh, normal, c
end

local function newDui(kind)
    Screens.counter = Screens.counter + 1
    local size = SIZES[kind] or SIZES.kitchen
    local dui = CreateDui(url(kind), size[1], size[2])
    if not dui then return nil end
    local untilAt = GetGameTimer() + 3000
    while not IsDuiAvailable(dui) and GetGameTimer() < untilAt do Wait(50) end
    local tag = ('%s_%d_%d'):format(kind, GetGameTimer(), Screens.counter)
    local txdName, txnName = 'xsr_txd_' .. tag, 'xsr_tex_' .. tag
    local txd = CreateRuntimeTxd(txdName)
    CreateRuntimeTextureFromDuiHandle(txd, txnName, GetDuiHandle(dui))
    return { dui = dui, txd = txdName, txn = txnName, kind = kind }
end

function Screens.Attach(screen)
    local pool = Screens.pool[screen.kind]
    local handle = table.remove(pool) or newDui(screen.kind)
    if not handle then return end
    handle.screen, handle.sent, handle.attachedAt = screen, nil, GetGameTimer()
    Screens.live[screen.id] = handle
end

function Screens.Detach(id)
    local live = Screens.live[id]
    if not live then return end
    Screens.live[id] = nil
    live.screen, live.sent = nil, nil
    SendDuiMessage(live.dui, json.encode({ kind = live.kind, blank = true }))
    local pool = Screens.pool[live.kind]
    pool[#pool + 1] = live
end

function Screens.DestroyAll()
    for id in pairs(Screens.live) do Screens.Detach(id) end
    for kind, pool in pairs(Screens.pool) do
        for _, handle in ipairs(pool) do
            SetDuiUrl(handle.dui, 'about:blank')
            DestroyDui(handle.dui)
        end
        Screens.pool[kind] = {}
    end
end

function Screens.Build()
    for id in pairs(Screens.live) do Screens.Detach(id) end
    Screens.list = {}
    for _, b in ipairs(Rest.list) do
        for _, pair in ipairs({ { 'kitchen', 'kitchen' }, { 'pickup', 'pickup' }, { 'menuboard', 'menu' }, { 'kiosk', 'kiosk' } }) do
            local kind = pair[2]
            for _, p in ipairs((b.points or {})[pair[1]] or {}) do
                local width = p.width or (kind == 'kiosk' and 0.5 or 1.2)
                local height = kind == 'kiosk' and width * 16 / 9 or width * 9 / 16
                local tl, tr, bl, br, normal, center = corners({ x = p.x, y = p.y, z = p.z, h = p.w, width = width, height = height })
                Screens.list[#Screens.list + 1] = {
                    id = ('%s%d_%s'):format(kind, b.id, p.id), kind = kind, biz = b.id, point = p,
                    center = center, normal = normal, quad = { tl, tr, bl, br },
                }
            end
        end
    end
end

local function menuPayload(screen, b)
    local soldout = (GlobalState['xsr:soldout'] or {})[tostring(b.id)] or {}
    local wanted = {}
    for _, id in ipairs(screen.point.categories or {}) do wanted[id] = true end
    local any = next(wanted) == nil
    local cats = {}
    for _, c in ipairs(b.categories or {}) do
        if any or wanted[c.id] then
            local items = {}
            for _, m in ipairs(b.menu or {}) do
                if m.available and m.category == c.id then items[#items + 1] = { label = m.label, price = m.price, image = m.image, soldout = soldout[m.id] == true } end
            end
            if #items > 0 then cats[#cats + 1] = { label = c.label, items = items } end
        end
    end
    return {
        kind = 'menu', brand = Rest.Brand(b), title = screen.point.title ~= '' and screen.point.title or nil, categories = cats, open = Rest.IsOpen(b),
        seconds = Config.Screens.boardSeconds or 8, labels = TextTable('screen_'),
    }
end

local function payload(screen)
    local b = Rest.Get(screen.biz)
    if not b then return { kind = screen.kind, blank = true } end
    if screen.kind == 'menu' then return menuPayload(screen, b) end
    if screen.kind == 'kiosk' then
        return { kind = 'kiosk', brand = Rest.Brand(b), open = Rest.IsOpen(b) and Config.Kiosk.enabled, labels = TextTable('screen_') }
    end
    local snap = GlobalState['xsr:orders:' .. tostring(screen.biz)] or {}
    local now = Rest.Now()
    local orders = {}
    for _, o in ipairs(snap.list or {}) do
        orders[#orders + 1] = {
            number = o.number, status = o.status, name = o.name, age = math.max(0, now - (o.at or now)),
            lines = screen.kind == 'kitchen' and o.lines or nil,
        }
    end
    return {
        kind = screen.kind, brand = Rest.Brand(b), orders = orders, open = Rest.IsOpen(b),
        late = (Config.Orders.lateMinutes or 8) * 60, clock = ('%02d:%02d'):format(GetClockHours(), GetClockMinutes()),
        labels = TextTable('screen_'),
    }
end

local function send(live, force)
    if not live.screen then return end
    local encoded = json.encode(payload(live.screen))
    if not force and encoded == live.sent then return end
    live.sent = encoded
    SendDuiMessage(live.dui, encoded)
end

local function draw(live)
    local q = live.screen.quad
    local txd, txn = live.txd, live.txn
    local tl, tr, bl, br = q[1], q[2], q[3], q[4]
    DrawTexturedPoly(tl.x, tl.y, tl.z, tr.x, tr.y, tr.z, bl.x, bl.y, bl.z, 255, 255, 255, 255, txd, txn, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0)
    DrawTexturedPoly(tr.x, tr.y, tr.z, br.x, br.y, br.z, bl.x, bl.y, bl.z, 255, 255, 255, 255, txd, txn, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0)
    DrawTexturedPoly(tl.x, tl.y, tl.z, bl.x, bl.y, bl.z, tr.x, tr.y, tr.z, 255, 255, 255, 255, txd, txn, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0)
    DrawTexturedPoly(tr.x, tr.y, tr.z, bl.x, bl.y, bl.z, br.x, br.y, br.z, 255, 255, 255, 255, txd, txn, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0)
end

local function drawLoop()
    Screens.drawing = true
    while next(Screens.live) do
        local cam = GetFinalRenderedCamCoord()
        local range = (Config.Screens.drawDistance or 18.0) + 4.0
        for _, live in pairs(Screens.live) do
            local s = live.screen
            if s then
                local toCam = cam - s.center
                if #toCam < range and (toCam.x * s.normal.x + toCam.y * s.normal.y) > -0.2 then draw(live) end
            end
        end
        Wait(0)
    end
    Screens.drawing = false
end

CreateThread(function()
    while true do
        Wait(500)
        local S = Config.Screens
        if S.enabled ~= false and #Screens.list > 0 then
            local cam = GetFinalRenderedCamCoord()
            local range = S.drawDistance or 18.0
            local near = {}
            for _, screen in ipairs(Screens.list) do
                local d = #(cam - screen.center)
                if d < range then near[#near + 1] = { screen = screen, d = d } end
            end
            table.sort(near, function(a, b) return a.d < b.d end)
            local keep = {}
            for i = 1, math.min(#near, S.maxLive or 6) do keep[near[i].screen.id] = near[i].screen end
            for id, live in pairs(Screens.live) do
                if not keep[id] and (not live.screen or #(cam - live.screen.center) > range + 3.0) then Screens.Detach(id) end
            end
            for id, screen in pairs(keep) do
                if not Screens.live[id] then Screens.Attach(screen) end
            end
            local now = GetGameTimer()
            for _, live in pairs(Screens.live) do
                send(live, now - (live.attachedAt or 0) < 3000)
            end
            if next(Screens.live) and not Screens.drawing then CreateThread(drawLoop) end
        elseif next(Screens.live) then
            for id in pairs(Screens.live) do Screens.Detach(id) end
        end
    end
end)

Rest.OnChange(Screens.Build)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    Screens.DestroyAll()
end)
