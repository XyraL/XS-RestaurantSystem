Util = {}

function Util.Clamp(value, low, high)
    value = tonumber(value) or low
    if value < low then return low end
    if value > high then return high end
    return value
end

function Util.Round(value, places)
    local mult = 10 ^ (places or 0)
    return math.floor((tonumber(value) or 0) * mult + 0.5) / mult
end

function Util.Copy(value)
    if type(value) ~= 'table' then return value end
    local out = {}
    for k, v in pairs(value) do out[k] = Util.Copy(v) end
    return out
end

function Util.Text(value, max)
    if value == nil then return '' end
    value = tostring(value):gsub('[%c]', ' '):gsub('^%s+', ''):gsub('%s+$', '')
    if max and #value > max then value = value:sub(1, max) end
    return value
end

function Util.Slug(value, max)
    return (tostring(value or ''):gsub('[^%w_%-%.]', '')):sub(1, max or 64)
end

function Util.Colour(value, fallback)
    value = tostring(value or '')
    if value:match('^#%x%x%x%x%x%x$') then return value:lower() end
    return fallback
end

local idCount = 0

function Util.Id(prefix)
    local stamp
    if IsDuplicityVersion() then stamp = os.time() else stamp = math.floor(GetGameTimer() / 1000) end
    idCount = idCount + 1
    return ('%s%x%04x%x'):format(prefix or '', stamp, math.random(0, 65535), idCount)
end

function Util.Point(value)
    if type(value) ~= 'table' then return nil end
    local x, y, z = tonumber(value.x), tonumber(value.y), tonumber(value.z)
    if not x or not y or not z then return nil end
    return { x = Util.Round(x, 3), y = Util.Round(y, 3), z = Util.Round(z, 3), w = Util.Round(tonumber(value.w or value.h) or 0.0, 2) }
end

function Util.Distance(a, b)
    if not a or not b then return math.huge end
    local dx, dy, dz = (a.x or 0) - (b.x or 0), (a.y or 0) - (b.y or 0), (a.z or 0) - (b.z or 0)
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Util.Today()
    return os.date('%Y%m%d')
end
