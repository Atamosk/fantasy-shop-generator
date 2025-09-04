const alasql = require('alasql');
const itemList = require("../data/items.json");

const dnd_items = require('dnd-data').items;
const dnd_spells = require('dnd-data').spells;

// Items
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

console.log("Distinct dnd-items Item Types")
console.log(alasql("SELECT DISTINCT properties->('Item Type') FROM ?", [dnd_items]));

console.log("dnd-items Potions")
console.log(alasql("SELECT * FROM ? WHERE properties->('Item Type') = 'Potion'", [dnd_items]));

// Spells
console.log("1 Spell")
console.log(alasql("SELECT * FROM ? LIMIT 1", [dnd_spells]));

console.log("All Schools")
console.log(alasql("SELECT DISTINCT properties->School FROM ?", [dnd_spells]));

console.log("Conjuration Spells")
console.log(alasql("SELECT * FROM ? WHERE LOWER(properties->School) LIKE '%conjuration%' and properties->Level = 3", [dnd_spells]));

console.log("DND Book")
console.log(alasql("SELECT DISTINCT book FROM ?", [dnd_spells]));

console.log("Wizards Books Spells")
console.log(alasql("SELECT COUNT(*) FROM ? WHERE LOWER(properties->School) LIKE '%conjuration%' AND properties->Level = 3 AND publisher = 'Wizards of the Coast'", [dnd_spells]));

console.log("PHB Spells")
console.log(alasql("SELECT * FROM ? WHERE LOWER(properties->School) LIKE '%conjuration%' AND properties->Level = 3 AND book LIKE 'Player''s Handbook%'", [dnd_spells]));

// How to build a unique spell list from multiple books:
//   - Start with an empty collection
//   - Beginning with the lowest priority book, add spells to the collection, indexed by spell name
//   - Add spells from higher priority books to the collection, replacing spells with the same name from lower prioroty books
//   - Continue until finished addiing spells from the highest priority book

console.log("Parameterized Query")
// I've hacked on this and can't get it to work.
// const sql = "SELECT * FROM ? WHERE LOWER(properties->School) LIKE '%?%' AND properties->Level = ? AND publisher = '?'"
// console.log(alasql.exec(sql, [spells, school, level, publisher]));
const spells = dnd_spells
const school = "conjuration";
const level = 3;
const publisher = "Wizards of the Coast"
const sql = `
    SELECT COUNT(*) FROM ? WHERE
    LOWER(properties->School) LIKE '%${school}%' AND
    properties->Level = ${level} AND
    publisher = '${publisher}'
`
console.log(alasql.exec(sql, [spells]));
console.log("Done")
