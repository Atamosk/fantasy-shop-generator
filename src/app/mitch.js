const spells = require("./spells");
const scrolls = require("./scrolls");

const uniqueSpells = spells.buildSpellList(spells.dndSpells);
const scrollList = scrolls.buildScrollList(uniqueSpells);

const filteredScrolls = scrolls.filterScrolls(scrollList, { maxPrice: 100, school: "Evocation" });

console.log("xyz");
