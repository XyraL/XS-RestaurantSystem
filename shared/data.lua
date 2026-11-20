Data = {}

Data.Stations = {
    { id = 'grill', icon = 'flame', prop = 'prop_griddle_01', scenario = 'PROP_HUMAN_BBQ', game = 'timing' },
    { id = 'fryer', icon = 'fryer', prop = 'prop_chip_fryer', scenario = 'PROP_HUMAN_BBQ', game = 'heat' },
    { id = 'oven', icon = 'oven', prop = 'prop_cooker_03', scenario = 'PROP_HUMAN_BBQ', game = 'heat' },
    { id = 'pizza', icon = 'pizza', prop = 'prop_pizza_oven_01', scenario = 'PROP_HUMAN_BBQ', game = 'timing' },
    { id = 'prep', icon = 'knife', prop = 'v_res_mchopboard', scenario = 'PROP_HUMAN_BBQ', game = 'stack' },
    { id = 'coffee', icon = 'coffee', prop = 'prop_coffee_mac_02', scenario = 'PROP_HUMAN_PARKING_METER', game = 'pour' },
    { id = 'drinks', icon = 'cup', prop = 'prop_juice_dispenser', scenario = 'PROP_HUMAN_PARKING_METER', game = 'pour' },
    { id = 'beer', icon = 'beer', prop = 'prop_bar_pump_01', scenario = 'PROP_HUMAN_PARKING_METER', game = 'pour' },
    { id = 'bar', icon = 'cocktail', prop = '', scenario = 'PROP_HUMAN_PARKING_METER', game = 'stir' },
}

Data.Games = { 'timer', 'timing', 'pour', 'keys', 'stir', 'stack', 'heat' }
Data.Levels = { 'easy', 'normal', 'hard' }

Data.Register = { prop = 'prop_till_01' }
Data.Speaker = { prop = 'prop_parknmeter_01' }
Data.Office = { prop = 'prop_laptop_01a' }

Data.Seats = {
    { id = 'chair', scenario = 'PROP_HUMAN_SEAT_CHAIR_MP_PLAYER', height = 0.5 },
    { id = 'table', scenario = 'PROP_HUMAN_SEAT_CHAIR_FOOD', height = 0.5 },
    { id = 'stool', scenario = 'PROP_HUMAN_SEAT_BAR', height = 0.75 },
    { id = 'bench', scenario = 'PROP_HUMAN_SEAT_BENCH', height = 0.5 },
    { id = 'armchair', scenario = 'PROP_HUMAN_SEAT_ARMCHAIR', height = 0.45 },
}

Data.Styles = {
    { id = 'burger', theme = 'modern', icon = 'burger', accent = '#ff7a1a', accent2 = '#ffd23f', sprite = 98, colour = 47, stations = { 'grill', 'fryer', 'prep', 'drinks' }, categories = { 'Burgers', 'Sides', 'Drinks', 'Desserts' } },
    { id = 'pizza', theme = 'pizza', icon = 'pizza', accent = '#e63946', accent2 = '#f4a261', sprite = 889, colour = 1, stations = { 'prep', 'pizza', 'drinks' }, categories = { 'Pizza', 'Sides', 'Drinks', 'Desserts' } },
    { id = 'cafe', theme = 'coffee', icon = 'coffee', accent = '#c8874b', accent2 = '#f3e1c7', sprite = 117, colour = 21, stations = { 'coffee', 'oven', 'prep' }, categories = { 'Coffee', 'Tea', 'Bakery', 'Food' } },
    { id = 'bar', theme = 'pub', icon = 'beer', accent = '#d4a017', accent2 = '#9b2c2c', sprite = 93, colour = 46, stations = { 'beer', 'bar', 'drinks' }, categories = { 'Beer', 'Cocktails', 'Spirits', 'Snacks' } },
    { id = 'diner', theme = 'diner', icon = 'diner', accent = '#e5383b', accent2 = '#4cc9f0', sprite = 117, colour = 1, stations = { 'grill', 'fryer', 'oven', 'coffee', 'drinks' }, categories = { 'Breakfast', 'Mains', 'Sides', 'Drinks', 'Desserts' } },
    { id = 'taco', theme = 'ticket', icon = 'taco', accent = '#2a9d8f', accent2 = '#e9c46a', sprite = 87, colour = 2, stations = { 'grill', 'prep', 'drinks' }, categories = { 'Tacos', 'Burritos', 'Sides', 'Drinks' } },
    { id = 'noodle', theme = 'sushi', icon = 'bowl', accent = '#ef476f', accent2 = '#ffd166', sprite = 117, colour = 48, stations = { 'prep', 'grill', 'drinks' }, categories = { 'Noodles', 'Sushi', 'Sides', 'Drinks' } },
    { id = 'bakery', theme = 'coffee', icon = 'cake', accent = '#f28fad', accent2 = '#8d5524', sprite = 117, colour = 8, stations = { 'oven', 'prep', 'coffee' }, categories = { 'Bread', 'Pastries', 'Cakes', 'Drinks' } },
    { id = 'icecream', theme = 'diner', icon = 'icecream', accent = '#5ec8e8', accent2 = '#f7aef8', sprite = 117, colour = 3, stations = { 'prep', 'drinks' }, categories = { 'Ice cream', 'Shakes', 'Toppings' } },
    { id = 'club', theme = 'neon', icon = 'cocktail', accent = '#9d4edd', accent2 = '#ff4fd8', sprite = 93, colour = 27, stations = { 'bar', 'beer', 'drinks' }, categories = { 'Cocktails', 'Shots', 'Beer', 'Soft drinks' } },
    { id = 'custom', theme = 'modern', icon = 'store', accent = '#ff7849', accent2 = '#ffc24b', sprite = 117, colour = 47, stations = {}, categories = { 'Food', 'Drinks' } },
}

Data.Themes = {
    { id = 'modern' },
    { id = 'ticket', accent = '#d6332a', accent2 = '#1f5fa8' },
    { id = 'pizza', accent = '#c8102e', accent2 = '#2e7d32' },
    { id = 'coffee', accent = '#c8874b', accent2 = '#e9d8bd' },
    { id = 'diner', accent = '#d62828', accent2 = '#1fb5a8' },
    { id = 'pub', accent = '#c9a24d', accent2 = '#b5453a' },
    { id = 'sushi', accent = '#c8352c', accent2 = '#3f6e4a' },
    { id = 'neon', accent = '#ff2bd6', accent2 = '#22e6ff' },
}

Data.byStation, Data.byStyle, Data.bySeat, Data.byTheme = {}, {}, {}, {}
for _, s in ipairs(Data.Stations) do Data.byStation[s.id] = s end
for _, s in ipairs(Data.Seats) do Data.bySeat[s.id] = s end
for _, s in ipairs(Data.Styles) do Data.byStyle[s.id] = s end
for _, s in ipairs(Data.Themes) do Data.byTheme[s.id] = s end

Data.PointKinds = { 'register', 'kitchen', 'pickup', 'counter', 'storage', 'station', 'menuboard', 'kiosk', 'speaker', 'seat', 'office', 'dock' }
