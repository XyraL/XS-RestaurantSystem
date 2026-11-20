Pay = { current = nil }

function Pay.Close()
    Pay.current = nil
    UI.Send('pay', 'close', {})
    UI.Focus('pay', false)
end

RegisterNetEvent('XS-RestaurantSystem:client:pay', function(data)
    if type(data) ~= 'table' or not data.id then return end
    Pay.current = data.id
    UI.Send('pay', 'open', data)
    UI.Focus('pay', true)
end)

RegisterNetEvent('XS-RestaurantSystem:client:payClose', function(id)
    if Pay.current and Pay.current == id then
        Pay.Close()
        Util.Notify(Text('pay_cancelled'), 'inform')
    end
end)

UI.Handle('pay:respond', function(p)
    p = type(p) == 'table' and p or {}
    if not Pay.current or p.id ~= Pay.current then return false, Text('err_pay_gone') end
    local ok, res = Rest.Call('payRespond', p.id, p.method)
    if not ok then return false, res end
    Pay.Close()
    if res and res.number then
        Util.Notify(Text('paid_customer', { number = res.number, business = res.business or '' }), 'success')
    end
    return true, res
end)

UI.OnClose('pay', function()
    local id = Pay.current
    Pay.Close()
    if id then Rest.Call('payRespond', id, 'decline') end
end)
