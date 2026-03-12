const spells = require("./spells");

const uniqueSpells = spells.buildSpellList(spells.dndSpells);
console.log(uniqueSpells);