Config = {}

Config.Locale = 'en'
Config.Debug = false

Config.Bridges = {
    framework = 'auto', -- 'auto' | 'qbox' | 'qbcore'
    inventory = 'auto', -- 'auto' | 'ox_inventory' | 'qb-inventory' | 'qs-inventory' | 'ps-inventory' | 'codem-inventory' | 'core_inventory'
    target = 'auto',    -- 'auto' | 'ox_target' | 'qb-target' | 'sleepless_interact' | 'interact' | 'qtarget' | 'none' (E prompts)
    banking = 'auto',   -- 'auto' | 'Renewed-Banking' | 'qb-banking' | 'okokBanking' | 'tgg-banking' | 'wasabi_banking' | 'fd_banking' | 'qb-management' | 'none'
    phone = 'auto',     -- 'auto' | 'XS-Phone' | 'lb-phone' | 'qs-smartphone-pro' | 'qs-smartphone' | 'gksphone' | 'okokPhone' | 'yseries' | 'none'
    bossmenu = 'auto',  -- 'auto' | 'qbx_management' | 'qb-management' | 'none'
}

Config.Admin = {
    acePermission = 'xs.restaurant.admin',
    groups = { 'admin', 'god' },
    licenses = {},
}

Config.Commands = {
    builder = 'restaurantbuilder',
    diag = 'restaurantdiag',
}

Config.Staff = {
    needDuty = true,         -- staff have to be on duty to use the register, stations, kitchen and counter
    storageNeedsDuty = false,
}

Config.Orders = {
    customerRange = 6.0,     -- how close the customer has to stand to the register
    payTimeout = 45,         -- seconds the customer has to pay
    card = true,             -- customers can pay by card (bank)
    cash = true,             -- customers can pay cash
    onTheHouse = true,       -- bosses and owners can ring up an order for free
    businessPct = 100,       -- share of each sale that goes into the business account
    cashierPct = 0,          -- share of each sale paid to whoever rang it up
    maxLines = 20,
    maxQuantity = 20,
    maxOpen = 40,            -- open orders per business at once
    lateMinutes = 8,         -- a ticket turns red after this long
    readyMinutes = 20,       -- a ready order leaves the pickup screen after this long
    handOver = true,         -- the pickup counter moves the food from staff to the customer
    handOverRange = 5.0,
    refundOnCancel = true,   -- cancelling a paid order gives the money back out of the business account
    resetNumbers = 'daily',  -- 'daily' | 'never'
    names = true,            -- show the name on the order on the pickup screen
    notifyReady = true,      -- tell the customer when their order is ready
}

Config.Cooking = {
    minigames = true,        -- false: every step is a plain timer
    difficulty = 1.0,        -- 0.5 is easy, 2.0 is hard
    needIngredients = true,
    failLoses = true,        -- a failed cook still uses up the ingredients
    maxBatch = 5,            -- how many of a dish you can make in one go
    range = 2.5,
    animations = true,
}

Config.Screens = {
    enabled = true,
    drawDistance = 18.0,
    maxLive = 6,
    boardSeconds = 8,        -- how long a menu board shows each page when the menu does not fit
}

Config.Kiosk = {
    enabled = true,          -- self-order kiosks only take orders while someone is working
    onePerPerson = true,     -- a customer can only have one open order at a time from a kiosk
}

Config.Drive = {
    enabled = true,
    voice = true,            -- the speaker connects the driver and the staff member through pma-voice
    range = 5.0,             -- how close the car has to be to the speaker
}

Config.Seats = {
    enabled = true,
}

Config.Supply = {
    enabled = true,
    mode = 'both',           -- 'delivery' (a van brings it to the back door) | 'pickup' (staff collect it at the warehouse) | 'both' (the boss picks)
    deliveryMinutes = 5,     -- how long a delivered order takes to arrive
    pickupMinutes = 2,       -- how long until a pickup order is ready at the warehouse
    expireMinutes = 60,      -- orders nobody collects are refunded to the business after this
    van = 'mule',            -- the delivery van parked at the back door
}

Config.Delivery = {
    enabled = true,          -- customers can order food to where they are from the phone app
    fee = 15,                -- added to every delivery, unless a business sets its own
    maxDistance = 2500.0,    -- how far from the business a delivery can go
    range = 6.0,             -- how close the driver has to get to hand it over
}

Config.Phone = {
    app = true,              -- the food ordering app on supported phones
    appName = 'Food Order',
    command = 'food',        -- opens the same app without a phone. Set to false to turn off
}

Config.Boss = {
    prices = true,           -- bosses can change prices from the office
    priceRangePct = 50,      -- how far up or down from the builder price they can go
    bank = true,             -- staff the builder allows can put money in and take it out of the business account from the office
    bankMax = 1000000,       -- most money moved in one go
}

Config.Logs = {
    sales = true,            -- the shared Discord webhook is the convar xs_restaurant_webhook in server.cfg
    refunds = true,
    supplies = true,
    deliveries = true,
    changes = true,
    bank = true,
}

Config.Props = {
    enabled = true,          -- spawn the register and station props placed in the builder
    range = 60.0,
}

Config.Blips = {
    enabled = true,
    whenClosed = 'grey',     -- 'grey' | 'hide' | 'same' while nobody is on duty
}

Config.Images = {
    items = 'auto',          -- 'auto' finds your inventory's item pictures, or a folder like 'nui://my_images/' or a pattern with %s
}

Config.Builder = {
    cameraSpeed = { normal = 6.0, fast = 18.0, slow = 1.5 },
    showExisting = true,
}
