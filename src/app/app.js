const alasql = require('alasql');
const itemList = require("../data/items.json");

var res = alasql("SELECT * FROM ? WHERE price <= '10'", [itemList]);

console.log(res);
