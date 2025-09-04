const alasql = require('alasql');
const itemList = require("../data/items.json");

const dnd_items = require('dnd-data').items;

console.log("Unique Types")
console.log(alasql("SELECT DISTINCT type FROM ?", [itemList]));

console.log("Unique Base Items")
console.log(alasql("SELECT DISTINCT base_item FROM ?", [itemList]));

console.log("Potions")
console.log(alasql("SELECT * FROM ? WHERE base_item = 'Potion'", [itemList]));

console.log("Scrolls")
console.log(alasql("SELECT * FROM ? WHERE base_item = 'Scroll'", [itemList]));

console.log("1 Records")
console.log(alasql("SELECT *  FROM ? LIMIT 1", [dnd_items]));

console.log("Distinct dnd-items Item Types")
console.log(alasql("SELECT DISTINCT properties->('Item Type') FROM ?", [dnd_items]));
