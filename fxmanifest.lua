fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'XS-RestaurantSystem'
author 'XyraL'
description 'Restaurants, bars and cafes for Qbox and QBCore, built in game: registers, kitchen and pickup screens, cooking stations with minigames, and payments into the business account.'
version '1.0.0'

dependencies {
    'ox_lib',
    'oxmysql',
}

shared_scripts {
    '@ox_lib/init.lua',
    'config.lua',
    'locales/en.lua',
    'shared/locale.lua',
    'shared/util.lua',
    'shared/data.lua',
    'shared/settings.lua',
}

client_scripts {
    'bridge/framework.lua',
    'bridge/target.lua',
    'bridge/inventory.lua',
    'bridge/phone.lua',
    'client/ui.lua',
    'client/settings.lua',
    'client/main.lua',
    'client/placement.lua',
    'client/points.lua',
    'client/screens.lua',
    'client/register.lua',
    'client/pay.lua',
    'client/kitchen.lua',
    'client/cooking.lua',
    'client/kiosk.lua',
    'client/drive.lua',
    'client/seats.lua',
    'client/phone.lua',
    'client/office.lua',
    'client/supply.lua',
    'client/delivery.lua',
    'client/builder.lua',
}

server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'bridge/framework.lua',
    'bridge/inventory.lua',
    'bridge/banking.lua',
    'bridge/phone.lua',
    'server/db.lua',
    'server/logs.lua',
    'server/settings.lua',
    'server/businesses.lua',
    'server/orders.lua',
    'server/cooking.lua',
    'server/drive.lua',
    'server/seats.lua',
    'server/supply.lua',
    'server/phone.lua',
    'server/boss.lua',
    'server/builder.lua',
    'server/main.lua',
}

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/css/*.css',
    'html/js/*.js',
    'html/dui/*.html',
    'html/dui/*.css',
    'html/dui/*.js',
    'html/phone/*.html',
    'html/phone/*.css',
    'html/phone/*.js',
    'html/phone/*.png',
}
