Banking = { name = nil }

if not IsDuplicityVersion() or not Config then return end

local SUPPORTED = {
    'Renewed-Banking', 'qb-banking', 'okokBanking', 'tgg-banking', 'wasabi_banking', 'fd_banking', 'qb-management',
}

Banking.supported = SUPPORTED

function Banking.Detect()
    local forced = Config.Bridges and Config.Bridges.banking or 'auto'
    if forced == 'none' then
        Banking.name = nil
    elseif forced ~= 'auto' then
        Banking.name = forced
    else
        Banking.name = nil
        for _, resource in ipairs(SUPPORTED) do
            if GetResourceState(resource) == 'started' then Banking.name = resource break end
        end
    end
    return Banking.name
end

local function ready()
    if not Banking.name then Banking.Detect() end
    return Banking.name ~= nil
end

Banking.Ready = ready
Banking.Detect()

AddEventHandler('onResourceStart', function(resource)
    if Banking.name then return end
    for _, name in ipairs(SUPPORTED) do
        if name == resource then
            Banking.Detect()
            if Banking.name then print(('^2[XS-RestaurantSystem]^0 banking found: %s.'):format(Banking.name)) end
            return
        end
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Banking.name and (Config.Bridges.banking or 'auto') == 'auto' then Banking.Detect() end
end)

local function ensure(name)
    if Banking.name == 'Renewed-Banking' then
        if exports['Renewed-Banking']:getAccountMoney(name) == false then
            exports['Renewed-Banking']:CreateJobAccount({ name = name, label = name }, 0)
        end
    elseif Banking.name == 'qb-banking' then
        if not exports['qb-banking']:GetAccount(name) then
            exports['qb-banking']:CreateJobAccount(name, 0)
        end
    elseif Banking.name == 'tgg-banking' then
        if exports['tgg-banking']:GetSocietyAccountMoney(name) == nil then
            exports['tgg-banking']:CreateBusinessAccount(name, 0, name)
        end
    end
end

function Banking.Deposit(name, amount, note)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 or not ready() or not name or name == '' then return false end
    local ok, result = pcall(function()
        ensure(name)
        if Banking.name == 'Renewed-Banking' then
            return exports['Renewed-Banking']:addAccountMoney(name, amount)
        elseif Banking.name == 'qb-banking' then
            return exports['qb-banking']:AddMoney(name, amount, note)
        elseif Banking.name == 'okokBanking' then
            return exports.okokBanking:AddMoney(name, amount)
        elseif Banking.name == 'tgg-banking' then
            return exports['tgg-banking']:AddSocietyMoney(name, amount)
        elseif Banking.name == 'wasabi_banking' then
            return exports.wasabi_banking:AddMoney('society', name, amount)
        elseif Banking.name == 'fd_banking' then
            return exports.fd_banking:AddMoney(name, amount)
        elseif Banking.name == 'qb-management' then
            return exports['qb-management']:AddMoney(name, amount)
        end
    end)
    if not ok or result == false then
        print(('^3[XS-RestaurantSystem]^0 %s did not take $%d into "%s".'):format(Banking.name, amount, name))
        return false
    end
    return true
end

function Banking.Withdraw(name, amount, note)
    amount = math.floor(tonumber(amount) or 0)
    if amount <= 0 then return true end
    if not ready() or not name or name == '' then return false end
    local ok, result = pcall(function()
        ensure(name)
        if Banking.name == 'Renewed-Banking' then
            local have = exports['Renewed-Banking']:getAccountMoney(name)
            if type(have) == 'number' and have < amount then return false end
            return exports['Renewed-Banking']:removeAccountMoney(name, amount)
        elseif Banking.name == 'qb-banking' then
            local have = exports['qb-banking']:GetAccountBalance(name)
            if type(have) == 'number' and have < amount then return false end
            return exports['qb-banking']:RemoveMoney(name, amount, note)
        elseif Banking.name == 'okokBanking' then
            return exports.okokBanking:RemoveMoney(name, amount)
        elseif Banking.name == 'tgg-banking' then
            return exports['tgg-banking']:RemoveSocietyMoney(name, amount)
        elseif Banking.name == 'wasabi_banking' then
            return exports.wasabi_banking:RemoveMoney('society', name, amount)
        elseif Banking.name == 'fd_banking' then
            return exports.fd_banking:RemoveMoney(name, amount)
        elseif Banking.name == 'qb-management' then
            return exports['qb-management']:RemoveMoney(name, amount)
        end
    end)
    if not ok or result == false then
        print(('^3[XS-RestaurantSystem]^0 %s did not take $%d out of "%s".'):format(Banking.name, amount, name))
        return false
    end
    return true
end

function Banking.Balance(name)
    if not ready() or not name or name == '' then return nil end
    local ok, result = pcall(function()
        if Banking.name == 'Renewed-Banking' then
            return exports['Renewed-Banking']:getAccountMoney(name)
        elseif Banking.name == 'qb-banking' then
            return exports['qb-banking']:GetAccountBalance(name)
        elseif Banking.name == 'okokBanking' then
            return exports.okokBanking:GetAccount(name)
        elseif Banking.name == 'tgg-banking' then
            return exports['tgg-banking']:GetSocietyAccountMoney(name)
        elseif Banking.name == 'wasabi_banking' then
            return exports.wasabi_banking:GetAccountBalance(name, 'society')
        elseif Banking.name == 'fd_banking' then
            local acc = exports.fd_banking:GetAccount(name)
            if type(acc) == 'table' then return acc.balance or acc.amount end
            return acc
        elseif Banking.name == 'qb-management' then
            return exports['qb-management']:GetAccount(name)
        end
    end)
    if not ok then return nil end
    return tonumber(result)
end
