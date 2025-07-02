const alasql = require('alasql');
const itemList = require("../data/items.json");

let returnArray = [];
itemList.forEach(element => {
    if (element.type == "Combat")
    {
        returnArray.push(element.name);
    }
});

// SELECT item WHERE type = 'Combat';

console.log(returnArray);
