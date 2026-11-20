Db = { ready = false }

local TABLES = {
    [[CREATE TABLE IF NOT EXISTS `xs_rest_businesses` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `data` LONGTEXT NOT NULL,
        `created_at` INT NOT NULL DEFAULT 0,
        `updated_at` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
    [[CREATE TABLE IF NOT EXISTS `xs_rest_orders` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `business_id` INT NOT NULL,
        `number` INT NOT NULL DEFAULT 0,
        `status` VARCHAR(16) NOT NULL DEFAULT 'new',
        `customer` VARCHAR(64) NOT NULL DEFAULT '',
        `customer_name` VARCHAR(100) NOT NULL DEFAULT '',
        `name` VARCHAR(40) NOT NULL DEFAULT '',
        `lines` LONGTEXT NULL,
        `total` INT NOT NULL DEFAULT 0,
        `paid_with` VARCHAR(8) NOT NULL DEFAULT '',
        `via` VARCHAR(8) NOT NULL DEFAULT 'counter',
        `extra` LONGTEXT NULL,
        `staff` VARCHAR(64) NOT NULL DEFAULT '',
        `staff_name` VARCHAR(100) NOT NULL DEFAULT '',
        `created_at` INT NOT NULL DEFAULT 0,
        `ready_at` INT NOT NULL DEFAULT 0,
        `done_at` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        KEY `xsr_ord_biz` (`business_id`, `status`),
        KEY `xsr_ord_at` (`created_at`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
    [[CREATE TABLE IF NOT EXISTS `xs_rest_supply` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `business_id` INT NOT NULL,
        `lines` LONGTEXT NULL,
        `total` INT NOT NULL DEFAULT 0,
        `mode` VARCHAR(10) NOT NULL DEFAULT 'delivery',
        `status` VARCHAR(12) NOT NULL DEFAULT 'waiting',
        `by_name` VARCHAR(100) NOT NULL DEFAULT '',
        `created_at` INT NOT NULL DEFAULT 0,
        `ready_at` INT NOT NULL DEFAULT 0,
        `done_at` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        KEY `xsr_sup_biz` (`business_id`, `status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
    [[CREATE TABLE IF NOT EXISTS `xs_rest_bank` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `business_id` INT NOT NULL,
        `kind` VARCHAR(10) NOT NULL DEFAULT 'deposit',
        `amount` INT NOT NULL DEFAULT 0,
        `account` VARCHAR(10) NOT NULL DEFAULT 'cash',
        `by_name` VARCHAR(100) NOT NULL DEFAULT '',
        `created_at` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        KEY `xsr_bank_biz` (`business_id`)
    )]],
    [[CREATE TABLE IF NOT EXISTS `xs_rest_settings` (
        `name` VARCHAR(64) NOT NULL,
        `data` LONGTEXT NOT NULL,
        PRIMARY KEY (`name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4]],
}

function Db.Setup()
    for _, statement in ipairs(TABLES) do
        local ok, err = pcall(MySQL.query.await, statement)
        if not ok then
            print(('^1[XS-RestaurantSystem]^0 could not create a table: %s'):format(tostring(err)))
            return false
        end
    end
    local columns = {
        { 'via', "ALTER TABLE `xs_rest_orders` ADD COLUMN `via` VARCHAR(8) NOT NULL DEFAULT 'counter' AFTER `paid_with`" },
        { 'extra', "ALTER TABLE `xs_rest_orders` ADD COLUMN `extra` LONGTEXT NULL AFTER `via`" },
    }
    for _, col in ipairs(columns) do
        local ok, has = pcall(MySQL.scalar.await, "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'xs_rest_orders' AND COLUMN_NAME = ?", { col[1] })
        if ok and tonumber(has) == 0 then pcall(MySQL.query.await, col[2]) end
    end
    Db.ready = true
    return true
end

function Db.Json(value)
    local ok, out = pcall(json.encode, value)
    return ok and out or '{}'
end

function Db.Decode(value, fallback)
    if type(value) ~= 'string' or value == '' then return fallback end
    local ok, out = pcall(json.decode, value)
    if ok and out ~= nil then return out end
    return fallback
end
