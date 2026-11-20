Seats = { taken = {}, by = {} }

local function publish()
    local out = {}
    for key in pairs(Seats.taken) do out[key] = true end
    GlobalState['xsr:seats'] = out
end

function Seats.Sit(src, bizId, seatId)
    if not Config.Seats.enabled then return false, Text('err_seats_off') end
    local b = Biz.Get(bizId)
    if not b or not b.data.enabled then return false, Text('err_no_business') end
    local seat = Biz.Point(b, 'seat', seatId)
    if not seat or not Biz.Near(src, seat, 3.0) then return false, Text('err_too_far') end
    local key = ('%d:%s'):format(b.id, seat.id)
    local holder = Seats.taken[key]
    if holder and holder ~= src and GetPlayerName(holder) then return false, Text('err_seat_taken') end
    Seats.Stand(src, true)
    Seats.taken[key] = src
    Seats.by[src] = key
    publish()
    return true, { key = key }
end

function Seats.Stand(src, quiet)
    local key = Seats.by[src]
    if not key then return true end
    Seats.by[src] = nil
    if Seats.taken[key] == src then Seats.taken[key] = nil end
    if not quiet then publish() end
    return true
end

function Seats.Clear(bizId)
    local prefix = tostring(bizId) .. ':'
    for key, src in pairs(Seats.taken) do
        if key:sub(1, #prefix) == prefix then
            Seats.taken[key] = nil
            Seats.by[src] = nil
        end
    end
    publish()
end
