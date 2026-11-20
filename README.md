<h1 align="center">XS-RestaurantSystem</h1>

<p align="center">Restaurants, bars and cafes for <strong>QBox</strong> and <strong>QBCore</strong>, all built in game.</p>

---

XS-RestaurantSystem runs every food and drink business on your server. Staff build each place from an in-game builder, employees ring up orders at the register, the customer pays on their own screen, the kitchen sees the ticket on the wall, cooks make the food at stations with a minigame, and the order is handed over at the pickup counter. Customers can also order from their phone for pickup or delivery, and the boss runs the place from an office laptop.

Everything is done by players. There are no NPC customers.

## Features

- QBox and QBCore support
- In-game builder with an overview of what still needs doing, Ctrl+K search and every setting live, no restart
- 11 styles to start from: burger joint, pizza place, cafe, bar, diner, taco spot, noodle house, bakery, ice cream shop, nightclub bar or your own
- Each business uses one of your server's jobs. Hiring, ranks and pay stay in your boss menu script
- Staff can hand a business to an owner, who can always use it and ring up free orders
- Your own colours and logo for every business, on every screen customers see
- 8 themes to pick from for each business: Modern, Order Ticket, Pizzeria, Coffee House, Diner, Pub, Sushi Bar and Neon Night. A theme changes the register, pay prompt, kitchen, pickup counter, cooking station, kiosk, office and the screens on the wall, and still uses the business colours
- See any screen full size from the builder, with that business's own menu, before you save
- Map blip with any icon, colour and size, grey or hidden while nobody is working
- Registers: pick items from the menu, type a name for the order, and the customer standing at the counter pays by card or cash on their own screen
- Money goes into the business account through your banking script, with an optional cut for whoever rang it up
- Kitchen screens on the wall show every ticket with its age, turning red when it runs late
- Pickup screens show customers which numbers are being made and which are ready
- Staff tick off lines, mark orders ready and cancel them with a refund
- Customers are told when their order is ready
- Pickup counter hands the food from staff to the customer
- Cooking stations: grill, fryer, oven, pizza oven, prep board, coffee machine, drinks machine, beer tap and cocktail station, each with its own prop
- Registers, stations, the office and speakers can be placed with or without a prop. Press H while placing, or snap onto something the map already has
- Recipes: pick the dish, the ingredients, the station and up to 6 steps. Recipes can feed each other, like a patty from the grill going into a burger at the prep board
- 7 cooking minigames: timer, hit the zone, pour to the line, key combo, stir, build in order and keep the heat. Or turn them off and every step is a timer
- Make up to 5 at once
- Shared storage for the staff
- Menu boards on the wall with pictures and prices, showing all of the menu or just the sections you pick, and flipping pages when it does not fit
- Staff mark items sold out from the register. The menu boards, kiosks and register all show it straight away
- Self-order kiosks where customers order and pay themselves, but only while someone is working, with one open order per person
- Drive-thru: a car pulls up to the speaker and presses E, staff answer from a drive-thru register, and with pma-voice the two of them talk over an intercom. The driver pays from the car and picks up at the window
- Tickets show whether an order came from the counter, the drive-thru or a kiosk
- Seats: chairs, tables, bar stools, benches and armchairs anyone can sit on, placed one by one or several in a row
- Food app on the phone: customers see who is open, order ahead and pay by card, then pick up or get it delivered. Works as a phone app on XS-Phone, lb-phone, qs-smartphone, qs-smartphone-pro, gksphone, okokPhone and yseries, and as `/food` on any server
- Deliveries are done by staff: take the order from the pickup counter, follow the GPS to the customer and hand it over
- Office laptop for the boss: sales by day, best sellers, staff, where orders come from, recent orders, prices, sold out, phone and delivery switches, and a button to your boss menu
- Bosses can change prices within a range the server sets
- Business account in the office: put money in or take it out as cash or from your bank. The builder sets which ranks can do each, and bosses and owners always can
- Supply orders from the office, paid from the business account. A van parks at the back door for staff to unload, or staff collect it from a supply warehouse. The server picks which, or lets the boss choose
- Discord logs for sales, refunds, supplies, deliveries and price changes, per business or one webhook for the whole server
- Food and drinks are your own inventory items, pictures and all
- `/restaurantdiag` prints what it found and what each business still needs

## Requirements

- QBox or QBCore
- [ox_lib](https://github.com/overextended/ox_lib)
- [oxmysql](https://github.com/overextended/oxmysql)

Optional:

- A target script (ox_target, qb-target, sleepless_interact, interact or qtarget). Without one, every point uses E prompts
- A banking script with business accounts, so sales go somewhere: Renewed-Banking, qb-banking, okokBanking, tgg-banking, wasabi_banking, fd_banking or qb-management. The money goes into the account named after the business job. The order in server.cfg does not matter, and `/restaurantdiag` shows which one it found
- [pma-voice](https://github.com/AvarianKnight/pma-voice) for the drive-thru intercom. Without it the drive-thru still works, they just talk by other means
- A boss menu script (qbx_management or qb-management) for the office's boss menu button
- A phone for the food app. Without one, players use `/food`

## Installation

1. Put `XS-RestaurantSystem` in your resources folder.
2. Add it to `server.cfg` after its dependencies:

   ```cfg
   ensure ox_lib
   ensure oxmysql
   ensure XS-RestaurantSystem
   ```

3. Give your staff the builder:

   ```cfg
   add_ace group.admin xs.restaurant.admin allow
   ```

4. For Discord logs, add your webhook to `server.cfg`. It stays on the server, players never see it:

   ```cfg
   set xs_restaurant_webhook "https://discord.com/api/webhooks/..."
   ```

5. Restart the server. The tables make themselves on the first start.
6. Join, type `/restaurantbuilder`, and build your first place.

## Setting up a business

1. **Add the items.** Food, drinks and ingredients are normal inventory items. Add them to your inventory the usual way, with their pictures and whatever eating or drinking effect you want.
2. **Make a job** for the business in your framework, with a boss grade.
3. **Open the builder** with `/restaurantbuilder` and press New business. Pick a style.
4. **General:** pick the job, and an owner if there is one.
5. **Look:** pick a theme, the colours and a logo. The See it full size buttons open the real register, kitchen, kiosk and wall screens with this menu. Nothing is saved or sold, and Esc takes you back.
6. **Places:** place the register, the stations, the kitchen screen, the pickup counter, and a pickup screen and storage if you want them. Out front you can add menu boards, kiosks, a drive-thru speaker and seats. For a drive-thru, switch one register to drive-thru with the car button next to it. Add an office laptop for the boss and a back door where the supply van parks.
7. **Menu:** add the items it sells and their prices.
8. **Recipes:** say how each dish is made. Items without a recipe can still be sold, straight from storage.
9. **Business:** add the supplies the boss can order and their prices, switch phone orders and deliveries on or off, pick which ranks can put money in and take it out of the business account, and add a webhook if this place has its own log channel.
10. **Save.** It is live for everyone straight away.

To let staff collect supplies, set the supply warehouse once on the builder's Overview page. It is one spot for the whole server.

## Commands

| Command | Who | What |
| --- | --- | --- |
| `/restaurantbuilder` | Staff | Opens the builder |
| `/restaurantdiag` | Anyone | Prints what XS-RestaurantSystem found, what each business still needs, and your own job and duty |
| `/food` | Anyone | Opens the food app without a phone |
| `/canceldelivery` | Staff | Stops the delivery you are driving so someone else can take it |

## Works with

| | |
| --- | --- |
| Frameworks | QBox, QBCore |
| Inventories | ox_inventory, qb-inventory, qs-inventory, ps-inventory, codem-inventory, core_inventory |
| Targets | ox_target, qb-target, sleepless_interact, interact, qtarget, or E prompts |
| Banking | Renewed-Banking, qb-banking, okokBanking, tgg-banking, wasabi_banking, fd_banking, qb-management |
| Phones | XS-Phone, lb-phone, qs-smartphone, qs-smartphone-pro, gksphone, okokPhone, yseries, plus texts on npwd, high-phone, roadphone, 17mov_Phone and qb-phone |
| Boss menus | qbx_management, qb-management |

## Configuration

Everything is in `config.lua`, and almost all of it can also be changed in game from the builder's Settings page. Those changes are live for everyone and override `config.lua`.

Text is in `locales/en.lua`.

## Support

Join the [Discord](https://discord.gg/XRURAw4TM2) for help.

## License

See [LICENSE](LICENSE).
